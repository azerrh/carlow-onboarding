import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Export CSV des commandes d'un vendeur.
 *
 * GET /api/vendor/orders/export?id=<vendorId>&status=<ALL|EN_COURS|LIVREE|ANNULEE>
 *
 * Retourne un fichier CSV téléchargeable directement dans le navigateur.
 * Colonnes : N° commande, Date, Acheteur, Email, Produit, Référence, Qté, Prix unitaire HT, Sous-total HT, Statut.
 *
 * Note : "HT" dans le sens "prix stocké" — la TVA est gérée côté Stripe/comptabilité.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("id");
    const statusFilter = searchParams.get("status") ?? "ALL";

    if (!vendorId) {
      return NextResponse.json({ error: "ID vendeur manquant" }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { name: true, companyName: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
    }

    const orderLines = await prisma.orderLine.findMany({
      where: {
        product: { catalog: { vendorId } },
        ...(statusFilter !== "ALL"
          ? { order: { status: statusFilter } }
          : {}),
      },
      orderBy: { order: { orderedAt: "desc" } },
      include: {
        product: {
          select: { name: true, reference: true, category: true },
        },
        order: {
          select: {
            id: true,
            status: true,
            orderedAt: true,
            buyer: { select: { name: true, email: true } },
          },
        },
      },
    });

    // --- Construction CSV ---
    const BOM = "﻿"; // BOM UTF-8 pour Excel Windows
    const SEP = ";";

    const headers = [
      "N° commande",
      "Date",
      "Acheteur",
      "Email acheteur",
      "Produit",
      "Référence",
      "Catégorie",
      "Quantité",
      "Prix unitaire (€)",
      "Sous-total (€)",
      "Statut",
    ];

    const STATUS_LABELS: Record<string, string> = {
      EN_COURS: "En cours",
      LIVREE: "Livrée",
      ANNULEE: "Annulée",
    };

    function esc(v: string | null | undefined): string {
      if (!v) return "";
      // Si la valeur contient le séparateur, des guillemets ou un saut de ligne,
      // on l'encadre de guillemets doubles et on double les guillemets internes.
      const s = String(v);
      if (s.includes(SEP) || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }

    function formatDate(d: Date): string {
      return d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    function formatEur(cents: number): string {
      return (cents / 100).toFixed(2).replace(".", ",");
    }

    const rows: string[] = [
      BOM + headers.map(esc).join(SEP),
      ...orderLines.map((ol) =>
        [
          esc(ol.order.id.slice(0, 8).toUpperCase()),
          esc(formatDate(ol.order.orderedAt)),
          esc(ol.order.buyer?.name),
          esc(ol.order.buyer?.email),
          esc(ol.product.name),
          esc(ol.product.reference),
          esc(ol.product.category),
          esc(String(ol.quantity)),
          esc(formatEur(ol.unitPriceCents)),
          esc(formatEur(ol.unitPriceCents * ol.quantity)),
          esc(STATUS_LABELS[ol.order.status] ?? ol.order.status),
        ].join(SEP)
      ),
    ];

    const csv = rows.join("\r\n");
    const now = new Date();
    const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const filename = `carlow-commandes-${dateTag}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/vendor/orders/export] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
