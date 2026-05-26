import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Avis sur les produits.
 *
 * - GET ?productId=xxx              → liste publique des avis d'un produit
 *                                     + moyenne + nombre d'avis
 * - POST { buyerId, productId,      → upsert (un acheteur = un avis par
 *          rating, comment }          produit, modifiable). On vérifie au
 *                                     passage que l'acheteur a bien commandé
 *                                     ce produit (anti-spam basique).
 *
 * Règles :
 *  - rating ∈ [1, 5] entier
 *  - comment optionnel, max 1000 chars
 *  - Pas de modération a priori — visible immédiatement. Pour la prod,
 *    ajouter un champ `status` (PENDING/APPROVED/REJECTED) et filtrer ici.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const buyerId = searchParams.get("buyerId"); // optionnel : récupérer "mon avis"

    if (!productId) {
      return NextResponse.json(
        { error: "productId requis" },
        { status: 400 }
      );
    }

    const [reviews, agg, myReview] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          buyer: { select: { name: true } },
        },
      }),
      prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      buyerId
        ? prisma.review.findUnique({
            where: { buyerId_productId: { buyerId, productId } },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        // On expose juste le prénom/nom pour l'affichage public, jamais
        // l'email ou un autre identifiant.
        author: r.buyer?.name ?? "Acheteur",
      })),
      stats: {
        average: agg._avg.rating ?? 0,
        count: agg._count._all,
      },
      myReview,
    });
  } catch (error) {
    console.error("[api/marketplace/reviews] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Supprime l'avis de l'acheteur sur un produit donné.
 *
 *  DELETE /api/marketplace/reviews?buyerId=...&productId=...
 *
 * On vérifie que l'avis appartient bien au buyerId fourni avant de supprimer
 * (sinon n'importe qui pourrait effacer l'avis d'un autre acheteur).
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId");
    const productId = searchParams.get("productId");
    const reviewId = searchParams.get("id");

    if (!buyerId) {
      return NextResponse.json({ error: "buyerId requis" }, { status: 400 });
    }

    if (reviewId) {
      // Suppression par ID — on vérifie l'appartenance
      const review = await prisma.review.findFirst({
        where: { id: reviewId, buyerId },
        select: { id: true },
      });
      if (!review) {
        return NextResponse.json(
          { error: "Avis introuvable ou accès refusé" },
          { status: 404 }
        );
      }
      await prisma.review.delete({ where: { id: reviewId } });
      return NextResponse.json({ success: true });
    }

    if (!productId) {
      return NextResponse.json(
        { error: "productId ou id requis" },
        { status: 400 }
      );
    }

    // Suppression par (buyerId, productId)
    const review = await prisma.review.findUnique({
      where: { buyerId_productId: { buyerId, productId } },
      select: { id: true },
    });
    if (!review) {
      return NextResponse.json(
        { error: "Aucun avis à supprimer" },
        { status: 404 }
      );
    }
    await prisma.review.delete({ where: { id: review.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/marketplace/reviews] DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buyerId, productId, rating, comment } = body as {
      buyerId?: string;
      productId?: string;
      rating?: number;
      comment?: string | null;
    };

    if (!buyerId || !productId) {
      return NextResponse.json(
        { error: "buyerId et productId requis" },
        { status: 400 }
      );
    }

    const ratingInt = Math.round(Number(rating));
    if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return NextResponse.json(
        { error: "Note invalide (1 à 5 étoiles)" },
        { status: 400 }
      );
    }

    const cleanComment =
      typeof comment === "string" ? comment.trim().slice(0, 1000) : null;

    // Vérifie que l'acheteur a bien commandé ce produit dans une commande
    // EN_COURS ou LIVREE. Anti-spam basique : pas d'avis sans achat.
    const hasPurchased = await prisma.orderLine.findFirst({
      where: {
        productId,
        order: {
          buyerId,
          status: { in: ["EN_COURS", "LIVREE"] },
        },
      },
      select: { id: true },
    });
    if (!hasPurchased) {
      return NextResponse.json(
        {
          error:
            "Vous devez avoir commandé ce produit pour laisser un avis.",
        },
        { status: 403 }
      );
    }

    // Upsert : si l'avis existe on le met à jour, sinon on le crée.
    const review = await prisma.review.upsert({
      where: { buyerId_productId: { buyerId, productId } },
      create: {
        buyerId,
        productId,
        rating: ratingInt,
        comment: cleanComment,
      },
      update: {
        rating: ratingInt,
        comment: cleanComment,
      },
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
      },
    });
  } catch (error) {
    console.error("[api/marketplace/reviews] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
