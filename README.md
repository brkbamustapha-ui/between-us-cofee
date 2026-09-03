# Between Us Coffee & Brunch ☕

Site vitrine premium et dashboard d'administration pour **Between Us Coffee & Brunch** (Oran, Algérie).

Le site public est entièrement piloté depuis `/admin` : textes, menu, prix, photos,
vidéos, horaires, réservations et réseaux sociaux se modifient sans toucher au code,
et les changements sont visibles **immédiatement** sur le site.

---

## ⚠️ Trois points à traiter avant la mise en ligne

### 1. Le fichier source du logo n'est pas dans le dépôt

Le logo a été communiqué en image, mais le fichier n'a jamais atteint le dépôt
(`photos/` ne contient que son README). Les assets de `public/brand/` ont donc été
**vectorisés à partir de cette image** :

- le **monogramme est une reconstruction fidèle** — géométrie reproduite à
  l'identique (demi-disque supérieur coupé en diagonale, demi-disque inférieur, bloc
  du « U » à fond arrondi fendu d'une entaille fine) ;
- les **couleurs ont été relevées à l'œil** (`#0A2B1E` / `#D3F58C`), pas
  échantillonnées dans un fichier : très proches, à quelques points près ;
- le **mot-symbole utilise Outfit ExtraBold**, proche de l'original sans en être la
  police exacte.

**Pour un rendu strictement conforme** : `/admin` → **Paramètres** → « Identité
visuelle » → téléverser le logo complet et le monogramme. Le header, le hero, la
scène 3D, le footer et les partages sociaux basculent dessus, sans jamais déformer le
fichier. La section « Couleurs » de la même page permet de corriger les deux teintes.
Détails dans [`public/brand/README.md`](public/brand/README.md).

### 2. La carte officielle n'a pas pu être lue

Le menu de référence (`vemenu.ve-solution.com`) est **bloqué par la politique réseau**
de l'environnement de génération. Aucun plat, prix ou description n'a été inventé.

La structure du menu est complète (5 catégories, 15 emplacements) mais chaque produit
est un **espace réservé** marqué `isPlaceholder` : il s'affiche avec un badge
« À renseigner » sur le site public, un avertissement sur la carte, et il est exclu
des données structurées lues par Google.

**Trois façons de saisir la vraie carte** :

**1. Coller la carte en texte** (le plus rapide, y compris depuis un téléphone) —
`/admin/menu` → « Importer la carte officielle » → onglet **Texte**. Collez la carte
telle que vous la copiez depuis une page en ligne, un PDF ou un message :

```
COFFEE
Espresso ............ 150 DA
Cappuccino — lait texturé   300
Latte 350

BRUNCH
Brunch complet [best]  1 800 DA
> Œufs, pain maison, jus pressé
Pancakes 900
```

Les règles de lecture :

| Écriture | Résultat |
| --- | --- |
| Ligne finissant par un prix | Un produit |
| Ligne sans prix | Une catégorie (ouvre une section) |
| Ligne commençant par `>` | Description du produit précédent |
| `Nom — description 350` | Sépare aussi la description |
| `[best]` `[nouveau]` `[populaire]` `[reco]` | Ajoute un badge |
| `#` en début de ligne | Force la catégorie |

Les montants sont reconnus avec ou sans devise, en `1 800`, `1.800`, `1,800` ou
`900,00`. Un nombre nu inférieur à 20 n'est **pas** pris pour un prix (« Formule 2 »
reste un intitulé). Un **aperçu affiche exactement ce qui sera créé** avant tout
enregistrement, et signale les lignes non reprises.

**2. Produit par produit** — `/admin/menu` → sélectionner une catégorie → modifier
nom, description, prix, photo, badges → décocher « emplacement à renseigner ».

**3. En JSON** (pour un import piloté depuis un autre outil) — même écran, onglet
**JSON** :

```json
{
  "replaceExisting": true,
  "categories": [
    {
      "name": "Coffee",
      "description": "Espresso, filtre et signatures lactées.",
      "items": [
        { "name": "Espresso", "description": "Simple, serré.", "price": 150 },
        { "name": "Cappuccino", "price": 300, "badges": ["best_seller"] }
      ]
    }
  ]
}
```

### 3. L'adresse postale exacte reste à saisir

Les comptes officiels sont déjà en place et actifs sur le site :

| | |
| --- | --- |
| Instagram | `instagram.com/betweenuscoffeeoran` |
| TikTok | `tiktok.com/@between_us_coffee` |
| Facebook | lien de partage `facebook.com/share/19HPGvabdY/` |
| Google Maps | `maps.app.goo.gl/7Ju39b3Fmu2cVfVVA` |

Les paramètres de suivi des liens de partage (`igsi`, `_r`, `_t`, `g_st`) ont été
retirés : ils identifient la session de la personne qui a partagé le lien.

Le lien Maps alimente le bouton « Itinéraire », mais il n'a **pas pu être résolu en
adresse postale** — le domaine est bloqué par la politique réseau de l'environnement
de génération. Aucune adresse n'a donc été inventée. Deux champs restent à remplir
dans `/admin/contact` :

- **Adresse** — la rue et le quartier. Elle apparaît alors sous « Nous trouver », dans
  le pied de page et dans les données structurées lues par Google.
- **Carte intégrée** — un lien court ne peut pas s'afficher dans une iframe. Ouvrez
  Google Maps → **Partager** → **Intégrer une carte** → copiez l'URL du `src`
  (`https://www.google.com/maps/embed?pb=…`) et collez-la dans « Carte intégrée ».
  Tant qu'elle est vide, le panneau affiche un bouton « Voir sur Google Maps » plutôt
  qu'un vide.

Deux autres champs facultatifs mais utiles : le **téléphone** et le **WhatsApp**, qui
activent le bouton d'appel, la réservation par message et le lien social WhatsApp.

Si vous connaissez l'URL directe de la page Facebook (`facebook.com/<nom-de-page>`),
préférez-la au lien de partage dans `/admin/socials` : elle est plus stable et mieux
comprise par les moteurs de recherche.

---

## 1. Installation

```bash
git clone https://github.com/brkbamustapha-ui/between-us-cofee.git
cd between-us-cofee
npm install
```

Node.js **20.9 ou supérieur** est requis.

## 2. Variables d'environnement

```bash
cp .env.example .env.local
```

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `AUTH_SECRET` | **oui** | Clé de signature du cookie de session (32 caractères min.) |
| `AUTH_SESSION_MAX_AGE` | non | Durée de session en secondes (défaut : 28800 = 8 h) |
| `ADMIN_USERNAME` | non | Nom d'utilisateur initial (défaut : `between us cofee`) |
| `ADMIN_PASSWORD_HASH` | recommandé | Hash bcrypt du mot de passe initial |
| `NEXT_PUBLIC_SUPABASE_URL` | production | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | production | Clé `service_role` — **serveur uniquement** |
| `SUPABASE_STORAGE_BUCKET` | non | Bucket des médias (défaut : `media`) |
| `NEXT_PUBLIC_SITE_URL` | production | URL canonique (sitemap, Open Graph) |

Générer les secrets :

```bash
openssl rand -base64 48                          # → AUTH_SECRET
npm run hash-password -- "votre mot de passe"    # → ADMIN_PASSWORD_HASH
```

> `SUPABASE_SERVICE_ROLE_KEY` ne doit **jamais** être préfixée par `NEXT_PUBLIC_`.
> Le module qui la lit importe `server-only` : toute tentative de l'utiliser depuis
> un composant client échoue à la compilation.

## 3. Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor** → **New query** → coller le contenu de
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   Cela crée les 14 tables, les index, le bucket `media` et verrouille l'accès
   (RLS activée sans policy : seule la clé `service_role` côté serveur peut lire
   et écrire — le navigateur n'interroge jamais Supabase directement).
3. **Project Settings → API** → copier `Project URL`, `anon key` et `service_role key`
   dans `.env.local`.
4. Lancer le site, se connecter sur `/admin`, puis **Paramètres → Données →
   « Initialiser le contenu »** pour peupler les tables.

### Sans Supabase

Le site fonctionne sans aucune configuration : un stockage fichier
(`.data/content.json`) prend le relais, le dashboard est pleinement utilisable, et
un bandeau rappelle ce qu'il reste à configurer. **Ce mode est réservé au
développement local** — sur Vercel le système de fichiers est en lecture seule, les
modifications ne peuvent pas être enregistrées, et le dashboard le signale
explicitement.

## 4. Compte administrateur

Identifiants **initiaux** :

| | |
| --- | --- |
| Nom d'utilisateur | `between us cofee` |
| Mot de passe | `between us cofee and brunch` |

Le compte est créé automatiquement au premier accès à `/admin`. Le mot de passe n'est
jamais stocké en clair : seul son hash bcrypt (coût 12) est enregistré.

**À faire dès la première connexion** : `/admin/security` → changer le mot de passe.
Tant que le mot de passe initial est actif, un avertissement rouge s'affiche sur la
page de connexion et dans la section Sécurité.

## 5. Lancer en local

```bash
npm run dev          # http://localhost:3000
```

Autres commandes :

```bash
npm run build        # build de production
npm run start        # sert le build de production
npm run typecheck    # TypeScript, sans émission
npm run lint         # ESLint
```

## 6. Déploiement Vercel

1. Pousser le dépôt sur GitHub.
2. [vercel.com](https://vercel.com) → **Add New → Project** → importer le dépôt.
3. **Environment Variables** : reporter toutes les variables de `.env.local`
   (`NEXT_PUBLIC_SITE_URL` prend l'URL de production définitive).
4. **Deploy**. Aucune configuration de build n'est nécessaire, Next.js est détecté
   automatiquement.
5. Après le premier déploiement, se connecter sur `/admin` et initialiser le contenu.

---

## Dashboard

| Route | Contenu |
| --- | --- |
| `/admin` | Redirige vers la connexion ou le tableau de bord |
| `/admin/login` | Connexion |
| `/admin/dashboard` | Statistiques, alertes, accès rapides |
| `/admin/content` | Hero, À propos, Sections éditoriales, Footer |
| `/admin/menu` | Produits : nom, prix, description, photo, badges, ordre, import JSON |
| `/admin/menu/categories` | Catégories : nom, slug, description, ordre |
| `/admin/gallery` | Photos : téléversement multiple, alt, légende, ordre |
| `/admin/videos` | Vidéos : fichier, miniature, titre, ordre |
| `/admin/reservations` | Demandes reçues + paramètres du formulaire |
| `/admin/contact` | Téléphone, WhatsApp, e-mail, adresse, carte, horaires |
| `/admin/socials` | Instagram, TikTok, Facebook, WhatsApp, YouTube, X |
| `/admin/settings` | Logo, couleurs, SEO, bandeau, maintenance, initialisation |
| `/admin/security` | Nom d'utilisateur, mot de passe, état de la protection |

Le dashboard est entièrement utilisable au téléphone : la barre latérale devient un
tiroir, les cartes s'empilent, et le téléversement passe par la galerie du mobile.

## Structure du projet

```
src/
  app/
    page.tsx                  page d'accueil (assemble les 15 sections)
    layout.tsx                polices, métadonnées, viewport
    globals.css               tokens de design (couleurs, typo, animations)
    sitemap.ts robots.ts      SEO
    manifest.ts icon.svg      PWA et favicon
    admin/                    dashboard (login + groupe (panel) protégé)
    api/
      reservations/           formulaire public
      media/[...path]/        sert les médias du stockage local
      admin/                  login, logout, contenu, collections, upload,
                              sécurité, seed, import de menu
  components/
    site/                     sections du site public
    admin/                    briques du dashboard
    three/                    scène 3D du hero
    brand/  ui/               logo et primitives
  lib/
    db/                       abstraction de persistance + adaptateurs
    auth/                     mots de passe, sessions, anti-brute-force
    storage/                  upload, compression, suppression
    validation/               schémas Zod de toutes les écritures
    seo.ts utils.ts paths.ts
  hooks/                      détection d'appareil, gestion des collections
  types/content.ts            modèle de contenu
supabase/schema.sql           schéma PostgreSQL + Storage + RLS
public/brand/                 monogramme vectorisé + image de partage
photos/                       dépôt de photos à partager
```

## Technologies

| | |
| --- | --- |
| Framework | Next.js 15 (App Router, React 19, TypeScript strict) |
| Styles | Tailwind CSS 4 (tokens `@theme`) |
| 3D | React Three Fiber 9 + Three.js + drei |
| Animations | Motion (ex-Framer Motion) |
| Base de données | Supabase (PostgreSQL) — repli fichier JSON |
| Stockage | Supabase Storage — repli disque local |
| Authentification | bcrypt + JWT `jose` en cookie httpOnly |
| Validation | Zod |
| Images | `sharp` (compression) + `next/image` (AVIF/WebP) |

## Performance et 3D

La scène 3D du hero est calibrée sur les capacités réelles de l'appareil :

| Situation | Comportement |
| --- | --- |
| `prefers-reduced-motion`, WebGL absent, mode économie de données, 2 cœurs ou moins | **Aucune 3D** — un dégradé animé en CSS prend le relais |
| Téléphone d'entrée/milieu de gamme (≤ 4 cœurs ou ≤ 4 Go) | **3D allégée** — 10 grains, 70 particules, DPR plafonné à 1,5, sans antialiasing |
| Desktop et téléphones récents | **Scène complète** — 30 grains, 170 particules, DPR jusqu'à 2 |

En complément :

- le bundle 3D (~450 Ko) est chargé **après** l'hydratation, jamais avant que la page
  soit lisible ;
- le rendu s'arrête totalement (`frameloop="never"`) dès que le hero sort de l'écran
  ou que l'onglet passe en arrière-plan ;
- en portrait, le monogramme devient un filigrane très effacé : sur un petit écran,
  la 3D recule devant le texte ;
- aucune vidéo n'est téléchargée au chargement — seule la miniature s'affiche jusqu'au
  clic sur lecture ;
- les images téléversées sont converties en WebP et redimensionnées à 2000 px.

## Sécurité

- Mot de passe haché avec bcrypt (coût 12), jamais stocké ni transmis en clair.
- Session : JWT HS256 dans un cookie `httpOnly`, `SameSite=Lax`, `Secure` en production.
- Changer le mot de passe invalide instantanément toutes les autres sessions ouvertes
  (l'empreinte du hash fait partie du jeton).
- Double barrière : le middleware vérifie la signature du jeton, puis chaque page et
  chaque route d'API revérifie côté serveur que le compte existe toujours.
- Anti-brute-force à deux niveaux : verrouillage du compte 15 minutes après 8 échecs,
  plus une limite par adresse IP.
- Toutes les écritures passent par un schéma Zod `.strict()` : aucune clé inconnue
  n'atteint la base.
- RLS activée sur toutes les tables sans policy — seul le serveur accède aux données.
- En production, la connexion est refusée si `AUTH_SECRET` est absent, plutôt que de
  signer les sessions avec une clé de développement.

## Accessibilité

Navigation clavier complète avec lien d'évitement, `focus-visible` sur tous les
éléments interactifs, cibles tactiles de 44 px minimum, `aria-label` sur les boutons
sans texte, `alt` sur toutes les images, un seul `<h1>` par page, zoom non bloqué, et
`prefers-reduced-motion` respecté sur l'ensemble des animations (CSS, Motion et 3D).

---

## Envoyer des photos

Le dossier [`photos/`](photos/) sert à partager des images avec l'équipe de
développement (logo, maquettes, photos du lieu) — voir
[`photos/README.md`](photos/README.md).

Pour les photos **du site**, passer par le dashboard : `/admin/gallery`.
