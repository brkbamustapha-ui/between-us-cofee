# Photos du site

## `salle-*.webp` — le lieu

Quatre clichés de la salle. Ils servent deux fois :

- **en galerie**, en pleines couleurs ;
- **en fond de site**, mais pas ces fichiers-là : voir ci-dessous.

## `room/` — les panneaux du fond animé

Versions préparées des photos : désaturées, éclaircies pour rester lisibles
sous le voile, réduites à 700 px et fondues sur les bords. Ce traitement est
**cuit dans les fichiers**, volontairement.

Il était d'abord appliqué par le navigateur (`filter` + `mask-image`), ce qui le
lui faisait recalculer sur quatre calques plein écran à chaque image affichée.
Le faire une fois à la préparation ne coûte plus rien ensuite.

Treize panneaux, 545 Ko en tout — mais seulement quatre chargés à la fois, ceux
de la scène affichée.

### Les scènes

Le fond change selon la section regardée. La table des scènes et la
correspondance section → scène sont dans
`src/components/three/ambient-room.tsx` :

| Section | Décor |
| --- | --- |
| `#coffee` | tasses et chocolats chauds |
| `#brunch` | assiettes et plateaux de brunch |
| `#menu` | un panaché de la carte |
| toutes les autres | la salle |

Ajouter une scène : une entrée dans `ROOM_SCENES` (quatre photos, du plan le
plus lointain au plus proche), une ligne dans `SECTION_SCENE`, et régénérer les
panneaux si les photos sont nouvelles.

### Régénérer après avoir changé une photo

```bash
node -e "
const sharp = require('sharp');
const NAMES = ['salle-alcoves','salle-profondeur','salle-medaillon','salle-banquette',
  'boissons-chaudes','boissons-trio','chocolat-main','granola-latte',
  'brunch-assiettes','brunch-plateau','brunch-toasts','patisseries','refreshers'];
(async () => { for (const name of NAMES) {
  // Redimensionner d'abord en mémoire : metadata() sur un pipeline non exécuté
  // renvoie les dimensions du fichier d'origine, et le masque serait trop grand.
  const r = await sharp('public/photos/' + name + '.webp')
    .resize({ width: 700, withoutEnlargement: true }).toBuffer({ resolveWithObject: true });
  const { width, height } = r.info;
  const mask = Buffer.from('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"' + width + '\" height=\"' + height + '\">' +
    '<defs><radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"50%\">' +
    '<stop offset=\"55%\" stop-color=\"#fff\" stop-opacity=\"1\"/>' +
    '<stop offset=\"88%\" stop-color=\"#fff\" stop-opacity=\"0\"/>' +
    '</radialGradient></defs><rect width=\"' + width + '\" height=\"' + height + '\" fill=\"url(#g)\"/></svg>');
  await sharp(r.data).modulate({ saturation: 0.58, brightness: 0.95 }).linear(1.03, -3)
    .ensureAlpha().composite([{ input: mask, blend: 'dest-in' }])
    .webp({ quality: 70, alphaQuality: 78 }).toFile('public/photos/room/' + name + '.webp');
} })();
"
```

⚠️ En changeant `brightness` ou le masque, vérifie le contraste du texte : le
décor passe derrière toute la page, et c'est le corps de texte
(`--color-fg-muted`) qui plafonne — pas les titres, qui ont dix fois la marge
nécessaire. Trois réglages se répondent :

1. la luminosité cuite dans les panneaux ;
2. le voile global (`bg-ink/…` dans `ambient-room.tsx`) ;
3. le halo local sous les colonnes de texte (`story-sections.tsx`), qui permet
   de garder le reste de la page lumineux sans sacrifier la lecture.

La mesure : deux captures du même écran, l'une avec le texte rendu transparent,
puis comparaison de la couleur du texte au fond exact sous chaque glyphe.

## Les autres fichiers

Photos de plats et de boissons. Elles alimentent la galerie, les bandeaux de
section et la vitrine en tête de carte (`SHOWCASE` dans
`src/components/site/menu-section.tsx`).

## Ce qui se règle depuis le dashboard, et ce qui se règle ici

| Élément | Où |
| --- | --- |
| Galerie | dashboard → Galerie |
| Bandeau d'une catégorie du menu | dashboard → Catégories |
| Photo d'un produit | dashboard → Photos de la carte |
| Panneaux du fond animé | ici, `room/` + `ambient-room.tsx` |
| Vitrine en tête de carte | ici, `SHOWCASE` dans `menu-section.tsx` |

Les deux dernières lignes sont des choix de composition, pas du contenu
éditorial : c'est pourquoi elles vivent dans le code.
