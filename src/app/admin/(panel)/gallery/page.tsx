import { PageHeader } from '@/components/admin/shell';
import { getStore } from '@/lib/db';
import { GalleryManager } from './gallery-manager';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const photos = await getStore().list('gallery');

  return (
    <>
      <PageHeader
        title="Galerie"
        description="Les photos affichées sur le site public, dans l’ordre choisi ici."
      />
      <GalleryManager initial={photos} />
    </>
  );
}
