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
      return NextResponse.json({ error: "Vendeur non trouvé" }, { status: 404 });
    }

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
        take: 5,
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

    return NextResponse.json({
      success: true,
      vendor,
      stats: {
        catalogCount,
        productCount,
        activeProductCount,
        orderCount,
        totalRevenueCents: totalRevenue._sum.unitPriceCents ?? 0,
        documentCount,
        certificationCount,
        unreadNotifs,
      },
      recentOrders,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
