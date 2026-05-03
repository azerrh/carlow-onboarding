import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, buyerEmail, buyerName, buyerAddress, buyerPhone } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Panier vide ou invalide" },
        { status: 400 }
      );
    }

    const lineItems = items.map((item: { productId: string; name: string; price: number; quantity: number }) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const totalCents = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity * 100,
      0
    );

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: buyerEmail || undefined,
      metadata: {
        buyerName: buyerName || "",
        buyerPhone: buyerPhone || "",
        buyerAddress: buyerAddress || "",
        items: JSON.stringify(
          items.map((i: { productId: string; quantity: number; price: number }) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPriceCents: Math.round(i.price * 100),
          }))
        ),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/marketplace?canceled=true`,
    });

    return NextResponse.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la creation du paiement" },
      { status: 500 }
    );
  }
}
