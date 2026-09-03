'use client';

import dynamic from 'next/dynamic';

import { useDeviceTier } from '@/hooks/use-device-tier';

/**
 * Point d'entrée de la 3D du hero.
 *
 * Trois garde-fous avant qu'un seul octet de Three.js ne soit téléchargé :
 *  1. `enabled` — interrupteur global dans le dashboard ;
 *  2. la détection d'appareil — mouvement réduit, absence de WebGL, mode
 *     économie de données ou machine trop juste renvoient `off` ;
 *  3. `next/dynamic` avec `ssr: false` — le bundle 3D (~450 Ko) n'est chargé
 *     qu'après l'hydratation, une fois la page déjà lisible et interactive.
 *
 * Quand la 3D ne se charge pas, un dégradé animé en CSS prend le relais : le
 * hero reste habité, sans une ligne de JavaScript supplémentaire.
 */

const HeroScene = dynamic(() => import('./hero-scene'), {
  ssr: false,
  loading: () => <CssAmbience />,
});

function CssAmbience() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/10 blur-[120px]" />
      <div className="animate-float absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-lime/[0.07] blur-[90px]" />
      <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-elevated/60 blur-[110px]" />
    </div>
  );
}

export function HeroCanvas({
  enabled,
  logoUrl,
}: {
  enabled: boolean;
  logoUrl: string;
}) {
  const { tier, isTouch, pending } = useDeviceTier();

  if (!enabled || pending || tier === 'off') {
    return <CssAmbience />;
  }

  return <HeroScene tier={tier} logoUrl={logoUrl} isTouch={isTouch} />;
}
