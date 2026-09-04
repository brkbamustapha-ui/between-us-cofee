'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarCheck,
  ExternalLink,
  FileText,
  ImageIcon,
  Images,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu as MenuIcon,
  Phone,
  Settings,
  Share2,
  ShieldCheck,
  UtensilsCrossed,
  Video,
  X,
} from 'lucide-react';

import { LogoLockup } from '@/components/brand/logo';
import { logoutRequest } from '@/lib/admin/client';
import { cn } from '@/lib/utils';
import type { SiteSettings } from '@/types/content';
import { AdminButton, useToast } from './ui';

/**
 * Ossature du dashboard.
 *
 * Desktop : barre latérale fixe. Mobile : la même navigation dans un tiroir,
 * ouvert par le bouton de la barre supérieure. Un seul jeu de liens, aucune
 * duplication.
 */

const NAV = [
  {
    group: 'Pilotage',
    items: [
      { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/admin/reservations', label: 'Réservations', icon: CalendarCheck },
    ],
  },
  {
    group: 'Contenu',
    items: [
      { href: '/admin/content', label: 'Textes du site', icon: FileText },
      { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
      { href: '/admin/menu/categories', label: 'Catégories', icon: ListTree },
      { href: '/admin/menu/photos', label: 'Photos de la carte', icon: ImageIcon },
      { href: '/admin/gallery', label: 'Galerie', icon: Images },
      { href: '/admin/videos', label: 'Vidéos', icon: Video },
    ],
  },
  {
    group: 'Configuration',
    items: [
      { href: '/admin/contact', label: 'Contact & horaires', icon: Phone },
      { href: '/admin/socials', label: 'Réseaux sociaux', icon: Share2 },
      { href: '/admin/settings', label: 'Paramètres', icon: Settings },
      { href: '/admin/security', label: 'Sécurité', icon: ShieldCheck },
    ],
  },
] as const;

export function AdminShell({
  settings,
  username,
  children,
}: {
  settings: SiteSettings;
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Le tiroir se referme dès qu'on change de page.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function onLogout() {
    setLeaving(true);
    try {
      await logoutRequest();
      router.push('/admin/login');
      router.refresh();
    } catch {
      toast.error('Déconnexion impossible. Réessayez.');
      setLeaving(false);
    }
  }

  const navigation = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {NAV.map((section) => (
        <div key={section.group}>
          <p className="px-3 pb-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
            {section.group}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              // `/admin/menu` ne doit pas rester actif sur `/admin/menu/categories`.
              const active =
                pathname === item.href ||
                (item.href !== '/admin/menu' &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200',
                      active
                        ? 'bg-lime/12 font-medium text-lime'
                        : 'text-fg-muted hover:bg-white/5 hover:text-cream',
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-line p-3">
      <div className="mb-2 rounded-xl bg-ink/60 px-3 py-2.5">
        <p className="text-[0.625rem] uppercase tracking-[0.12em] text-fg-subtle">
          Connecté
        </p>
        <p className="truncate text-sm font-medium text-cream">{username}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line-strong text-xs font-medium text-cream transition-colors hover:bg-white/5"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Le site
        </a>
        <AdminButton
          variant="danger"
          loading={leaving}
          onClick={onLogout}
          className="text-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          Quitter
        </AdminButton>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-ink">
      {/* Barre latérale — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-ink-deep lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <LogoLockup settings={settings} compact />
        </div>
        {navigation}
        {footer}
      </aside>

      {/* Barre supérieure — mobile */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-ink/92 px-4 backdrop-blur-xl lg:hidden">
        <LogoLockup settings={settings} compact />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir la navigation"
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong text-cream"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Tiroir — mobile */}
      <div
        id="admin-drawer"
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          aria-label="Fermer la navigation"
          className={cn(
            'absolute inset-0 bg-ink-deep/80 backdrop-blur-sm transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0',
          )}
        />

        <div
          className={cn(
            'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-ink-deep transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <LogoLockup settings={settings} compact />
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              aria-label="Fermer la navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong text-cream"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
          {navigation}
          {footer}
        </div>
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

/** En-tête de page du dashboard. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-cream sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}
