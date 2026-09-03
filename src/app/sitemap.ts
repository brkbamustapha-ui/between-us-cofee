import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const url = siteUrl();
  const lastModified = new Date();

  // Le site tient sur une page ; les ancres principales sont déclarées pour
  // aider Google à proposer des liens de site.
  return [
    { url, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${url}/#menu`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${url}/#reservation`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${url}/#localisation`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${url}/#galerie`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
  ];
}
