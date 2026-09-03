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

export function telHref(phone: string): string {
  const normalized = normalizePhone(phone);
  return normalized ? `tel:${normalized}` : '';
}

/**
 * Lien WhatsApp. `wa.me` exige un numéro international sans `+` ni séparateur ;
 * un numéro algérien saisi en `0X XX XX XX XX` est converti en `213XXXXXXXXX`.
 */
export function whatsappHref(phone: string, message?: string): string {
  let digits = normalizePhone(phone).replace('+', '');
  if (!digits) return '';

  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `213${digits.slice(1)}`;

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
