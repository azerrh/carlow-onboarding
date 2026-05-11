import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findValidToken, consumeToken } from "@/lib/tokens";
import {
  hashPassword,
  validatePasswordStrength,
} from "@/lib/auth";
import { applyRateLimit } from "@/lib/rateLimit";

/**
 * Réinitialisation effective du mot de passe.
 *
 * Flow :
 *  1. Le client soumet { token, newPassword }
 *  2. On vérifie que le token est valide (existe, non expiré, non utilisé)
 *  3. On valide la robustesse du nouveau mot de passe
 *  4. On hash + update le user correspondant
 *  5. On consume le token (marqué `usedAt`) pour empêcher le rejeu
 *
 * Rate limit : 10 tentatives / heure / IP (anti-brute-force sur le token).
 */
export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, {
    bucket: "auth:reset",
    limit: 10,
    windowSec: 3600,
  });
  if (blocked) return blocked;

  try {
    const { token, newPassword } = await req.json();

    if (!token || typeof token !== "string" || !newPassword) {
      return NextResponse.json(
        { error: "Champs manquants" },
        { status: 400 }
      );
    }

    const strengthErr = validatePasswordStrength(newPassword);
    if (strengthErr) {
      return NextResponse.json({ error: strengthErr }, { status: 400 });
    }

    const record = await findValidToken(token, "RESET_PASSWORD");
    if (!record) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré. Demandez un nouveau lien." },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(newPassword);

    if (record.userType === "BUYER") {
      await prisma.buyer.update({
        where: { id: record.userId },
        data: { password: hashed },
      });
    } else if (record.userType === "VENDOR") {
      await prisma.vendor.update({
        where: { id: record.userId },
        data: { password: hashed },
      });
    } else {
      return NextResponse.json(
        { error: "Type utilisateur invalide" },
        { status: 400 }
      );
    }

    await consumeToken(record.id);

    return NextResponse.json({
      success: true,
      audience: record.userType,
      message: "Mot de passe mis à jour. Vous pouvez vous reconnecter.",
    });
  } catch (error) {
    console.error("[api/auth/reset-password] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
