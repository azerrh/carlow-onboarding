import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

/**
 * Messagerie buyer ↔ vendor pour une commande donnée.
 *
 * Routes :
 *  - GET  /api/orders/[id]/messages?as=buyer&userId=xxx
 *  - GET  /api/orders/[id]/messages?as=vendor&userId=xxx
 *  - POST /api/orders/[id]/messages  { authorType, authorId, content }
 *  - PUT  /api/orders/[id]/messages  { as, userId } → marque comme lus
 *
 * Auth : on vérifie que l'utilisateur a bien le droit d'accéder à cette
 * commande :
 *  - "buyer"  → l'order.buyerId doit matcher
 *  - "vendor" → la commande doit contenir au moins un produit d'un
 *               catalogue de ce vendeur
 *
 * Si la vérification échoue → 403 (jamais de leak inter-utilisateurs).
 */

type Actor = "buyer" | "vendor";

async function canAccess(
  orderId: string,
  actor: Actor,
  userId: string
): Promise<boolean> {
  if (actor === "buyer") {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { buyerId: true },
    });
    return !!order && order.buyerId === userId;
  }
  // vendor : doit avoir au moins une ligne de cette commande
  const line = await prisma.orderLine.findFirst({
    where: {
      orderId,
      product: { catalog: { vendorId: userId } },
    },
    select: { id: true },
  });
  return !!line;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { searchParams } = new URL(req.url);
    const as = (searchParams.get("as") ?? "buyer") as Actor;
    const userId = searchParams.get("userId");

    if (!userId || (as !== "buyer" && as !== "vendor")) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }

    const allowed = await canAccess(orderId, as, userId);
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });

    // Compteur de messages non lus de l'autre partie pour le badge.
    const otherType = as === "buyer" ? "VENDOR" : "BUYER";
    const unreadCount = messages.filter(
      (m) => m.authorType === otherType && m.readAt === null
    ).length;

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({
        id: m.id,
        authorType: m.authorType,
        authorName: m.authorName,
        content: m.content,
        createdAt: m.createdAt,
        readAt: m.readAt,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("[api/orders/[id]/messages] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    const { authorType, authorId, content } = body as {
      authorType?: string;
      authorId?: string;
      content?: string;
    };

    if (
      !authorType ||
      (authorType !== "BUYER" && authorType !== "VENDOR") ||
      !authorId ||
      !content
    ) {
      return NextResponse.json(
        { error: "Champs requis manquants ou invalides" },
        { status: 400 }
      );
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }
    if (trimmed.length > 5000) {
      return NextResponse.json(
        { error: "Message trop long (max 5000 caractères)" },
        { status: 400 }
      );
    }

    const actor: Actor = authorType === "BUYER" ? "buyer" : "vendor";
    const allowed = await canAccess(orderId, actor, authorId);
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupère le nom de l'auteur pour snapshot (utile si compte supprimé
    // plus tard).
    let authorName = "Utilisateur";
    if (authorType === "BUYER") {
      const b = await prisma.buyer.findUnique({
        where: { id: authorId },
        select: { name: true },
      });
      if (b) authorName = b.name;
    } else {
      const v = await prisma.vendor.findUnique({
        where: { id: authorId },
        select: { name: true, companyName: true },
      });
      if (v) authorName = v.companyName ?? v.name;
    }

    const message = await prisma.message.create({
      data: {
        orderId,
        authorType,
        authorId,
        authorName,
        content: trimmed,
      },
    });

    // Notification in-app à l'autre partie + push web.
    try {
      if (authorType === "BUYER") {
        // Notifie tous les vendeurs concernés par cette commande.
        const vendors = await prisma.orderLine.findMany({
          where: { orderId },
          select: { product: { select: { catalog: { select: { vendorId: true } } } } },
        });
        const vendorIds = new Set(
          vendors.map((v) => v.product.catalog.vendorId)
        );
        for (const vid of vendorIds) {
          await prisma.notification.create({
            data: {
              vendorId: vid,
              content: `Nouveau message de ${authorName} sur la commande #${orderId.slice(0, 8)}`,
            },
          });
          await sendPushToUser(
            { vendorId: vid },
            {
              title: "Nouveau message Carlow",
              body: `${authorName} : ${trimmed.slice(0, 100)}`,
              url: "/dashboard/commandes",
              tag: `msg-${orderId}`,
            }
          );
        }
      } else {
        // Notifie l'acheteur.
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { buyerId: true },
        });
        if (order) {
          await prisma.notification.create({
            data: {
              buyerId: order.buyerId,
              content: `Nouveau message de ${authorName} sur votre commande #${orderId.slice(0, 8)}`,
            },
          });
          await sendPushToUser(
            { buyerId: order.buyerId },
            {
              title: "Nouveau message Carlow",
              body: `${authorName} : ${trimmed.slice(0, 100)}`,
              url: `/buyer/orders/${orderId}`,
              tag: `msg-${orderId}`,
            }
          );
        }
      }
    } catch (notifErr) {
      console.error("[messages] notif fail:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        authorType: message.authorType,
        authorName: message.authorName,
        content: message.content,
        createdAt: message.createdAt,
        readAt: message.readAt,
      },
    });
  } catch (error) {
    console.error("[api/orders/[id]/messages] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Marque tous les messages "de l'autre partie" comme lus.
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    const { as, userId } = body as { as?: Actor; userId?: string };
    if (!as || !userId || (as !== "buyer" && as !== "vendor")) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }
    const allowed = await canAccess(orderId, as, userId);
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const otherType = as === "buyer" ? "VENDOR" : "BUYER";
    await prisma.message.updateMany({
      where: { orderId, authorType: otherType, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/orders/[id]/messages] PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
