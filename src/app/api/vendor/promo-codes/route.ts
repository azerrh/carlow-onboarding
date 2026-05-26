import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Gestion des codes promo côté vendeur.
 *
 *  GET    /api/vendor/promo-codes?vendorId=xxx     → liste des codes du vendeur
 *  POST   /api/vendor/promo-codes                  → créer un nouveau code
 *  PUT    /api/vendor/promo-codes                  → modifier (active/désactive, etc.)
 *  DELETE /api/vendor/promo-codes?id=xxx&vendorId  → supprimer un code
 *
 * Sécurité : on vérifie systématiquement que le code appartient au vendorId
 * fourni avant toute modification/suppression.
 */

export const runtime = "nodejs";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

/* ------------------------------------------------------------------ GET */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") ?? searchParams.get("id");
    if (!vendorId) {
      return NextResponse.json({ error: "vendorId requis" }, { status: 400 });
    }

    const codes = await prisma.promoCode.findMany({
      where: { vendorId },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    });

    const now = new Date();
    return NextResponse.json({
      success: true,
      codes: codes.map((c) => ({
        id: c.id,
        code: c.code,
        type: c.type,
        discountValue: c.discountValue,
        minSubtotalCents: c.minSubtotalCents,
        maxUsages: c.maxUsages,
        usageCount: c.usageCount,
        expiresAt: c.expiresAt,
        active: c.active,
        createdAt: c.createdAt,
        // Statut calculé pour l'UI
        isExpired: c.expiresAt ? c.expiresAt < now : false,
        isExhausted: c.maxUsages !== null && c.usageCount >= c.maxUsages,
      })),
    });
  } catch (error) {
    console.error("[api/vendor/promo-codes] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ----------------------------------------------------------------- POST */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vendorId,
      code,
      type,
      discountValue,
      minSubtotalCents,
      maxUsages,
      expiresAt,
    } = body as {
      vendorId?: string;
      code?: string;
      type?: string;
      discountValue?: number;
      minSubtotalCents?: number;
      maxUsages?: number | null;
      expiresAt?: string | null;
    };

    if (!vendorId || !code || !type || discountValue === undefined) {
      return NextResponse.json(
        { error: "Champs requis : vendorId, code, type, discountValue" },
        { status: 400 }
      );
    }

    if (type !== "PERCENT" && type !== "FIXED") {
      return NextResponse.json(
        { error: "Type invalide. Utilisez PERCENT ou FIXED." },
        { status: 400 }
      );
    }

    const cleanCode = normalizeCode(code);
    if (cleanCode.length < 3 || cleanCode.length > 32) {
      return NextResponse.json(
        { error: "Le code doit faire entre 3 et 32 caractères (lettres, chiffres, _, -)." },
        { status: 400 }
      );
    }

    if (discountValue <= 0) {
      return NextResponse.json(
        { error: "La remise doit être supérieure à 0." },
        { status: 400 }
      );
    }
    if (type === "PERCENT" && discountValue > 100) {
      return NextResponse.json(
        { error: "Un pourcentage de remise ne peut pas dépasser 100%." },
        { status: 400 }
      );
    }

    // Vérifie unicité (vendorId, code)
    const existing = await prisma.promoCode.findUnique({
      where: { vendorId_code: { vendorId, code: cleanCode } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Le code "${cleanCode}" existe déjà.` },
        { status: 409 }
      );
    }

    const promo = await prisma.promoCode.create({
      data: {
        vendorId,
        code: cleanCode,
        type,
        discountValue,
        minSubtotalCents: minSubtotalCents ?? 0,
        maxUsages: maxUsages ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ success: true, code: promo });
  } catch (error) {
    console.error("[api/vendor/promo-codes] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ PUT */

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      vendorId,
      active,
      discountValue,
      minSubtotalCents,
      maxUsages,
      expiresAt,
    } = body as {
      id?: string;
      vendorId?: string;
      active?: boolean;
      discountValue?: number;
      minSubtotalCents?: number;
      maxUsages?: number | null;
      expiresAt?: string | null;
    };

    if (!id || !vendorId) {
      return NextResponse.json({ error: "id et vendorId requis" }, { status: 400 });
    }

    // Vérifie l'appartenance
    const existing = await prisma.promoCode.findFirst({
      where: { id, vendorId },
      select: { id: true, type: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Code introuvable ou accès refusé" },
        { status: 404 }
      );
    }

    if (
      discountValue !== undefined &&
      existing.type === "PERCENT" &&
      discountValue > 100
    ) {
      return NextResponse.json(
        { error: "Un pourcentage de remise ne peut pas dépasser 100%." },
        { status: 400 }
      );
    }

    const promo = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(active !== undefined ? { active } : {}),
        ...(discountValue !== undefined ? { discountValue } : {}),
        ...(minSubtotalCents !== undefined ? { minSubtotalCents } : {}),
        ...(maxUsages !== undefined ? { maxUsages } : {}),
        ...(expiresAt !== undefined
          ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
          : {}),
      },
    });

    return NextResponse.json({ success: true, code: promo });
  } catch (error) {
    console.error("[api/vendor/promo-codes] PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ---------------------------------------------------------------- DELETE */

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const vendorId = searchParams.get("vendorId");

    if (!id || !vendorId) {
      return NextResponse.json({ error: "id et vendorId requis" }, { status: 400 });
    }

    const existing = await prisma.promoCode.findFirst({
      where: { id, vendorId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Code introuvable ou accès refusé" },
        { status: 404 }
      );
    }

    await prisma.promoCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/vendor/promo-codes] DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
