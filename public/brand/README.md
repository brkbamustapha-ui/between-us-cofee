# Assets de marque

## État actuel

Le logo officiel a été communiqué en image dans la conversation, mais **le fichier
source n'a jamais atteint le dépôt** (le dossier `photos/` ne contient que son
README). Les assets ci-dessous ont donc été **vectorisés à partir de cette image** :

- le **monogramme est une reconstruction fidèle** — sa géométrie est reproduite
  exactement (demi-disque supérieur coupé en diagonale, demi-disque inférieur,
  bloc du « U » à fond arrondi fendu d'une entaille fine) ;
- les **couleurs ont été relevées à l'œil** sur l'image, pas échantillonnées dans
  un fichier : elles sont très proches mais peuvent différer de quelques points ;
- le **mot-symbole « Between us » utilise Outfit ExtraBold**, une géométrique
  épaisse proche de l'original, mais ce n'est pas la police d'origine.

Pour un rendu strictement identique à la charte, déposez le fichier officiel —
voir ci-dessous. Une minute de manipulation, aucun code à toucher.

| Fichier | Rôle |
| --- | --- |
| `logo-mark.svg` | Monogramme sur pastille — favicon, header compact |
| `logo-mark-glyph.svg` | Monogramme blanc sur fond transparent — texture de la scène 3D |
| `logo.svg` | Lockup complet — usage vectoriel |
| `og-image.png` | Image de partage 1200 × 630 (WhatsApp, Facebook, X) |

## Installer le fichier officiel

### Option A — depuis le dashboard (recommandé, aucun code)

1. Se connecter sur `/admin`
2. **Paramètres** → section « Identité visuelle »
3. Téléverser :
   - **Logo complet** (PNG ou WebP, fond transparent de préférence) → remplace le
     lockup dans le header, le footer et la page de connexion ;
   - **Monogramme « BU »** → utilisé dans la scène 3D et les formats compacts.
4. Enregistrer. Le site bascule immédiatement, sans jamais déformer le fichier
   (`object-contain` conserve les proportions d'origine).

Dans la même page, la section « Couleurs » permet de corriger le vert profond et
le lime si les valeurs relevées ne correspondent pas exactement.

### Option B — remplacer les fichiers

Déposer les fichiers dans ce dossier en gardant les mêmes noms, remplacer aussi
`src/app/icon.svg` et `src/app/apple-icon.svg` pour le favicon, puis redéployer.

## Couleurs de la charte

Définies dans `src/app/globals.css` (bloc `@theme`) — les modifier là repeint tout
le site :

| Token | Valeur | Usage |
| --- | --- | --- |
| `--color-ink` | `#0A2B1E` | Fond principal, vert forêt profond |
| `--color-ink-deep` | `#05170F` | Fonds les plus sombres, footer |
| `--color-elevated` | `#12402D` | Cartes et sections secondaires |
| `--color-lime` | `#D3F58C` | Accent principal, CTA, titres |
| `--color-lime-deep` | `#B4E062` | Lime assombri (états pressés) |
| `--color-lime-glow` | `#E8FCC2` | Lime éclairci (survol) |
| `--color-cream` | `#F2F5E9` | Texte courant sur fond sombre |
| `--color-fg-muted` | `#9DB8A6` | Texte secondaire (contraste 7,1:1) |
| `--color-fg-subtle` | `#7E9E89` | Texte tertiaire (contraste 5,1:1) |

Tous les contrastes texte/fond ont été calculés et dépassent le seuil WCAG AA
(4,5:1).
