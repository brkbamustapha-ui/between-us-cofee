'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { cn } from '@/lib/utils';
import type { GalleryPhoto } from '@/types/content';

/**
 * Galerie photo.
 *
 * Desktop : mosaïque façon masonry (colonnes CSS), survol léger.
 * Mobile : grille deux colonnes, puis visionneuse plein écran avec navigation
 * au doigt (glissement horizontal) et aux flèches du clavier.
 *
 * La section disparaît complètement si aucune photo n'est publiée — jamais de
 * cadre vide ni d'image cassée sur le site.
 */
export function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const visible = photos
    .filter((photo) => photo.enabled && photo.url)
    .sort((a, b) => a.position - b.position);

  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(
    () => setIndex((i) => (i === null ? null : (i + 1) % visible.length)),
    [visible.length],
  );
  const previous = useCallback(
    () =>
      setIndex((i) =>
        i === null ? null : (i - 1 + visible.length) % visible.length,
      ),
    [visible.length],
  );

  useEffect(() => {
    if (index === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') previous();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [index, close, next, previous]);

  if (visible.length === 0) return null;

  return (
    <section id="galerie" className="section-y scroll-mt-20">
      <div className="container-x">
        <SectionHeading
          eyebrow="Galerie"
          title="L’ambiance en images"
          description="Le comptoir, les assiettes, la lumière de fin d’après-midi."
        />

        <div className="mt-12 columns-2 gap-3 sm:gap-4 lg:columns-3">
          {visible.map((photo, position) => (
            <Reveal
              key={photo.id}
              delay={Math.min(position * 0.04, 0.3)}
              className="mb-3 break-inside-avoid sm:mb-4"
            >
              <button
                type="button"
                onClick={() => setIndex(position)}
                className="group relative block w-full overflow-hidden rounded-2xl border border-line bg-elevated/40 sm:rounded-3xl"
                aria-label={`Agrandir : ${photo.alt || photo.caption || `photo ${position + 1}`}`}
              >
                <Image
                  src={photo.url}
                  alt={photo.alt || ''}
                  width={800}
                  height={1000}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 30vw"
                  loading="lazy"
                  className="h-auto w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />

                <span className="absolute inset-0 flex items-end bg-gradient-to-t from-ink-deep/85 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="flex w-full items-center justify-between gap-2 p-4">
                    <span className="line-clamp-1 text-left text-xs text-cream">
                      {photo.caption}
                    </span>
                    <ZoomIn
                      className="h-4 w-4 shrink-0 text-lime"
                      aria-hidden="true"
                    />
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <Lightbox
        photos={visible}
        index={index}
        onClose={close}
        onNext={next}
        onPrevious={previous}
      />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Visionneuse                                                                */
/* -------------------------------------------------------------------------- */

function Lightbox({
  photos,
  index,
  onClose,
  onNext,
  onPrevious,
}: {
  photos: GalleryPhoto[];
  index: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const reduced = useReducedMotion();
  const touchStartX = useRef<number | null>(null);
  const photo = index === null ? null : photos[index];

  // Glissement horizontal : seuil à 50 px pour ne pas déclencher sur un simple tap.
  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start === null || end === undefined) return;

    const delta = end - start;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) onNext();
    else onPrevious();
  };

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col bg-ink-deep/97"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-label="Visionneuse de photos"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="safe-bottom flex items-center justify-between px-4 py-4">
            <span className="text-xs tabular-nums text-fg-muted">
              {(index ?? 0) + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-cream transition-colors hover:bg-white/5"
              aria-label="Fermer la visionneuse"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-3 pb-4">
            <motion.div
              key={photo.id}
              initial={reduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full w-full max-w-4xl"
            >
              <Image
                src={photo.url}
                alt={photo.alt || photo.caption || ''}
                fill
                sizes="100vw"
                priority
                className="object-contain"
              />
            </motion.div>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={onPrevious}
                  className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-ink/70 text-cream backdrop-blur-md transition-colors hover:bg-ink sm:left-6"
                  aria-label="Photo précédente"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-ink/70 text-cream backdrop-blur-md transition-colors hover:bg-ink sm:right-6"
                  aria-label="Photo suivante"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {photo.caption && (
            <p
              className={cn(
                'safe-bottom px-6 pb-6 text-center text-sm text-fg-muted',
              )}
            >
              {photo.caption}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
