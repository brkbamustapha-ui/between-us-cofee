import { fail, handleError, ok, readJson } from '@/lib/api/respond';
import { requireAdmin } from '@/lib/auth/admin';
import { getStore, invalidateSiteContent } from '@/lib/db';
import { SINGLETON_KEYS, type SingletonKey } from '@/types/content';
import { singletonSchemas } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseKey(value: string): SingletonKey | null {
  return (SINGLETON_KEYS as readonly string[]).includes(value)
    ? (value as SingletonKey)
    : null;
}

/** Lecture d'un bloc de contenu unique (réglages, hero, à propos…). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    await requireAdmin();
    const key = parseKey((await params).key);
    if (!key) return fail('Bloc de contenu inconnu.', 404);

    return ok(await getStore().getSingleton(key));
  } catch (error) {
    return handleError(error);
  }
}

/** Mise à jour complète d'un bloc — le site public reflète le changement aussitôt. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    await requireAdmin();
    const key = parseKey((await params).key);
    if (!key) return fail('Bloc de contenu inconnu.', 404);

    const payload = singletonSchemas[key].parse(await readJson(request));
    const updated = await getStore().updateSingleton(key, payload);

    invalidateSiteContent();
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
