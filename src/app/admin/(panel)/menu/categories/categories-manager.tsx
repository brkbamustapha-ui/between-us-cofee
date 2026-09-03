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
  Notice,
  Textarea,
  Toggle,
} from '@/components/admin/ui';
import { useCollection } from '@/hooks/use-collection';
import { cn, slugify } from '@/lib/utils';
import type { MenuCategory, MenuItem } from '@/types/content';

/**
 * Catégories du menu.
 *
 * Supprimer une catégorie supprime aussi ses produits — le nombre est affiché
 * dans la confirmation pour que la conséquence soit explicite avant le clic.
 */
export function CategoriesManager({
  initial,
  items,
}: {
  initial: MenuCategory[];
  items: MenuItem[];
}) {
  const { rows, create, update, remove, move, pendingId, creating } =
    useCollection('categories', initial);
  const [openId, setOpenId] = useState<string | null>(null);

  async function onAdd() {
    const index = rows.length + 1;
    const created = await create({
      name: `Catégorie ${index}`,
      slug: `categorie-${index}`,
      description: '',
      imageUrl: '',
      position: index,
      enabled: true,
    });
    if (created) setOpenId(created.id);
  }

  function countItems(categoryId: string): number {
    return items.filter((item) => item.categoryId === categoryId).length;
  }

  return (
    <div className="space-y-5">
      <Notice tone="info">
        L’ordre défini ici est celui du rail de catégories sur le site public,
        sur mobile comme sur desktop.
      </Notice>

      <Card
        title="Catégories"
        action={
          <AdminButton variant="primary" loading={creating} onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Ajouter
          </AdminButton>
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            title="Aucune catégorie"
            description="Créez une première catégorie (Coffee, Brunch, Sweet…) pour pouvoir ajouter des produits."
          />
        ) : (
          <ul className="space-y-2.5">
            {rows.map((category, index) => {
              const open = openId === category.id;
              const busy = pendingId === category.id;
              const count = countItems(category.id);

              return (
                <li
                  key={category.id}
                  className={cn(
                    'overflow-hidden rounded-xl border border-line bg-ink/40 transition-opacity',
                    busy && 'opacity-60',
                  )}
                >
                  <div className="flex items-center gap-2 p-3">
                    <div className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        onClick={() => move(category.id, -1)}
                        disabled={index === 0 || busy}
                        aria-label="Monter"
                        className="rounded p-0.5 text-fg-subtle transition-colors hover:text-lime disabled:opacity-25"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(category.id, 1)}
                        disabled={index === rows.length - 1 || busy}
                        aria-label="Descendre"
                        className="rounded p-0.5 text-fg-subtle transition-colors hover:text-lime disabled:opacity-25"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : category.id)}
                      aria-expanded={open}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-medium text-cream">
                        {category.name}
                      </span>
                      <span className="block truncate text-xs text-fg-subtle">
                        {count} produit{count > 1 ? 's' : ''} · /{category.slug}
                        {category.enabled ? '' : ' · masquée'}
                      </span>
                    </button>

                    <span className="shrink-0">
                      <Toggle
                        checked={category.enabled}
                        disabled={busy}
                        label={`Afficher la catégorie ${category.name}`}
                        onChange={(enabled) =>
                          update(category.id, { enabled }, true)
                        }
                      />
                    </span>
                  </div>

                  {open && (
                    <div className="space-y-4 border-t border-line p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nom" htmlFor={`cat-name-${category.id}`}>
                          <Input
                            id={`cat-name-${category.id}`}
                            defaultValue={category.name}
                            onBlur={(event) =>
                              event.target.value !== category.name &&
                              update(category.id, { name: event.target.value })
                            }
                          />
                        </Field>

                        <Field
                          label="Slug"
                          htmlFor={`cat-slug-${category.id}`}
                          help="Identifiant technique unique, en minuscules."
                        >
                          <Input
                            id={`cat-slug-${category.id}`}
                            defaultValue={category.slug}
                            onBlur={(event) => {
                              const value = slugify(event.target.value);
                              event.target.value = value;
                              if (value !== category.slug) {
                                update(category.id, { slug: value });
                              }
                            }}
                          />
                        </Field>
                      </div>

                      <Field
                        label="Description"
                        htmlFor={`cat-desc-${category.id}`}
                        help="Affichée en italique au-dessus des produits."
                      >
                        <Textarea
                          id={`cat-desc-${category.id}`}
                          rows={2}
                          defaultValue={category.description}
                          onBlur={(event) =>
                            event.target.value !== category.description &&
                            update(category.id, {
                              description: event.target.value,
                            })
                          }
                        />
                      </Field>

                      <MediaPicker
                        label="Image de catégorie (facultative)"
                        accept="image"
                        folder="menu"
                        value={category.imageUrl}
                        onChange={(url) =>
                          update(category.id, { imageUrl: url })
                        }
                      />

                      <div className="flex justify-end">
                        <ConfirmButton
                          onConfirm={() => remove(category.id)}
                          confirmLabel={
                            count > 0
                              ? `Supprimer avec ses ${count} produits ?`
                              : 'Supprimer définitivement ?'
                          }
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
    </div>
  );
}
