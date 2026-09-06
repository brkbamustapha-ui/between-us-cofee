# Photos du site

## `salle-*.webp` — le lieu

Quatre clichés de la salle. Ils servent deux fois :

- **en galerie**, en pleines couleurs ;
- **en fond de site**, mais pas ces fichiers-là : voir ci-dessous.

## `room/` — les panneaux du fond animé

Versions préparées des photos de salle : désaturées, assombries et fondues sur
les bords. Ce traitement est **cuit dans les fichiers**, volontairement.

Il était d'abord appliqué par le navigateur (`filter` + `mask-image`), ce qui le
lui faisait recalculer sur quatre calques plein écran à chaque image affichée.
Le faire une fois à la préparation ne coûte plus rien ensuite.

Pour les régénérer après avoir changé une photo de salle :

```bash
node -e "
const sharp = require('sharp');
for (const name of ['salle-alcoves','salle-profondeur','salle-medaillon','salle-banquette']) {
  (async () => {
    const base = sharp('public/photos/' + name + '.webp').resize({ width: 900, withoutEnlargement: true });
    const { width, height } = await base.clone().metadata();
    const mask = Buffer.from(
      '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"' + width + '\" height=\"' + height + '\">' +
      '<defs><radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"50%\">' +
      '<stop offset=\"40%\" stop-color=\"#fff\" stop-opacity=\"1\"/>' +
      '<stop offset=\"78%\" stop-color=\"#fff\" stop-opacity=\"0\"/>' +
      '</radialGradient></defs><rect width=\"' + width + '\" height=\"' + height + '\" fill=\"url(#g)\"/></svg>'
    );
    await base.modulate({ saturation: 0.34, brightness: 0.55 }).linear(1.04, -4)
      .ensureAlpha().composite([{ input: mask, blend: 'dest-in' }])
      .webp({ quality: 72, alphaQuality: 80 }).toFile('public/photos/room/' + name + '.webp');
  })();
}
"
```

La liste des panneaux et leur ordre de profondeur sont dans
`src/components/three/ambient-room.tsx`.

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
