import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/tokens";
import { sendResetPasswordEmail } from "@/lib/email";
import { applyRateLimit } from "@/lib/rateLimit";
import { isValidEmail } from "@/lib/auth";

/**
 * Demande de réinitialisation de mot de passe.
 *
 * Sécurité — TIMING-SAFE :
 * On retourne TOUJOURS un 200 success peu importe que l'email existe ou
 * non. Cela évite le user enumeration (un attaquant ne peut pas savoir
 * quels emails ont un compte). Le travail réel (create token + send email)
 * n'est fait que si l'email existe.
 *
 * Rate limit : 5 tentatives / heure / IP (anti-flood email).
 */
export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, {
    bucket: "auth:forgot",
    limit: 5,
    windowSec: 3600,
  });
  if (blocked) return blocked;

  try {
    const { email, audience } = await req.json();

    if (
      !email ||
      typeof email !== "string" ||
      !isValidEmail(email) ||
      (audience !== "BUYER" && audience !== "VENDOR")
    ) {
      // Même en erreur de validation, on garde le ton "neutre".
      return NextResponse.json({ success: true });
    }

    const normalized = email.trim().toLowerCase();

    // Recherche dans la bonne table selon l'audience.
    const user =
      audience === "BUYER"
        ? await prisma.buyer.findUnique({
            where: { email: normalized },
            select: { id: true, name: true, email: true },
          })
        : await prisma.vendor.findUnique({
            where: { email: normalized },
            select: { id: true, name: true, email: true },
          });

    if (user) {
      const token = await createToken("RESET_PASSWORD", audience, user.id);
      const origin =
        req.headers.get("origin") ?? "https://carlowonboarding.vercel.app";
      const resetUrl = `${origin}/reset-password/${token}?type=${audience}`;

      // ⚠️ FALLBACK : on logge TOUJOURS le reset URL dans la console serveur
      // (visible dans les logs Vercel). Utile en démo / debug quand Resend
      // n'arrive pas à délivrer (limitation free tier, domaine non vérifié,
      // email en spam). L'admin peut aussi consulter /admin/tokens pour le
      // retrouver via l'UI.
      console.log(
        `[forgot-password] ✉ Reset URL pour ${user.email} (${audience}) : ${resetUrl}`
      );

      await sendResetPasswordEmail({
        name: user.name,
        email: user.email,
        resetUrl,
      });
    }

    // Réponse identique quel que soit le cas.
    return NextResponse.json({
      success: true,
      message:
        "Si un compte existe pour cette adresse, un email vient d'être envoyé.",
    });
  } catch (error) {
    console.error("[api/auth/forgot-password] error:", error);
    // On reste neutre même en erreur serveur.
    return NextResponse.json({ success: true });
  }
}
