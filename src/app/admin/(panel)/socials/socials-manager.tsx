'use client';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

import {
  AdminButton,
  Card,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  Notice,
  Select,
  Toggle,
} from '@/components/admin/ui';
import { SOCIAL_ICONS } from '@/components/site/social-icons';
import { useCollection } from '@/hooks/use-collection';
import { cn } from '@/lib/utils';
import {
  SOCIAL_LABELS,
  SOCIAL_PLATFORMS,
  type SocialLink,
  type SocialPlatform,
} from '@/types/content';

/**
 * Réseaux sociaux.
 *
 * Un lien vide ou désactivé n'apparaît nulle part sur le site — ni dans la
 * section Contact, ni dans le footer. Pas d'icône morte.
 */
export function SocialsManager({ initial }: { initial: SocialLink[] }) {
  const { rows, create, update, remove, move, pendingId, creating } =
    useCollection('socials', initial);

  const used = new Set(rows.map((row) => row.platform));
  const available = SOCIAL_PLATFORMS.filter((platform) => !used.has(platform));

  return (
    <div className="space-y-5">
      <Notice tone="info">
        Pour WhatsApp, un simple numéro suffit (par exemple{' '}
        <code>0X XX XX XX XX</code>) : le lien <code>wa.me</code> est construit
        automatiquement. Pour les autres réseaux, collez l’URL complète du
        profil.
      </Notice>

      <Card
        title="Liens"
        action={
          <AdminButton
            variant="primary"
            loading={creating}
            disabled={available.length === 0}
            onClick={() =>
              create({
                platform: available[0] ?? 'instagram',
                url: '',
                handle: '',
                position: rows.length + 1,
                enabled: false,
              })
            }
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </AdminButton>
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            title="Aucun réseau social"
            description="Ajoutez Instagram, TikTok, Facebook ou WhatsApp."
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((link, index) => {
              const busy = pendingId === link.id;
              const Icon = SOCIAL_ICONS[link.platform];

              return (
                <li
                  key={link.id}
                  className={cn(
                    'rounded-xl border border-line bg-ink/40 p-4 transition-opacity',
                    busy && 'opacity-60',
                  )}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime/12 text-lime">
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1 text-sm font-medium text-cream">
                      {SOCIAL_LABELS[link.platform]}
                    </span>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(link.id, -1)}
                        disabled={index === 0 || busy}
                        aria-label="Monter"
                        className="rounded p-1 text-fg-subtle transition-colors hover:text-lime disabled:opacity-25"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(link.id, 1)}
                        disabled={index === rows.length - 1 || busy}
                        aria-label="Descendre"
                        className="rounded p-1 text-fg-subtle transition-colors hover:text-lime disabled:opacity-25"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                    <Field label="Réseau" htmlFor={`platform-${link.id}`}>
                      <Select
                        id={`platform-${link.id}`}
                        value={link.platform}
                        disabled={busy}
                        onChange={(event) =>
                          update(
                            link.id,
                            { platform: event.target.value as SocialPlatform },
                            true,
                          )
                        }
                      >
                        {SOCIAL_PLATFORMS.map((platform) => (
                          <option key={platform} value={platform}>
                            {SOCIAL_LABELS[platform]}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field
                      label={
                        link.platform === 'whatsapp' ? 'Numéro ou URL' : 'URL du profil'
                      }
                      htmlFor={`url-${link.id}`}
                    >
                      <Input
                        id={`url-${link.id}`}
                        defaultValue={link.url}
                        placeholder={
                          link.platform === 'whatsapp'
                            ? '0X XX XX XX XX'
                            : 'https://instagram.com/…'
                        }
                        onBlur={(event) =>
                          event.target.value !== link.url &&
                          update(link.id, { url: event.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <Field
                    label="Identifiant affiché (facultatif)"
                    htmlFor={`handle-${link.id}`}
                    className="mt-3"
                  >
                    <Input
                      id={`handle-${link.id}`}
                      defaultValue={link.handle}
                      placeholder="@betweenus"
                      onBlur={(event) =>
                        event.target.value !== link.handle &&
                        update(link.id, { handle: event.target.value }, true)
                      }
                    />
                  </Field>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                    <Toggle
                      checked={link.enabled}
                      disabled={busy || !link.url}
                      label="Afficher sur le site"
                      description={!link.url ? 'Renseignez d’abord l’URL.' : undefined}
                      onChange={(enabled) => update(link.id, { enabled }, true)}
                    />
                    <ConfirmButton
                      onConfirm={() => remove(link.id)}
                      confirmLabel="Confirmer ?"
                      className="h-9 px-3 text-xs"
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
