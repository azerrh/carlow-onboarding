import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findValidToken, consumeToken, createToken } from "@/lib/tokens";
import { sendVerifyEmailEmail } from "@/lib/email";
import { applyRateLimit } from "@/lib/rateLimit";

/**
 * Vérification d'email.
 *
 * GET  ?token=xxx                         → consomme un token VERIFY_EMAIL
 *                                           et marque l'utilisateur vérifié
 * POST { audience, userId } (rate-limit)  → re-envoie un email de vérif
 *                                           (utilisé par "Renvoyer l'email")
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const record = await findValidToken(token, "VERIFY_EMAIL");
    if (!record) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré. Demandez un nouvel email." },
        { status: 400 }
      );
    }

    if (record.userType === "BUYER") {
      await prisma.buyer.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      });
    } else if (record.userType === "VENDOR") {
      await prisma.vendor.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      });
    } else {
      return NextResponse.json(
        { error: "Type utilisateur invalide" },
        { status: 400 }
      );
    }

    await consumeToken(record.id);
    return NextResponse.json({ success: true, audience: record.userType });
  } catch (error) {
    console.error("[api/auth/verify-email] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, {
    bucket: "auth:resend-verify",
    limit: 3,
    windowSec: 600, // 3 envois max par 10 min par IP
  });
  if (blocked) return blocked;

  try {
    const { audience, userId } = await req.json();
    if (
      (audience !== "BUYER" && audience !== "VENDOR") ||
      typeof userId !== "string"
    ) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const user =
      audience === "BUYER"
        ? await prisma.buyer.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, emailVerifiedAt: true },
          })
        : await prisma.vendor.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, emailVerifiedAt: true },
          });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { error: "Email déjà vérifié" },
        { status: 400 }
      );
    }

    const token = await createToken("VERIFY_EMAIL", audience, user.id);
    const origin =
      req.headers.get("origin") ?? "https://carlowonboarding.vercel.app";
    const verifyUrl = `${origin}/verify-email?token=${token}`;
    await sendVerifyEmailEmail({ name: user.name, email: user.email, verifyUrl });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/auth/verify-email] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
