import 'server-only';

import bcrypt from 'bcryptjs';

/** Coût bcrypt : compromis usuel entre sécurité et temps de réponse (~250 ms). */
const BCRYPT_COST = 12;

/** Mot de passe initial documenté, utilisé uniquement si ADMIN_PASSWORD_HASH est absent. */
export const INITIAL_ADMIN_PASSWORD = 'between us cofee and brunch';
export const INITIAL_ADMIN_USERNAME = 'between us cofee';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Compare un mot de passe à son hash. `bcrypt.compare` est constant-time et ne
 * lève pas sur un hash malformé — il renvoie simplement `false`.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export interface PasswordPolicyResult {
  ok: boolean;
  message?: string;
}

/** Règles minimales appliquées lors d'un changement de mot de passe. */
export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  if (password.length < 10) {
    return {
      ok: false,
      message: 'Le mot de passe doit contenir au moins 10 caractères.',
    };
  }
  if (password.length > 200) {
    return { ok: false, message: 'Le mot de passe est trop long.' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return {
      ok: false,
      message: 'Le mot de passe doit contenir au moins une lettre.',
    };
  }
  return { ok: true };
}
