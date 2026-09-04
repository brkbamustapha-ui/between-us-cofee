'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, Coffee, X } from 'lucide-react';

import { MenuBadgePill, PlaceholderPill } from '@/components/ui/badge';
import { SectionHeading } from '@/components/ui/section-heading';
import { cn, formatPrice } from '@/lib/utils';
import type { MenuCategory, MenuItem } from '@/types/content';

/**
 * Carte Between Us.
 *
 * Sur mobile : un rail de catégories qui défile horizontalement et colle sous
 * l'en-tête, puis une grille d'une colonne. Sur desktop : deux à trois colonnes.
 * Un clic sur un produit ouvre sa fiche.
 *
 * Le filtrage se fait en mémoire — aucun aller-retour réseau au changement de
 * catégorie, ce qui rend la navigation instantanée même sur un réseau lent.
 */
export function MenuSection({
  categories,
  items,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
}) {
  const visibleCategories = useMemo(
    () => categories.filter((category) => category.enabled),
    [categories],
  );

  const [activeId, setActiveId] = useState(
    () => visibleCategories[0]?.id ?? '',
  );
  const [selected, setSelected] = useState<MenuItem | null>(null);

  // Si la catégorie active disparaît (désactivée dans le dashboard), on retombe
  // proprement sur la première disponible.
  useEffect(() => {
    if (visibleCategories.length === 0) return;
    if (!visibleCategories.some((category) => category.id === activeId)) {
      setActiveId(visibleCategories[0]!.id);
    }
  }, [visibleCategories, activeId]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of items) {
      if (!item.enabled) continue;
      const list = map.get(item.categoryId);
      if (list) list.push(item);
      else map.set(item.categoryId, [item]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [items]);

  const activeItems = itemsByCategory.get(activeId) ?? [];
  // Tant qu'aucun produit de la catégorie n'a de photo, les cartes passent en
  // version typographique : 78 vignettes grises identiques donnaient au menu un
  // air vide, alors qu'une carte de restaurant se lit très bien sans images.
  const categoryHasPhotos = activeItems.some((item) => item.imageUrl);
  const activeCategory = visibleCategories.find(
    (category) => category.id === activeId,
  );
  const hasPlaceholders = items.some(
    (item) => item.enabled && item.isPlaceholder,
  );

  if (visibleCategories.length === 0) return null;

  return (
    <section id="menu" className="section-y relative scroll-mt-20">
      <div className="container-x">
        <SectionHeading
          eyebrow="La carte"
          title="Notre menu"
          description="Cafés, boissons glacées, brunch et douceurs. Sélectionnez une catégorie pour parcourir la carte."
        />

        {hasPlaceholders && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-warn/25 bg-warn/[0.07] p-4 text-sm text-warn sm:p-5">
            <AlertTriangle
              className="mt-0.5 h-4.5 w-4.5 shrink-0"
              aria-hidden="true"
            />
            <p className="leading-relaxed">
              <strong className="font-semibold">Carte en cours de mise à jour.</strong>{' '}
              Certains emplacements attendent encore leurs produits et leurs prix
              officiels. Ils sont signalés ci-dessous et se remplissent depuis le
              dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Rail de catégories — pleine largeur sur mobile pour un défilement naturel */}
      <div className="sticky top-16 z-30 mt-8 border-y border-line bg-ink/90 py-3 backdrop-blur-xl sm:top-18">
        <div className="container-x">
          <div
            className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5"
            role="tablist"
            aria-label="Catégories du menu"
          >
            {visibleCategories.map((category) => {
              const isActive = category.id === activeId;
              const count = itemsByCategory.get(category.id)?.length ?? 0;

              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveId(category.id)}
                  className={cn(
                    'flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'border-lime bg-lime text-on-lime'
                      : 'border-line-strong text-fg-muted hover:border-lime/40 hover:text-cream',
                  )}
                >
                  {category.name}
                  <span
                    className={cn(
                      'text-[0.6875rem] tabular-nums',
                      isActive ? 'text-on-lime/60' : 'text-fg-subtle',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container-x mt-10">
        {/* Bandeau de section : la photo de la catégorie, si elle a été
            renseignée dans le dashboard, sinon le seul texte. `photo-wash`
            aligne la photo sur la palette et garantit la lisibilité du texte
            posé dessus, quelle que soit l'image téléversée. */}
        {activeCategory?.imageUrl ? (
          <div className="photo-wash photo-scrim relative mb-8 aspect-16/9 w-full overflow-hidden rounded-[2rem] border border-line sm:aspect-21/8">
            <Image
              key={activeCategory.id}
              src={activeCategory.imageUrl}
              alt={activeCategory.name}
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              loading="lazy"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-8">
              <h3 className="font-display text-xl font-semibold text-cream sm:text-2xl">
                {activeCategory.name}
              </h3>
              {activeCategory.description && (
                <p className="mt-1 max-w-xl font-serif text-sm italic text-cream/85 sm:text-base">
                  {activeCategory.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          activeCategory?.description && (
            <p className="mb-7 max-w-xl font-serif text-base italic text-fg-muted">
              {activeCategory.description}
            </p>
          )
        )}

        {activeItems.length === 0 ? (
          <p className="rounded-2xl border border-line bg-elevated/30 px-5 py-10 text-center text-sm text-fg-muted">
            Aucun produit dans cette catégorie pour le moment.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {activeItems.map((item, index) => (
              <MenuCard
                key={item.id}
                item={item}
                index={index}
                showImage={categoryHasPhotos}
                onOpen={() => setSelected(item)}
              />
            ))}
          </ul>
        )}
      </div>

      <MenuItemDialog item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Carte produit                                                              */
/* -------------------------------------------------------------------------- */

function MenuCard({
  item,
  index,
  showImage,
  onOpen,
}: {
  item: MenuItem;
  index: number;
  /** Faux quand aucun produit de la catégorie n'a de photo. */
  showImage: boolean;
  onOpen: () => void;
}) {
  return (
    // Entrée en CSS plutôt qu'en JavaScript : une carte doit rester lisible même
    // si le script ne s'exécute pas. Le décalage est plafonné, le dernier
    // produit d'une longue liste n'attend jamais plus de 240 ms.
    <li
      className="bu-card-in"
      style={
        { '--bu-card-delay': `${Math.min(index * 40, 240)}ms` } as CSSProperties
      }
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'group hairline flex w-full items-stretch overflow-hidden rounded-3xl border border-line bg-elevated/40 text-left transition-all duration-500 hover:border-lime/30 hover:bg-elevated/70',
          showImage
            ? 'gap-4 p-3 sm:flex-col sm:gap-0 sm:p-0'
            : 'flex-col gap-0 p-5',
        )}
      >
        {showImage && (
        <div className="photo-wash relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-ink-deep sm:aspect-[4/3] sm:w-full sm:rounded-b-none sm:rounded-t-3xl">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              // Trois tailles réelles : mobile en vignette, tablette et desktop
              // en carte pleine largeur de colonne.
              sizes="(max-width: 640px) 96px, (max-width: 1280px) 50vw, 33vw"
              loading="lazy"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-elevated to-ink-deep">
              <Coffee
                className="h-6 w-6 text-lime/25 sm:h-9 sm:w-9"
                aria-hidden="true"
              />
            </div>
          )}

          {item.badges.length > 0 && (
            <div className="absolute left-2 top-2 hidden flex-wrap gap-1.5 sm:flex">
              {item.badges.map((badge) => (
                <MenuBadgePill key={badge} badge={badge} />
              ))}
            </div>
          )}
        </div>
        )}

        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col justify-center',
            showImage && 'sm:p-5',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-base font-semibold leading-snug text-cream transition-colors duration-300 group-hover:text-lime sm:text-lg">
              {item.name}
            </h3>
            <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-lime sm:text-base">
              {formatPrice(item.price)}
            </span>
          </div>

          {item.description && (
            <p className="mt-1.5 line-clamp-2 text-[0.8125rem] leading-relaxed text-fg-muted sm:text-sm">
              {item.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {item.isPlaceholder && <PlaceholderPill />}
            {/* Avec photo, les badges sont posés dessus dès `sm` et n'ont pas à
                être répétés ici. Sans photo, il n'y a pas d'autre endroit où
                les afficher : ils restent visibles à toutes les tailles. */}
            <span className={cn('flex gap-1.5', showImage && 'sm:hidden')}>
              {item.badges.map((badge) => (
                <MenuBadgePill key={badge} badge={badge} />
              ))}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Fiche produit                                                              */
/* -------------------------------------------------------------------------- */

function MenuItemDialog({
  item,
  onClose,
}: {
  item: MenuItem | null;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!item) return;

    // Mémorise l'élément déclencheur pour lui rendre le focus à la fermeture.
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      returnFocusRef.current?.focus();
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fiche produit"
            className="absolute inset-0 bg-ink-deep/85 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fiche-produit-titre"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="safe-bottom relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-line bg-ink shadow-lift sm:rounded-[2rem]"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-ink/70 text-cream backdrop-blur-md transition-colors hover:bg-ink"
              aria-label="Fermer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {item.imageUrl ? (
              <div className="photo-wash relative aspect-[4/3] w-full overflow-hidden rounded-t-[2rem] bg-ink-deep">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 512px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-t-[2rem] bg-gradient-to-br from-elevated to-ink-deep">
                <Coffee className="h-10 w-10 text-lime/25" aria-hidden="true" />
              </div>
            )}

            <div className="p-6 sm:p-7">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {item.badges.map((badge) => (
                  <MenuBadgePill key={badge} badge={badge} />
                ))}
                {item.isPlaceholder && <PlaceholderPill />}
              </div>

              <h3
                id="fiche-produit-titre"
                className="text-2xl leading-tight sm:text-3xl"
              >
                {item.name}
              </h3>

              <p className="mt-3 font-display text-xl font-semibold text-lime">
                {formatPrice(item.price)}
              </p>

              {item.description && (
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-fg-muted">
                  {item.description}
                </p>
              )}

              <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-fg-subtle">
                Une question sur la composition, les allergènes ou une adaptation
                possible&nbsp;? Notre équipe y répond volontiers sur place.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
