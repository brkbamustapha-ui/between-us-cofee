import 'server-only';

import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';

import { getStore, type AdminUserRecord } from '@/lib/db';
import { StoreError } from '@/lib/db/store';
import {
  hashPassword,
  INITIAL_ADMIN_PASSWORD,
  INITIAL_ADMIN_USERNAME,
  verifyPassword,
} from './password';
import {
  createSessionToken,
  passwordFingerprint,
  readSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  sessionMaxAge,
  type SessionPayload,
} from './session';

/* -------------------------------------------------------------------------- */
/*  Anti-brute-force                                                           */
/* -------------------------------------------------------------------------- */

const MAX_FAILED_ATTEMPTS = 8;
const LOCK_DURATION_MS = 15 * 60 * 1000;

/** Fenêtre glissante par IP, en mémoire — complète le verrouillage du compte. */
const IP_WINDOW_MS = 60 * 1000;
const IP_MAX_ATTEMPTS = 12;
const ipHits = new Map<string, { count: number; resetAt: number }>();

export function throttleByIp(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = ipHits.get(ip);

  if (!entry || entry.resetAt <= now) {
    ipHits.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });

    // Purge opportuniste : évite que la Map ne grossisse indéfiniment.
    if (ipHits.size > 500) {
      for (const [key, value] of ipHits) {
        if (value.resetAt <= now) ipHits.delete(key);
      }
    }
    return { allowed: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > IP_MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return { allowed: true, retryAfter: 0 };
}

/* -------------------------------------------------------------------------- */
/*  Compte administrateur                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Garantit l'existence du compte administrateur.
 *
 * Au premier démarrage, le compte est créé à partir de `ADMIN_USERNAME` et
 * `ADMIN_PASSWORD_HASH`. Si aucun hash n'est fourni, le mot de passe initial
 * documenté est haché à la volée — il doit être changé immédiatement depuis
 * `/admin/security`.
 */
export async function ensureAdminUser(): Promise<AdminUserRecord> {
  const store = getStore();
  const existing = await store.getAdminUser();
  if (existing) return existing;

  const username =
    process.env.ADMIN_USERNAME?.trim() || INITIAL_ADMIN_USERNAME;
  const envHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const passwordHash = envHash || (await hashPassword(INITIAL_ADMIN_PASSWORD));

  const now = new Date().toISOString();
  const record: AdminUserRecord = {
    id: randomUUID(),
    username,
    passwordHash,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
    failedAttempts: 0,
    lockedUntil: null,
  };

  return store.saveAdminUser(record);
}

/** `true` tant que le compte utilise encore le mot de passe initial documenté. */
export async function isUsingInitialPassword(
  user: AdminUserRecord,
): Promise<boolean> {
  if (process.env.ADMIN_PASSWORD_HASH?.trim()) return false;
  return verifyPassword(INITIAL_ADMIN_PASSWORD, user.passwordHash);
}

/* -------------------------------------------------------------------------- */
/*  Connexion / déconnexion                                                    */
/* -------------------------------------------------------------------------- */

export type LoginResult =
  | { ok: true; user: AdminUserRecord }
  | { ok: false; message: string; status: number };

export async function login(
  username: string,
  password: string,
): Promise<LoginResult> {
  const store = getStore();
  const user = await ensureAdminUser();

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const minutes = Math.max(
      1,
      Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000),
    );
    return {
      ok: false,
      status: 429,
      message: `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    };
  }

  const usernameMatches =
    username.trim().toLowerCase() === user.username.trim().toLowerCase();
  // Le hash est vérifié même si le nom d'utilisateur est faux : le temps de
  // réponse ne révèle donc pas l'existence du compte.
  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!usernameMatches || !passwordMatches) {
    const failedAttempts = user.failedAttempts + 1;
    const lockedUntil =
      failedAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCK_DURATION_MS).toISOString()
        : null;

    await store.saveAdminUser({ ...user, failedAttempts, lockedUntil });

    return {
      ok: false,
      status: 401,
      message: lockedUntil
        ? 'Trop de tentatives. Le compte est temporairement verrouillé pendant 15 minutes.'
        : 'Identifiants incorrects.',
    };
  }

  const updated = await store.saveAdminUser({
    ...user,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date().toISOString(),
  });

  await openSession(updated);
  return { ok: true, user: updated };
}

export async function openSession(user: AdminUserRecord): Promise<void> {
  const token = await createSessionToken({
    sub: user.id,
    username: user.username,
    fp: passwordFingerprint(user.passwordHash),
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(sessionMaxAge()));
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', sessionCookieOptions(0));
}

/* -------------------------------------------------------------------------- */
/*  Lecture de la session                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Session courante, revalidée contre la base : un compte supprimé, renommé ou
 * dont le mot de passe a changé perd immédiatement l'accès, même si son cookie
 * n'a pas encore expiré.
 */
export async function getCurrentAdmin(): Promise<AdminUserRecord | null> {
  const jar = await cookies();
  const payload: SessionPayload | null = await readSessionToken(
    jar.get(SESSION_COOKIE)?.value,
  );
  if (!payload) return null;

  const user = await getStore().getAdminUser();
  if (!user || user.id !== payload.sub) return null;
  if (passwordFingerprint(user.passwordHash) !== payload.fp) return null;

  return user;
}

/** Variante pour les routes d'API : lève une `StoreError` 401 si non connecté. */
export async function requireAdmin(): Promise<AdminUserRecord> {
  const user = await getCurrentAdmin();
  if (!user) {
    throw new StoreError('Session expirée. Reconnectez-vous.', 401);
  }
  return user;
}

/* -------------------------------------------------------------------------- */
/*  Modification des identifiants                                              */
/* -------------------------------------------------------------------------- */

export async function changeUsername(
  user: AdminUserRecord,
  nextUsername: string,
  currentPassword: string,
): Promise<AdminUserRecord> {
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new StoreError('Mot de passe actuel incorrect.', 401);
  }

  const username = nextUsername.trim();
  if (username.length < 3) {
    throw new StoreError(
      'Le nom d’utilisateur doit contenir au moins 3 caractères.',
    );
  }

  const updated = await getStore().saveAdminUser({
    ...user,
    username,
    updatedAt: new Date().toISOString(),
  });

  // Le nom figure dans le jeton : on réémet la session pour la garder cohérente.
  await openSession(updated);
  return updated;
}

export async function changePassword(
  user: AdminUserRecord,
  currentPassword: string,
  nextPassword: string,
): Promise<AdminUserRecord> {
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new StoreError('Mot de passe actuel incorrect.', 401);
  }
  if (await verifyPassword(nextPassword, user.passwordHash)) {
    throw new StoreError(
      'Le nouveau mot de passe doit être différent de l’ancien.',
    );
  }

  const updated = await getStore().saveAdminUser({
    ...user,
    passwordHash: await hashPassword(nextPassword),
    updatedAt: new Date().toISOString(),
  });

  // Changer le mot de passe invalide toutes les sessions : on rouvre celle-ci.
  await openSession(updated);
  return updated;
}
