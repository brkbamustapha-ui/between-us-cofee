import { clientIp, fail, handleError, ok, readJson } from '@/lib/api/respond';
import { login, throttleByIp } from '@/lib/auth/admin';
import { isAuthSecretConfigured } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (
      process.env.NODE_ENV === 'production' &&
      !isAuthSecretConfigured()
    ) {
      return fail(
        'AUTH_SECRET n’est pas configuré sur le serveur. La connexion admin est désactivée tant que cette variable est absente.',
        503,
      );
    }

    const throttle = throttleByIp(clientIp(request));
    if (!throttle.allowed) {
      return fail(
        `Trop de tentatives. Réessayez dans ${throttle.retryAfter} secondes.`,
        429,
      );
    }

    const { username, password } = loginSchema.parse(await readJson(request));
    const result = await login(username, password);

    if (!result.ok) {
      return fail(result.message, result.status);
    }

    return ok({ username: result.user.username });
  } catch (error) {
    return handleError(error);
  }
}
