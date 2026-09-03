'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

import type { DeviceTier } from '@/hooks/use-device-tier';

/**
 * Scène 3D du hero.
 *
 * Parti pris : un médaillon de marque en lévitation — le monogramme cerclé d'un
 * anneau lime — posé DANS L'ESPACE LIBRE de la composition, jamais derrière le
 * texte. Autour, quelques grains de café et une poussière lumineuse donnent la
 * profondeur. C'est une ambiance, pas une démonstration technique.
 *
 * La position et la taille du médaillon sont calculées à partir du viewport 3D :
 * à droite du titre en paysage, en filigrane très effacé en portrait, où le
 * texte occupe tout l'écran (voir `useMedallionLayout`).
 *
 * Budget calibré par `tier` :
 *   high → 30 grains, 170 particules, DPR ≤ 2, antialiasing
 *   low  → 10 grains,  70 particules, DPR ≤ 1.5, sans antialiasing
 *
 * Le rendu s'arrête complètement (`frameloop="never"`) dès que le hero sort du
 * champ ou que l'onglet passe en arrière-plan : aucune batterie consommée à
 * défiler dans le menu.
 */

const LIME = '#d5ff72';

interface Budget {
  beans: number;
  particles: number;
  dpr: [number, number];
  antialias: boolean;
  segments: number;
}

const BUDGETS: Record<Exclude<DeviceTier, 'off'>, Budget> = {
  high: { beans: 30, particles: 170, dpr: [1, 2], antialias: true, segments: 84 },
  low: { beans: 10, particles: 70, dpr: [1, 1.5], antialias: false, segments: 44 },
};

/* -------------------------------------------------------------------------- */
/*  Texture du monogramme                                                      */
/* -------------------------------------------------------------------------- */

/** Monogramme sur fond transparent — un logo à fond plein ferait une plaque opaque. */
const FALLBACK_TEXTURE = '/brand/logo-mark-glyph.svg';

/**
 * Charge la texture du logo sans jamais faire planter la scène : si le fichier
 * téléversé est inaccessible (CORS, 404), on retombe sur le SVG local.
 */
interface LoadedLogo {
  texture: THREE.Texture;
  /** `true` quand c'est notre glyphe de secours et non un logo téléversé. */
  isFallback: boolean;
}

function useLogoTexture(url: string): LoadedLogo | null {
  const [logo, setLogo] = useState<LoadedLogo | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const apply = (isFallback: boolean) => (loaded: THREE.Texture) => {
      if (cancelled) {
        loaded.dispose();
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 4;
      // Sans mipmaps : la minification moyennerait les traits fins du
      // monogramme avec le fond transparent, ce qui délave la couleur et
      // efface les contre-formes du « B ». Le filtrage linéaire sur la texture
      // pleine résolution garde le lime exact et le dessin net.
      loaded.generateMipmaps = false;
      loaded.minFilter = THREE.LinearFilter;
      loaded.magFilter = THREE.LinearFilter;
      setLogo({ texture: loaded, isFallback });
    };

    const wanted = url || FALLBACK_TEXTURE;
    const isFallback = wanted === FALLBACK_TEXTURE;

    loader.load(wanted, apply(isFallback), undefined, () => {
      if (!isFallback) {
        loader.load(FALLBACK_TEXTURE, apply(true), undefined, () => undefined);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => () => logo?.texture.dispose(), [logo]);

  return logo;
}

/* -------------------------------------------------------------------------- */
/*  Médaillon de marque                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Deux traitements, selon la place réellement disponible :
 *
 *  - paysage : le texte occupe la moitié gauche, le médaillon vient occuper la
 *    droite à pleine présence, anneaux compris ;
 *  - portrait : le texte occupe tout l'écran. Le médaillon devient alors un
 *    filigrane centré, très effacé (opacité 0,18) et sans anneaux — il donne de
 *    la matière au fond sans jamais entrer en concurrence avec le titre.
 *
 * C'est la règle « la 3D ne doit jamais empêcher la lecture » appliquée
 * littéralement : sur un petit écran, la 3D recule.
 */
function useMedallionLayout() {
  const viewport = useThree((state) => state.viewport);

  return useMemo(() => {
    const portrait = viewport.width < viewport.height;

    if (portrait) {
      return {
        portrait: true,
        position: [0, viewport.height * 0.06, -1.4] as [number, number, number],
        scale: viewport.width * 0.78,
        opacity: 0.18,
        showRings: false,
      };
    }

    return {
      portrait: false,
      position: [
        viewport.width * 0.27,
        -viewport.height * 0.02,
        -0.4,
      ] as [number, number, number],
      scale: viewport.height * 0.44,
      opacity: 1,
      showRings: true,
    };
  }, [viewport.width, viewport.height]);
}

function Medallion({ url, segments }: { url: string; segments: number }) {
  const logo = useLogoTexture(url);
  const { position, scale, opacity, showRings } = useMedallionLayout();

  const glyph = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const outerRing = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Balancement très lent : le logo respire, il ne tourne pas sur lui-même.
    if (glyph.current) {
      glyph.current.rotation.y = Math.sin(t * 0.26) * 0.22;
      glyph.current.rotation.x = Math.sin(t * 0.19) * 0.08;
    }
    // Les deux anneaux tournent en sens inverse : la profondeur se lit sans
    // qu'aucun mouvement n'attire l'œil.
    if (ring.current) ring.current.rotation.z += delta * 0.09;
    if (outerRing.current) outerRing.current.rotation.z -= delta * 0.05;
  });

  return (
    <group position={position} scale={scale}>
      <Float speed={1} rotationIntensity={0.1} floatIntensity={showRings ? 0.35 : 0.15}>
        <mesh ref={glyph}>
          <planeGeometry args={[0.72, 0.72]} />
          {logo && (
            <meshBasicMaterial
              map={logo.texture}
              // Le glyphe de secours est tracé en blanc : le teinter ici avec le
              // token de marque garantit un lime strictement identique au reste
              // du site. Un logo officiel téléversé, lui, garde ses couleurs
              // (teinte blanche = neutre) — elles ne sont jamais réinterprétées.
              color={logo.isFallback ? LIME : '#ffffff'}
              transparent
              opacity={opacity}
              toneMapped={false}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          )}
        </mesh>

        {showRings && (
          <>
            <mesh ref={ring} rotation={[Math.PI / 2.9, 0, 0]}>
              <torusGeometry args={[0.62, 0.007, 8, segments]} />
              <meshStandardMaterial
                color={LIME}
                emissive={LIME}
                emissiveIntensity={0.9}
                roughness={0.3}
                metalness={0.1}
                transparent
                opacity={0.7}
              />
            </mesh>

            <mesh ref={outerRing} rotation={[Math.PI / 2.4, 0.4, 0]}>
              <torusGeometry args={[0.88, 0.005, 8, segments]} />
              <meshStandardMaterial
                color={LIME}
                emissive={LIME}
                emissiveIntensity={0.6}
                roughness={0.3}
                transparent
                opacity={0.34}
              />
            </mesh>

            {/* Éclaire le monogramme par l'avant : sans cela il se confond
                avec le fond vert profond. */}
            <pointLight position={[0, 0, 1.2]} intensity={2.4} color={LIME} distance={4} />
          </>
        )}
      </Float>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Ambiance                                                                   */
/* -------------------------------------------------------------------------- */

interface BeanSeed {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  speed: number;
  phase: number;
}

function Beans({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  const viewport = useThree((state) => state.viewport);

  const seeds = useMemo<BeanSeed[]>(() => {
    // Générateur déterministe : la composition est identique à chaque rendu.
    let seed = 20_251;
    const random = () => {
      seed = (seed * 1_664_525 + 1_013_904_223) % 4_294_967_296;
      return seed / 4_294_967_296;
    };

    const spreadX = Math.max(viewport.width, 4) * 0.62;
    const spreadY = Math.max(viewport.height, 4) * 0.55;

    return Array.from({ length: count }, () => ({
      position: [
        (random() - 0.5) * 2 * spreadX,
        (random() - 0.5) * 2 * spreadY,
        -2.6 - random() * 3.4,
      ] as [number, number, number],
      rotation: [
        random() * Math.PI,
        random() * Math.PI,
        random() * Math.PI,
      ] as [number, number, number],
      scale: 0.05 + random() * 0.045,
      speed: 0.16 + random() * 0.26,
      phase: random() * Math.PI * 2,
    }));
  }, [count, viewport.width, viewport.height]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    group.current.children.forEach((child, index) => {
      const bean = seeds[index];
      if (!bean) return;
      child.position.y =
        bean.position[1] + Math.sin(t * bean.speed + bean.phase) * 0.22;
      child.rotation.z = bean.rotation[2] + t * bean.speed * 0.28;
    });
  });

  return (
    <group ref={group}>
      {/* Instancié : une seule géométrie et un seul matériau pour tous les grains. */}
      <Instances limit={count} range={count}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#3d2a16" roughness={0.72} metalness={0.05} />
        {seeds.map((bean, index) => (
          <Instance
            key={index}
            position={bean.position}
            rotation={bean.rotation}
            // Ellipsoïde : la silhouette d'un grain de café, sans coût géométrique.
            scale={[bean.scale, bean.scale * 0.64, bean.scale * 0.64]}
          />
        ))}
      </Instances>
    </group>
  );
}

function Dust({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const viewport = useThree((state) => state.viewport);

  const geometry = useMemo(() => {
    let seed = 7_331;
    const random = () => {
      seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
      return seed / 2_147_483_648;
    };

    const spreadX = Math.max(viewport.width, 4) * 1.1;
    const spreadY = Math.max(viewport.height, 4) * 0.9;

    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() - 0.5) * spreadX;
      positions[i * 3 + 1] = (random() - 0.5) * spreadY;
      positions[i * 3 + 2] = -1 - random() * 5;
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return buffer;
  }, [count, viewport.width, viewport.height]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.z = state.clock.elapsedTime * 0.012;
    }
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color={LIME}
        transparent
        opacity={0.34}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** Parallaxe au pointeur — désactivée au doigt, où elle n'a pas de sens. */
function PointerParallax({ enabled }: { enabled: boolean }) {
  const { camera, pointer } = useThree();

  useFrame(() => {
    if (!enabled) return;
    camera.position.x += (pointer.x * 0.34 - camera.position.x) * 0.03;
    camera.position.y += (pointer.y * 0.22 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Canvas                                                                     */
/* -------------------------------------------------------------------------- */

export default function HeroScene({
  tier,
  logoUrl,
  isTouch,
}: {
  tier: Exclude<DeviceTier, 'off'>;
  logoUrl: string;
  isTouch: boolean;
}) {
  const budget = BUDGETS[tier];
  const container = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  // Le rendu s'arrête hors écran et quand l'onglet est masqué.
  useEffect(() => {
    const node = container.current;
    if (!node) return;

    let visible = true;
    let onScreen = true;

    const sync = () => setActive(visible && onScreen);

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? false;
        sync();
      },
      { rootMargin: '120px' },
    );
    observer.observe(node);

    const onVisibility = () => {
      visible = document.visibilityState === 'visible';
      sync();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div ref={container} className="absolute inset-0" aria-hidden="true">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={budget.dpr}
        camera={{ position: [0, 0, 6.2], fov: 38 }}
        gl={{
          antialias: budget.antialias,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        // La scène est purement décorative : hors du flux d'accessibilité et
        // des événements pointeur, pour ne jamais gêner la lecture ni le tap.
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3.2, 4.2, 5]} intensity={1.1} color="#ffffff" />
        <pointLight position={[-4, -2, 2]} intensity={18} color={LIME} distance={12} />

        <PointerParallax enabled={!isTouch && tier === 'high'} />

        <Medallion url={logoUrl} segments={budget.segments} />
        <Beans count={budget.beans} />
        <Dust count={budget.particles} />

        <fog attach="fog" args={['#002c25', 6, 14]} />
      </Canvas>
    </div>
  );
}
