import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { vendorId, type, filename } = await req.json();

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendeur non identifie" },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        vendorId,
        type,
        filename,
        s3Key: `documents/${vendorId}/${filename}`,
        status: "uploaded",
      },
    });

    await prisma.vendor.update({
      where: { id: vendorId },
      data: { onboardingStep: 4 },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}