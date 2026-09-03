import { LogoLockup } from '@/components/brand/logo';
import { DAY_NAMES_SHORT, telHref, whatsappHref } from '@/lib/utils';
import type {
  ContactInfo,
  FooterContent,
  SiteSettings,
  SocialLink,
} from '@/types/content';
import { SocialRow } from './socials';
import type { NavLink } from './header';

/** Pied de page : identité, navigation, coordonnées, horaires condensés. */
export function Footer({
  settings,
  footer,
  contact,
  socials,
  links,
}: {
  settings: SiteSettings;
  footer: FooterContent;
  contact: ContactInfo;
  socials: SocialLink[];
  links: NavLink[];
}) {
  const year = new Date().getFullYear();
  const address = [contact.addressLine, contact.city, contact.country]
    .filter(Boolean)
    .join(', ');

  const orderedHours = [1, 2, 3, 4, 5, 6, 0]
    .map((day) => contact.hours.find((hour) => hour.day === day))
    .filter((hour): hour is NonNullable<typeof hour> => Boolean(hour));

  return (
    <footer className="safe-bottom border-t border-line bg-ink-deep pb-24 pt-16 lg:pb-16">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12">
          <div>
            <LogoLockup settings={settings} />

            {footer.tagline && (
              <p className="mt-5 max-w-xs font-serif text-base italic leading-relaxed text-fg-muted">
                {footer.tagline}
              </p>
            )}

            {footer.showSocials && (
              <SocialRow socials={socials} size="sm" className="mt-6" />
            )}
          </div>

          <nav aria-label="Navigation du pied de page">
            <h2 className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-lime">
              Navigation
            </h2>
            <ul className="mt-4 space-y-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-fg-muted transition-colors duration-300 hover:text-cream"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-lime">
              Coordonnées
            </h2>

            <ul className="mt-4 space-y-2.5 text-sm text-fg-muted">
              {address && <li>{address}</li>}
              {contact.phone && (
                <li>
                  <a
                    href={telHref(contact.phone)}
                    className="transition-colors duration-300 hover:text-cream"
                  >
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.whatsapp && (
                <li>
                  <a
                    href={whatsappHref(contact.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors duration-300 hover:text-cream"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="break-all transition-colors duration-300 hover:text-cream"
                  >
                    {contact.email}
                  </a>
                </li>
              )}
            </ul>

            {footer.showHours && orderedHours.length > 0 && (
              <dl className="mt-6 space-y-1 text-xs text-fg-subtle">
                {orderedHours.map((hour) => (
                  <div key={hour.day} className="flex justify-between gap-3">
                    <dt>{DAY_NAMES_SHORT[hour.day]}</dt>
                    <dd className="tabular-nums">
                      {hour.closed ? 'Fermé' : `${hour.open}–${hour.close}`}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-7 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.brandName}. {footer.note}
          </p>
          {footer.legal && <p>{footer.legal}</p>}
        </div>
      </div>
    </footer>
  );
}
