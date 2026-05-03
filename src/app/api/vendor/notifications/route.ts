import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") ?? searchParams.get("vendorId");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const notifications = await prisma.notification.findMany({
      where: { vendorId: id },
      orderBy: { sentAt: "desc" },
      take: 20,
    });

    const unreadCount = notifications.filter((n) => n.readAt === null).length;

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        content: n.content,
        read: n.readAt !== null,
        sentAt: n.sentAt,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, notificationId } = body;

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: { vendorId: id, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
