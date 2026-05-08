import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liste les commandes contenant au moins un produit du vendeur.
 *
 * ⚠️ Sécurité : on ne renvoie QUE les lignes appartenant au vendeur (jamais
 * les autres lignes d'une même commande appartenant à d'autres vendeurs).
 * On recalcule un sous-total "vendor-side" pour cette commande à partir
 * uniquement des lignes du vendeur, plutôt que d'exposer le `totalCents`
 * global de la commande qui peut concerner plusieurs vendeurs.
 *
 * Filtres (query params) :
 *  - id (vendorId, requis)
 *  - status: EN_COURS | LIVREE | ANNULEE (optionnel)
 *  - search: substring sur nom acheteur OU nom produit (optionnel)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("id") ?? searchParams.get("vendorId");
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";

    if (!vendorId) {
      return NextResponse.json({ error: "ID vendeur manquant" }, { status: 400 });
    }

    // Vérification d'existence du vendeur (évite de leaker des données si l'ID
    // est invalide — on retourne 404 plutôt qu'une liste vide).
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: {
        // La commande contient au moins une ligne d'un produit du vendeur.
        lines: {
          some: { product: { catalog: { vendorId } } },
        },
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { orderedAt: "desc" },
      take: 100,
      include: {
        buyer: { select: { name: true, email: true } },
        // ⚠️ on ne retourne QUE les lignes du vendeur, pas toutes.
        lines: {
          where: { product: { catalog: { vendorId } } },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                reference: true,
                photos: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    });

    // Filtre full-text en mémoire (à remplacer par un index Postgres si la
    // table grossit ; pour l'instant on cap à 100 commandes max).
    const enriched = orders
      .map((order) => {
        const vendorSubtotalCents = order.lines.reduce(
          (sum, l) => sum + l.unitPriceCents * l.quantity,
          0
        );
        const itemCount = order.lines.reduce((sum, l) => sum + l.quantity, 0);
        return {
          id: order.id,
          status: order.status,
          orderedAt: order.orderedAt,
          buyer: {
            name: order.buyer?.name ?? "—",
            email: order.buyer?.email ?? "",
          },
          // Total côté vendeur uniquement (pas le total global Stripe).
          vendorSubtotalCents,
          itemCount,
          lines: order.lines.map((l) => ({
            id: l.id,
            productId: l.product.id,
            productName: l.product.name,
            reference: l.product.reference,
            imageUrl: l.product.photos[0]?.url ?? null,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
            subtotalCents: l.unitPriceCents * l.quantity,
          })),
        };
      })
      .filter((o) => {
        if (!search) return true;
        const buyerHit = o.buyer.name.toLowerCase().includes(search);
        const productHit = o.lines.some((l) =>
          l.productName.toLowerCase().includes(search)
        );
        return buyerHit || productHit;
      });

    return NextResponse.json({ success: true, orders: enriched });
  } catch (error) {
    console.error("[api/vendor/orders] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
