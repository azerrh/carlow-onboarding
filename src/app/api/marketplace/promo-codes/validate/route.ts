import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Valide un code promo appliqué au panier de l'acheteur.
 *
 * POST /api/marketplace/promo-codes/validate
 * Body : { code: string, vendorId: string, subtotalCents: number }
 *
 * Logique :
 *  - Le code est lié à UN vendeur. On filtre les items du panier par vendeur :
 *    le code ne réduit que les produits du vendeur émetteur.
 *  - On vérifie : actif, non expiré, non épuisé (maxUsages), sous-total min.
 *  - On renvoie le montant de remise en centimes, calculé côté serveur
 *    (NE JAMAIS faire confiance au client pour le calcul du discount).
 *
 * ⚠️ Cette route ne décrémente PAS le compteur d'usage. Il sera incrémenté
 * uniquement quand la commande sera réellement payée (webhook Stripe ou
 * checkout success). Sinon un acheteur pourrait épuiser le code en bouclant
 * sur la validation sans jamais commander.
 */

export const runtime = "nodejs";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, vendorId, subtotalCents } = body as {
      code?: string;
      vendorId?: string;
      subtotalCents?: number;
    };

    if (!code || !vendorId || subtotalCents === undefined) {
      return NextResponse.json(
        { error: "Champs requis : code, vendorId, subtotalCents" },
        { status: 400 }
      );
    }

    const cleanCode = normalizeCode(code);
    if (!cleanCode) {
      return NextResponse.json(
        { error: "Code invalide" },
        { status: 400 }
      );
    }

    const promo = await prisma.promoCode.findUnique({
      where: { vendorId_code: { vendorId, code: cleanCode } },
    });

    if (!promo) {
      return NextResponse.json(
        { success: false, error: "Code inconnu pour ce vendeur." },
        { status: 404 }
      );
    }

    if (!promo.active) {
      return NextResponse.json(
        { success: false, error: "Ce code n'est plus actif." },
        { status: 400 }
      );
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "Ce code a expiré." },
        { status: 400 }
      );
    }

    if (promo.maxUsages !== null && promo.usageCount >= promo.maxUsages) {
      return NextResponse.json(
        { success: false, error: "Ce code a atteint sa limite d'utilisation." },
        { status: 400 }
      );
    }

    if (subtotalCents < promo.minSubtotalCents) {
      const missing = ((promo.minSubtotalCents - subtotalCents) / 100).toFixed(2);
      const required = (promo.minSubtotalCents / 100).toFixed(2);
      return NextResponse.json(
        {
          success: false,
          error: `Montant minimum de ${required}€ requis pour ce vendeur (il manque ${missing}€).`,
        },
        { status: 400 }
      );
    }

    // Calcul du discount côté serveur (jamais côté client)
    let discountCents = 0;
    if (promo.type === "PERCENT") {
      discountCents = Math.round((subtotalCents * promo.discountValue) / 100);
    } else if (promo.type === "FIXED") {
      discountCents = Math.round(promo.discountValue);
    }
    // Plafonne au sous-total (on ne paie pas négatif)
    if (discountCents > subtotalCents) {
      discountCents = subtotalCents;
    }

    return NextResponse.json({
      success: true,
      promo: {
        id: promo.id,
        code: promo.code,
        type: promo.type,
        discountValue: promo.discountValue,
        discountCents,
        vendorId: promo.vendorId,
      },
    });
  } catch (error) {
    console.error("[api/marketplace/promo-codes/validate] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
