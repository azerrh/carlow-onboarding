import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const notifs = await prisma.notification.findMany({
      orderBy: { sentAt: "desc" },
      include: {
        vendor: { select: { name: true, email: true } },
        buyer: { select: { name: true, email: true } },
      },
    });

    const stats = {
      total: notifs.length,
      unread: notifs.filter((n) => n.readAt === null).length,
      today: notifs.filter((n) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return n.sentAt >= today;
      }).length,
    };

    return NextResponse.json({ success: true, notifications: notifs, stats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}
