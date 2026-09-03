import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/shell';
import { ToastProvider } from '@/components/admin/ui';
import { getCurrentAdmin } from '@/lib/auth/admin';
import { getStore } from '@/lib/db';

// La session est lue à chaque requête : aucune page admin ne doit être mise en
// cache ni prérendue.
export const dynamic = 'force-dynamic';

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Seconde barrière après le middleware : celle-ci vérifie que le compte
  // existe toujours et que le mot de passe n'a pas changé depuis l'émission
  // du jeton.
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const settings = await getStore().getSingleton('settings');

  return (
    <ToastProvider>
      <AdminShell settings={settings} username={admin.username}>
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
