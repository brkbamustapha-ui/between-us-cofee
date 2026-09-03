'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from 'lucide-react';

import {
  AdminButton,
  Card,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  Notice,
  Toggle,
  useToast,
} from '@/components/admin/ui';
import { useCollection } from '@/hooks/use-collection';
import { deleteFile, uploadFile } from '@/lib/admin/client';
import { isManagedMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';
import type { GalleryPhoto } from '@/types/content';

/**
 * Galerie photo.
 *
 * Le téléversement accepte plusieurs fichiers d'un coup — c'est le geste
 * naturel depuis un téléphone. Les envois s'enchaînent en série plutôt qu'en
 * parallèle : dix photos de 5 Mo lancées simultanément saturent une connexion
 * mobile et font échouer les dernières.
 */
export function GalleryManager({ initial }: { initial: GalleryPhoto[] }) {
  const { rows, create, update, remove, move, pendingId } = useCollection(
    'gallery',
    initial,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const toast = useToast();

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const list = Array.from(files);
    setProgress({ done: 0, total: list.length });

    let failures = 0;

    for (const [index, file] of list.entries()) {
      try {
        const uploaded = await uploadFile(file, 'gallery');
        await create({
          url: uploaded.url,
          alt: '',
          caption: '',
          position: rows.length + index + 1,
          enabled: true,
        });
      } catch (error) {
        failures += 1;
        toast.error(
          `${file.name} : ${error instanceof Error ? error.message : 'envoi impossible'}`,
        );
      }
      setProgress({ done: index + 1, total: list.length });
    }

    setProgress(null);
    if (inputRef.current) inputRef.current.value = '';

    const succeeded = list.length - failures;
    if (succeeded > 0) {
      toast.success(`${succeeded} photo${succeeded > 1 ? 's' : ''} ajoutée(s).`);
    }
  }

  async function onRemove(photo: GalleryPhoto) {
    const removed = await remove(photo.id);
    // Le fichier n'est effacé du stockage qu'une fois l'enregistrement supprimé,
    // et seulement s'il s'agit d'un média que nous hébergeons.
    if (removed && isManagedMediaUrl(photo.url)) {
      await deleteFile(photo.url).catch(() => undefined);
    }
  }

  return (
    <div className="space-y-5">
      <Notice tone="info">
        La section galerie n’apparaît sur le site public que si au moins une
        photo est active. Les images sont converties en WebP et redimensionnées
        à 2000 px de large au téléversement.
      </Notice>

      <Card
        title="Photos"
        description={`${rows.length} photo${rows.length > 1 ? 's' : ''} — glissez-en plusieurs d’un coup.`}
        action={
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="sr-only"
              onChange={(event) => onFiles(event.target.files)}
            />
            <AdminButton
              variant="primary"
              loading={progress !== null}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              {progress
                ? `${progress.done}/${progress.total}`
                : 'Ajouter des photos'}
            </AdminButton>
          </>
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            title="Galerie vide"
            description="Ajoutez des photos du lieu, des assiettes et de l’ambiance."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rows.map((photo, index) => {
              const busy = pendingId === photo.id;

              return (
                <li
                  key={photo.id}
                  className={cn(
                    'overflow-hidden rounded-xl border border-line bg-ink/40 transition-opacity',
                    busy && 'opacity-60',
                  )}
                >
                  <div className="relative aspect-[4/3] bg-ink-deep">
                    {/* eslint-disable-next-line @next/next/no-img-element --
                        aperçu d'administration : l'URL peut pointer sur un hôte
                        non déclaré dans next.config.ts. */}
                    <img
                      src={photo.url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-2 bg-gradient-to-t from-ink-deep to-transparent p-2">
                      <span className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => move(photo.id, -1)}
                          disabled={index === 0 || busy}
                          aria-label="Déplacer avant"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink/80 text-cream backdrop-blur transition-colors hover:bg-ink disabled:opacity-30"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(photo.id, 1)}
                          disabled={index === rows.length - 1 || busy}
                          aria-label="Déplacer après"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink/80 text-cream backdrop-blur transition-colors hover:bg-ink disabled:opacity-30"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </span>

                      <span className="rounded-lg bg-ink/80 px-2 py-1 text-[0.625rem] tabular-nums text-fg-muted backdrop-blur">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 p-3">
                    <Field
                      label="Texte alternatif"
                      htmlFor={`alt-${photo.id}`}
                      help="Décrit l’image pour les lecteurs d’écran et Google."
                    >
                      <Input
                        id={`alt-${photo.id}`}
                        defaultValue={photo.alt}
                        placeholder="Comptoir en fin de journée"
                        onBlur={(event) =>
                          event.target.value !== photo.alt &&
                          update(photo.id, { alt: event.target.value }, true)
                        }
                      />
                    </Field>

                    <Field label="Légende" htmlFor={`caption-${photo.id}`}>
                      <Input
                        id={`caption-${photo.id}`}
                        defaultValue={photo.caption}
                        onBlur={(event) =>
                          event.target.value !== photo.caption &&
                          update(photo.id, { caption: event.target.value }, true)
                        }
                      />
                    </Field>

                    <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                      <Toggle
                        checked={photo.enabled}
                        disabled={busy}
                        label="Publiée"
                        onChange={(enabled) =>
                          update(photo.id, { enabled }, true)
                        }
                      />
                      <ConfirmButton
                        onConfirm={() => onRemove(photo)}
                        confirmLabel="Confirmer ?"
                        className="h-9 px-3 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </ConfirmButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
