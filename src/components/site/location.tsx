import { Clock, MapPin, Navigation } from 'lucide-react';

import { ButtonLink } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { DAY_NAMES, cn, directionsHref } from '@/lib/utils';
import type { ContactInfo } from '@/types/content';

/**
 * Section « Find Us » : adresse, horaires, carte et itinéraire.
 *
 * La carte n'est affichée que si une URL d'intégration a été renseignée dans le
 * dashboard — l'iframe est en `loading="lazy"`, elle ne pèse donc rien tant que
 * le visiteur n'a pas fait défiler jusqu'ici.
 */
export function Location({ contact }: { contact: ContactInfo }) {
  const fullAddress = [contact.addressLine, contact.city, contact.country]
    .filter(Boolean)
    .join(', ');

  const directions = directionsHref(fullAddress, contact.mapsUrl);

  // Ordre d'affichage : lundi → dimanche, plus lisible que l'index natif.
  const orderedHours = [1, 2, 3, 4, 5, 6, 0]
    .map((day) => contact.hours.find((hour) => hour.day === day))
    .filter((hour): hour is NonNullable<typeof hour> => Boolean(hour));

  const todayIndex = new Date().getDay();

  return (
    <section id="localisation" className="section-y scroll-mt-20">
      <div className="container-x">
        <SectionHeading
          eyebrow="Find us"
          title="Nous trouver"
          description={
            fullAddress ||
            'L’adresse exacte est en cours de mise à jour depuis le dashboard.'
          }
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-8">
          <Reveal>
            <div className="hairline flex h-full flex-col gap-7 rounded-[2rem] border border-line bg-elevated/40 p-6 sm:p-8">
              <div>
                <h3 className="flex items-center gap-2.5 font-display text-base font-semibold text-cream">
                  <MapPin className="h-4.5 w-4.5 text-lime" aria-hidden="true" />
                  Adresse
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-fg-muted">
                  {fullAddress || 'Adresse à renseigner.'}
                </p>

                {directions && (
                  <ButtonLink
                    href={directions}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Itinéraire
                  </ButtonLink>
                )}
              </div>

              {orderedHours.length > 0 && (
                <div className="border-t border-line pt-6">
                  <h3 className="flex items-center gap-2.5 font-display text-base font-semibold text-cream">
                    <Clock className="h-4.5 w-4.5 text-lime" aria-hidden="true" />
                    Horaires
                  </h3>

                  <dl className="mt-3.5 space-y-1.5">
                    {orderedHours.map((hour) => {
                      const isToday = hour.day === todayIndex;
                      return (
                        <div
                          key={hour.day}
                          className={cn(
                            'flex items-baseline justify-between gap-4 rounded-lg px-2 py-1 text-sm',
                            isToday && 'bg-lime/10',
                          )}
                        >
                          <dt
                            className={cn(
                              isToday ? 'font-medium text-lime' : 'text-fg-muted',
                            )}
                          >
                            {DAY_NAMES[hour.day]}
                            {isToday && (
                              <span className="ml-2 text-[0.625rem] uppercase tracking-[0.1em]">
                                aujourd’hui
                              </span>
                            )}
                          </dt>
                          <dd
                            className={cn(
                              'tabular-nums',
                              hour.closed
                                ? 'text-fg-subtle'
                                : isToday
                                  ? 'text-lime'
                                  : 'text-cream/80',
                            )}
                          >
                            {hour.closed
                              ? 'Fermé'
                              : `${hour.open} – ${hour.close}`}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>

                  {contact.hoursNote && (
                    <p className="mt-4 text-xs leading-relaxed text-fg-subtle">
                      {contact.hoursNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="relative h-full min-h-[20rem] overflow-hidden rounded-[2rem] border border-line bg-elevated/40">
              {contact.mapsEmbedUrl ? (
                <iframe
                  src={contact.mapsEmbedUrl}
                  title="Carte — Between Us Coffee & Brunch"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                /* Sans URL d'intégration, le panneau resterait une zone morte.
                   Tant qu'un lien Maps existe, on propose au moins d'ouvrir le
                   lieu dans l'application — le visiteur n'est jamais bloqué. */
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                  <MapPin className="h-8 w-8 text-lime/30" aria-hidden="true" />
                  {directions ? (
                    <>
                      <p className="max-w-xs text-sm leading-relaxed text-fg-subtle">
                        Ouvrez le lieu dans Google Maps pour obtenir l’itinéraire
                        depuis votre position.
                      </p>
                      <ButtonLink href={directions} variant="outline" size="sm">
                        <Navigation className="h-4 w-4" aria-hidden="true" />
                        Voir sur Google Maps
                      </ButtonLink>
                    </>
                  ) : (
                    <p className="max-w-xs text-sm leading-relaxed text-fg-subtle">
                      La carte s’affichera ici dès qu’un lien Google Maps aura
                      été ajouté dans le dashboard.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
