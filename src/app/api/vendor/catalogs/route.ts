import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("id") ?? searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const catalogs = await prisma.catalog.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ success: true, catalogs });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("id") ?? searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const body = await req.json();
    const { name, description } = body;
    if (!name) {
      return NextResponse.json(
        { error: "Nom du catalogue requis" },
        { status: 400 }
      );
    }

    const catalog = await prisma.catalog.create({
      data: {
        vendorId,
        name,
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, catalog });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("id") ?? searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const body = await req.json();
    const { id, name, description, active } = body;
    if (!id) {
      return NextResponse.json({ error: "ID catalogue manquant" }, { status: 400 });
    }

    const existing = await prisma.catalog.findFirst({
      where: { id, vendorId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Catalogue non trouve" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (active !== undefined) data.active = Boolean(active);

    const catalog = await prisma.catalog.update({ where: { id }, data });
    return NextResponse.json({ success: true, catalog });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("id") ?? searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const id = searchParams.get("catalogId");
    if (!id) {
      return NextResponse.json({ error: "ID catalogue manquant" }, { status: 400 });
    }

    const existing = await prisma.catalog.findFirst({
      where: { id, vendorId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Catalogue non trouve" }, { status: 404 });
    }

    await prisma.catalog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}
