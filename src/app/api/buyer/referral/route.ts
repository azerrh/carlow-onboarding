import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureReferralCode, REWARD_CENTS } from "@/lib/referral";

/**
 * GET /api/buyer/referral?buyerId=xxx
 *
 * Retourne :
 *  - Code parrainage (généré à la volée si absent)
 *  - Solde de crédit + total gagné historique
 *  - Liste des filleuls (avec statut)
 *  - Statistiques
 */

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId") ?? searchParams.get("id");
    if (!buyerId) {
      return NextResponse.json({ error: "buyerId requis" }, { status: 400 });
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      select: {
        id: true,
        name: true,
        referralCode: true,
        referredByCode: true,
        referralCreditCents: true,
        referralEarnedCents: true,
      },
    });
    if (!buyer) {
      return NextResponse.json(
        { error: "Acheteur introuvable" },
        { status: 404 }
      );
    }

    // Garantit qu'un code existe
    const code = buyer.referralCode ?? (await ensureReferralCode(buyerId));

    // Liste des filleuls
    const referrals = await prisma.referralEvent.findMany({
      where: { referrerId: buyerId },
      orderBy: { createdAt: "desc" },
      include: {
        referred: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    // Stats
    const totalReferred = referrals.length;
    const rewardedCount = referrals.filter((r) => r.status === "rewarded").length;
    const pendingCount = referrals.filter((r) => r.status === "pending").length;

    // Si je suis filleul, infos sur mon parrain
    let myReferrer: { name: string; code: string } | null = null;
    if (buyer.referredByCode) {
      const ref = await prisma.buyer.findUnique({
        where: { referralCode: buyer.referredByCode },
        select: { name: true, referralCode: true },
      });
      if (ref?.referralCode) {
        myReferrer = { name: ref.name, code: ref.referralCode };
      }
    }

    return NextResponse.json({
      success: true,
      code,
      rewardCents: REWARD_CENTS,
      creditCents: buyer.referralCreditCents,
      earnedCents: buyer.referralEarnedCents,
      myReferrer,
      stats: {
        totalReferred,
        rewardedCount,
        pendingCount,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        status: r.status,
        rewardCents: r.rewardCents,
        createdAt: r.createdAt,
        rewardedAt: r.rewardedAt,
        buyer: {
          name: r.referred.name,
          // On masque l'email partiellement pour la confidentialité
          email: maskEmail(r.referred.email),
          signupAt: r.referred.createdAt,
        },
      })),
    });
  } catch (error) {
    console.error("[api/buyer/referral] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Masque l'email pour ne pas exposer l'identité complète du filleul.
 * "jean.dupont@gmail.com" → "jea***@gmail.com"
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}***@${domain}`;
}
