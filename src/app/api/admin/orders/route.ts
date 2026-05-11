import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { sendOrderStatusChangedEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("statut");

    const orders = await prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { orderedAt: "desc" },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        _count: { select: { lines: true } },
      },
    });

    const stats = {
      total: orders.length,
      enCours: orders.filter((o) => o.status === "EN_COURS").length,
      livrees: orders.filter((o) => o.status === "LIVREE").length,
      annulees: orders.filter((o) => o.status === "ANNULEE").length,
    };

    return NextResponse.json({ success: true, orders, stats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "ID/statut manquants" }, { status: 400 });
    }

    // On lit l'ancien statut avant l'update pour notifier seulement
    // si le statut a réellement changé.
    const previous = await prisma.order.findUnique({
      where: { id },
      select: {
        status: true,
        buyer: { select: { name: true, email: true } },
      },
    });
    if (!previous) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    // Email + notification in-app si le statut change vraiment.
    if (previous.status !== status && previous.buyer) {
      try {
        await sendOrderStatusChangedEmail({
          buyerName: previous.buyer.name,
          buyerEmail: previous.buyer.email,
          orderId: id,
          newStatus: status,
        });
        // Notification in-app
        const buyer = await prisma.buyer.findUnique({
          where: { email: previous.buyer.email },
          select: { id: true },
        });
        if (buyer) {
          const label =
            status === "LIVREE"
              ? "livrée"
              : status === "ANNULEE"
                ? "annulée"
                : "en cours";
          await prisma.notification.create({
            data: {
              buyerId: buyer.id,
              content: `Votre commande #${id.slice(0, 8)} est désormais ${label}.`,
            },
          });
        }
      } catch (notifErr) {
        console.error("[admin/orders] échec notification statut:", notifErr);
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
