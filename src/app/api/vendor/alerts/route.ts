import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/vendor/alerts?id=<vendorId>
 *
 * Retourne tous les produits du vendeur qui ont des alertes actives,
 * avec le nombre d'abonnés et les détails par produit.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("id") ?? searchParams.get("vendorId");

  if (!vendorId) {
    return NextResponse.json({ error: "ID vendeur requis" }, { status: 400 });
  }

  try {
    // Produits du vendeur qui ont au moins 1 alerte active
    const products = await prisma.product.findMany({
      where: {
        catalog: { vendorId },
        alerts: { some: { active: true } },
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        category: true,
        reference: true,
        photos: { select: { url: true }, orderBy: { primary: "desc" }, take: 1 },
        alerts: {
          where: { active: true },
          select: {
            id: true,
            buyerEmail: true,
            buyerName: true,
            priceAtSubscription: true,
            stockAtSubscription: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Total global des abonnés
    const totalSubscribers = products.reduce((sum, p) => sum + p.alerts.length, 0);

    return NextResponse.json({ success: true, products, totalSubscribers });
  } catch (err) {
    console.error("[api/vendor/alerts GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
