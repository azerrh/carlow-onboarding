import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("id") ?? searchParams.get("buyerId");
    if (!buyerId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        _count: { select: { orders: true, notifications: true } },
      },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Acheteur non trouve" }, { status: 404 });
    }

    const [
      totalSpent,
      ordersInProgress,
      recentOrders,
      unreadNotifs,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { buyerId },
        _sum: { totalCents: true },
      }),
      prisma.order.count({
        where: { buyerId, status: "EN_COURS" },
      }),
      prisma.order.findMany({
        where: { buyerId },
        orderBy: { orderedAt: "desc" },
        take: 5,
        include: {
          lines: {
            include: {
              product: {
                select: {
                  name: true,
                  catalog: {
                    select: {
                      vendor: { select: { name: true, companyName: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.notification.count({
        where: { buyerId, readAt: null },
      }),
    ]);

    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      where: { buyerId },
      _count: { id: true },
    });

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

    return NextResponse.json({
      success: true,
      buyer,
      stats: {
        totalSpentCents: totalSpent._sum.totalCents ?? 0,
        ordersInProgress,
        ordersByStatus: statusMap,
        unreadNotifs,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        totalCents: o.totalCents,
        orderedAt: o.orderedAt,
        lines: o.lines.map((l) => ({
          productName: l.product.name,
          vendor: l.product.catalog.vendor.companyName ?? l.product.catalog.vendor.name,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
        })),
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
