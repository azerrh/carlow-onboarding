"use client";

import { useRef, useState } from "react";

/**
 * Composant de validation du SIREN en temps réel (debounce 1s).
 *
 * Calque sur ViesChecker pour rester cohérent visuellement.
 *
 * - Format : 9 chiffres (séparateurs autorisés à la saisie, nettoyés ensuite)
 * - Validation côté serveur via `/api/sirene/check` qui interroge l'API
 *   officielle gouv.fr
 * - Retourne en plus du valid/invalid : nom de l'entreprise, état actif,
 *   forme juridique, adresse (utile pour auto-remplir le formulaire)
 *
 * Prop `optional` : si true (entreprise étrangère), n'affiche pas d'erreur
 * si le champ est vide.
 */

interface Props {
  value: string;
  onChange: (value: string) => void;
  /**
   * Appelé à chaque résultat de vérification. Le caller peut décider
   * d'auto-remplir d'autres champs (raison sociale, adresse) avec les
   * données retournées.
   */
  onValidated: (
    valid: boolean,
    info?: {
      name?: string | null;
      legalForm?: string | null;
      address?: string | null;
      active?: boolean;
    }
  ) => void;
  optional?: boolean;
}

type Status = "idle" | "checking" | "valid" | "invalid" | "warning";

export function SirenChecker({ value, onChange, onValidated, optional }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [info, setInfo] = useState<{
    name?: string | null;
    legalForm?: string | null;
    address?: string | null;
    active?: boolean;
    warning?: string;
  }>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function checkSiren(nextValue: string) {
    try {
      const res = await fetch(
        `/api/sirene/check?siren=${encodeURIComponent(nextValue)}`
      );
      const data = await res.json();

      if (!data.valid) {
        setStatus("invalid");
        setInfo({});
        onValidated(false);
        return;
      }

      if (data.existence === "unknown") {
        // Format valide mais API gouv.fr indisponible — on accepte mais
        // on prévient l'utilisateur.
        setStatus("warning");
        setInfo({ warning: data.warning });
        onValidated(true);
        return;
      }

      setStatus("valid");
      const next = {
        name: data.name as string | null,
        legalForm: data.legalForm as string | null,
        address: data.address as string | null,
        active: data.active as boolean,
      };
      setInfo(next);
      onValidated(true, next);
    } catch {
      setStatus("invalid");
      onValidated(false);
    }
  }

  function handleChange(nextRaw: string) {
    // On nettoie au passage : ne garde que les chiffres
    const digits = nextRaw.replace(/\D/g, "").slice(0, 9);
    onChange(digits);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!digits) {
      // Si optionnel (entreprise étrangère) et vide → idle silencieux
      setStatus("idle");
      setInfo({});
      onValidated(!!optional);
      return;
    }
    if (digits.length < 9) {
      setStatus("idle");
      setInfo({});
      onValidated(false);
      return;
    }

    setStatus("checking");
    timerRef.current = setTimeout(() => {
      void checkSiren(digits);
    }, 1000);
  }

  const badge = {
    idle: { text: "SIREN", bg: "#f1efe8", color: "#888" },
    checking: { text: "Vérification...", bg: "#fff7f0", color: "#E87A30" },
    valid: { text: "✓ SIRENE", bg: "#f0faf5", color: "#22a06b" },
    warning: { text: "Format OK", bg: "#fff7f0", color: "#E87A30" },
    invalid: { text: "Invalide", bg: "#fff0f0", color: "#cc0000" },
  }[status];

  // Affichage formaté pour lisibilité (XXX XXX XXX) sans modifier la
  // valeur stockée en state.
  const display =
    value.length === 9
      ? `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6, 9)}`
      : value;

  return (
    <div>
      <label
        style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}
      >
        SIREN {optional && <span style={{ color: "#999" }}>(optionnel)</span>}
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="123 456 789"
          inputMode="numeric"
          maxLength={11} // 9 chiffres + 2 espaces
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: `1px solid ${
              status === "valid"
                ? "#22a06b"
                : status === "invalid"
                  ? "#cc0000"
                  : status === "warning"
                    ? "#E87A30"
                    : "#e5e3df"
            }`,
            fontSize: 13,
            fontFamily: "ui-monospace, Consolas, monospace",
            boxSizing: "border-box" as const,
          }}
        />
        <span
          style={{
            background: badge.bg,
            color: badge.color,
            padding: "4px 10px",
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: "nowrap" as const,
          }}
        >
          {badge.text}
        </span>
      </div>

      {status === "valid" && info.name && (
        <div style={{ fontSize: 11, color: "#22a06b", marginTop: 4 }}>
          ✓ {info.name}
          {info.legalForm ? ` (${info.legalForm})` : ""}
          {info.active === false && (
            <span style={{ color: "#cc0000" }}>
              {" "}
              · Établissement marqué fermé
            </span>
          )}
        </div>
      )}
      {status === "warning" && info.warning && (
        <div style={{ fontSize: 11, color: "#E87A30", marginTop: 4 }}>
          ⚠ {info.warning}
        </div>
      )}
      {status === "invalid" && (
        <div style={{ fontSize: 11, color: "#cc0000", marginTop: 4 }}>
          SIREN invalide ou introuvable au registre SIRENE.
        </div>
      )}
    </div>
  );
}
