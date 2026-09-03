'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardType, FileJson, Upload } from 'lucide-react';

import {
  AdminButton,
  Card,
  Notice,
  Textarea,
  Toggle,
  useToast,
} from '@/components/admin/ui';
import { importMenu } from '@/lib/admin/client';
import { parseMenuText } from '@/lib/menu/parse-menu-text';
import { MENU_BADGE_LABELS } from '@/types/content';
import { cn, formatPrice } from '@/lib/utils';

type Mode = 'text' | 'json';

const TEXT_EXAMPLE = `COFFEE
Espresso ............ 150 DA
Cappuccino — lait texturé   300
Latte 350

BRUNCH
Brunch complet [best]  1800 DA
> Œufs, pain maison, jus pressé
Pancakes 900`;

const JSON_EXAMPLE = `{
  "categories": [
    {
      "name": "Coffee",
      "description": "Espresso, filtre et signatures lactées.",
      "items": [
        { "name": "Espresso", "description": "Simple, serré.", "price": 150 },
        { "name": "Cappuccino", "price": 300, "badges": ["best_seller"] }
      ]
    }
  ]
}`;

/**
 * Import de la carte, en deux formats.
 *
 * Le mode « Texte » est celui qui sert réellement : on colle la carte telle
 * qu'on la copie depuis une page en ligne, un PDF ou un message, et un aperçu
 * montre exactement ce qui sera créé avant d'écrire en base. Le mode JSON reste
 * disponible pour un import piloté depuis un autre outil.
 */
export function MenuImport() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('text');
  const [text, setText] = useState('');
  const [json, setJson] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  // L'aperçu se recalcule à chaque frappe : l'analyse est purement locale.
  const preview = useMemo(
    () => (text.trim() ? parseMenuText(text) : null),
    [text],
  );

  const canImport =
    mode === 'text' ? (preview?.itemCount ?? 0) > 0 : json.trim().length > 0;

  async function onImport() {
    let payload: object;

    if (mode === 'text') {
      if (!preview || preview.itemCount === 0) return;
      payload = { categories: preview.categories };
    } else {
      try {
        payload = JSON.parse(json) as object;
      } catch {
        toast.error('JSON invalide : vérifiez les virgules et les guillemets.');
        return;
      }
    }

    setBusy(true);
    try {
      const result = await importMenu({ ...payload, replaceExisting });
      toast.success(
        `${result.categories} catégorie(s) et ${result.items} produit(s) importés.`,
      );
      setText('');
      setJson('');
      setOpen(false);
      router.refresh();
      // Recharge pour repartir des données réellement enregistrées.
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
      description="Collez la carte pour tout créer d’un coup, plutôt que produit par produit."
      action={
        <AdminButton onClick={() => setOpen((current) => !current)}>
          <ClipboardType className="h-4 w-4" />
          {open ? 'Masquer' : 'Ouvrir'}
        </AdminButton>
      }
    >
      {open && (
        <div className="space-y-4">
          {/* Sélecteur de format */}
          <div
            role="tablist"
            aria-label="Format d’import"
            className="flex gap-1 rounded-xl border border-line bg-ink/50 p-1"
          >
            {(
              [
                { id: 'text', label: 'Texte', icon: ClipboardType },
                { id: 'json', label: 'JSON (avancé)', icon: FileJson },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => setMode(tab.id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  mode === tab.id
                    ? 'bg-lime text-on-lime'
                    : 'text-fg-muted hover:text-fg',
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {mode === 'text' ? (
            <>
              <Textarea
                rows={12}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={TEXT_EXAMPLE}
                aria-label="Carte au format texte"
                className="text-sm"
              />

              <div className="rounded-xl border border-line bg-ink/50 px-4 py-3 text-xs leading-relaxed text-fg-muted">
                <p className="mb-2 font-medium text-fg">Comment c’est lu</p>
                <ul className="space-y-1">
                  <li>
                    Une ligne qui <strong>finit par un prix</strong> → un produit.
                  </li>
                  <li>
                    Une ligne <strong>sans prix</strong> → une catégorie.
                  </li>
                  <li>
                    Une ligne commençant par <code>&gt;</code> → la description du
                    produit précédent.
                  </li>
                  <li>
                    <code>Nom — description 350</code> sépare aussi la description.
                  </li>
                  <li>
                    <code>[best]</code>, <code>[nouveau]</code>,{' '}
                    <code>[populaire]</code>, <code>[reco]</code> ajoutent un badge.
                  </li>
                </ul>
              </div>

              {preview && <ImportPreview preview={preview} />}
            </>
          ) : (
            <>
              <Textarea
                rows={12}
                value={json}
                onChange={(event) => setJson(event.target.value)}
                placeholder={JSON_EXAMPLE}
                aria-label="Carte au format JSON"
                className="font-mono text-xs"
              />
              <p className="text-xs leading-relaxed text-fg-subtle">
                Champs acceptés par produit : <code>name</code> (obligatoire),{' '}
                <code>description</code>, <code>price</code> (nombre, en DA, ou{' '}
                <code>null</code>), <code>imageUrl</code>, <code>badges</code>{' '}
                (<code>best_seller</code>, <code>popular</code>, <code>new</code>,{' '}
                <code>recommended</code>).
              </p>
            </>
          )}

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
              disabled={!canImport}
              onClick={onImport}
            >
              <Upload className="h-4 w-4" />
              {mode === 'text' && preview
                ? `Importer ${preview.itemCount} produit(s)`
                : 'Importer'}
            </AdminButton>
            <AdminButton
              onClick={() =>
                mode === 'text' ? setText(TEXT_EXAMPLE) : setJson(JSON_EXAMPLE)
              }
            >
              Insérer un exemple
            </AdminButton>
          </div>
        </div>
      )}
    </Card>
  );
}

/** Aperçu de ce qui sera créé : rien n'est écrit tant qu'il n'est pas validé. */
function ImportPreview({
  preview,
}: {
  preview: ReturnType<typeof parseMenuText>;
}) {
  if (preview.itemCount === 0) {
    return (
      <Notice tone="warn">
        Aucun produit détecté. Vérifiez que chaque ligne de produit se termine
        bien par un prix.
      </Notice>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-fg">
        Aperçu — {preview.categories.length} catégorie(s),{' '}
        {preview.itemCount} produit(s)
      </p>

      <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-line bg-ink/50 p-3">
        {preview.categories.map((category, categoryIndex) => (
          <div key={`${category.name}-${categoryIndex}`}>
            <p className="mb-1 text-xs font-semibold tracking-wide text-lime uppercase">
              {category.name}
            </p>
            <ul className="space-y-1">
              {category.items.map((item, itemIndex) => (
                <li key={`${item.name}-${itemIndex}`} className="text-sm">
                  {/* Nom, badges et prix sur une seule ligne ; la description
                      passe dessous pour que le prix reste aligné à droite. */}
                  <div className="flex items-baseline gap-x-2">
                    <span className="text-fg">{item.name}</span>
                    {item.badges?.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-lime/15 px-2 py-0.5 text-[10px] font-medium text-lime"
                      >
                        {MENU_BADGE_LABELS[badge]}
                      </span>
                    ))}
                    <span className="ms-auto shrink-0 font-medium text-fg-muted tabular-nums">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-fg-subtle">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {preview.ignored.length > 0 && (
        <Notice tone="warn">
          <span className="block">
            {preview.ignored.length} ligne(s) non reprise(s), faute de prix
            exploitable :
          </span>
          <span className="mt-1 block text-xs opacity-80">
            {preview.ignored.slice(0, 6).join(' · ')}
            {preview.ignored.length > 6 && ' …'}
          </span>
        </Notice>
      )}
    </div>
  );
}
