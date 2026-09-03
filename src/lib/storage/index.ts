import 'server-only';

import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import sharp from 'sharp';

import { getSupabaseAdmin, readSupabaseConfig } from '@/lib/supabase/admin';
import { StoreError } from '@/lib/db/store';
import { uploadsDir } from '@/lib/paths';
import { LOCAL_MEDIA_PREFIX } from '@/lib/media-url';

/**
 * Stockage des médias.
 *
 * Supabase Storage lorsque le projet est configuré, sinon le dossier de
 * données local, servi par la route `/api/media/…` (développement local
 * uniquement — le système de fichiers de Vercel est en lecture seule).
 *
 * Les images sont recompressées avant stockage : redimensionnement à 2000 px de
 * large maximum et conversion en WebP. Une photo de 6 Mo sortie d'un téléphone
 * pèse ainsi typiquement 200 à 400 Ko, ce qui change tout sur mobile.
 */

export const IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const VIDEO_TYPES = ['video/mp4', 'video/webm'] as const;

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 Mo avant compression
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 Mo

const MAX_IMAGE_WIDTH = 2000;
const WEBP_QUALITY = 82;

export type MediaKind = 'image' | 'video';

export interface StoredMedia {
  url: string;
  kind: MediaKind;
  bytes: number;
  contentType: string;
  /** Chemin interne au bucket / au dossier public — sert à la suppression. */
  path: string;
}

export function detectKind(contentType: string): MediaKind | null {
  if ((IMAGE_TYPES as readonly string[]).includes(contentType)) return 'image';
  if ((VIDEO_TYPES as readonly string[]).includes(contentType)) return 'video';
  return null;
}

function safeExtension(filename: string, fallback: string): string {
  const ext = extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return ext && ext.length <= 6 ? ext : fallback;
}

/**
 * Valide puis prépare le fichier : les images sont converties en WebP, les
 * vidéos sont conservées telles quelles (le transcodage vidéo n'a pas sa place
 * dans une fonction serverless).
 */
async function prepare(file: File): Promise<{
  buffer: Buffer;
  contentType: string;
  extension: string;
  kind: MediaKind;
}> {
  const kind = detectKind(file.type);

  if (!kind) {
    throw new StoreError(
      'Format non pris en charge. Formats acceptés : JPG, PNG, WebP, AVIF, MP4, WebM.',
      415,
    );
  }

  const limit = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size > limit) {
    throw new StoreError(
      `Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)} Mo). Limite : ${Math.round(limit / 1024 / 1024)} Mo.`,
      413,
    );
  }
  if (file.size === 0) {
    throw new StoreError('Le fichier est vide.', 400);
  }

  const input = Buffer.from(await file.arrayBuffer());

  if (kind === 'video') {
    return {
      buffer: input,
      contentType: file.type,
      extension: safeExtension(file.name, file.type === 'video/webm' ? '.webm' : '.mp4'),
      kind,
    };
  }

  try {
    const buffer = await sharp(input, { failOn: 'none' })
      .rotate() // applique l'orientation EXIF des photos prises au téléphone
      .resize({
        width: MAX_IMAGE_WIDTH,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    return { buffer, contentType: 'image/webp', extension: '.webp', kind };
  } catch {
    throw new StoreError(
      'Image illisible ou corrompue. Réessayez avec un autre fichier.',
      400,
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Écriture                                                                   */
/* -------------------------------------------------------------------------- */

export async function uploadMedia(
  file: File,
  folder: 'gallery' | 'videos' | 'menu' | 'content' | 'brand' = 'content',
): Promise<StoredMedia> {
  const { buffer, contentType, extension, kind } = await prepare(file);
  const path = `${folder}/${Date.now()}-${randomUUID()}${extension}`;

  const config = readSupabaseConfig();
  const client = getSupabaseAdmin();

  if (config && client) {
    const { error } = await client.storage
      .from(config.bucket)
      .upload(path, buffer, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      throw new StoreError(
        `Envoi vers Supabase Storage impossible : ${error.message}. Vérifiez que le bucket « ${config.bucket} » existe.`,
        500,
      );
    }

    const { data } = client.storage.from(config.bucket).getPublicUrl(path);
    return {
      url: data.publicUrl,
      kind,
      bytes: buffer.byteLength,
      contentType,
      path,
    };
  }

  // Repli local : hors de `public/`, car Next.js n'y sert que les fichiers
  // présents au moment du build.
  const target = join(uploadsDir(), path);

  try {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, buffer);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      throw new StoreError(
        'Impossible d’écrire le fichier : le système de fichiers est en lecture seule. Configurez Supabase Storage pour héberger les médias.',
        503,
      );
    }
    throw error;
  }

  return {
    url: `${LOCAL_MEDIA_PREFIX}${path}`,
    kind,
    bytes: buffer.byteLength,
    contentType,
    path,
  };
}

/* -------------------------------------------------------------------------- */
/*  Suppression                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Supprime un média à partir de son URL publique.
 *
 * Ne lève jamais : une URL externe (ou déjà supprimée) n'a pas à bloquer la
 * suppression de l'enregistrement qui la référence.
 */
export async function deleteMedia(url: string): Promise<boolean> {
  if (!url) return false;

  const config = readSupabaseConfig();
  const client = getSupabaseAdmin();

  if (config && client) {
    const marker = `/storage/v1/object/public/${config.bucket}/`;
    const index = url.indexOf(marker);
    if (index === -1) return false;

    const path = decodeURIComponent(url.slice(index + marker.length));
    const { error } = await client.storage.from(config.bucket).remove([path]);
    return !error;
  }

  if (!url.startsWith(LOCAL_MEDIA_PREFIX)) return false;

  // Empêche toute remontée d'arborescence via une URL forgée.
  const relative = decodeURIComponent(url.slice(LOCAL_MEDIA_PREFIX.length));
  if (relative.includes('..') || relative.startsWith('/')) return false;

  try {
    await unlink(join(uploadsDir(), relative));
    return true;
  } catch {
    return false;
  }
}
