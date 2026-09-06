'use client';

import dynamic from 'next/dynamic';

import { useDeviceTier } from '@/hooks/use-device-tier';

/**
 * Fond de site : la salle, en profondeur.
 *
 * Quatre clichés du lieu flottent derrière la page comme des panneaux
 * suspendus dans le noir. Ils bougent avec le curseur sur ordinateur, avec le
 * défilement sur téléphone.
 *
 * Deux implémentations, choisies selon l'appareil :
 *
 *  - `high` — vraie 3D (React Three Fiber). Les panneaux ont une position dans
 *    l'espace, le groupe s'incline vers le curseur, le brouillard efface les
 *    plus lointains.
 *  - tout le reste — les mêmes panneaux en CSS 3D. Aucun WebGL, aucun
 *    JavaScript nécessaire : c'est du balisage rendu par le serveur, animé par
 *    des keyframes et par le défilement. Un téléphone d'entrée de gamme le
 *    joue sans effort, et la page garde son fond même si le script ne
 *    s'exécute jamais.
 *
 * Dans les deux cas le fond est décoratif : `aria-hidden`, sans interaction, et
 * recouvert d'un voile qui garantit le contraste du texte par-dessus. Le
 * contenu du site ne dépend jamais de lui.
 */

const AmbientScene = dynamic(() => import('./ambient-scene'), {
  ssr: false,
  loading: () => null,
});

/**
 * Les panneaux, du plus lointain au plus proche.
 *
 * Ces fichiers-là sont des versions préparées : déjà désaturées, assombries et
 * fondues sur les bords. Les originaux, eux, vivent dans `/photos/salle-*.webp`
 * et servent la galerie en pleines couleurs.
 */
export const ROOM_PANELS = [
  { src: '/photos/room/salle-alcoves.webp', depth: 0 },
  { src: '/photos/room/salle-profondeur.webp', depth: 1 },
  { src: '/photos/room/salle-medaillon.webp', depth: 2 },
  { src: '/photos/room/salle-banquette.webp', depth: 3 },
] as const;

export function AmbientRoom() {
  const { tier, pending } = useDeviceTier();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink"
    >
      {/* La version CSS est toujours dans le DOM : elle est le rendu serveur,
          le repli sans WebGL, et l'écran d'attente pendant que le bundle 3D se
          télécharge. La 3D vient la recouvrir quand elle est prête. */}
      <CssRoom dimmed={!pending && tier === 'high'} />

      {!pending && tier === 'high' && <AmbientScene />}

      {/* Voile de lisibilité. Sans lui, un texte crème posé sur le mur éclairé
          d'une photo passerait sous le seuil de contraste. Assez dense pour
          garantir la lecture, assez léger pour qu'on reconnaisse la salle —
          l'équilibre est vérifié en mesurant le contraste réel du rendu, pas à
          l'œil. */}
      <div className="absolute inset-0 bg-ink/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/45 to-ink" />
      {/* Les clichés sont chauds et beiges ; désaturés, ils tiraient vers
          l'olive. Ce lavis les ramène dans le vert de la marque. */}
      <div className="absolute inset-0 bg-lime/[0.045] mix-blend-overlay" />
    </div>
  );
}

/**
 * Les panneaux en CSS 3D.
 *
 * `dimmed` les efface quand la scène WebGL a pris le relais — plutôt que de les
 * retirer du DOM, ce qui provoquerait un clignotement au moment de la bascule.
 */
function CssRoom({ dimmed }: { dimmed: boolean }) {
  return (
    <div
      className="bu-room absolute inset-0"
      data-dimmed={dimmed ? '' : undefined}
    >
      {ROOM_PANELS.map((panel) => (
        /* Le cadre porte la parallaxe au défilement, la photo la dérive
           continue : deux animations, deux couches, aucune ne se dispute une
           propriété avec l'autre. */
        <div key={panel.src} className="bu-room-frame" data-depth={panel.depth}>
          <div
            className="bu-room-panel"
            data-depth={panel.depth}
            style={{ backgroundImage: `url(${panel.src})` }}
          />
        </div>
      ))}
    </div>
  );
}
