"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
import { ViesChecker } from "@/components/onboarding/ViesChecker";

export default function StepCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    company: "", siret: "", vat: "", legal: "SAS", address: ""
  });
  const [vatValid, setVatValid] = useState(false);
  const [vatCompany, setVatCompany] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vatValid) {
      setError("Veuillez entrer un numero TVA valide avant de continuer.");
      return;
    }
    setLoading(true);
    setError("");
    const vendorId = localStorage.getItem("vendorId");
    const res = await fetch("/api/vendor/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId, ...form }),
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
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#f9f7f4"}}>
      <div style={{background:"white",borderRadius:12,padding:"32px",width:"100%",maxWidth:520,border:"1px solid #e5e3df"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <div style={{width:28,height:28,background:"#E87A30",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:600,fontSize:14}}>C</div>
          <span style={{fontWeight:500,fontSize:18}}>arlow</span>
        </div>
        <StepperBar current={1} />
        <h1 style={{fontSize:18,fontWeight:500,margin:"0 0 6px"}}>Informations societe</h1>
        <p style={{color:"#666",fontSize:13,margin:"0 0 20px"}}>Ces informations seront verifiees automatiquement.</p>
        <form onSubmit={handleSubmit}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div>
              <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Raison sociale</label>
              <input value={form.company} onChange={e=>setForm({...form,company:e.target.value})}
                placeholder="SolarTech SAS" required
                style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}} />
            </div>
            <div>
              <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>SIRET</label>
              <input value={form.siret} onChange={e=>setForm({...form,siret:e.target.value})}
                placeholder="12345678900010" required maxLength={14}
                style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}} />
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <ViesChecker
              value={form.vat}
              onChange={vat => setForm({...form, vat})}
              onValidated={(valid, name) => {
                setVatValid(valid);
                if (name) setVatCompany(name);
              }}
            />
            <div>
              <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Forme juridique</label>
              <select value={form.legal} onChange={e=>setForm({...form,legal:e.target.value})}
                style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}}>
                <option>SAS</option><option>SARL</option><option>SA</option><option>EURL</option>
              </select>
            </div>
          </div>

          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Adresse du siege</label>
            <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}
              placeholder="12 rue des Energies, 75001 Paris" required
              style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}} />
          </div>

          {error && (
            <div style={{background:"#fff0f0",color:"#cc0000",padding:"8px 12px",borderRadius:8,fontSize:13,marginBottom:14}}>
              {error}
            </div>
          )}

          <div style={{display:"flex",gap:12}}>
            <button type="button" onClick={()=>router.push("/register")}
              style={{flex:1,padding:"10px",background:"white",color:"#666",border:"1px solid #e5e3df",borderRadius:8,fontSize:13,cursor:"pointer"}}>
              Retour
            </button>
            <button type="submit" disabled={loading}
              style={{flex:2,padding:"10px",background:loading?"#f0a070":"#E87A30",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:500,cursor:"pointer"}}>
              {loading ? "Enregistrement..." : "Continuer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}