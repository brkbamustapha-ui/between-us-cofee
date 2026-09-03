import Link from 'next/link';
import {
  AlertTriangle,
  CalendarCheck,
  Images,
  ListTree,
  Sparkles,
  UtensilsCrossed,
  Video,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/shell';
import { Card, Notice } from '@/components/admin/ui';
import { getStore, getStorageStatus } from '@/lib/db';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/** Vue d'ensemble : ce qui est en ligne, ce qui attend une action. */
export default async function DashboardPage() {
  const store = getStore();
  const storage = getStorageStatus();

  const [content, reservations] = await Promise.all([
    store.getContent(),
    store.list('reservations'),
  ]);

  const activeItems = content.items.filter((item) => item.enabled);
  const placeholders = content.items.filter((item) => item.isPlaceholder);
  const pending = reservations.filter(
    (reservation) => reservation.status === 'pending',
  );

  const stats = [
    {
      label: 'Produits actifs',
      value: activeItems.length,
      total: content.items.length,
      href: '/admin/menu',
      icon: UtensilsCrossed,
    },
    {
      label: 'Catégories',
      value: content.categories.filter((category) => category.enabled).length,
      total: content.categories.length,
      href: '/admin/menu/categories',
      icon: ListTree,
    },
    {
      label: 'Photos',
      value: content.gallery.filter((photo) => photo.enabled).length,
      total: content.gallery.length,
      href: '/admin/gallery',
      icon: Images,
    },
    {
      label: 'Vidéos',
      value: content.videos.filter((video) => video.enabled).length,
      total: content.videos.length,
      href: '/admin/videos',
      icon: Video,
    },
    {
      label: 'Demandes en attente',
      value: pending.length,
      total: reservations.length,
      href: '/admin/reservations',
      icon: CalendarCheck,
    },
  ];

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="L’état du site en un coup d’œil, et les points qui demandent votre attention."
      />

      <div className="space-y-5">
        {!storage.supabaseConfigured && (
          <Notice tone={storage.writable ? 'warn' : 'danger'}>
            <p>{storage.message}</p>
            <p className="mt-1.5 opacity-80">
              Les variables attendues sont décrites dans <code>.env.example</code>{' '}
              et le schéma SQL dans <code>supabase/schema.sql</code>.
            </p>
          </Notice>
        )}

        {placeholders.length > 0 && (
          <Notice tone="warn">
            <p>
              <strong className="font-semibold">
                {placeholders.length} emplacement
                {placeholders.length > 1 ? 's' : ''} de menu à renseigner.
              </strong>{' '}
              La carte officielle n’a pas pu être récupérée automatiquement :
              ces produits sont des espaces réservés, signalés comme tels sur le
              site public.
            </p>
            <Link
              href="/admin/menu"
              className="mt-2 inline-flex items-center gap-1.5 font-medium underline underline-offset-4"
            >
              Compléter la carte
            </Link>
          </Notice>
        )}

        {/* Cartes statistiques */}
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {stats.map((stat) => (
            <li key={stat.label}>
              <Link
                href={stat.href}
                className="hairline group flex h-full flex-col justify-between gap-4 rounded-2xl border border-line bg-elevated/40 p-4 transition-colors duration-300 hover:border-lime/30 sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium leading-snug text-fg-muted">
                    {stat.label}
                  </span>
                  <stat.icon
                    className="h-4 w-4 shrink-0 text-lime/60 transition-colors group-hover:text-lime"
                    aria-hidden="true"
                  />
                </div>

                <p className="font-display text-3xl font-semibold tabular-nums text-cream">
                  {stat.value}
                  {stat.total !== stat.value && (
                    <span className="ml-1 text-sm font-normal text-fg-subtle">
                      / {stat.total}
                    </span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card
            title="Dernières demandes"
            description="Les réservations reçues depuis le site."
          >
            {reservations.length === 0 ? (
              <p className="text-sm text-fg-muted">
                Aucune demande pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {reservations.slice(0, 5).map((reservation) => (
                  <li
                    key={reservation.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-cream">
                        {reservation.name}
                      </p>
                      <p className="text-xs text-fg-subtle">
                        {reservation.guests} pers. · {reservation.date} à{' '}
                        {reservation.time}
                      </p>
                    </div>
                    <span
                      className={
                        reservation.status === 'pending'
                          ? 'shrink-0 rounded-full bg-warn/15 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-warn'
                          : reservation.status === 'confirmed'
                            ? 'shrink-0 rounded-full bg-ok/15 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-ok'
                            : 'shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-fg-subtle'
                      }
                    >
                      {reservation.status === 'pending'
                        ? 'En attente'
                        : reservation.status === 'confirmed'
                          ? 'Confirmée'
                          : 'Annulée'}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {reservations.length > 5 && (
              <Link
                href="/admin/reservations"
                className="mt-4 inline-block text-sm text-lime underline underline-offset-4"
              >
                Voir les {reservations.length} demandes
              </Link>
            )}
          </Card>

          <Card
            title="État du contenu"
            description="Ce qui est publié sur le site public."
          >
            <ul className="space-y-2.5 text-sm">
              <ContentRow
                label="Sections éditoriales actives"
                value={`${content.sections.filter((s) => s.enabled).length} / ${content.sections.length}`}
              />
              <ContentRow
                label="Réservation en ligne"
                value={content.reservation.enabled ? 'Activée' : 'Désactivée'}
                tone={content.reservation.enabled ? 'ok' : 'muted'}
              />
              <ContentRow
                label="Réseaux sociaux publiés"
                value={String(
                  content.socials.filter((s) => s.enabled && s.url).length,
                )}
              />
              <ContentRow
                label="Scène 3D du hero"
                value={content.hero.enable3d ? 'Activée' : 'Désactivée'}
                tone={content.hero.enable3d ? 'ok' : 'muted'}
              />
              <ContentRow
                label="Mode maintenance"
                value={content.settings.maintenanceMode ? 'Actif' : 'Inactif'}
                tone={content.settings.maintenanceMode ? 'warn' : 'muted'}
              />
              <ContentRow
                label="Stockage"
                value={storage.kind === 'supabase' ? 'Supabase' : 'Fichier local'}
                tone={storage.kind === 'supabase' ? 'ok' : 'warn'}
              />
            </ul>

            {reservations[0] && (
              <p className="mt-5 border-t border-line pt-4 text-xs text-fg-subtle">
                Dernière activité : {formatDateTime(reservations[0].createdAt)}
              </p>
            )}
          </Card>
        </div>

        <Card
          title="Pour aller plus loin"
          description="Les actions les plus utiles au démarrage."
        >
          <ul className="grid gap-2.5 sm:grid-cols-2">
            <QuickLink
              href="/admin/menu"
              icon={UtensilsCrossed}
              title="Saisir la carte officielle"
              description="Remplacer les emplacements par vos vrais produits et prix."
            />
            <QuickLink
              href="/admin/gallery"
              icon={Images}
              title="Ajouter des photos"
              description="La galerie n’apparaît sur le site qu’une fois alimentée."
            />
            <QuickLink
              href="/admin/settings"
              icon={Sparkles}
              title="Installer le logo officiel"
              description="Téléversez le logo : header, hero, 3D et footer suivent."
            />
            <QuickLink
              href="/admin/contact"
              icon={AlertTriangle}
              title="Compléter les coordonnées"
              description="Adresse, téléphone, WhatsApp et horaires d’ouverture."
            />
          </ul>
        </Card>
      </div>
    </>
  );
}

function ContentRow({
  label,
  value,
  tone = 'muted',
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'warn' | 'muted';
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-line pb-2.5 last:border-0 last:pb-0">
      <span className="text-fg-muted">{label}</span>
      <span
        className={
          tone === 'ok'
            ? 'font-medium text-ok'
            : tone === 'warn'
              ? 'font-medium text-warn'
              : 'font-medium text-cream'
        }
      >
        {value}
      </span>
    </li>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Images;
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex h-full gap-3 rounded-xl border border-line bg-ink/40 p-4 transition-colors duration-300 hover:border-lime/30"
      >
        <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-lime" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-cream">{title}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-fg-subtle">
            {description}
          </span>
        </span>
      </Link>
    </li>
  );
}
