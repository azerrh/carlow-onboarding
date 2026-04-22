import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDossierSoumisEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { vendorId } = await req.json();

    if (!vendorId) {
      return NextResponse.json({ error: "Vendeur non identifié" }, { status: 400 });
    }

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: "submitted",
        onboardingStep: 6,
      },
    });

    await sendDossierSoumisEmail(vendor.name, vendor.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
