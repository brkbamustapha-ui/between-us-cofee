import Image from 'next/image';
import { Check } from 'lucide-react';

import { PlaceholderPanel } from './about';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';
import type { ContentSection } from '@/types/content';

/**
 * Sections éditoriales alternées (Notre univers, Coffee, Brunch, Expérience).
 *
 * Une seule mise en page, retournée une fois sur deux via `layout`, ce qui donne
 * un rythme visuel sans multiplier les composants. Chaque section est
 * entièrement pilotée depuis `/admin/content`.
 */
export function StorySections({ sections }: { sections: ContentSection[] }) {
  const visible = sections
    .filter((section) => section.enabled)
    .sort((a, b) => a.position - b.position);

  if (visible.length === 0) return null;

  return (
    <div className="relative">
      {visible.map((section, index) => (
        <StoryBlock
          key={section.id}
          section={section}
          // Fond alterné : une section sur deux se détache légèrement.
          tinted={index % 2 === 1}
        />
      ))}
    </div>
  );
}

function StoryBlock({
  section,
  tinted,
}: {
  section: ContentSection;
  tinted: boolean;
}) {
  const imageFirst = section.layout === 'left';

  return (
    <section
      id={section.key}
      className={cn(
        'section-y scroll-mt-20',
        tinted && 'bg-elevated/25',
      )}
    >
      <div className="container-x">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal
            className={cn(imageFirst ? 'lg:order-1' : 'lg:order-2')}
          >
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-line bg-elevated/40 sm:aspect-[16/11]">
              {section.imageUrl ? (
                <Image
                  src={section.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading="lazy"
                  className="object-cover"
                />
              ) : (
                <PlaceholderPanel label={section.eyebrow || section.title} />
              )}
            </div>
          </Reveal>

          <div className={cn(imageFirst ? 'lg:order-2' : 'lg:order-1')}>
            {section.eyebrow && (
              <Reveal>
                <p className="mb-4 flex items-center gap-3 font-serif text-sm italic text-lime">
                  <span aria-hidden="true" className="h-px w-8 bg-lime/50" />
                  {section.eyebrow}
                </p>
              </Reveal>
            )}

            <Reveal delay={0.05}>
              <h2 className="text-balance text-3xl leading-[1.1] sm:text-4xl">
                {section.title}
              </h2>
            </Reveal>

            {section.body && (
              <Reveal delay={0.1}>
                <p className="mt-5 text-[0.9375rem] leading-relaxed text-fg-muted sm:text-base">
                  {section.body}
                </p>
              </Reveal>
            )}

            {section.highlights.length > 0 && (
              <Reveal delay={0.15}>
                <ul className="mt-7 space-y-3">
                  {section.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime/15"
                      >
                        <Check className="h-3 w-3 text-lime" />
                      </span>
                      <span className="text-sm text-cream/85">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
