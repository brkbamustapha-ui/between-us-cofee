import { PageHeader } from '@/components/admin/shell';
import { SingletonForm } from '@/components/admin/singleton-form';
import { PanelSection } from '@/components/admin/panel-section';
import { getStore } from '@/lib/db';
import { ReservationsManager } from './reservations-manager';

export const dynamic = 'force-dynamic';

export default async function ReservationsPage() {
  const store = getStore();
  const [reservations, settings] = await Promise.all([
    store.list('reservations'),
    store.getSingleton('reservation'),
  ]);

  return (
    <>
      <PageHeader
        title="Réservations"
        description="Les demandes reçues et le paramétrage du formulaire public."
      />

      <PanelSection
        tabs={[
          {
            label: `Demandes (${reservations.length})`,
            content: <ReservationsManager initial={reservations} />,
          },
          {
            label: 'Paramètres du formulaire',
            content: (
              <SingletonForm
                sectionKey="reservation"
                initial={settings}
                groups={[
                  {
                    title: 'Disponibilité',
                    fields: [
                      {
                        kind: 'toggle',
                        name: 'enabled',
                        label: 'Activer la réservation en ligne',
                        description:
                          'Désactivé, le formulaire et le bouton « Réserver » disparaissent du site.',
                      },
                    ],
                  },
                  {
                    title: 'Textes',
                    fields: [
                      { kind: 'text', name: 'eyebrow', label: 'Surtitre' },
                      { kind: 'text', name: 'title', label: 'Titre' },
                      {
                        kind: 'textarea',
                        name: 'description',
                        label: 'Description',
                        rows: 3,
                      },
                      {
                        kind: 'textarea',
                        name: 'notice',
                        label: 'Note complémentaire',
                        rows: 2,
                      },
                      {
                        kind: 'textarea',
                        name: 'successMessage',
                        label: 'Message de confirmation',
                        rows: 2,
                      },
                    ],
                  },
                  {
                    title: 'Contacts de réservation',
                    description:
                      'Le numéro WhatsApp reçoit la demande pré-rédigée après envoi du formulaire.',
                    fields: [
                      { kind: 'tel', name: 'whatsapp', label: 'WhatsApp', placeholder: '0X XX XX XX XX' },
                      { kind: 'tel', name: 'phone', label: 'Téléphone' },
                    ],
                  },
                  {
                    title: 'Contraintes',
                    fields: [
                      { kind: 'number', name: 'minGuests', label: 'Minimum de personnes', min: 1, max: 50 },
                      { kind: 'number', name: 'maxGuests', label: 'Maximum de personnes', min: 1, max: 200 },
                      { kind: 'time', name: 'openingTime', label: 'Première heure réservable' },
                      { kind: 'time', name: 'closingTime', label: 'Dernière heure réservable' },
                      {
                        kind: 'number',
                        name: 'maxAdvanceDays',
                        label: 'Réservation à l’avance (jours)',
                        min: 1,
                        max: 365,
                      },
                    ],
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </>
  );
}
