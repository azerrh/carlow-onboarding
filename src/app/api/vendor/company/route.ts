import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const { vendorId, company, siret, vat, legal, address } = await req.json();

    if (!vendorId) {
      return NextResponse.json({ error: "Vendeur non identifie" }, { status: 400 });
    }

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        companyName: company,
        siret: siret,
        vatNumber: vat,
        legalForm: legal,
        address: address,
        onboardingStep: 3,
      },
    });

    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}