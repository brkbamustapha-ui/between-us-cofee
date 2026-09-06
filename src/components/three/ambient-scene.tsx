'use client';

import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { ROOM_PANELS } from './ambient-room';

/**
 * La salle en vraie 3D.
 *
 * Les mêmes panneaux que la version CSS, mais avec une position réelle dans
 * l'espace : le groupe s'incline vers le curseur, le brouillard efface les plus
 * lointains, et la profondeur devient une vraie parallaxe plutôt qu'une
 * simulation.
 *
 * Trois règles tiennent cette scène :
 *
 *  - elle ne bloque jamais la page — chargée après l'hydratation, et si une
 *    texture manque le panneau est simplement absent ;
 *  - elle ne consomme rien hors champ — le rendu s'arrête quand l'onglet passe
 *    en arrière-plan ;
 *  - elle reste derrière un voile — c'est une texture de fond, pas un sujet, et
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

/** Ratio des clichés : portrait 852 × 1280. */
const PANEL_ASPECT = 852 / 1280;

function Panels() {
  const group = useRef<THREE.Group>(null);
  const textures = useLoader(
    THREE.TextureLoader,
    ROOM_PANELS.map((panel) => panel.src),
  );

  useEffect(() => {
    for (const texture of textures) {
      texture.colorSpace = THREE.SRGBColorSpace;
      // Les panneaux les plus inclinés seraient sinon crénelés en bord d'image.
      texture.anisotropy = 4;
    }
  }, [textures]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const { pointer, clock } = state;
    const time = clock.elapsedTime;

    // Le curseur incline le groupe entier. L'amplitude est petite : au-delà,
    // le fond attire l'œil au lieu de le laisser lire.
    const targetX = pointer.y * 0.06;
    const targetY = pointer.x * 0.1;

    // Amortissement dépendant du temps réel : le suivi garde la même douceur
    // que l'écran tourne à 60 ou à 120 Hz.
    const smoothing = 1 - Math.pow(0.0015, delta);
    group.current.rotation.x += (targetX - group.current.rotation.x) * smoothing;
    group.current.rotation.y += (targetY - group.current.rotation.y) * smoothing;

    // Respiration lente, indépendante du curseur : la scène reste vivante quand
    // personne ne bouge la souris, et sur écran tactile où il n'y en a pas.
    group.current.position.y = Math.sin(time * 0.12) * 0.35;
    group.current.position.x = Math.cos(time * 0.09) * 0.25;
  });

  return (
    <group ref={group}>
      {LAYOUT.map((panel, index) => {
        const texture = textures[index];
        if (!texture) return null;

        return (
          <mesh
            key={index}
            position={panel.position as unknown as THREE.Vector3Tuple}
            rotation={[0, panel.rotation, 0]}
          >
            <planeGeometry
              args={[panel.scale * PANEL_ASPECT, panel.scale]}
            />
            {/* Les textures arrivent déjà traitées : désaturées, assombries,
                et leur alpha porte le fondu des bords. Rien à corriger ici —
                pas de teinte, pas de masque à générer. */}
            <meshBasicMaterial
              map={texture}
              transparent
              opacity={panel.opacity}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        );
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

export default function AmbientScene() {
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
        onCreated={({ scene }) => {
          // Le brouillard efface les panneaux lointains dans le vert du site :
          // c'est lui qui donne la profondeur, plus que les positions. Il
          // commence au-delà du plan le plus proche, sinon il mangeait déjà
          // celui-là.
          scene.fog = new THREE.Fog(INK, 10, 26);
        }}
      >
        <PauseWhenHidden />
        <PanelsBoundary onError={() => setFailed(true)}>
          {/* `useLoader` suspend le temps du téléchargement des textures : sans
              cette frontière, la suspension remonterait hors du canvas. */}
          <Suspense fallback={null}>
            <Panels />
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
