import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { z } from 'zod';

import { fail, handleError, ok, readJson } from '@/lib/api/respond';
import { requireAdmin } from '@/lib/auth/admin';
import { IMAGE_TYPES, MAX_IMAGE_BYTES, uploadMedia } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Téléchargement distant + recompression : au-delà des 10 s par défaut.
export const maxDuration = 60;

/**
 * Import d'une image depuis une URL publique.
 *
 * Le navigateur ne peut pas récupérer lui-même une image d'un autre domaine
 * (CORS), et pointer directement l'URL distante depuis le site aurait deux
 * défauts : `next/image` refuse un hôte non déclaré dans `next.config.ts`, et
 * la photo disparaîtrait le jour où le serveur d'en face la retire. On la
 * télécharge donc ici, une fois, puis elle vit dans notre propre stockage
 * comme n'importe quel téléversement.
 *
 * La suite du traitement est celle des fichiers envoyés à la main :
 * conversion en WebP, 2000 px de large au maximum.
 */

const schema = z
  .object({
    url: z.string().url().max(2000),
    folder: z
      .enum(['gallery', 'videos', 'menu', 'content', 'brand'])
      .default('menu'),
  })
  .strict();

/** Délai au-delà duquel un serveur distant lent est abandonné. */
const FETCH_TIMEOUT_MS = 20_000;

/**
 * Refuse une adresse qui ne sort pas sur l'internet public.
 *
 * L'URL est fournie par l'administrateur, mais la requête part du serveur :
 * sans ce contrôle, `http://169.254.169.254/…` ferait lire à notre propre
 * infrastructure ses métadonnées d'hébergement, et `http://10.0.0.1/…`
 * atteindrait un réseau privé. On résout donc le nom et on inspecte l'adresse
 * réelle plutôt que de se fier au texte de l'URL.
 */
function isPrivateAddress(address: string): boolean {
  const version = isIP(address);

  if (version === 4) {
    const [a, b] = address.split('.').map(Number) as [number, number];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local, métadonnées cloud
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }

  if (version === 6) {
    const normalized = address.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true;
    if (normalized.startsWith('fe80')) return true; // link-local
    if (/^f[cd]/.test(normalized)) return true; // unique local
    // ::ffff:10.0.0.1 — une adresse IPv4 déguisée en IPv6.
    const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]!);
    return false;
  }

  return true; // adresse non reconnue : on refuse par défaut
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new Error('private');
    }
    return;
  }

  const records = await lookup(hostname, { all: true });
  if (records.length === 0 || records.some((r) => isPrivateAddress(r.address))) {
    throw new Error('private');
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const { url, folder } = schema.parse(await readJson(request));

    let target: URL;
    try {
      target = new URL(url);
    } catch {
      return fail('URL invalide.', 400);
    }

    if (target.protocol !== 'https:' && target.protocol !== 'http:') {
      return fail('Seules les adresses http et https sont acceptées.', 400);
    }

    try {
      await assertPublicHost(target.hostname);
    } catch {
      return fail(
        'Cette adresse ne pointe pas vers un site public. Copiez le lien de l’image tel qu’il apparaît dans votre navigateur.',
        400,
      );
    }

    let response: Response;
    try {
      response = await fetch(target, {
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          // Certains hébergeurs renvoient une page d'erreur à un client sans
          // en-têtes de navigateur ; ceux-ci suffisent à obtenir l'image.
          Accept: 'image/*',
          'User-Agent':
            'Mozilla/5.0 (compatible; BetweenUsBot/1.0; +https://between-us-coffee.vercel.app)',
        },
      });
    } catch {
      return fail(
        'Image inaccessible : le site distant n’a pas répondu. Vérifiez le lien, ou téléversez le fichier directement.',
        502,
      );
    }

    if (!response.ok) {
      return fail(
        `Le site distant a répondu ${response.status}. Ce lien ne pointe peut-être pas directement sur une image : dans Google Images, ouvrez la photo puis copiez « l’adresse de l’image ».`,
        502,
      );
    }

    // Le type MIME peut porter un paramètre (« image/jpeg; charset=… »).
    const contentType = (response.headers.get('content-type') ?? '')
      .split(';')[0]!
      .trim()
      .toLowerCase();

    if (!(IMAGE_TYPES as readonly string[]).includes(contentType)) {
      return fail(
        `Ce lien renvoie « ${contentType || 'un contenu inconnu'} » et non une image. Dans Google Images, cliquez sur la photo puis « Copier l’adresse de l’image ».`,
        415,
      );
    }

    const declared = Number(response.headers.get('content-length') ?? 0);
    if (declared > MAX_IMAGE_BYTES) {
      return fail(
        `Image trop volumineuse (${Math.round(declared / 1024 / 1024)} Mo). Limite : ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} Mo.`,
        413,
      );
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    // `content-length` est déclaratif : on revérifie sur les octets reçus.
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return fail('Image trop volumineuse.', 413);
    }
    if (bytes.byteLength === 0) {
      return fail('Le fichier reçu est vide.', 400);
    }

    const name = decodeURIComponent(target.pathname.split('/').pop() || 'image');
    const file = new File([new Uint8Array(bytes)], name, { type: contentType });

    return ok({ ...(await uploadMedia(file, folder)), source: target.hostname });
  } catch (error) {
    return handleError(error);
  }
}
