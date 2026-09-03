import { ArrowDown } from 'lucide-react';

import { HeroCanvas } from '@/components/three/hero-canvas';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { HeroContent, SiteSettings } from '@/types/content';

/**
 * Section d'ouverture.
 *
 * Le texte est rendu côté serveur et lisible immédiatement ; la 3D arrive
 * après, derrière le contenu. Sur un téléphone où elle ne se charge pas, la
 * composition tient debout toute seule.
 */
export function Hero({
  hero,
  settings,
}: {
  hero: HeroContent;
  settings: SiteSettings;
}) {
  const ctas = [hero.primaryCta, hero.secondaryCta, hero.tertiaryCta].filter(
    (cta) => cta.enabled && cta.label && cta.href,
  );

  return (
    <section
      id="accueil"
      className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden pt-24 pb-20 sm:pt-28"
    >
      {/* Fond : photo ou vidéo optionnelle, puis la scène 3D, puis les voiles. */}
      {hero.backgroundVideoUrl ? (
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35"
          src={hero.backgroundVideoUrl}
          poster={hero.backgroundImageUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      ) : hero.backgroundImageUrl ? (
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url(${hero.backgroundImageUrl})` }}
          aria-hidden="true"
        />
      ) : null}

      <div className="absolute inset-0 -z-10">
        <HeroCanvas
          enabled={hero.enable3d}
          logoUrl={settings.logoMarkUrl || settings.logoUrl}
        />
      </div>

      {/* Voile de lisibilité : garantit le contraste du texte quelle que soit
          l'image de fond choisie dans le dashboard.

          Il est directionnel, et non uniforme : sur grand écran le texte occupe
          la moitié gauche et le médaillon 3D la droite. Un voile plein
          assombrirait la 3D de moitié — c'est exactement ce qui délavait le
          monogramme. Le dégradé est donc opaque sous le texte puis s'efface
          vers la droite. En portrait, où le texte traverse tout l'écran, on
          garde un voile vertical classique. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/45 to-ink lg:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden lg:block"
        style={{
          background:
            'linear-gradient(100deg, var(--color-ink) 0%, color-mix(in oklab, var(--color-ink) 80%, transparent) 34%, transparent 62%)',
        }}
      />
      {/* Fondu bas commun : raccorde le hero à la section suivante. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 hidden h-40 bg-gradient-to-t from-ink to-transparent lg:block"
      />

      <div className="container-x relative">
        <div className="max-w-3xl">
          {hero.eyebrow && (
            <p className="animate-fade-up mb-6 inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-ink/40 px-4 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-lime backdrop-blur-sm sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              {hero.eyebrow}
            </p>
          )}

          <h1
            className="animate-fade-up text-[clamp(3rem,13vw,7.5rem)] font-semibold leading-[0.86] tracking-[-0.045em]"
            style={{ animationDelay: '80ms' }}
          >
            <span className="text-gradient-lime block">{hero.title}</span>
            {hero.subtitle && (
              <span className="mt-2 block font-serif text-[clamp(1.35rem,5.2vw,2.9rem)] font-normal italic leading-[1.05] tracking-[-0.01em] text-cream/90">
                {hero.subtitle}
              </span>
            )}
          </h1>

          {hero.description && (
            <p
              className="animate-fade-up mt-7 max-w-xl text-pretty text-base leading-relaxed text-fg-muted sm:text-lg"
              style={{ animationDelay: '160ms' }}
            >
              {hero.description}
            </p>
          )}

          {ctas.length > 0 && (
            <div
              className="animate-fade-up mt-9 flex flex-wrap gap-3"
              style={{ animationDelay: '240ms' }}
            >
              {ctas.map((cta, index) => (
                <ButtonLink
                  key={cta.href + cta.label}
                  href={cta.href}
                  size="lg"
                  variant={
                    index === 0 ? 'primary' : index === 1 ? 'outline' : 'ghost'
                  }
                  className={cn(index === 0 && 'min-w-[11rem]')}
                >
                  {cta.label}
                </ButtonLink>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Indicateur de défilement — masqué aux lecteurs d'écran, purement visuel. */}
      <div
        className="container-x relative mt-14 hidden sm:block"
        aria-hidden="true"
      >
        <span className="inline-flex items-center gap-3 text-[0.6875rem] uppercase tracking-[0.25em] text-fg-subtle">
          <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
          Faites défiler
        </span>
      </div>
    </section>
  );
}
