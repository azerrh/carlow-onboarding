import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        photos: { where: { primary: true }, take: 1 },
        catalog: { include: { vendor: true } },
      },
    });

    if (!product || !product.active) {
      return NextResponse.json({ error: "Produit non trouve" }, { status: 404 });
    }

    const related = await prisma.product.findMany({
      where: {
        active: true,
        catalogId: product.catalogId,
        id: { not: id },
      },
      include: {
        photos: { where: { primary: true }, take: 1 },
      },
      take: 4,
    });

    return NextResponse.json({ success: true, product, related });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
