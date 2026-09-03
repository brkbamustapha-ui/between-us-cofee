import { jwtVerify, SignJWT } from 'jose';

/**
 * Session administrateur : JWT HS256 déposé dans un cookie httpOnly.
 *
 * Ce module est volontairement compatible Edge Runtime (aucun accès base de
 * données, aucune dépendance Node) afin que le middleware puisse vérifier la
 * session avant même d'atteindre le rendu des pages `/admin`.
 */

export const SESSION_COOKIE = 'bu_admin_session';
const ISSUER = 'between-us';
const AUDIENCE = 'between-us-admin';

export interface SessionPayload {
  /** Identifiant du compte administrateur. */
  sub: string;
  username: string;
  /**
   * Empreinte du hash de mot de passe courant. Changer le mot de passe change
   * l'empreinte, ce qui invalide instantanément toutes les sessions ouvertes.
   */
  fp: string;
}

export function sessionMaxAge(): number {
  const raw = Number(process.env.AUTH_SESSION_MAX_AGE);
  return Number.isFinite(raw) && raw >= 300 ? raw : 8 * 60 * 60;
}

/** Empreinte courte et non réversible du hash bcrypt (le hash n'est jamais exposé). */
export function passwordFingerprint(passwordHash: string): string {
  return passwordHash.slice(-16);
}

class MissingSecretError extends Error {
  constructor() {
    super(
      'AUTH_SECRET n’est pas défini. Générez une clé avec `openssl rand -base64 48` puis ajoutez-la à vos variables d’environnement.',
    );
    this.name = 'MissingSecretError';
  }
}

/**
 * Clé de signature. En développement, une clé de repli permet de démarrer sans
 * configuration ; en production l'absence de secret est une erreur bloquante
 * plutôt qu'une faille silencieuse.
 */
function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new MissingSecretError();
    }
    return new TextEncoder().encode(
      'between-us-development-only-secret-do-not-use-in-production',
    );
  }

  if (secret.length < 32) {
    throw new Error('AUTH_SECRET doit contenir au moins 32 caractères.');
  }

  return new TextEncoder().encode(secret);
}

export function isAuthSecretConfigured(): boolean {
  const secret = process.env.AUTH_SECRET?.trim();
  return Boolean(secret && secret.length >= 32);
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ username: payload.username, fp: payload.fp })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + sessionMaxAge())
    .sign(secretKey());
}

export async function readSessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.username !== 'string' ||
      typeof payload.fp !== 'string'
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      username: payload.username,
      fp: payload.fp,
    };
  } catch {
    // Signature invalide, jeton expiré ou secret changé : session refusée.
    return null;
  }
}

/** Options du cookie de session, communes à la pose et à la suppression. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
