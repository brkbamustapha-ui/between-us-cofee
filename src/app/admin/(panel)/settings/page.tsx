import { PageHeader } from '@/components/admin/shell';
import { SingletonForm } from '@/components/admin/singleton-form';
import { Card, Notice } from '@/components/admin/ui';
import { PanelSection } from '@/components/admin/panel-section';
import { getStore, getStorageStatus } from '@/lib/db';
import { SeedPanel } from './seed-panel';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getStore().getSingleton('settings');
  const storage = getStorageStatus();

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Identité visuelle, référencement et maintenance du site."
      />

      <PanelSection
        tabs={[
          {
            label: 'Identité & SEO',
            content: (
              <SingletonForm
                sectionKey="settings"
                initial={settings}
                groups={[
                  {
                    title: 'Identité visuelle',
                    description:
                      'Téléversez le logo officiel : le header, le hero, la scène 3D et le footer l’utilisent aussitôt, sans jamais le déformer.',
                    fields: [
                      {
                        kind: 'media',
                        name: 'logoUrl',
                        label: 'Logo complet',
                        accept: 'image',
                        folder: 'brand',
                        aspect: 'aspect-[3/1]',
                        help: 'PNG ou WebP à fond transparent de préférence.',
                      },
                      {
                        kind: 'media',
                        name: 'logoMarkUrl',
                        label: 'Monogramme « BU »',
                        accept: 'image',
                        folder: 'brand',
                        aspect: 'aspect-square',
                        help: 'Utilisé dans la scène 3D et les formats compacts.',
                      },
                      { kind: 'text', name: 'brandName', label: 'Nom complet' },
                      { kind: 'text', name: 'shortName', label: 'Nom court' },
                      { kind: 'text', name: 'tagline', label: 'Signature', span: 2 },
                    ],
                  },
                  {
                    title: 'Couleurs',
                    description:
                      'Valeurs extraites du logo. Elles alimentent le thème du navigateur et le manifeste de l’application.',
                    fields: [
                      { kind: 'color', name: 'colorInk', label: 'Vert profond' },
                      { kind: 'color', name: 'colorLime', label: 'Vert lime' },
                    ],
                  },
                  {
                    title: 'Référencement',
                    fields: [
                      { kind: 'text', name: 'metaTitle', label: 'Titre (balise title)', span: 2 },
                      {
                        kind: 'textarea',
                        name: 'metaDescription',
                        label: 'Description',
                        rows: 3,
                        help: '150 à 160 caractères pour un affichage complet dans Google.',
                      },
                      {
                        kind: 'media',
                        name: 'ogImageUrl',
                        label: 'Image de partage (1200 × 630)',
                        accept: 'image',
                        folder: 'brand',
                        aspect: 'aspect-[1200/630]',
                      },
                    ],
                  },
                  {
                    title: 'Bandeau d’information',
                    fields: [
                      {
                        kind: 'text',
                        name: 'announcement',
                        label: 'Message',
                        span: 2,
                        placeholder: 'Fermeture exceptionnelle le 1er novembre',
                      },
                      {
                        kind: 'toggle',
                        name: 'announcementEnabled',
                        label: 'Afficher le bandeau',
                      },
                    ],
                  },
                  {
                    title: 'Maintenance',
                    fields: [
                      {
                        kind: 'toggle',
                        name: 'maintenanceMode',
                        label: 'Mode maintenance',
                        description:
                          'Retire le site de l’index des moteurs de recherche (robots.txt et balise meta). Le site reste accessible aux visiteurs.',
                      },
                    ],
                  },
                ]}
              />
            ),
          },
          {
            label: 'Données',
            content: (
              <div className="space-y-5">
                <Card title="Stockage" description={storage.message}>
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between gap-3 border-b border-line pb-2.5">
                      <dt className="text-fg-muted">Backend actif</dt>
                      <dd className="font-medium text-cream">
                        {storage.kind === 'supabase'
                          ? 'Supabase (PostgreSQL + Storage)'
                          : 'Fichier local (.data/content.json)'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-fg-muted">Écriture</dt>
                      <dd
                        className={
                          storage.writable
                            ? 'font-medium text-ok'
                            : 'font-medium text-danger'
                        }
                      >
                        {storage.writable ? 'Possible' : 'Impossible'}
                      </dd>
                    </div>
                  </dl>

                  {!storage.supabaseConfigured && (
                    <div className="mt-4">
                      <Notice tone="warn">
                        Renseignez <code>NEXT_PUBLIC_SUPABASE_URL</code> et{' '}
                        <code>SUPABASE_SERVICE_ROLE_KEY</code>, puis exécutez{' '}
                        <code>supabase/schema.sql</code> avant la mise en
                        production.
                      </Notice>
                    </div>
                  )}
                </Card>

                <SeedPanel />
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
