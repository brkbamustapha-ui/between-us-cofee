/**
 * Helpers d'URL de média — sans aucune dépendance Node.
 *
 * Ce module est importé aussi bien par les composants client que par le
 * serveur : il ne doit donc jamais toucher au système de fichiers (les chemins
 * disque vivent dans `@/lib/paths`, réservé au serveur).
 */

/** Préfixe des URL servies par la route de médias locale. */
export const LOCAL_MEDIA_PREFIX = '/api/media/';

/** `true` si l'URL désigne un fichier que nous hébergeons (local ou Supabase). */
export function isManagedMediaUrl(url: string): boolean {
  return (
    url.startsWith(LOCAL_MEDIA_PREFIX) ||
    url.includes('/storage/v1/object/public/')
  );
}
