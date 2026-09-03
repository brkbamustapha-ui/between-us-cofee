import { handleError, ok } from '@/lib/api/respond';
import { logout } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await logout();
    return ok({ loggedOut: true });
  } catch (error) {
    return handleError(error);
  }
}
