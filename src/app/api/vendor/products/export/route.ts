import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Export CSV du catalogue produits d'un vendeur.
 *
 * GET /api/vendor/products/export?vendorId=<id>&active=<true|false|all>
 *
 * Colonnes :
 *   ID | Nom | Référence | Catégorie | Description | Prix (€)
 *   Stock | Actif | Poids (kg) | Dimensions | Catalogue | Date création
 *
 * Encodage UTF-8 + BOM pour Excel Windows.
 */

export const runtime = "nodejs";

const SEP = ";";
const BOM = "﻿";

function esc(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(SEP) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") ?? searchParams.get("id");
    const activeFilter = searchParams.get("active") ?? "all"; // "true" | "false" | "all"

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId manquant" }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { name: true, companyName: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: {
        catalog: { vendorId },
        ...(activeFilter === "true"
          ? { active: true }
          : activeFilter === "false"
            ? { active: false }
            : {}),
      },
      orderBy: [{ catalog: { name: "asc" } }, { name: "asc" }],
      include: {
        catalog: { select: { name: true } },
        _count: { select: { orderLines: true, favorites: true } },
      },
    });

    const headers = [
      "ID produit",
      "Nom",
      "Référence",
      "Catégorie",
      "Description",
      "Prix (€)",
      "Stock",
      "Actif",
      "Poids (kg)",
      "Dimensions",
      "Catalogue",
      "Commandes reçues",
      "Favoris",
      "Date création",
    ];

    const rows: string[] = [
      BOM + headers.map(esc).join(SEP),
      ...products.map((p) =>
        [
          esc(p.id.slice(0, 8).toUpperCase()),
          esc(p.name),
          esc(p.reference),
          esc(p.category),
          esc(p.description),
          esc(p.price.toFixed(2).replace(".", ",")),
          esc(p.stock),
          esc(p.active ? "Oui" : "Non"),
          esc(p.weightKg !== null ? p.weightKg.toFixed(2).replace(".", ",") : ""),
          esc(p.dimensions),
          esc(p.catalog.name),
          esc(p._count.orderLines),
          esc(p._count.favorites),
          esc(formatDate(p.createdAt)),
        ].join(SEP)
      ),
    ];

    if (products.length === 0) {
      rows.push([esc("(aucun produit)"), ...Array(13).fill("")].join(SEP));
    }

    const csv = rows.join("\r\n");
    const now = new Date();
    const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const vendorSlug = (vendor.companyName ?? vendor.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 24);
    const filename = `carlow-produits-${vendorSlug}-${dateTag}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/vendor/products/export] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
