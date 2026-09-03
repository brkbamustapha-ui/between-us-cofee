import { handleError, ok, readJson } from '@/lib/api/respond';
import { requireAdmin } from '@/lib/auth/admin';
import { getStore, invalidateSiteContent } from '@/lib/db';
import { menuImportSchema } from '@/lib/validation/schemas';
import type { MenuBadge } from '@/types/content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Slug URL sûr, dérivé du nom de catégorie. */
function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'categorie'
  );
}

/**
 * Import de la carte officielle au format JSON.
 *
 * C'est le chemin prévu pour remplacer les emplacements vides par la vraie
 * carte : un seul appel crée les catégories et leurs produits, marqués
 * `isPlaceholder: false` puisque les données proviennent de la maison.
 *
 * Corps attendu :
 * {
 *   "replaceExisting": true,
 *   "categories": [
 *     { "name": "Coffee", "description": "...", "items": [
 *       { "name": "Espresso", "description": "...", "price": 150 }
 *     ]}
 *   ]
 * }
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = menuImportSchema.parse(await readJson(request));
    const store = getStore();

    if (body.replaceExisting) {
      for (const id of (await store.list('items')).map((row) => row.id)) {
        await store.remove('items', id);
      }
      for (const id of (await store.list('categories')).map((row) => row.id)) {
        await store.remove('categories', id);
      }
    }

    const existingSlugs = new Set(
      (await store.list('categories')).map((row) => row.slug),
    );

    let categoryCount = 0;
    let itemCount = 0;

    for (const [index, category] of body.categories.entries()) {
      let slug = category.slug ? slugify(category.slug) : slugify(category.name);
      // Le slug est unique en base : on suffixe en cas de collision.
      let attempt = 2;
      while (existingSlugs.has(slug)) {
        slug = `${slugify(category.name)}-${attempt}`;
        attempt += 1;
      }
      existingSlugs.add(slug);

      const created = await store.create('categories', {
        name: category.name,
        slug,
        description: category.description ?? '',
        imageUrl: '',
        position: index + 1,
        enabled: true,
      });
      categoryCount += 1;

      for (const [itemIndex, item] of category.items.entries()) {
        await store.create('items', {
          categoryId: created.id,
          name: item.name,
          description: item.description ?? '',
          price: item.price ?? null,
          imageUrl: item.imageUrl ?? '',
          badges: (item.badges ?? []) as MenuBadge[],
          position: itemIndex + 1,
          enabled: true,
          // Donnée fournie par la maison : ce n'est plus un emplacement vide.
          isPlaceholder: false,
        });
        itemCount += 1;
      }
    }

    invalidateSiteContent();
    return ok({ categories: categoryCount, items: itemCount });
  } catch (error) {
    return handleError(error);
  }
}
