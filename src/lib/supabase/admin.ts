import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase à privilèges élevés (clé `service_role`).
 *
 * ⚠️ SERVEUR UNIQUEMENT. Ce module importe `server-only` : toute tentative de
 * l'importer depuis un composant client provoque une erreur de compilation, ce
 * qui garantit que la clé ne peut pas fuiter dans le bundle navigateur.
 */

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
  bucket: string;
}

export function readSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) return null;

  return {
    url,
    serviceRoleKey,
    bucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'media',
  };
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseConfig() !== null;
}

let cachedClient: SupabaseClient | null = null;

/** Renvoie le client service_role, ou `null` si Supabase n'est pas configuré. */
export function getSupabaseAdmin(): SupabaseClient | null {
  const config = readSupabaseConfig();
  if (!config) return null;

  cachedClient ??= createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'between-us-admin' } },
  });

  return cachedClient;
}
