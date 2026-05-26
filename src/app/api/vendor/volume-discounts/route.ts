import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET  /api/vendor/volume-discounts?productId=<id>&vendorId=<id>
 *   → liste les paliers de remise d'un produit
 *
 * PUT  /api/vendor/volume-discounts
 *   body: { productId, vendorId, discounts: [{minQty, discountPct}] }
 *   → remplace TOUS les paliers d'un produit (upsert atomique)
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const vendorId = searchParams.get("vendorId") ?? searchParams.get("id");

  if (!productId || !vendorId) {
    return NextResponse.json({ error: "productId et vendorId requis" }, { status: 400 });
  }

  try {
    // Vérifier que le produit appartient au vendeur
    const product = await prisma.product.findFirst({
      where: { id: productId, catalog: { vendorId } },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    const discounts = await prisma.volumeDiscount.findMany({
      where: { productId },
      orderBy: { minQty: "asc" },
    });

    return NextResponse.json({ success: true, discounts });
  } catch (err) {
    console.error("[api/vendor/volume-discounts GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, vendorId, discounts } = body as {
      productId: string;
      vendorId: string;
      discounts: { minQty: number; discountPct: number }[];
    };

    if (!productId || !vendorId) {
      return NextResponse.json({ error: "productId et vendorId requis" }, { status: 400 });
    }

    // Vérifier propriété
    const product = await prisma.product.findFirst({
      where: { id: productId, catalog: { vendorId } },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    // Validation des paliers
    const tiers = (discounts ?? [])
      .filter((d) => d.minQty > 0 && d.discountPct > 0 && d.discountPct < 100)
      .map((d) => ({ minQty: Math.round(d.minQty), discountPct: Number(d.discountPct) }))
      .sort((a, b) => a.minQty - b.minQty);

    // Remplacer atomiquement
    await prisma.$transaction([
      prisma.volumeDiscount.deleteMany({ where: { productId } }),
      ...(tiers.length > 0
        ? [prisma.volumeDiscount.createMany({
            data: tiers.map((t) => ({ productId, minQty: t.minQty, discountPct: t.discountPct })),
          })]
        : []),
    ]);

    const saved = await prisma.volumeDiscount.findMany({
      where: { productId },
      orderBy: { minQty: "asc" },
    });

    return NextResponse.json({ success: true, discounts: saved });
  } catch (err) {
    console.error("[api/vendor/volume-discounts PUT]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
