import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Export CSV des commandes d'un vendeur.
 *
 * GET /api/vendor/orders/export?id=<vendorId>&status=<ALL|EN_COURS|LIVREE|ANNULEE>
 *
 * Retourne un fichier CSV téléchargeable directement dans le navigateur.
 * Encodage UTF-8 + BOM pour compatibilité Excel Windows.
 *
 * Colonnes :
 *   N° commande | Date | Acheteur | Email | Produit | Référence
 *   Catégorie | Quantité | Prix unitaire (€) | Sous-total (€)
 *   Statut | Transporteur | N° de suivi | Livraison estimée
 */

export const runtime = "nodejs";

const SEP = ";";
const BOM = "﻿"; // BOM UTF-8 — nécessaire pour qu'Excel Windows détecte l'encodage

const STATUS_LABELS: Record<string, string> = {
  EN_COURS: "En cours",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
};

function esc(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(SEP) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
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

function formatDateOnly(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

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
            trackingNumber: true,
            carrier: true,
            estimatedDelivery: true,
            buyer: { select: { name: true, email: true } },
          },
        },
      },
    });

    // --- Construction du CSV ---
    const headers = [
      "N° commande",
      "Date commande",
      "Acheteur",
      "Email acheteur",
      "Produit",
      "Référence",
      "Catégorie",
      "Quantité",
      "Prix unitaire (€)",
      "Sous-total (€)",
      "Statut",
      "Transporteur",
      "N° de suivi",
      "Livraison estimée",
    ];

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
          esc(ol.quantity),
          esc(formatEur(ol.unitPriceCents)),
          esc(formatEur(ol.unitPriceCents * ol.quantity)),
          esc(STATUS_LABELS[ol.order.status] ?? ol.order.status),
          esc(ol.order.carrier),
          esc(ol.order.trackingNumber),
          esc(ol.order.estimatedDelivery ? formatDateOnly(ol.order.estimatedDelivery) : ""),
        ].join(SEP)
      ),
    ];

    if (orderLines.length === 0) {
      rows.push(
        [esc("(aucune commande pour ce filtre)"), ...Array(13).fill("")].join(SEP)
      );
    }

    const csv = rows.join("\r\n");

    const now = new Date();
    const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const vendorSlug = (vendor.companyName ?? vendor.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 24);
    const filename = `carlow-commandes-${vendorSlug}-${dateTag}.csv`;

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
