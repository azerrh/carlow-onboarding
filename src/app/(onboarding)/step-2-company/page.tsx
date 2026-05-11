"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
import { ViesChecker } from "@/components/onboarding/ViesChecker";
import { SirenChecker } from "@/components/onboarding/SirenChecker";

/**
 * Étape 2 — Informations société.
 *
 * Refactor selon feedback Solelh Energie (mai 2026) :
 *  - SIREN à 9 chiffres (au lieu de SIRET 14)
 *  - Validation officielle via API recherche-entreprises.api.gouv.fr
 *  - SIREN devient OPTIONNEL pour les entreprises étrangères (la TVA
 *    intracommunautaire validée via VIES suffit comme identifiant légal)
 *  - On détecte automatiquement le pays depuis le préfixe du n° TVA
 *    (FR... → SIREN requis, autre pays UE → SIREN optionnel)
 */

export default function StepCompanyPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    company: "",
    siren: "",
    vat: "",
    legal: "SAS",
    address: "",
  });
  const [vatValid, setVatValid] = useState(false);
  const [sirenValid, setSirenValid] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Détection automatique du pays depuis le préfixe du n° TVA.
  // Si FR ou pas encore de préfixe → SIREN considéré requis.
  // Si autre pays UE → SIREN optionnel.
  const isFrench = useMemo(() => {
    const prefix = form.vat.slice(0, 2).toUpperCase();
    if (!prefix || prefix === "FR") return true;
    return false;
  }, [form.vat]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.vat.length < 4) {
      setError("Veuillez entrer un numéro de TVA intracommunautaire.");
      return;
    }
    // SIREN requis uniquement pour les entreprises françaises.
    if (isFrench && form.siren.length !== 9) {
      setError("Pour une entreprise française, le SIREN (9 chiffres) est requis.");
      return;
    }
    setLoading(true);
    setError("");
    const vendorId = localStorage.getItem("vendorId");
    const res = await fetch("/api/vendor/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId,
        company: form.company,
        // L'API attend `siret` pour compat (le champ DB s'appelle `siret`
        // historiquement, mais on y stocke maintenant un SIREN).
        siret: form.siren || null,
        vat: form.vat,
        legal: form.legal,
        address: form.address,
      }),
    });
    const data = await res.json();
    if (data.success) {
      router.push("/step-3-documents");
    } else {
      setError(data.error || "Erreur serveur");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9f7f4",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: "32px",
          width: "100%",
          maxWidth: 560,
          border: "1px solid #e5e3df",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "#E87A30",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            C
          </div>
          <span style={{ fontWeight: 500, fontSize: 18 }}>arlow</span>
        </div>
        <StepperBar current={1} />
        <h1 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 6px" }}>
          Informations société
        </h1>
        <p style={{ color: "#666", fontSize: 13, margin: "0 0 20px" }}>
          Le numéro de TVA est vérifié auprès de VIES (Commission européenne)
          et le SIREN auprès du registre SIRENE (INSEE).
        </p>

        <form onSubmit={handleSubmit}>
          {/* Raison sociale + forme juridique */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 180px",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  color: "#666",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Raison sociale
              </label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="SolarTech SAS"
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #e5e3df",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  color: "#666",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Forme juridique
              </label>
              <select
                value={form.legal}
                onChange={(e) => setForm({ ...form, legal: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #e5e3df",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              >
                <option>SAS</option>
                <option>SARL</option>
                <option>SA</option>
                <option>EURL</option>
                <option>SCI</option>
                <option>SASU</option>
                <option>EI</option>
                <option>Autre</option>
              </select>
            </div>
          </div>

          {/* TVA intracommunautaire (VIES) */}
          <div style={{ marginBottom: 14 }}>
            <ViesChecker
              value={form.vat}
              onChange={(vat) => setForm({ ...form, vat })}
              onValidated={(valid) => {
                setVatValid(valid);
              }}
            />
          </div>

          {/* SIREN — affiché optionnel pour les entreprises non-FR */}
          <div style={{ marginBottom: 14 }}>
            <SirenChecker
              value={form.siren}
              onChange={(siren) => setForm({ ...form, siren })}
              optional={!isFrench}
              onValidated={(valid, info) => {
                setSirenValid(valid);
                // Auto-remplissage à partir des données SIRENE — non
                // destructif : on ne remplace que si l'utilisateur n'a
                // pas déjà saisi quelque chose.
                if (info?.name && !form.company.trim()) {
                  setForm((f) => ({ ...f, company: info.name! }));
                }
                if (info?.address && !form.address.trim()) {
                  setForm((f) => ({ ...f, address: info.address! }));
                }
              }}
            />
            {!isFrench && (
              <p
                style={{
                  fontSize: 11,
                  color: "#888",
                  marginTop: 6,
                  fontStyle: "italic",
                }}
              >
                Entreprise étrangère détectée — le SIREN n&apos;est pas requis,
                votre n° TVA intracommunautaire suffit comme identifiant légal.
              </p>
            )}
          </div>

          {/* Adresse */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                color: "#666",
                display: "block",
                marginBottom: 4,
              }}
            >
              Adresse du siège
            </label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="12 rue des Énergies, 75001 Paris"
              required
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #e5e3df",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Récap des vérifications */}
          {(vatValid || sirenValid) && (
            <div
              style={{
                background: "#f0faf5",
                border: "1px solid #c5e7d4",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12,
                color: "#1a7445",
                marginBottom: 14,
              }}
            >
              <strong>Vérifications automatiques :</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {vatValid && <li>TVA intracommunautaire validée via VIES</li>}
                {sirenValid && <li>SIREN validé auprès du registre SIRENE</li>}
              </ul>
            </div>
          )}

          {error && (
            <div
              style={{
                background: "#fff0f0",
                color: "#cc0000",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => router.push("/register")}
              style={{
                flex: 1,
                padding: "10px",
                background: "white",
                color: "#666",
                border: "1px solid #e5e3df",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: "10px",
                background: loading ? "#f0a070" : "#E87A30",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {loading ? "Enregistrement..." : "Continuer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
