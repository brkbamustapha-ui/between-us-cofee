import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administration',
  // Le dashboard ne doit jamais apparaître dans un moteur de recherche.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
