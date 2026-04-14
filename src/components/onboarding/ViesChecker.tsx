"use client";
import { useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onValidated: (valid: boolean, companyName?: string) => void;
}

export function ViesChecker({ value, onChange, onValidated }: Props) {
  const [status, setStatus] = useState<"idle"|"checking"|"valid"|"invalid">("idle");
  const [companyName, setCompanyName] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function checkVat(nextValue: string) {
    try {
      const res = await fetch(`/api/vies/check?vat=${encodeURIComponent(nextValue)}`);
      const data = await res.json();

      if (data.valid) {
        setStatus("valid");
        setCompanyName(data.name || "");
        onValidated(true, data.name);
      } else {
        setStatus("invalid");
        setCompanyName("");
        onValidated(false);
      }
    } catch {
      setStatus("invalid");
      onValidated(false);
    }
  }

  function handleChange(nextRaw: string) {
    const next = nextRaw.toUpperCase();
    onChange(next);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!next || next.length < 6) {
      setStatus("idle");
      setCompanyName("");
      onValidated(false);
      return;
    }

    setStatus("checking");
    timerRef.current = setTimeout(() => {
      void checkVat(next);
    }, 1000);
  }

  const badge = {
    idle:     { text: "VIES",            bg: "#f1efe8", color: "#888" },
    checking: { text: "Verification...", bg: "#fff7f0", color: "#E87A30" },
    valid:    { text: "TVA valide",      bg: "#f0faf5", color: "#22a06b" },
    invalid:  { text: "TVA invalide",    bg: "#fff0f0", color: "#cc0000" },
  }[status];

  return (
    <div>
      <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>
        N TVA intracommunautaire
      </label>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="FR12345678901"
          style={{flex:1,padding:"8px 10px",borderRadius:8,
            border:`1px solid ${status==="valid"?"#22a06b":status==="invalid"?"#cc0000":"#e5e3df"}`,
            fontSize:13,boxSizing:"border-box" as const}}
        />
        <span style={{background:badge.bg,color:badge.color,padding:"4px 10px",
          borderRadius:12,fontSize:11,fontWeight:500,whiteSpace:"nowrap" as const}}>
          {badge.text}
        </span>
      </div>
      {status === "valid" && companyName && (
        <div style={{fontSize:11,color:"#22a06b",marginTop:4}}>
          Societe : {companyName}
        </div>
      )}
      {status === "invalid" && (
        <div style={{fontSize:11,color:"#E87A30",marginTop:4}}>
          Service VIES indisponible — le numero sera verifie ulterieurement
        </div>
      )}
    </div>
  );
}