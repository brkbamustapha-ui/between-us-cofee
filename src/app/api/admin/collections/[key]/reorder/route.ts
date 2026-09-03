import { z } from 'zod';

import { fail, handleError, ok, readJson } from '@/lib/api/respond';
import { requireAdmin } from '@/lib/auth/admin';
import { getStore, invalidateSiteContent } from '@/lib/db';
import { COLLECTION_KEYS, type CollectionKey } from '@/types/content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z
  .object({ ids: z.array(z.string().min(1)).max(500) })
  .strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    await requireAdmin();
    const raw = (await params).key;

    if (!(COLLECTION_KEYS as readonly string[]).includes(raw)) {
      return fail('Collection inconnue.', 404);
    }

    const { ids } = bodySchema.parse(await readJson(request));
    await getStore().reorder(raw as CollectionKey, ids);

    invalidateSiteContent();
    return ok({ ids });
  } catch (error) {
    return handleError(error);
  }
}
