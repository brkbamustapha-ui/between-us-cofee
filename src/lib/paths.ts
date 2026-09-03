import { join } from 'node:path';

/**
 * Chemins disque du mode local (sans Supabase). SERVEUR UNIQUEMENT — pour les
 * helpers d'URL utilisables côté client, voir `@/lib/media-url`.
 *
 * Le dossier de données est volontairement placé hors de `public/` : Next.js
 * fige la liste des fichiers statiques au moment du build, un fichier ajouté
 * ensuite dans `public/` n'y serait donc jamais servi. Les médias locaux
 * passent par la route `/api/media/…`.
 */
export function dataDir(): string {
  return process.env.BU_DATA_DIR ?? join(process.cwd(), '.data');
}

export function contentFilePath(): string {
  return join(dataDir(), 'content.json');
}

export function uploadsDir(): string {
  return join(dataDir(), 'uploads');
}
