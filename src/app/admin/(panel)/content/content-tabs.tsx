'use client';

import { useState } from 'react';

import { SingletonForm } from '@/components/admin/singleton-form';
import { cn } from '@/lib/utils';
import type {
  AboutContent,
  ContentSection,
  FooterContent,
  HeroContent,
} from '@/types/content';
import { SectionsManager } from './sections-manager';

/** Onglets d'édition des textes du site. */
export function ContentTabs({
  hero,
  about,
  footer,
  sections,
}: {
  hero: HeroContent;
  about: AboutContent;
  footer: FooterContent;
  sections: ContentSection[];
}) {
  const tabs = ['Hero', 'À propos', 'Sections', 'Footer'] as const;
  const [active, setActive] = useState<(typeof tabs)[number]>('Hero');

  return (
    <>
      <div
        role="tablist"
        aria-label="Blocs de contenu"
        className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto rounded-xl border border-line bg-ink/40 p-1.5"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            onClick={() => setActive(tab)}
            className={cn(
              'h-9 shrink-0 rounded-lg px-4 text-sm font-medium transition-colors duration-200',
              active === tab
                ? 'bg-lime text-on-lime'
                : 'text-fg-muted hover:bg-white/5 hover:text-cream',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === 'Hero' && (
        <SingletonForm
          sectionKey="hero"
          initial={hero}
          groups={[
            {
              title: 'Textes',
              description:
                'Ce que le visiteur lit en premier, avant même la fin du chargement.',
              fields: [
                { kind: 'text', name: 'eyebrow', label: 'Surtitre', placeholder: 'Oran · Coffee shop & brunch' },
                { kind: 'text', name: 'title', label: 'Titre', placeholder: 'Between Us' },
                { kind: 'text', name: 'subtitle', label: 'Sous-titre', placeholder: 'Coffee & Brunch' },
                {
                  kind: 'textarea',
                  name: 'description',
                  label: 'Phrase d’accroche',
                  rows: 2,
                  placeholder: 'Where coffee, brunch and good moments meet.',
                },
              ],
            },
            {
              title: 'Boutons',
              description: 'Trois appels à l’action, activables indépendamment.',
              fields: [
                { kind: 'cta', name: 'primaryCta', label: 'Bouton principal' },
                { kind: 'cta', name: 'secondaryCta', label: 'Bouton secondaire' },
                { kind: 'cta', name: 'tertiaryCta', label: 'Bouton tertiaire' },
              ],
            },
            {
              title: 'Fond et 3D',
              description:
                'La vidéo prime sur l’image si les deux sont renseignées. La scène 3D reste derrière le contenu et se désactive d’elle-même sur les appareils limités.',
              fields: [
                {
                  kind: 'media',
                  name: 'backgroundImageUrl',
                  label: 'Image de fond',
                  accept: 'image',
                  folder: 'content',
                },
                {
                  kind: 'media',
                  name: 'backgroundVideoUrl',
                  label: 'Vidéo de fond',
                  accept: 'video',
                  folder: 'videos',
                },
                {
                  kind: 'toggle',
                  name: 'enable3d',
                  label: 'Activer la scène 3D',
                  description:
                    'Désactivée automatiquement si l’appareil manque de puissance ou si le visiteur demande un mouvement réduit.',
                },
              ],
            },
          ]}
        />
      )}

      {active === 'À propos' && (
        <SingletonForm
          sectionKey="about"
          initial={about}
          groups={[
            {
              title: 'Récit',
              fields: [
                { kind: 'text', name: 'eyebrow', label: 'Surtitre' },
                { kind: 'text', name: 'title', label: 'Titre' },
                {
                  kind: 'stringList',
                  name: 'paragraphs',
                  label: 'Paragraphes',
                  itemLabel: 'Paragraphe',
                  rows: 3,
                  max: 6,
                },
                { kind: 'text', name: 'signature', label: 'Signature' },
              ],
            },
            {
              title: 'Chiffres clés',
              description: 'Affichés sous le texte, sur une ligne de trois.',
              fields: [{ kind: 'stats', name: 'stats', label: 'Chiffres' }],
            },
            {
              title: 'Images',
              fields: [
                {
                  kind: 'media',
                  name: 'imageUrl',
                  label: 'Image principale',
                  accept: 'image',
                  folder: 'content',
                  aspect: 'aspect-[4/5]',
                },
                {
                  kind: 'media',
                  name: 'secondaryImageUrl',
                  label: 'Image secondaire (incrustée)',
                  accept: 'image',
                  folder: 'content',
                  aspect: 'aspect-square',
                },
              ],
            },
          ]}
        />
      )}

      {active === 'Sections' && <SectionsManager initial={sections} />}

      {active === 'Footer' && (
        <SingletonForm
          sectionKey="footer"
          initial={footer}
          groups={[
            {
              title: 'Pied de page',
              fields: [
                { kind: 'text', name: 'tagline', label: 'Accroche' },
                { kind: 'textarea', name: 'note', label: 'Mention', rows: 2 },
                {
                  kind: 'textarea',
                  name: 'legal',
                  label: 'Mentions légales',
                  rows: 2,
                  help: 'Laisser vide pour ne rien afficher.',
                },
                {
                  kind: 'toggle',
                  name: 'showSocials',
                  label: 'Afficher les réseaux sociaux',
                },
                {
                  kind: 'toggle',
                  name: 'showHours',
                  label: 'Afficher les horaires',
                },
              ],
            },
          ]}
        />
      )}
    </>
  );
}
