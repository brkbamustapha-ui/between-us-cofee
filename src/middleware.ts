import { NextResponse, type NextRequest } from 'next/server';

import { readSessionToken, SESSION_COOKIE } from '@/lib/auth/session';

/**
 * Protection des routes d'administration.
 *
 * Le middleware ne fait qu'une chose : vérifier la signature et l'expiration du
 * jeton de session (compatible Edge Runtime, aucun accès base de données). La
 * vérification complète — compte toujours existant, mot de passe inchangé — est
 * refaite côté serveur dans le layout `/admin` et dans chaque route d'API, car
 * un middleware ne doit jamais être l'unique barrière.
 */

const LOGIN_PATH = '/admin/login';
const HOME_PATH = '/admin/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const session = await readSessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  // Déjà connecté : la page de connexion n'a plus lieu d'être.
  if (pathname === LOGIN_PATH) {
    if (session) {
      return NextResponse.redirect(new URL(HOME_PATH, request.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(
      new URL(session ? HOME_PATH : LOGIN_PATH, request.url),
    );
  }

  if (!session) {
    const url = new URL(LOGIN_PATH, request.url);
    // Mémorise la destination pour y revenir après connexion.
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Les routes d'API admin font leur propre contrôle (elles doivent répondre en
  // JSON 401 plutôt que par une redirection HTML).
  matcher: ['/admin', '/admin/:path*'],
};
