import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const { vendorId, address, incoterms } = await req.json();

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendeur non identifie" },
        { status: 400 }
      );
    }

    // NOTE: `days` (délai de préparation) et `weight` (poids max palette) sont
    // affichés dans le formulaire mais ne sont PAS persistés faute de colonnes
    // dans le schéma Vendor. Ajouter `deliveryDays` / `maxWeight` au schéma si
    // on veut les stocker côté marketplace.

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        address,
        incoterms,
        onboardingStep: 6,
      },
    });

    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}