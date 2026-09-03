import Image from 'next/image';
import { Coffee, Star } from 'lucide-react';

import { MenuBadgePill } from '@/components/ui/badge';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/types/content';

/**
 * Sélection mise en avant : tout produit portant le badge « Best Seller » ou
 * « Recommended » remonte ici automatiquement. Aucune liste séparée à tenir —
 * cocher le badge dans `/admin/menu` suffit.
 */
export function BestSellers({ items }: { items: MenuItem[] }) {
  const featured = items
    .filter(
      (item) =>
        item.enabled &&
        !item.isPlaceholder &&
        (item.badges.includes('best_seller') ||
          item.badges.includes('recommended')),
    )
    .sort((a, b) => a.position - b.position)
    .slice(0, 6);

  if (featured.length === 0) return null;

  return (
    <section
      id="best-sellers"
      className="section-y scroll-mt-20 border-y border-line bg-elevated/25"
    >
      <div className="container-x">
        <SectionHeading
          eyebrow="Les préférés de la maison"
          title="Best sellers"
          description="Ce que l’on nous commande le plus souvent — et ce que l’on vous conseille si c’est votre première visite."
        />

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {featured.map((item, index) => (
            <Reveal as="li" key={item.id} delay={index * 0.06}>
              <article className="hairline group h-full overflow-hidden rounded-3xl border border-line bg-ink transition-colors duration-500 hover:border-lime/30">
                <div className="relative aspect-[16/10] overflow-hidden bg-ink-deep">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading="lazy"
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-elevated to-ink-deep">
                      <Coffee className="h-9 w-9 text-lime/25" aria-hidden="true" />
                    </div>
                  )}

                  <span className="absolute left-3 top-3 flex gap-1.5">
                    {item.badges.map((badge) => (
                      <MenuBadgePill key={badge} badge={badge} />
                    ))}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold leading-snug text-cream">
                      {item.name}
                    </h3>
                    <Star
                      className="mt-1 h-4 w-4 shrink-0 fill-lime text-lime"
                      aria-hidden="true"
                    />
                  </div>

                  {item.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-fg-muted">
                      {item.description}
                    </p>
                  )}

                  <p className="mt-4 font-display text-base font-semibold text-lime">
                    {formatPrice(item.price)}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
