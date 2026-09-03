import { z } from 'zod';

import {
  MENU_BADGES,
  SOCIAL_PLATFORMS,
  type CollectionKey,
  type SingletonKey,
} from '@/types/content';

/**
 * Schémas de validation appliqués à TOUTE écriture venant du dashboard.
 *
 * Le client n'est jamais cru sur parole : chaque champ est typé, borné, et les
 * clés inconnues sont rejetées (`.strict()`), ce qui empêche d'injecter des
 * colonnes arbitraires dans la base.
 */

const text = (max = 500) => z.string().max(max);
const longText = (max = 5000) => z.string().max(max);

/** Accepte une URL absolue http(s), un chemin interne, ou une chaîne vide. */
const mediaUrl = z
  .string()
  .max(2000)
  .refine(
    (value) =>
      value === '' || value.startsWith('/') || /^https?:\/\//i.test(value),
    { message: 'URL invalide (attendu : http(s)://… ou /chemin).' },
  );

/** Lien externe : http(s), tel:, mailto:, ancre interne, ou vide. */
const linkUrl = z
  .string()
  .max(2000)
  .refine(
    (value) =>
      value === '' ||
      value.startsWith('/') ||
      value.startsWith('#') ||
      /^(https?:|tel:|mailto:)/i.test(value),
    { message: 'Lien invalide.' },
  );

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur attendue au format #RRGGBB.');

const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:MM.');

const ctaSchema = z
  .object({
    label: text(80),
    href: linkUrl,
    enabled: z.boolean(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*  Singletons                                                                 */
/* -------------------------------------------------------------------------- */

export const settingsSchema = z
  .object({
    brandName: text(120),
    shortName: text(60),
    tagline: text(240),
    metaTitle: text(160),
    metaDescription: text(320),
    logoUrl: mediaUrl,
    logoMarkUrl: mediaUrl,
    ogImageUrl: mediaUrl,
    colorInk: hexColor,
    colorLime: hexColor,
    announcement: text(240),
    announcementEnabled: z.boolean(),
    maintenanceMode: z.boolean(),
  })
  .strict();

export const heroSchema = z
  .object({
    eyebrow: text(120),
    title: text(80),
    subtitle: text(120),
    description: longText(600),
    primaryCta: ctaSchema,
    secondaryCta: ctaSchema,
    tertiaryCta: ctaSchema,
    backgroundImageUrl: mediaUrl,
    backgroundVideoUrl: mediaUrl,
    enable3d: z.boolean(),
  })
  .strict();

export const aboutSchema = z
  .object({
    eyebrow: text(120),
    title: text(200),
    paragraphs: z.array(longText(2000)).max(8),
    imageUrl: mediaUrl,
    secondaryImageUrl: mediaUrl,
    videoUrl: mediaUrl,
    stats: z
      .array(z.object({ value: text(24), label: text(80) }).strict())
      .max(6),
    signature: text(120),
  })
  .strict();

export const contactSchema = z
  .object({
    phone: text(40),
    whatsapp: text(40),
    email: z.union([z.string().email(), z.literal('')]),
    addressLine: text(240),
    city: text(80),
    country: text(80),
    mapsUrl: linkUrl,
    mapsEmbedUrl: linkUrl,
    hours: z
      .array(
        z
          .object({
            day: z.number().int().min(0).max(6),
            open: timeOfDay,
            close: timeOfDay,
            closed: z.boolean(),
          })
          .strict(),
      )
      .max(7),
    hoursNote: text(240),
  })
  .strict();

export const reservationSettingsSchema = z
  .object({
    enabled: z.boolean(),
    eyebrow: text(120),
    title: text(160),
    description: longText(800),
    whatsapp: text(40),
    phone: text(40),
    minGuests: z.number().int().min(1).max(50),
    maxGuests: z.number().int().min(1).max(200),
    openingTime: timeOfDay,
    closingTime: timeOfDay,
    maxAdvanceDays: z.number().int().min(1).max(365),
    notice: longText(600),
    successMessage: longText(400),
  })
  .strict();

export const footerSchema = z
  .object({
    tagline: text(240),
    note: longText(600),
    legal: longText(600),
    showSocials: z.boolean(),
    showHours: z.boolean(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*  Collections                                                                */
/* -------------------------------------------------------------------------- */

export const sectionSchema = z
  .object({
    key: z
      .string()
      .min(2)
      .max(40)
      .regex(/^[a-z0-9-]+$/, 'Identifiant : minuscules, chiffres et tirets.'),
    eyebrow: text(120),
    title: text(200),
    body: longText(3000),
    imageUrl: mediaUrl,
    highlights: z.array(text(120)).max(8),
    layout: z.enum(['left', 'right']),
    position: z.number().int().min(0).max(9999),
    enabled: z.boolean(),
  })
  .strict();

export const categorySchema = z
  .object({
    name: text(80).pipe(z.string().min(1, 'Le nom est obligatoire.')),
    slug: z
      .string()
      .min(1)
      .max(60)
      .regex(/^[a-z0-9-]+$/, 'Slug : minuscules, chiffres et tirets.'),
    description: longText(600),
    imageUrl: mediaUrl,
    position: z.number().int().min(0).max(9999),
    enabled: z.boolean(),
  })
  .strict();

export const menuItemSchema = z
  .object({
    categoryId: z.string().min(1, 'Catégorie obligatoire.'),
    name: text(120).pipe(z.string().min(1, 'Le nom est obligatoire.')),
    description: longText(1200),
    price: z.number().min(0).max(1_000_000).nullable(),
    imageUrl: mediaUrl,
    badges: z.array(z.enum(MENU_BADGES as [string, ...string[]])).max(4),
    position: z.number().int().min(0).max(9999),
    enabled: z.boolean(),
    isPlaceholder: z.boolean(),
  })
  .strict();

export const gallerySchema = z
  .object({
    url: mediaUrl.pipe(z.string().min(1, 'Image obligatoire.')),
    alt: text(240),
    caption: text(240),
    position: z.number().int().min(0).max(9999),
    enabled: z.boolean(),
  })
  .strict();

export const videoSchema = z
  .object({
    url: mediaUrl.pipe(z.string().min(1, 'Vidéo obligatoire.')),
    posterUrl: mediaUrl,
    title: text(160),
    description: longText(800),
    position: z.number().int().min(0).max(9999),
    enabled: z.boolean(),
  })
  .strict();

export const socialSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORMS as [string, ...string[]]),
    url: linkUrl,
    handle: text(80),
    position: z.number().int().min(0).max(9999),
    enabled: z.boolean(),
  })
  .strict();

export const reservationRecordSchema = z
  .object({
    name: text(120),
    phone: text(40),
    guests: z.number().int().min(1).max(200),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue AAAA-MM-JJ.'),
    time: timeOfDay,
    message: longText(1000),
    status: z.enum(['pending', 'confirmed', 'cancelled']),
    createdAt: z.string().max(40),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*  Formulaire public de réservation                                           */
/* -------------------------------------------------------------------------- */

export const publicReservationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Indiquez votre nom.')
      .max(120),
    phone: z
      .string()
      .trim()
      .min(6, 'Indiquez un numéro de téléphone valide.')
      .max(40)
      .regex(/^[0-9+\s().-]+$/, 'Numéro de téléphone invalide.'),
    guests: z.coerce.number().int().min(1).max(200),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide.'),
    time: timeOfDay,
    message: z.string().trim().max(1000).default(''),
    // Champ piège : rempli uniquement par les robots. Volontairement accepté
    // par la validation — la route le traite ensuite comme un succès factice,
    // ce qui ne révèle pas au robot que le champ est un piège.
    website: z.string().max(200).optional().default(''),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*  Authentification                                                           */
/* -------------------------------------------------------------------------- */

export const loginSchema = z
  .object({
    username: z.string().trim().min(1, 'Nom d’utilisateur requis.').max(120),
    password: z.string().min(1, 'Mot de passe requis.').max(200),
  })
  .strict();

export const changeUsernameSchema = z
  .object({
    username: z.string().trim().min(3).max(120),
    currentPassword: z.string().min(1).max(200),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(10, 'Au moins 10 caractères.').max(200),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*  Import de menu (JSON)                                                      */
/* -------------------------------------------------------------------------- */

export const menuImportSchema = z
  .object({
    replaceExisting: z.boolean().default(false),
    categories: z
      .array(
        z
          .object({
            name: text(80).pipe(z.string().min(1)),
            slug: z.string().max(60).optional(),
            description: longText(600).optional(),
            items: z
              .array(
                z
                  .object({
                    name: text(120).pipe(z.string().min(1)),
                    description: longText(1200).optional(),
                    price: z.number().min(0).max(1_000_000).nullable().optional(),
                    imageUrl: mediaUrl.optional(),
                    badges: z
                      .array(z.enum(MENU_BADGES as [string, ...string[]]))
                      .max(4)
                      .optional(),
                  })
                  .strict(),
              )
              .max(300)
              .default([]),
          })
          .strict(),
      )
      .min(1, 'Au moins une catégorie est requise.')
      .max(50),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*  Registres                                                                  */
/* -------------------------------------------------------------------------- */

export const singletonSchemas: Record<SingletonKey, z.ZodTypeAny> = {
  settings: settingsSchema,
  hero: heroSchema,
  about: aboutSchema,
  contact: contactSchema,
  reservation: reservationSettingsSchema,
  footer: footerSchema,
};

export const collectionSchemas: Record<CollectionKey, z.ZodTypeAny> = {
  sections: sectionSchema,
  categories: categorySchema,
  items: menuItemSchema,
  gallery: gallerySchema,
  videos: videoSchema,
  socials: socialSchema,
  reservations: reservationRecordSchema,
};

/** Première erreur lisible d'un `ZodError`, destinée à l'affichage. */
export function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Données invalides.';
  const path = issue.path.join('.');
  return path ? `${path} : ${issue.message}` : issue.message;
}
