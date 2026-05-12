import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

/**
 * Stats globales pour le dashboard admin Carlow.
 *
 * Données agrégées par catégorie :
 *   - Compteurs bruts (vendeurs, acheteurs, produits, commandes, docs)
 *   - Indicateurs financiers (CA total, panier moyen, CA commission marketplace)
 *   - Tendances temporelles (séries 12 mois pour commandes + CA, signups
 *     vendeurs et acheteurs)
 *   - Comparaison vs période précédente (% de croissance 30j vs 30j-60j)
 *   - Tops : 5 vendeurs par CA, 5 catégories par volume, 5 produits par
 *     quantité vendue
 *   - Listes récentes : 5 derniers vendeurs en attente, 5 dernières commandes
 *
 * Performance : tout est exécuté en Promise.all parallèle. Sur une DB
 * réelle de quelques milliers de lignes, ça reste < 1s. Pour du gros volume,
 * il faudra envisager des vues matérialisées Postgres + revalidate cache.
 */
export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const PLATFORM_FEE_PCT = 5; // commission marketplace (cohérent avec checkout)
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prev30 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(now.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const [
      totalVendors,
      activeVendors,
      pendingVendors,
      submittedVendors,
      rejectedVendors,
      totalBuyers,
      newBuyers30,
      totalDocuments,
      totalCertifications,
      totalProducts,
      activeProducts,
      totalOrders,
      orders30,
      ordersPrev30,
      ordersInProgress,
      ordersLivree,
      ordersAnnulee,
      unreadNotifs,
      revenueAgg,
      revenue30Agg,
      revenuePrev30Agg,
      revenueThisMonthAgg,
      latestVendors,
      latestOrdersRaw,
      topVendorsRaw,
      topProductsRaw,
      ordersByStatusGroup,
      ordersTimeseries,
      vendorSignupsTimeseries,
      buyerSignupsTimeseries,
      productsByCategoryRaw,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: "active" } }),
      prisma.vendor.count({ where: { status: "pending" } }),
      prisma.vendor.count({ where: { status: "submitted" } }),
      prisma.vendor.count({ where: { status: "rejected" } }),
      prisma.buyer.count(),
      prisma.buyer.count({ where: { createdAt: { gte: last30 } } }),
      prisma.document.count(),
      prisma.certification.count(),
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { orderedAt: { gte: last30 } } }),
      prisma.order.count({
        where: { orderedAt: { gte: prev30, lt: last30 } },
      }),
      prisma.order.count({ where: { status: "EN_COURS" } }),
      prisma.order.count({ where: { status: "LIVREE" } }),
      prisma.order.count({ where: { status: "ANNULEE" } }),
      prisma.notification.count({ where: { readAt: null } }),
      // CA total (toutes commandes hors annulées)
      prisma.order.aggregate({
        where: { status: { in: ["EN_COURS", "LIVREE"] } },
        _sum: { totalCents: true },
        _avg: { totalCents: true },
      }),
      // CA 30 derniers jours
      prisma.order.aggregate({
        where: {
          status: { in: ["EN_COURS", "LIVREE"] },
          orderedAt: { gte: last30 },
        },
        _sum: { totalCents: true },
      }),
      // CA 30j précédents (J-60 → J-30)
      prisma.order.aggregate({
        where: {
          status: { in: ["EN_COURS", "LIVREE"] },
          orderedAt: { gte: prev30, lt: last30 },
        },
        _sum: { totalCents: true },
      }),
      // CA depuis le 1er du mois
      prisma.order.aggregate({
        where: {
          status: { in: ["EN_COURS", "LIVREE"] },
          orderedAt: { gte: startOfThisMonth },
        },
        _sum: { totalCents: true },
      }),
      // 5 derniers vendeurs en attente
      prisma.vendor.findMany({
        where: { status: { in: ["pending", "submitted"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          createdAt: true,
          status: true,
        },
      }),
      // 5 dernières commandes
      prisma.order.findMany({
        orderBy: { orderedAt: "desc" },
        take: 5,
        include: { buyer: { select: { name: true } } },
      }),
      // Top 5 vendeurs par CA (somme des lignes de commande non annulées)
      prisma.orderLine.groupBy({
        by: ["productId"],
        where: {
          order: { status: { in: ["EN_COURS", "LIVREE"] } },
        },
        _sum: { unitPriceCents: true, quantity: true },
        orderBy: { _sum: { unitPriceCents: "desc" } },
        take: 50, // on prend 50 puis on agrège côté JS par vendeur
      }),
      // Top 5 produits par quantité vendue
      prisma.orderLine.groupBy({
        by: ["productId"],
        where: {
          order: { status: { in: ["EN_COURS", "LIVREE"] } },
        },
        _sum: { quantity: true, unitPriceCents: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      // Commandes par jour sur 12 mois (groupBy date raw)
      prisma.order.findMany({
        where: { orderedAt: { gte: twelveMonthsAgo } },
        select: { orderedAt: true, totalCents: true, status: true },
        orderBy: { orderedAt: "asc" },
      }),
      // Signups vendeurs sur 12 mois
      prisma.vendor.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      // Signups acheteurs sur 12 mois
      prisma.buyer.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      // Produits par catégorie (donut)
      prisma.product.groupBy({
        by: ["category"],
        where: { active: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
    ]);

    /* ---------- Agrégations JS ---------- */

    // Totaux CA
    const totalRevenueCents = revenueAgg._sum.totalCents ?? 0;
    const avgOrderCents = Math.round(revenueAgg._avg.totalCents ?? 0);
    const revenue30Cents = revenue30Agg._sum.totalCents ?? 0;
    const revenuePrev30Cents = revenuePrev30Agg._sum.totalCents ?? 0;
    const revenueThisMonthCents = revenueThisMonthAgg._sum.totalCents ?? 0;

    // Croissance % (30j vs 30j précédents)
    const revenueGrowthPct =
      revenuePrev30Cents > 0
        ? Math.round(
            ((revenue30Cents - revenuePrev30Cents) / revenuePrev30Cents) * 100
          )
        : revenue30Cents > 0
          ? 100
          : 0;

    const ordersGrowthPct =
      ordersPrev30 > 0
        ? Math.round(((orders30 - ordersPrev30) / ordersPrev30) * 100)
        : orders30 > 0
          ? 100
          : 0;

    // Commission marketplace (estimation : 5% du CA validé)
    const commissionRevenueCents = Math.round(
      totalRevenueCents * (PLATFORM_FEE_PCT / 100)
    );

    // Top vendeurs : on aggrège par vendeur en remontant productId → vendorId
    const productIdsForTopVendors = topVendorsRaw.map((r) => r.productId);
    const productVendorMap =
      productIdsForTopVendors.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: productIdsForTopVendors } },
            select: {
              id: true,
              name: true,
              catalog: {
                select: { vendor: { select: { id: true, name: true, companyName: true } } },
              },
            },
          })
        : [];

    const vendorRevenueMap = new Map<
      string,
      { name: string; revenueCents: number; quantity: number }
    >();
    for (const row of topVendorsRaw) {
      const product = productVendorMap.find((p) => p.id === row.productId);
      if (!product) continue;
      const vendor = product.catalog.vendor;
      const name = vendor.companyName ?? vendor.name;
      const existing = vendorRevenueMap.get(vendor.id);
      const cents = row._sum.unitPriceCents ?? 0;
      const qty = row._sum.quantity ?? 0;
      if (existing) {
        existing.revenueCents += cents;
        existing.quantity += qty;
      } else {
        vendorRevenueMap.set(vendor.id, {
          name,
          revenueCents: cents,
          quantity: qty,
        });
      }
    }
    const topVendors = Array.from(vendorRevenueMap.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 5);

    // Top produits : on cherche les noms pour les 5 IDs
    const topProductIds = topProductsRaw.map((r) => r.productId);
    const topProductsInfo =
      topProductIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: topProductIds } },
            select: {
              id: true,
              name: true,
              category: true,
              catalog: {
                select: { vendor: { select: { name: true, companyName: true } } },
              },
            },
          })
        : [];
    const topProducts = topProductsRaw
      .map((r) => {
        const p = topProductsInfo.find((tp) => tp.id === r.productId);
        if (!p) return null;
        const vendor = p.catalog.vendor;
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          vendor: vendor.companyName ?? vendor.name,
          quantity: r._sum.quantity ?? 0,
          revenueCents: r._sum.unitPriceCents ?? 0,
        };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);

    // Statuts commandes (donut)
    const statusMap: Record<string, number> = {};
    for (const row of ordersByStatusGroup) {
      statusMap[row.status] = row._count.id;
    }

    // Séries temporelles : 12 derniers mois, groupé par mois
    const monthsLabels: string[] = [];
    const monthsKeys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsKeys.push(d.toISOString().slice(0, 7)); // "2026-05"
      monthsLabels.push(
        ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"][
          d.getMonth()
        ]!
      );
    }

    function bucketByMonth<T extends { date: Date }>(
      items: T[],
      valueSelector: (item: T) => number
    ): number[] {
      const acc: Record<string, number> = {};
      for (const it of items) {
        const k = it.date.toISOString().slice(0, 7);
        acc[k] = (acc[k] ?? 0) + valueSelector(it);
      }
      return monthsKeys.map((k) => acc[k] ?? 0);
    }

    // Commandes count par mois
    const ordersPerMonth = bucketByMonth(
      ordersTimeseries.map((o) => ({ date: o.orderedAt })),
      () => 1
    );
    // CA par mois (cents) — hors annulées
    const revenuePerMonth = bucketByMonth(
      ordersTimeseries
        .filter((o) => o.status !== "ANNULEE")
        .map((o) => ({ date: o.orderedAt, total: o.totalCents })),
      (o) => o.total
    );
    // Signups vendeurs par mois
    const vendorSignupsPerMonth = bucketByMonth(
      vendorSignupsTimeseries.map((v) => ({ date: v.createdAt })),
      () => 1
    );
    const buyerSignupsPerMonth = bucketByMonth(
      buyerSignupsTimeseries.map((b) => ({ date: b.createdAt })),
      () => 1
    );

    // Catégories
    const totalActiveProducts = activeProducts || 1;
    const productsByCategory = productsByCategoryRaw.map((c) => ({
      category: c.category ?? "Non classé",
      count: c._count.id,
      percent: Math.round((c._count.id / totalActiveProducts) * 100),
    }));

    const latestOrders = latestOrdersRaw.map((o) => ({
      id: o.id,
      client: o.buyer?.name ?? "—",
      date: o.orderedAt,
      status: o.status,
      totalCents: o.totalCents,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        // Compteurs basiques
        totalUsers: totalVendors + totalBuyers,
        totalVendors,
        activeVendors,
        pendingVendors: pendingVendors + submittedVendors,
        submittedVendors,
        rejectedVendors,
        totalBuyers,
        newBuyers30,
        totalProducts,
        activeProducts,
        totalDocuments: totalDocuments + totalCertifications,
        totalOrders,
        orders30,
        ordersPrev30,
        ordersInProgress,
        ordersLivree,
        ordersAnnulee,
        unreadNotifs,
        // Indicateurs financiers
        totalRevenueCents,
        revenue30Cents,
        revenuePrev30Cents,
        revenueThisMonthCents,
        avgOrderCents,
        commissionRevenueCents,
        commissionRatePct: PLATFORM_FEE_PCT,
        // Croissance
        revenueGrowthPct,
        ordersGrowthPct,
      },
      timeseries: {
        labels: monthsLabels,
        orders: ordersPerMonth,
        revenueCents: revenuePerMonth,
        vendorSignups: vendorSignupsPerMonth,
        buyerSignups: buyerSignupsPerMonth,
      },
      topVendors,
      topProducts,
      productsByCategory,
      ordersByStatus: statusMap,
      latestVendors,
      latestOrders,
    });
  } catch (error) {
    console.error("[api/admin/stats] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
