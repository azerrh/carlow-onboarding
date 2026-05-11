import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

/**
 * Stripe Connect — onboarding du vendeur.
 *
 * - POST : crée (ou réutilise) un compte Stripe Connect Express pour le
 *          vendeur, puis génère un Account Link de durée limitée que le
 *          vendeur ouvre pour saisir ses infos bancaires côté Stripe.
 * - GET  : récupère le statut du compte Connect (charges_enabled,
 *          details_submitted) — utile pour afficher un badge dans
 *          /dashboard/entreprise.
 *
 * ⚠️ Le routage final des fonds (destination charges) est implémenté
 * dans /api/checkout/stripe. Sans configuration Stripe Connect, le
 * checkout fonctionne en mode "tout va au compte plateforme" (legacy).
 */

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquant.");
  }
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  try {
    const { vendorId } = await req.json();
    if (!vendorId) {
      return NextResponse.json({ error: "vendorId requis" }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        stripeAccountId: true,
      },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
    }

    const stripe = getStripe();

    // 1) Crée le compte Connect Express si pas encore lié
    let accountId = vendor.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: vendor.email,
        business_type: "company",
        business_profile: {
          name: vendor.companyName ?? vendor.name,
          mcc: "5074", // Plumbing & heating equipment (proche du métier EnR)
          url: "https://carlowonboarding.vercel.app",
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { carlowVendorId: vendor.id },
      });
      accountId = account.id;
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: { stripeAccountId: accountId },
      });
    }

    // 2) Génère un Account Link (URL temporaire pour l'onboarding hosted)
    const origin =
      req.headers.get("origin") ?? "https://carlowonboarding.vercel.app";

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/entreprise?stripe=refresh`,
      return_url: `${origin}/dashboard/entreprise?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      success: true,
      url: link.url,
      accountId,
    });
  } catch (error) {
    console.error("[api/vendor/stripe-connect] POST error:", error);
    // Stripe peut renvoyer des erreurs métier (compte déjà finalisé, etc.)
    // On les remonte au client pour qu'il puisse afficher un message utile.
    const message =
      error instanceof Error ? error.message : "Erreur Stripe Connect";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") ?? searchParams.get("id");
    if (!vendorId) {
      return NextResponse.json({ error: "vendorId requis" }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { stripeAccountId: true, stripeChargesEnabled: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
    }

    // Pas de compte Stripe lié — l'UI doit proposer de "Connecter Stripe".
    if (!vendor.stripeAccountId) {
      return NextResponse.json({
        success: true,
        linked: false,
        chargesEnabled: false,
        detailsSubmitted: false,
      });
    }

    // On va chercher l'état frais chez Stripe (pas la valeur cachée en DB
    // qui peut être périmée). On met aussi à jour le cache local.
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(vendor.stripeAccountId);

    const chargesEnabled = account.charges_enabled ?? false;
    if (chargesEnabled !== vendor.stripeChargesEnabled) {
      await prisma.vendor.update({
        where: { stripeAccountId: vendor.stripeAccountId },
        data: { stripeChargesEnabled: chargesEnabled },
      });
    }

    return NextResponse.json({
      success: true,
      linked: true,
      chargesEnabled,
      detailsSubmitted: account.details_submitted,
      accountId: vendor.stripeAccountId,
    });
  } catch (error) {
    console.error("[api/vendor/stripe-connect] GET error:", error);
    return NextResponse.json(
      { error: "Erreur récupération statut Stripe" },
      { status: 500 }
    );
  }
}
