import { NextRequest, NextResponse } from "next/server";

/**
 * Validation d'un numéro SIREN français (9 chiffres) auprès de l'API
 * officielle gouvernementale.
 *
 * Endpoint utilisé : recherche-entreprises.api.gouv.fr
 *   - Publique, gratuite, sans clé d'API requise
 *   - Données issues du répertoire SIRENE de l'INSEE
 *   - Documentation : https://recherche-entreprises.api.gouv.fr/
 *
 * On valide aussi côté serveur :
 *   1. Le format (9 chiffres exactement)
 *   2. La clé de contrôle (algorithme de Luhn)
 *   3. L'existence dans le registre SIRENE
 *
 * ⚠️ Pour les entreprises étrangères, ce contrôle n'a pas de sens —
 * le client doit alors passer le champ SIREN vide et s'identifier
 * uniquement via son numéro de TVA intracommunautaire (validé par VIES).
 */

/**
 * Vérification de la clé de contrôle (algorithme de Luhn).
 * Le 9e chiffre du SIREN est calculé pour que la somme modulo 10 = 0.
 */
function isLuhnValid(siren: string): boolean {
  if (!/^\d{9}$/.test(siren)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(siren[i]!, 10);
    // Multiplie un chiffre sur deux en partant de la droite (donc index pairs
    // de la fin = index impairs depuis la gauche pour une chaîne de 9).
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("siren");
    if (!raw) {
      return NextResponse.json(
        { valid: false, error: "Numéro SIREN manquant" },
        { status: 400 }
      );
    }

    // Nettoyage : on retire espaces et caractères non numériques
    const siren = raw.replace(/\D/g, "");

    if (siren.length !== 9) {
      return NextResponse.json({
        valid: false,
        error: "Le SIREN doit comporter exactement 9 chiffres",
        format: "invalid",
      });
    }

    if (!isLuhnValid(siren)) {
      return NextResponse.json({
        valid: false,
        error: "Clé de contrôle SIREN invalide",
        format: "invalid",
      });
    }

    // Appel API SIRENE (publique, sans clé)
    let apiData: unknown = null;
    try {
      const res = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${siren}&page=1&per_page=1`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) throw new Error(`API ${res.status}`);
      apiData = await res.json();
    } catch (err) {
      console.error("[api/sirene/check] API SIRENE down:", err);
      // Si l'API gouv.fr est down, on accepte le SIREN comme "format OK"
      // mais on signale que la vérification d'existence n'a pas pu être
      // faite. Pas bloquant pour ne pas planter l'onboarding.
      return NextResponse.json({
        valid: true,
        existence: "unknown",
        warning:
          "Format SIREN valide. Service de vérification SIRENE temporairement indisponible — sera revérifié par l'admin.",
        siren,
      });
    }

    // Parsing du résultat (structure typée a minima — on n'a besoin que
    // de la 1ère match avec le bon SIREN)
    const data = apiData as {
      results?: Array<{
        siren?: string;
        nom_complet?: string;
        nom_raison_sociale?: string;
        nature_juridique?: string;
        date_creation?: string;
        etat_administratif?: string;
        siege?: {
          adresse?: string;
          code_postal?: string;
          libelle_commune?: string;
        };
      }>;
    };

    const company = data.results?.find((r) => r.siren === siren);

    if (!company) {
      return NextResponse.json({
        valid: false,
        existence: "not_found",
        error: "SIREN introuvable dans le registre SIRENE",
        siren,
      });
    }

    // L'état administratif "A" = active, "C" = cessée
    const active = company.etat_administratif === "A";

    return NextResponse.json({
      valid: true,
      existence: "found",
      active,
      siren,
      name: company.nom_complet ?? company.nom_raison_sociale ?? null,
      legalForm: company.nature_juridique ?? null,
      address: [
        company.siege?.adresse,
        company.siege?.code_postal,
        company.siege?.libelle_commune,
      ]
        .filter(Boolean)
        .join(", "),
      createdAt: company.date_creation ?? null,
    });
  } catch (error) {
    console.error("[api/sirene/check] error:", error);
    return NextResponse.json(
      { valid: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
