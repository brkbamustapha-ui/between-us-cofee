# Carte officielle — captures source

27 captures d'écran du menu Between Us dans l'application vemenu, fournies par la
maison. **Ce sont la source du contenu de la carte du site**, pas des photos à
publier : elles montrent l'interface d'une application tierce.

Elles ont été déplacées hors de `public/` pour cette raison — un fichier placé
dans `public/` est servi publiquement et alourdirait le déploiement sans servir
le site. Elles restent ici comme trace de la source.

La carte relevée depuis ces captures se trouve dans
[`src/lib/db/default-content.ts`](../../src/lib/db/default-content.ts) (constante
`MENU`) : 9 catégories, 78 produits, noms / descriptions / prix repris tels quels.

## Deux réserves

- **Produits sans prix** — l'application n'affiche aucun prix pour Espresso,
  Espresso Doppio, Café aromatisé, Fluffy, Sweet latte, Iced sweet latte,
  Iced tea, Mojito aromatisé et Magnolia. Ils portent `price: null` et le site
  affiche « Prix sur place ».
- **Intitulés reconstitués** — l'application tronque les noms trop longs. Sept
  produits ont été complétés d'après leur propre description et restent à
  confirmer : Frappuccino coffee caramel, Frappuccino café noisette, Frappuccino
  café White chocolat, Frappuccino crème pistache, Frappuccino crème caramel,
  Frappuccino crème chocolat, Frappuccino crème Coco. Également « Toast fromage
  tomates » et « Oeufs au plat avec salade ».

Tout se corrige depuis `/admin/menu` sans toucher au code.

## Ce qu'il manque encore

Des **photos réelles** : plats, boissons, salle, terrasse. Elles se téléversent
depuis le dashboard (`/admin/menu` pour les produits, `/admin/menu/categories`
pour les bandeaux de section, `/admin/gallery` pour la galerie) et s'accordent
automatiquement à la palette du site.
