import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

/**
 * Liste des tokens d'authentification actifs (RESET_PASSWORD + VERIFY_EMAIL).
 *
 * Endpoint réservé à l'admin — sert de fallback quand l'envoi Resend est
 * limité (free tier qui n'envoie qu'à l'email du compte propriétaire).
 *
 * L'admin peut récupérer le lien complet pour l'envoyer manuellement à
 * un utilisateur bloqué (réinitialisation de mot de passe, vérification
 * d'email). Pas idéal pour la prod mais indispensable pour la démo.
 *
 * Filtre : on ne montre que les tokens non utilisés, non expirés, créés
 * il y a moins de 24h pour limiter le bruit.
 */
export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const tokens = await prisma.authToken.findMany({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // On enrichit avec l'email du user concerné (pour faciliter le repérage).
    const enriched = await Promise.all(
      tokens.map(async (t) => {
        let userEmail: string | null = null;
        let userName: string | null = null;
        try {
          if (t.userType === "VENDOR") {
            const v = await prisma.vendor.findUnique({
              where: { id: t.userId },
              select: { email: true, name: true },
            });
            userEmail = v?.email ?? null;
            userName = v?.name ?? null;
          } else if (t.userType === "BUYER") {
            const b = await prisma.buyer.findUnique({
              where: { id: t.userId },
              select: { email: true, name: true },
            });
            userEmail = b?.email ?? null;
            userName = b?.name ?? null;
          }
        } catch {
          // ignore — user peut avoir été supprimé entre-temps
        }

        // Construit l'URL utilisable directement par l'admin (copie/colle).
        const origin =
          req.headers.get("origin") ?? "https://carlowonboarding.vercel.app";
        let url = "";
        if (t.type === "RESET_PASSWORD") {
          url = `${origin}/reset-password/${t.token}?type=${t.userType}`;
        } else if (t.type === "VERIFY_EMAIL") {
          url = `${origin}/verify-email?token=${t.token}`;
        }

        return {
          id: t.id,
          type: t.type,
          userType: t.userType,
          userEmail,
          userName,
          createdAt: t.createdAt,
          expiresAt: t.expiresAt,
          minutesLeft: Math.max(
            0,
            Math.round((t.expiresAt.getTime() - Date.now()) / 60000)
          ),
          url,
        };
      })
    );

    return NextResponse.json({ success: true, tokens: enriched });
  } catch (error) {
    console.error("[api/admin/tokens] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
