'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';

import { AdminButton, Field, Input } from '@/components/admin/ui';

/** Formulaire de connexion : appelle `/api/admin/login`, qui pose le cookie. */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: String(form.get('username') ?? ''),
          password: String(form.get('password') ?? ''),
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Connexion impossible.');
        setBusy(false);
        return;
      }

      // `next` est validé côté client : on n'accepte qu'un chemin interne, ce
      // qui empêche une redirection ouverte vers un domaine tiers.
      const next = params.get('next');
      const target =
        next && next.startsWith('/') && !next.startsWith('//')
          ? next
          : '/admin/dashboard';

      router.push(target);
      router.refresh();
    } catch {
      setError('Connexion au serveur impossible.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <Field label="Nom d’utilisateur" htmlFor="username">
        <Input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="between us cofee"
        />
      </Field>

      <Field label="Mot de passe" htmlFor="password">
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={visible ? 'text' : 'password'}
            required
            autoComplete="current-password"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={
              visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
            }
            className="absolute right-1 top-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:text-cream"
          >
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </Field>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <AdminButton
        type="submit"
        variant="primary"
        loading={busy}
        className="h-11 w-full"
      >
        <LogIn className="h-4 w-4" />
        Se connecter
      </AdminButton>
    </form>
  );
}
