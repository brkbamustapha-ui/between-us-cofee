'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import { useDeviceTier } from '@/hooks/use-device-tier';

/**
 * Fond de site : le lieu, en profondeur, accordé à la section qu'on regarde.
 *
 * Quatre panneaux photo flottent derrière la page comme des cadres suspendus.
 * Ils dérivent en continu, se décalent au défilement, et sur ordinateur le
 * groupe s'incline vers le curseur. Quand le visiteur entre dans « Brunch », les
 * quatre panneaux passent en fondu sur des photos de brunch ; dans « Coffee »,
 * sur des tasses.
 *
 * Deux implémentations, choisies selon l'appareil :
 *
 *  - `high` — vraie 3D (React Three Fiber) : position dans l'espace, suivi du
 *    curseur, brouillard qui efface les plans lointains.
 *  - tout le reste — les mêmes panneaux en CSS 3D. Aucun WebGL, aucun
 *    JavaScript nécessaire pour l'état initial : c'est du balisage rendu par le
 *    serveur, animé par des keyframes et par le défilement.
 *
 * Dans les deux cas le fond est décoratif : `aria-hidden`, sans interaction, et
 * recouvert d'un voile qui garantit le contraste du texte. Sans JavaScript, la
 * scène « salle » reste affichée — le changement de décor est un supplément,
 * jamais une condition d'affichage.
 */

const AmbientScene = dynamic(() => import('./ambient-scene'), {
  ssr: false,
  loading: () => null,
});

export type RoomScene = 'salle' | 'coffee' | 'brunch' | 'carte';

/**
 * Les quatre panneaux de chaque scène, du plus lointain au plus proche.
 *
 * Ces fichiers sont des versions préparées : désaturées, assombries et fondues
 * sur les bords (voir `public/photos/README.md`). Les originaux pleines
 * couleurs vivent un dossier plus haut et servent la galerie.
 */
export const ROOM_SCENES: Record<RoomScene, readonly [string, string, string, string]> = {
  salle: ['salle-alcoves', 'salle-profondeur', 'salle-medaillon', 'salle-banquette'],
  coffee: ['boissons-chaudes', 'boissons-trio', 'chocolat-main', 'granola-latte'],
  brunch: ['brunch-assiettes', 'brunch-plateau', 'brunch-toasts', 'granola-latte'],
  carte: ['brunch-plateau', 'boissons-trio', 'patisseries', 'refreshers'],
};

export const roomImage = (slug: string) => `/photos/room/${slug}.webp`;

/** Toutes les images du décor, sans doublon — sert au préchargement en 3D. */
export const ALL_ROOM_IMAGES = [
  ...new Set(Object.values(ROOM_SCENES).flat()),
].map(roomImage);

/**
 * Quelle scène pour quelle section.
 *
 * Les sections absentes de cette table gardent la salle : c'est le décor par
 * défaut, celui du lieu lui-même.
 */
const SECTION_SCENE: Record<string, RoomScene> = {
  coffee: 'coffee',
  brunch: 'brunch',
  menu: 'carte',
};

/**
 * La section actuellement au centre de l'écran.
 *
 * Volontairement décoratif : la valeur initiale est `salle`, identique au rendu
 * serveur, et si l'observateur ne rapporte jamais rien le fond reste
 * simplement sur la salle. Aucun contenu ne dépend de ce hook — la leçon d'un
 * bug précédent, où des sections entières étaient restées invisibles parce
 * qu'un `IntersectionObserver` ne s'était pas déclenché.
 */
function useActiveScene(): RoomScene {
  const [scene, setScene] = useState<RoomScene>('salle');

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('main section[id]');
    if (sections.length === 0) return;

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) visible.set(id, entry.intersectionRatio);
          else visible.delete(id);
        }

        // La section qui occupe le plus la bande centrale l'emporte : au moment
        // où deux sections se croisent, on ne veut pas que le décor hésite.
        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }

        setScene(best ? (SECTION_SCENE[best] ?? 'salle') : 'salle');
      },
      // Bande centrale : la section doit vraiment être celle qu'on regarde,
      // pas celle qui pointe d'un pixel en bas de l'écran.
      { rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return scene;
}

export function AmbientRoom() {
  const { tier, pending } = useDeviceTier();
  const scene = useActiveScene();
  const webgl = !pending && tier === 'high';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink"
    >
      {/* La version CSS est toujours dans le DOM : elle est le rendu serveur, le
          repli sans WebGL, et l'écran d'attente pendant le téléchargement du
          bundle 3D. La 3D vient la recouvrir quand elle est prête. */}
      <CssRoom scene={scene} dimmed={webgl} />

      {webgl && <AmbientScene scene={scene} />}

      {/* Voile de lisibilité. Sans lui, un texte crème posé sur le mur éclairé
          d'une photo passerait sous le seuil de contraste. Le réglage n'est pas
          fait à l'œil : il est descendu jusqu'au point où la salle se voit
          nettement, puis vérifié en mesurant le contraste réel sous chaque
          glyphe de la page. */}
      <div className="absolute inset-0 bg-ink/52" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/28 to-ink" />
      {/* Les clichés sont chauds et beiges ; désaturés, ils tiraient vers
          l'olive. Ce lavis les ramène dans le vert de la marque. */}
      <div className="absolute inset-0 bg-lime/[0.05] mix-blend-overlay" />
    </div>
  );
}

/**
 * Les panneaux en CSS 3D, avec fondu d'une scène à l'autre.
 *
 * Deux calques par cadre, alternés : le nouveau décor est écrit dans le calque
 * masqué, puis on échange lequel des deux est visible. Le navigateur fait le
 * fondu tout seul, et l'ancienne image reste affichée pendant que la nouvelle
 * se charge — jamais de trou.
 */
function CssRoom({ scene, dimmed }: { scene: RoomScene; dimmed: boolean }) {
  const [buffers, setBuffers] = useState<{
    a: RoomScene;
    b: RoomScene | null;
    shown: 'a' | 'b';
  }>({ a: 'salle', b: null, shown: 'a' });

  useEffect(() => {
    setBuffers((current) => {
      const visible = current.shown === 'a' ? current.a : current.b;
      if (visible === scene) return current;
      return current.shown === 'a'
        ? { ...current, b: scene, shown: 'b' }
        : { ...current, a: scene, shown: 'a' };
    });
  }, [scene]);

  return (
    <div className="bu-room" data-dimmed={dimmed ? '' : undefined}>
      {[0, 1, 2, 3].map((depth) => (
        /* Le cadre porte la parallaxe au défilement, les photos la dérive
           continue : deux animations, deux couches, aucune ne se dispute une
           propriété avec l'autre. */
        <div key={depth} className="bu-room-frame" data-depth={depth}>
          <Panel depth={depth} scene={buffers.a} on={buffers.shown === 'a'} />
          <Panel depth={depth} scene={buffers.b} on={buffers.shown === 'b'} />
        </div>
      ))}
    </div>
  );
}

function Panel({
  depth,
  scene,
  on,
}: {
  depth: number;
  scene: RoomScene | null;
  on: boolean;
}) {
  return (
    <div
      className="bu-room-panel"
      data-depth={depth}
      data-on={on && scene ? '' : undefined}
      style={
        scene
          ? { backgroundImage: `url(${roomImage(ROOM_SCENES[scene][depth]!)})` }
          : undefined
      }
    />
  );
}
