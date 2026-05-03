import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

/**
 * Stats globales pour le dashboard admin.
 */
export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const [
      totalVendors,
      pendingVendors,
      submittedVendors,
      totalBuyers,
      totalDocuments,
      totalProducts,
      activeProducts,
      totalOrders,
      ordersInProgress,
      unreadNotifs,
      latestVendors,
      latestOrdersRaw,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: "pending" } }),
      prisma.vendor.count({ where: { status: "submitted" } }),
      prisma.buyer.count(),
      prisma.document.count(),
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "EN_COURS" } }),
      prisma.notification.count({ where: { readAt: null } }),
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
      prisma.order.findMany({
        orderBy: { orderedAt: "desc" },
        take: 5,
        include: { buyer: { select: { name: true } } },
      }),
    ]);

    const latestOrders = latestOrdersRaw.map((o) => ({
      id: o.id,
      client: o.buyer?.name ?? "—",
      date: o.orderedAt,
      status: o.status,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalVendors + totalBuyers,
        totalVendors,
        pendingVendors: pendingVendors + submittedVendors,
        submittedVendors,
        totalBuyers,
        totalProducts,
        activeProducts,
        totalOrders,
        ordersInProgress,
        totalDocuments,
        unreadNotifs,
      },
      latestVendors,
      latestOrders,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
