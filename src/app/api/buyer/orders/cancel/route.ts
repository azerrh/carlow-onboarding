import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, buyerId } = body;

    if (!orderId || !buyerId) {
      return NextResponse.json(
        { error: "orderId et buyerId requis" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Commande non trouvee" },
        { status: 404 }
      );
    }

    if (order.status !== "EN_COURS") {
      return NextResponse.json(
        { error: "Seules les commandes en cours peuvent etre annulees" },
        { status: 400 }
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "ANNULEE" },
    });

    await prisma.notification.create({
      data: {
        buyerId,
        content: `Votre commande #${orderId.slice(0, 8)} a ete annulee.`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
