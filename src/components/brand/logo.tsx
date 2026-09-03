import Image from 'next/image';

import { cn } from '@/lib/utils';
import type { SiteSettings } from '@/types/content';

/**
 * Logo Between Us.
 *
 * Si un logo officiel a été téléversé depuis le dashboard (`logoUrl` /
 * `logoMarkUrl`), c'est ce fichier qui est affiché, sans jamais être déformé :
 * `object-contain` conserve les proportions d'origine.
 *
 * Sinon, un monogramme vectoriel de secours est rendu — même construction que
 * `public/brand/logo-mark.svg`, aux couleurs de la charte.
 */

/* -------------------------------------------------------------------------- */
/*  Monogramme                                                                 */
/* -------------------------------------------------------------------------- */

export function LogoMark({
  settings,
  className,
  priority = false,
}: {
  settings: Pick<SiteSettings, 'logoMarkUrl' | 'logoUrl' | 'shortName'>;
  className?: string;
  priority?: boolean;
}) {
  const source = settings.logoMarkUrl || settings.logoUrl;

  if (source) {
    return (
      <span
        className={cn('relative block aspect-square', className)}
        aria-hidden="true"
      >
        <Image
          src={source}
          alt=""
          fill
          sizes="96px"
          priority={priority}
          className="object-contain"
        />
      </span>
    );
  }

  // Monogramme vectorisé d'après le logo officiel : le « B » est formé de deux
  // demi-disques pleins (celui du haut coupé en diagonale), le « U » d'un bloc
  // à fond arrondi fendu d'une entaille fine. `fillRule="evenodd"` creuse
  // l'entaille dans le bloc.
  return (
    <svg
      viewBox="0 0 128 128"
      className={cn('block', className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="128" height="128" rx="28" fill="var(--color-ink)" />
      <g
        transform="translate(24.9 22) scale(0.28966)"
        fill="var(--color-lime)"
        fillRule="evenodd"
      >
        <path d="M0 120 L62 0 A60 60 0 0 1 62 120 Z" />
        <path d="M0 128 H51 A81 81 0 0 1 51 290 H0 Z" />
        <path d="M138 0 H270 V224 A66 66 0 0 1 138 224 Z M206 0 H211 V212.5 A2.5 2.5 0 0 1 206 212.5 Z" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Lockup complet                                                             */
/* -------------------------------------------------------------------------- */

export function LogoLockup({
  settings,
  className,
  markClassName,
  compact = false,
  priority = false,
}: {
  settings: Pick<
    SiteSettings,
    'logoUrl' | 'logoMarkUrl' | 'brandName' | 'shortName'
  >;
  className?: string;
  markClassName?: string;
  /** Masque le sous-titre « Coffee & Brunch » (header mobile). */
  compact?: boolean;
  priority?: boolean;
}) {
  // Un logo complet téléversé remplace tout le lockup : on ne recompose pas
  // par-dessus le fichier officiel.
  if (settings.logoUrl) {
    return (
      <span className={cn('relative block h-10 w-40 sm:h-11 sm:w-48', className)}>
        <Image
          src={settings.logoUrl}
          alt={settings.brandName}
          fill
          sizes="(max-width: 640px) 160px, 192px"
          priority={priority}
          className="object-contain object-left"
        />
      </span>
    );
  }

  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark
        settings={settings}
        priority={priority}
        className={cn('h-9 w-9 shrink-0 sm:h-10 sm:w-10', markClassName)}
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] font-bold tracking-tight text-lime sm:text-base">
          {settings.shortName || 'Between Us'}
        </span>
        {!compact && (
          <span className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.22em] text-fg-muted">
            Coffee &amp; Brunch
          </span>
        )}
      </span>
    </span>
  );
}
