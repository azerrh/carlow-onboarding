import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

/**
 * Initialisation Stripe : on FAIL-FAST si la clé est absente plutôt que
 * d'utiliser un fallback "sk_test_placeholder" qui masquerait le bug.
 */
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY manquant — configurer la variable d'environnement."
    );
  }
  return new Stripe(key);
}

interface ClientItem {
  productId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items,
      buyerEmail,
      buyerName,
      buyerAddress,
      buyerPhone,
      buyerId, // optionnel : si l'acheteur est déjà authentifié
    } = body as {
      items?: ClientItem[];
      buyerEmail?: string;
      buyerName?: string;
      buyerAddress?: string;
      buyerPhone?: string;
      buyerId?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Panier vide ou invalide" },
        { status: 400 }
      );
    }
    if (!buyerEmail || typeof buyerEmail !== "string") {
      return NextResponse.json(
        { error: "Email acheteur requis" },
        { status: 400 }
      );
    }

    // ⚠️ SÉCURITÉ : on ne fait JAMAIS confiance au prix envoyé par le client.
    // On relit chaque produit en DB avec le prix officiel et on valide
    // disponibilité (active=true), stock suffisant, et statut du vendeur.
    const productIds = items
      .map((i) => (typeof i.productId === "string" ? i.productId : null))
      .filter((id): id is string => !!id);

    if (productIds.length !== items.length) {
      return NextResponse.json(
        { error: "ProductId manquant sur certaines lignes" },
        { status: 400 }
      );
    }

    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        catalog: {
          select: {
            active: true,
            vendor: {
              select: {
                id: true,
                status: true,
                stripeAccountId: true,
                stripeChargesEnabled: true,
              },
            },
          },
        },
      },
    });

    const productById = new Map(dbProducts.map((p) => [p.id, p]));

    // Construit les line_items Stripe à partir des données DB UNIQUEMENT.
    // Le typage est inféré (Stripe v22 a une déclaration de namespace plus
    // restrictive — éviter `Stripe.Checkout.SessionCreateParams.LineItem`
    // qui n'est pas réexporté proprement dans tous les sous-bundles ESM).
    const stripeLineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string };
        unit_amount: number;
      };
      quantity: number;
    }> = [];
    const orderItems: {
      productId: string;
      quantity: number;
      unitPriceCents: number;
    }[] = [];

    for (const item of items) {
      const product = productById.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Produit introuvable : ${item.productId}` },
          { status: 400 }
        );
      }
      if (!product.active) {
        return NextResponse.json(
          { error: `Produit indisponible : ${product.name}` },
          { status: 400 }
        );
      }
      if (!product.catalog.active) {
        return NextResponse.json(
          { error: `Catalogue indisponible pour : ${product.name}` },
          { status: 400 }
        );
      }
      if (product.catalog.vendor.status !== "active") {
        return NextResponse.json(
          { error: `Vendeur non actif pour : ${product.name}` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      if (qty > product.stock) {
        return NextResponse.json(
          {
            error: `Stock insuffisant pour ${product.name} (disponible : ${product.stock})`,
          },
          { status: 400 }
        );
      }

      const unitPriceCents = Math.round(product.price * 100);
      stripeLineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: product.name },
          unit_amount: unitPriceCents,
        },
        quantity: qty,
      });
      orderItems.push({
        productId: product.id,
        quantity: qty,
        unitPriceCents,
      });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const stripe = getStripe();

    /* ----- Stripe Connect : destination charges si panier mono-vendeur ----- */
    // Stripe Connect ne supporte qu'UNE destination par session de checkout.
    // Si le panier contient des produits de plusieurs vendeurs, on retombe
    // sur le mode legacy (tout encaissé par la plateforme, à splitter
    // manuellement plus tard). Sinon, on route directement vers le vendeur
    // avec une commission marketplace de 5%.
    const PLATFORM_FEE_PERCENT = 5;
    const uniqueVendorIds = new Set(
      orderItems
        .map((oi) => productById.get(oi.productId)?.catalog.vendor.id)
        .filter((v): v is string => !!v)
    );

    let connectOptions: {
      payment_intent_data?: {
        application_fee_amount: number;
        transfer_data: { destination: string };
      };
    } = {};

    if (uniqueVendorIds.size === 1) {
      const onlyVendor = productById.get(orderItems[0].productId)?.catalog.vendor;
      if (
        onlyVendor?.stripeAccountId &&
        onlyVendor.stripeChargesEnabled
      ) {
        const totalCents = orderItems.reduce(
          (s, oi) => s + oi.unitPriceCents * oi.quantity,
          0
        );
        const feeCents = Math.round(totalCents * (PLATFORM_FEE_PERCENT / 100));
        connectOptions = {
          payment_intent_data: {
            application_fee_amount: feeCents,
            transfer_data: { destination: onlyVendor.stripeAccountId },
          },
        };
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: stripeLineItems,
      mode: "payment",
      customer_email: buyerEmail,
      ...connectOptions,
      metadata: {
        // ⚠️ Toutes les valeurs metadata Stripe doivent être des strings ≤ 500 chars.
        // L'email est aussi envoyé via customer_email mais on le double-stocke ici
        // pour le retrouver plus facilement dans le webhook.
        buyerEmail,
        buyerName: buyerName ?? "",
        buyerPhone: buyerPhone ?? "",
        buyerAddress: buyerAddress ?? "",
        buyerId: buyerId ?? "",
        items: JSON.stringify(orderItems),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/marketplace?canceled=true`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("[checkout/stripe] error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
