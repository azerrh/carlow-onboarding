import Anthropic from "@anthropic-ai/sdk";

/**
 * Wrapper centralisé autour du SDK Anthropic (Claude).
 *
 * Pattern défensif :
 *  - Si `ANTHROPIC_API_KEY` est absent, on retourne une erreur claire au
 *    lieu de crasher (l'app reste utilisable, juste les boutons IA sont KO)
 *  - Init lazy : on ne crée le client qu'au 1er appel
 *  - Prompt caching activé sur le system prompt qui ne bouge pas
 *    (économise 90% des coûts de tokens en lecture sur les calls répétés)
 *
 * Modèle utilisé : claude-haiku-4-5 — bon compromis vitesse / coût pour
 * des tâches simples (descriptions, traductions, vision basique).
 */

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  client = new Anthropic({ apiKey });
  return client;
}

export interface AiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/* ============================================================
   A — Génération de description produit
   ============================================================ */

const DESCRIPTION_SYSTEM = `Tu es un expert en rédaction commerciale B2B spécialisé dans les équipements d'énergies renouvelables (photovoltaïque, onduleurs, batteries, IRVE, pompes à chaleur, biomasse).

Tu rédiges des descriptions de produits pour la marketplace Carlow, destinée aux installateurs professionnels français et européens.

Règles strictes :
- Français impeccable, ton professionnel mais accessible
- 4 à 6 phrases maximum (descriptions courtes pour fiche produit)
- Mets en avant : caractéristiques techniques principales, normes/certifications attendues, cas d'usage typiques, garanties standard du secteur
- Ne JAMAIS inventer de chiffres précis (rendement, puissance, prix, garantie) si le vendeur ne les a pas fournis
- Pas de superlatifs marketing exagérés ("révolutionnaire", "leader mondial")
- Format : paragraphe simple, pas de markdown, pas de listes à puces`;

export async function generateProductDescription(input: {
  name: string;
  category?: string | null;
  hints?: string | null;
}): Promise<AiResult<{ description: string }>> {
  const c = getClient();
  if (!c) {
    return {
      success: false,
      error: "Service IA non configuré (ANTHROPIC_API_KEY manquant).",
    };
  }

  const userPrompt = `Produit : ${input.name}
${input.category ? `Catégorie : ${input.category}` : ""}
${input.hints ? `Caractéristiques additionnelles fournies par le vendeur : ${input.hints}` : ""}

Rédige la description de fiche produit.`;

  try {
    const msg = await c.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system: [
        {
          type: "text",
          text: DESCRIPTION_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = msg.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { text: string }).text)
      .join("\n")
      .trim();

    if (!text) {
      return { success: false, error: "Aucune réponse générée." };
    }

    return { success: true, data: { description: text } };
  } catch (error) {
    console.error("[ai/generate-description] error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur d'appel à Claude.",
    };
  }
}

/* ============================================================
   B — Traduction automatique
   ============================================================ */

export type SupportedLang = "en" | "de" | "es";

const TRANSLATE_SYSTEM = `Tu es un traducteur technique professionnel spécialisé dans le vocabulaire B2B des énergies renouvelables.

Tu traduis du français vers d'autres langues européennes en respectant :
- Le vocabulaire technique exact (utilise les termes anglais/allemands/espagnols standards de l'industrie EnR)
- Le ton professionnel d'une fiche produit B2B
- La concision : ne pas ajouter d'information, ne pas paraphraser

Retourne UNIQUEMENT la traduction, sans commentaire ni préfixe.`;

const LANG_LABELS: Record<SupportedLang, string> = {
  en: "anglais",
  de: "allemand",
  es: "espagnol",
};

export async function translateText(input: {
  text: string;
  targetLang: SupportedLang;
}): Promise<AiResult<{ translation: string }>> {
  const c = getClient();
  if (!c) {
    return {
      success: false,
      error: "Service IA non configuré.",
    };
  }
  if (!input.text || input.text.trim().length === 0) {
    return { success: false, error: "Texte vide." };
  }

  try {
    const msg = await c.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: TRANSLATE_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Traduis ce texte en ${LANG_LABELS[input.targetLang]} :\n\n"""${input.text}"""`,
        },
      ],
    });

    const text = msg.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { text: string }).text)
      .join("\n")
      .trim()
      // L'IA met parfois des guillemets — on les retire si présents.
      // [\s\S]* en remplacement du flag /s pour rester compatible target ES2017.
      .replace(/^["'«»]([\s\S]*)["'«»]$/, "$1")
      .trim();

    if (!text) {
      return { success: false, error: "Aucune traduction générée." };
    }

    return { success: true, data: { translation: text } };
  } catch (error) {
    console.error("[ai/translate] error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur d'appel à Claude.",
    };
  }
}

/* ============================================================
   C — Analyse d'image (vision)
   ============================================================ */

const VISION_SYSTEM = `Tu es un expert en équipements d'énergies renouvelables. On t'envoie une photo d'un produit que tu dois identifier.

Tu retournes STRICTEMENT un objet JSON valide (sans markdown, sans backticks) avec cette structure exacte :

{
  "name": "Nom probable du produit en français (max 60 caractères)",
  "category": "Une des catégories : Photovoltaïque, Onduleurs, Stockage, Pompes à chaleur, IRVE, Biomasse, Accessoires, Autre",
  "tags": ["3 à 5 mots-clés techniques en français, courts"],
  "description": "Description courte 2-3 phrases, factuelle, qu'on voit sur la photo",
  "confidence": "high | medium | low — ta confiance dans l'identification"
}

Si l'image ne montre PAS un équipement EnR (animal, paysage, document texte, etc.), retourne :
{
  "name": "",
  "category": "Autre",
  "tags": [],
  "description": "Cette image ne semble pas être un équipement d'énergie renouvelable.",
  "confidence": "low"
}`;

export interface ImageAnalysisResult {
  name: string;
  category: string;
  tags: string[];
  description: string;
  confidence: "high" | "medium" | "low";
}

export async function analyzeProductImage(input: {
  /** Soit dataUrl base64 ("data:image/jpeg;base64,..."), soit URL publique. */
  imageBase64?: string;
  imageMediaType?: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  imageUrl?: string;
}): Promise<AiResult<ImageAnalysisResult>> {
  const c = getClient();
  if (!c) {
    return { success: false, error: "Service IA non configuré." };
  }
  if (!input.imageBase64 && !input.imageUrl) {
    return { success: false, error: "Image manquante." };
  }

  const imageContent =
    input.imageBase64 && input.imageMediaType
      ? ({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: input.imageMediaType,
            data: input.imageBase64,
          },
        } as const)
      : ({
          type: "image" as const,
          source: { type: "url" as const, url: input.imageUrl! },
        } as const);

  try {
    const msg = await c.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      system: [
        {
          type: "text",
          text: VISION_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            imageContent,
            {
              type: "text",
              text: "Analyse cette photo et retourne le JSON.",
            },
          ],
        },
      ],
    });

    const raw = msg.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { text: string }).text)
      .join("\n")
      .trim();

    // L'IA peut parfois enrober dans ```json ... ``` malgré le system prompt.
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    let parsed: ImageAnalysisResult;
    try {
      parsed = JSON.parse(cleaned) as ImageAnalysisResult;
    } catch {
      return {
        success: false,
        error: "Réponse IA mal formatée (JSON invalide).",
      };
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error("[ai/analyze-image] error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur d'appel à Claude.",
    };
  }
}

/** Helper public pour savoir si l'IA est dispo (utile pour conditionner l'UI). */
export function isAiConfigured(): boolean {
  return getClient() !== null;
}
