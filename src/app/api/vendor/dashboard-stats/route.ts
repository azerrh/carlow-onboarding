import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") ?? searchParams.get("vendorId");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        onboardingStep: true,
        companyName: true,
        createdAt: true,
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendeur non trouve" }, { status: 404 });
    }

    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const [
      catalogCount,
      productCount,
      activeProductCount,
      orderCount,
      totalRevenue,
      documentCount,
      certificationCount,
      unreadNotifs,
      recentOrdersRaw,
      topProducts,
      ordersByStatus,
      revenueByMonth,
    ] = await Promise.all([
      prisma.catalog.count({ where: { vendorId: id } }),
      prisma.product.count({
        where: { catalog: { vendorId: id } },
      }),
      prisma.product.count({
        where: { catalog: { vendorId: id }, active: true },
      }),
      prisma.orderLine.count({
        where: {
          product: { catalog: { vendorId: id } },
        },
      }),
      prisma.orderLine.aggregate({
        where: { product: { catalog: { vendorId: id } } },
        _sum: { unitPriceCents: true },
      }),
      prisma.document.count({ where: { vendorId: id } }),
      prisma.certification.count({ where: { vendorId: id } }),
      prisma.notification.count({
        where: { vendorId: id, readAt: null },
      }),
      prisma.orderLine.findMany({
        where: { product: { catalog: { vendorId: id } } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          product: { select: { name: true } },
          order: {
            select: {
              id: true,
              status: true,
              orderedAt: true,
              buyer: { select: { name: true } },
            },
          },
        },
      }),
      prisma.orderLine.groupBy({
        by: ["productId"],
        where: {
          product: { catalog: { vendorId: id } },
          createdAt: { gte: sixMonthsAgo },
        },
        _sum: { quantity: true, unitPriceCents: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: {
          lines: {
            some: { product: { catalog: { vendorId: id } } },
          },
        },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ["orderedAt"],
        where: {
          lines: {
            some: {
              product: { catalog: { vendorId: id } },
              createdAt: { gte: sixMonthsAgo },
            },
          },
        },
        _sum: { totalCents: true },
        orderBy: { orderedAt: "asc" },
      }),
    ]);

    const recentOrders = recentOrdersRaw.map((ol) => ({
      orderId: ol.order.id,
      buyer: ol.order.buyer?.name ?? "—",
      productName: ol.product.name,
      quantity: ol.quantity,
      unitPrice: ol.unitPriceCents,
      status: ol.order.status,
      orderedAt: ol.order.orderedAt,
    }));

    const topProductsData = await Promise.all(
      topProducts.map(async (tp) => {
        const product = await prisma.product.findUnique({
          where: { id: tp.productId },
          select: { name: true, category: true },
        });
        return {
          name: product?.name ?? "Inconnu",
          category: product?.category ?? "—",
          quantitySold: tp._sum.quantity ?? 0,
          revenueCents: tp._sum.unitPriceCents ?? 0,
        };
      })
    );

    const statusMap: Record<string, { count: number; label: string }> = {};
    for (const s of ordersByStatus) {
      const label =
        s.status === "EN_COURS"
          ? "En cours"
          : s.status === "LIVREE"
            ? "Livree"
            : s.status === "ANNULEE"
              ? "Annulee"
              : s.status;
      statusMap[label] = { count: s._count.id, label };
    }

    const monthlyRevenueMap: Record<string, number> = {};
    for (const r of revenueByMonth) {
      const monthKey = new Date(r.orderedAt).toISOString().slice(0, 7);
      monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] ?? 0) + (r._sum.totalCents ?? 0);
    }

    const months: { label: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const monthLabels = [
        "Jan", "Fev", "Mar", "Avr", "Mai", "Jun",
        "Jul", "Aou", "Sep", "Oct", "Nov", "Dec",
      ];
      months.push({
        label: monthLabels[d.getMonth()],
        revenue: monthlyRevenueMap[key] ?? 0,
      });
    }

    const totalRevenueCents = totalRevenue._sum.unitPriceCents ?? 0;
    const avgOrderValueCents = orderCount > 0 ? Math.round(totalRevenueCents / orderCount) : 0;

    return NextResponse.json({
      success: true,
      vendor,
      stats: {
        catalogCount,
        productCount,
        activeProductCount,
        orderCount,
        totalRevenueCents,
        avgOrderValueCents,
        documentCount,
        certificationCount,
        unreadNotifs,
      },
      recentOrders,
      topProducts: topProductsData,
      ordersByStatus: statusMap,
      monthlyRevenue: months,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
