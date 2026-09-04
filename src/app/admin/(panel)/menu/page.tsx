import Link from 'next/link';
import { ImageIcon, ListTree } from 'lucide-react';

import { PageHeader } from '@/components/admin/shell';
import { getStore } from '@/lib/db';
import { MenuManager } from './menu-manager';

export const dynamic = 'force-dynamic';

/** Page principale de gestion de la carte. */
export default async function MenuPage() {
  const store = getStore();
  const [categories, items] = await Promise.all([
    store.list('categories'),
    store.list('items'),
  ]);

  return (
    <>
      <PageHeader
        title="Menu"
        description="Produits, prix, photos et badges. Toute modification apparaît aussitôt sur le site."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/menu/photos"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-medium text-cream transition-colors hover:bg-white/5"
            >
              <ImageIcon className="h-4 w-4" />
              Photos
            </Link>
            <Link
              href="/admin/menu/categories"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-medium text-cream transition-colors hover:bg-white/5"
            >
              <ListTree className="h-4 w-4" />
              Catégories
            </Link>
          </div>
        }
      />
      <MenuManager categories={categories} items={items} />
    </>
  );
}
