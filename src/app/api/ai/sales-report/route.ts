import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { applyRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";

/**
 * Rapport IA — Claude analyse les statistiques de ventes d'un vendeur et
 * retourne des insights actionnables en français.
 *
 * Rate limit sévère (3/heure) car :
 *  - L'appel est long (contexte riche + réponse détaillée)
 *  - Usage : le vendeur clique "Générer mon rapport" une fois par session
 *  - On ne veut pas qu'un script le spam
 */

const REPORT_SYSTEM = `Tu es un conseiller commercial B2B expert en marketplace d'énergies renouvelables.
Tu analyses les données de ventes d'un vendeur sur la marketplace Carlow et tu lui donnes des recommandations concrètes et actionnables, en français, avec un ton professionnel mais direct.

Format de ta réponse — tu dois retourner UNIQUEMENT un JSON valide (sans markdown, sans backticks) avec cette structure exacte :

{
  "synthese": "1-2 phrases résumant la situation globale du vendeur",
  "points_forts": ["point fort 1", "point fort 2"],
  "points_attention": ["point d'attention 1", "point d'attention 2"],
  "recommandations": [
    { "titre": "titre court", "detail": "explication actionnable en 1-2 phrases" },
    { "titre": "titre court", "detail": "explication actionnable en 1-2 phrases" },
    { "titre": "titre court", "detail": "explication actionnable en 1-2 phrases" }
  ],
  "score": 72
}

Règles :
- score : entier de 0 à 100 représentant la "santé commerciale" du vendeur (basé sur revenus, croissance, taux annulation, diversification catalogue)
- 2 points forts maximum, 2 points d'attention maximum, exactement 3 recommandations
- Sois précis et spécifique aux données fournies, pas de généralités marketing
- Si les données sont vides (0 commandes), adapte le discours pour un vendeur qui débute
- Vocabulaire B2B EnR : tu connais les panneaux solaires, onduleurs, IRVE, batteries, pompes à chaleur`;

export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, {
    bucket: "ai:sales-report",
    limit: 5,
    windowSec: 3600,
  });
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const { vendorId } = body as { vendorId?: string };

    if (!vendorId || typeof vendorId !== "string") {
      return NextResponse.json({ error: "vendorId requis" }, { status: 400 });
    }

    // Vérifier que le vendeur existe
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, name: true, companyName: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
    }

    // Récupérer les données de vente
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      productCount,
      activeProductCount,
      totalOrderLines,
      cancelledOrders,
      revenueTotal,
      revenueLastMonth,
      revenueThisMonth,
      topProducts,
      productsByCategory,
    ] = await Promise.all([
      prisma.product.count({ where: { catalog: { vendorId } } }),
      prisma.product.count({ where: { catalog: { vendorId }, active: true } }),
      prisma.orderLine.count({ where: { product: { catalog: { vendorId } } } }),
      prisma.order.count({
        where: {
          status: "ANNULEE",
          lines: { some: { product: { catalog: { vendorId } } } },
        },
      }),
      prisma.orderLine.aggregate({
        where: { product: { catalog: { vendorId } } },
        _sum: { unitPriceCents: true, quantity: true },
      }),
      prisma.orderLine.aggregate({
        where: {
          product: { catalog: { vendorId } },
          createdAt: { gte: oneMonthAgo, lt: now },
        },
        _sum: { unitPriceCents: true },
      }),
      prisma.orderLine.aggregate({
        where: {
          product: { catalog: { vendorId } },
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
        _sum: { unitPriceCents: true },
      }),
      prisma.orderLine.groupBy({
        by: ["productId"],
        where: {
          product: { catalog: { vendorId } },
          createdAt: { gte: sixMonthsAgo },
        },
        _sum: { quantity: true, unitPriceCents: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 3,
      }),
      prisma.product.groupBy({
        by: ["category"],
        where: { catalog: { vendorId }, active: true },
        _count: { id: true },
      }),
    ]);

    // Résoudre les noms des top produits
    const topProductsData = await Promise.all(
      topProducts.map(async (tp) => {
        const p = await prisma.product.findUnique({
          where: { id: tp.productId },
          select: { name: true, category: true, price: true },
        });
        return {
          name: p?.name ?? "Inconnu",
          category: p?.category ?? "—",
          quantitySold: tp._sum.quantity ?? 0,
          revenueCents: tp._sum.unitPriceCents ?? 0,
        };
      })
    );

    const totalOrders = totalOrderLines;
    const cancelRate =
      totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0;
    const totalRevenueCents = revenueTotal._sum.unitPriceCents ?? 0;
    const avgOrderCents =
      totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0;
    const categories = productsByCategory.map((c) => c.category ?? "Non classé");

    const prompt = `Voici les données de ventes du vendeur "${vendor.companyName ?? vendor.name}" sur Carlow :

CATALOGUE
- Produits total : ${productCount} (dont ${activeProductCount} actifs)
- Catégories proposées : ${categories.length > 0 ? categories.join(", ") : "aucune"}

COMMANDES (global)
- Nombre de commandes : ${totalOrders}
- Taux d'annulation : ${cancelRate}%
- Chiffre d'affaires total : ${(totalRevenueCents / 100).toFixed(2)} €
- Panier moyen : ${(avgOrderCents / 100).toFixed(2)} €

ACTIVITÉ RÉCENTE
- CA mois précédent : ${((revenueLastMonth._sum.unitPriceCents ?? 0) / 100).toFixed(2)} €
- CA mois en cours : ${((revenueThisMonth._sum.unitPriceCents ?? 0) / 100).toFixed(2)} €

TOP PRODUITS (6 derniers mois)
${
  topProductsData.length > 0
    ? topProductsData
        .map(
          (p, i) =>
            `${i + 1}. ${p.name} (${p.category}) — ${p.quantitySold} vendus — ${(p.revenueCents / 100).toFixed(2)} €`
        )
        .join("\n")
    : "Aucune vente enregistrée"
}

Génère le rapport JSON selon le format demandé.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Service IA non configuré." },
        { status: 503 }
      );
    }

    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      system: [
        {
          type: "text",
          text: REPORT_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: prompt }],
    });

    const raw = msg.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { text: string }).text)
      .join("")
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    let report;
    try {
      report = JSON.parse(raw);
    } catch {
      console.error("[ai/sales-report] JSON parse fail:", raw.slice(0, 200));
      return NextResponse.json(
        { success: false, error: "Rapport mal formaté, réessayez." },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, report, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[api/ai/sales-report] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
