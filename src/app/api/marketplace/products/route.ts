import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liste publique des produits exposés sur la marketplace.
 *
 * ⚠️ Sécurité : cette route est ouverte sans authentification, donc on ne peut
 * PAS faire confiance aux query params pour relâcher les filtres. On force
 * systématiquement :
 *   - product.active = true
 *   - catalog.active = true
 *   - vendor.status = "active"
 * Les query params permettent uniquement de RESTREINDRE davantage la liste
 * (filtre par catégorie, recherche full-text, filtre par vendeur).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const vendorId = searchParams.get("vendorId");

    // Filtres FORCÉS — non négociables côté client.
    const where: Record<string, unknown> = {
      active: true,
      catalog: {
        active: true,
        vendor: { status: "active" },
        ...(vendorId ? { vendorId } : {}),
      },
    };
    if (category) where.category = category;

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        catalog: {
          select: {
            id: true,
            name: true,
            vendor: { select: { id: true, name: true, companyName: true } },
          },
        },
        photos: { orderBy: { order: "asc" }, take: 1 },
        reviews: { select: { rating: true } }, // pour calculer la note moyenne
      },
    });

    // Recherche full-text en mémoire (à remplacer par un index Postgres
    // si la table dépasse quelques milliers de produits).
    const filtered = search
      ? products.filter((p) => {
          const q = search.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q) ||
            (p.reference ?? "").toLowerCase().includes(q) ||
            (p.category ?? "").toLowerCase().includes(q)
          );
        })
      : products;

    const categories = Array.from(
      new Set(
        products
          .map((p) => p.category)
          .filter((c): c is string => c !== null && c !== "")
      )
    );

    return NextResponse.json({
      success: true,
      products: filtered.map((p) => {
        const ratingCount = p.reviews.length;
        const ratingAvg =
          ratingCount > 0
            ? p.reviews.reduce((s, r) => s + r.rating, 0) / ratingCount
            : 0;
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          reference: p.reference,
          stock: p.stock,
          active: p.active,
          imageUrl: p.photos[0]?.url ?? null,
          vendor: {
            id: p.catalog.vendor.id,
            name: p.catalog.vendor.companyName ?? p.catalog.vendor.name,
          },
          catalog: {
            id: p.catalog.id,
            name: p.catalog.name,
          },
          ratingAvg: Math.round(ratingAvg * 10) / 10, // ex: 4.3
          ratingCount,
        };
      }),
      categories,
    });
  } catch (error) {
    console.error("[marketplace/products] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
