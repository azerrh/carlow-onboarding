import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("id") ?? searchParams.get("buyerId");
    if (!buyerId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { buyerId },
      orderBy: { orderedAt: "desc" },
      include: {
        lines: {
          include: {
            product: {
              include: {
                catalog: {
                  select: {
                    name: true,
                    vendor: { select: { name: true, companyName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
