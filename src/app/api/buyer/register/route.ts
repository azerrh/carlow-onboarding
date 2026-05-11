import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  isValidEmail,
  validatePasswordStrength,
} from "@/lib/auth";
import { createToken } from "@/lib/tokens";
import { sendVerifyEmailEmail } from "@/lib/email";
import { applyRateLimit } from "@/lib/rateLimit";

/**
 * Inscription acheteur (compte client de la marketplace).
 * Symétrique à /api/auth/register mais cible le modèle Buyer.
 */
export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, {
    bucket: "auth:register-buyer",
    limit: 5,
    windowSec: 900,
  });
  if (blocked) return blocked;

  try {
    const { name, email, password, phone, address } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nom, email et mot de passe requis" },
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

    const existing = await prisma.buyer.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email déjà utilisé" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const buyer = await prisma.buyer.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone ? String(phone).trim() : null,
        address: address ? String(address).trim() : null,
      },
      select: { id: true, name: true, email: true },
    });

    // Envoi du lien de vérification (best-effort, n'échoue jamais le register).
    try {
      const token = await createToken("VERIFY_EMAIL", "BUYER", buyer.id);
      const origin =
        req.headers.get("origin") ?? "https://carlowonboarding.vercel.app";
      const verifyUrl = `${origin}/verify-email?token=${token}`;
      await sendVerifyEmailEmail({
        name: buyer.name,
        email: buyer.email,
        verifyUrl,
      });
    } catch (verifyErr) {
      console.error("[register buyer] verify-email fail:", verifyErr);
    }

    return NextResponse.json({ success: true, buyerId: buyer.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
