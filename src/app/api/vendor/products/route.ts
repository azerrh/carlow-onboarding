import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("id") ?? searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const catalogId = searchParams.get("catalogId");

    const products = await prisma.product.findMany({
      where: {
        catalog: {
          vendorId,
          ...(catalogId ? { id: catalogId } : {}),
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        catalog: { select: { id: true, name: true } },
        photos: { orderBy: { order: "asc" }, take: 1 },
        _count: { select: { photos: true } },
      },
    });

    const stats = {
      total: products.length,
      active: products.filter((p) => p.active).length,
      noPhoto: products.filter((p) => p._count.photos === 0).length,
      zeroStock: products.filter((p) => p.stock === 0).length,
    };

    return NextResponse.json({ success: true, products, stats });
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
    const {
      catalogId,
      name,
      reference,
      description,
      price,
      weightKg,
      dimensions,
      category,
      stock,
      active,
    } = body;

    if (!catalogId || !name || price == null) {
      return NextResponse.json(
        { error: "Champs requis manquants (catalogId, name, price)" },
        { status: 400 }
      );
    }

    const catalog = await prisma.catalog.findFirst({
      where: { id: catalogId, vendorId },
    });
    if (!catalog) {
      return NextResponse.json({ error: "Catalogue non trouve" }, { status: 404 });
    }

    const product = await prisma.product.create({
      data: {
        catalogId,
        name,
        reference: reference || null,
        description: description || null,
        price: Number(price),
        weightKg: weightKg != null ? Number(weightKg) : null,
        dimensions: dimensions || null,
        category: category || null,
        stock: stock != null ? Number(stock) : 0,
        active: active ?? true,
      },
    });

    return NextResponse.json({ success: true, product });
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
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: "ID produit manquant" }, { status: 400 });
    }

    const existing = await prisma.product.findFirst({
      where: { id, catalog: { vendorId } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Produit non trouve" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    for (const k of ["name", "reference", "description", "category", "dimensions"]) {
      if (rest[k] !== undefined) data[k] = rest[k];
    }
    if (rest.price !== undefined) data.price = Number(rest.price);
    if (rest.weightKg !== undefined)
      data.weightKg = rest.weightKg === null ? null : Number(rest.weightKg);
    if (rest.stock !== undefined) data.stock = Number(rest.stock);
    if (rest.active !== undefined) data.active = Boolean(rest.active);

    const product = await prisma.product.update({ where: { id }, data });
    return NextResponse.json({ success: true, product });
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

    const id = searchParams.get("productId");
    if (!id) {
      return NextResponse.json({ error: "ID produit manquant" }, { status: 400 });
    }

    const existing = await prisma.product.findFirst({
      where: { id, catalog: { vendorId } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Produit non trouve" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}
