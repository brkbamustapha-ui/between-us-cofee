'use client';

import { useMemo, useState } from 'react';
import { Check, MessageCircle, Phone, Trash2, X } from 'lucide-react';

import {
  AdminButton,
  Card,
  ConfirmButton,
  EmptyState,
  Notice,
} from '@/components/admin/ui';
import { useCollection } from '@/hooks/use-collection';
import { cn, formatDateTime, telHref, whatsappHref } from '@/lib/utils';
import type { Reservation, ReservationStatus } from '@/types/content';

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
};

const STATUS_STYLES: Record<ReservationStatus, string> = {
  pending: 'bg-warn/15 text-warn',
  confirmed: 'bg-ok/15 text-ok',
  cancelled: 'bg-white/8 text-fg-subtle',
};

/**
 * Demandes de réservation reçues depuis le site.
 *
 * Chaque ligne offre les deux gestes utiles immédiatement : rappeler le client
 * ou lui répondre sur WhatsApp avec un message déjà rédigé.
 */
export function ReservationsManager({ initial }: { initial: Reservation[] }) {
  const { rows, update, remove, pendingId } = useCollection(
    'reservations',
    initial,
  );
  const [filter, setFilter] = useState<ReservationStatus | 'all'>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? rows : rows.filter((row) => row.status === filter)),
    [rows, filter],
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((row) => row.status === 'pending').length,
      confirmed: rows.filter((row) => row.status === 'confirmed').length,
      cancelled: rows.filter((row) => row.status === 'cancelled').length,
    }),
    [rows],
  );

  return (
    <div className="space-y-5">
      <Notice tone="info">
        Les demandes arrivent ici dès qu’un visiteur envoie le formulaire.
        Confirmez-les auprès du client par téléphone ou WhatsApp, puis marquez-les
        comme confirmées pour garder une vue claire.
      </Notice>

      <Card title="Demandes">
        <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(
            (value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  'flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors duration-200',
                  filter === value
                    ? 'border-lime bg-lime text-on-lime'
                    : 'border-line-strong text-fg-muted hover:text-cream',
                )}
              >
                {value === 'all' ? 'Toutes' : STATUS_LABELS[value]}
                <span className="text-[0.6875rem] tabular-nums opacity-60">
                  {counts[value]}
                </span>
              </button>
            ),
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Aucune demande"
            description={
              filter === 'all'
                ? 'Les réservations envoyées depuis le site apparaîtront ici.'
                : 'Aucune demande avec ce statut.'
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {filtered.map((reservation) => {
              const busy = pendingId === reservation.id;
              const message = `Bonjour ${reservation.name}, votre réservation pour ${reservation.guests} personne(s) le ${reservation.date} à ${reservation.time} est confirmée. À très vite — Between Us.`;

              return (
                <li
                  key={reservation.id}
                  className={cn(
                    'rounded-xl border border-line bg-ink/40 p-4 transition-opacity',
                    busy && 'opacity-60',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-cream">
                          {reservation.name}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide',
                            STATUS_STYLES[reservation.status],
                          )}
                        >
                          {STATUS_LABELS[reservation.status]}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-fg-muted">
                        {reservation.guests} personne
                        {reservation.guests > 1 ? 's' : ''} · {reservation.date}{' '}
                        à {reservation.time}
                      </p>
                      <p className="mt-0.5 text-xs text-fg-subtle">
                        {reservation.phone} · reçue le{' '}
                        {formatDateTime(reservation.createdAt)}
                      </p>
                      {reservation.message && (
                        <p className="mt-2 rounded-lg bg-ink px-3 py-2 text-xs leading-relaxed text-fg-muted">
                          {reservation.message}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-1.5">
                      <a
                        href={telHref(reservation.phone)}
                        aria-label={`Appeler ${reservation.name}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong text-cream transition-colors hover:bg-white/5"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                      <a
                        href={whatsappHref(reservation.phone, message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Répondre à ${reservation.name} sur WhatsApp`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong text-lime transition-colors hover:bg-lime/10"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                    {reservation.status !== 'confirmed' && (
                      <AdminButton
                        disabled={busy}
                        onClick={() =>
                          update(reservation.id, { status: 'confirmed' })
                        }
                        className="h-9 text-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Confirmer
                      </AdminButton>
                    )}
                    {reservation.status !== 'cancelled' && (
                      <AdminButton
                        disabled={busy}
                        onClick={() =>
                          update(reservation.id, { status: 'cancelled' })
                        }
                        className="h-9 text-xs"
                      >
                        <X className="h-3.5 w-3.5" />
                        Annuler
                      </AdminButton>
                    )}
                    <ConfirmButton
                      onConfirm={() => remove(reservation.id)}
                      confirmLabel="Confirmer ?"
                      className="h-9 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </ConfirmButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
