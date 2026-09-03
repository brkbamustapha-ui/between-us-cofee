import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  COLLECTION_TABLES,
  SINGLETON_TABLES,
  type CollectionKey,
  type CollectionMap,
  type Reservation,
  type SingletonKey,
  type SingletonMap,
  type SiteContent,
} from '@/types/content';
import { cloneDefaultContent } from './default-content';
import { toCamelRows, toSnakeRow } from './case';
import type { AdminUserRecord, ContentStore, NewRecord } from './store';
import { StoreError } from './store';

/**
 * Implémentation PostgreSQL (Supabase).
 *
 * - Les singletons (réglages, hero, à propos, contact, réservation, footer) sont
 *   stockés dans une table dédiée par bloc, avec une ligne unique `id = 'default'`
 *   et une colonne `data jsonb`. C'est ce qui permet d'ajouter un champ éditable
 *   sans migration SQL.
 * - Les collections utilisent de vraies colonnes, indispensables pour trier et
 *   filtrer (`position`, `enabled`, `category_id`…).
 *
 * Le schéma complet se trouve dans `supabase/schema.sql`.
 */

const SINGLETON_ROW_ID = 'default';

/** Colonnes triées par ordre d'affichage pour chaque collection. */
const ORDER_COLUMN: Record<CollectionKey, { column: string; ascending: boolean }> =
  {
    sections: { column: 'position', ascending: true },
    categories: { column: 'position', ascending: true },
    items: { column: 'position', ascending: true },
    gallery: { column: 'position', ascending: true },
    videos: { column: 'position', ascending: true },
    socials: { column: 'position', ascending: true },
    reservations: { column: 'created_at', ascending: false },
  };

export class SupabaseStore implements ContentStore {
  readonly kind = 'supabase' as const;
  readonly writable = true;

  constructor(private readonly client: SupabaseClient) {}

  /* ---------------------------------------------------------------------- */
  /*  Singletons                                                             */
  /* ---------------------------------------------------------------------- */

  async getSingleton<K extends SingletonKey>(key: K): Promise<SingletonMap[K]> {
    const table = SINGLETON_TABLES[key];
    const fallback = cloneDefaultContent()[key] as SingletonMap[K];

    const { data, error } = await this.client
      .from(table)
      .select('data')
      .eq('id', SINGLETON_ROW_ID)
      .maybeSingle();

    if (error) throw new StoreError(describe(error, table), 500);
    if (!data) return fallback;

    // Fusion avec le défaut : une clé ajoutée au modèle après le seed reste définie.
    return { ...fallback, ...(data.data as object) } as SingletonMap[K];
  }

  async updateSingleton<K extends SingletonKey>(
    key: K,
    patch: Partial<SingletonMap[K]>,
  ): Promise<SingletonMap[K]> {
    const table = SINGLETON_TABLES[key];
    const current = await this.getSingleton(key);
    const next = { ...current, ...patch } as SingletonMap[K];

    const { error } = await this.client
      .from(table)
      .upsert(
        { id: SINGLETON_ROW_ID, data: next, updated_at: new Date().toISOString() },
        { onConflict: 'id' },
      );

    if (error) throw new StoreError(describe(error, table), 500);
    return next;
  }

  /* ---------------------------------------------------------------------- */
  /*  Collections                                                            */
  /* ---------------------------------------------------------------------- */

  async list<K extends CollectionKey>(key: K): Promise<CollectionMap[K][]> {
    const table = COLLECTION_TABLES[key];
    const order = ORDER_COLUMN[key];

    const { data, error } = await this.client
      .from(table)
      .select('*')
      .order(order.column, { ascending: order.ascending });

    if (error) throw new StoreError(describe(error, table), 500);
    return toCamelRows<CollectionMap[K]>(data ?? []);
  }

  async create<K extends CollectionKey>(
    key: K,
    data: NewRecord<K>,
  ): Promise<CollectionMap[K]> {
    const table = COLLECTION_TABLES[key];
    const row = toSnakeRow(data as Record<string, unknown>);
    // Laisse PostgreSQL générer l'UUID quand aucun identifiant n'est imposé.
    if (row.id === undefined || row.id === '') delete row.id;

    const { data: inserted, error } = await this.client
      .from(table)
      .insert(row)
      .select('*')
      .single();

    if (error) throw new StoreError(describe(error, table), 500);
    return toCamelRows<CollectionMap[K]>([inserted])[0];
  }

  async update<K extends CollectionKey>(
    key: K,
    id: string,
    patch: Partial<CollectionMap[K]>,
  ): Promise<CollectionMap[K]> {
    const table = COLLECTION_TABLES[key];
    const row = toSnakeRow(patch as Record<string, unknown>);
    delete row.id;

    const { data, error } = await this.client
      .from(table)
      .update(row)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new StoreError(describe(error, table), 500);
    if (!data) throw new StoreError('Élément introuvable.', 404);

    return toCamelRows<CollectionMap[K]>([data])[0];
  }

  async remove<K extends CollectionKey>(key: K, id: string): Promise<void> {
    const table = COLLECTION_TABLES[key];

    // Les produits d'une catégorie supprimée le sont aussi (le schéma déclare
    // ON DELETE CASCADE ; cette suppression explicite couvre une base migrée
    // manuellement sans la contrainte).
    if (key === 'categories') {
      const { error: itemsError } = await this.client
        .from(COLLECTION_TABLES.items)
        .delete()
        .eq('category_id', id);
      if (itemsError) throw new StoreError(describe(itemsError, 'menu_items'), 500);
    }

    const { error } = await this.client.from(table).delete().eq('id', id);
    if (error) throw new StoreError(describe(error, table), 500);
  }

  async reorder<K extends CollectionKey>(key: K, ids: string[]): Promise<void> {
    const table = COLLECTION_TABLES[key];

    // Une requête par ligne : les volumes concernés (catégories, photos, vidéos)
    // se comptent en dizaines, et cela évite un upsert qui écraserait les autres
    // colonnes avec des valeurs partielles.
    const results = await Promise.all(
      ids.map((id, index) =>
        this.client
          .from(table)
          .update({ position: index + 1 })
          .eq('id', id),
      ),
    );

    const failed = results.find((result) => result.error);
    if (failed?.error) throw new StoreError(describe(failed.error, table), 500);
  }

  /* ---------------------------------------------------------------------- */
  /*  Lecture agrégée                                                        */
  /* ---------------------------------------------------------------------- */

  async getContent(): Promise<SiteContent> {
    const [
      settings,
      hero,
      about,
      contact,
      reservation,
      footer,
      sections,
      categories,
      items,
      gallery,
      videos,
      socials,
    ] = await Promise.all([
      this.getSingleton('settings'),
      this.getSingleton('hero'),
      this.getSingleton('about'),
      this.getSingleton('contact'),
      this.getSingleton('reservation'),
      this.getSingleton('footer'),
      this.list('sections'),
      this.list('categories'),
      this.list('items'),
      this.list('gallery'),
      this.list('videos'),
      this.list('socials'),
    ]);

    return {
      settings,
      hero,
      about,
      contact,
      reservation,
      footer,
      sections,
      categories,
      items,
      gallery,
      videos,
      socials,
    };
  }

  /* ---------------------------------------------------------------------- */
  /*  Compte administrateur                                                  */
  /* ---------------------------------------------------------------------- */

  async getAdminUser(): Promise<AdminUserRecord | null> {
    const { data, error } = await this.client
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new StoreError(describe(error, 'admin_users'), 500);
    if (!data) return null;

    return toCamelRows<AdminUserRecord>([data])[0];
  }

  async saveAdminUser(user: AdminUserRecord): Promise<AdminUserRecord> {
    const { data, error } = await this.client
      .from('admin_users')
      .upsert(toSnakeRow(user as unknown as Record<string, unknown>), {
        onConflict: 'id',
      })
      .select('*')
      .single();

    if (error) throw new StoreError(describe(error, 'admin_users'), 500);
    return toCamelRows<AdminUserRecord>([data])[0];
  }
}

/** Message d'erreur lisible, sans exposer de détail d'infrastructure sensible. */
function describe(
  error: { message: string; code?: string; hint?: string | null },
  table: string,
): string {
  if (error.code === '42P01') {
    return `La table « ${table} » n'existe pas. Exécutez supabase/schema.sql dans l'éditeur SQL de votre projet Supabase.`;
  }
  return `Erreur Supabase sur « ${table} » : ${error.message}`;
}

/** Type utilitaire réexporté pour les routes qui manipulent les réservations. */
export type { Reservation };
