import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCsv } from "@/lib/csv";

/**
 * Import en masse de produits via CSV.
 *
 * 2 modes :
 *   POST { vendorId, catalogId, csv, mode: "preview" }
 *     → parse + valide chaque ligne, retourne un récap sans rien
 *       écrire en DB (l'UI affiche un tableau de prévisualisation)
 *   POST { vendorId, catalogId, csv, mode: "commit" }
 *     → crée effectivement les produits valides en DB (ignore les
 *       lignes en erreur, retourne les compteurs)
 *
 * Format CSV attendu (header) :
 *   name,reference,description,price,stock,weightKg,dimensions,category
 *
 * Sécurité :
 *  - Le catalogId doit appartenir au vendorId (sinon 403)
 *  - Le vendor doit être actif
 *  - On limite à 500 lignes par import pour éviter d'abuser
 */

interface RowError {
  rowIndex: number;
  field?: string;
  message: string;
}

interface ValidatedProduct {
  name: string;
  reference: string | null;
  description: string | null;
  price: number;
  stock: number;
  weightKg: number | null;
  dimensions: string | null;
  category: string | null;
  active: boolean;
}

const MAX_ROWS = 500;

const HEADERS_REQUIRED = ["name", "price"];
const HEADERS_KNOWN = [
  "name",
  "reference",
  "description",
  "price",
  "stock",
  "weightkg",
  "dimensions",
  "category",
];

function parsePrice(raw: string): number | null {
  // Accepte "12,50" ou "12.50" ou "12 €"
  const cleaned = raw.replace(/€|EUR|\s/gi, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const v = parseFloat(cleaned);
  if (Number.isNaN(v) || v < 0) return null;
  return v;
}

function parseIntSafe(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "");
  if (!/^-?\d+$/.test(cleaned)) return null;
  const v = parseInt(cleaned, 10);
  if (Number.isNaN(v) || v < 0) return null;
  return v;
}

function parseFloatSafe(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const v = parseFloat(cleaned);
  if (Number.isNaN(v) || v < 0) return null;
  return v;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendorId, catalogId, csv, mode } = body as {
      vendorId?: string;
      catalogId?: string;
      csv?: string;
      mode?: "preview" | "commit";
    };

    if (!vendorId || !catalogId || typeof csv !== "string" || !mode) {
      return NextResponse.json(
        { error: "Champs vendorId, catalogId, csv et mode requis" },
        { status: 400 }
      );
    }

    // Vérification d'appartenance du catalogue au vendeur
    const catalog = await prisma.catalog.findUnique({
      where: { id: catalogId },
      select: { id: true, name: true, vendorId: true },
    });
    if (!catalog || catalog.vendorId !== vendorId) {
      return NextResponse.json(
        { error: "Catalogue introuvable ou non autorisé" },
        { status: 403 }
      );
    }

    // Parse CSV
    const parsed = parseCsv(csv);

    if (parsed.headers.length === 0) {
      return NextResponse.json(
        { error: "CSV vide ou illisible" },
        { status: 400 }
      );
    }

    // Vérif des headers requis
    const missing = HEADERS_REQUIRED.filter(
      (h) => !parsed.headers.includes(h)
    );
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Headers manquants : ${missing.join(", ")}. Headers détectés : ${parsed.headers.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (parsed.rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ROWS} lignes par import (${parsed.rows.length} reçues)` },
        { status: 400 }
      );
    }

    // Validation ligne par ligne
    const valid: ValidatedProduct[] = [];
    const errors: RowError[] = [...parsed.errors];

    for (const row of parsed.rows) {
      const d = row.data;
      const name = d.name?.trim();
      if (!name) {
        errors.push({ rowIndex: row.rowIndex, field: "name", message: "Nom requis" });
        continue;
      }
      const price = parsePrice(d.price ?? "");
      if (price === null) {
        errors.push({
          rowIndex: row.rowIndex,
          field: "price",
          message: `Prix invalide ("${d.price}") — utilisez format 12.50 ou 12,50`,
        });
        continue;
      }
      const stockRaw = d.stock?.trim();
      const stock = stockRaw ? parseIntSafe(stockRaw) ?? 0 : 0;
      const weightRaw = d.weightkg?.trim();
      const weightKg = weightRaw ? parseFloatSafe(weightRaw) : null;

      valid.push({
        name,
        reference: d.reference?.trim() || null,
        description: d.description?.trim() || null,
        price,
        stock,
        weightKg,
        dimensions: d.dimensions?.trim() || null,
        category: d.category?.trim() || null,
        active: true,
      });
    }

    // Mode preview → on retourne tout sans rien écrire
    if (mode === "preview") {
      return NextResponse.json({
        success: true,
        preview: true,
        headers: parsed.headers,
        delimiter: parsed.delimiter,
        unknownHeaders: parsed.headers.filter(
          (h) => !HEADERS_KNOWN.includes(h)
        ),
        totalRows: parsed.rows.length,
        validCount: valid.length,
        errorCount: errors.length,
        sample: valid.slice(0, 10), // 10 premières lignes pour aperçu
        errors: errors.slice(0, 50), // cap pour éviter payload monstrueux
      });
    }

    // Mode commit → on insère
    if (valid.length === 0) {
      return NextResponse.json(
        { error: "Aucune ligne valide à importer" },
        { status: 400 }
      );
    }

    const created = await prisma.product.createMany({
      data: valid.map((p) => ({
        ...p,
        catalogId,
      })),
    });

    return NextResponse.json({
      success: true,
      preview: false,
      created: created.count,
      skipped: errors.length,
      totalRows: parsed.rows.length,
      errors: errors.slice(0, 50),
    });
  } catch (error) {
    console.error("[api/vendor/products/import-csv] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
