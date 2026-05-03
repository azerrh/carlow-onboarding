import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Webhook signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const metadata = session.metadata;
    if (!metadata?.items) {
      return NextResponse.json({ error: "Metadata manquante" }, { status: 400 });
    }

    const items = JSON.parse(metadata.items) as {
      productId: string;
      quantity: number;
      unitPriceCents: number;
    }[];

    let buyerId = metadata.buyerEmail
      ? (await prisma.buyer.findUnique({ where: { email: metadata.buyerEmail } }))?.id
      : null;

    if (!buyerId) {
      const buyer = await prisma.buyer.create({
        data: {
          name: metadata.buyerName || "Client",
          email: metadata.buyerEmail || "",
          password: "",
          address: metadata.buyerAddress || null,
          phone: metadata.buyerPhone || null,
        },
      });
      buyerId = buyer.id;
    }

    const totalCents = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

    const order = await prisma.order.create({
      data: {
        buyerId,
        status: "EN_COURS",
        totalCents,
        lines: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
          })),
        },
      },
    });

    await prisma.notification.create({
      data: {
        buyerId,
        content: `Votre commande #${order.id.slice(0, 8)} a ete confirmee pour ${(totalCents / 100).toFixed(2)} EUR.`,
      },
    });
  }

  return NextResponse.json({ success: true });
}
