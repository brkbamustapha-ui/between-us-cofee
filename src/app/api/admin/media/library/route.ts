import { readdir, stat } from 'node:fs/promises';
import { join, posix, relative, sep } from 'node:path';

import { handleError, ok } from '@/lib/api/respond';
import { requireAdmin } from '@/lib/auth/admin';
import { uploadsDir } from '@/lib/paths';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Inventaire des médias déjà présents dans le projet.
 *
 * Un fichier déposé dans `public/` (par exemple poussé sur GitHub depuis un
 * téléphone) est bien servi par le site, mais il n'était jusqu'ici sélectionnable
 * nulle part : il fallait connaître et recopier son chemin exact à la main. Cette
 * route liste ces fichiers pour que le dashboard les propose d'un clic.
 *
 * Deux emplacements sont parcourus :
 *  - `public/` — fichiers versionnés avec le code, servis à la racine du site ;
 *  - `.data/uploads/` — fichiers téléversés en mode local, servis par
 *    `/api/media/…`.
 *
 * Aucun chemin ne vient de la requête : la route n'expose que des fichiers déjà
 * publiquement accessibles, et l'accès reste réservé à l'administrateur.
 */

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.svg',
]);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov']);

/** Dossiers sans intérêt pour une galerie, écartés du parcours. */
const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git']);

/** Garde-fou : une arborescence inattendue ne doit pas faire exploser la réponse. */
const MAX_FILES = 500;
const MAX_DEPTH = 4;

export type LibraryEntry = {
  url: string;
  name: string;
  bytes: number;
  kind: 'image' | 'video';
  /** Origine, affichée pour distinguer un fichier du dépôt d'un téléversement. */
  source: 'repo' | 'upload';
};

function classify(name: string): 'image' | 'video' | null {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return null;
  const extension = name.slice(dot).toLowerCase();
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  return null;
}

/**
 * Parcourt un dossier et renvoie les médias trouvés.
 *
 * `toUrl` reçoit le chemin relatif à `root`, en séparateurs POSIX, et le
 * transforme en URL publique — la façon de servir diffère selon l'emplacement.
 */
async function collect(
  root: string,
  toUrl: (relativePath: string) => string,
  source: LibraryEntry['source'],
): Promise<LibraryEntry[]> {
  const found: LibraryEntry[] = [];

  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH || found.length >= MAX_FILES) return;

    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (found.length >= MAX_FILES) return;
      if (entry.name.startsWith('.')) continue;

      const absolute = join(directory, entry.name);

      if (entry.isDirectory()) {
        if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
        await walk(absolute, depth + 1);
        continue;
      }

      const kind = classify(entry.name);
      if (!kind) continue;

      const relativePath = relative(root, absolute).split(sep).join(posix.sep);
      const { size } = await stat(absolute);
      found.push({
        url: toUrl(relativePath),
        name: entry.name,
        bytes: size,
        kind,
        source,
      });
    }
  }

  try {
    await walk(root, 0);
  } catch {
    // Dossier absent (aucun téléversement local encore) : ce n'est pas une
    // erreur, l'autre emplacement suffit.
  }

  return found;
}

export async function GET() {
  try {
    await requireAdmin();

    const [repo, uploads] = await Promise.all([
      collect(
        join(process.cwd(), 'public'),
        (path) => `/${path}`,
        'repo',
      ),
      collect(uploadsDir(), (path) => `/api/media/${path}`, 'upload'),
    ]);

    // Les téléversements récents d'abord, puis le dépôt : on cherche le plus
    // souvent le fichier qu'on vient d'ajouter.
    const files = [...uploads, ...repo].sort((a, b) => {
      if (a.source !== b.source) return a.source === 'upload' ? -1 : 1;
      return a.name.localeCompare(b.name, 'fr', { numeric: true });
    });

    return ok({ files, truncated: files.length >= MAX_FILES });
  } catch (error) {
    return handleError(error);
  }
}
