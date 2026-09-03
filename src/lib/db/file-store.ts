import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

import type {
  CollectionKey,
  CollectionMap,
  Reservation,
  SingletonKey,
  SingletonMap,
  SiteContent,
} from '@/types/content';
import { contentFilePath } from '@/lib/paths';
import { cloneDefaultContent } from './default-content';
import type { AdminUserRecord, ContentStore, NewRecord } from './store';
import { StoreError } from './store';

/**
 * Repli local : tout le contenu tient dans un fichier JSON.
 *
 * Objectif : permettre de développer et de tester le site ET le dashboard sans
 * aucune configuration Supabase. En production sur Vercel le système de fichiers
 * est en lecture seule — `writable` passe alors à `false` et le dashboard affiche
 * un bandeau expliquant qu'il faut configurer Supabase.
 */

interface DatabaseFile {
  version: 1;
  content: SiteContent;
  reservations: Reservation[];
  admin: AdminUserRecord | null;
}

const DATA_FILE = contentFilePath();

function emptyDatabase(): DatabaseFile {
  return {
    version: 1,
    content: cloneDefaultContent(),
    reservations: [],
    admin: null,
  };
}

/**
 * Sérialise les écritures : les routes admin peuvent être appelées en parallèle,
 * et un read-modify-write concurrent perdrait des modifications.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  // La file ne doit jamais rester rejetée, sinon toutes les écritures suivantes échouent.
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export class FileStore implements ContentStore {
  readonly kind = 'file' as const;

  #writable = true;
  #cache: DatabaseFile | null = null;

  get writable(): boolean {
    return this.#writable;
  }

  async #read(): Promise<DatabaseFile> {
    if (this.#cache) return this.#cache;

    try {
      const raw = await readFile(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<DatabaseFile>;
      const base = emptyDatabase();
      this.#cache = {
        version: 1,
        // Fusion superficielle : un fichier écrit par une version antérieure du
        // modèle reste exploitable, les nouvelles clés prennent leur défaut.
        content: { ...base.content, ...(parsed.content ?? {}) },
        reservations: parsed.reservations ?? [],
        admin: parsed.admin ?? null,
      };
    } catch {
      this.#cache = emptyDatabase();
    }

    return this.#cache;
  }

  async #write(db: DatabaseFile): Promise<void> {
    this.#cache = db;
    try {
      await mkdir(dirname(DATA_FILE), { recursive: true });
      // Écriture atomique : évite un fichier tronqué si le process s'arrête.
      const tmp = `${DATA_FILE}.${randomUUID()}.tmp`;
      await writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
      await rename(tmp, DATA_FILE);
      this.#writable = true;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
        this.#writable = false;
        throw new StoreError(
          'Le stockage local est en lecture seule sur cet hébergement. Configurez Supabase pour enregistrer les modifications.',
          503,
        );
      }
      throw error;
    }
  }

  #collection<K extends CollectionKey>(
    db: DatabaseFile,
    key: K,
  ): CollectionMap[K][] {
    if (key === 'reservations') {
      return db.reservations as CollectionMap[K][];
    }
    return db.content[key as Exclude<CollectionKey, 'reservations'>] as CollectionMap[K][];
  }

  #setCollection<K extends CollectionKey>(
    db: DatabaseFile,
    key: K,
    rows: CollectionMap[K][],
  ): void {
    if (key === 'reservations') {
      db.reservations = rows as Reservation[];
      return;
    }
    // Le cast est nécessaire : TypeScript ne peut pas relier K à la propriété
    // correspondante de SiteContent dans une écriture générique.
    (db.content as unknown as Record<string, unknown>)[key] = rows;
  }

  async getContent(): Promise<SiteContent> {
    const db = await this.#read();
    return structuredClone(db.content);
  }

  async getSingleton<K extends SingletonKey>(key: K): Promise<SingletonMap[K]> {
    const db = await this.#read();
    return structuredClone(db.content[key]) as SingletonMap[K];
  }

  async updateSingleton<K extends SingletonKey>(
    key: K,
    patch: Partial<SingletonMap[K]>,
  ): Promise<SingletonMap[K]> {
    return enqueue(async () => {
      const db = await this.#read();
      const next = { ...db.content[key], ...patch } as SingletonMap[K];
      const updated: DatabaseFile = {
        ...db,
        content: { ...db.content, [key]: next },
      };
      await this.#write(updated);
      return structuredClone(next);
    });
  }

  async list<K extends CollectionKey>(key: K): Promise<CollectionMap[K][]> {
    const db = await this.#read();
    const rows = structuredClone(this.#collection(db, key));
    if (key === 'reservations') {
      return (rows as Reservation[]).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ) as CollectionMap[K][];
    }
    return (rows as { position: number }[]).sort(
      (a, b) => a.position - b.position,
    ) as CollectionMap[K][];
  }

  async create<K extends CollectionKey>(
    key: K,
    data: NewRecord<K>,
  ): Promise<CollectionMap[K]> {
    return enqueue(async () => {
      const db = await this.#read();
      const rows = this.#collection(db, key);
      const record = {
        ...data,
        id: data.id ?? randomUUID(),
      } as CollectionMap[K];

      this.#setCollection(db, key, [...rows, record]);
      await this.#write(db);
      return structuredClone(record);
    });
  }

  async update<K extends CollectionKey>(
    key: K,
    id: string,
    patch: Partial<CollectionMap[K]>,
  ): Promise<CollectionMap[K]> {
    return enqueue(async () => {
      const db = await this.#read();
      const rows = this.#collection(db, key);
      const index = rows.findIndex((row) => (row as { id: string }).id === id);
      if (index === -1) {
        throw new StoreError('Élément introuvable.', 404);
      }

      const next = { ...rows[index], ...patch, id } as CollectionMap[K];
      const copy = [...rows];
      copy[index] = next;

      this.#setCollection(db, key, copy);
      await this.#write(db);
      return structuredClone(next);
    });
  }

  async remove<K extends CollectionKey>(key: K, id: string): Promise<void> {
    return enqueue(async () => {
      const db = await this.#read();
      const rows = this.#collection(db, key);
      const copy = rows.filter((row) => (row as { id: string }).id !== id);

      if (copy.length === rows.length) {
        throw new StoreError('Élément introuvable.', 404);
      }

      // Supprimer une catégorie supprime aussi ses produits (intégrité).
      if (key === 'categories') {
        db.content.items = db.content.items.filter(
          (item) => item.categoryId !== id,
        );
      }

      this.#setCollection(db, key, copy);
      await this.#write(db);
    });
  }

  async reorder<K extends CollectionKey>(key: K, ids: string[]): Promise<void> {
    return enqueue(async () => {
      const db = await this.#read();
      const rows = this.#collection(db, key) as ({ id: string } & {
        position: number;
      })[];

      const next = rows.map((row) => {
        const index = ids.indexOf(row.id);
        return index === -1 ? row : { ...row, position: index + 1 };
      });

      this.#setCollection(db, key, next as CollectionMap[K][]);
      await this.#write(db);
    });
  }

  async getAdminUser(): Promise<AdminUserRecord | null> {
    const db = await this.#read();
    return db.admin ? structuredClone(db.admin) : null;
  }

  async saveAdminUser(user: AdminUserRecord): Promise<AdminUserRecord> {
    return enqueue(async () => {
      const db = await this.#read();
      await this.#write({ ...db, admin: user });
      return structuredClone(user);
    });
  }
}
