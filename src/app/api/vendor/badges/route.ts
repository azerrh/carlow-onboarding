import { NextRequest, NextResponse } from "next/server";
import { computeVendorBadges, listAllBadges } from "@/lib/vendorBadges";

/**
 * GET /api/vendor/badges?vendorId=xxx
 *
 * Retourne tous les badges existants + l'état (obtenu ou non) pour le vendeur.
 * Utilisé sur le dashboard vendeur pour voir sa progression.
 */

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") ?? searchParams.get("id");
    if (!vendorId) {
      return NextResponse.json({ error: "vendorId requis" }, { status: 400 });
    }

    const earnedBadges = await computeVendorBadges(vendorId);
    const earnedIds = new Set(earnedBadges.map((b) => b.id));
    const all = listAllBadges().map((b) => ({
      ...b,
      earned: earnedIds.has(b.id),
    }));

    return NextResponse.json({
      success: true,
      badges: all,
      earnedCount: earnedBadges.length,
      totalCount: all.length,
    });
  } catch (error) {
    console.error("[api/vendor/badges] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
