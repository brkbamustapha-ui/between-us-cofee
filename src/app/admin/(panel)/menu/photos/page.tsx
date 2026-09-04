import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';

import { PageHeader } from '@/components/admin/shell';
import { getStore } from '@/lib/db';
import { PhotoBoard } from './photo-board';

export const dynamic = 'force-dynamic';

/**
 * Écran dédié aux photos de la carte.
 *
 * Passer par la fiche de chaque produit pour ajouter une image demande d'ouvrir
 * un formulaire par produit — long quand il y en a près de quatre-vingts. Cet
 * écran ne montre que ce qui manque et ne demande qu'une action par produit :
 * chercher, coller, suivant.
 */
export default async function MenuPhotosPage() {
  const store = getStore();
  const [categories, items] = await Promise.all([
    store.list('categories'),
    store.list('items'),
  ]);

  return (
    <>
      <PageHeader
        title="Photos de la carte"
        description="Une image par produit. Cherchez la photo, collez son adresse : elle est téléchargée et hébergée ici."
        action={
          <Link
            href="/admin/menu"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-medium text-cream transition-colors hover:bg-white/5"
          >
            <UtensilsCrossed className="h-4 w-4" />
            Produits
          </Link>
        }
      />
      <PhotoBoard categories={categories} items={items} />
    </>
  );
}
