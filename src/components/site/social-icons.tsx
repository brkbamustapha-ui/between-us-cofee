import { Facebook, Instagram, MessageCircle, Youtube } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import type { SocialPlatform } from '@/types/content';

/** TikTok et X n'existent pas dans lucide : dessinés ici, même grille 24×24. */
function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M16.5 3a5.6 5.6 0 0 0 4.2 4.02v2.8a8.4 8.4 0 0 1-4.2-1.34v5.9a5.98 5.98 0 1 1-5.98-5.98c.3 0 .6.02.88.07v2.9a3.16 3.16 0 1 0 2.2 3.01V3h2.9Z" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M17.53 3h3.06l-6.69 7.64L21.75 21h-6.14l-4.81-6.28L5.3 21H2.24l7.15-8.17L2.25 3H8.5l4.35 5.75L17.53 3Zm-1.07 16.13h1.69L7.62 4.78H5.8l10.66 14.35Z" />
    </svg>
  );
}

export const SOCIAL_ICONS: Record<
  SocialPlatform,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  instagram: Instagram,
  tiktok: TikTokIcon,
  facebook: Facebook,
  whatsapp: MessageCircle,
  youtube: Youtube,
  x: XIcon,
};
