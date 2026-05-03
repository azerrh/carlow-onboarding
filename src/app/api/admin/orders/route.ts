import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("statut");

    const orders = await prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { orderedAt: "desc" },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        _count: { select: { lines: true } },
      },
    });

    const stats = {
      total: orders.length,
      enCours: orders.filter((o) => o.status === "EN_COURS").length,
      livrees: orders.filter((o) => o.status === "LIVREE").length,
      annulees: orders.filter((o) => o.status === "ANNULEE").length,
    };

    return NextResponse.json({ success: true, orders, stats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "ID/statut manquants" }, { status: 400 });
    }
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
