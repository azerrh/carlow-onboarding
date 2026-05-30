import { prisma } from "@/lib/prisma";

/**
 * Système de parrainage — helpers.
 *
 * Logique métier :
 *  - Chaque acheteur reçoit un code unique à l'inscription (CARLOW-XXXX).
 *  - Quand un nouvel acheteur s'inscrit avec un code parrain valide, on crée
 *    un ReferralEvent en "pending".
 *  - Quand le filleul passe sa PREMIÈRE commande valide (status != ANNULEE),
 *    on passe l'événement en "rewarded" et on crédite +10€ aux deux parties.
 *  - Le crédit (referralCreditCents) est consommable au checkout.
 *
 * Récompense par défaut : 10€ pour chacun (configurable via REFERRAL_REWARD_CENTS).
 */

const REWARD_CENTS = 1000; // 10€

/**
 * Génère un code parrainage lisible style "CARLOW-XK4N9P".
 * On exclut les caractères ambigus (0, O, 1, I, L) pour faciliter la
 * dictée orale.
 */
function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "CARLOW-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Garantit qu'un acheteur a un code unique. Si déjà présent → retourne tel quel,
 * sinon en génère un et persiste. Boucle jusqu'à 10 essais en cas de collision
 * (probabilité < 10⁻⁶, donc essentiellement jamais).
 */
export async function ensureReferralCode(buyerId: string): Promise<string> {
  const buyer = await prisma.buyer.findUnique({
    where: { id: buyerId },
    select: { referralCode: true },
  });
  if (!buyer) throw new Error("Buyer introuvable");
  if (buyer.referralCode) return buyer.referralCode;

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateCode();
    const existing = await prisma.buyer.findUnique({
      where: { referralCode: candidate },
      select: { id: true },
    });
    if (!existing) {
      await prisma.buyer.update({
        where: { id: buyerId },
        data: { referralCode: candidate },
      });
      return candidate;
    }
  }
  throw new Error("Impossible de générer un code unique (collisions répétées)");
}

/**
 * Crée un ReferralEvent en "pending" si le code parrain est valide.
 * À appeler à l'inscription d'un nouvel acheteur.
 *
 * - Ignore silencieusement si code invalide / inexistant (UX safe)
 * - Refuse l'auto-parrainage (un acheteur ne peut pas se parrainer lui-même)
 * - Refuse si le filleul a déjà un parrain
 */
export async function registerReferral(
  newBuyerId: string,
  referralCode: string | null | undefined
): Promise<{ success: boolean; reason?: string }> {
  if (!referralCode || typeof referralCode !== "string") {
    return { success: false, reason: "no-code" };
  }
  const code = referralCode.trim().toUpperCase();
  if (code.length < 3) return { success: false, reason: "invalid-code" };

  try {
    const referrer = await prisma.buyer.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!referrer) return { success: false, reason: "code-not-found" };
    if (referrer.id === newBuyerId) {
      return { success: false, reason: "self-referral" };
    }

    // Vérifie qu'il n'y a pas déjà un événement (filleul déjà parrainé)
    const existing = await prisma.referralEvent.findUnique({
      where: { referredId: newBuyerId },
      select: { id: true },
    });
    if (existing) return { success: false, reason: "already-referred" };

    await prisma.referralEvent.create({
      data: {
        referrerId: referrer.id,
        referredId: newBuyerId,
        rewardCents: REWARD_CENTS,
        status: "pending",
      },
    });

    // Stocke aussi le code utilisé sur le profil du filleul (référence)
    await prisma.buyer.update({
      where: { id: newBuyerId },
      data: { referredByCode: code },
    });

    return { success: true };
  } catch (err) {
    console.error("[registerReferral] error:", err);
    return { success: false, reason: "server-error" };
  }
}

/**
 * Distribue les récompenses si l'acheteur vient de passer sa PREMIÈRE
 * commande non annulée.
 *
 * À appeler depuis le webhook Stripe ou le success handler de checkout.
 * Idempotent : on vérifie le status de l'événement avant de créditer.
 */
export async function processReferralReward(buyerId: string, orderId: string) {
  try {
    const event = await prisma.referralEvent.findUnique({
      where: { referredId: buyerId },
      select: { id: true, status: true, referrerId: true, rewardCents: true },
    });
    if (!event) return; // pas parrainé
    if (event.status !== "pending") return; // déjà récompensé ou annulé

    // Vérifie que c'est bien la 1ère commande (sécurité)
    const orderCount = await prisma.order.count({
      where: { buyerId, status: { not: "ANNULEE" } },
    });
    if (orderCount !== 1) return;

    // Atomique : crédite les deux + change le status
    await prisma.$transaction([
      prisma.buyer.update({
        where: { id: event.referrerId },
        data: {
          referralCreditCents: { increment: event.rewardCents },
          referralEarnedCents: { increment: event.rewardCents },
        },
      }),
      prisma.buyer.update({
        where: { id: buyerId },
        data: {
          referralCreditCents: { increment: event.rewardCents },
          referralEarnedCents: { increment: event.rewardCents },
        },
      }),
      prisma.referralEvent.update({
        where: { id: event.id },
        data: {
          status: "rewarded",
          triggerOrderId: orderId,
          rewardedAt: new Date(),
        },
      }),
    ]);
  } catch (err) {
    console.error("[processReferralReward] error:", err);
  }
}

export { REWARD_CENTS };
