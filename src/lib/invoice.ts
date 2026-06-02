import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

/**
 * Génération de factures PDF Carlow.
 *
 * Approche : `pdf-lib` pur (pas de Chrome/Puppeteer → fonctionne sur Vercel
 * Serverless sans config). Layout professionnel A4 avec bandeau de couleur,
 * tableau structuré, détail TVA (auto-liquidation B2B), et pied de page.
 *
 * Limite : pdf-lib avec StandardFonts (WinAnsi) ne supporte pas tous les
 * caractères Unicode → on utilise `asciiSafe()` pour les caractères non
 * supportés (€ → EUR, é → e accent, etc.).
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
  // Variant du document : "buyer" → facture acheteur, "vendor" → facture vendeur
  variant?: "buyer" | "vendor";
  buyer: {
    name: string;
    email: string;
    address?: string | null;
    phone?: string | null;
  };
  // Optionnel : info du vendeur (utile sur la facture vendeur)
  vendor?: {
    name: string;
    companyName?: string | null;
    address?: string | null;
    vatNumber?: string | null;
    siret?: string | null;
  } | null;
  lines: InvoiceLine[];
  totalCents: number;
  // Détail TVA : si renseigné, on affiche la décomposition.
  // Par défaut Carlow facture en HT (auto-liquidation B2B intracommunautaire).
  vatRate?: number; // ex: 0 (auto-liquidation), 0.2 (TVA 20%)
}

const COLOR = {
  primary: rgb(0.91, 0.478, 0.188), // E87A30
  primaryDark: rgb(0.75, 0.33, 0.06),
  text: rgb(0.1, 0.1, 0.1),
  muted: rgb(0.4, 0.4, 0.4),
  light: rgb(0.96, 0.95, 0.93),
  border: rgb(0.88, 0.86, 0.83),
  success: rgb(0.13, 0.63, 0.42),
  white: rgb(1, 1, 1),
};

/** Helper texte avec gestion ASCII sécurisée (pdf-lib StandardFonts ≠ Unicode). */
function asciiSafe(s: string): string {
  return s
    .replace(/[€]/g, "EUR")
    .replace(/[—–]/g, "-")
    .replace(/[…]/g, "...")
    .replace(/[æœÆŒ]/g, (c) =>
      ({ æ: "ae", œ: "oe", Æ: "AE", Œ: "OE" })[c] ?? c
    );
}

function fmtPrice(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const cts = (abs % 100).toString().padStart(2, "0");
  // Séparateur des milliers : on l'ajoute manuellement pour rester
  // déterministe peu importe la locale.
  const eurosStr = euros.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${eurosStr},${cts} EUR`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Génère un numéro de facture lisible style "F-202605-A1B2C3D4". */
function makeInvoiceNumber(orderId: string, orderedAt: Date): string {
  const yyyy = orderedAt.getFullYear();
  const mm = String(orderedAt.getMonth() + 1).padStart(2, "0");
  return `F-${yyyy}${mm}-${orderId.slice(0, 8).toUpperCase()}`;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const variant = data.variant ?? "buyer";
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Carlow - Facture ${data.orderId.slice(0, 8).toUpperCase()}`);
  pdf.setAuthor("Carlow");
  pdf.setSubject("Facture marketplace B2B");
  pdf.setProducer("Carlow Marketplace");

  const page = pdf.addPage([595.28, 841.89]); // A4 portrait
  const { width, height } = page.getSize();

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

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

  /* ===== HEADER avec bande dégradée (simulée par 2 rects) ===== */
  // Bande principale
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width,
    height: 100,
    color: COLOR.primary,
  });
  // Bande accent en bas
  page.drawRectangle({
    x: 0,
    y: height - 105,
    width,
    height: 5,
    color: COLOR.primaryDark,
  });

  // Logo "C" stylisé (rectangle blanc avec C)
  page.drawRectangle({
    x: 50,
    y: height - 75,
    width: 38,
    height: 38,
    color: COLOR.white,
    borderColor: COLOR.white,
    borderWidth: 0,
  });
  drawText("C", {
    x: 62,
    y: height - 65,
    size: 22,
    font: fontBold,
    color: COLOR.primary,
  });
  drawText("CARLOW", {
    x: 100,
    y: height - 55,
    size: 22,
    font: fontBold,
    color: COLOR.white,
  });
  drawText("Marketplace B2B des energies renouvelables", {
    x: 100,
    y: height - 72,
    size: 9,
    color: COLOR.white,
  });

  // Cartouche FACTURE à droite
  drawText("FACTURE", {
    x: width - 140,
    y: height - 50,
    size: 20,
    font: fontBold,
    color: COLOR.white,
  });
  drawText(
    variant === "vendor" ? "Releve vendeur" : "Acheteur",
    {
      x: width - 140,
      y: height - 72,
      size: 9,
      font: fontItalic,
      color: COLOR.white,
    }
  );

  /* ===== Bandeau N° + date ===== */
  let y = height - 130;
  const invoiceNumber = makeInvoiceNumber(data.orderId, data.orderedAt);

  page.drawRectangle({
    x: 50,
    y: y - 38,
    width: width - 100,
    height: 50,
    color: COLOR.light,
    borderColor: COLOR.border,
    borderWidth: 0.5,
  });

  drawText("N° FACTURE", { x: 60, y: y - 12, size: 8, color: COLOR.muted });
  drawText(invoiceNumber, { x: 60, y: y - 28, size: 12, font: fontBold, color: COLOR.primary });

  drawText("DATE", { x: 260, y: y - 12, size: 8, color: COLOR.muted });
  drawText(fmtDate(data.orderedAt), { x: 260, y: y - 28, size: 12, font: fontBold });

  drawText("STATUT", { x: 400, y: y - 12, size: 8, color: COLOR.muted });
  drawText("PAYEE", { x: 400, y: y - 28, size: 12, font: fontBold, color: COLOR.success });

  drawText("COMMANDE", { x: width - 130, y: y - 12, size: 8, color: COLOR.muted });
  drawText(`#${data.orderId.slice(0, 10).toUpperCase()}`, {
    x: width - 130,
    y: y - 28,
    size: 11,
    font: fontBold,
  });

  /* ===== Émetteur + Destinataire ===== */
  y = height - 210;

  // Émetteur (Carlow)
  drawText("DE", { x: 50, y, size: 8, font: fontBold, color: COLOR.muted });
  drawText("Carlow", { x: 50, y: y - 16, size: 12, font: fontBold });
  drawText("Marketplace B2B EnR", { x: 50, y: y - 30, size: 9, color: COLOR.muted });
  drawText("contact@carlow.fr", { x: 50, y: y - 42, size: 9, color: COLOR.muted });
  drawText("carlow.fr", { x: 50, y: y - 54, size: 9, color: COLOR.muted });

  // Destinataire (acheteur ou vendeur selon variant)
  const recipientX = width / 2 + 20;
  drawText(
    variant === "vendor" ? "RELEVE POUR" : "FACTURE A",
    {
      x: recipientX,
      y,
      size: 8,
      font: fontBold,
      color: COLOR.muted,
    }
  );

  if (variant === "vendor" && data.vendor) {
    // Affiche les infos du vendeur sur la facture vendeur
    drawText(data.vendor.companyName ?? data.vendor.name, {
      x: recipientX,
      y: y - 16,
      size: 12,
      font: fontBold,
    });
    if (data.vendor.address) {
      drawText(data.vendor.address.slice(0, 50), {
        x: recipientX,
        y: y - 30,
        size: 9,
        color: COLOR.muted,
      });
    }
    if (data.vendor.vatNumber) {
      drawText(`TVA : ${data.vendor.vatNumber}`, {
        x: recipientX,
        y: y - 42,
        size: 9,
        color: COLOR.muted,
      });
    }
    if (data.vendor.siret) {
      drawText(`SIRET : ${data.vendor.siret}`, {
        x: recipientX,
        y: y - 54,
        size: 9,
        color: COLOR.muted,
      });
    }
  } else {
    // Acheteur (par défaut)
    drawText(data.buyer.name, {
      x: recipientX,
      y: y - 16,
      size: 12,
      font: fontBold,
    });
    drawText(data.buyer.email, {
      x: recipientX,
      y: y - 30,
      size: 9,
      color: COLOR.muted,
    });
    if (data.buyer.address) {
      drawText(data.buyer.address.slice(0, 50), {
        x: recipientX,
        y: y - 42,
        size: 9,
        color: COLOR.muted,
      });
    }
    if (data.buyer.phone) {
      drawText(data.buyer.phone, {
        x: recipientX,
        y: y - 54,
        size: 9,
        color: COLOR.muted,
      });
    }
  }

  /* ===== Tableau articles ===== */
  y = height - 310;

  // En-tête table
  page.drawRectangle({
    x: 50,
    y: y - 6,
    width: width - 100,
    height: 26,
    color: COLOR.primary,
  });
  const headerY = y + 5;
  drawText("DESCRIPTION", { x: 60, y: headerY, size: 9, font: fontBold, color: COLOR.white });
  drawText("REF.", { x: 295, y: headerY, size: 9, font: fontBold, color: COLOR.white });
  drawText("QTE", { x: 365, y: headerY, size: 9, font: fontBold, color: COLOR.white });
  drawText("PRIX U.", { x: 410, y: headerY, size: 9, font: fontBold, color: COLOR.white });
  drawText("TOTAL", { x: width - 95, y: headerY, size: 9, font: fontBold, color: COLOR.white });

  // Lignes
  y -= 32;
  let alternate = false;
  for (const l of data.lines) {
    const lineTotal = l.unitPriceCents * l.quantity;

    // Fond alterné pour lisibilité
    if (alternate) {
      page.drawRectangle({
        x: 50,
        y: y - 6,
        width: width - 100,
        height: 22,
        color: COLOR.light,
      });
    }
    alternate = !alternate;

    drawText(l.productName.slice(0, 40), { x: 60, y, size: 10 });
    drawText((l.reference ?? "-").slice(0, 12), {
      x: 295,
      y,
      size: 9,
      color: COLOR.muted,
    });
    drawText(String(l.quantity), { x: 365, y, size: 10 });
    drawText(fmtPrice(l.unitPriceCents), { x: 410, y, size: 10, color: COLOR.muted });
    drawText(fmtPrice(lineTotal), {
      x: width - 95,
      y,
      size: 10,
      font: fontBold,
    });
    y -= 22;
  }

  // Bordure de table
  page.drawLine({
    start: { x: 50, y: y + 8 },
    end: { x: width - 50, y: y + 8 },
    thickness: 1,
    color: COLOR.primary,
  });

  /* ===== Totaux ===== */
  y -= 18;
  const vatRate = data.vatRate ?? 0;
  const totalHT = vatRate === 0 ? data.totalCents : Math.round(data.totalCents / (1 + vatRate));
  const totalVAT = data.totalCents - totalHT;

  // Bloc de droite
  const totalsX = width - 240;
  drawText("Sous-total HT", { x: totalsX, y, size: 10, color: COLOR.muted });
  drawText(fmtPrice(totalHT), { x: width - 95, y, size: 10, font: fontBold });
  y -= 16;

  if (vatRate > 0) {
    drawText(`TVA (${(vatRate * 100).toFixed(0)}%)`, {
      x: totalsX,
      y,
      size: 10,
      color: COLOR.muted,
    });
    drawText(fmtPrice(totalVAT), { x: width - 95, y, size: 10, font: fontBold });
    y -= 16;
  } else {
    drawText("TVA (auto-liquidation B2B)", {
      x: totalsX,
      y,
      size: 9,
      color: COLOR.muted,
      font: fontItalic,
    });
    drawText("0,00 EUR", { x: width - 95, y, size: 9, color: COLOR.muted });
    y -= 16;
  }

  // Total final en gros, encadré
  y -= 4;
  page.drawRectangle({
    x: totalsX - 12,
    y: y - 10,
    width: width - 50 - (totalsX - 12),
    height: 32,
    color: COLOR.primary,
  });
  drawText("TOTAL TTC", {
    x: totalsX,
    y: y + 2,
    size: 11,
    font: fontBold,
    color: COLOR.white,
  });
  drawText(fmtPrice(data.totalCents), {
    x: width - 130,
    y: y + 2,
    size: 14,
    font: fontBold,
    color: COLOR.white,
  });

  /* ===== Mention de remerciement ===== */
  y -= 50;
  page.drawRectangle({
    x: 50,
    y: y - 20,
    width: width - 100,
    height: 36,
    color: COLOR.light,
    borderColor: COLOR.primary,
    borderWidth: 0.5,
  });
  drawText(
    variant === "vendor"
      ? "Merci pour votre confiance dans la marketplace Carlow."
      : "Merci pour votre commande ! Suivez son statut depuis votre espace acheteur.",
    {
      x: 60,
      y: y - 6,
      size: 10,
      font: fontBold,
      color: COLOR.primary,
    }
  );
  drawText(
    "Pour toute question : contact@carlow.fr",
    {
      x: 60,
      y: y - 16,
      size: 9,
      color: COLOR.muted,
    }
  );

  /* ===== Pied de page ===== */
  page.drawLine({
    start: { x: 50, y: 75 },
    end: { x: width - 50, y: 75 },
    thickness: 0.5,
    color: COLOR.border,
  });

  drawText(
    "Cette facture est generee automatiquement par la plateforme Carlow.",
    { x: 50, y: 62, size: 8, color: COLOR.muted, font: fontItalic }
  );
  drawText(
    "Paiement encaisse via Stripe (PCI-DSS niveau 1). TVA auto-liquidation B2B intracommunautaire (art. 196 directive 2006/112/CE).",
    { x: 50, y: 50, size: 8, color: COLOR.muted }
  );
  drawText("Carlow - Marketplace B2B EnR", {
    x: 50,
    y: 32,
    size: 9,
    font: fontBold,
    color: COLOR.primary,
  });
  drawText("carlow.fr - contact@carlow.fr", {
    x: 50,
    y: 20,
    size: 9,
    color: COLOR.muted,
  });

  // Numéro de page (1/1 pour une page seule)
  drawText("Page 1/1", {
    x: width - 80,
    y: 20,
    size: 8,
    color: COLOR.muted,
  });

  return pdf.save();
}
