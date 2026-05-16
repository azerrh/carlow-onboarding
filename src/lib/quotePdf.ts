import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

/**
 * Génère un PDF de devis B2B et l'upload sur Supabase Storage.
 * Retourne l'URL publique du fichier.
 *
 * Dépend de : pdf-lib (déjà installé), @supabase/supabase-js (déjà installé).
 * Si Supabase n'est pas configuré, lance une erreur attrapée par l'appelant.
 */

function fmtEur(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export interface QuotePdfInput {
  quote: {
    id: string;
    buyerName: string;
    buyerEmail: string;
    buyerCompany: string | null;
    quantity: number;
    message: string | null;
    vendorPriceCents: number;
    vendorMessage: string | null;
    validUntil: Date;
    createdAt: Date;
    accessToken: string;
  };
  product: {
    name: string;
    reference: string | null;
    category: string | null;
    originalPriceCents: number;
  };
  vendor: {
    name: string;
    email: string;
    address: string | null;
  };
}

export async function generateQuotePdf(input: QuotePdfInput): Promise<string> {
  const { quote, product, vendor } = input;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);

  const orange = rgb(0.91, 0.478, 0.188); // #E87A30
  const dark = rgb(0.1, 0.1, 0.1);
  const muted = rgb(0.5, 0.5, 0.5);
  const white = rgb(1, 1, 1);
  const lightGray = rgb(0.97, 0.97, 0.97);

  const W = 595;
  const margin = 50;

  // ── En-tête orange ──
  page.drawRectangle({ x: 0, y: 792, width: W, height: 50, color: orange });
  page.drawText("CARLOW", { x: margin, y: 808, size: 20, font: fontBold, color: white });
  page.drawText("Marketplace B2B EnR", { x: margin, y: 797, size: 9, font: fontReg, color: rgb(1, 0.9, 0.85) });
  page.drawText(`Devis N° ${quote.id.slice(0, 8).toUpperCase()}`, { x: W - 200, y: 808, size: 11, font: fontBold, color: white });
  page.drawText(`Émis le ${fmtDate(quote.createdAt)}`, { x: W - 200, y: 797, size: 9, font: fontReg, color: rgb(1, 0.9, 0.85) });

  let y = 760;

  // ── Bloc vendeur / acheteur ──
  // Vendeur (gauche)
  page.drawText("VENDEUR", { x: margin, y, size: 8, font: fontBold, color: muted });
  y -= 14;
  page.drawText(vendor.name, { x: margin, y, size: 11, font: fontBold, color: dark });
  y -= 13;
  page.drawText(vendor.email, { x: margin, y, size: 9, font: fontReg, color: muted });
  if (vendor.address) {
    y -= 11;
    page.drawText(vendor.address.slice(0, 50), { x: margin, y, size: 9, font: fontReg, color: muted });
  }

  // Acheteur (droite)
  const rightX = W / 2 + 20;
  let ry = 760;
  page.drawText("ACHETEUR", { x: rightX, y: ry, size: 8, font: fontBold, color: muted });
  ry -= 14;
  page.drawText(quote.buyerName, { x: rightX, y: ry, size: 11, font: fontBold, color: dark });
  ry -= 13;
  if (quote.buyerCompany) {
    page.drawText(quote.buyerCompany, { x: rightX, y: ry, size: 9, font: fontReg, color: dark });
    ry -= 11;
  }
  page.drawText(quote.buyerEmail, { x: rightX, y: ry, size: 9, font: fontReg, color: muted });

  y = Math.min(y, ry) - 24;

  // ── Ligne de séparation ──
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
  y -= 20;

  // ── Titre section produit ──
  page.drawText("DÉTAIL DU DEVIS", { x: margin, y, size: 9, font: fontBold, color: orange });
  y -= 16;

  // En-têtes tableau
  const colW = [250, 70, 100, 95];
  const colX = [margin, margin + colW[0], margin + colW[0] + colW[1], margin + colW[0] + colW[1] + colW[2]];
  const headers = ["Produit", "Quantité", "Prix unitaire", "Total HT"];

  page.drawRectangle({ x: margin, y: y - 4, width: W - margin * 2, height: 22, color: orange });
  headers.forEach((h, i) => {
    page.drawText(h, { x: colX[i] + 4, y: y + 3, size: 9, font: fontBold, color: white });
  });
  y -= 26;

  // Ligne produit
  page.drawRectangle({ x: margin, y: y - 4, width: W - margin * 2, height: 22, color: lightGray });
  const totalCents = quote.vendorPriceCents * quote.quantity;
  const cells = [
    `${product.name}${product.reference ? ` (${product.reference})` : ""}`,
    String(quote.quantity),
    fmtEur(quote.vendorPriceCents),
    fmtEur(totalCents),
  ];
  cells.forEach((c, i) => {
    page.drawText(c.slice(0, i === 0 ? 38 : 14), { x: colX[i] + 4, y: y + 3, size: 9, font: fontReg, color: dark });
  });
  y -= 30;

  // ── Total ──
  page.drawRectangle({ x: W - margin - 200, y: y - 6, width: 200, height: 22, color: orange });
  page.drawText("TOTAL HT", { x: W - margin - 196, y: y + 3, size: 9, font: fontBold, color: white });
  page.drawText(fmtEur(totalCents), { x: W - margin - 80, y: y + 3, size: 11, font: fontBold, color: white });
  y -= 34;

  // Prix catalogue pour comparaison
  if (product.originalPriceCents > 0 && quote.vendorPriceCents < product.originalPriceCents) {
    const saving = product.originalPriceCents - quote.vendorPriceCents;
    const pct = Math.round((saving / product.originalPriceCents) * 100);
    page.drawText(`Prix catalogue : ${fmtEur(product.originalPriceCents)} / unité  →  Économie : ${fmtEur(saving)} / unité (−${pct}%)`,
      { x: margin, y, size: 8, font: fontReg, color: muted });
    y -= 16;
  }

  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
  y -= 18;

  // ── Conditions ──
  page.drawText("CONDITIONS", { x: margin, y, size: 9, font: fontBold, color: orange });
  y -= 14;
  page.drawText(`• Devis valable jusqu'au : ${fmtDate(quote.validUntil)}`, { x: margin, y, size: 9, font: fontReg, color: dark });
  y -= 12;
  page.drawText("• Prix exprimés hors taxes (HT). TVA et frais de livraison selon conditions vendeur.", { x: margin, y, size: 9, font: fontReg, color: dark });
  y -= 12;
  page.drawText("• Ce devis est émis via la plateforme Carlow. Toute commande passe par carlow.fr.", { x: margin, y, size: 9, font: fontReg, color: dark });

  if (quote.vendorMessage) {
    y -= 18;
    page.drawText("MESSAGE DU VENDEUR", { x: margin, y, size: 9, font: fontBold, color: orange });
    y -= 14;
    // Découpe le message en lignes de ~85 chars
    const words = quote.vendorMessage.split(" ");
    let line = "";
    for (const word of words) {
      if ((line + " " + word).length > 85) {
        page.drawText(line.trim(), { x: margin, y, size: 9, font: fontReg, color: dark });
        y -= 12;
        line = word;
      } else {
        line = line ? line + " " + word : word;
      }
    }
    if (line) {
      page.drawText(line.trim(), { x: margin, y, size: 9, font: fontReg, color: dark });
      y -= 12;
    }
  }

  // ── Lien pour accepter / décliner ──
  y -= 16;
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
  y -= 16;
  const quoteUrl = `https://carlowonboarding.vercel.app/devis/${quote.accessToken}`;
  page.drawText("Pour accepter ou décliner ce devis, rendez-vous sur :", { x: margin, y, size: 9, font: fontReg, color: dark });
  y -= 12;
  page.drawText(quoteUrl, { x: margin, y, size: 8, font: fontBold, color: orange });

  // ── Pied de page ──
  page.drawRectangle({ x: 0, y: 0, width: W, height: 30, color: rgb(0.97, 0.97, 0.97) });
  page.drawText("Carlow · Marketplace B2B EnR · carlow.fr", { x: margin, y: 11, size: 8, font: fontReg, color: muted });
  page.drawText(`Réf. devis : ${quote.id}`, { x: W - 200, y: 11, size: 8, font: fontReg, color: muted });

  const pdfBytes = await doc.save();

  // Upload Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase non configuré pour le stockage PDF");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const filename = `quotes/${quote.id}.pdf`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(filename, Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw new Error(`Upload PDF échoué : ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(filename);
  return publicUrl;
}
