'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, UserPen } from 'lucide-react';

import {
  AdminButton,
  Card,
  Field,
  Input,
  useToast,
} from '@/components/admin/ui';
import {
  changePasswordRequest,
  changeUsernameRequest,
} from '@/lib/admin/client';

/**
 * Changement d'identifiants.
 *
 * Les deux opérations exigent le mot de passe actuel. Le changement de mot de
 * passe invalide toutes les sessions ouvertes (l'empreinte du hash est incluse
 * dans le jeton) ; la session courante est réémise pour ne pas déconnecter la
 * personne qui vient de le faire.
 */
export function SecurityForms({ username }: { username: string }) {
  return (
    <div className="space-y-5">
      <UsernameForm current={username} />
      <PasswordForm />
    </div>
  );
}

function UsernameForm({ current }: { current: string }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setBusy(true);
    try {
      const result = await changeUsernameRequest(
        String(data.get('username') ?? ''),
        String(data.get('currentPassword') ?? ''),
      );
      toast.success(`Nom d’utilisateur changé en « ${result.username} ».`);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Modification impossible.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Nom d’utilisateur"
      description="Il sert à la connexion au dashboard."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Nouveau nom d’utilisateur"
          htmlFor="new-username"
          help={`Actuellement : ${current}`}
        >
          <Input
            id="new-username"
            name="username"
            required
            minLength={3}
            maxLength={120}
            autoComplete="username"
            defaultValue=""
            placeholder={current}
          />
        </Field>

        <Field label="Mot de passe actuel" htmlFor="username-password">
          <Input
            id="username-password"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </Field>

        <AdminButton type="submit" variant="primary" loading={busy}>
          <UserPen className="h-4 w-4" />
          Changer le nom d’utilisateur
        </AdminButton>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const next = String(data.get('newPassword') ?? '');
    const confirm = String(data.get('confirmPassword') ?? '');

    if (next !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setBusy(true);
    try {
      await changePasswordRequest(
        String(data.get('currentPassword') ?? ''),
        next,
      );
      toast.success(
        'Mot de passe changé. Les autres sessions ouvertes ont été fermées.',
      );
      form.reset();
      router.refresh();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Modification impossible.';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Mot de passe"
      description="10 caractères minimum. Stocké uniquement sous forme de hash bcrypt."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Mot de passe actuel" htmlFor="current-password">
          <Input
            id="current-password"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nouveau mot de passe" htmlFor="new-password">
            <Input
              id="new-password"
              name="newPassword"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
            />
          </Field>

          <Field label="Confirmation" htmlFor="confirm-password">
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
            />
          </Field>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <AdminButton type="submit" variant="primary" loading={busy}>
          <KeyRound className="h-4 w-4" />
          Changer le mot de passe
        </AdminButton>
      </form>
    </Card>
  );
}
