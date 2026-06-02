import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdf } from "@/lib/invoice";

/**
 * Téléchargement de la facture PDF côté vendeur.
 *
 * GET /api/vendor/orders/[id]/invoice?vendorId=xxx
 *
 * Différences avec /api/buyer/orders/[id]/invoice :
 *  - On filtre les lignes : seules celles appartenant au vendeur apparaissent
 *  - On recalcule le total à partir des lignes du vendeur uniquement
 *  - Le PDF inclut les infos vendeur (variant="vendor")
 *  - Sécurité : on vérifie que la commande contient au moins une ligne du vendeur
 */

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") ?? searchParams.get("id");

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId requis" }, { status: 400 });
    }

    // Récupère la commande + uniquement les lignes du vendeur
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: { name: true, email: true, address: true, phone: true },
        },
        lines: {
          where: { product: { catalog: { vendorId } } },
          include: {
            product: { select: { name: true, reference: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }
    if (order.lines.length === 0) {
      // Aucune ligne du vendeur → soit la commande n'existe pas pour lui, soit
      // mauvais vendorId. On masque pour ne pas leaker l'existence de la commande.
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Récupère les infos du vendeur
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        name: true,
        companyName: true,
        address: true,
        vatNumber: true,
        siret: true,
      },
    });

    // Recalcule le total à partir des lignes du vendeur uniquement
    const vendorTotalCents = order.lines.reduce(
      (sum, l) => sum + l.unitPriceCents * l.quantity,
      0
    );

    const pdfBytes = await generateInvoicePdf({
      variant: "vendor",
      orderId: order.id,
      orderedAt: order.orderedAt,
      buyer: order.buyer,
      vendor,
      totalCents: vendorTotalCents,
      lines: order.lines.map((l) => ({
        productName: l.product.name,
        reference: l.product.reference,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
      })),
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Carlow-Facture-Vendeur-${order.id.slice(0, 8)}.pdf"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[api/vendor/orders/[id]/invoice] error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la facture" },
      { status: 500 }
    );
  }
}
