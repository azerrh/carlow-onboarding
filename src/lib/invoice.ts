import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

/**
 * Génération de factures PDF.
 *
 * Approche : `pdf-lib` pur (pas de Chrome/Puppeteer requis → fonctionne en
 * Vercel Serverless sans config). Layout minimaliste mais professionnel.
 *
 * Limite : pdf-lib ne supporte pas le wrap automatique. Pour les textes
 * longs (description), on tronque ou on coupe sur N lignes manuellement.
 */

export interface InvoiceLine {
  productName: string;
  reference?: string | null;
  quantity: number;
  unitPriceCents: number;
}

export interface InvoiceData {
  orderId: string;
  orderedAt: Date;
  buyer: {
    name: string;
    email: string;
    address?: string | null;
    phone?: string | null;
  };
  lines: InvoiceLine[];
  totalCents: number;
  // Optionnel : prix HT séparé du TTC (pour l'instant on considère que les
  // prix Carlow sont TTC sans détail TVA — à raffiner avec un comptable).
}

const COLOR = {
  primary: rgb(0.91, 0.478, 0.188), // E87A30
  text: rgb(0.1, 0.1, 0.1),
  muted: rgb(0.4, 0.4, 0.4),
  light: rgb(0.92, 0.91, 0.88),
};

/** Helper texte avec gestion ASCII sécurisée (pdf-lib StandardFonts ≠ Unicode). */
function asciiSafe(s: string): string {
  // pdf-lib avec StandardFonts (WinAnsi) ne supporte pas tous les Unicode.
  // On remplace les caractères problématiques par leur équivalent ASCII.
  return s
    .replace(/[€]/g, "EUR")
    .replace(/[—–]/g, "-")
    .replace(/[…]/g, "...")
    .replace(/[æœÆŒ]/g, (c) =>
      ({ æ: "ae", œ: "oe", Æ: "AE", Œ: "OE" }[c] ?? c)
    );
}

function fmtPrice(cents: number): string {
  // Volontairement on n'utilise PAS Intl.NumberFormat car certaines locales
  // émettent un espace insécable qu'on devrait gérer côté pdf-lib.
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const cts = (abs % 100).toString().padStart(2, "0");
  return `${sign}${euros},${cts} EUR`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait en points
  const { width, height } = page.getSize();

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  /* ----- Helper d'écriture ----- */
  function drawText(
    text: string,
    opts: {
      x: number;
      y: number;
      size?: number;
      font?: PDFFont;
      color?: ReturnType<typeof rgb>;
    }
  ) {
    page.drawText(asciiSafe(text), {
      x: opts.x,
      y: opts.y,
      size: opts.size ?? 10,
      font: opts.font ?? fontRegular,
      color: opts.color ?? COLOR.text,
    });
  }

  /* ----- Bande de couleur en tête ----- */
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width,
    height: 80,
    color: COLOR.primary,
  });
  drawText("CARLOW", {
    x: 50,
    y: height - 45,
    size: 28,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  drawText("Marketplace B2B EnR", {
    x: 50,
    y: height - 64,
    size: 10,
    color: rgb(1, 1, 1),
  });
  drawText("FACTURE", {
    x: width - 130,
    y: height - 45,
    size: 22,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  drawText(`N° ${data.orderId.slice(0, 12).toUpperCase()}`, {
    x: width - 130,
    y: height - 64,
    size: 9,
    color: rgb(1, 1, 1),
  });

  /* ----- Info émetteur (Carlow) + destinataire ----- */
  let y = height - 130;

  drawText("Émetteur :", { x: 50, y, size: 9, font: fontBold, color: COLOR.muted });
  drawText("Carlow / Solelh Energie", { x: 50, y: y - 14, size: 11, font: fontBold });
  drawText("Marketplace B2B EnR", { x: 50, y: y - 28, size: 10, color: COLOR.muted });
  drawText("carlow.fr", { x: 50, y: y - 42, size: 10, color: COLOR.muted });

  drawText("Facturé à :", {
    x: width - 250,
    y,
    size: 9,
    font: fontBold,
    color: COLOR.muted,
  });
  drawText(data.buyer.name, {
    x: width - 250,
    y: y - 14,
    size: 11,
    font: fontBold,
  });
  drawText(data.buyer.email, {
    x: width - 250,
    y: y - 28,
    size: 10,
    color: COLOR.muted,
  });
  if (data.buyer.address) {
    drawText(data.buyer.address.slice(0, 60), {
      x: width - 250,
      y: y - 42,
      size: 10,
      color: COLOR.muted,
    });
  }
  if (data.buyer.phone) {
    drawText(data.buyer.phone, {
      x: width - 250,
      y: y - 56,
      size: 10,
      color: COLOR.muted,
    });
  }

  /* ----- Méta facture ----- */
  y = height - 220;
  page.drawRectangle({
    x: 50,
    y: y - 30,
    width: width - 100,
    height: 40,
    color: COLOR.light,
  });
  drawText("Date :", { x: 60, y: y - 12, size: 9, color: COLOR.muted });
  drawText(fmtDate(data.orderedAt), { x: 60, y: y - 24, size: 11, font: fontBold });

  drawText("Commande :", {
    x: width / 2 - 50,
    y: y - 12,
    size: 9,
    color: COLOR.muted,
  });
  drawText(`#${data.orderId.slice(0, 10)}`, {
    x: width / 2 - 50,
    y: y - 24,
    size: 11,
    font: fontBold,
  });

  drawText("Statut :", { x: width - 150, y: y - 12, size: 9, color: COLOR.muted });
  drawText("Payée", {
    x: width - 150,
    y: y - 24,
    size: 11,
    font: fontBold,
    color: rgb(0.13, 0.63, 0.42),
  });

  /* ----- Tableau articles ----- */
  y = y - 70;
  // En-tête
  page.drawRectangle({
    x: 50,
    y: y - 4,
    width: width - 100,
    height: 22,
    color: COLOR.primary,
  });
  drawText("ARTICLE", {
    x: 60,
    y: y + 5,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  drawText("RÉF.", {
    x: width - 280,
    y: y + 5,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  drawText("QTÉ", {
    x: width - 200,
    y: y + 5,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  drawText("PRIX U.", {
    x: width - 160,
    y: y + 5,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  drawText("TOTAL", {
    x: width - 90,
    y: y + 5,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Lignes
  y -= 28;
  for (const l of data.lines) {
    const lineTotal = l.unitPriceCents * l.quantity;
    drawText(l.productName.slice(0, 38), { x: 60, y, size: 10 });
    drawText((l.reference ?? "—").slice(0, 12), {
      x: width - 280,
      y,
      size: 9,
      color: COLOR.muted,
    });
    drawText(String(l.quantity), { x: width - 200, y, size: 10 });
    drawText(fmtPrice(l.unitPriceCents), {
      x: width - 160,
      y,
      size: 10,
      color: COLOR.muted,
    });
    drawText(fmtPrice(lineTotal), {
      x: width - 90,
      y,
      size: 10,
      font: fontBold,
    });
    // Ligne séparatrice
    page.drawLine({
      start: { x: 50, y: y - 6 },
      end: { x: width - 50, y: y - 6 },
      thickness: 0.5,
      color: COLOR.light,
    });
    y -= 24;
  }

  /* ----- Total ----- */
  y -= 10;
  page.drawRectangle({
    x: width - 220,
    y: y - 30,
    width: 170,
    height: 40,
    color: COLOR.light,
    borderColor: COLOR.primary,
    borderWidth: 1,
  });
  drawText("TOTAL TTC", {
    x: width - 210,
    y: y - 12,
    size: 10,
    font: fontBold,
    color: COLOR.muted,
  });
  drawText(fmtPrice(data.totalCents), {
    x: width - 210,
    y: y - 24,
    size: 16,
    font: fontBold,
    color: COLOR.primary,
  });

  /* ----- Pied de page ----- */
  drawText(
    "Cette facture est generee automatiquement par la plateforme Carlow.",
    { x: 50, y: 60, size: 9, color: COLOR.muted }
  );
  drawText("Paiement encaisse via Stripe. TVA non applicable (auto-liquidation B2B).", {
    x: 50,
    y: 48,
    size: 9,
    color: COLOR.muted,
  });
  drawText("Carlow / Solelh Energie - carlow.fr", {
    x: 50,
    y: 30,
    size: 9,
    font: fontBold,
    color: COLOR.primary,
  });

  return pdf.save();
}
