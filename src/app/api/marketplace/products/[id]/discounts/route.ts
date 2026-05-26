import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/marketplace/products/[id]/discounts
 *
 * Retourne les paliers de remise volume d'un produit (public, pas d'auth).
 * Utilisé sur la fiche produit marketplace et dans le panier.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const discounts = await prisma.volumeDiscount.findMany({
      where: { productId: id },
      orderBy: { minQty: "asc" },
      select: { id: true, minQty: true, discountPct: true },
    });

    return NextResponse.json({ success: true, discounts });
  } catch (err) {
    console.error("[api/marketplace/products/[id]/discounts GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
