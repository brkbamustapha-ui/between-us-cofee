'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { CalendarCheck, CheckCircle2, Loader2, MessageCircle, Phone } from 'lucide-react';

import { Button, ButtonLink } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import {
  addDaysIso,
  cn,
  telHref,
  todayIso,
  whatsappHref,
} from '@/lib/utils';
import type { ReservationSettings } from '@/types/content';

/**
 * Formulaire de réservation.
 *
 * La demande est d'abord enregistrée côté serveur (elle apparaît dans
 * `/admin/reservations`), puis le visiteur se voit proposer de la confirmer par
 * WhatsApp avec un message pré-rempli. Aucun service tiers n'est requis : si
 * WhatsApp n'est pas renseigné, le numéro de téléphone prend le relais.
 */
export function Reservation({ settings }: { settings: ReservationSettings }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    name: string;
    guests: number;
    date: string;
    time: string;
    message: string;
  } | null>(null);

  const minDate = useMemo(() => todayIso(), []);
  const maxDate = useMemo(
    () => addDaysIso(settings.maxAdvanceDays),
    [settings.maxAdvanceDays],
  );

  const whatsappMessage = summary
    ? [
        `Bonjour Between Us, je souhaite réserver une table.`,
        `Nom : ${summary.name}`,
        `Personnes : ${summary.guests}`,
        `Date : ${summary.date} à ${summary.time}`,
        summary.message ? `Message : ${summary.message}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const whatsappLink = settings.whatsapp
    ? whatsappHref(settings.whatsapp, whatsappMessage)
    : '';
  const phoneLink = telHref(settings.phone);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setState('sending');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim(),
      guests: Number(form.get('guests') ?? 2),
      date: String(form.get('date') ?? ''),
      time: String(form.get('time') ?? ''),
      message: String(form.get('message') ?? '').trim(),
      website: String(form.get('website') ?? ''),
    };

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error ?? 'Envoi impossible. Réessayez.');
        setState('idle');
        return;
      }

      setSummary({
        name: payload.name,
        guests: payload.guests,
        date: payload.date,
        time: payload.time,
        message: payload.message,
      });
      setState('sent');
    } catch {
      setError(
        'Connexion impossible. Vérifiez votre réseau, ou contactez-nous directement.',
      );
      setState('idle');
    }
  }

  if (!settings.enabled) return null;

  return (
    <section id="reservation" className="section-y scroll-mt-20">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow={settings.eyebrow}
              title={settings.title}
              description={settings.description}
              className="max-w-none"
            />

            {settings.notice && (
              <Reveal delay={0.15}>
                <p className="mt-8 rounded-2xl border border-line bg-elevated/40 p-5 text-sm leading-relaxed text-fg-muted">
                  {settings.notice}
                </p>
              </Reveal>
            )}

            {(phoneLink || whatsappLink) && (
              <Reveal delay={0.2}>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {phoneLink && (
                    <ButtonLink href={phoneLink} variant="outline" size="md">
                      <Phone className="h-4 w-4" />
                      Appeler
                    </ButtonLink>
                  )}
                  {settings.whatsapp && (
                    <ButtonLink
                      href={whatsappHref(settings.whatsapp)}
                      variant="lime-ghost"
                      size="md"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </ButtonLink>
                  )}
                </div>
              </Reveal>
            )}
          </div>

          <Reveal delay={0.1}>
            <div className="hairline rounded-[2rem] border border-line bg-elevated/40 p-5 sm:p-8">
              {state === 'sent' ? (
                <div className="py-6 text-center">
                  <span className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-lime/15">
                    <CheckCircle2 className="h-7 w-7 text-lime" aria-hidden="true" />
                  </span>

                  <h3 className="text-xl">Demande envoyée</h3>
                  <p
                    className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-fg-muted"
                    role="status"
                  >
                    {settings.successMessage}
                  </p>

                  {whatsappLink && (
                    <ButtonLink
                      href={whatsappLink}
                      size="lg"
                      className="mt-7 w-full sm:w-auto"
                    >
                      <MessageCircle className="h-4.5 w-4.5" />
                      Confirmer sur WhatsApp
                    </ButtonLink>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setState('idle');
                      setSummary(null);
                    }}
                    className="mt-5 block w-full text-sm text-fg-subtle underline underline-offset-4 transition-colors hover:text-cream"
                  >
                    Faire une autre demande
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate={false}>
                  {/* Champ piège anti-robot : invisible et hors tabulation. */}
                  <div className="absolute left-[-9999px]" aria-hidden="true">
                    <label htmlFor="website">Ne pas remplir</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nom" htmlFor="name" className="sm:col-span-2">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        minLength={2}
                        maxLength={120}
                        autoComplete="name"
                        placeholder="Votre nom"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Téléphone" htmlFor="phone">
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="0X XX XX XX XX"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Personnes" htmlFor="guests">
                      <input
                        id="guests"
                        name="guests"
                        type="number"
                        required
                        inputMode="numeric"
                        min={settings.minGuests}
                        max={settings.maxGuests}
                        defaultValue={Math.min(2, settings.maxGuests)}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Date" htmlFor="date">
                      <input
                        id="date"
                        name="date"
                        type="date"
                        required
                        min={minDate}
                        max={maxDate}
                        defaultValue={minDate}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Heure" htmlFor="time">
                      <input
                        id="time"
                        name="time"
                        type="time"
                        required
                        min={settings.openingTime}
                        max={settings.closingTime}
                        defaultValue={settings.openingTime}
                        className={inputClass}
                      />
                    </Field>

                    <Field
                      label="Message (facultatif)"
                      htmlFor="message"
                      className="sm:col-span-2"
                    >
                      <textarea
                        id="message"
                        name="message"
                        rows={3}
                        maxLength={1000}
                        placeholder="Occasion particulière, table en terrasse, allergies…"
                        className={cn(inputClass, 'resize-y py-3')}
                      />
                    </Field>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={state === 'sending'}
                    className="mt-6 w-full"
                  >
                    {state === 'sending' ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Envoi…
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="h-4.5 w-4.5" />
                        Réserver
                      </>
                    )}
                  </Button>

                  <p className="mt-3 text-center text-xs text-fg-subtle">
                    Votre demande est confirmée par notre équipe avant d’être
                    définitive.
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const inputClass =
  'h-12 w-full rounded-xl border border-line bg-ink px-4 text-[0.9375rem] text-cream ' +
  'placeholder:text-fg-subtle transition-colors duration-300 ' +
  'focus:border-lime focus:outline-none focus-visible:outline-none ' +
  '[color-scheme:dark]';

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-fg-subtle"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
