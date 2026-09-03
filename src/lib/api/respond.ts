import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { StoreError } from '@/lib/db/store';
import { firstIssueMessage } from '@/lib/validation/schemas';

/** Réponse JSON de succès. */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

/** Réponse JSON d'erreur, au format attendu par le client admin. */
export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/**
 * Convertit une exception en réponse HTTP.
 *
 * Les erreurs attendues (`StoreError`, `ZodError`) portent un message affichable.
 * Toute autre exception est journalisée côté serveur et renvoyée sous forme
 * générique : aucun détail d'infrastructure n'atteint le navigateur.
 */
export function handleError(error: unknown): NextResponse {
  if (error instanceof StoreError) {
    return fail(error.message, error.status);
  }
  if (error instanceof ZodError) {
    return fail(firstIssueMessage(error), 422);
  }

  console.error('[api]', error);
  return fail(
    'Une erreur est survenue. Réessayez, et consultez les journaux du serveur si le problème persiste.',
    500,
  );
}

/** Lit et parse le corps JSON d'une requête, avec message clair si invalide. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new StoreError('Corps de requête JSON invalide.', 400);
  }
}

/** Adresse IP de l'appelant, telle que transmise par le proxy Vercel. */
export function clientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return headers.get('x-real-ip') ?? 'unknown';
}
