import type { SiteContent } from '@/types/content';
import { usableSocials } from '@/components/site/socials';
import { socialHref } from '@/components/site/socials';

/** URL canonique du site, configurable par variable d'environnement. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  // Sur Vercel, l'URL de déploiement fait office de repli.
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return 'http://localhost:3000';
}

/**
 * Données structurées schema.org.
 *
 * Rien n'est inventé : l'adresse postale n'est incluse que si elle a été
 * renseignée dans le dashboard, sinon seules la ville et le pays sont déclarés.
 */
export function restaurantJsonLd(content: SiteContent): Record<string, unknown> {
  const { settings, contact, items, socials } = content;
  const url = siteUrl();

  const prices = items
    .filter((item) => item.enabled && item.price !== null)
    .map((item) => item.price as number);

  const openingHours = contact.hours
    .filter((hour) => !hour.closed)
    .map((hour) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ][hour.day],
      opens: hour.open,
      closes: hour.close,
    }));

  const sameAs = usableSocials(socials).map((link) => socialHref(link));

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${url}/#restaurant`,
    name: settings.brandName,
    description: settings.metaDescription,
    url,
    servesCuisine: ['Coffee', 'Brunch'],
    address: {
      '@type': 'PostalAddress',
      ...(contact.addressLine ? { streetAddress: contact.addressLine } : {}),
      addressLocality: contact.city || 'Oran',
      addressCountry: 'DZ',
    },
  };

  if (settings.logoUrl || settings.ogImageUrl) {
    jsonLd.image = settings.ogImageUrl || settings.logoUrl;
  }
  if (contact.phone) jsonLd.telephone = contact.phone;
  if (contact.email) jsonLd.email = contact.email;
  if (contact.mapsUrl) jsonLd.hasMap = contact.mapsUrl;
  if (openingHours.length > 0) jsonLd.openingHoursSpecification = openingHours;
  if (sameAs.length > 0) jsonLd.sameAs = sameAs;
  if (content.reservation.enabled) jsonLd.acceptsReservations = true;

  if (prices.length > 0) {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    jsonLd.priceRange = `${min} - ${max} DZD`;
  }

  return jsonLd;
}

/** Menu structuré (schema.org/Menu), utile aux résultats enrichis locaux. */
export function menuJsonLd(content: SiteContent): Record<string, unknown> | null {
  const sections = content.categories
    .filter((category) => category.enabled)
    .map((category) => {
      const menuItems = content.items
        .filter(
          (item) =>
            item.enabled && !item.isPlaceholder && item.categoryId === category.id,
        )
        .map((item) => ({
          '@type': 'MenuItem',
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
          ...(item.price !== null
            ? {
                offers: {
                  '@type': 'Offer',
                  price: item.price,
                  priceCurrency: 'DZD',
                },
              }
            : {}),
        }));

      return menuItems.length > 0
        ? {
            '@type': 'MenuSection',
            name: category.name,
            ...(category.description ? { description: category.description } : {}),
            hasMenuItem: menuItems,
          }
        : null;
    })
    .filter(Boolean);

  // Tant que la carte officielle n'est pas saisie, aucun menu n'est déclaré :
  // mieux vaut pas de données structurées que des données creuses.
  if (sections.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `Menu — ${content.settings.brandName}`,
    hasMenuSection: sections,
  };
}
