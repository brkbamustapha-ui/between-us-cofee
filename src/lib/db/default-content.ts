import type { MenuBadge, SiteContent } from '@/types/content';

/**
 * Contenu par défaut utilisé au premier démarrage (et base du seed SQL).
 *
 * La carte provient des captures du menu officiel fournies par la maison ; voir
 * le commentaire de `MENU` ci-dessous pour les deux réserves qui subsistent.
 */


/**
 * Carte officielle Between Us, relevée sur les captures du menu fournies par la
 * maison (application vemenu). Noms, descriptions et prix sont repris tels
 * qu'ils y figurent — rien n'est inventé.
 *
 * Deux réserves, signalées plutôt que masquées :
 *  - certains produits n'affichent AUCUN prix dans l'application ; ils portent
 *    ici `price: null` et le site indique « Prix sur place » ;
 *  - quelques intitulés y sont tronqués par la largeur de l'écran (« Frappuccino
 *    crème… ») ; ils ont été complétés d'après leur propre description, ce qui
 *    reste une reconstitution à confirmer.
 *
 * Le domaine du menu en ligne étant bloqué par la politique réseau de
 * l'environnement de génération, ces captures sont la seule source disponible.
 */
const MENU: {
  id: string;
  name: string;
  slug: string;
  description: string;
  items: [name: string, description: string, price: number | null, badges: MenuBadge[]][];
}[] = [
  {
    id: 'cat-brunch',
    name: 'Brunch',
    slug: 'brunch',
    description: 'Assiettes salées et sucrées, du matin au début d’après-midi.',
    items: [
      ['Pappus', 'Omelette, bacon, peperoni, poulet fumé artisanale, salade', 1300, []],
      ['Bioday', 'Bole granola, jus detox', 1000, []],
      ['Toast avocat saumon', '', 850, []],
      ['Toast fromage tomates', '', 450, []],
      ['Oeufs au plat avec salade', '', 350, []],
      ['Croissant salé', '3 types de charcuterie artisanale au choix', 750, []],
      ['Bloom', 'Croissant salé, oeufs omelette, fromage, bacon, viande ou poulet', 1500, []],
      ['Sunflower', 'Toast, purée d’avocat, saumon, oeufs', 1700, []],
      ['Matina', 'Boisson chaude, boisson froide, mignardises, viennoiseries', 1500, []],
      ['Magnolia', 'Toast, fromage, champignons frais, tomates cerises', null, []],
    ],
  },
  {
    id: 'cat-hot-coffee',
    name: 'Hot Coffee',
    slug: 'hot-coffee',
    description: 'Espresso, boissons lactées et chocolats chauds.',
    items: [
      ['Espresso', 'One shot espresso', null, []],
      ['Espresso Doppio', 'Double shot espresso', null, []],
      ['Espresso macchiato', 'One shot espresso + mousse de lait', 350, []],
      ['Americano', 'One shot espresso + eau chaude', 400, []],
      ['Latte', 'Double shot espresso + lait', 350, []],
      ['Cappuccino', 'Double shot espresso + lait + mousse de lait + cacao', 400, []],
      ['Spanish latte', 'Lait concentré + espresso + lait', 450, []],
      ['Caramel macchiato', 'Sirop vanille + espresso + lait + caramel', 450, []],
      ['Café aromatisé', 'Espresso + sirop au choix', null, []],
      ['Affogato', 'Espresso + glace vanille', 400, []],
      ['Dalgona coffee', 'Lait + mousse de café', 450, []],
      ['Mocha', 'Espresso + lait + nutella + chantilly', 500, []],
      ['White mocha', 'Espresso, chocolat blanc, lait, chantilly', 500, []],
      ['Milk chocolate', 'Lait + nesquik + sirop chocolat', 350, []],
      ['White hot chocolat', 'Lait + chocolat blanc + sirop chocolat blanc', 450, []],
      ['Biscoff latte', 'Lait + crème biscoff + chantilly', 450, []],
      ['Fluffy', 'Lait + crème au choix + mousse de café', null, []],
      ['Cortado', 'Espresso + lait', 250, []],
      ['Sweet latte', 'Café + lait + sirop au choix', null, []],
    ],
  },
  {
    id: 'cat-cold-coffee',
    name: 'Cold Coffee',
    slug: 'cold-coffee',
    description: 'Cafés servis sur glace.',
    items: [
      ['Iced americano', 'Espresso + eau + glaçons', 400, []],
      ['Iced latte', 'Lait + espresso + glaçons', 350, []],
      ['Iced cappuccino', 'Lait + mousse de lait + espresso + glaçons', 400, []],
      ['Iced spanish latte', 'Lait concentré + lait + espresso + glaçons', 450, []],
      ['Iced caramel macchiato', 'Sirop vanille + lait + espresso + caramel + glaçons', 450, []],
      ['Iced dalgona coffee', 'Lait + mousse de café + glaçons', 450, []],
      ['Iced mocha', 'Lait + nutella + espresso + chantilly + glaçons', 500, []],
      ['Iced white mocha', 'Lait + sirop chocolat blanc + espresso + chantilly + glaçons', 500, []],
      ['Iced milk chocolate', 'Lait + nesquik + sirop chocolat + glaçons', 350, []],
      ['Iced white chocolate', 'Lait + sirop chocolat blanc + glaçons', 450, []],
      ['Iced sweet latte', 'Lait + espresso + sirop au choix', null, []],
    ],
  },
  {
    id: 'cat-hot-tea',
    name: 'Hot Tea',
    slug: 'hot-tea',
    description: 'Thés, infusions et matcha servis chauds.',
    items: [
      ['Tea infusion', 'Infusion selon la disponibilité', 200, []],
      ['The maison', 'Thé + menthe', 150, ['popular']],
      ['Matcha tea latte', 'Thé matcha + lait', 450, []],
      ['Chai tea latte', 'Chai tea + lait', 450, []],
      ['Vanilla matcha', 'Sirop vanille + matcha tea + lait', 550, []],
      ['Strawberry matcha', 'Sirop fraise + matcha tea + lait', 650, []],
    ],
  },
  {
    id: 'cat-iced-tea',
    name: 'Iced Tea',
    slug: 'iced-tea',
    description: 'Thés et matcha servis glacés.',
    items: [
      ['Iced tea', 'Thé glacé + sirop au choix', null, []],
      ['Iced matcha tea latte', 'Thé matcha + lait + glaçons', 450, []],
      ['Iced chai tea latte', 'Thé chai + lait + glaçons', 450, []],
      ['Iced vanilla matcha', 'Sirop vanille + thé matcha + lait + glaçons', 650, []],
      ['Iced strawberry matcha', 'Lait + matcha tea + sirop fraises + glaçons', 650, []],
    ],
  },
  {
    id: 'cat-frappuccino',
    name: 'Frappuccino',
    slug: 'frappuccino',
    description: 'Cafés et crèmes frappés, texture glacée.',
    items: [
      ['Frappuccino matcha', 'Thé matcha + lait + glaçons', 600, []],
      ['Frappuccino chai tea', 'Chai tea + lait + glaçons', 600, []],
      ['Frappuccino coffee caramel', 'Lait + café + caramel + glaçons', 600, []],
      ['Frappuccino café vanille', 'Lait + vanille + espresso + glaçons', 600, []],
      ['Frappuccino café noisette', 'Lait + espresso + sirop noisette + glaçons', 600, []],
      ['Frappuccino café Mocha', 'Lait + espresso + nutella + glaçons', 600, []],
      ['Frappuccino café White chocolat', 'Lait + espresso + white chocolat + glaçons', 600, []],
      ['Frappuccino crème pistache', 'Crème pistache + lait + glaçons', 700, []],
      ['Frappuccino crème caramel', 'Crème caramel + lait + glaçons', 700, []],
      ['Frappuccino crème chocolat', 'Lait + nutella + deuxième type de chocolat + glaçons', 700, []],
      ['Frappuccino crème Coco', 'Lait + nutella + noix de coco + glaçons', 700, []],
    ],
  },
  {
    id: 'cat-mocktails',
    name: 'Mocktails',
    slug: 'mocktails',
    description: 'Cocktails sans alcool.',
    items: [
      ['Virgin Mojito', 'Sprite + citron + menthe + glaçons', 400, []],
      ['Mojito aromatisé', 'Menthe + citron + sprite + sirop au choix', null, []],
      ['Pina colada', 'Jus d’ananas + sirop coco + lait concentré', 450, []],
      ['Bora bora', 'Jus d’ananas + sirop passion + grenadine', 450, []],
      ['Sunset', 'Jus d’ananas + jus d’orange + sirop grenadine', 450, []],
      ['Bleu lagoun', 'Sprite + bleu curaçao + citron + pêche', 450, []],
    ],
  },
  {
    id: 'cat-jus-naturels',
    name: 'Jus Naturels',
    slug: 'jus-naturels',
    description: 'Jus de fruits frais.',
    items: [
      ['Jus d’orange', '', 500, []],
      ['Jus de banane', '', 500, []],
      ['Jus de citron', '', 500, []],
      ['Cocktail de saison', 'Fruits de saison', 500, []],
    ],
  },
  {
    id: 'cat-refreshers',
    name: 'Refreshers',
    slug: 'refreshers',
    description: 'Boissons fraîches et désaltérantes.',
    items: [
      ['Refresher strawberry', 'Eau + purée de fraises + glaçons + sirop fraise', 450, []],
      ['Refresher passion fruits', 'Eau + purée fruit de la passion + glaçons + sirop fruits de la passion', 450, []],
      ['Refresher frozen strawberry', 'Eau + purée fraise + double glaçon + sirop fraise', 450, []],
      ['Refresher frozen passion fruits', 'Eau + double glaçon + purée fruit de la passion + sirop fruits de la passion', 450, []],
      ['Paradise drink', 'Ananas + lait + coconut + mango + glaçons', 550, []],
      ['Pink drink', 'Lait + sirop fraises + purée fruits rouges', 550, []],
    ],
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
    // Numéro officiel. `telHref` et `whatsappHref` le normalisent : le format
    // local « 0553… » devient « +213553… » pour l'appel et « 213553… » pour
    // wa.me, il n'y a donc rien à convertir à la main.
    phone: '0553 00 74 14',
    whatsapp: '0553 00 74 14',
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
    whatsapp: '0553 00 74 14',
    phone: '0553 00 74 14',
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

  categories: MENU.map((category, index) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    // Photo de section : à téléverser depuis /admin/menu/categories. Tant
    // qu'elle est vide, la section affiche simplement son texte.
    imageUrl: '',
    position: index + 1,
    enabled: true,
  })),

  items: MENU.flatMap((category) =>
    category.items.map(([name, description, price, badges], index) => ({
      id: `${category.id}-${index + 1}`,
      categoryId: category.id,
      name,
      description,
      price,
      imageUrl: '',
      badges,
      position: index + 1,
      enabled: true,
      isPlaceholder: false,
    })),
  ),

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
      // `socialHref` construit le lien wa.me à partir du numéro quand `url`
      // est vide : inutile de dupliquer une URL ici.
      url: '',
      handle: '0553 00 74 14',
      position: 4,
      enabled: true,
    },
  ],
};

/** Copie profonde du contenu par défaut (évite toute mutation partagée). */
export function cloneDefaultContent(): SiteContent {
  return structuredClone(defaultContent);
}
