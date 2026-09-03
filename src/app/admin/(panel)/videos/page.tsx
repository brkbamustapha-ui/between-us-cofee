import { PageHeader } from '@/components/admin/shell';
import { getStore } from '@/lib/db';
import { VideosManager } from './videos-manager';

export const dynamic = 'force-dynamic';

export default async function VideosPage() {
  const videos = await getStore().list('videos');

  return (
    <>
      <PageHeader
        title="Vidéos"
        description="La section « Between Us Experience » du site public."
      />
      <VideosManager initial={videos} />
    </>
  );
}
