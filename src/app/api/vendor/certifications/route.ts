import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { vendorId, certType, filename, category } = await req.json();

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendeur non identifie" },
        { status: 400 }
      );
    }

    const certification = await prisma.certification.create({
      data: {
        vendorId,
        certType,
        filename,
        s3Key: `certifications/${vendorId}/${filename}`,
        category,
      },
    });

    await prisma.vendor.update({
      where: { id: vendorId },
      data: { onboardingStep: 5 },
    });

    return NextResponse.json({ success: true, certification });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}