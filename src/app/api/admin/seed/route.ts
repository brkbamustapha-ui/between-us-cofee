import { z } from 'zod';

import { handleError, ok, readJson } from '@/lib/api/respond';
import { requireAdmin } from '@/lib/auth/admin';
import { getStore, invalidateSiteContent } from '@/lib/db';
import { cloneDefaultContent } from '@/lib/db/default-content';
import { SINGLETON_KEYS } from '@/types/content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const bodySchema = z
  .object({
    /** Réinitialise aussi les textes (réglages, hero, à propos, contact…). */
    resetSingletons: z.boolean().default(true),
    /** Supprime les photos et vidéos déjà en ligne. Désactivé par défaut. */
    resetMedia: z.boolean().default(false),
  })
  .strict();

/**
 * Initialise (ou réinitialise) le contenu par défaut.
 *
 * Utilisé après la création du schéma Supabase : les tables sont vides, ce
 * bouton les peuple avec les sections, catégories, emplacements de menu et
 * réseaux sociaux. Les identifiants du seed ne sont jamais réutilisés — c'est
 * la base qui génère les UUID — et les produits sont recrachés avec le bon
 * `categoryId` grâce à une table de correspondance par slug.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = bodySchema.parse(
      await readJson(request).catch(() => ({})),
    );

    const store = getStore();
    const defaults = cloneDefaultContent();

    if (body.resetSingletons) {
      for (const key of SINGLETON_KEYS) {
        await store.updateSingleton(key, defaults[key]);
      }
    }

    // Vider dans l'ordre inverse des dépendances (produits avant catégories).
    for (const id of (await store.list('items')).map((row) => row.id)) {
      await store.remove('items', id);
    }
    for (const id of (await store.list('categories')).map((row) => row.id)) {
      await store.remove('categories', id);
    }
    for (const id of (await store.list('sections')).map((row) => row.id)) {
      await store.remove('sections', id);
    }
    for (const id of (await store.list('socials')).map((row) => row.id)) {
      await store.remove('socials', id);
    }

    if (body.resetMedia) {
      for (const id of (await store.list('gallery')).map((row) => row.id)) {
        await store.remove('gallery', id);
      }
      for (const id of (await store.list('videos')).map((row) => row.id)) {
        await store.remove('videos', id);
      }
    }

    for (const section of defaults.sections) {
      const { id: _id, ...data } = section;
      await store.create('sections', data);
    }

    for (const social of defaults.socials) {
      const { id: _id, ...data } = social;
      await store.create('socials', data);
    }

    // slug du seed → identifiant réellement attribué par la base
    const categoryIds = new Map<string, string>();

    for (const category of defaults.categories) {
      const { id: seedId, ...data } = category;
      const created = await store.create('categories', data);
      categoryIds.set(seedId, created.id);
    }

    let itemCount = 0;
    for (const item of defaults.items) {
      const mapped = categoryIds.get(item.categoryId);
      if (!mapped) continue;

      const { id: _id, ...data } = item;
      await store.create('items', { ...data, categoryId: mapped });
      itemCount += 1;
    }

    invalidateSiteContent();

    return ok({
      sections: defaults.sections.length,
      categories: categoryIds.size,
      items: itemCount,
      socials: defaults.socials.length,
    });
  } catch (error) {
    return handleError(error);
  }
}
