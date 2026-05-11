import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Export RGPD — droit à la portabilité (art. 20 RGPD).
 *
 * Renvoie un JSON contenant TOUTES les données personnelles de
 * l'acheteur identifié par le buyerId fourni :
 *  - Profil (sans le hash de mot de passe — interdit par l'art. 32 RGPD)
 *  - Commandes + lignes
 *  - Favoris
 *  - Avis publiés
 *  - Notifications
 *  - Souscriptions push
 *
 * Auth : on s'appuie sur le buyerId en localStorage (cohérent avec le
 * reste de l'app). En prod stricte, à renforcer avec un cookie signé.
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
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        phone: true,
        address: true,
        createdAt: true,
        orders: {
          orderBy: { orderedAt: "desc" },
          include: {
            lines: {
              include: {
                product: { select: { name: true, reference: true } },
              },
            },
          },
        },
        favorites: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        reviews: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        notifications: {
          orderBy: { sentAt: "desc" },
          take: 100,
        },
      },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    const pushSubs = await prisma.pushSubscription.findMany({
      where: { buyerId },
      select: { endpoint: true, userAgent: true, createdAt: true },
    });

    const exportPayload = {
      meta: {
        generatedAt: new Date().toISOString(),
        format: "JSON",
        rgpdArticle: "Article 20 RGPD — droit à la portabilité",
        notice:
          "Ce fichier contient l'ensemble des données personnelles que Carlow détient sur vous. Le hash de votre mot de passe est volontairement exclu (article 32 RGPD).",
      },
      profile: {
        id: buyer.id,
        name: buyer.name,
        email: buyer.email,
        emailVerifiedAt: buyer.emailVerifiedAt,
        phone: buyer.phone,
        address: buyer.address,
        accountCreatedAt: buyer.createdAt,
      },
      orders: buyer.orders.map((o) => ({
        id: o.id,
        status: o.status,
        totalCents: o.totalCents,
        totalEUR: (o.totalCents / 100).toFixed(2),
        orderedAt: o.orderedAt,
        updatedAt: o.updatedAt,
        stripeSessionId: o.stripeSessionId,
        lines: o.lines.map((l) => ({
          productName: l.product.name,
          productReference: l.product.reference,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
        })),
      })),
      favorites: buyer.favorites.map((f) => ({
        productId: f.product.id,
        productName: f.product.name,
        addedAt: f.createdAt,
      })),
      reviews: buyer.reviews.map((r) => ({
        productId: r.product.id,
        productName: r.product.name,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      notifications: buyer.notifications.map((n) => ({
        content: n.content,
        sentAt: n.sentAt,
        readAt: n.readAt,
      })),
      pushSubscriptions: pushSubs,
    };

    const filename = `carlow-export-${buyer.id.slice(0, 8)}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/buyer/me/export] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
