import { PageHeader } from '@/components/admin/shell';
import { getStore } from '@/lib/db';
import { SocialsManager } from './socials-manager';

export const dynamic = 'force-dynamic';

export default async function SocialsPage() {
  const socials = await getStore().list('socials');

  return (
    <>
      <PageHeader
        title="Réseaux sociaux"
        description="Les liens affichés dans la section Contact et dans le pied de page."
      />
      <SocialsManager initial={socials} />
    </>
  );
}
