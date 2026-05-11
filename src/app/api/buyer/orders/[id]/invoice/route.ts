import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdf } from "@/lib/invoice";

/**
 * Téléchargement de la facture PDF d'une commande.
 *
 * ⚠️ Auth : on demande le buyerId en query param et on vérifie qu'il
 * possède bien cette commande. Pas idéal (l'ID pourrait être deviné),
 * mais cohérent avec le pattern actuel /api/buyer/* qui s'appuie sur
 * localStorage côté client. À durcir avec un cookie signé en prod.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId") ?? searchParams.get("id");

    if (!buyerId) {
      return NextResponse.json({ error: "buyerId requis" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, address: true, phone: true },
        },
        lines: {
          include: {
            product: { select: { name: true, reference: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }
    if (order.buyerId !== buyerId) {
      // On ne distingue pas "introuvable" de "pas le bon acheteur" pour éviter
      // de leaker l'existence d'une commande d'un autre utilisateur.
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const pdfBytes = await generateInvoicePdf({
      orderId: order.id,
      orderedAt: order.orderedAt,
      buyer: order.buyer,
      totalCents: order.totalCents,
      lines: order.lines.map((l) => ({
        productName: l.product.name,
        reference: l.product.reference,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
      })),
    });

    // NextResponse veut un BodyInit ; Uint8Array<ArrayBufferLike> ne match pas
    // dans certaines configs TS strictes. On passe par Buffer.from qui
    // implémente proprement l'interface attendue côté Node runtime.
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Carlow-Facture-${order.id.slice(0, 8)}.pdf"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[api/buyer/orders/[id]/invoice] error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la facture" },
      { status: 500 }
    );
  }
}
