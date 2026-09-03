import { fail, handleError, ok, readJson } from '@/lib/api/respond';
import { requireAdmin } from '@/lib/auth/admin';
import { getStore, invalidateSiteContent } from '@/lib/db';
import { COLLECTION_KEYS, type CollectionKey } from '@/types/content';
import { collectionSchemas } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseKey(value: string): CollectionKey | null {
  return (COLLECTION_KEYS as readonly string[]).includes(value)
    ? (value as CollectionKey)
    : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string; id: string }> },
) {
  try {
    await requireAdmin();
    const { key: rawKey, id } = await params;
    const key = parseKey(rawKey);
    if (!key) return fail('Collection inconnue.', 404);

    // `.partial()` : le dashboard envoie parfois un seul champ (bascule
    // « activé », changement de badge…), sans avoir à renvoyer tout l'objet.
    const schema = collectionSchemas[key];
    const partial =
      'partial' in schema && typeof schema.partial === 'function'
        ? schema.partial()
        : schema;

    const payload = partial.parse(await readJson(request));
    const updated = await getStore().update(key, id, payload);

    invalidateSiteContent();
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string; id: string }> },
) {
  try {
    await requireAdmin();
    const { key: rawKey, id } = await params;
    const key = parseKey(rawKey);
    if (!key) return fail('Collection inconnue.', 404);

    await getStore().remove(key, id);

    invalidateSiteContent();
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}
