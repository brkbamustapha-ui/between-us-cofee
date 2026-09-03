import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import type { ReadableOptions } from 'node:stream';

import { uploadsDir } from '@/lib/paths';

export const runtime = 'nodejs';

/**
 * Sert les médias du stockage local (mode sans Supabase).
 *
 * Pourquoi une route et pas `public/` : Next.js constitue la liste des fichiers
 * statiques au moment du build. Un fichier téléversé après coup dans `public/`
 * renvoie 404 en production. Cette route lit le disque à chaque requête, ce qui
 * rend le mode local réellement utilisable.
 *
 * En production avec Supabase Storage configuré, les URL pointent directement
 * sur le CDN de Supabase et cette route n'est jamais sollicitée.
 */

const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path ?? [];

  // Aucun segment ne doit permettre de sortir du dossier des médias.
  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        !segment || segment === '.' || segment === '..' || segment.includes('/'),
    )
  ) {
    return new Response('Not found', { status: 404 });
  }

  const root = uploadsDir();
  const target = normalize(join(root, ...segments));

  // Double garde : le chemin résolu doit rester sous la racine des médias.
  if (target !== root && !target.startsWith(root + sep)) {
    return new Response('Not found', { status: 404 });
  }

  let size: number;
  try {
    const info = await stat(target);
    if (!info.isFile()) return new Response('Not found', { status: 404 });
    size = info.size;
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const contentType =
    CONTENT_TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream';

  const stream = createReadStream(target) as unknown as {
    [Symbol.asyncIterator](options?: ReadableOptions): AsyncIterableIterator<Buffer>;
  };

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(new Uint8Array(chunk));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    }),
    {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(size),
        // Le nom de fichier contient un UUID : le contenu ne change jamais.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
