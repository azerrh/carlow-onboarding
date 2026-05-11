import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  sendOrderConfirmationEmail,
  sendVendorNewOrderEmail,
} from "@/lib/email";

/**
 * Webhook Stripe — idempotent et sécurisé.
 *
 * Garde-fous :
 *   1. La signature est vérifiée via STRIPE_WEBHOOK_SECRET.
 *   2. L'idempotence repose sur Order.stripeSessionId @unique : si la session
 *      a déjà donné lieu à une commande, on ignore le rejeu silencieusement.
 *   3. On ne crée JAMAIS un Buyer fantôme avec mot de passe vide. Si l'acheteur
 *      n'est pas authentifié et n'a pas de compte préexistant, on rattache la
 *      commande à un compte "guest" identifié par son email (un Buyer est créé
 *      sans password, mais avec un mot de passe aléatoire haché côté serveur).
 *   4. Fail-fast sur les variables d'env manquantes (au lieu d'un fallback "").
 */

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquant.");
  }
  return new Stripe(key);
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET manquant.");
  }
  return secret;
}

/**
 * Crée un mot de passe aléatoire haché. Sert quand on doit créer un Buyer
 * "guest" depuis un paiement sans compte préalable. Le buyer ne pourra pas
 * se connecter sans passer par "mot de passe oublié" — c'est l'intention.
 */
async function generateGuestPasswordHash(): Promise<string> {
  // On évite l'import direct de bcrypt en haut de fichier pour rester compatible
  // avec les routes Edge si ce webhook venait à y être déployé un jour.
  const bcrypt = await import("bcryptjs");
  const random = Math.random().toString(36) + Date.now().toString(36);
  return bcrypt.hash(random, 12);
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = getWebhookSecret();

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Signature Stripe manquante" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook/stripe] signature invalide:", err);
    return NextResponse.json(
      { error: "Webhook signature invalide" },
      { status: 400 }
    );
  }

  if (event.type !== "checkout.session.completed") {
    // Autre type d'événement — on accuse réception sans agir.
    return NextResponse.json({ success: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // 1) Idempotence — si on a déjà créé une commande pour cette session,
  //    on accuse réception sans rien refaire (évite les doublons en cas de rejeu).
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({
      success: true,
      idempotent: true,
      orderId: existing.id,
    });
  }

  const metadata = session.metadata ?? {};
  if (!metadata.items) {
    console.error("[webhook/stripe] metadata.items manquante", { sessionId: session.id });
    return NextResponse.json(
      { error: "Metadata items manquante" },
      { status: 400 }
    );
  }

  let items: { productId: string; quantity: number; unitPriceCents: number }[];
  try {
    items = JSON.parse(metadata.items);
  } catch {
    return NextResponse.json(
      { error: "Metadata items mal formée" },
      { status: 400 }
    );
  }

  // 2) Résolution du buyerId :
  //    a) si l'acheteur était authentifié au checkout → metadata.buyerId
  //    b) sinon, on lookup par customer_email
  //    c) sinon, on crée un compte "guest" avec mot de passe aléatoire haché
  let buyerId: string | null = metadata.buyerId || null;
  const email = (
    session.customer_email ??
    metadata.buyerEmail ??
    ""
  ).trim().toLowerCase();

  if (!buyerId && email) {
    const found = await prisma.buyer.findUnique({
      where: { email },
      select: { id: true },
    });
    buyerId = found?.id ?? null;
  }

  if (!buyerId) {
    if (!email) {
      console.error("[webhook/stripe] aucune façon d'identifier l'acheteur", {
        sessionId: session.id,
      });
      return NextResponse.json(
        { error: "Email acheteur introuvable" },
        { status: 400 }
      );
    }
    const guest = await prisma.buyer.create({
      data: {
        name: metadata.buyerName || "Client",
        email,
        // Mot de passe aléatoire haché : le buyer ne peut pas se connecter
        // sans passer par un flow "mot de passe oublié" (à implémenter).
        password: await generateGuestPasswordHash(),
        phone: metadata.buyerPhone || null,
        address: metadata.buyerAddress || null,
      },
      select: { id: true },
    });
    buyerId = guest.id;
  }

  // 3) Re-vérification serveur des prix : on ne fait pas confiance à la metadata
  //    pour le total (même si on l'a écrite nous-mêmes — défense en profondeur).
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, price: true },
  });
  const priceById = new Map(dbProducts.map((p) => [p.id, Math.round(p.price * 100)]));

  const totalCents = items.reduce((sum, i) => {
    // Si pour une raison quelconque le produit a été supprimé entre-temps,
    // on retombe sur la valeur du metadata (déjà payée par Stripe — c'est trop tard).
    const cents = priceById.get(i.productId) ?? i.unitPriceCents;
    return sum + cents * i.quantity;
  }, 0);

  // Optionnel : log si le total Stripe ne matche pas notre calcul (anomalie).
  if (
    typeof session.amount_total === "number" &&
    session.amount_total !== totalCents
  ) {
    console.warn(
      "[webhook/stripe] mismatch total Stripe vs DB",
      { stripeTotal: session.amount_total, dbTotal: totalCents, sessionId: session.id }
    );
  }

  // 4) Création atomique de la commande + de ses lignes + d'une notification.
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        buyerId: buyerId!,
        status: "EN_COURS",
        totalCents,
        stripeSessionId: session.id,
        lines: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPriceCents: priceById.get(i.productId) ?? i.unitPriceCents,
          })),
        },
      },
      select: { id: true },
    });

    await tx.notification.create({
      data: {
        buyerId,
        content: `Votre commande #${created.id.slice(0, 8)} a été confirmée pour ${(
          totalCents / 100
        ).toFixed(2)} €.`,
      },
    });

    return created;
  });

  // 5) Emails transactionnels — best-effort, sans bloquer la réponse webhook
  //    si Resend rate (les emails ne doivent pas faire échouer le webhook).
  try {
    const enriched = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        buyer: { select: { name: true, email: true } },
        lines: {
          include: {
            product: {
              select: {
                name: true,
                catalog: {
                  select: {
                    vendor: { select: { name: true, email: true, companyName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (enriched && enriched.buyer) {
      // a) Email à l'acheteur (confirmation globale)
      await sendOrderConfirmationEmail({
        buyerName: enriched.buyer.name,
        buyerEmail: enriched.buyer.email,
        orderId: enriched.id,
        totalCents: enriched.totalCents,
        lines: enriched.lines.map((l) => ({
          productName: l.product.name,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
        })),
      });

      // b) Un email par vendeur concerné, ne contenant QUE ses lignes
      const linesByVendor = new Map<
        string,
        {
          vendorName: string;
          vendorEmail: string;
          lines: typeof enriched.lines;
          subtotalCents: number;
        }
      >();
      for (const l of enriched.lines) {
        const vendor = l.product.catalog.vendor;
        if (!vendor?.email) continue;
        const key = vendor.email;
        const display = vendor.companyName ?? vendor.name;
        const existing = linesByVendor.get(key);
        if (existing) {
          existing.lines.push(l);
          existing.subtotalCents += l.unitPriceCents * l.quantity;
        } else {
          linesByVendor.set(key, {
            vendorName: display,
            vendorEmail: vendor.email,
            lines: [l],
            subtotalCents: l.unitPriceCents * l.quantity,
          });
        }
      }

      for (const v of linesByVendor.values()) {
        await sendVendorNewOrderEmail({
          vendorName: v.vendorName,
          vendorEmail: v.vendorEmail,
          orderId: enriched.id,
          buyerName: enriched.buyer.name,
          subtotalCents: v.subtotalCents,
          lines: v.lines.map((l) => ({
            productName: l.product.name,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
          })),
        });

        // Notification in-app pour le vendeur (en plus de l'email).
        const vendorRecord = await prisma.vendor.findUnique({
          where: { email: v.vendorEmail },
          select: { id: true },
        });
        if (vendorRecord) {
          await prisma.notification.create({
            data: {
              vendorId: vendorRecord.id,
              content: `Nouvelle commande #${enriched.id.slice(0, 8)} — ${(v.subtotalCents / 100).toFixed(2)} €`,
            },
          });
        }
      }
    }
  } catch (mailErr) {
    console.error("[webhook/stripe] erreur emails post-commande:", mailErr);
    // On NE return PAS en erreur — la commande est créée, c'est ce qui compte.
  }

  return NextResponse.json({ success: true, orderId: order.id });
}
