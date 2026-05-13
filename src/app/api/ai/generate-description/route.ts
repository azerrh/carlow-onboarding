import { NextRequest, NextResponse } from "next/server";
import { generateProductDescription } from "@/lib/ai";
import { applyRateLimit } from "@/lib/rateLimit";

/**
 * Génération de description produit via Claude.
 *
 * Auth basique : on demande un vendorId valide. Pas de session stricte
 * car les routes vendor s'appuient sur localStorage (cohérent avec
 * le reste).
 *
 * Rate limit : 30 générations par 10 min par IP. Suffisant pour un
 * vendeur qui prépare son catalogue, dissuasif pour le scrapping de
 * notre crédit API.
 */
export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, {
    bucket: "ai:describe",
    limit: 30,
    windowSec: 600,
  });
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const { name, category, hints } = body as {
      name?: string;
      category?: string | null;
      hints?: string | null;
    };

    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Nom de produit requis (3 caractères min)" },
        { status: 400 }
      );
    }
    if (name.length > 200) {
      return NextResponse.json({ error: "Nom trop long" }, { status: 400 });
    }

    const result = await generateProductDescription({
      name: name.trim(),
      category: category?.trim() || null,
      hints: hints?.trim() || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, ...result.data });
  } catch (error) {
    console.error("[api/ai/generate-description] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
