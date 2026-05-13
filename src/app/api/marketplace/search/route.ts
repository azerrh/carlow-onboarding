import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Recherche instantanée pour l'autocomplete marketplace.
 *
 * - Insensible à la casse + match partial (Postgres ILIKE)
 * - Retourne max 8 produits + 3 vendeurs + 3 catégories matching
 * - Filtres stricts : produit actif, catalogue actif, vendeur actif
 *   (cohérent avec /api/marketplace/products)
 *
 * Performance : pour quelques milliers de produits, ILIKE + index sur
 * `name` est rapide. Au-delà, passer à pg_trgm / FTS (recherche full-text).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();

    if (q.length < 2) {
      return NextResponse.json({
        success: true,
        products: [],
        vendors: [],
        categories: [],
      });
    }

    const baseFilter = {
      active: true,
      catalog: { active: true, vendor: { status: "active" } },
    };

    const [products, vendors, categories] = await Promise.all([
      // Produits (top 8)
      prisma.product.findMany({
        where: {
          ...baseFilter,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          price: true,
          category: true,
          photos: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
          catalog: {
            select: { vendor: { select: { name: true, companyName: true } } },
          },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      // Vendeurs (top 3)
      prisma.vendor.findMany({
        where: {
          status: "active",
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { companyName: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, companyName: true },
        take: 3,
      }),
      // Catégories distinctes matching
      prisma.product.groupBy({
        by: ["category"],
        where: {
          ...baseFilter,
          category: { contains: q, mode: "insensitive", not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 3,
      }),
    ]);

    return NextResponse.json({
      success: true,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        imageUrl: p.photos[0]?.url ?? null,
        vendorName:
          p.catalog.vendor.companyName ?? p.catalog.vendor.name ?? "Vendeur",
      })),
      vendors: vendors.map((v) => ({
        id: v.id,
        name: v.companyName ?? v.name,
      })),
      categories: categories
        .map((c) => ({
          category: c.category!,
          count: c._count.id,
        }))
        .filter((c) => !!c.category),
    });
  } catch (error) {
    console.error("[api/marketplace/search] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
