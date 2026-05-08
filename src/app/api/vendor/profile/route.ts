import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Édition du profil entreprise (post-onboarding).
 *
 * ⚠️ Volontairement séparé de /api/vendor/company qui gère l'étape 2 du
 * funnel d'onboarding (et qui force `onboardingStep: 3`). Ici on ne touche
 * PAS au onboardingStep — l'utilisateur édite les infos de sa société une
 * fois activée.
 *
 * Les champs name/email ne sont pas modifiables depuis cette route :
 *  - email = identifiant de connexion, changement via flow dédié à venir
 *  - name = nom du contact, modifiable via /account si besoin
 *
 * vatValid est remis à false si vatNumber change pour forcer une re-vérif
 * via VIES côté admin (ou ré-onboarding step 2). On ne re-valide pas ici
 * pour éviter de bloquer l'édition si VIES est down.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vendorId,
      companyName,
      siret,
      vatNumber,
      legalForm,
      address,
      iban,
      incoterms,
    } = body as {
      vendorId?: string;
      companyName?: string | null;
      siret?: string | null;
      vatNumber?: string | null;
      legalForm?: string | null;
      address?: string | null;
      iban?: string | null;
      incoterms?: string | null;
    };

    if (!vendorId || typeof vendorId !== "string") {
      return NextResponse.json(
        { error: "ID vendeur requis" },
        { status: 400 }
      );
    }

    const existing = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, vatNumber: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
    }

    // Validations légères côté serveur (les champs restent optionnels en
    // base — un vendeur peut très bien ne pas avoir d'IBAN renseigné).
    const cleanString = (v: unknown): string | null => {
      if (typeof v !== "string") return null;
      const trimmed = v.trim();
      return trimmed.length === 0 ? null : trimmed;
    };

    const cleanIban = cleanString(iban);
    if (cleanIban && cleanIban.replace(/\s/g, "").length < 14) {
      return NextResponse.json(
        { error: "IBAN trop court (min 14 caractères)" },
        { status: 400 }
      );
    }

    const cleanSiret = cleanString(siret);
    if (cleanSiret && !/^\d{9,14}$/.test(cleanSiret.replace(/\s/g, ""))) {
      return NextResponse.json(
        { error: "SIRET invalide (chiffres uniquement, 9 à 14 caractères)" },
        { status: 400 }
      );
    }

    const cleanVat = cleanString(vatNumber);
    const vatChanged =
      cleanVat !== null && cleanVat !== (existing.vatNumber ?? null);

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        companyName: cleanString(companyName),
        siret: cleanSiret,
        vatNumber: cleanVat,
        // Si la TVA a changé, on force une re-validation côté admin via VIES.
        ...(vatChanged ? { vatValid: false } : {}),
        legalForm: cleanString(legalForm),
        address: cleanString(address),
        iban: cleanIban,
        incoterms: cleanString(incoterms),
      },
      select: {
        id: true,
        companyName: true,
        siret: true,
        vatNumber: true,
        vatValid: true,
        legalForm: true,
        address: true,
        iban: true,
        incoterms: true,
      },
    });

    return NextResponse.json({ success: true, vendor: updated });
  } catch (error) {
    console.error("[api/vendor/profile] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
