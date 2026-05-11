import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/**
 * Helpers Web Push côté serveur.
 *
 * - Init lazy : on configure les VAPID keys au premier appel. Si elles
 *   manquent (.env mal configuré), on logge un warning et on no-op les
 *   envois — les flows métiers ne doivent JAMAIS planter à cause d'une
 *   notif push qui ne part pas.
 * - Cleanup automatique : si l'endpoint renvoie 410 (Gone) ou 404, on
 *   supprime la souscription de la DB (le device a désinstallé l'app ou
 *   désactivé les notifs).
 */

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:contact@carlow.fr";
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys manquantes — push désactivé.");
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

/**
 * Envoie une notification à tous les devices d'un acheteur OU vendeur.
 * Best-effort : ne fail jamais, retourne le compteur d'envois réussis.
 */
export async function sendPushToUser(
  user: { vendorId?: string; buyerId?: string },
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!configure()) return { sent: 0, failed: 0 };
  if (!user.vendorId && !user.buyerId) return { sent: 0, failed: 0 };

  const subs = await prisma.pushSubscription.findMany({
    where: {
      ...(user.vendorId ? { vendorId: user.vendorId } : {}),
      ...(user.buyerId ? { buyerId: user.buyerId } : {}),
    },
  });

  if (subs.length === 0) return { sent: 0, failed: 0 };

  const json = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const toDelete: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          json
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        // status 404 ou 410 = subscription expirée → on la supprime
        const statusCode =
          typeof err === "object" && err !== null && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          toDelete.push(s.id);
        } else {
          console.error("[push] échec envoi:", err);
        }
      }
    })
  );

  if (toDelete.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: toDelete } },
    });
  }

  return { sent, failed };
}
