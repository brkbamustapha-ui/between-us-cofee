import { Mail, MessageCircle, Phone } from 'lucide-react';

import { ButtonLink } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { telHref, whatsappHref } from '@/lib/utils';
import type { ContactInfo, SocialLink } from '@/types/content';
import { SocialRow, usableSocials } from './socials';

/** Section Contact : les trois canaux directs, plus les réseaux. */
export function Contact({
  contact,
  socials,
}: {
  contact: ContactInfo;
  socials: SocialLink[];
}) {
  const channels = [
    contact.phone && {
      key: 'phone',
      icon: Phone,
      label: 'Téléphone',
      value: contact.phone,
      href: telHref(contact.phone),
    },
    contact.whatsapp && {
      key: 'whatsapp',
      icon: MessageCircle,
      label: 'WhatsApp',
      value: contact.whatsapp,
      href: whatsappHref(contact.whatsapp),
    },
    contact.email && {
      key: 'email',
      icon: Mail,
      label: 'E-mail',
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
  ].filter(Boolean) as {
    key: string;
    icon: typeof Phone;
    label: string;
    value: string;
    href: string;
  }[];

  const hasSocials = usableSocials(socials).length > 0;

  // Ni canal de contact ni réseau renseigné : mieux vaut ne rien afficher
  // qu'une section vide.
  if (channels.length === 0 && !hasSocials) return null;

  return (
    <section
      id="contact"
      className="section-y scroll-mt-20 border-t border-line bg-elevated/25"
    >
      <div className="container-x">
        <SectionHeading
          eyebrow="Contact"
          title="Parlons-en"
          description="Une question, une privatisation, un grand groupe ? Écrivez-nous, nous répondons vite."
          align="center"
        />

        {channels.length > 0 && (
          <ul className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {channels.map((channel, index) => (
              <Reveal as="li" key={channel.key} delay={index * 0.07}>
                <a
                  href={channel.href}
                  className="hairline group flex h-full flex-col items-center gap-3 rounded-3xl border border-line bg-ink p-6 text-center transition-colors duration-500 hover:border-lime/35"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-lime/12 text-lime transition-colors duration-500 group-hover:bg-lime group-hover:text-on-lime">
                    <channel.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">
                    {channel.label}
                  </span>
                  <span className="break-all font-display text-[0.9375rem] font-medium text-cream">
                    {channel.value}
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>
        )}

        {hasSocials && (
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-col items-center gap-4">
              <p className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
                Ou retrouvez-nous sur
              </p>
              <SocialRow socials={socials} className="justify-center" />
            </div>
          </Reveal>
        )}

        {contact.phone && (
          <Reveal delay={0.25}>
            <div className="mt-12 text-center">
              <ButtonLink href={telHref(contact.phone)} size="lg">
                <Phone className="h-4.5 w-4.5" />
                Nous appeler
              </ButtonLink>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
