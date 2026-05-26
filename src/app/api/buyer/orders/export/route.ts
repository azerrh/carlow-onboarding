import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Export CSV des commandes d'un acheteur.
 *
 * GET /api/buyer/orders/export?id=<buyerId>&status=<ALL|EN_COURS|LIVREE|ANNULEE>
 *
 * Retourne un fichier CSV téléchargeable (encodage UTF-8 + BOM pour Excel Windows).
 *
 * Colonnes :
 *   N° commande | Date | Produit | Référence | Vendeur | Catégorie
 *   Quantité | Prix unitaire (€) | Sous-total (€) | Total commande (€) | Statut
 */

export const runtime = "nodejs";

const STATUS_LABELS: Record<string, string> = {
  EN_COURS: "En cours",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
};

const SEP = ";";
const BOM = "﻿"; // BOM UTF-8 — nécessaire pour que Excel Windows détecte l'encodage

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

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("id") ?? searchParams.get("buyerId");
    const statusFilter = searchParams.get("status") ?? "ALL";

    if (!buyerId) {
      return NextResponse.json({ error: "ID acheteur manquant" }, { status: 400 });
    }

    // Vérifie que le compte existe
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      select: { id: true, name: true, email: true },
    });
    if (!buyer) {
      return NextResponse.json({ error: "Acheteur introuvable" }, { status: 404 });
    }

    // Récupère les commandes avec leurs lignes
    const orders = await prisma.order.findMany({
      where: {
        buyerId,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      },
      orderBy: { orderedAt: "desc" },
      include: {
        lines: {
          include: {
            product: {
              select: {
                name: true,
                reference: true,
                category: true,
                catalog: {
                  select: {
                    vendor: { select: { name: true, companyName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    // --- Construction du CSV ---
    const headers = [
      "N° commande",
      "Date commande",
      "Produit",
      "Référence",
      "Vendeur",
      "Catégorie",
      "Quantité",
      "Prix unitaire (€)",
      "Sous-total (€)",
      "Total commande (€)",
      "Statut",
    ];

    const rowsData: string[] = [];

    for (const order of orders) {
      const statusLabel = STATUS_LABELS[order.status] ?? order.status;
      const orderNum = order.id.slice(0, 8).toUpperCase();
      const orderDate = formatDate(order.orderedAt);
      const orderTotal = formatEur(order.totalCents);

      for (const line of order.lines) {
        const vendor =
          line.product.catalog.vendor.companyName ??
          line.product.catalog.vendor.name;
        rowsData.push(
          [
            esc(orderNum),
            esc(orderDate),
            esc(line.product.name),
            esc(line.product.reference),
            esc(vendor),
            esc(line.product.category),
            esc(line.quantity),
            esc(formatEur(line.unitPriceCents)),
            esc(formatEur(line.unitPriceCents * line.quantity)),
            esc(orderTotal),
            esc(statusLabel),
          ].join(SEP)
        );
      }
    }

    // Si aucune ligne, on ajoute tout de même une ligne vide commentée
    if (rowsData.length === 0) {
      rowsData.push(
        [esc("(aucune commande pour ce filtre)"), ...Array(10).fill("")].join(SEP)
      );
    }

    const csv =
      BOM +
      [headers.map(esc).join(SEP), ...rowsData].join("\r\n");

    const now = new Date();
    const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const filename = `carlow-mes-commandes-${dateTag}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/buyer/orders/export] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
