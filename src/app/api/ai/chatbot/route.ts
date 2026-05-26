import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rateLimit";

/**
 * Chatbot IA marketplace — assistant Claude qui répond aux questions
 * des acheteurs et recommande des produits du catalogue Carlow.
 *
 * Architecture :
 *  - L'historique de conversation est envoyé à chaque requête (stateless côté serveur)
 *  - On injecte dans le system prompt un échantillon du catalogue (top 30 produits actifs)
 *  - Claude répond en texte naturel + peut mentionner des références produits
 *  - On extrait les IDs de produits cités via une recherche par nom → renvoyés
 *    au client pour afficher des cartes cliquables
 *
 * Rate limit : 20 messages par 10 min par IP (suffisant pour conversation normale,
 * empêche le scraping de notre crédit API).
 */

export const runtime = "nodejs";

const CHATBOT_SYSTEM = `Tu es l'assistant virtuel de Carlow, marketplace B2B européenne dédiée aux équipements d'énergies renouvelables (photovoltaïque, onduleurs, batteries, IRVE, pompes à chaleur, biomasse).

Tu aides les installateurs professionnels et acheteurs à :
- Trouver le bon produit pour leur projet (photovoltaïque, stockage, recharge VE, chauffage)
- Comparer les caractéristiques techniques
- Comprendre les certifications (CE, Certisolis, normes EU)
- Répondre à leurs questions générales sur la marketplace (paiement, livraison, commandes, devis)

Règles :
- Réponses en français, ton professionnel mais chaleureux
- Concis : 2-4 phrases maximum par réponse (sauf si l'utilisateur demande des détails)
- Si tu recommandes un produit, mentionne son **nom exact** entre étoiles : **Nom du produit**
- N'invente JAMAIS de caractéristiques techniques précises (rendement, puissance, prix) si elles ne figurent pas dans le catalogue ci-dessous
- Si tu ne sais pas, oriente vers le formulaire de contact ou la FAQ
- Pas de markdown lourd (titres, listes), juste du texte fluide

Informations utiles sur Carlow :
- Inscription gratuite (acheteur et vendeur), commission de 4% sur les ventes
- Paiement sécurisé Stripe
- Validation des vendeurs sous 24-48h
- Protection acheteur 30 jours
- Service client : contact@carlow.fr`;

interface ClientMessage {
  role: "user" | "assistant";
  content: string;
}

interface ProductLite {
  id: string;
  name: string;
  category: string | null;
  price: number;
  vendor: string;
}

/**
 * Cherche les produits cités par l'IA dans son message.
 * On normalise (lowercase + suppression accents) et on cherche les noms
 * dans le texte. Retourne les IDs uniques (max 4).
 */
function extractMentionedProductIds(
  aiMessage: string,
  catalog: ProductLite[]
): string[] {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[*_]/g, "");

  const normalizedMsg = normalize(aiMessage);
  const matched: { id: string; pos: number }[] = [];
  for (const p of catalog) {
    const normalizedName = normalize(p.name);
    // On exige au moins 4 caractères pour éviter les faux positifs ("Solar")
    if (normalizedName.length < 4) continue;
    const pos = normalizedMsg.indexOf(normalizedName);
    if (pos >= 0) {
      matched.push({ id: p.id, pos });
    }
  }
  // Ordonne par ordre d'apparition, dédupe, limite à 4
  matched.sort((a, b) => a.pos - b.pos);
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const m of matched) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      ids.push(m.id);
      if (ids.length >= 4) break;
    }
  }
  return ids;
}

export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, {
    bucket: "ai:chatbot",
    limit: 20,
    windowSec: 600,
  });
  if (blocked) return blocked;

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Service IA non configuré (ANTHROPIC_API_KEY manquant).",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { messages } = body as { messages?: ClientMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Historique de messages manquant" },
        { status: 400 }
      );
    }

    // Limite l'historique à 20 messages pour éviter les contextes énormes
    const truncated = messages.slice(-20).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content ?? "").slice(0, 2000),
    }));

    // Récupère le catalogue (top 30 produits actifs) pour le contexte
    const catalogRaw = await prisma.product.findMany({
      where: {
        active: true,
        catalog: { active: true, vendor: { status: "active" } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        description: true,
        catalog: {
          select: {
            vendor: { select: { name: true, companyName: true } },
          },
        },
      },
    });

    const catalog: ProductLite[] = catalogRaw.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      vendor: p.catalog.vendor.companyName ?? p.catalog.vendor.name,
    }));

    // Construit le contexte catalogue
    const catalogContext = catalogRaw.length
      ? catalogRaw
          .map(
            (p) =>
              `- ${p.name} (${p.category ?? "Sans catégorie"}, ${p.price.toFixed(2)}€, vendeur : ${p.catalog.vendor.companyName ?? p.catalog.vendor.name})${p.description ? ` — ${p.description.slice(0, 150)}` : ""}`
          )
          .join("\n")
      : "(Aucun produit actif pour le moment)";

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      system: [
        {
          type: "text",
          text: CHATBOT_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
        {
          type: "text",
          text: `Voici un échantillon du catalogue actuel (top 30 produits actifs) :\n\n${catalogContext}`,
        },
      ],
      messages: truncated,
    });

    const aiMessage = response.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { text: string }).text)
      .join("\n")
      .trim();

    if (!aiMessage) {
      return NextResponse.json(
        { success: false, error: "Aucune réponse générée." },
        { status: 503 }
      );
    }

    // Extrait les produits mentionnés
    const mentionedIds = extractMentionedProductIds(aiMessage, catalog);

    // Récupère les détails complets pour ces produits (avec photo)
    const recommendedProducts =
      mentionedIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: mentionedIds } },
            select: {
              id: true,
              name: true,
              price: true,
              category: true,
              photos: { orderBy: { order: "asc" }, take: 1 },
              catalog: {
                select: {
                  vendor: { select: { name: true, companyName: true } },
                },
              },
            },
          })
        : [];

    const recommendations = recommendedProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      imageUrl: p.photos[0]?.url ?? null,
      vendor: p.catalog.vendor.companyName ?? p.catalog.vendor.name,
    }));

    return NextResponse.json({
      success: true,
      message: aiMessage,
      recommendations,
    });
  } catch (error) {
    console.error("[api/ai/chatbot] error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la conversation.",
      },
      { status: 500 }
    );
  }
}
