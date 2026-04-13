import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        onboardingStep: true,
        companyName: true,
        siret: true,
        vatNumber: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ success: true, vendors });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    const vendor = await prisma.vendor.update({
      where: { id },
      data: { status, activatedAt: status === "active" ? new Date() : undefined },
    });
    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}