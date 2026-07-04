import { NextRequest, NextResponse } from "next/server";
import { computeTopVendorBadges, type Badge } from "@/lib/vendorBadges";

/**
 * GET /api/marketplace/vendor-badges?ids=id1,id2,...
 *
 * Version GROUPÉE : renvoie les badges compacts (les 2 plus prestigieux)
 * pour plusieurs vendeurs à la fois.
 *
 * Utilisé par la liste marketplace pour réafficher les badges sur les cartes
 * produits SANS bloquer le premier rendu ni surcharger le pool de connexions :
 * la liste charge d'abord les produits (/api/marketplace/products, sans badges),
 * puis appelle cet endpoint pour les seuls vendeurs uniques visibles.
 *
 * Perf : chaque vendeur = ~7 requêtes Prisma. On traite les vendeurs par petits
 * lots séquentiels pour éviter d'épuiser le pool de connexions Postgres sur
 * Vercel serverless.
 */

export const runtime = "nodejs";

const CHUNK = 4; // vendeurs calculés en parallèle par lot
const MAX_IDS = 40; // garde-fou sur le nombre de vendeurs par requête

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = Array.from(
      new Set(
        (searchParams.get("ids") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    ).slice(0, MAX_IDS);

    const badges: Record<string, Badge[]> = {};

    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const results = await Promise.all(
        chunk.map((id) => computeTopVendorBadges(id))
      );
      chunk.forEach((id, idx) => {
        badges[id] = results[idx];
      });
    }

    return NextResponse.json({ success: true, badges });
  } catch (error) {
    console.error("[api/marketplace/vendor-badges] batch error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
