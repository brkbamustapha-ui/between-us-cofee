import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/admin/shell';
import { getStore } from '@/lib/db';
import { CategoriesManager } from './categories-manager';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const store = getStore();
  const [categories, items] = await Promise.all([
    store.list('categories'),
    store.list('items'),
  ]);

  return (
    <>
      <PageHeader
        title="Catégories du menu"
        description="Nommer, décrire, réordonner et masquer les catégories de la carte."
        action={
          <Link
            href="/admin/menu"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-medium text-cream transition-colors hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au menu
          </Link>
        }
      />
      <CategoriesManager initial={categories} items={items} />
    </>
  );
}
