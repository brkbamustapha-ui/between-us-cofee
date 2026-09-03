import { z } from 'zod';

import { fail, handleError, ok, readJson } from '@/lib/api/respond';
import { requireAdmin } from '@/lib/auth/admin';
import { deleteMedia, uploadMedia } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Compression d'image + envoi vers le stockage : au-delà des 10 s par défaut.
export const maxDuration = 60;

const FOLDERS = ['gallery', 'videos', 'menu', 'content', 'brand'] as const;
type Folder = (typeof FOLDERS)[number];

/** Envoi d'un fichier (multipart/form-data : `file`, `folder`). */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const form = await request.formData().catch(() => null);
    if (!form) return fail('Requête multipart/form-data attendue.', 400);

    const file = form.get('file');
    if (!(file instanceof File)) {
      return fail('Aucun fichier reçu.', 400);
    }

    const rawFolder = String(form.get('folder') ?? 'content');
    const folder: Folder = (FOLDERS as readonly string[]).includes(rawFolder)
      ? (rawFolder as Folder)
      : 'content';

    return ok(await uploadMedia(file, folder));
  } catch (error) {
    return handleError(error);
  }
}

const deleteSchema = z.object({ url: z.string().min(1).max(2000) }).strict();

/** Suppression d'un fichier du stockage. */
export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { url } = deleteSchema.parse(await readJson(request));
    return ok({ deleted: await deleteMedia(url) });
  } catch (error) {
    return handleError(error);
  }
}
