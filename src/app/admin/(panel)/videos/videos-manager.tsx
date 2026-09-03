'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

import { MediaPicker } from '@/components/admin/media-picker';
import {
  AdminButton,
  Card,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  Notice,
  Textarea,
  Toggle,
} from '@/components/admin/ui';
import { useCollection } from '@/hooks/use-collection';
import { deleteFile } from '@/lib/admin/client';
import { isManagedMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';
import type { VideoItem } from '@/types/content';

/**
 * Vidéos de la section « Between Us Experience ».
 *
 * La miniature (poster) est fortement recommandée : c'est elle qui s'affiche
 * tant que le visiteur n'a pas lancé la lecture, et elle évite de télécharger
 * la vidéo pour rien.
 */
export function VideosManager({ initial }: { initial: VideoItem[] }) {
  const { rows, create, update, remove, move, pendingId, creating } =
    useCollection('videos', initial);
  const [openId, setOpenId] = useState<string | null>(null);

  async function onAdd() {
    const created = await create({
      url: '',
      posterUrl: '',
      title: 'Nouvelle vidéo',
      description: '',
      position: rows.length + 1,
      enabled: false,
    });
    if (created) setOpenId(created.id);
  }

  async function onRemove(video: VideoItem) {
    const removed = await remove(video.id);
    if (!removed) return;

    for (const url of [video.url, video.posterUrl]) {
      if (isManagedMediaUrl(url)) {
        await deleteFile(url).catch(() => undefined);
      }
    }
  }

  return (
    <div className="space-y-5">
      <Notice tone="info">
        Aucune vidéo n’est chargée à l’ouverture du site : seule la miniature
        s’affiche, et le fichier n’est téléchargé qu’au clic sur lecture.
        Une vidéo sans URL reste invisible sur le site public.
      </Notice>

      <Card
        title="Vidéos"
        action={
          <AdminButton variant="primary" loading={creating} onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Ajouter
          </AdminButton>
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            title="Aucune vidéo"
            description="Ajoutez une vidéo au format MP4 ou WebM (100 Mo maximum)."
          />
        ) : (
          <ul className="space-y-2.5">
            {rows.map((video, index) => {
              const open = openId === video.id;
              const busy = pendingId === video.id;

              return (
                <li
                  key={video.id}
                  className={cn(
                    'overflow-hidden rounded-xl border border-line bg-ink/40 transition-opacity',
                    busy && 'opacity-60',
                  )}
                >
                  <div className="flex items-center gap-2 p-3">
                    <div className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        onClick={() => move(video.id, -1)}
                        disabled={index === 0 || busy}
                        aria-label="Monter"
                        className="rounded p-0.5 text-fg-subtle transition-colors hover:text-lime disabled:opacity-25"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(video.id, 1)}
                        disabled={index === rows.length - 1 || busy}
                        aria-label="Descendre"
                        className="rounded p-0.5 text-fg-subtle transition-colors hover:text-lime disabled:opacity-25"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : video.id)}
                      aria-expanded={open}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-medium text-cream">
                        {video.title || 'Sans titre'}
                      </span>
                      <span className="block truncate text-xs text-fg-subtle">
                        {video.url ? 'Fichier lié' : 'Aucun fichier'}
                        {video.enabled ? '' : ' · masquée'}
                      </span>
                    </button>

                    <span className="shrink-0">
                      <Toggle
                        checked={video.enabled}
                        disabled={busy || !video.url}
                        label={`Publier ${video.title}`}
                        onChange={(enabled) =>
                          update(video.id, { enabled }, true)
                        }
                      />
                    </span>
                  </div>

                  {open && (
                    <div className="space-y-4 border-t border-line p-4">
                      <Field label="Titre" htmlFor={`video-title-${video.id}`}>
                        <Input
                          id={`video-title-${video.id}`}
                          defaultValue={video.title}
                          onBlur={(event) =>
                            event.target.value !== video.title &&
                            update(video.id, { title: event.target.value })
                          }
                        />
                      </Field>

                      <Field
                        label="Description"
                        htmlFor={`video-desc-${video.id}`}
                      >
                        <Textarea
                          id={`video-desc-${video.id}`}
                          rows={2}
                          defaultValue={video.description}
                          onBlur={(event) =>
                            event.target.value !== video.description &&
                            update(video.id, { description: event.target.value })
                          }
                        />
                      </Field>

                      <MediaPicker
                        label="Fichier vidéo"
                        accept="video"
                        folder="videos"
                        value={video.url}
                        onChange={(url) => update(video.id, { url })}
                      />

                      <MediaPicker
                        label="Miniature (poster)"
                        accept="image"
                        folder="videos"
                        value={video.posterUrl}
                        onChange={(posterUrl) =>
                          update(video.id, { posterUrl })
                        }
                        hint="recommandée"
                      />

                      <div className="flex justify-end">
                        <ConfirmButton
                          onConfirm={() => onRemove(video)}
                          confirmLabel="Supprimer définitivement ?"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </ConfirmButton>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
