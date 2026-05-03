import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

/**
 * Connexion acheteur. Renvoie un buyerId que le client stocke en
 * localStorage (`buyerId`) — symétrique au flux vendor.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const buyer = await prisma.buyer.findUnique({
      where: { email: normalizedEmail },
    });

    const passwordMatch = await verifyPassword(password, buyer?.password);

    if (!buyer || !passwordMatch) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      buyerId: buyer.id,
      name: buyer.name,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
