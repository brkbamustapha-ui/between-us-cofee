'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DatabaseZap } from 'lucide-react';

import {
  AdminButton,
  Card,
  Toggle,
  useToast,
} from '@/components/admin/ui';
import { seedContent } from '@/lib/admin/client';

/**
 * Initialisation du contenu.
 *
 * Utile juste après l'exécution de `supabase/schema.sql` : les tables sont
 * vides, ce bouton les remplit avec les sections, catégories et emplacements de
 * menu par défaut.
 */
export function SeedPanel() {
  const [resetSingletons, setResetSingletons] = useState(false);
  const [resetMedia, setResetMedia] = useState(false);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function onSeed() {
    setBusy(true);
    try {
      const result = await seedContent({ resetSingletons, resetMedia });
      toast.success(
        `${result.categories} catégories, ${result.items} produits et ${result.sections} sections créés.`,
      );
      setArmed(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Initialisation impossible.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Initialiser le contenu par défaut"
      description="Recrée les sections éditoriales, les catégories, les emplacements de menu et les réseaux sociaux."
    >
      <div className="space-y-3 rounded-xl border border-line bg-ink/50 px-4 py-3">
        <Toggle
          checked={resetSingletons}
          onChange={setResetSingletons}
          label="Réinitialiser aussi les textes"
          description="Hero, à propos, contact, réservation et footer reviennent à leurs valeurs d’origine."
        />
        <div className="border-t border-line pt-3">
          <Toggle
            checked={resetMedia}
            onChange={setResetMedia}
            label="Supprimer les photos et vidéos"
            description="Vide la galerie et la liste des vidéos. À n’utiliser que pour repartir de zéro."
          />
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-warn">
        Cette opération supprime les catégories, produits, sections et liens
        sociaux existants avant de les recréer. Elle est irréversible.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {armed ? (
          <>
            <AdminButton variant="danger" loading={busy} onClick={onSeed}>
              <DatabaseZap className="h-4 w-4" />
              Oui, réinitialiser
            </AdminButton>
            <AdminButton onClick={() => setArmed(false)} disabled={busy}>
              Annuler
            </AdminButton>
          </>
        ) : (
          <AdminButton onClick={() => setArmed(true)}>
            <DatabaseZap className="h-4 w-4" />
            Initialiser le contenu
          </AdminButton>
        )}
      </div>
    </Card>
  );
}
