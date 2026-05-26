import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

/**
 * Analytics avancés admin Carlow.
 *
 * GET /api/admin/analytics?period=7d|30d|90d|12m
 *
 * Retourne des indicateurs plus poussés que /api/admin/stats :
 *  - Funnel d'onboarding vendeurs (combien à chaque étape)
 *  - Heatmap commandes (jour de semaine × heure de la journée)
 *  - Indicateurs de santé plateforme (% complétion produits, % vendeurs actifs)
 *  - Performance par vendeur (table avec CA, AOV, taux livraison, etc.)
 *  - Distribution des prix des produits (histogramme)
 *  - Cohorts d'acquisition acheteurs (6 derniers mois)
 *  - Conversion funnel acheteur (compte → favori → panier → commande)
 */

export const runtime = "nodejs";

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "12m": {
      const d = new Date(now);
      d.setMonth(now.getMonth() - 11);
      d.setDate(1);
      return d;
    }
    case "30d":
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "30d";
    const startDate = getStartDate(period);

    const [
      // Funnel onboarding vendeur
      vendorsByStep,
      vendorsTotal,
      vendorsActive,
      // Heatmap commandes (toutes les commandes de la période)
      ordersForHeatmap,
      // Santé plateforme
      productsWithPhoto,
      productsTotalActive,
      productsWithDescription,
      productsWithStock,
      productsWithCategory,
      productsWithVolumeDiscounts,
      // Performance vendeurs (top 10)
      vendorPerformanceRaw,
      // Distribution prix
      pricesRaw,
      // Conversion funnel acheteur
      buyersTotal,
      buyersWithFavorites,
      buyersWithOrders,
      buyersWithReviews,
      // Acheteurs récurrents
      ordersByBuyerRaw,
      // Avis & qualité
      reviewsAgg,
      reviewsByRatingRaw,
      // Catalogues actifs
      catalogsTotal,
      catalogsActive,
      // Documents validés
      docsTotal,
      certificationsTotal,
      // Commandes annulées
      cancelledOrdersInPeriod,
      totalOrdersInPeriod,
    ] = await Promise.all([
      prisma.vendor.groupBy({
        by: ["onboardingStep"],
        _count: { id: true },
      }),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: "active" } }),
      prisma.order.findMany({
        where: { orderedAt: { gte: startDate } },
        select: { orderedAt: true, totalCents: true, status: true, buyerId: true },
      }),
      prisma.product.count({
        where: { active: true, photos: { some: {} } },
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.product.count({
        where: { active: true, description: { not: null } },
      }),
      prisma.product.count({
        where: { active: true, stock: { gt: 0 } },
      }),
      prisma.product.count({
        where: { active: true, category: { not: null } },
      }),
      prisma.product.count({
        where: { active: true, volumeDiscounts: { some: {} } },
      }),
      // Performance vendeurs : on récupère tous les vendeurs actifs et on
      // calcule en JS (plus simple que faire 3 groupBy chaînés)
      prisma.vendor.findMany({
        where: { status: "active" },
        select: {
          id: true,
          name: true,
          companyName: true,
          createdAt: true,
          catalogs: {
            select: {
              products: {
                select: {
                  id: true,
                  active: true,
                  stock: true,
                  orderLines: {
                    where: {
                      order: { orderedAt: { gte: startDate } },
                    },
                    select: {
                      quantity: true,
                      unitPriceCents: true,
                      order: { select: { status: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.product.findMany({
        where: { active: true },
        select: { price: true },
      }),
      prisma.buyer.count(),
      prisma.buyer.count({ where: { favorites: { some: {} } } }),
      prisma.buyer.count({ where: { orders: { some: {} } } }),
      prisma.buyer.count({ where: { reviews: { some: {} } } }),
      prisma.order.groupBy({
        by: ["buyerId"],
        _count: { id: true },
      }),
      prisma.review.aggregate({
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        _count: { id: true },
      }),
      prisma.catalog.count(),
      prisma.catalog.count({ where: { active: true } }),
      prisma.document.count(),
      prisma.certification.count(),
      prisma.order.count({
        where: { orderedAt: { gte: startDate }, status: "ANNULEE" },
      }),
      prisma.order.count({ where: { orderedAt: { gte: startDate } } }),
    ]);

    /* ---------- Funnel onboarding vendeur ---------- */
    // Étapes : 1=Compte, 2=Société, 3=Documents, 4=Certifs, 5=Logistique, 6=Validé
    const stepLabels = [
      "Compte créé",
      "Société",
      "Documents",
      "Certifications",
      "Logistique",
      "Activé",
    ];
    const stepCounts = new Array(6).fill(0);
    for (const row of vendorsByStep) {
      const step = row.onboardingStep;
      // Tout vendeur ayant atteint l'étape N a forcément passé les étapes < N
      for (let i = 0; i < Math.min(step, 6); i++) {
        stepCounts[i] += row._count.id;
      }
    }
    // L'étape "Activé" = vendeur avec status="active"
    stepCounts[5] = vendorsActive;
    const funnel = stepLabels.map((label, i) => ({
      step: label,
      count: stepCounts[i],
      // Taux de passage à cette étape (% du total compte créé)
      ratePct:
        stepCounts[0] > 0
          ? Math.round((stepCounts[i] / stepCounts[0]) * 100)
          : 0,
    }));

    /* ---------- Heatmap commandes (jour × heure) ---------- */
    // 7 jours × 24 heures = 168 cases
    const heatmap: number[][] = Array.from({ length: 7 }, () =>
      new Array(24).fill(0)
    );
    for (const o of ordersForHeatmap) {
      const d = new Date(o.orderedAt);
      // getDay() : 0 = dimanche, 1 = lundi... on remap pour lundi=0
      const dow = (d.getDay() + 6) % 7;
      const hour = d.getHours();
      heatmap[dow][hour]++;
    }
    const heatmapMax = Math.max(1, ...heatmap.flat());

    /* ---------- Indicateurs de santé ---------- */
    const totalActiveOr1 = productsTotalActive || 1;
    const health = {
      productsWithPhotoPct: Math.round(
        (productsWithPhoto / totalActiveOr1) * 100
      ),
      productsWithDescriptionPct: Math.round(
        (productsWithDescription / totalActiveOr1) * 100
      ),
      productsWithStockPct: Math.round(
        (productsWithStock / totalActiveOr1) * 100
      ),
      productsWithCategoryPct: Math.round(
        (productsWithCategory / totalActiveOr1) * 100
      ),
      productsWithVolumeDiscountsPct: Math.round(
        (productsWithVolumeDiscounts / totalActiveOr1) * 100
      ),
      activeVendorsPct:
        vendorsTotal > 0
          ? Math.round((vendorsActive / vendorsTotal) * 100)
          : 0,
      activeCatalogsPct:
        catalogsTotal > 0
          ? Math.round((catalogsActive / catalogsTotal) * 100)
          : 0,
      cancellationRatePct:
        totalOrdersInPeriod > 0
          ? Math.round((cancelledOrdersInPeriod / totalOrdersInPeriod) * 100)
          : 0,
    };

    /* ---------- Performance vendeurs (top 10) ---------- */
    const vendorPerformance = vendorPerformanceRaw
      .map((v) => {
        let totalRevenue = 0;
        let totalOrders = 0;
        let totalDelivered = 0;
        let totalCancelled = 0;
        let totalQty = 0;
        let activeProducts = 0;
        let stockedProducts = 0;
        let totalProducts = 0;
        for (const cat of v.catalogs) {
          for (const p of cat.products) {
            totalProducts++;
            if (p.active) activeProducts++;
            if (p.stock > 0) stockedProducts++;
            for (const ol of p.orderLines) {
              totalRevenue += ol.unitPriceCents * ol.quantity;
              totalOrders++;
              totalQty += ol.quantity;
              if (ol.order.status === "LIVREE") totalDelivered++;
              else if (ol.order.status === "ANNULEE") totalCancelled++;
            }
          }
        }
        return {
          id: v.id,
          name: v.companyName ?? v.name,
          createdAt: v.createdAt,
          totalProducts,
          activeProducts,
          stockedProducts,
          totalOrders,
          totalQty,
          totalRevenueCents: totalRevenue,
          aovCents: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
          deliveryRatePct:
            totalOrders > 0
              ? Math.round((totalDelivered / totalOrders) * 100)
              : 0,
          cancellationRatePct:
            totalOrders > 0
              ? Math.round((totalCancelled / totalOrders) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.totalRevenueCents - a.totalRevenueCents)
      .slice(0, 10);

    /* ---------- Distribution des prix (histogramme) ---------- */
    // Buckets : 0-50, 50-100, 100-250, 250-500, 500-1k, 1k-2.5k, 2.5k-5k, 5k+
    const priceBuckets = [
      { label: "< 50€", max: 50, count: 0 },
      { label: "50-100€", max: 100, count: 0 },
      { label: "100-250€", max: 250, count: 0 },
      { label: "250-500€", max: 500, count: 0 },
      { label: "500-1k€", max: 1000, count: 0 },
      { label: "1k-2.5k€", max: 2500, count: 0 },
      { label: "2.5k-5k€", max: 5000, count: 0 },
      { label: "> 5k€", max: Infinity, count: 0 },
    ];
    for (const p of pricesRaw) {
      const bucket = priceBuckets.find((b) => p.price < b.max);
      if (bucket) bucket.count++;
    }
    const totalPriceCount = pricesRaw.length || 1;
    const priceDistribution = priceBuckets.map((b) => ({
      label: b.label,
      count: b.count,
      percent: Math.round((b.count / totalPriceCount) * 100),
    }));

    /* ---------- Conversion funnel acheteur ---------- */
    const buyerFunnel = [
      { step: "Comptes créés", count: buyersTotal, pct: 100 },
      {
        step: "Ont mis en favori",
        count: buyersWithFavorites,
        pct:
          buyersTotal > 0
            ? Math.round((buyersWithFavorites / buyersTotal) * 100)
            : 0,
      },
      {
        step: "Ont commandé",
        count: buyersWithOrders,
        pct:
          buyersTotal > 0
            ? Math.round((buyersWithOrders / buyersTotal) * 100)
            : 0,
      },
      {
        step: "Ont laissé un avis",
        count: buyersWithReviews,
        pct:
          buyersTotal > 0
            ? Math.round((buyersWithReviews / buyersTotal) * 100)
            : 0,
      },
    ];

    /* ---------- Acheteurs récurrents ---------- */
    const uniqueBuyers = ordersByBuyerRaw.length;
    const repeatBuyers = ordersByBuyerRaw.filter((b) => b._count.id > 1).length;
    const repeatRatePct =
      uniqueBuyers > 0 ? Math.round((repeatBuyers / uniqueBuyers) * 100) : 0;
    const avgOrdersPerBuyer =
      uniqueBuyers > 0
        ? Math.round(
            (ordersByBuyerRaw.reduce((s, b) => s + b._count.id, 0) /
              uniqueBuyers) *
              10
          ) / 10
        : 0;

    /* ---------- Distribution des avis ---------- */
    const reviewsByRating = [5, 4, 3, 2, 1].map((rating) => {
      const row = reviewsByRatingRaw.find((r) => r.rating === rating);
      const count = row?._count.id ?? 0;
      const total = reviewsAgg._count._all || 1;
      return {
        rating,
        count,
        percent: Math.round((count / total) * 100),
      };
    });

    return NextResponse.json({
      success: true,
      period,
      ordersInPeriod: ordersForHeatmap.length,
      onboardingFunnel: funnel,
      heatmap: { values: heatmap, max: heatmapMax },
      health,
      vendorPerformance,
      priceDistribution,
      buyerFunnel,
      buyerLoyalty: {
        uniqueBuyers,
        repeatBuyers,
        repeatRatePct,
        avgOrdersPerBuyer,
      },
      reviewsByRating,
      reviewsAggregate: {
        average:
          reviewsAgg._avg.rating !== null
            ? Math.round(reviewsAgg._avg.rating * 10) / 10
            : 0,
        count: reviewsAgg._count._all,
      },
      catalog: {
        totalProducts: productsTotalActive,
        totalCatalogs: catalogsTotal,
        activeCatalogs: catalogsActive,
        totalDocuments: docsTotal,
        totalCertifications: certificationsTotal,
      },
    });
  } catch (error) {
    console.error("[api/admin/analytics] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
