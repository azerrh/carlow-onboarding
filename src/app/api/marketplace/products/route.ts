import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const vendorId = searchParams.get("vendorId");
    const activeOnly = searchParams.get("active") !== "false";

    const where: Record<string, unknown> = {};
    if (activeOnly) where.active = true;
    if (category) where.category = category;
    if (vendorId) where.catalog = { vendorId };

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        catalog: {
          select: {
            id: true,
            name: true,
            vendor: { select: { id: true, name: true, companyName: true } },
          },
        },
        photos: { orderBy: { order: "asc" }, take: 1 },
      },
    });

    const filtered = products.filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.reference ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
      );
    });

    const categories = Array.from(
      new Set(
        products
          .map((p) => p.category)
          .filter((c): c is string => c !== null && c !== "")
      )
    );

    return NextResponse.json({
      success: true,
      products: filtered.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        reference: p.reference,
        stock: p.stock,
        active: p.active,
        imageUrl: p.photos[0]?.url ?? null,
        vendor: {
          id: p.catalog.vendor.id,
          name: p.catalog.vendor.companyName ?? p.catalog.vendor.name,
        },
        catalog: {
          id: p.catalog.id,
          name: p.catalog.name,
        },
      })),
      categories,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
