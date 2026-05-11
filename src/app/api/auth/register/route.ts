import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail, sendVerifyEmailEmail } from "@/lib/email";
import {
  hashPassword,
  isValidEmail,
  validatePasswordStrength,
} from "@/lib/auth";
import { createToken } from "@/lib/tokens";
import { applyRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, {
    bucket: "auth:register-vendor",
    limit: 5,
    windowSec: 900, // 5 inscriptions max par 15 min par IP
  });
  if (blocked) return blocked;

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await prisma.vendor.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email déjà utilisé" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const vendor = await prisma.vendor.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        status: "pending",
        onboardingStep: 1,
      },
    });

    // Email de bienvenue + email de vérification (best-effort, on ne
    // bloque pas l'inscription si Resend tombe).
    await sendWelcomeEmail(vendor.name, vendor.email);
    try {
      const token = await createToken("VERIFY_EMAIL", "VENDOR", vendor.id);
      const origin =
        req.headers.get("origin") ?? "https://carlowonboarding.vercel.app";
      const verifyUrl = `${origin}/verify-email?token=${token}`;
      await sendVerifyEmailEmail({
        name: vendor.name,
        email: vendor.email,
        verifyUrl,
      });
    } catch (verifyErr) {
      console.error("[register vendor] verify-email fail:", verifyErr);
    }

    return NextResponse.json({ success: true, vendorId: vendor.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
