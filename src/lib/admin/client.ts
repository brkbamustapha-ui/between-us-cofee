import type {
  CollectionKey,
  CollectionMap,
  SingletonKey,
  SingletonMap,
} from '@/types/content';

/**
 * Client HTTP du dashboard.
 *
 * Une seule fonction traverse toutes les routes admin : elle normalise le
 * format de réponse `{ ok, data | error }` et transforme toute erreur — réseau,
 * validation, session expirée — en `ApiError` porteuse d'un message affichable.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  url: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...rest.headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError('Connexion au serveur impossible.', 0);
  }

  // Une session expirée renvoie 401 : on ramène l'utilisateur à la connexion
  // plutôt que d'afficher une erreur qu'il ne peut pas résoudre.
  if (response.status === 401 && typeof window !== 'undefined') {
    window.location.href = `/admin/login?next=${encodeURIComponent(
      window.location.pathname,
    )}`;
    throw new ApiError('Session expirée.', 401);
  }

  let payload: { ok?: boolean; data?: T; error?: string } | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    throw new ApiError(
      payload?.error ?? `Erreur ${response.status}.`,
      response.status,
    );
  }

  return payload.data as T;
}

/* -------------------------------------------------------------------------- */
/*  Blocs de contenu                                                           */
/* -------------------------------------------------------------------------- */

export function saveSingleton<K extends SingletonKey>(
  key: K,
  value: SingletonMap[K],
): Promise<SingletonMap[K]> {
  return request<SingletonMap[K]>(`/api/admin/content/${key}`, {
    method: 'PUT',
    json: value,
  });
}

/* -------------------------------------------------------------------------- */
/*  Collections                                                                */
/* -------------------------------------------------------------------------- */

export function listRecords<K extends CollectionKey>(
  key: K,
): Promise<CollectionMap[K][]> {
  return request<CollectionMap[K][]>(`/api/admin/collections/${key}`, {
    cache: 'no-store',
  });
}

export function createRecord<K extends CollectionKey>(
  key: K,
  data: Omit<CollectionMap[K], 'id'>,
): Promise<CollectionMap[K]> {
  return request<CollectionMap[K]>(`/api/admin/collections/${key}`, {
    method: 'POST',
    json: data,
  });
}

export function updateRecord<K extends CollectionKey>(
  key: K,
  id: string,
  patch: Partial<CollectionMap[K]>,
): Promise<CollectionMap[K]> {
  return request<CollectionMap[K]>(`/api/admin/collections/${key}/${id}`, {
    method: 'PATCH',
    json: patch,
  });
}

export function deleteRecord(key: CollectionKey, id: string): Promise<unknown> {
  return request(`/api/admin/collections/${key}/${id}`, { method: 'DELETE' });
}

export function reorderRecords(
  key: CollectionKey,
  ids: string[],
): Promise<unknown> {
  return request(`/api/admin/collections/${key}/reorder`, {
    method: 'POST',
    json: { ids },
  });
}

/* -------------------------------------------------------------------------- */
/*  Médias                                                                     */
/* -------------------------------------------------------------------------- */

export interface UploadResult {
  url: string;
  kind: 'image' | 'video';
  bytes: number;
  contentType: string;
  path: string;
}

export async function uploadFile(
  file: File,
  folder: 'gallery' | 'videos' | 'menu' | 'content' | 'brand',
): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  return request<UploadResult>('/api/admin/upload', {
    method: 'POST',
    body: form,
  });
}

export function deleteFile(url: string): Promise<unknown> {
  return request('/api/admin/upload', { method: 'DELETE', json: { url } });
}

export type LibraryEntry = {
  url: string;
  name: string;
  bytes: number;
  kind: 'image' | 'video';
  source: 'repo' | 'upload';
};

/** Médias déjà présents dans le projet : `public/` et téléversements locaux. */
export function listMediaLibrary(): Promise<{
  files: LibraryEntry[];
  truncated: boolean;
}> {
  return request('/api/admin/media/library');
}

/* -------------------------------------------------------------------------- */
/*  Compte et maintenance                                                      */
/* -------------------------------------------------------------------------- */

export function logoutRequest(): Promise<unknown> {
  return request('/api/admin/logout', { method: 'POST' });
}

export function changeUsernameRequest(
  username: string,
  currentPassword: string,
): Promise<{ username: string }> {
  return request('/api/admin/security', {
    method: 'POST',
    json: { action: 'username', username, currentPassword },
  });
}

export function changePasswordRequest(
  currentPassword: string,
  newPassword: string,
): Promise<{ changed: boolean }> {
  return request('/api/admin/security', {
    method: 'POST',
    json: { action: 'password', currentPassword, newPassword },
  });
}

export function seedContent(options: {
  resetSingletons: boolean;
  resetMedia: boolean;
}): Promise<{
  sections: number;
  categories: number;
  items: number;
  socials: number;
}> {
  return request('/api/admin/seed', { method: 'POST', json: options });
}

export function importMenu(payload: unknown): Promise<{
  categories: number;
  items: number;
}> {
  return request('/api/admin/menu-import', { method: 'POST', json: payload });
}
