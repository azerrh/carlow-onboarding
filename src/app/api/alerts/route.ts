import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET  /api/alerts?buyerId=<id>   — liste les alertes actives d'un acheteur
 * GET  /api/alerts?email=<email>  — idem, par email (visiteur sans compte)
 * POST /api/alerts                — s'abonner à un produit
 * DELETE /api/alerts?id=<alertId>&email=<email> — se désabonner
 */

/* ── GET ──────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get("buyerId");
  const email = searchParams.get("email");

  if (!buyerId && !email) {
    return NextResponse.json({ error: "buyerId ou email requis" }, { status: 400 });
  }

  try {
    // Si on a un buyerId, on cherche par buyerId OU email du buyer
    let buyerEmail: string | null = null;
    if (buyerId) {
      const b = await prisma.buyer.findUnique({ where: { id: buyerId }, select: { email: true } });
      buyerEmail = b?.email ?? null;
    }

    const alerts = await prisma.productAlert.findMany({
      where: {
        active: true,
        ...(buyerId
          ? { OR: [{ buyerId }, ...(buyerEmail ? [{ buyerEmail }] : [])] }
          : { buyerEmail: email!.toLowerCase().trim() }),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            category: true,
            reference: true,
            photos: { select: { url: true }, orderBy: { primary: "desc" }, take: 1 },
            catalog: { select: { vendor: { select: { name: true, companyName: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, alerts });
  } catch (err) {
    console.error("[api/alerts GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST ─────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, buyerEmail, buyerName, buyerId } = body;

    if (!productId || !buyerEmail || !buyerName) {
      return NextResponse.json({ error: "productId, buyerEmail et buyerName sont requis" }, { status: 400 });
    }

    const email = buyerEmail.toLowerCase().trim();

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, stock: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    // Upsert : si déjà abonné, on réactive l'alerte et on met à jour le snapshot
    const alert = await prisma.productAlert.upsert({
      where: { productId_buyerEmail: { productId, buyerEmail: email } },
      create: {
        productId,
        buyerEmail: email,
        buyerName: buyerName.trim(),
        buyerId: buyerId ?? null,
        priceAtSubscription: product.price,
        stockAtSubscription: product.stock,
        active: true,
      },
      update: {
        active: true,
        priceAtSubscription: product.price,
        stockAtSubscription: product.stock,
        buyerName: buyerName.trim(),
        buyerId: buyerId ?? undefined,
      },
    });

    return NextResponse.json({ success: true, alert });
  } catch (err) {
    console.error("[api/alerts POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── DELETE ───────────────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const alertId = searchParams.get("id");
  const email = searchParams.get("email");

  if (!alertId || !email) {
    return NextResponse.json({ error: "id et email requis" }, { status: 400 });
  }

  try {
    // Vérifie que l'email correspond bien à l'alerte (sécurité minimale)
    const existing = await prisma.productAlert.findFirst({
      where: { id: alertId, buyerEmail: email.toLowerCase().trim() },
    });
    if (!existing) {
      return NextResponse.json({ error: "Alerte introuvable" }, { status: 404 });
    }

    await prisma.productAlert.update({
      where: { id: alertId },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/alerts DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
