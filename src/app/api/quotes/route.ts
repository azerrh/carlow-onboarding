import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rateLimit";
import { sendQuoteReceivedVendor, sendQuoteConfirmationBuyer } from "@/lib/email";
import crypto from "crypto";

/**
 * POST /api/quotes
 * Acheteur (connecté ou anonyme) soumet une demande de devis sur un produit.
 *
 * GET /api/quotes?token=<accessToken>
 * Acheteur consulte son devis via le lien reçu par email (sans compte).
 *
 * PUT /api/quotes
 * Acheteur accepte ou décline un devis (body: { token, action: "ACCEPTED"|"REJECTED" })
 */

export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, {
    bucket: "quotes:create",
    limit: 10,
    windowSec: 600,
  });
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const {
      productId,
      buyerEmail,
      buyerName,
      buyerPhone,
      buyerCompany,
      quantity,
      message,
    } = body as {
      productId?: string;
      buyerEmail?: string;
      buyerName?: string;
      buyerPhone?: string;
      buyerCompany?: string;
      quantity?: number;
      message?: string;
    };

    // Validation
    if (!productId) return NextResponse.json({ error: "Produit manquant" }, { status: 400 });
    if (!buyerEmail || !/\S+@\S+\.\S+/.test(buyerEmail))
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    if (!buyerName || buyerName.trim().length < 2)
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    if (!quantity || quantity < 1 || quantity > 100000)
      return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });

    // Vérifier le produit et récupérer le vendeur
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        catalog: {
          select: {
            vendorId: true,
            vendor: { select: { id: true, name: true, email: true, companyName: true } },
          },
        },
      },
    });

    if (!product || !product.active) {
      return NextResponse.json({ error: "Produit introuvable ou inactif" }, { status: 404 });
    }

    const vendor = product.catalog.vendor;

    // Chercher un compte Buyer existant pour lier optionnellement
    const buyer = await prisma.buyer.findUnique({
      where: { email: buyerEmail.toLowerCase() },
      select: { id: true },
    });

    // Token unique pour accès sans compte
    const accessToken = crypto.randomBytes(32).toString("hex");

    // Création du devis — opération critique, on laisse l'erreur remonter
    // pour qu'elle soit explicite (et pas masquée par un générique 500).
    const quote = await prisma.quote.create({
      data: {
        productId,
        vendorId: vendor.id,
        buyerId: buyer?.id ?? null,
        buyerEmail: buyerEmail.toLowerCase().trim(),
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone?.trim() || null,
        buyerCompany: buyerCompany?.trim() || null,
        quantity,
        message: message?.trim() || null,
        accessToken,
        status: "PENDING",
      },
    });

    // Emails — best-effort, ne doivent JAMAIS faire échouer la demande de devis.
    // Si Resend rate (clé manquante, rate limit, etc.), on log mais on continue.
    Promise.all([
      sendQuoteReceivedVendor({
        vendorEmail: vendor.email,
        vendorName: vendor.companyName ?? vendor.name,
        quoteId: quote.id,
        productName: product.name,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.toLowerCase(),
        buyerCompany: buyerCompany?.trim() || null,
        quantity,
        message: message?.trim() || null,
      }),
      sendQuoteConfirmationBuyer({
        buyerEmail: buyerEmail.toLowerCase(),
        buyerName: buyerName.trim(),
        productName: product.name,
        vendorName: vendor.companyName ?? vendor.name,
        quantity,
        accessToken,
      }),
    ]).catch((emailErr) => {
      console.error("[api/quotes POST] emails fail:", emailErr);
    });

    // Notification in-app pour le vendeur — best-effort aussi.
    try {
      await prisma.notification.create({
        data: {
          vendorId: vendor.id,
          content: `Nouvelle demande de devis pour "${product.name}" de ${buyerName.trim()} (${quantity} unité${quantity > 1 ? "s" : ""})`,
        },
      });
    } catch (notifErr) {
      console.error("[api/quotes POST] notification fail:", notifErr);
    }

    return NextResponse.json({
      success: true,
      quoteId: quote.id,
      message: "Demande de devis envoyée. Vous recevrez un email de confirmation.",
    });
  } catch (error) {
    console.error("[api/quotes POST] error:", error);

    // Renvoie le vrai message d'erreur (utile en prod pour debug Vercel).
    // En particulier : si DATABASE_URL est absent ou l'env est mal configuré,
    // le user verra la cause réelle au lieu d'un "Erreur serveur" muet.
    if (error instanceof Error) {
      // Erreurs Prisma connues (code P2000+) → renvoie un message lisible.
      const msg = error.message;
      if (msg.includes("Foreign key constraint")) {
        return NextResponse.json(
          { error: "Référence invalide (produit ou vendeur introuvable)." },
          { status: 400 }
        );
      }
      if (msg.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Une demande similaire existe déjà." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Erreur de création du devis : ${msg}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const quote = await prisma.quote.findUnique({
      where: { accessToken: token },
      include: {
        product: {
          select: {
            name: true,
            reference: true,
            price: true,
            category: true,
            photos: { select: { url: true }, orderBy: { primary: "desc" }, take: 1 },
          },
        },
        vendor: { select: { name: true, companyName: true, email: true } },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    // Vérifier expiration
    if (quote.validUntil && new Date() > quote.validUntil && quote.status === "RESPONDED") {
      await prisma.quote.update({ where: { id: quote.id }, data: { status: "EXPIRED" } });
    }

    return NextResponse.json({ success: true, quote });
  } catch (error) {
    console.error("[api/quotes GET] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, action } = body as { token?: string; action?: string };

    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    if (action !== "ACCEPTED" && action !== "REJECTED")
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });

    const quote = await prisma.quote.findUnique({ where: { accessToken: token } });
    if (!quote) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    if (quote.status !== "RESPONDED")
      return NextResponse.json({ error: "Ce devis ne peut plus être modifié" }, { status: 409 });
    if (quote.validUntil && new Date() > quote.validUntil)
      return NextResponse.json({ error: "Ce devis a expiré" }, { status: 410 });

    await prisma.quote.update({ where: { id: quote.id }, data: { status: action } });

    // Notification in-app vendeur
    const product = await prisma.product.findUnique({ where: { id: quote.productId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        vendorId: quote.vendorId,
        content:
          action === "ACCEPTED"
            ? `✅ ${quote.buyerName} a accepté votre devis pour "${product?.name ?? "un produit"}"`
            : `❌ ${quote.buyerName} a décliné votre devis pour "${product?.name ?? "un produit"}"`,
      },
    });

    return NextResponse.json({ success: true, status: action });
  } catch (error) {
    console.error("[api/quotes PUT] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
