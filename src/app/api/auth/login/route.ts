import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const vendor = await prisma.vendor.findUnique({
      where: { email },
    });

    const passwordMatch = vendor
      ? await bcrypt.compare(password, vendor.password)
      : false;

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