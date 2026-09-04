'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  FolderOpen,
  ImageIcon,
  Link2,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';

import {
  deleteFile,
  importFileFromUrl,
  listMediaLibrary,
  uploadFile,
  type LibraryEntry,
  type UploadResult,
} from '@/lib/admin/client';
import { isManagedMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';
import { AdminButton, Label, useToast } from './ui';

/**
 * Sélecteur de média : téléversement, aperçu, remplacement, suppression.
 *
 * Le fichier part vers `/api/admin/upload`, qui le recompresse (images
 * converties en WebP, 2000 px max) et renvoie son URL publique. La suppression
 * retire aussi le fichier du stockage — pas d'orphelins qui s'accumulent.
 *
 * Le bouton « Bibliothèque » propose en plus les médias déjà dans le projet :
 * un fichier déposé dans `public/` (poussé sur GitHub, par exemple) devient
 * sélectionnable d'un clic, sans avoir à recopier son chemin à la main.
 */

const ACCEPT = {
  image: 'image/jpeg,image/png,image/webp,image/avif',
  video: 'video/mp4,video/webm',
} as const;

export function MediaPicker({
  label,
  value,
  onChange,
  accept = 'image',
  folder = 'content',
  hint,
  className,
  aspect = 'aspect-video',
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: 'image' | 'video';
  folder?: 'gallery' | 'videos' | 'menu' | 'content' | 'brand';
  hint?: string;
  className?: string;
  aspect?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const toast = useToast();

  async function onPick(file: File | undefined) {
    if (!file) return;

    setBusy(true);
    try {
      const result: UploadResult = await uploadFile(file, folder);
      onChange(result.url);
      toast.success(
        `Fichier envoyé (${Math.max(1, Math.round(result.bytes / 1024))} Ko).`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Envoi impossible.',
      );
    } finally {
      setBusy(false);
      // Réinitialise l'input : re-sélectionner le même fichier redéclenche bien
      // un changement.
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  /**
   * Récupère une image hébergée ailleurs.
   *
   * Le téléchargement est fait par le serveur : le navigateur n'a pas le droit
   * de lire une image d'un autre domaine, et une fois chez nous la photo ne
   * dépend plus du site d'origine.
   */
  async function onImport(remoteUrl: string) {
    setBusy(true);
    try {
      const result = await importFileFromUrl(remoteUrl, folder);
      onChange(result.url);
      setImportOpen(false);
      toast.success(
        `Image importée depuis ${result.source} (${Math.max(1, Math.round(result.bytes / 1024))} Ko).`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Import impossible.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    const current = value;
    onChange('');

    // Ne supprime du stockage que les fichiers que nous avons téléversés.
    if (isManagedMediaUrl(current)) {
      try {
        await deleteFile(current);
      } catch {
        // La référence est déjà retirée du contenu : l'échec du nettoyage
        // physique ne doit pas bloquer l'édition.
      }
    }
  }

  return (
    <div className={className}>
      <Label htmlFor={inputId} hint={hint}>
        {label}
      </Label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={cn(
            'relative w-full shrink-0 overflow-hidden rounded-xl border border-line bg-ink sm:w-44',
            aspect,
          )}
        >
          {value ? (
            accept === 'video' ? (
              <video
                src={value}
                className="h-full w-full object-cover"
                preload="metadata"
                muted
                playsInline
              />
            ) : (
              /* Aperçu d'administration : l'URL vient d'être créée et peut
                 pointer sur un hôte non déclaré dans next.config.ts, ce qui
                 ferait échouer next/image. Un <img> natif est ici le bon outil. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-fg-subtle">
              {accept === 'video' ? (
                <Video className="h-6 w-6" aria-hidden="true" />
              ) : (
                <ImageIcon className="h-6 w-6" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPT[accept]}
            className="sr-only"
            onChange={(event) => onPick(event.target.files?.[0])}
          />

          <div className="flex flex-wrap gap-2">
            <AdminButton
              type="button"
              loading={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {value ? 'Remplacer' : 'Téléverser'}
            </AdminButton>

            <AdminButton type="button" onClick={() => setLibraryOpen(true)}>
              <FolderOpen className="h-4 w-4" />
              Bibliothèque
            </AdminButton>

            {accept === 'image' && (
              <AdminButton type="button" onClick={() => setImportOpen(true)}>
                <Link2 className="h-4 w-4" />
                Depuis un lien
              </AdminButton>
            )}

            {value && (
              <AdminButton type="button" variant="danger" onClick={onRemove}>
                <Trash2 className="h-4 w-4" />
                Retirer
              </AdminButton>
            )}
          </div>

          {/* L'URL reste modifiable à la main : utile pour pointer un fichier
              déjà hébergé ailleurs. */}
          <input
            type="url"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={
              accept === 'video'
                ? 'https://… ou /api/media/videos/…'
                : 'https://… ou /api/media/gallery/…'
            }
            aria-label={`${label} — URL`}
            className="h-10 w-full rounded-xl border border-line bg-ink px-3 text-xs text-fg-muted transition-colors focus:border-lime focus:outline-none"
          />

          <p className="text-xs leading-relaxed text-fg-subtle">
            {accept === 'video'
              ? 'MP4 ou WebM, 100 Mo maximum.'
              : 'JPG, PNG, WebP ou AVIF — 12 Mo maximum. Converti en WebP et redimensionné automatiquement.'}
          </p>
        </div>
      </div>

      {libraryOpen && (
        <MediaLibraryDialog
          kind={accept}
          onClose={() => setLibraryOpen(false)}
          onSelect={(url) => {
            onChange(url);
            setLibraryOpen(false);
          }}
        />
      )}

      {importOpen && (
        <ImportFromUrlDialog
          busy={busy}
          onClose={() => setImportOpen(false)}
          onSubmit={onImport}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bibliothèque                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Liste les médias déjà présents dans le projet et en sélectionne un.
 *
 * Rien n'est copié ni déplacé : on retient simplement l'URL du fichier, qui est
 * déjà servi par le site.
 */
function MediaLibraryDialog({
  kind,
  onSelect,
  onClose,
}: {
  kind: 'image' | 'video';
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<LibraryEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listMediaLibrary()
      .then((result) => {
        if (!cancelled) setFiles(result.files.filter((f) => f.kind === kind));
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : 'Lecture impossible.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bibliothèque de médias"
      className="fixed inset-0 z-100 flex items-end justify-center bg-ink-deep/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-elevated sm:rounded-[2rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-cream">
              Bibliothèque
            </h2>
            <p className="mt-0.5 text-xs text-fg-subtle">
              Fichiers déjà présents dans le projet et téléversements précédents.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:text-cream"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {error ? (
            <p className="py-10 text-center text-sm text-danger">{error}</p>
          ) : files === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="skeleton aspect-square rounded-xl" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <p className="py-10 text-center text-sm leading-relaxed text-fg-muted">
              Aucun fichier trouvé. Téléversez-en un, ou déposez vos fichiers
              dans le dossier <code>public/</code> du dépôt.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {files.map((file) => (
                <li key={file.url}>
                  <button
                    type="button"
                    onClick={() => onSelect(file.url)}
                    title={file.url}
                    className="group w-full overflow-hidden rounded-xl border border-line bg-ink text-left transition-colors hover:border-lime"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-ink-deep">
                      {file.kind === 'video' ? (
                        <video
                          src={file.url}
                          className="h-full w-full object-cover"
                          preload="metadata"
                          muted
                          playsInline
                        />
                      ) : (
                        /* Même raison que l'aperçu principal : URL arbitraire,
                           next/image ne convient pas ici. */
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={file.url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="truncate text-xs text-cream">{file.name}</p>
                      <p className="text-[0.6875rem] text-fg-subtle">
                        {Math.max(1, Math.round(file.bytes / 1024))} Ko
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Import depuis un lien                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Saisie d'une adresse d'image distante.
 *
 * Le piège habituel est de coller l'adresse de la *page* qui affiche la photo
 * plutôt que celle de la photo elle-même — d'où la marche à suivre rappelée
 * ici. Le serveur renvoie de toute façon un message explicite quand le lien ne
 * pointe pas sur une image.
 */
function ImportFromUrlDialog({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}) {
  const [url, setUrl] = useState('');
  const fieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fieldRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Importer une image depuis un lien"
    >
      <div className="w-full max-w-lg rounded-t-3xl border border-line bg-elevated p-5 sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-cream">
              Importer depuis un lien
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-fg-subtle">
              L’image est téléchargée puis hébergée ici : elle ne dépendra plus
              du site d’origine.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:text-cream"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = url.trim();
            if (trimmed) onSubmit(trimmed);
          }}
        >
          <input
            ref={fieldRef}
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://exemple.com/photo.jpg"
            aria-label="Adresse de l’image"
            className="h-11 w-full rounded-xl border border-line bg-ink px-3 text-sm text-cream transition-colors focus:border-lime focus:outline-none"
          />

          <ol className="mt-4 space-y-1.5 text-xs leading-relaxed text-fg-subtle">
            <li>1. Ouvrez la photo en grand sur le site où vous l’avez trouvée.</li>
            <li>
              2. Clic droit sur la photo →{' '}
              <strong className="text-fg-muted">Copier l’adresse de l’image</strong>.
            </li>
            <li>3. Collez-la ci-dessus. L’adresse doit finir par .jpg, .png ou .webp.</li>
          </ol>

          <div className="mt-5 flex justify-end gap-2">
            <AdminButton type="button" onClick={onClose}>
              Annuler
            </AdminButton>
            <AdminButton type="submit" variant="primary" loading={busy}>
              <Link2 className="h-4 w-4" />
              Importer
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
