import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            product: {
              include: {
                catalog: { include: { vendor: true } },
              },
            },
          },
        },
        events: {
          orderBy: { createdAt: "asc" },
          select: { id: true, status: true, note: true, createdAt: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande non trouvee" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
