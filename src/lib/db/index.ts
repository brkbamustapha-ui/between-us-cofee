import 'server-only';

import { revalidateTag, unstable_cache } from 'next/cache';

import type { SiteContent } from '@/types/content';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';
import { FileStore } from './file-store';
import { SupabaseStore } from './supabase-store';
import type { ContentStore } from './store';

/** Tag de cache du contenu public — invalidé à chaque écriture du dashboard. */
export const SITE_CONTENT_TAG = 'site-content';

let store: ContentStore | null = null;

/**
 * Renvoie l'implémentation de persistance active.
 *
 * Supabase dès que `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
 * sont définies, sinon le stockage fichier local. Le site ne se casse jamais :
 * sans configuration, il tourne sur le contenu par défaut et le dashboard
 * signale ce qu'il reste à configurer.
 */
export function getStore(): ContentStore {
  if (store) return store;

  const client = getSupabaseAdmin();
  store = client ? new SupabaseStore(client) : new FileStore();
  return store;
}

/** Décrit l'état de configuration, affiché dans le dashboard. */
export function getStorageStatus(): {
  kind: 'supabase' | 'file';
  supabaseConfigured: boolean;
  writable: boolean;
  message: string;
} {
  const active = getStore();
  const supabaseConfigured = isSupabaseConfigured();

  if (supabaseConfigured) {
    return {
      kind: 'supabase',
      supabaseConfigured: true,
      writable: true,
      message: 'Supabase connecté — contenu et médias persistés.',
    };
  }

  const writable = active.writable && process.env.VERCEL !== '1';

  return {
    kind: 'file',
    supabaseConfigured: false,
    writable,
    message: writable
      ? 'Mode local : le contenu est enregistré dans .data/content.json. Configurez Supabase avant la mise en production.'
      : 'Supabase n’est pas configuré et le système de fichiers est en lecture seule : les modifications ne peuvent pas être enregistrées. Renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.',
  };
}

/**
 * Lecture du contenu public, mise en cache et invalidée par les écritures admin.
 *
 * Conséquence directe : une modification faite dans le dashboard est visible sur
 * le site public dès le rechargement suivant, sans redéploiement.
 */
const readContent = unstable_cache(
  async (): Promise<SiteContent> => getStore().getContent(),
  ['site-content'],
  { tags: [SITE_CONTENT_TAG], revalidate: 300 },
);

export async function getSiteContent(): Promise<SiteContent> {
  return readContent();
}

/** À appeler après toute écriture du dashboard. */
export function invalidateSiteContent(): void {
  revalidateTag(SITE_CONTENT_TAG);
}

export { StoreError } from './store';
export type { ContentStore, AdminUserRecord } from './store';
