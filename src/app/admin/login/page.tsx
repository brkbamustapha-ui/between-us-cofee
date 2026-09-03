import { Suspense } from 'react';

import { LogoLockup } from '@/components/brand/logo';
import { getStore, getStorageStatus } from '@/lib/db';
import { ensureAdminUser, isUsingInitialPassword } from '@/lib/auth/admin';
import { isAuthSecretConfigured } from '@/lib/auth/session';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

/**
 * Page de connexion au dashboard.
 *
 * Elle crée le compte administrateur s'il n'existe pas encore (premier
 * démarrage), et avertit clairement lorsque le mot de passe initial est
 * toujours en place ou qu'`AUTH_SECRET` manque.
 */
export default async function LoginPage() {
  const settings = await getStore().getSingleton('settings');
  const storage = getStorageStatus();

  let initialPassword = false;
  let bootstrapError: string | null = null;

  try {
    const admin = await ensureAdminUser();
    initialPassword = await isUsingInitialPassword(admin);
  } catch (error) {
    bootstrapError =
      error instanceof Error
        ? error.message
        : 'Le compte administrateur n’a pas pu être initialisé.';
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/3 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/[0.07] blur-[130px]"
      />

      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <LogoLockup settings={settings} priority />
        </div>

        <div className="hairline rounded-3xl border border-line bg-elevated/40 p-6 sm:p-8">
          <h1 className="font-display text-xl font-semibold text-cream">
            Administration
          </h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            Connectez-vous pour gérer le contenu du site.
          </p>

          <Suspense fallback={<div className="mt-6 h-64" />}>
            <LoginForm />
          </Suspense>
        </div>

        <div className="mt-5 space-y-3">
          {bootstrapError && (
            <p className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs leading-relaxed text-danger">
              {bootstrapError}
            </p>
          )}

          {!isAuthSecretConfigured() && (
            <p className="rounded-2xl border border-warn/25 bg-warn/[0.07] p-4 text-xs leading-relaxed text-warn">
              <strong className="font-semibold">AUTH_SECRET manquant.</strong>{' '}
              Générez une clé (<code>openssl rand -base64 48</code>) et
              ajoutez-la aux variables d’environnement. En production, la
              connexion est bloquée tant qu’elle est absente.
            </p>
          )}

          {initialPassword && (
            <p className="rounded-2xl border border-warn/25 bg-warn/[0.07] p-4 text-xs leading-relaxed text-warn">
              <strong className="font-semibold">Mot de passe initial actif.</strong>{' '}
              Changez-le dès la première connexion depuis Sécurité.
            </p>
          )}

          {!storage.supabaseConfigured && (
            <p className="rounded-2xl border border-line bg-elevated/40 p-4 text-xs leading-relaxed text-fg-muted">
              {storage.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
