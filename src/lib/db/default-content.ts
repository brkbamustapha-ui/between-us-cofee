import type { SiteContent } from '@/types/content';

/**
 * Contenu par défaut utilisé au premier démarrage (et comme base du seed SQL).
 *
 * ⚠️ IMPORTANT — CARTE DU MENU
 * La carte officielle (vemenu.ve-solution.com) n'était pas accessible depuis
 * l'environnement de génération : le domaine est bloqué par la politique réseau.
 * Aucun plat, prix ou description n'a donc été inventé.
 *
 * Les produits ci-dessous sont des EMPLACEMENTS VIDES (`isPlaceholder: true`,
 * `price: null`). Ils existent uniquement pour que la structure du menu soit
 * complète et immédiatement éditable depuis `/admin/menu`. Le site public
 * affiche un avertissement tant qu'il reste des emplacements non renseignés.
 */

const PLACEHOLDER_NOTE =
  'Emplacement à renseigner depuis le dashboard (/admin/menu) avec la carte officielle Between Us.';

/** Fabrique un emplacement de produit vide, explicitement marqué comme tel. */
function placeholderItem(
  categoryId: string,
  index: number,
): SiteContent['items'][number] {
  return {
    id: `${categoryId}-placeholder-${index}`,
    categoryId,
    name: `Produit ${index} — à renseigner`,
    description: PLACEHOLDER_NOTE,
    price: null,
    imageUrl: '',
    badges: [],
    position: index,
    enabled: true,
    isPlaceholder: true,
  };
}

const CATEGORY_SEEDS: {
  id: string;
  name: string;
  slug: string;
  description: string;
}[] = [
  {
    id: 'cat-coffee',
    name: 'Coffee',
    slug: 'coffee',
    description: 'Espresso, filtre et signatures lactées.',
  },
  {
    id: 'cat-cold',
    name: 'Cold Drinks',
    slug: 'cold-drinks',
    description: 'Boissons glacées, cold brew et frappés.',
  },
  {
    id: 'cat-brunch',
    name: 'Brunch',
    slug: 'brunch',
    description: 'Assiettes salées et formules du matin au début d’après-midi.',
  },
  {
    id: 'cat-sweet',
    name: 'Sweet',
    slug: 'sweet',
    description: 'Pâtisseries, desserts et douceurs de la maison.',
  },
  {
    id: 'cat-juice',
    name: 'Juices & Smoothies',
    slug: 'juices-smoothies',
    description: 'Jus pressés et smoothies préparés à la commande.',
  },
];

export const defaultContent: SiteContent = {
  settings: {
    brandName: 'Between Us Coffee & Brunch',
    shortName: 'Between Us',
    tagline: 'Where coffee, brunch and good moments meet.',
    metaTitle: 'Between Us Coffee & Brunch — Oran',
    metaDescription:
      'Coffee shop et brunch à Oran. Cafés de spécialité, assiettes de brunch et une atmosphère pensée pour prendre son temps.',
    logoUrl: '',
    logoMarkUrl: '',
    ogImageUrl: '/brand/og-image.png',
    colorInk: '#0A2B1E',
    colorLime: '#D3F58C',
    announcement: '',
    announcementEnabled: false,
    maintenanceMode: false,
  },

  hero: {
    eyebrow: 'Oran · Coffee shop & brunch',
    title: 'Between Us',
    subtitle: 'Coffee & Brunch',
    description: 'Where coffee, brunch and good moments meet.',
    primaryCta: { label: 'Découvrir le menu', href: '#menu', enabled: true },
    secondaryCta: {
      label: 'Réserver une table',
      href: '#reservation',
      enabled: true,
    },
    tertiaryCta: { label: 'Nous contacter', href: '#contact', enabled: true },
    backgroundImageUrl: '',
    backgroundVideoUrl: '',
    enable3d: true,
  },

  about: {
    eyebrow: 'À propos',
    title: 'Une maison pensée pour le temps partagé',
    paragraphs: [
      'Between Us est né d’une idée simple : donner à Oran un lieu où le café se prend au sérieux sans jamais se prendre au sérieux. Une salle chaleureuse, une lumière douce, et des tasses qui invitent à rester.',
      'Nous travaillons le café comme un produit vivant — mouture réglée chaque jour, extraction contrôlée, lait texturé à la commande — et nous dressons les assiettes de brunch avec la même exigence.',
      'Ce texte est modifiable depuis le dashboard : racontez l’histoire du lieu avec vos mots.',
    ],
    imageUrl: '',
    secondaryImageUrl: '',
    videoUrl: '',
    stats: [
      { value: '100%', label: 'Café de spécialité' },
      { value: '7j/7', label: 'Ouvert toute la semaine' },
      { value: '2', label: 'Services : brunch & goûter' },
    ],
    signature: 'L’équipe Between Us',
  },

  contact: {
    phone: '',
    whatsapp: '',
    email: '',
    // Aucune adresse précise n'est inventée : à renseigner depuis /admin/contact.
    addressLine: '',
    city: 'Oran',
    country: 'Algérie',
    // Lien Google Maps officiel : alimente le bouton « Itinéraire ». Il n'a pas
    // pu être résolu en adresse postale depuis l'environnement de génération
    // (domaine bloqué), d'où `addressLine` toujours vide plutôt qu'inventée.
    mapsUrl: 'https://maps.app.goo.gl/7Ju39b3Fmu2cVfVVA',
    // Un lien court ne peut pas s'afficher dans une iframe : l'intégration
    // demande une URL `maps.google.com/…&output=embed`, à copier depuis
    // Google Maps → Partager → Intégrer une carte.
    mapsEmbedUrl: '',
    hours: [
      { day: 1, open: '08:00', close: '23:00', closed: false },
      { day: 2, open: '08:00', close: '23:00', closed: false },
      { day: 3, open: '08:00', close: '23:00', closed: false },
      { day: 4, open: '08:00', close: '23:00', closed: false },
      { day: 5, open: '08:00', close: '23:00', closed: false },
      { day: 6, open: '08:00', close: '23:00', closed: false },
      { day: 0, open: '08:00', close: '23:00', closed: false },
    ],
    hoursNote: 'Horaires à confirmer depuis le dashboard.',
  },

  reservation: {
    enabled: true,
    eyebrow: 'Réservation',
    title: 'Réservez votre table',
    description:
      'Indiquez la date, l’heure et le nombre de personnes : votre demande nous parvient immédiatement et nous confirmons par retour de message.',
    whatsapp: '',
    phone: '',
    minGuests: 1,
    maxGuests: 12,
    openingTime: '08:00',
    closingTime: '23:00',
    maxAdvanceDays: 60,
    notice:
      'Pour les groupes de plus de 12 personnes, contactez-nous directement.',
    successMessage:
      'Merci ! Votre demande a bien été enregistrée. Nous revenons vers vous très vite.',
  },

  footer: {
    tagline: 'Where coffee, brunch and good moments meet.',
    note: 'Between Us Coffee & Brunch — Oran, Algérie.',
    legal: '',
    showSocials: true,
    showHours: true,
  },

  sections: [
    {
      id: 'sec-universe',
      key: 'universe',
      eyebrow: 'Notre univers',
      title: 'Le vert profond, la lumière rase, et le bruit d’une machine',
      body: 'Un comptoir en pièce maîtresse, des matières mates, une palette qui descend du vert profond au lime. L’espace a été dessiné pour deux usages : le café rapide du matin, et les longues tablées du week-end.',
      imageUrl: '',
      highlights: [
        'Salle intérieure et terrasse',
        'Wi-Fi et prises à chaque table',
        'Espace adapté aux groupes',
      ],
      layout: 'right',
      position: 1,
      enabled: true,
    },
    {
      id: 'sec-coffee',
      key: 'coffee',
      eyebrow: 'Coffee',
      title: 'Le café, travaillé comme il le mérite',
      body: 'Grains sélectionnés, mouture ajustée plusieurs fois par jour, extraction chronométrée. Espresso serré, filtre allongé, ou signature lactée : chaque tasse sort du comptoir réglée.',
      imageUrl: '',
      highlights: [
        'Espresso & filtre',
        'Lait texturé à la commande',
        'Recettes signature',
      ],
      layout: 'left',
      position: 2,
      enabled: true,
    },
    {
      id: 'sec-brunch',
      key: 'brunch',
      eyebrow: 'Brunch',
      title: 'Le brunch, du matin au début d’après-midi',
      body: 'Des assiettes généreuses, sucrées ou salées, préparées à la commande. Le service brunch s’étire assez tard pour que personne n’ait à se presser.',
      imageUrl: '',
      highlights: [
        'Sucré et salé',
        'Formules à composer',
        'Service prolongé le week-end',
      ],
      layout: 'right',
      position: 3,
      enabled: true,
    },
    {
      id: 'sec-experience',
      key: 'experience',
      eyebrow: 'Expérience Between Us',
      title: 'Ce qui se passe entre nous reste entre nous',
      body: 'Une playlist tenue, un service qui connaît les habitués, et une salle qui change de lumière au fil de la journée. Between Us est autant un lieu qu’un moment.',
      imageUrl: '',
      highlights: [
        'Ambiance musicale soignée',
        'Privatisation possible',
        'Accueil des groupes et anniversaires',
      ],
      layout: 'left',
      position: 4,
      enabled: true,
    },
  ],

  categories: CATEGORY_SEEDS.map((c, i) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: '',
    position: i + 1,
    enabled: true,
  })),

  items: CATEGORY_SEEDS.flatMap((c) => [
    placeholderItem(c.id, 1),
    placeholderItem(c.id, 2),
    placeholderItem(c.id, 3),
  ]),

  // Photos et vidéos sont ajoutées depuis le dashboard : les sections
  // correspondantes se masquent automatiquement tant qu'elles sont vides,
  // ce qui évite toute image cassée sur le site public.
  gallery: [],
  videos: [],

  // Comptes officiels communiqués par la maison. Les paramètres de suivi des
  // liens de partage (`igsi`, `_r`, `_t`) ont été retirés : ils identifient la
  // session de la personne qui a partagé le lien et n'ont rien à faire sur un
  // site public. Ces URL alimentent aussi `sameAs` dans les données
  // structurées, ce qui rattache le lieu à ses profils pour les moteurs.
  socials: [
    {
      id: 'soc-instagram',
      platform: 'instagram',
      url: 'https://www.instagram.com/betweenuscoffeeoran',
      handle: '@betweenuscoffeeoran',
      position: 1,
      enabled: true,
    },
    {
      id: 'soc-tiktok',
      platform: 'tiktok',
      url: 'https://www.tiktok.com/@between_us_coffee',
      handle: '@between_us_coffee',
      position: 2,
      enabled: true,
    },
    {
      id: 'soc-facebook',
      platform: 'facebook',
      // Lien de partage fourni par la page. Si vous connaissez l'URL directe
      // (facebook.com/<nom-de-page>), préférez-la : elle est plus stable et
      // mieux comprise par les moteurs de recherche.
      url: 'https://www.facebook.com/share/19HPGvabdY/',
      handle: 'Between Us Coffee',
      position: 3,
      enabled: true,
    },
    {
      id: 'soc-whatsapp',
      platform: 'whatsapp',
      url: '',
      handle: '',
      position: 4,
      enabled: false,
    },
  ],
};

/** Copie profonde du contenu par défaut (évite toute mutation partagée). */
export function cloneDefaultContent(): SiteContent {
  return structuredClone(defaultContent);
}
