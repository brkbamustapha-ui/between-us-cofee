import { PageHeader } from '@/components/admin/shell';
import { getStore } from '@/lib/db';
import { ContentTabs } from './content-tabs';

export const dynamic = 'force-dynamic';

/** Édition de tous les textes du site public. */
export default async function ContentPage() {
  const store = getStore();

  const [hero, about, footer, sections] = await Promise.all([
    store.getSingleton('hero'),
    store.getSingleton('about'),
    store.getSingleton('footer'),
    store.list('sections'),
  ]);

  return (
    <>
      <PageHeader
        title="Textes du site"
        description="Chaque mot affiché sur la page d’accueil se modifie ici. Les changements sont visibles immédiatement."
      />
      <ContentTabs
        hero={hero}
        about={about}
        footer={footer}
        sections={sections}
      />
    </>
  );
}
