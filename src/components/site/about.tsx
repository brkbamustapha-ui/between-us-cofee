import Image from 'next/image';
import { Quote } from 'lucide-react';

import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { AboutContent } from '@/types/content';

/** Section « À propos » : le récit du lieu, ses chiffres, ses images. */
export function About({ about }: { about: AboutContent }) {
  const paragraphs = about.paragraphs.filter((text) => text.trim());
  const stats = about.stats.filter((stat) => stat.value || stat.label);

  return (
    <section id="a-propos" className="section-y relative scroll-mt-20">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16">
          {/* Images — d'abord dans le DOM sur desktop uniquement, pour que le
              texte reste en tête de lecture sur mobile. */}
          <Reveal className="order-2 lg:order-1">
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line bg-elevated/40">
                {about.imageUrl ? (
                  <Image
                    src={about.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    loading="lazy"
                    className="object-cover"
                  />
                ) : (
                  <PlaceholderPanel label="Photo du lieu" />
                )}
              </div>

              {about.secondaryImageUrl && (
                <div className="absolute -bottom-8 -right-4 hidden aspect-square w-40 overflow-hidden rounded-3xl border-4 border-ink bg-elevated shadow-lift sm:block lg:w-48">
                  <Image
                    src={about.secondaryImageUrl}
                    alt=""
                    fill
                    sizes="192px"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
              )}

              <div
                aria-hidden="true"
                className="absolute -left-6 -top-6 -z-10 h-28 w-28 rounded-full bg-lime/10 blur-3xl"
              />
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow={about.eyebrow}
              title={about.title}
              className="max-w-none"
            />

            <div className="mt-6 space-y-4">
              {paragraphs.map((paragraph, index) => (
                <Reveal key={index} delay={0.06 * index}>
                  <p className="text-[0.9375rem] leading-relaxed text-fg-muted sm:text-base">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </div>

            {about.signature && (
              <Reveal delay={0.2}>
                <p className="mt-6 flex items-center gap-3 font-serif text-base italic text-cream">
                  <Quote className="h-4 w-4 text-lime" aria-hidden="true" />
                  {about.signature}
                </p>
              </Reveal>
            )}

            {stats.length > 0 && (
              <Reveal delay={0.25}>
                <dl className="mt-10 grid grid-cols-3 gap-3 border-t border-line pt-8 sm:gap-6">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <dt className="sr-only">{stat.label}</dt>
                      <dd>
                        <span className="block font-display text-2xl font-semibold text-lime sm:text-3xl">
                          {stat.value}
                        </span>
                        <span className="mt-1 block text-[0.6875rem] uppercase leading-snug tracking-[0.12em] text-fg-subtle sm:text-xs">
                          {stat.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Aplat de remplacement quand aucune photo n'a encore été téléversée. */
export function PlaceholderPanel({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-elevated to-ink-deep px-6 text-center">
      <span className="font-serif text-sm italic text-lime/40">Between Us</span>
      <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-fg-subtle">
        {label}
      </span>
    </div>
  );
}
