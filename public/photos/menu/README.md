# Photos de produits

Une image par produit de la carte. Le fichier porte le nom utilisé dans
`imageUrl` : `/photos/menu/<nom>.webp`.

## D'où viennent les photos actuelles

Toutes sont des **recadrages des clichés de la maison** déjà présents dans
`public/photos/`. Aucune image n'a été prise ailleurs : pas de photo trouvée
sur internet (droits d'auteur, et le plat photographié ne serait pas celui
servi ici), pas d'image générée.

| Fichier | Produit | Cliché d'origine |
| --- | --- | --- |
| `bol-granola.webp` | Bioday | `brunch-assiettes.webp` |
| `toast-saumon.webp` | Toast avocat saumon | `brunch-toasts.webp` |
| `oeuf-au-plat.webp` | Oeufs au plat avec salade | `brunch-toasts.webp` |
| `toast-champignons.webp` | Magnolia | `brunch-toasts.webp` |
| `latte.webp` | Latte | `boissons-chaudes.webp` |
| `cappuccino.webp` | Cappuccino | `boissons-chaudes.webp` |
| `chocolat-chaud.webp` | Milk chocolate | `boissons-chaudes.webp` |

Les autres produits n'ont pas encore de photo : sur les clichés disponibles,
rien ne permet de dire avec certitude quel produit de la carte est dans
l'assiette ou dans le verre. Attribuer une photo au hasard reviendrait à
montrer au client autre chose que ce qu'il commande.

## Ajouter une photo à un produit

1. Dépose le fichier ici (voir `photos/README.md` pour la marche à suivre
   depuis le navigateur ou le téléphone). Formats : `.webp`, `.jpg`, `.png`.
2. Ouvre le dashboard → **Menu** → le produit → champ image : le fichier
   apparaît dans la médiathèque, il suffit de le sélectionner.

Le format idéal est **carré, 700 × 700 px minimum**, le produit bien au centre :
la vignette est rognée en carré.

## Mise en page

La carte choisit sa mise en page selon le nombre de produits illustrés dans la
catégorie affichée :

- **au moins 60 % de produits photographiés** → grandes cartes illustrées ;
- **en dessous** → lignes de texte, avec une vignette sur les seuls produits
  qui ont une photo.

Aucun cadre vide n'est donc affiché, et les photos déjà là servent quand même.
