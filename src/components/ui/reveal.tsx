'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Apparition au défilement.
 *
 * `whileInView` + `viewport.once` : l'animation ne se joue qu'une fois et ne
 * consomme rien ensuite. Lorsque l'utilisateur demande un mouvement réduit, le
 * contenu est rendu tel quel, immédiatement visible.
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'span';
}) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}

/** Conteneur qui décale l'apparition de ses enfants (`Reveal` imbriqués). */
export function RevealGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}
