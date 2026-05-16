import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuotePdf } from "@/lib/quotePdf";
import { sendQuoteRespondedBuyer } from "@/lib/email";

/**
 * GET /api/vendor/quotes?id=<vendorId>&status=<PENDING|RESPONDED|...>
 * Vendeur liste ses demandes de devis reçues.
 *
 * PUT /api/vendor/quotes
 * Vendeur répond à un devis : prix unitaire négocié + message + durée validité.
 * Déclenche la génération du PDF et l'envoi d'un email à l'acheteur.
 *
 * PATCH /api/vendor/quotes  (body: { id, vendorId, action: "REJECTED" })
 * Vendeur refuse un devis.
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("id");
    const statusFilter = searchParams.get("status");

    if (!vendorId) {
      return NextResponse.json({ error: "ID vendeur manquant" }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true },
    });
    if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });

    const quotes = await prisma.quote.findMany({
      where: {
        vendorId,
        ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
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
      },
    });

    // Marquer les devis expirés automatiquement
    const now = new Date();
    const expiredIds = quotes
      .filter((q) => q.status === "RESPONDED" && q.validUntil && q.validUntil < now)
      .map((q) => q.id);

    if (expiredIds.length > 0) {
      await prisma.quote.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: "EXPIRED" },
      });
      // Mettre à jour en mémoire
      for (const q of quotes) {
        if (expiredIds.includes(q.id)) q.status = "EXPIRED";
      }
    }

    const pendingCount = quotes.filter((q) => q.status === "PENDING").length;

    return NextResponse.json({ success: true, quotes, pendingCount });
  } catch (error) {
    console.error("[api/vendor/quotes GET] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quoteId,
      vendorId,
      vendorPriceCents,
      vendorMessage,
      validDays,
    } = body as {
      quoteId?: string;
      vendorId?: string;
      vendorPriceCents?: number;
      vendorMessage?: string;
      validDays?: number;
    };

    if (!quoteId || !vendorId) {
      return NextResponse.json({ error: "quoteId et vendorId requis" }, { status: 400 });
    }
    if (!vendorPriceCents || vendorPriceCents < 1) {
      return NextResponse.json({ error: "Prix unitaire invalide" }, { status: 400 });
    }

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        product: { select: { name: true, reference: true, category: true, price: true } },
        vendor: { select: { id: true, name: true, companyName: true, email: true, address: true } },
      },
    });

    if (!quote || quote.vendorId !== vendorId) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }
    if (quote.status !== "PENDING") {
      return NextResponse.json({ error: "Ce devis a déjà été traité" }, { status: 409 });
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (validDays ?? 14));

    // Générer le PDF
    let pdfUrl: string | null = null;
    try {
      pdfUrl = await generateQuotePdf({
        quote: {
          id: quote.id,
          buyerName: quote.buyerName,
          buyerEmail: quote.buyerEmail,
          buyerCompany: quote.buyerCompany,
          quantity: quote.quantity,
          message: quote.message,
          vendorPriceCents,
          vendorMessage: vendorMessage?.trim() || null,
          validUntil,
          createdAt: quote.createdAt,
          accessToken: quote.accessToken!,
        },
        product: {
          name: quote.product.name,
          reference: quote.product.reference,
          category: quote.product.category,
          originalPriceCents: Math.round(quote.product.price * 100),
        },
        vendor: {
          name: quote.vendor.companyName ?? quote.vendor.name,
          email: quote.vendor.email,
          address: quote.vendor.address,
        },
      });
    } catch (pdfErr) {
      console.error("[api/vendor/quotes] PDF generation failed:", pdfErr);
      // On continue sans PDF — l'acheteur peut toujours voir son devis en ligne
    }

    // Mise à jour en DB
    const updated = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: "RESPONDED",
        vendorPriceCents,
        vendorMessage: vendorMessage?.trim() || null,
        validUntil,
        pdfUrl,
      },
    });

    // Email à l'acheteur
    await sendQuoteRespondedBuyer({
      buyerEmail: quote.buyerEmail,
      buyerName: quote.buyerName,
      productName: quote.product.name,
      vendorName: quote.vendor.companyName ?? quote.vendor.name,
      quantity: quote.quantity,
      vendorPriceCents,
      validUntil,
      accessToken: quote.accessToken!,
      pdfUrl: pdfUrl ?? undefined,
    });

    return NextResponse.json({ success: true, quote: updated });
  } catch (error) {
    console.error("[api/vendor/quotes PUT] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { quoteId, vendorId, action } = body as {
      quoteId?: string;
      vendorId?: string;
      action?: string;
    };

    if (!quoteId || !vendorId || action !== "REJECTED") {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote || quote.vendorId !== vendorId) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }
    if (quote.status !== "PENDING") {
      return NextResponse.json({ error: "Ce devis ne peut plus être modifié" }, { status: 409 });
    }

    await prisma.quote.update({ where: { id: quoteId }, data: { status: "REJECTED" } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/vendor/quotes PATCH] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
