# Assets de marque

## ⚠️ Les fichiers présents sont des PLACEHOLDERS

Le logo officiel n'était pas accessible lors de la génération du projet. Les
fichiers ci-dessous reproduisent l'identité décrite (fond vert profond `#002C25`,
monogramme « BU » vert lime `#D5FF72`, typographie épaisse) **mais ne sont pas le
logo officiel**.

| Fichier | Rôle |
| --- | --- |
| `logo-mark.svg` | Monogramme « BU » seul — favicon, header compact, scène 3D |
| `logo.svg` | Lockup complet — Open Graph, partages sociaux |

## Comment installer le vrai logo

### Option A — depuis le dashboard (recommandé, aucun code)

1. Se connecter sur `/admin`
2. Aller dans **Paramètres** (`/admin/settings`)
3. Section « Identité visuelle » → téléverser le logo (PNG/WebP/SVG, fond transparent
   de préférence) et le monogramme
4. Enregistrer — le header, le hero, la scène 3D et le footer basculent
   automatiquement sur le fichier téléversé

### Option B — remplacer les fichiers

1. Déposer `logo.svg` et `logo-mark.svg` dans ce dossier (mêmes noms)
2. Remplacer aussi `src/app/icon.svg` pour le favicon
3. Redéployer

## Couleurs de la charte

À ajuster dans `src/app/globals.css` (bloc `@theme`) si les valeurs exactes
extraites du logo officiel diffèrent :

| Token | Valeur | Usage |
| --- | --- | --- |
| `--color-ink` | `#002C25` | Fond principal, vert profond presque noir |
| `--color-ink-deep` | `#001A16` | Fonds les plus sombres, footer |
| `--color-ink-soft` | `#044137` | Sections secondaires |
| `--color-lime` | `#D5FF72` | Accent principal, CTA, titres |
| `--color-cream` | `#F4F1E8` | Texte courant sur fond sombre |
