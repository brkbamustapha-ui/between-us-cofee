import { clientIp, fail, handleError, ok, readJson } from '@/lib/api/respond';
import { getStore, invalidateSiteContent } from '@/lib/db';
import { publicReservationSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Limite d'envoi par IP : 5 demandes par tranche de 10 minutes. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function allow(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 500) {
      for (const [key, value] of hits) if (value.resetAt <= now) hits.delete(key);
    }
    return true;
  }

  entry.count += 1;
  return entry.count <= MAX_PER_WINDOW;
}

/**
 * Réception d'une demande de réservation depuis le site public.
 *
 * La demande est enregistrée (visible dans `/admin/reservations`) ; le
 * formulaire propose ensuite au visiteur de la confirmer par WhatsApp, ce qui
 * évite de dépendre d'un service d'e-mail tiers.
 */
export async function POST(request: Request) {
  try {
    if (!allow(clientIp(request))) {
      return fail(
        'Trop de demandes envoyées. Réessayez dans quelques minutes ou appelez-nous directement.',
        429,
      );
    }

    const body = publicReservationSchema.parse(await readJson(request));

    // Champ piège : silencieusement accepté pour ne pas renseigner les robots.
    if (body.website) {
      return ok({ id: null, received: true });
    }

    const store = getStore();
    const settings = await store.getSingleton('reservation');

    if (!settings.enabled) {
      return fail(
        'Les réservations en ligne sont momentanément fermées. Contactez-nous par téléphone.',
        409,
      );
    }

    if (body.guests < settings.minGuests || body.guests > settings.maxGuests) {
      return fail(
        `Le nombre de personnes doit être compris entre ${settings.minGuests} et ${settings.maxGuests}.`,
        422,
      );
    }

    // Une réservation ne peut pas être dans le passé ni trop loin dans le futur.
    const requested = new Date(`${body.date}T${body.time}:00`);
    if (Number.isNaN(requested.getTime())) {
      return fail('Date ou heure invalide.', 422);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + settings.maxAdvanceDays);

    const requestedDay = new Date(`${body.date}T00:00:00`);
    if (requestedDay < today) {
      return fail('La date choisie est déjà passée.', 422);
    }
    if (requestedDay > limit) {
      return fail(
        `Les réservations sont ouvertes jusqu’à ${settings.maxAdvanceDays} jours à l’avance.`,
        422,
      );
    }

    if (body.time < settings.openingTime || body.time > settings.closingTime) {
      return fail(
        `Nous accueillons de ${settings.openingTime} à ${settings.closingTime}.`,
        422,
      );
    }

    const created = await store.create('reservations', {
      name: body.name,
      phone: body.phone,
      guests: body.guests,
      date: body.date,
      time: body.time,
      message: body.message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Le compteur du dashboard reflète la nouvelle demande immédiatement.
    invalidateSiteContent();

    return ok({ id: created.id, received: true }, 201);
  } catch (error) {
    return handleError(error);
  }
}
