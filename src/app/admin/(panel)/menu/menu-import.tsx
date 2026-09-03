'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileJson, Upload } from 'lucide-react';

import {
  AdminButton,
  Card,
  Textarea,
  Toggle,
  useToast,
} from '@/components/admin/ui';
import { importMenu } from '@/lib/admin/client';

const EXAMPLE = `{
  "replaceExisting": true,
  "categories": [
    {
      "name": "Coffee",
      "description": "Espresso, filtre et signatures lactées.",
      "items": [
        { "name": "Espresso", "description": "Simple, serré.", "price": 150 },
        { "name": "Cappuccino", "price": 300, "badges": ["best_seller"] }
      ]
    },
    {
      "name": "Brunch",
      "items": [
        { "name": "Brunch complet", "description": "Sucré et salé.", "price": 1800 }
      ]
    }
  ]
}`;

/**
 * Import de la carte au format JSON.
 *
 * C'est le chemin le plus rapide pour saisir une carte entière : coller le
 * JSON crée toutes les catégories et tous les produits en une fois, marqués
 * comme données vérifiées (et non comme emplacements vides).
 */
export function MenuImport() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function onImport() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      toast.error('JSON invalide : vérifiez les virgules et les guillemets.');
      return;
    }

    setBusy(true);
    try {
      const payload = { ...(parsed as object), replaceExisting };
      const result = await importMenu(payload);
      toast.success(
        `${result.categories} catégorie(s) et ${result.items} produit(s) importés.`,
      );
      setValue('');
      setOpen(false);
      // Recharge la page pour repartir des données réellement en base.
      router.refresh();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Importer la carte officielle"
      description="Collez la carte au format JSON pour tout créer d’un coup, plutôt que produit par produit."
      action={
        <AdminButton onClick={() => setOpen((current) => !current)}>
          <FileJson className="h-4 w-4" />
          {open ? 'Masquer' : 'Ouvrir'}
        </AdminButton>
      }
    >
      {open && (
        <div className="space-y-4">
          <Textarea
            rows={12}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={EXAMPLE}
            aria-label="Carte au format JSON"
            className="font-mono text-xs"
          />

          <div className="rounded-xl border border-line bg-ink/50 px-4 py-3">
            <Toggle
              checked={replaceExisting}
              onChange={setReplaceExisting}
              label="Remplacer la carte existante"
              description="Supprime toutes les catégories et tous les produits actuels avant l’import. Décochez pour ajouter à la suite."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <AdminButton
              variant="primary"
              loading={busy}
              disabled={!value.trim()}
              onClick={onImport}
            >
              <Upload className="h-4 w-4" />
              Importer
            </AdminButton>
            <AdminButton onClick={() => setValue(EXAMPLE)}>
              Insérer un exemple
            </AdminButton>
          </div>

          <p className="text-xs leading-relaxed text-fg-subtle">
            Champs acceptés par produit : <code>name</code> (obligatoire),{' '}
            <code>description</code>, <code>price</code> (nombre, en DA, ou{' '}
            <code>null</code>), <code>imageUrl</code>, <code>badges</code>{' '}
            (<code>best_seller</code>, <code>popular</code>, <code>new</code>,{' '}
            <code>recommended</code>).
          </p>
        </div>
      )}
    </Card>
  );
}
