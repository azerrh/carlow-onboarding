import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Lecture publique d'une commande à partir de son `stripeSessionId`.
 * Appelée par /checkout/success?session_id=cs_xxx pour afficher le récap
 * (montant, nombre d'articles, statut). Volontairement minimaliste — on ne
 * renvoie aucune donnée sensible (pas d'email, pas d'adresse).
 *
 * Note : le webhook peut mettre quelques secondes à créer la commande après
 * le retour de Stripe. Le client doit donc tolérer un 404 transitoire.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { error: "session_id invalide" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { stripeSessionId: sessionId },
      select: {
        id: true,
        status: true,
        totalCents: true,
        orderedAt: true,
        _count: { select: { lines: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Commande non trouvée (le webhook est peut-être en cours)." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        amountTotal: order.totalCents,
        itemCount: order._count.lines,
        orderedAt: order.orderedAt,
      },
    });
  } catch (error) {
    console.error("[checkout/session] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
