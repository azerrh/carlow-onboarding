import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { translateText, type SupportedLang } from "@/lib/ai";
import { applyRateLimit } from "@/lib/rateLimit";

/**
 * Traduction à la volée d'un texte (description produit, etc.).
 *
 * Si `productId` est passé, on cache la traduction dans la colonne
 * `Product.translations` (JSON map { lang: text }) pour éviter de
 * regénérer à chaque visite. Si l'utilisateur retraduit le même produit
 * sans force=true, on retourne le cache.
 *
 * Sans `productId` (mode "ad-hoc"), on traduit sans cache → utile pour
 * traduire d'autres contenus à l'avenir (titre, FAQ, etc.).
 */

const SUPPORTED: SupportedLang[] = ["en", "de", "es"];

export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, {
    bucket: "ai:translate",
    limit: 60,
    windowSec: 600,
  });
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const { text, targetLang, productId, force } = body as {
      text?: string;
      targetLang?: string;
      productId?: string;
      force?: boolean;
    };

    if (!targetLang || !SUPPORTED.includes(targetLang as SupportedLang)) {
      return NextResponse.json(
        { error: `targetLang invalide (valeurs : ${SUPPORTED.join(", ")})` },
        { status: 400 }
      );
    }
    const lang = targetLang as SupportedLang;

    // Si productId fourni, on lit le texte source + le cache éventuel
    let sourceText = text?.trim();
    let cachedTranslation: string | undefined;

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { description: true, translations: true },
      });
      if (!product) {
        return NextResponse.json(
          { error: "Produit introuvable" },
          { status: 404 }
        );
      }
      sourceText = sourceText ?? product.description?.trim() ?? "";

      // Cache hit ?
      const translations = (product.translations ?? {}) as Record<
        string,
        string
      >;
      if (!force && typeof translations[lang] === "string") {
        cachedTranslation = translations[lang];
      }
    }

    if (!sourceText) {
      return NextResponse.json(
        { error: "Texte source vide" },
        { status: 400 }
      );
    }
    if (sourceText.length > 4000) {
      return NextResponse.json(
        { error: "Texte trop long (max 4000 chars)" },
        { status: 400 }
      );
    }

    if (cachedTranslation) {
      return NextResponse.json({
        success: true,
        translation: cachedTranslation,
        targetLang: lang,
        cached: true,
      });
    }

    const result = await translateText({ text: sourceText, targetLang: lang });
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 503 }
      );
    }

    // Cache si productId fourni
    if (productId && result.data?.translation) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { translations: true },
      });
      const existing = (product?.translations ?? {}) as Record<string, string>;
      existing[lang] = result.data.translation;
      await prisma.product
        .update({
          where: { id: productId },
          data: { translations: existing },
        })
        .catch((err) => {
          console.error("[ai/translate] cache write fail:", err);
        });
    }

    return NextResponse.json({
      success: true,
      translation: result.data?.translation,
      targetLang: lang,
      cached: false,
    });
  } catch (error) {
    console.error("[api/ai/translate] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
