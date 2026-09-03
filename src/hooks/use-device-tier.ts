'use client';

import { useEffect, useState } from 'react';

/**
 * Détection des capacités de l'appareil, utilisée pour calibrer la 3D et les
 * animations.
 *
 *  - `off`  : pas de 3D du tout (mouvement réduit demandé, WebGL absent,
 *             mode économie de données, ou machine très limitée)
 *  - `low`  : 3D allégée — moins de particules, pixel ratio plafonné à 1.5,
 *             pas d'ombres ni de post-traitement (téléphones d'entrée/milieu de gamme)
 *  - `high` : scène complète (desktop et téléphones récents)
 *
 * Le premier rendu renvoie toujours `off` : c'est la valeur sûre côté serveur,
 * et elle évite toute différence d'hydratation.
 */

export type DeviceTier = 'off' | 'low' | 'high';

export interface DeviceCapabilities {
  tier: DeviceTier;
  reducedMotion: boolean;
  isTouch: boolean;
  /** `true` tant que la détection n'a pas eu lieu (rendu serveur, 1er paint). */
  pending: boolean;
}

const INITIAL: DeviceCapabilities = {
  tier: 'off',
  reducedMotion: false,
  isTouch: false,
  pending: true,
};

function supportsWebGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

function detect(): DeviceCapabilities {
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  if (reducedMotion || !supportsWebGl()) {
    return { tier: 'off', reducedMotion, isTouch, pending: false };
  }

  const connection = (
    navigator as Navigator & { connection?: NetworkInformation }
  ).connection;

  // Économie de données ou réseau lent : on n'impose pas une scène 3D.
  if (
    connection?.saveData ||
    (connection?.effectiveType &&
      ['slow-2g', '2g', '3g'].includes(connection.effectiveType))
  ) {
    return { tier: 'off', reducedMotion, isTouch, pending: false };
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const smallScreen = window.innerWidth < 768;

  if (cores <= 4 || memory <= 4) {
    // Un Android d'entrée de gamme reste fluide en `low`, il ne perd que
    // les effets les plus coûteux.
    return {
      tier: cores <= 2 || memory <= 2 ? 'off' : 'low',
      reducedMotion,
      isTouch,
      pending: false,
    };
  }

  return {
    tier: smallScreen ? 'low' : 'high',
    reducedMotion,
    isTouch,
    pending: false,
  };
}

export function useDeviceTier(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(INITIAL);

  useEffect(() => {
    setCapabilities(detect());

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setCapabilities(detect());

    motionQuery.addEventListener('change', onChange);
    return () => motionQuery.removeEventListener('change', onChange);
  }, []);

  return capabilities;
}

/** Hook générique de media query, sûr côté serveur. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
