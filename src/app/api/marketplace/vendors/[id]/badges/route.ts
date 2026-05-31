import { NextRequest, NextResponse } from "next/server";
import { computeVendorBadges } from "@/lib/vendorBadges";

/**
 * GET /api/marketplace/vendors/[id]/badges
 *
 * Retourne les badges obtenus par un vendeur. Public, sans auth.
 * Utilisé sur :
 *  - Page vendeur publique (/marketplace/vendeur/[id])
 *  - Fiche produit (/marketplace/[id])
 *  - Cartes produits (compact)
 */

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Vendor ID manquant" }, { status: 400 });
    }

    const badges = await computeVendorBadges(id);
    return NextResponse.json({ success: true, badges });
  } catch (error) {
    console.error("[api/marketplace/vendors/badges] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
