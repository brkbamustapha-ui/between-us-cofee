'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { VideoItem } from '@/types/content';

/**
 * Section « Between Us Experience ».
 *
 * Point clé de performance : aucune vidéo n'est chargée à l'affichage de la
 * page. Chaque carte n'affiche qu'une miniature ; l'élément `<video>` n'est
 * monté qu'au clic, avec `preload="metadata"`. Trois vidéos de 20 Mo ne coûtent
 * donc rien tant que personne ne les lance.
 */
export function Videos({ videos }: { videos: VideoItem[] }) {
  const visible = videos
    .filter((video) => video.enabled && video.url)
    .sort((a, b) => a.position - b.position);

  if (visible.length === 0) return null;

  return (
    <section
      id="videos"
      className="section-y scroll-mt-20 border-y border-line bg-elevated/25"
    >
      <div className="container-x">
        <SectionHeading
          eyebrow="Between Us Experience"
          title="En mouvement"
          description="Quelques instants filmés au comptoir et en salle."
        />

        <ul className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((video, index) => (
            <Reveal as="li" key={video.id} delay={index * 0.07}>
              <VideoCard video={video} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function VideoCard({ video }: { video: VideoItem }) {
  const [playing, setPlaying] = useState(false);

  return (
    <article className="hairline overflow-hidden rounded-3xl border border-line bg-ink">
      <div className="relative aspect-video bg-ink-deep">
        {playing ? (
          <video
            src={video.url}
            poster={video.posterUrl || undefined}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          >
            <track kind="captions" />
            Votre navigateur ne peut pas lire cette vidéo.
          </video>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex items-center justify-center"
            aria-label={`Lire la vidéo : ${video.title || 'Between Us'}`}
          >
            {video.posterUrl ? (
              <Image
                src={video.posterUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                loading="lazy"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-elevated to-ink-deep" />
            )}

            <span className="absolute inset-0 bg-ink-deep/35 transition-colors duration-500 group-hover:bg-ink-deep/20" />

            <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-lime text-on-lime shadow-lime transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110">
              <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>

      {(video.title || video.description) && (
        <div className="p-5">
          {video.title && (
            <h3 className="font-display text-base font-semibold text-cream">
              {video.title}
            </h3>
          )}
          {video.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-fg-muted">
              {video.description}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
