'use client';

import { useId, useRef, useState } from 'react';
import { ImageIcon, Trash2, Upload, Video } from 'lucide-react';

import { deleteFile, uploadFile, type UploadResult } from '@/lib/admin/client';
import { isManagedMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';
import { AdminButton, Label, useToast } from './ui';

/**
 * Sélecteur de média : téléversement, aperçu, remplacement, suppression.
 *
 * Le fichier part vers `/api/admin/upload`, qui le recompresse (images
 * converties en WebP, 2000 px max) et renvoie son URL publique. La suppression
 * retire aussi le fichier du stockage — pas d'orphelins qui s'accumulent.
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
    </div>
  );
}
