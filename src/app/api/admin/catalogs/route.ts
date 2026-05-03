import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const catalogs = await prisma.catalog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { id: true, name: true, companyName: true, email: true } },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ success: true, catalogs });
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
    const { id, active, name, description } = await req.json();
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (active !== undefined) data.active = Boolean(active);
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;

    const catalog = await prisma.catalog.update({ where: { id }, data });
    return NextResponse.json({ success: true, catalog });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
