import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liste de tous les avis publiés par un acheteur.
 *
 * GET /api/buyer/reviews?buyerId=...
 *
 * Renvoie également :
 *   - Les produits commandés par l'acheteur sur lesquels il N'A PAS encore
 *     laissé d'avis (pour proposer une CTA "Laisser un avis" dans l'UI).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId") ?? searchParams.get("id");
    if (!buyerId) {
      return NextResponse.json({ error: "buyerId requis" }, { status: 400 });
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      select: { id: true },
    });
    if (!buyer) {
      return NextResponse.json(
        { error: "Acheteur introuvable" },
        { status: 404 }
      );
    }

    // 1) Tous les avis publiés
    const reviews = await prisma.review.findMany({
      where: { buyerId },
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            photos: { orderBy: { order: "asc" }, take: 1 },
            catalog: {
              select: {
                vendor: { select: { name: true, companyName: true } },
              },
            },
          },
        },
      },
    });

    // 2) Produits commandés (EN_COURS ou LIVREE) sur lesquels il n'a PAS encore d'avis
    const purchased = await prisma.orderLine.findMany({
      where: {
        order: {
          buyerId,
          status: { in: ["EN_COURS", "LIVREE"] },
        },
      },
      select: {
        productId: true,
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            photos: { orderBy: { order: "asc" }, take: 1 },
            catalog: {
              select: {
                vendor: { select: { name: true, companyName: true } },
              },
            },
          },
        },
      },
    });

    const reviewedIds = new Set(reviews.map((r) => r.productId));
    const seenIds = new Set<string>();
    const pendingProducts = purchased
      .filter((line) => {
        if (reviewedIds.has(line.productId)) return false;
        if (seenIds.has(line.productId)) return false;
        seenIds.add(line.productId);
        return true;
      })
      .map((line) => ({
        id: line.product.id,
        name: line.product.name,
        category: line.product.category,
        imageUrl: line.product.photos[0]?.url ?? null,
        vendor:
          line.product.catalog.vendor.companyName ??
          line.product.catalog.vendor.name,
      }));

    return NextResponse.json({
      success: true,
      reviews: reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        productName: r.product.name,
        productCategory: r.product.category,
        productImageUrl: r.product.photos[0]?.url ?? null,
        vendor:
          r.product.catalog.vendor.companyName ??
          r.product.catalog.vendor.name,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      pendingProducts,
      stats: {
        totalReviews: reviews.length,
        averageGiven:
          reviews.length > 0
            ? Math.round(
                (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
              ) / 10
            : 0,
        pendingCount: pendingProducts.length,
      },
    });
  } catch (error) {
    console.error("[api/buyer/reviews] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
