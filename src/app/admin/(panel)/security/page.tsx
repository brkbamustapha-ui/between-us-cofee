import { redirect } from 'next/navigation';

import { PageHeader } from '@/components/admin/shell';
import { Card, Notice } from '@/components/admin/ui';
import { getCurrentAdmin, isUsingInitialPassword } from '@/lib/auth/admin';
import { isAuthSecretConfigured, sessionMaxAge } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/utils';
import { SecurityForms } from './security-forms';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const initialPassword = await isUsingInitialPassword(admin);
  const hours = Math.round(sessionMaxAge() / 3600);

  return (
    <>
      <PageHeader
        title="Sécurité"
        description="Identifiants de connexion et état de la protection du dashboard."
      />

      <div className="space-y-5">
        {initialPassword && (
          <Notice tone="danger">
            <p>
              <strong className="font-semibold">
                Le mot de passe initial est toujours actif.
              </strong>{' '}
              Changez-le maintenant : il est documenté dans le projet et donc
              connu de toute personne y ayant accès.
            </p>
          </Notice>
        )}

        {!isAuthSecretConfigured() && (
          <Notice tone="warn">
            <p>
              <strong className="font-semibold">AUTH_SECRET non configuré.</strong>{' '}
              Les sessions sont signées avec une clé de développement. Générez
              une clé (<code>openssl rand -base64 48</code>) et ajoutez-la aux
              variables d’environnement avant toute mise en ligne — sans elle, la
              connexion est refusée en production.
            </p>
          </Notice>
        )}

        <SecurityForms username={admin.username} />

        <Card
          title="État de la session"
          description="Ce qui protège actuellement l’accès au dashboard."
        >
          <dl className="space-y-2.5 text-sm">
            <Row label="Compte" value={admin.username} />
            <Row
              label="Dernière connexion"
              value={
                admin.lastLoginAt
                  ? formatDateTime(admin.lastLoginAt)
                  : 'Première session'
              }
            />
            <Row
              label="Dernière modification"
              value={formatDateTime(admin.updatedAt)}
            />
            <Row label="Durée de session" value={`${hours} heures`} />
            <Row
              label="Tentatives échouées"
              value={String(admin.failedAttempts)}
              tone={admin.failedAttempts > 0 ? 'warn' : 'ok'}
            />
            <Row
              label="Clé de signature"
              value={isAuthSecretConfigured() ? 'Configurée' : 'Manquante'}
              tone={isAuthSecretConfigured() ? 'ok' : 'warn'}
            />
          </dl>

          <div className="mt-5 space-y-2 border-t border-line pt-4 text-xs leading-relaxed text-fg-subtle">
            <p>
              • Le mot de passe est haché avec bcrypt (coût 12) et n’est jamais
              stocké ni transmis en clair.
            </p>
            <p>
              • La session est un jeton signé déposé dans un cookie{' '}
              <code>httpOnly</code>, <code>SameSite=Lax</code>, et{' '}
              <code>Secure</code> en production — inaccessible au JavaScript de
              la page.
            </p>
            <p>
              • Après 8 tentatives infructueuses, le compte est verrouillé 15
              minutes ; une limite par adresse IP s’applique en plus.
            </p>
            <p>
              • Changer le mot de passe invalide immédiatement toutes les autres
              sessions ouvertes.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'warn';
}) {
  return (
    <div className="flex flex-wrap justify-between gap-3 border-b border-line pb-2.5 last:border-0 last:pb-0">
      <dt className="text-fg-muted">{label}</dt>
      <dd
        className={
          tone === 'ok'
            ? 'font-medium text-ok'
            : tone === 'warn'
              ? 'font-medium text-warn'
              : 'font-medium text-cream'
        }
      >
        {value}
      </dd>
    </div>
  );
}
