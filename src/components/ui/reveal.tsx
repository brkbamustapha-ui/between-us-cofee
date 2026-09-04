import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Apparition au défilement.
 *
 * Le contenu est **visible par défaut** : l'animation est ajoutée par CSS via
 * une timeline de défilement (`animation-timeline: view()`), sans le moindre
 * JavaScript. Voir le bloc « Apparition au défilement » de `globals.css`.
 *
 * C'est délibérément différent de l'implémentation précédente, qui rendait le
 * contenu à `opacity: 0` et attendait un IntersectionObserver pour le révéler :
 * la lisibilité du site s'en trouvait suspendue au bon fonctionnement du script.
 *
 * Le composant ne tient plus aucun état : ce n'est plus un composant client, et
 * il ne pèse plus rien dans le bundle.
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as: Component = 'div',
}: {
  children: ReactNode;
  /** Décalage de l'apparition, en secondes. Traduit en retard sur la course
   *  de défilement — une timeline de défilement n'a pas de notion de durée. */
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'span';
}) {
  const style: Record<string, string> = {};
  if (y !== 22) style['--bu-reveal-y'] = `${y}px`;
  // Plafonné : au-delà, l'élément terminerait son apparition trop tard.
  if (delay > 0) style['--bu-reveal-from'] = `${Math.min(delay * 100, 24)}%`;

  return (
    <Component
      className={cn('bu-reveal', className)}
      style={Object.keys(style).length ? (style as CSSProperties) : undefined}
    >
      {children}
    </Component>
  );
}

/** Conteneur qui regroupe des `Reveal` imbriqués. */
export function RevealGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}
