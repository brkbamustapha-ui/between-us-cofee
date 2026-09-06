'use client';

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import {
  ALL_ROOM_IMAGES,
  ROOM_SCENES,
  roomImage,
  type RoomScene,
} from './ambient-room';

/**
 * La salle en vraie 3D.
 *
 * Les mêmes panneaux que la version CSS, mais avec une position réelle dans
 * l'espace : le groupe s'incline vers le curseur, le brouillard efface les plus
 * lointains, et la profondeur devient une vraie parallaxe plutôt qu'une
 * simulation. Au changement de section, chaque emplacement fond de son ancienne
 * photo vers la nouvelle.
 *
 * Trois règles tiennent cette scène :
 *
 *  - elle ne bloque jamais la page — chargée après l'hydratation, et si une
 *    texture manque le panneau est simplement absent ;
 *  - elle ne consomme rien hors champ — le rendu s'arrête quand l'onglet passe
 *    en arrière-plan ;
 *  - elle reste derrière un voile : c'est une texture de fond, pas un sujet, et
 *    le contraste du texte ne dépend pas d'elle.
 */

/**
 * Placement des panneaux, accordé à la composition de la version CSS.
 *
 * Les opacités sont hautes parce que les textures arrivent déjà assombries :
 * les rabaisser au niveau des valeurs CSS reviendrait à assombrir deux fois, et
 * la salle disparaîtrait.
 */
const LAYOUT = [
  { position: [-4.6, 0.9, -7.5], rotation: 0.19, scale: 4.4, opacity: 1 },
  { position: [4.9, -0.6, -5.8], rotation: -0.23, scale: 4.0, opacity: 1 },
  { position: [-1.4, -3.4, -4.2], rotation: 0.1, scale: 3.7, opacity: 0.85 },
  { position: [2.2, 2.6, -2.6], rotation: -0.12, scale: 3.2, opacity: 0.6 },
] as const;

const INK = '#0a2b1e';

/** Ratio des panneaux préparés : portrait 700 × 1052. */
const PANEL_ASPECT = 700 / 1052;

/** Durée du fondu d'une scène à l'autre, en secondes. */
const CROSSFADE = 0.9;

function Panels({ scene }: { scene: RoomScene }) {
  const group = useRef<THREE.Group>(null);

  // Toutes les textures d'un coup, une seule fois. L'ensemble est borné (treize
  // fichiers, 421 Ko) et connu d'avance : les précharger évite tout à-coup au
  // moment où le visiteur passe d'une section à l'autre.
  const loaded = useLoader(THREE.TextureLoader, ALL_ROOM_IMAGES);

  const textures = useMemo(() => {
    const map = new Map<string, THREE.Texture>();
    ALL_ROOM_IMAGES.forEach((url, index) => {
      const texture = loaded[index];
      if (!texture) return;
      texture.colorSpace = THREE.SRGBColorSpace;
      // Les panneaux les plus inclinés seraient sinon crénelés en bord d'image.
      texture.anisotropy = 4;
      map.set(url, texture);
    });
    return map;
  }, [loaded]);

  // Three.js ne libère jamais la mémoire graphique tout seul : sans ces
  // `dispose`, les treize textures resteraient en VRAM pour toute la vie de
  // l'onglet. On vide aussi le cache du chargeur, sinon un remontage
  // récupérerait des textures déjà détruites.
  useEffect(
    () => () => {
      for (const texture of textures.values()) texture.dispose();
      useLoader.clear(THREE.TextureLoader, ALL_ROOM_IMAGES);
    },
    [textures],
  );

  // Scène sortante et progression du fondu. Des refs, pas de l'état : ces
  // valeurs changent à chaque image et ne doivent déclencher aucun rendu React.
  const from = useRef<RoomScene>(scene);
  const to = useRef<RoomScene>(scene);
  const mix = useRef(1);
  const materials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  if (to.current !== scene) {
    // Un changement en plein fondu repart de l'image affichée, pas du début :
    // sinon un défilement rapide ferait clignoter le décor.
    from.current = mix.current < 0.5 ? from.current : to.current;
    to.current = scene;
    mix.current = 0;
  }

  useFrame((state, delta) => {
    if (mix.current < 1) {
      mix.current = Math.min(1, mix.current + delta / CROSSFADE);
      const eased = mix.current * mix.current * (3 - 2 * mix.current);
      for (let slot = 0; slot < LAYOUT.length; slot++) {
        const outgoing = materials.current[slot * 2];
        const incoming = materials.current[slot * 2 + 1];
        const full = LAYOUT[slot]!.opacity;
        if (outgoing) outgoing.opacity = full * (1 - eased);
        if (incoming) incoming.opacity = full * eased;
      }
    }

    if (!group.current) return;
    const { pointer, clock } = state;

    // Le curseur incline le groupe entier. L'amplitude est petite : au-delà, le
    // fond attire l'œil au lieu de le laisser lire.
    const targetX = pointer.y * 0.06;
    const targetY = pointer.x * 0.1;

    // Amortissement dépendant du temps réel : le suivi garde la même douceur
    // que l'écran tourne à 60 ou à 120 Hz.
    const smoothing = 1 - Math.pow(0.0015, delta);
    group.current.rotation.x += (targetX - group.current.rotation.x) * smoothing;
    group.current.rotation.y += (targetY - group.current.rotation.y) * smoothing;

    // Respiration lente, indépendante du curseur : la scène reste vivante quand
    // personne ne bouge la souris, et sur écran tactile où il n'y en a pas.
    const time = clock.elapsedTime;
    group.current.position.y = Math.sin(time * 0.12) * 0.35;
    group.current.position.x = Math.cos(time * 0.09) * 0.25;
  });

  return (
    <group ref={group}>
      {LAYOUT.map((panel, slot) => {
        const width = panel.scale * PANEL_ASPECT;

        // Deux plans au même endroit : celui qui s'efface et celui qui arrive.
        return [from.current, to.current].map((which, layer) => {
          const texture = textures.get(roomImage(ROOM_SCENES[which][slot]!));
          if (!texture) return null;

          return (
            <mesh
              key={`${slot}-${layer}`}
              position={panel.position as unknown as THREE.Vector3Tuple}
              rotation={[0, panel.rotation, 0]}
            >
              <planeGeometry args={[width, panel.scale]} />
              {/* Les textures arrivent déjà traitées : désaturées, assombries,
                  et leur alpha porte le fondu des bords. Rien à corriger ici —
                  pas de teinte, pas de masque à générer. */}
              <meshBasicMaterial
                ref={(material) => {
                  materials.current[slot * 2 + layer] = material;
                }}
                map={texture}
                transparent
                opacity={layer === 0 ? panel.opacity * (1 - mix.current) : panel.opacity * mix.current}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          );
        });
      })}
    </group>
  );
}

/** Coupe le rendu quand l'onglet n'est pas visible : zéro batterie en fond. */
function PauseWhenHidden() {
  const setFrameloop = useThree((state) => state.setFrameloop);

  useEffect(() => {
    const onVisibility = () =>
      setFrameloop(document.hidden ? 'never' : 'always');

    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [setFrameloop]);

  return null;
}

export default function AmbientScene({ scene }: { scene: RoomScene }) {
  // Une texture peut manquer (fichier renommé, réseau coupé) : `useLoader` lève
  // alors pendant le rendu. Sans ce garde-fou l'erreur remonterait jusqu'à la
  // page. Le fond CSS reste dessous et suffit largement.
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 6], fov: 55 }}
        onCreated={({ scene: three }) => {
          // Le brouillard efface les panneaux lointains dans le vert du site :
          // c'est lui qui donne la profondeur, plus que les positions. Il
          // commence au-delà du plan le plus proche, sinon il mangeait déjà
          // celui-là.
          three.fog = new THREE.Fog(INK, 10, 26);
        }}
      >
        <PauseWhenHidden />
        <PanelsBoundary onError={() => setFailed(true)}>
          {/* `useLoader` suspend le temps du téléchargement des textures : sans
              cette frontière, la suspension remonterait hors du canvas. */}
          <Suspense fallback={null}>
            <Panels scene={scene} />
          </Suspense>
        </PanelsBoundary>
      </Canvas>
    </div>
  );
}

/**
 * Frontière d'erreur autour des panneaux.
 *
 * React ne propose pas d'équivalent en composant de fonction : la classe est la
 * seule forme qui capte les erreurs de rendu de ses enfants, chargement des
 * textures compris.
 */
class PanelsBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { crashed: boolean }
> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.crashed ? null : this.props.children;
  }
}
