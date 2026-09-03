'use client';

import { useEffect, useState } from 'react';
import { Menu, Phone, X } from 'lucide-react';

import { LogoLockup } from '@/components/brand/logo';
import { ButtonLink } from '@/components/ui/button';
import { cn, telHref } from '@/lib/utils';
import type { ContactInfo, SiteSettings } from '@/types/content';

export interface NavLink {
  label: string;
  href: string;
}

/**
 * En-tête du site.
 *
 * Transparent au sommet pour laisser le hero respirer, puis opaque et flouté
 * dès le premier défilement. Sur mobile, un tiroir plein écran remplace la
 * navigation horizontale.
 */
export function Header({
  settings,
  contact,
  links,
  reservationEnabled,
}: {
  settings: SiteSettings;
  contact: ContactInfo;
  links: NavLink[];
  reservationEnabled: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Tiroir ouvert : on bloque le défilement du document et on écoute Échap.
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const phone = telHref(contact.phone);

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-lime focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-on-lime"
      >
        Aller au contenu
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500',
          scrolled
            ? 'border-b border-line bg-ink/85 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="container-x flex h-16 items-center justify-between gap-4 sm:h-18">
          <a
            href="#accueil"
            className="shrink-0 rounded-lg"
            aria-label={`${settings.brandName} — accueil`}
          >
            <LogoLockup settings={settings} priority />
          </a>

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-1 lg:flex"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm text-fg-muted transition-colors duration-300 hover:bg-white/5 hover:text-cream"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {phone && (
              <a
                href={phone}
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-line-strong text-lime transition-colors duration-300 hover:bg-lime/10 sm:inline-flex"
                aria-label="Nous appeler"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}

            {reservationEnabled && (
              <ButtonLink
                href="#reservation"
                size="sm"
                className="hidden sm:inline-flex"
              >
                Réserver
              </ButtonLink>
            )}

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-cream transition-colors duration-300 hover:bg-white/5 lg:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={open}
              aria-controls="menu-mobile"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tiroir mobile */}
      <div
        id="menu-mobile"
        className={cn(
          'fixed inset-0 z-[60] lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={cn(
            'absolute inset-0 bg-ink-deep/80 backdrop-blur-sm transition-opacity duration-400',
            open ? 'opacity-100' : 'opacity-0',
          )}
          aria-label="Fermer le menu"
        />

        <div
          className={cn(
            'safe-bottom absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-line bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <LogoLockup settings={settings} compact />
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-cream"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav
            aria-label="Navigation mobile"
            className="flex-1 overflow-y-auto px-5 py-6"
          >
            <ul className="space-y-1">
              {links.map((link, index) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    tabIndex={open ? 0 : -1}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 rounded-2xl px-4 py-3.5 text-2xl font-medium text-cream transition-colors duration-300 hover:bg-white/5 hover:text-lime"
                  >
                    <span className="font-serif text-xs italic text-lime/60">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-2.5 border-t border-line px-5 py-5">
            {reservationEnabled && (
              <ButtonLink
                href="#reservation"
                size="lg"
                className="w-full"
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
              >
                Réserver une table
              </ButtonLink>
            )}
            {phone && (
              <ButtonLink
                href={phone}
                size="lg"
                variant="outline"
                className="w-full"
                tabIndex={open ? 0 : -1}
              >
                <Phone className="h-4 w-4" />
                {contact.phone}
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
