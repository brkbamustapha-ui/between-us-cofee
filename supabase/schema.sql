-- ===========================================================================
--  BETWEEN US COFFEE & BRUNCH — schéma PostgreSQL
--  À exécuter une fois dans : Supabase → SQL Editor → New query → Run
-- ===========================================================================
--
--  Sécurité : Row Level Security est activée sur toutes les tables et AUCUNE
--  policy n'est créée. Conséquence : les clés `anon` et `authenticated` ne
--  peuvent ni lire ni écrire. Seule la clé `service_role`, utilisée uniquement
--  côté serveur Next.js, a accès aux données. C'est volontaire : le site public
--  est rendu côté serveur, le navigateur n'interroge jamais Supabase
--  directement.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
--  Blocs de contenu uniques (une seule ligne, id = 'default')
--  Le contenu est stocké en JSONB : ajouter un champ éditable dans le
--  dashboard ne demande aucune migration.
-- ---------------------------------------------------------------------------

create table if not exists public.site_settings (
  id         text primary key default 'default',
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_content (
  id         text primary key default 'default',
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.about_content (
  id         text primary key default 'default',
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_info (
  id         text primary key default 'default',
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.reservation_settings (
  id         text primary key default 'default',
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.footer_content (
  id         text primary key default 'default',
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  Sections éditoriales (Notre univers, Coffee, Brunch, Expérience…)
-- ---------------------------------------------------------------------------

create table if not exists public.content_sections (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  eyebrow    text not null default '',
  title      text not null default '',
  body       text not null default '',
  image_url  text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  layout     text not null default 'right' check (layout in ('left', 'right')),
  position   integer not null default 0,
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists content_sections_position_idx
  on public.content_sections (position);

-- ---------------------------------------------------------------------------
--  Menu
-- ---------------------------------------------------------------------------

create table if not exists public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text not null default '',
  image_url   text not null default '',
  position    integer not null default 0,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists menu_categories_position_idx
  on public.menu_categories (position);

create table if not exists public.menu_items (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references public.menu_categories (id) on delete cascade,
  name           text not null,
  description    text not null default '',
  -- Prix en dinars algériens. NULL = prix non communiqué.
  price          numeric(10, 2),
  image_url      text not null default '',
  badges         jsonb not null default '[]'::jsonb,
  position       integer not null default 0,
  enabled        boolean not null default true,
  -- true tant que la donnée n'a pas été vérifiée contre la carte officielle
  is_placeholder boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists menu_items_category_idx
  on public.menu_items (category_id, position);

-- ---------------------------------------------------------------------------
--  Médias
-- ---------------------------------------------------------------------------

create table if not exists public.gallery (
  id         uuid primary key default gen_random_uuid(),
  url        text not null,
  alt        text not null default '',
  caption    text not null default '',
  position   integer not null default 0,
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists gallery_position_idx on public.gallery (position);

create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  poster_url  text not null default '',
  title       text not null default '',
  description text not null default '',
  position    integer not null default 0,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists videos_position_idx on public.videos (position);

-- ---------------------------------------------------------------------------
--  Réseaux sociaux
-- ---------------------------------------------------------------------------

create table if not exists public.social_links (
  id         uuid primary key default gen_random_uuid(),
  platform   text not null,
  url        text not null default '',
  handle     text not null default '',
  position   integer not null default 0,
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  Réservations reçues depuis le site
-- ---------------------------------------------------------------------------

create table if not exists public.reservations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null,
  guests     integer not null default 2,
  date       date not null,
  time       text not null,
  message    text not null default '',
  status     text not null default 'pending'
             check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists reservations_created_idx
  on public.reservations (created_at desc);

-- ---------------------------------------------------------------------------
--  Compte administrateur
--  Le mot de passe n'est stocké que sous forme de hash bcrypt (coût 12).
-- ---------------------------------------------------------------------------

create table if not exists public.admin_users (
  id             uuid primary key default gen_random_uuid(),
  username       text not null unique,
  password_hash  text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  last_login_at  timestamptz,
  failed_attempts integer not null default 0,
  locked_until   timestamptz
);

-- ---------------------------------------------------------------------------
--  Row Level Security — verrouillage complet (accès service_role uniquement)
-- ---------------------------------------------------------------------------

alter table public.site_settings        enable row level security;
alter table public.hero_content         enable row level security;
alter table public.about_content        enable row level security;
alter table public.contact_info         enable row level security;
alter table public.reservation_settings enable row level security;
alter table public.footer_content       enable row level security;
alter table public.content_sections     enable row level security;
alter table public.menu_categories      enable row level security;
alter table public.menu_items           enable row level security;
alter table public.gallery              enable row level security;
alter table public.videos               enable row level security;
alter table public.social_links         enable row level security;
alter table public.reservations         enable row level security;
alter table public.admin_users          enable row level security;

-- ---------------------------------------------------------------------------
--  Storage — bucket public en lecture pour les photos et vidéos
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Lecture publique des médias (les URL sont affichées sur le site).
drop policy if exists "media public read" on storage.objects;
create policy "media public read"
  on storage.objects for select
  using (bucket_id = 'media');

-- L'écriture passe exclusivement par la clé service_role côté serveur :
-- aucune policy d'insert/update/delete n'est créée pour anon/authenticated.

-- ===========================================================================
--  Après exécution :
--   1. Se connecter sur /admin
--   2. Paramètres → « Initialiser le contenu par défaut » pour peupler les
--      tables (sections, catégories, emplacements de menu, réseaux sociaux)
--   3. Remplacer les emplacements du menu par la carte officielle
-- ===========================================================================
