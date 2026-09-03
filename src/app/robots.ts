import type { MetadataRoute } from 'next';

import { getSiteContent } from '@/lib/db';
import { siteUrl } from '@/lib/seo';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { settings } = await getSiteContent();
  const url = siteUrl();

  // En mode maintenance, le site est retiré de l'index.
  if (settings.maintenanceMode) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // L'administration et les API n'ont rien à faire dans un index.
        disallow: ['/admin', '/admin/', '/api/'],
      },
    ],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  };
}
