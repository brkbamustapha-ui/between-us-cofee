'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
import { cn, formatPrice } from '@/lib/utils';
import {
  MENU_BADGES,
  MENU_BADGE_LABELS,
  type MenuBadge,
  type MenuCategory,
  type MenuItem,
} from '@/types/content';
import { MenuImport } from './menu-import';

/**
 * Gestion de la carte.
 *
 * Le prix, la description, la photo et les badges se modifient produit par
 * produit ; le site public reflète chaque enregistrement immédiatement. Le
 * marqueur « emplacement à renseigner » se retire d'un clic une fois la donnée
 * officielle saisie.
 */
export function MenuManager({
  categories,
  items,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
}) {
  const {
    rows,
    create,
    update,
    remove,
    move,
    pendingId,
    creating,
  } = useCollection('items', items);

  const [activeCategory, setActiveCategory] = useState(
    () => categories[0]?.id ?? '',
  );
  const [openId, setOpenId] = useState<string | null>(null);

  const visibleItems = useMemo(
    () =>
      rows
        .filter((item) => item.categoryId === activeCategory)
        .sort((a, b) => a.position - b.position),
    [rows, activeCategory],
  );

  const placeholderCount = rows.filter((item) => item.isPlaceholder).length;

  async function onAdd() {
    if (!activeCategory) return;
    const created = await create({
      categoryId: activeCategory,
      name: 'Nouveau produit',
      description: '',
      price: null,
      imageUrl: '',
      badges: [],
      position: visibleItems.length + 1,
      enabled: true,
      isPlaceholder: false,
    });
    if (created) setOpenId(created.id);
  }

  if (categories.length === 0) {
    return (
      <Card title="Aucune catégorie">
        <EmptyState
          title="Créez d’abord une catégorie"
          description="Les produits appartiennent à une catégorie (Coffee, Brunch…). Commencez par en créer au moins une."
          action={
            <Link
              href="/admin/menu/categories"
              className="inline-flex h-10 items-center rounded-xl bg-lime px-4 text-sm font-medium text-on-lime"
            >
              Gérer les catégories
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {placeholderCount > 0 && (
        <Notice tone="warn">
          <p>
            <strong className="font-semibold">
              {placeholderCount} emplacement{placeholderCount > 1 ? 's' : ''} à
              renseigner.
            </strong>{' '}
            La carte officielle n’a pas pu être récupérée automatiquement lors
            de la création du site : ces produits sont des espaces réservés.
            Saisissez le vrai nom, la description et le prix, puis désactivez
            « emplacement à renseigner ».
          </p>
        </Notice>
      )}

      <MenuImport />

      <Card
        title="Produits"
        description="Sélectionnez une catégorie, puis modifiez ses produits."
        action={
          <AdminButton variant="primary" loading={creating} onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Ajouter
          </AdminButton>
        }
      >
        <div
          role="tablist"
          aria-label="Catégories"
          className="no-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {categories.map((category) => {
            const count = rows.filter(
              (item) => item.categoryId === category.id,
            ).length;

            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={category.id === activeCategory}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors duration-200',
                  category.id === activeCategory
                    ? 'border-lime bg-lime text-on-lime'
                    : 'border-line-strong text-fg-muted hover:text-cream',
                )}
              >
                {category.name}
                <span className="text-[0.6875rem] tabular-nums opacity-60">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {visibleItems.length === 0 ? (
          <EmptyState
            title="Catégorie vide"
            description="Ajoutez un premier produit à cette catégorie."
          />
        ) : (
          <ul className="space-y-2.5">
            {visibleItems.map((item, index) => {
              const open = openId === item.id;
              const busy = pendingId === item.id;

              return (
                <li
                  key={item.id}
                  className={cn(
                    'overflow-hidden rounded-xl border bg-ink/40 transition-opacity',
                    item.isPlaceholder
                      ? 'border-warn/25'
                      : 'border-line',
                    busy && 'opacity-60',
                  )}
                >
                  <div className="flex items-center gap-2 p-3">
                    <div className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        onClick={() => move(item.id, -1)}
                        disabled={index === 0 || busy}
                        aria-label="Monter"
                        className="rounded p-0.5 text-fg-subtle transition-colors hover:text-lime disabled:opacity-25"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(item.id, 1)}
                        disabled={index === visibleItems.length - 1 || busy}
                        aria-label="Descendre"
                        className="rounded p-0.5 text-fg-subtle transition-colors hover:text-lime disabled:opacity-25"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : item.id)}
                      aria-expanded={open}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-cream">
                          {item.name}
                        </span>
                        {item.isPlaceholder && (
                          <span className="shrink-0 rounded-full bg-warn/15 px-2 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wide text-warn">
                            à renseigner
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-fg-subtle">
                        {formatPrice(item.price)}
                        {item.badges.length > 0 &&
                          ` · ${item.badges
                            .map((badge) => MENU_BADGE_LABELS[badge])
                            .join(', ')}`}
                        {!item.enabled && ' · masqué'}
                      </span>
                    </button>

                    <span className="shrink-0">
                      <Toggle
                        checked={item.enabled}
                        disabled={busy}
                        label={`Afficher ${item.name}`}
                        onChange={(enabled) =>
                          update(item.id, { enabled }, true)
                        }
                      />
                    </span>
                  </div>

                  {open && (
                    <div className="space-y-4 border-t border-line p-4">
                      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
                        <Field label="Nom" htmlFor={`name-${item.id}`}>
                          <Input
                            id={`name-${item.id}`}
                            defaultValue={item.name}
                            onBlur={(event) =>
                              event.target.value !== item.name &&
                              update(item.id, { name: event.target.value })
                            }
                          />
                        </Field>

                        <Field
                          label="Prix (DA)"
                          htmlFor={`price-${item.id}`}
                          help="Vide = prix sur place"
                        >
                          <Input
                            id={`price-${item.id}`}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step={10}
                            defaultValue={item.price ?? ''}
                            onBlur={(event) => {
                              const raw = event.target.value.trim();
                              const next = raw === '' ? null : Number(raw);
                              if (next !== item.price) {
                                update(item.id, { price: next });
                              }
                            }}
                          />
                        </Field>
                      </div>

                      <Field
                        label="Description"
                        htmlFor={`description-${item.id}`}
                      >
                        <Textarea
                          id={`description-${item.id}`}
                          rows={3}
                          defaultValue={item.description}
                          onBlur={(event) =>
                            event.target.value !== item.description &&
                            update(item.id, { description: event.target.value })
                          }
                        />
                      </Field>

                      <MediaPicker
                        label="Photo du produit"
                        accept="image"
                        folder="menu"
                        aspect="aspect-[4/3]"
                        value={item.imageUrl}
                        onChange={(url) => update(item.id, { imageUrl: url })}
                      />

                      <fieldset>
                        <legend className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-fg-subtle">
                          Badges
                        </legend>
                        <div className="flex flex-wrap gap-2">
                          {MENU_BADGES.map((badge) => {
                            const checked = item.badges.includes(badge);
                            return (
                              <button
                                key={badge}
                                type="button"
                                aria-pressed={checked}
                                disabled={busy}
                                onClick={() => {
                                  const next: MenuBadge[] = checked
                                    ? item.badges.filter((b) => b !== badge)
                                    : [...item.badges, badge];
                                  update(item.id, { badges: next }, true);
                                }}
                                className={cn(
                                  'h-9 rounded-full border px-3.5 text-xs font-medium transition-colors duration-200',
                                  checked
                                    ? 'border-lime bg-lime text-on-lime'
                                    : 'border-line-strong text-fg-muted hover:text-cream',
                                )}
                              >
                                {MENU_BADGE_LABELS[badge]}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-xs text-fg-subtle">
                          « Best Seller » et « Recommended » font aussi remonter
                          le produit dans la section Best sellers du site.
                        </p>
                      </fieldset>

                      <div className="rounded-xl border border-line bg-ink/50 px-4 py-3">
                        <Toggle
                          checked={item.isPlaceholder}
                          disabled={busy}
                          label="Emplacement à renseigner"
                          description="Tant que c’est actif, le produit est signalé comme non vérifié sur le site public et exclu des données structurées."
                          onChange={(isPlaceholder) =>
                            update(item.id, { isPlaceholder }, true)
                          }
                        />
                      </div>

                      <div className="flex justify-end">
                        <ConfirmButton
                          onConfirm={() => remove(item.id)}
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
    </div>
  );
}
