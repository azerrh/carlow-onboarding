import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // 10 tentatives par minute par IP — assez pour un usage normal mais
  // bloque les attaques brute-force basiques.
  const blocked = applyRateLimit(req, {
    bucket: "auth:login-vendor",
    limit: 10,
    windowSec: 60,
  });
  if (blocked) return blocked;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const vendor = await prisma.vendor.findUnique({
      where: { email: normalizedEmail },
    });

    // On effectue toujours un compare pour éviter le timing-attack qui révèle
    // si l'email existe ou non. `verifyPassword` retourne `false` si le hash
    // est null/undefined.
    const passwordMatch = await verifyPassword(password, vendor?.password);

    if (!vendor || !passwordMatch) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      vendorId: vendor.id,
      name: vendor.name,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
