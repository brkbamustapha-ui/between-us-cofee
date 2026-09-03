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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    await requireAdmin();
    const key = parseKey((await params).key);
    if (!key) return fail('Collection inconnue.', 404);

    return ok(await getStore().list(key));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    await requireAdmin();
    const key = parseKey((await params).key);
    if (!key) return fail('Collection inconnue.', 404);

    const payload = collectionSchemas[key].parse(await readJson(request));
    const created = await getStore().create(key, payload);

    invalidateSiteContent();
    return ok(created, 201);
  } catch (error) {
    return handleError(error);
  }
}
