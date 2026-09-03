'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

import { MediaPicker } from '@/components/admin/media-picker';
import {
  AdminButton,
  Card,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
  Toggle,
} from '@/components/admin/ui';
import { useCollection } from '@/hooks/use-collection';
import { cn, slugify } from '@/lib/utils';
import type { ContentSection } from '@/types/content';

/**
 * Sections éditoriales (Notre univers, Coffee, Brunch, Expérience…).
 *
 * Chaque section correspond à une ancre du site public : la clé `coffee`
 * produit `#coffee`, reprise par le menu de navigation. Renommer la clé change
 * donc le lien — c'est signalé dans l'aide du champ.
 */
export function SectionsManager({ initial }: { initial: ContentSection[] }) {
  const { rows, create, update, remove, move, pendingId, creating } =
    useCollection('sections', initial);
  const [openId, setOpenId] = useState<string | null>(null);

  async function onAdd() {
    const created = await create({
      key: `section-${rows.length + 1}`,
      eyebrow: '',
      title: 'Nouvelle section',
      body: '',
      imageUrl: '',
      highlights: [],
      layout: rows.length % 2 === 0 ? 'right' : 'left',
      position: rows.length + 1,
      enabled: false,
    });
    if (created) setOpenId(created.id);
  }

  return (
    <Card
      title="Sections éditoriales"
      description="Les blocs texte + image qui rythment la page d’accueil."
      action={
        <AdminButton variant="primary" loading={creating} onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Ajouter
        </AdminButton>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          title="Aucune section"
          description="Ajoutez une section pour raconter le lieu, le café ou le brunch."
        />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((section, index) => {
            const open = openId === section.id;
            const busy = pendingId === section.id;

            return (
              <li
                key={section.id}
                className={cn(
                  'overflow-hidden rounded-xl border border-line bg-ink/40 transition-opacity',
                  busy && 'opacity-60',
                )}
              >
                <div className="flex items-center gap-2 p-3">
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      onClick={() => move(section.id, -1)}
                      disabled={index === 0 || busy}
                      aria-label="Monter"
                      className="rounded p-0.5 text-fg-subtle transition-colors hover:text-lime disabled:opacity-25"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(section.id, 1)}
                      disabled={index === rows.length - 1 || busy}
                      aria-label="Descendre"
                      className="rounded p-0.5 text-fg-subtle transition-colors hover:text-lime disabled:opacity-25"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : section.id)}
                    aria-expanded={open}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-medium text-cream">
                      {section.title || 'Sans titre'}
                    </span>
                    <span className="block truncate text-xs text-fg-subtle">
                      #{section.key}
                      {section.enabled ? '' : ' · masquée'}
                    </span>
                  </button>

                  <span className="shrink-0">
                    <Toggle
                      checked={section.enabled}
                      disabled={busy}
                      label={`Afficher la section ${section.title}`}
                      onChange={(enabled) =>
                        update(section.id, { enabled }, true)
                      }
                    />
                  </span>
                </div>

                {open && (
                  <div className="space-y-4 border-t border-line p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Surtitre"
                        htmlFor={`eyebrow-${section.id}`}
                        help="Affiché en italique au-dessus du titre."
                      >
                        <Input
                          id={`eyebrow-${section.id}`}
                          defaultValue={section.eyebrow}
                          onBlur={(event) =>
                            event.target.value !== section.eyebrow &&
                            update(section.id, { eyebrow: event.target.value })
                          }
                        />
                      </Field>

                      <Field
                        label="Identifiant / ancre"
                        htmlFor={`key-${section.id}`}
                        help="Sert de lien : #coffee, #brunch…"
                      >
                        <Input
                          id={`key-${section.id}`}
                          defaultValue={section.key}
                          onBlur={(event) => {
                            const value = slugify(event.target.value);
                            event.target.value = value;
                            if (value !== section.key) {
                              update(section.id, { key: value });
                            }
                          }}
                        />
                      </Field>
                    </div>

                    <Field label="Titre" htmlFor={`title-${section.id}`}>
                      <Input
                        id={`title-${section.id}`}
                        defaultValue={section.title}
                        onBlur={(event) =>
                          event.target.value !== section.title &&
                          update(section.id, { title: event.target.value })
                        }
                      />
                    </Field>

                    <Field label="Texte" htmlFor={`body-${section.id}`}>
                      <Textarea
                        id={`body-${section.id}`}
                        rows={4}
                        defaultValue={section.body}
                        onBlur={(event) =>
                          event.target.value !== section.body &&
                          update(section.id, { body: event.target.value })
                        }
                      />
                    </Field>

                    <Field
                      label="Points forts"
                      htmlFor={`highlights-${section.id}`}
                      help="Un point par ligne. Affichés en liste à puces cochées."
                    >
                      <Textarea
                        id={`highlights-${section.id}`}
                        rows={3}
                        defaultValue={section.highlights.join('\n')}
                        onBlur={(event) => {
                          const next = event.target.value
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .slice(0, 8);
                          if (
                            next.join('\n') !== section.highlights.join('\n')
                          ) {
                            update(section.id, { highlights: next });
                          }
                        }}
                      />
                    </Field>

                    <MediaPicker
                      label="Image"
                      accept="image"
                      folder="content"
                      value={section.imageUrl}
                      onChange={(url) => update(section.id, { imageUrl: url })}
                    />

                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <Field
                        label="Position de l’image"
                        htmlFor={`layout-${section.id}`}
                        className="w-44"
                      >
                        <Select
                          id={`layout-${section.id}`}
                          value={section.layout}
                          onChange={(event) =>
                            update(section.id, {
                              layout: event.target.value as 'left' | 'right',
                            })
                          }
                        >
                          <option value="left">À gauche</option>
                          <option value="right">À droite</option>
                        </Select>
                      </Field>

                      <ConfirmButton
                        onConfirm={() => remove(section.id)}
                        confirmLabel="Supprimer définitivement ?"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </ConfirmButton>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
