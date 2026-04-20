import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Accepte les deux noms de paramètres pour compatibilité
    const id = searchParams.get("id") ?? searchParams.get("vendorId");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        onboardingStep: true,
        companyName: true,
        siret: true,
        vatNumber: true,
        vatValid: true,
        legalForm: true,
        address: true,
        incoterms: true,
        createdAt: true,
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendeur non trouve" }, { status: 404 });
    }

    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}