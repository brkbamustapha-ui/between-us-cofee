import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, Outfit } from 'next/font/google';

import { getSiteContent } from '@/lib/db';
import { siteUrl } from '@/lib/seo';
import './globals.css';

/**
 * Polices auto-hébergées par `next/font` : aucun appel à Google au chargement,
 * pas de FOIT, et le `preload` est géré automatiquement.
 *
 *  - Outfit   → titres et marque (géométrique, épaisse, dans l'esprit du logo)
 *  - Inter    → texte courant et interface
 *  - Fraunces → surtitres en italique (la touche classique et artistique)
 */
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  // Uniquement l'italique : c'est le seul style utilisé, inutile de charger
  // un second fichier pour rien.
  style: ['italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteContent();
  const url = siteUrl();

  const title = settings.metaTitle || settings.brandName;
  const description = settings.metaDescription || settings.tagline;
  const image = settings.ogImageUrl || settings.logoUrl || '/brand/logo.svg';

  return {
    metadataBase: new URL(url),
    title: {
      default: title,
      template: `%s — ${settings.shortName || 'Between Us'}`,
    },
    description,
    applicationName: settings.brandName,
    keywords: [
      'coffee shop Oran',
      'brunch Oran',
      'café Oran',
      'Between Us Coffee',
      'brunch Algérie',
      'spécialité café',
    ],
    authors: [{ name: settings.brandName }],
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'fr_DZ',
      url,
      siteName: settings.brandName,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: settings.brandName }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: {
      index: !settings.maintenanceMode,
      follow: !settings.maintenanceMode,
      googleBot: {
        index: !settings.maintenanceMode,
        follow: !settings.maintenanceMode,
        'max-image-preview': 'large',
      },
    },
    formatDetection: { telephone: true, address: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#002C25',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // Le zoom reste possible : le bloquer casse l'accessibilité.
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${outfit.variable} ${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
