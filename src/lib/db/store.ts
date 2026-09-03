import type {
  CollectionKey,
  CollectionMap,
  SingletonKey,
  SingletonMap,
  SiteContent,
} from '@/types/content';

/** Compte administrateur tel qu'il est persisté. */
export interface AdminUserRecord {
  id: string;
  username: string;
  /** Hash bcrypt — le mot de passe en clair n'est jamais stocké ni transmis. */
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  failedAttempts: number;
  lockedUntil: string | null;
}

/** Élément d'une collection, sans son identifiant (généré à la création). */
export type NewRecord<K extends CollectionKey> = Omit<CollectionMap[K], 'id'> &
  Partial<Pick<CollectionMap[K], 'id'>>;

/**
 * Interface unique de persistance.
 *
 * Deux implémentations interchangeables :
 *  - `SupabaseStore` (production) — PostgreSQL + Storage
 *  - `FileStore` (repli local) — un fichier JSON, pour développer sans Supabase
 */
export interface ContentStore {
  readonly kind: 'supabase' | 'file';
  /** `false` lorsque le support ne peut pas être écrit (ex. FS en lecture seule). */
  readonly writable: boolean;

  /** Lecture agrégée pour le site public (un seul aller-retour côté Supabase). */
  getContent(): Promise<SiteContent>;

  getSingleton<K extends SingletonKey>(key: K): Promise<SingletonMap[K]>;
  updateSingleton<K extends SingletonKey>(
    key: K,
    patch: Partial<SingletonMap[K]>,
  ): Promise<SingletonMap[K]>;

  list<K extends CollectionKey>(key: K): Promise<CollectionMap[K][]>;
  create<K extends CollectionKey>(
    key: K,
    data: NewRecord<K>,
  ): Promise<CollectionMap[K]>;
  update<K extends CollectionKey>(
    key: K,
    id: string,
    patch: Partial<CollectionMap[K]>,
  ): Promise<CollectionMap[K]>;
  remove<K extends CollectionKey>(key: K, id: string): Promise<void>;
  /** Réordonne : la position de chaque élément devient son index dans `ids`. */
  reorder<K extends CollectionKey>(key: K, ids: string[]): Promise<void>;

  getAdminUser(): Promise<AdminUserRecord | null>;
  saveAdminUser(user: AdminUserRecord): Promise<AdminUserRecord>;
}

/** Erreur métier renvoyée telle quelle au client (message sûr à afficher). */
export class StoreError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = 'StoreError';
  }
}
