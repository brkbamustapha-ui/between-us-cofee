import { PageHeader } from '@/components/admin/shell';
import { SingletonForm } from '@/components/admin/singleton-form';
import { Notice } from '@/components/admin/ui';
import { getStore } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const contact = await getStore().getSingleton('contact');

  return (
    <>
      <PageHeader
        title="Contact & horaires"
        description="Coordonnées, adresse, carte et horaires d’ouverture affichés sur le site."
      />

      <div className="mb-5">
        <Notice tone="info">
          <p>
            <strong className="font-semibold">Carte Google Maps :</strong> ouvrez
            votre établissement sur Google Maps → Partager → Intégrer une carte →
            copiez uniquement l’URL contenue dans <code>src=&quot;…&quot;</code>.
          </p>
        </Notice>
      </div>

      <SingletonForm
        sectionKey="contact"
        initial={contact}
        groups={[
          {
            title: 'Coordonnées',
            fields: [
              { kind: 'tel', name: 'phone', label: 'Téléphone', placeholder: '0X XX XX XX XX' },
              { kind: 'tel', name: 'whatsapp', label: 'WhatsApp' },
              { kind: 'email', name: 'email', label: 'E-mail' },
            ],
          },
          {
            title: 'Adresse',
            description:
              'Renseignez l’adresse exacte : elle alimente aussi les données structurées lues par Google.',
            fields: [
              { kind: 'text', name: 'addressLine', label: 'Adresse', span: 2 },
              { kind: 'text', name: 'city', label: 'Ville' },
              { kind: 'text', name: 'country', label: 'Pays' },
              {
                kind: 'url',
                name: 'mapsUrl',
                label: 'Lien Google Maps',
                help: 'Utilisé par le bouton « Itinéraire ».',
                span: 2,
              },
              {
                kind: 'url',
                name: 'mapsEmbedUrl',
                label: 'URL d’intégration de la carte',
                help: 'La carte ne s’affiche que si ce champ est rempli.',
                span: 2,
              },
            ],
          },
          {
            title: 'Horaires',
            fields: [
              { kind: 'hours', name: 'hours', label: 'Ouverture' },
              {
                kind: 'text',
                name: 'hoursNote',
                label: 'Note sur les horaires',
                span: 2,
              },
            ],
          },
        ]}
      />
    </>
  );
}
