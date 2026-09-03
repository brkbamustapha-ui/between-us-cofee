import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'lime-ghost';
type Size = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium ' +
  'transition-[transform,background-color,color,border-color,box-shadow] duration-300 ' +
  'ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] ' +
  'disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-lime text-on-lime hover:bg-lime-glow hover:shadow-lime shadow-soft',
  outline:
    'border border-line-strong text-cream hover:border-lime hover:text-lime hover:bg-lime/5',
  ghost: 'text-fg-muted hover:text-cream hover:bg-white/5',
  'lime-ghost': 'bg-lime/10 text-lime hover:bg-lime/20',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.8125rem]',
  // 44 px : cible tactile confortable sur mobile
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[0.9375rem] sm:h-13 sm:px-8 sm:text-base',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & ComponentProps<'button'>) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Variante lien. Les URL absolues (`http`, `tel:`, `mailto:`) et les ancres
 * sortent du routeur Next : `next/link` n'a rien à y apporter.
 */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  external,
  ...props
}: CommonProps &
  Omit<ComponentProps<'a'>, 'href'> & {
    href: string;
    external?: boolean;
  }) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);
  const isExternal =
    external ?? /^(https?:|tel:|mailto:)/i.test(href);

  if (isExternal || href.startsWith('#')) {
    return (
      <a
        href={href}
        className={classes}
        {...(isExternal
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
