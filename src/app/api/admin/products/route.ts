import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        catalog: {
          select: {
            id: true,
            name: true,
            vendor: { select: { name: true, companyName: true } },
          },
        },
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
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
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
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    for (const k of [
      "name",
      "reference",
      "description",
      "category",
      "dimensions",
    ]) {
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
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}
