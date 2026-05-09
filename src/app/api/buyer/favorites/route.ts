import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Wishlist (favoris) de l'acheteur connecté.
 *
 * Auth identique aux autres routes /api/buyer/* : `id`/`buyerId` en query
 * ou body. À durcir avec un cookie signé pour la prod.
 *
 * Endpoints :
 *  - GET  ?buyerId=xxx              → liste les produits favoris
 *  - POST { buyerId, productId }    → toggle favori (ajoute ou retire)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId") ?? searchParams.get("id");

    if (!buyerId) {
      return NextResponse.json({ error: "ID acheteur requis" }, { status: 400 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            catalog: {
              select: {
                vendor: { select: { id: true, name: true, companyName: true } },
              },
            },
            photos: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
          },
        },
      },
    });

    // Filtre côté serveur : on ne renvoie pas les produits inactifs ou
    // dont le vendeur a été désactivé (cohérent avec la marketplace).
    const visible = favorites.filter(
      (f) => f.product.active && f.product.catalog.vendor
    );

    return NextResponse.json({
      success: true,
      favorites: visible.map((f) => ({
        id: f.id,
        addedAt: f.createdAt,
        product: {
          id: f.product.id,
          name: f.product.name,
          price: f.product.price,
          stock: f.product.stock,
          category: f.product.category,
          imageUrl: f.product.photos[0]?.url ?? null,
          vendor: {
            id: f.product.catalog.vendor.id,
            name:
              f.product.catalog.vendor.companyName ??
              f.product.catalog.vendor.name,
          },
        },
      })),
      // Pour l'UI : jeu d'IDs pour vérifier rapidement si un produit est
      // favorité (évite N requêtes côté front).
      productIds: visible.map((f) => f.product.id),
    });
  } catch (error) {
    console.error("[api/buyer/favorites] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buyerId, productId } = body as {
      buyerId?: string;
      productId?: string;
    };

    if (!buyerId || !productId) {
      return NextResponse.json(
        { error: "buyerId et productId requis" },
        { status: 400 }
      );
    }

    // Vérifie l'existence du buyer et du produit pour éviter les
    // contraintes d'intégrité qui remonteraient comme erreurs 500.
    const [buyer, product] = await Promise.all([
      prisma.buyer.findUnique({ where: { id: buyerId }, select: { id: true } }),
      prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, active: true },
      }),
    ]);
    if (!buyer) {
      return NextResponse.json({ error: "Acheteur introuvable" }, { status: 404 });
    }
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }
    if (!product.active) {
      return NextResponse.json(
        { error: "Ce produit n'est plus disponible" },
        { status: 400 }
      );
    }

    // Toggle : si le favori existe déjà, on le supprime ; sinon on le crée.
    const existing = await prisma.favorite.findUnique({
      where: { buyerId_productId: { buyerId, productId } },
      select: { id: true },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, favorited: false });
    }

    await prisma.favorite.create({ data: { buyerId, productId } });
    return NextResponse.json({ success: true, favorited: true });
  } catch (error) {
    console.error("[api/buyer/favorites] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
