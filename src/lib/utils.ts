/** Concatène des classes conditionnelles sans dépendance externe. */
export function cn(
  ...values: (string | false | null | undefined)[]
): string {
  return values.filter(Boolean).join(' ');
}

/* -------------------------------------------------------------------------- */
/*  Formatage                                                                  */
/* -------------------------------------------------------------------------- */

const priceFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

/** Prix en dinars algériens. `null` ⇒ « Prix sur place ». */
export function formatPrice(price: number | null): string {
  if (price === null || Number.isNaN(price)) return 'Prix sur place';
  return `${priceFormatter.format(price)} DA`;
}

export const DAY_NAMES = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
] as const;

export const DAY_NAMES_SHORT = [
  'Dim',
  'Lun',
  'Mar',
  'Mer',
  'Jeu',
  'Ven',
  'Sam',
] as const;

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/* -------------------------------------------------------------------------- */
/*  Liens                                                                      */
/* -------------------------------------------------------------------------- */

/** Ne conserve que les chiffres et un éventuel `+` initial. */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/\D/g, '');
}

/** Indicatif appliqué aux numéros saisis au format local. L'établissement est
 *  à Oran ; un numéro d'un autre pays doit être saisi avec son indicatif. */
const DEFAULT_COUNTRY_CODE = '213';

/**
 * Met un numéro au format international, sans `+` ni séparateur.
 *
 * Un numéro algérien saisi localement (« 0553 00 74 14 ») devient
 * « 213553007414 » : il reste composable depuis l'Algérie et le devient depuis
 * l'étranger. Un numéro déjà international (`+33…`, `0033…`) passe inchangé.
 */
export function internationalPhone(value: string): string {
  let digits = normalizePhone(value).replace('+', '');
  if (!digits) return '';

  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;

  return digits;
}

/** Lien d'appel. Le format international fonctionne depuis n'importe quel pays,
 *  là où un `tel:0553…` n'aboutit que depuis une ligne algérienne. */
export function telHref(phone: string): string {
  const digits = internationalPhone(phone);
  return digits ? `tel:+${digits}` : '';
}

/** Lien WhatsApp — `wa.me` exige le format international sans `+`. */
export function whatsappHref(phone: string, message?: string): string {
  const digits = internationalPhone(phone);
  if (!digits) return '';

  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Lien d'itinéraire Google Maps à partir d'une adresse libre. */
export function directionsHref(address: string, fallbackUrl: string): string {
  if (fallbackUrl) return fallbackUrl;
  if (!address) return '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

/* -------------------------------------------------------------------------- */
/*  Divers                                                                     */
/* -------------------------------------------------------------------------- */

export function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'item'
  );
}

/** Date du jour au format AAAA-MM-JJ, dans le fuseau du visiteur. */
export function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function addDaysIso(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
