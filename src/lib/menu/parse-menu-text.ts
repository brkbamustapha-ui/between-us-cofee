import type { MenuBadge } from '@/types/content';

/**
 * Analyse d'une carte collée en texte brut.
 *
 * L'import JSON existant suppose qu'on sache écrire du JSON — irréaliste depuis
 * un téléphone, et c'est pourtant là que la carte est saisie en pratique. Ce
 * module accepte donc le texte tel qu'on le copie depuis une carte en ligne, un
 * PDF ou un message WhatsApp :
 *
 *     COFFEE
 *     Espresso .............. 150 DA
 *     Cappuccino — lait texturé   300
 *
 *     BRUNCH
 *     Brunch complet [best]   1800 DA
 *
 * Les règles sont volontairement peu nombreuses et énonçables en une phrase
 * chacune, parce que l'utilisateur doit pouvoir prédire le résultat :
 *
 *  1. une ligne qui se termine par un prix → un PRODUIT ;
 *  2. une ligne sans prix → une CATÉGORIE (elle ouvre une nouvelle section) ;
 *  3. une ligne préfixée par `>` → la description du produit précédent ;
 *  4. `#` en début de ligne force la catégorie, utile quand une catégorie
 *     porte un prix dans son intitulé (« Formules 1500 »).
 *
 * Aucune de ces règles n'est infaillible sur une carte réelle : c'est pourquoi
 * l'appelant affiche systématiquement un aperçu du résultat avant d'écrire quoi
 * que ce soit en base.
 */

export type ParsedItem = {
  name: string;
  description?: string;
  price: number | null;
  badges?: MenuBadge[];
};

export type ParsedCategory = {
  name: string;
  items: ParsedItem[];
};

export type ParseResult = {
  categories: ParsedCategory[];
  /** Nombre total de produits, pour l'aperçu. */
  itemCount: number;
  /** Lignes qu'aucune règle n'a su classer — affichées à l'utilisateur. */
  ignored: string[];
};

/** Catégorie créée quand des produits apparaissent avant tout intitulé. */
const FALLBACK_CATEGORY = 'Menu';

/**
 * Marqueurs de badge acceptés entre crochets, en français comme en anglais.
 * La casse et les accents sont normalisés avant comparaison.
 */
const BADGE_ALIASES: Record<string, MenuBadge> = {
  best: 'best_seller',
  bestseller: 'best_seller',
  best_seller: 'best_seller',
  'meilleure vente': 'best_seller',
  populaire: 'popular',
  popular: 'popular',
  nouveau: 'new',
  nouveaute: 'new',
  new: 'new',
  reco: 'recommended',
  recommande: 'recommended',
  recommended: 'recommended',
};

/** Devises et abréviations qui peuvent suivre un montant. */
const CURRENCY = String.raw`(?:da|dzd|dinars?|\u062f\.?\u062c|\u062f\u062c|€|\$)`;

/**
 * Un prix en fin de ligne : chiffres avec séparateurs éventuels, devise
 * facultative. Les points de conduite (« ..... ») sont consommés en amont.
 */
const PRICE_AT_END = new RegExp(
  String.raw`(?:^|[\s.\u00b7\u2014\u2013\-:|])(\d[\d\s\u00a0\u202f.,]*)\s*${CURRENCY}?\s*$`,
  'i',
);

/** Devise explicite : lève le seuil minimal appliqué aux nombres nus. */
const HAS_CURRENCY = new RegExp(String.raw`${CURRENCY}\s*$`, 'i');

/**
 * Sous ce montant, un nombre nu (sans devise) n'est pas considéré comme un
 * prix : il s'agit presque toujours d'un intitulé (« Formule 2 », « Menu 3 »).
 * Les prix algériens réels sont très au-dessus de ce seuil.
 */
const BARE_NUMBER_MIN = 20;

/** Séparateurs nom / description, entourés d'espaces pour ne pas couper
 *  « Croque-monsieur » ou « self-service ». */
const NAME_DESC_SPLIT = /\s(?:\u2014|\u2013|-|\||:|\u00b7)\s|\t+/;

/** Supprime accents et casse, pour comparer des libellés saisis à la main. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Convertit un montant écrit à la main en nombre.
 *
 * Gère « 1 200 », « 1.200 », « 1,200 », « 1200,50 » et « 1 200,00 ». Quand les
 * deux séparateurs sont présents, le dernier rencontré est le séparateur
 * décimal ; seul, il n'est décimal que s'il est suivi d'exactement deux
 * chiffres (sinon c'est un séparateur de milliers).
 */
export function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[\s\u00a0\u202f]/g, '');
  if (!cleaned || !/\d/.test(cleaned)) return null;

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');
  let normalized: string;

  if (lastDot >= 0 && lastComma >= 0) {
    const decimalAt = Math.max(lastDot, lastComma);
    normalized =
      cleaned.slice(0, decimalAt).replace(/[.,]/g, '') +
      '.' +
      cleaned.slice(decimalAt + 1);
  } else if (lastDot >= 0 || lastComma >= 0) {
    const at = Math.max(lastDot, lastComma);
    const decimals = cleaned.length - at - 1;
    normalized =
      decimals === 2
        ? cleaned.slice(0, at) + '.' + cleaned.slice(at + 1)
        : cleaned.replace(/[.,]/g, '');
  } else {
    normalized = cleaned;
  }

  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** Extrait les badges entre crochets et renvoie la ligne débarrassée d'eux. */
function extractBadges(line: string): { line: string; badges: MenuBadge[] } {
  const badges: MenuBadge[] = [];
  const stripped = line.replace(/\[([^\]]{1,24})\]/g, (whole, tag: string) => {
    const badge = BADGE_ALIASES[normalize(tag)];
    if (!badge) return whole; // Crochet inconnu : on le laisse dans le nom.
    if (!badges.includes(badge)) badges.push(badge);
    return ' ';
  });
  return { line: stripped, badges };
}

/**
 * Sépare un intitulé de sa description sur le premier séparateur entouré
 * d'espaces. Renvoie une description uniquement si les deux moitiés sont
 * non vides — « Latte - » ne doit pas produire de description vide.
 */
function splitNameDescription(text: string): {
  name: string;
  description?: string;
} {
  const match = NAME_DESC_SPLIT.exec(text);
  if (!match || match.index === 0) return { name: text.trim() };

  const name = text.slice(0, match.index).trim();
  const description = text.slice(match.index + match[0].length).trim();
  if (!name || !description) return { name: text.trim() };
  return { name, description };
}

export function parseMenuText(input: string): ParseResult {
  const categories: ParsedCategory[] = [];
  const ignored: string[] = [];
  let current: ParsedCategory | null = null;
  let lastItem: ParsedItem | null = null;

  const lines = input
    .replace(/\r\n?/g, '\n')
    .split('\n')
    // Les espaces insécables viennent systématiquement du copier-coller.
    .map((line) => line.replace(/[\u00a0\u202f]/g, ' ').trimEnd());

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      // Une ligne vide ferme la description courante sans rien créer.
      lastItem = null;
      continue;
    }

    // Règle 3 — description explicite du produit précédent.
    if (line.startsWith('>')) {
      const text = line.slice(1).trim();
      if (!text) continue;
      if (lastItem) {
        lastItem.description = lastItem.description
          ? `${lastItem.description} ${text}`
          : text;
      } else {
        ignored.push(line);
      }
      continue;
    }

    // Règle 4 — catégorie forcée.
    const forcedCategory = /^#{1,3}\s*/.test(line);
    const body = forcedCategory ? line.replace(/^#{1,3}\s*/, '').trim() : line;
    if (!body) continue;

    const { line: withoutBadges, badges } = extractBadges(body);
    // Points de conduite typographiques : « Espresso ....... 150 ».
    const withoutLeaders = withoutBadges.replace(/[.\u00b7]{2,}/g, ' ');
    const priceMatch = forcedCategory ? null : PRICE_AT_END.exec(withoutLeaders);

    let price: number | null = null;
    let head = withoutLeaders;

    if (priceMatch) {
      const candidate = parsePrice(priceMatch[1]);
      const hasCurrency = HAS_CURRENCY.test(withoutLeaders);
      // Un nombre nu trop petit est un intitulé, pas un montant.
      if (candidate !== null && (hasCurrency || candidate >= BARE_NUMBER_MIN)) {
        price = candidate;
        head = withoutLeaders.slice(0, priceMatch.index);
      }
    }

    head = head.replace(/[\s.\u00b7\u2014\u2013\-:|]+$/, '').trim();

    // Règle 2 — pas de prix ⇒ nouvelle catégorie.
    if (price === null) {
      if (!head) continue;
      current = { name: head, items: [] };
      categories.push(current);
      lastItem = null;
      continue;
    }

    // Règle 1 — un prix ⇒ un produit.
    if (!head) {
      // Un montant seul, sans intitulé : rien d'exploitable.
      ignored.push(line);
      continue;
    }

    if (!current) {
      current = { name: FALLBACK_CATEGORY, items: [] };
      categories.push(current);
    }

    const { name, description } = splitNameDescription(head);
    const item: ParsedItem = { name, price };
    if (description) item.description = description;
    if (badges.length) item.badges = badges;
    current.items.push(item);
    lastItem = item;
  }

  // Une catégorie sans aucun produit est presque toujours une ligne de
  // décoration mal interprétée (« *** », « Nos boissons »). On la retire pour
  // ne pas polluer la carte, sans la perdre : elle est signalée à l'écran.
  const kept = categories.filter((category) => category.items.length > 0);
  for (const category of categories) {
    if (category.items.length === 0) ignored.push(category.name);
  }

  return {
    categories: kept,
    itemCount: kept.reduce((total, category) => total + category.items.length, 0),
    ignored,
  };
}
