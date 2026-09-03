import { z } from 'zod';

import { clientIp, fail, handleError, ok, readJson } from '@/lib/api/respond';
import {
  changePassword,
  changeUsername,
  requireAdmin,
  throttleByIp,
} from '@/lib/auth/admin';
import { checkPasswordPolicy } from '@/lib/auth/password';
import {
  changePasswordSchema,
  changeUsernameSchema,
} from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// `discriminatedUnion` exige des objets Zod : on étend chaque schéma plutôt que
// de l'intersecter, ce qui garde le discriminant `action` analysable.
const bodySchema = z.discriminatedUnion('action', [
  changeUsernameSchema.extend({ action: z.literal('username') }),
  changePasswordSchema.extend({ action: z.literal('password') }),
]);

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();

    // Le mot de passe actuel est exigé : on limite aussi les essais ici.
    const throttle = throttleByIp(`security:${clientIp(request)}`);
    if (!throttle.allowed) {
      return fail(
        `Trop de tentatives. Réessayez dans ${throttle.retryAfter} secondes.`,
        429,
      );
    }

    const body = bodySchema.parse(await readJson(request));

    if (body.action === 'username') {
      const updated = await changeUsername(
        user,
        body.username,
        body.currentPassword,
      );
      return ok({ username: updated.username });
    }

    const policy = checkPasswordPolicy(body.newPassword);
    if (!policy.ok) return fail(policy.message ?? 'Mot de passe refusé.', 422);

    await changePassword(user, body.currentPassword, body.newPassword);
    return ok({ changed: true });
  } catch (error) {
    return handleError(error);
  }
}
