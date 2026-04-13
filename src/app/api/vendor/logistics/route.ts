import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const { vendorId, address, days, weight, incoterms } = await req.json();

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendeur non identifie" },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        address,
        incoterms,
        onboardingStep: 6,
        status: "submitted",
      },
    });

    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}