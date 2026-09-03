import { Reveal } from '@/components/ui/reveal';
import { cn, whatsappHref } from '@/lib/utils';
import { SOCIAL_LABELS, type SocialLink } from '@/types/content';
import { SOCIAL_ICONS } from './social-icons';

/** Résout l'URL d'un lien social (WhatsApp accepte un simple numéro). */
export function socialHref(link: SocialLink): string {
  if (link.platform === 'whatsapp') {
    if (link.url.startsWith('http')) return link.url;
    return whatsappHref(link.url || link.handle);
  }
  return link.url;
}

export function usableSocials(socials: SocialLink[]): SocialLink[] {
  return socials
    .filter((link) => link.enabled && socialHref(link))
    .sort((a, b) => a.position - b.position);
}

/** Rangée d'icônes réutilisée dans la section Contact et dans le footer. */
export function SocialRow({
  socials,
  className,
  size = 'md',
}: {
  socials: SocialLink[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  const links = usableSocials(socials);
  if (links.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-2.5', className)}>
      {links.map((link) => {
        const Icon = SOCIAL_ICONS[link.platform];
        return (
          <li key={link.id}>
            <a
              href={socialHref(link)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SOCIAL_LABELS[link.platform]}${link.handle ? ` — ${link.handle}` : ''}`}
              className={cn(
                'inline-flex items-center justify-center rounded-full border border-line-strong text-cream transition-all duration-300 hover:border-lime hover:bg-lime/10 hover:text-lime',
                size === 'md' ? 'h-12 w-12' : 'h-10 w-10',
              )}
            >
              <Icon className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** Bloc « Suivez-nous » de la page d'accueil. */
export function Socials({ socials }: { socials: SocialLink[] }) {
  const links = usableSocials(socials);
  if (links.length === 0) return null;

  return (
    <section id="reseaux" className="scroll-mt-20 border-t border-line py-14">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="font-serif text-sm italic text-lime">Suivez-nous</p>
            <h2 className="max-w-md text-2xl leading-tight sm:text-3xl">
              Les nouveautés, les plats du moment et les coulisses
            </h2>
            <SocialRow socials={socials} className="justify-center" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
