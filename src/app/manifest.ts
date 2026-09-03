import type { MetadataRoute } from 'next';

import { getSiteContent } from '@/lib/db';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { settings } = await getSiteContent();

  return {
    name: settings.brandName,
    short_name: settings.shortName || 'Between Us',
    description: settings.metaDescription,
    start_url: '/',
    display: 'standalone',
    background_color: settings.colorInk || '#0A2B1E',
    theme_color: settings.colorInk || '#0A2B1E',
    lang: 'fr',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
