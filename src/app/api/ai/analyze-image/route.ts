import { NextRequest, NextResponse } from "next/server";
import { analyzeProductImage } from "@/lib/ai";
import { applyRateLimit } from "@/lib/rateLimit";

/**
 * Analyse d'image (vision) — suggère un nom + catégorie + tags pour
 * un produit à partir d'une photo téléchargée par le vendeur.
 *
 * 2 modes d'entrée :
 *  - { imageBase64, imageMediaType }  ← upload direct (dataUrl du form)
 *  - { imageUrl }                     ← URL publique (Supabase Storage)
 *
 * Limites : Claude vision accepte jusqu'à 5 MB par image et certains
 * formats. On rate-limite agressivement car vision = plus cher que texte.
 */
export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, {
    bucket: "ai:vision",
    limit: 15,
    windowSec: 600,
  });
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const { imageBase64, imageMediaType, imageUrl } = body as {
      imageBase64?: string;
      imageMediaType?: string;
      imageUrl?: string;
    };

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { error: "imageBase64 ou imageUrl requis" },
        { status: 400 }
      );
    }

    // Validation du type MIME si base64
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    let cleanBase64: string | undefined;
    let cleanMediaType:
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp"
      | undefined;

    if (imageBase64) {
      const mt = imageMediaType?.toLowerCase();
      if (!mt || !allowed.includes(mt)) {
        return NextResponse.json(
          { error: `Format image non supporté (${imageMediaType})` },
          { status: 400 }
        );
      }
      // Si dataUrl complète, on extrait juste la partie base64
      cleanBase64 = imageBase64.startsWith("data:")
        ? imageBase64.split(",")[1] ?? imageBase64
        : imageBase64;
      cleanMediaType = mt as typeof cleanMediaType;

      // Garde-fou taille : 5 MB max
      const sizeBytes = (cleanBase64.length * 3) / 4;
      if (sizeBytes > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image trop volumineuse (max 5 MB)" },
          { status: 400 }
        );
      }
    }

    const result = await analyzeProductImage({
      imageBase64: cleanBase64,
      imageMediaType: cleanMediaType,
      imageUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, ...result.data });
  } catch (error) {
    console.error("[api/ai/analyze-image] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
