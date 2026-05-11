import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Fiche publique d'un vendeur : infos vitrine + catalogue + note moyenne
 * agrégée sur tous ses produits.
 *
 * ⚠️ Sécurité : on n'expose JAMAIS les infos sensibles (siret, vat, iban,
 * email, password, documents). Uniquement nom, raison sociale, descriptif
 * basique et catalogue produits actifs.
 *
 * Cohérent avec /api/marketplace/products : filtres stricts vendor.status =
 * "active" + catalog.active + product.active.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        companyName: true,
        legalForm: true,
        status: true,
        activatedAt: true,
        createdAt: true,
        catalogs: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            description: true,
            products: {
              where: { active: true },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                name: true,
                price: true,
                category: true,
                stock: true,
                reference: true,
                photos: {
                  orderBy: { order: "asc" },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });

    if (!vendor || vendor.status !== "active") {
      return NextResponse.json(
        { error: "Vendeur introuvable ou non actif" },
        { status: 404 }
      );
    }

    // On aplatit les produits de tous les catalogues actifs pour la vitrine.
    const products = vendor.catalogs.flatMap((c) =>
      c.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        stock: p.stock,
        reference: p.reference,
        imageUrl: p.photos[0]?.url ?? null,
        catalogName: c.name,
      }))
    );

    // Note moyenne agrégée sur tous les avis liés à un produit de ce vendeur.
    // On fait un raw aggregate plutôt qu'un loop pour rester performant.
    const reviewAgg = await prisma.review.aggregate({
      where: {
        product: {
          catalog: { vendorId: id },
        },
      },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const categories = Array.from(
      new Set(products.map((p) => p.category).filter((c): c is string => !!c))
    );

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.companyName ?? vendor.name,
        legalForm: vendor.legalForm,
        activatedAt: vendor.activatedAt,
        // Ancienneté plateforme — utile pour rassurer l'acheteur.
        memberSince: vendor.createdAt,
        productsCount: products.length,
        catalogsCount: vendor.catalogs.length,
        rating: {
          average: reviewAgg._avg.rating ?? 0,
          count: reviewAgg._count._all,
        },
      },
      products,
      categories,
    });
  } catch (error) {
    console.error("[api/marketplace/vendors/[id]] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
