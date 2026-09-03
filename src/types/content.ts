/**
 * Modèle de contenu du site Between Us Coffee & Brunch.
 *
 * Tout ce qui est affiché sur le site public provient de ces structures, et tout
 * est modifiable depuis le dashboard `/admin` — aucun texte, prix, photo ou lien
 * n'est codé en dur dans les composants.
 */

/* -------------------------------------------------------------------------- */
/*  Primitives                                                                 */
/* -------------------------------------------------------------------------- */

export interface CallToAction {
  label: string;
  href: string;
  enabled: boolean;
}

export interface OpeningHour {
  /** 0 = dimanche … 6 = samedi */
  day: number;
  open: string;
  close: string;
  closed: boolean;
}

export interface StatItem {
  label: string;
  value: string;
}

/* -------------------------------------------------------------------------- */
/*  Singletons                                                                 */
/* -------------------------------------------------------------------------- */

export interface SiteSettings {
  brandName: string;
  shortName: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  /** URL du logo officiel (lockup complet). Vide ⇒ logo vectoriel de secours. */
  logoUrl: string;
  /** URL du monogramme « BU » seul. */
  logoMarkUrl: string;
  ogImageUrl: string;
  /** Couleurs extraites du logo, exposées en variables CSS au runtime. */
  colorInk: string;
  colorLime: string;
  /** Bandeau d'information affiché en haut du site (vide ⇒ masqué). */
  announcement: string;
  announcementEnabled: boolean;
  maintenanceMode: boolean;
}

export interface HeroContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  primaryCta: CallToAction;
  secondaryCta: CallToAction;
  tertiaryCta: CallToAction;
  backgroundImageUrl: string;
  backgroundVideoUrl: string;
  /** Active la scène 3D du hero (désactivable globalement depuis le dashboard). */
  enable3d: boolean;
}

export interface AboutContent {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  imageUrl: string;
  secondaryImageUrl: string;
  videoUrl: string;
  stats: StatItem[];
  signature: string;
}

export interface ContactInfo {
  phone: string;
  whatsapp: string;
  email: string;
  addressLine: string;
  city: string;
  country: string;
  mapsUrl: string;
  mapsEmbedUrl: string;
  hours: OpeningHour[];
  hoursNote: string;
}

export interface ReservationSettings {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  /** Numéro recevant les demandes de réservation via WhatsApp. */
  whatsapp: string;
  phone: string;
  minGuests: number;
  maxGuests: number;
  openingTime: string;
  closingTime: string;
  /** Nombre de jours réservables à l'avance. */
  maxAdvanceDays: number;
  notice: string;
  successMessage: string;
}

export interface FooterContent {
  tagline: string;
  note: string;
  legal: string;
  showSocials: boolean;
  showHours: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Collections                                                                */
/* -------------------------------------------------------------------------- */

/** Sections éditoriales : Notre univers, Coffee, Brunch, Expérience… */
export interface ContentSection {
  id: string;
  /** Identifiant stable utilisé comme ancre et pour le tri (`universe`, `coffee`…). */
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  imageUrl: string;
  /** Liste de points forts affichés sous le texte. */
  highlights: string[];
  /** `left` place l'image à gauche sur desktop, `right` à droite. */
  layout: 'left' | 'right';
  position: number;
  enabled: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  position: number;
  enabled: boolean;
}

export type MenuBadge = 'best_seller' | 'popular' | 'new' | 'recommended';

export const MENU_BADGES: MenuBadge[] = [
  'best_seller',
  'popular',
  'new',
  'recommended',
];

export const MENU_BADGE_LABELS: Record<MenuBadge, string> = {
  best_seller: 'Best Seller',
  popular: 'Popular',
  new: 'New',
  recommended: 'Recommended',
};

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  /** Prix en dinars algériens. `null` ⇒ prix non communiqué. */
  price: number | null;
  imageUrl: string;
  badges: MenuBadge[];
  position: number;
  enabled: boolean;
  /**
   * `true` tant que la donnée n'a pas été vérifiée contre la carte officielle.
   * Le site public affiche alors un avertissement et le dashboard un badge rouge.
   */
  isPlaceholder: boolean;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  alt: string;
  caption: string;
  position: number;
  enabled: boolean;
}

export interface VideoItem {
  id: string;
  url: string;
  posterUrl: string;
  title: string;
  description: string;
  position: number;
  enabled: boolean;
}

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'whatsapp'
  | 'youtube'
  | 'x';

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  'instagram',
  'tiktok',
  'facebook',
  'whatsapp',
  'youtube',
  'x',
];

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  youtube: 'YouTube',
  x: 'X',
};

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  handle: string;
  position: number;
  enabled: boolean;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Reservation {
  id: string;
  name: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  message: string;
  status: ReservationStatus;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Agrégat                                                                    */
/* -------------------------------------------------------------------------- */

export interface SiteContent {
  settings: SiteSettings;
  hero: HeroContent;
  about: AboutContent;
  contact: ContactInfo;
  reservation: ReservationSettings;
  footer: FooterContent;
  sections: ContentSection[];
  categories: MenuCategory[];
  items: MenuItem[];
  gallery: GalleryPhoto[];
  videos: VideoItem[];
  socials: SocialLink[];
}

/* -------------------------------------------------------------------------- */
/*  Clés de stockage                                                           */
/* -------------------------------------------------------------------------- */

export const SINGLETON_KEYS = [
  'settings',
  'hero',
  'about',
  'contact',
  'reservation',
  'footer',
] as const;

export type SingletonKey = (typeof SINGLETON_KEYS)[number];

export interface SingletonMap {
  settings: SiteSettings;
  hero: HeroContent;
  about: AboutContent;
  contact: ContactInfo;
  reservation: ReservationSettings;
  footer: FooterContent;
}

export const COLLECTION_KEYS = [
  'sections',
  'categories',
  'items',
  'gallery',
  'videos',
  'socials',
  'reservations',
] as const;

export type CollectionKey = (typeof COLLECTION_KEYS)[number];

export interface CollectionMap {
  sections: ContentSection;
  categories: MenuCategory;
  items: MenuItem;
  gallery: GalleryPhoto;
  videos: VideoItem;
  socials: SocialLink;
  reservations: Reservation;
}

/** Correspondance clé applicative → table Supabase. */
export const SINGLETON_TABLES: Record<SingletonKey, string> = {
  settings: 'site_settings',
  hero: 'hero_content',
  about: 'about_content',
  contact: 'contact_info',
  reservation: 'reservation_settings',
  footer: 'footer_content',
};

export const COLLECTION_TABLES: Record<CollectionKey, string> = {
  sections: 'content_sections',
  categories: 'menu_categories',
  items: 'menu_items',
  gallery: 'gallery',
  videos: 'videos',
  socials: 'social_links',
  reservations: 'reservations',
};
