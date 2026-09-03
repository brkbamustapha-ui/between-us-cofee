import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Reveal } from './reveal';

/** En-tête de section : surtitre en italique serif, titre, description. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow && (
        <Reveal>
          <p className="mb-4 flex items-center gap-3 font-serif text-sm italic text-lime">
            <span
              aria-hidden="true"
              className={cn(
                'h-px w-8 bg-lime/50',
                align === 'center' && 'hidden',
              )}
            />
            {eyebrow}
          </p>
        </Reveal>
      )}

      <Reveal delay={0.05}>
        <h2 className="text-balance text-3xl leading-[1.08] sm:text-4xl lg:text-5xl">
          {title}
        </h2>
      </Reveal>

      {description && (
        <Reveal delay={0.1}>
          <p className="mt-5 text-base leading-relaxed text-fg-muted sm:text-lg">
            {description}
          </p>
        </Reveal>
      )}

      {children}
    </div>
  );
}
