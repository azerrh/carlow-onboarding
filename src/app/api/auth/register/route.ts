import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit faire au moins 8 caractères" },
        { status: 400 }
      );
    }

    const existing = await prisma.vendor.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email deja utilise" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const vendor = await prisma.vendor.create({
      data: { name, email, password: hashedPassword, status: "pending", onboardingStep: 1 },
    });

    await sendWelcomeEmail(vendor.name, vendor.email);

    return NextResponse.json({ success: true, vendorId: vendor.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}