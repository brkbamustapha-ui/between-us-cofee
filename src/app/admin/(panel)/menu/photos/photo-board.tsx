'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, ImageIcon, Link2, Search, Trash2, Upload } from 'lucide-react';

import {
  AdminButton,
  Card,
  Notice,
  useToast,
} from '@/components/admin/ui';
import { useCollection } from '@/hooks/use-collection';
import { importFileFromUrl, uploadFile } from '@/lib/admin/client';
import { cn, formatPrice } from '@/lib/utils';
import type { MenuCategory, MenuItem } from '@/types/content';

/**
 * Tableau des photos de la carte.
 *
 * Une ligne par produit, et une seule action par ligne : chercher la photo,
 * coller son adresse. Le lien de recherche est pré-rempli avec le nom du
 * produit — c'est la partie fastidieuse quand il y a quatre-vingts produits à
 * traiter.
 *
 * L'adresse collée est envoyée au serveur, qui télécharge l'image et l'héberge
 * ici : le navigateur ne peut pas lire une image d'un autre domaine, et une
 * photo restée chez son hébergeur d'origine disparaîtrait le jour où il la
 * retire.
 */
export function PhotoBoard({
  categories,
  items,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
}) {
  const { rows, update, pendingId } = useCollection('items', items);
  const [onlyMissing, setOnlyMissing] = useState(true);

  const withPhoto = rows.filter((item) => item.imageUrl).length;
  const total = rows.length;

  const groups = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          products: rows
            .filter((item) => item.categoryId === category.id)
            .filter((item) => (onlyMissing ? !item.imageUrl : true))
            .sort((a, b) => a.position - b.position),
        }))
        .filter((group) => group.products.length > 0),
    [categories, rows, onlyMissing],
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-cream">
              {withPhoto} / {total} produits illustrés
            </p>
            <p className="mt-1 text-sm text-fg-muted">
              Une catégorie bascule en grandes cartes illustrées dès que 60 % de
              ses produits ont une photo.
            </p>
          </div>

          <AdminButton
            type="button"
            variant={onlyMissing ? 'primary' : 'secondary'}
            onClick={() => setOnlyMissing((current) => !current)}
          >
            {onlyMissing ? 'Voir tous les produits' : 'Voir seulement ce qui manque'}
          </AdminButton>
        </div>

        <div
          className="mt-5 h-1.5 overflow-hidden rounded-full bg-ink"
          role="progressbar"
          aria-valuenow={withPhoto}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Produits illustrés"
        >
          <div
            className="h-full rounded-full bg-lime transition-[width] duration-500"
            style={{ width: `${total ? (withPhoto / total) * 100 : 0}%` }}
          />
        </div>
      </Card>

      <Notice>
        Vérifiez que la photo correspond vraiment au produit servi : une image
        d’illustration qui ne ressemble pas à l’assiette réelle se retourne
        contre vous en salle. Vos propres photos valent toujours mieux — le
        bouton <strong className="font-semibold">Téléverser</strong> les accepte
        directement.
      </Notice>

      {groups.length === 0 ? (
        <Card>
          <div className="flex items-center gap-3 text-sm text-fg-muted">
            <Check className="h-5 w-5 text-lime" aria-hidden="true" />
            Tous les produits ont une photo.
          </div>
        </Card>
      ) : (
        groups.map(({ category, products }) => (
          <section key={category.id}>
            <h2 className="mb-3 font-display text-base font-semibold text-cream">
              {category.name}
              <span className="ml-2 text-xs font-normal text-fg-subtle">
                {products.length} produit{products.length > 1 ? 's' : ''}
              </span>
            </h2>

            <div className="space-y-3">
              {products.map((item) => (
                <PhotoRow
                  key={item.id}
                  item={item}
                  categoryName={category.name}
                  busy={pendingId === item.id}
                  onSave={(imageUrl) => update(item.id, { imageUrl }, true)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Une ligne                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Requête de recherche pour un produit.
 *
 * Le nom seul ne suffit pas : « Bloom » ou « Sunflower » sont des noms maison
 * qui ramèneraient des fleurs. On ajoute la catégorie, et la description quand
 * elle existe, puisque c'est elle qui décrit réellement l'assiette.
 */
function searchQuery(item: MenuItem, categoryName: string): string {
  const words = [item.name, item.description || categoryName]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return words.slice(0, 120);
}

function PhotoRow({
  item,
  categoryName,
  busy,
  onSave,
}: {
  item: MenuItem;
  categoryName: string;
  busy: boolean;
  onSave: (imageUrl: string) => Promise<boolean>;
}) {
  const [url, setUrl] = useState('');
  const [working, setWorking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const query = encodeURIComponent(searchQuery(item, categoryName));
  const googleImages = `https://www.google.com/search?tbm=isch&q=${query}`;
  // `sur:fmc` restreint aux images réutilisables commercialement — le filtre
  // « droits d'usage » de Google Images.
  const reusable = `${googleImages}&tbs=sur:fmc`;

  async function runImport() {
    const trimmed = url.trim();
    if (!trimmed) return;

    setWorking(true);
    try {
      const result = await importFileFromUrl(trimmed, 'menu');
      if (await onSave(result.url)) {
        setUrl('');
        toast.success(`Photo ajoutée à « ${item.name} ».`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import impossible.');
    } finally {
      setWorking(false);
    }
  }

  async function runUpload(file: File | undefined) {
    if (!file) return;

    setWorking(true);
    try {
      const result = await uploadFile(file, 'menu');
      if (await onSave(result.url)) {
        toast.success(`Photo ajoutée à « ${item.name} ».`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setWorking(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const pending = busy || working;

  return (
    <div className="rounded-2xl border border-line bg-elevated/40 p-3 sm:p-4">
      <div className="flex gap-3 sm:gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-ink sm:h-24 sm:w-24">
          {item.imageUrl ? (
            /* Aperçu d'administration : l'URL peut pointer sur un hôte non
               déclaré dans next.config.ts, ce qui ferait échouer next/image. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-fg-subtle">
              <ImageIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="font-display text-[0.9375rem] font-semibold text-cream">
              {item.name}
            </h3>
            <span className="text-xs tabular-nums text-lime">
              {formatPrice(item.price)}
            </span>
          </div>

          {item.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-fg-subtle">
              {item.description}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <a
              href={googleImages}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 font-medium text-lime underline-offset-4 hover:underline"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              Chercher sur Google Images
            </a>
            <a
              href={reusable}
              target="_blank"
              rel="noreferrer noopener"
              className="text-fg-subtle underline-offset-4 hover:text-fg-muted hover:underline"
            >
              réutilisables seulement
            </a>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void runImport();
                }
              }}
              placeholder="Collez l’adresse de l’image (clic droit → Copier l’adresse de l’image)"
              aria-label={`Adresse de l’image pour ${item.name}`}
              className={cn(
                'h-10 min-w-0 flex-1 rounded-xl border border-line bg-ink px-3 text-xs text-cream',
                'placeholder:text-fg-subtle transition-colors focus:border-lime focus:outline-none',
              )}
            />

            <div className="flex gap-2">
              <AdminButton
                type="button"
                variant="primary"
                loading={pending}
                disabled={!url.trim()}
                onClick={runImport}
                className="h-10 px-3"
              >
                <Link2 className="h-4 w-4" />
                Importer
              </AdminButton>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                aria-label={`Téléverser une photo pour ${item.name}`}
                onChange={(event) => runUpload(event.target.files?.[0])}
              />
              <AdminButton
                type="button"
                loading={pending}
                onClick={() => fileRef.current?.click()}
                className="h-10 px-3"
              >
                <Upload className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Téléverser</span>
              </AdminButton>

              {item.imageUrl && (
                <AdminButton
                  type="button"
                  variant="danger"
                  loading={pending}
                  onClick={() => onSave('')}
                  className="h-10 px-3"
                  aria-label={`Retirer la photo de ${item.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </AdminButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
