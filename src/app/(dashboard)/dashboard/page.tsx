"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Vendor {
  id: string;
  name: string;
  email: string;
  status: string;
  onboardingStep: number;
  companyName: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) { router.push("/login"); return; }
    fetch(`/api/vendor/me?id=${vendorId}`)
      .then(r => r.json())
      .then(data => { setVendor(data.vendor); setLoading(false); })
      .catch(() => { router.push("/login"); });
  }, [router]);

  if (loading) return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#f9f7f4"}}>
      <div style={{fontSize:14,color:"#888"}}>Chargement...</div>
    </div>
  );

  const steps = [
    { label: "Compte", done: true },
    { label: "Societe", done: (vendor?.onboardingStep ?? 0) > 1 },
    { label: "Documents", done: (vendor?.onboardingStep ?? 0) > 2 },
    { label: "Certifications", done: (vendor?.onboardingStep ?? 0) > 3 },
    { label: "Logistique", done: (vendor?.onboardingStep ?? 0) > 4 },
    { label: "Validation", done: vendor?.status === "submitted" },
  ];

  const progress = Math.round((steps.filter(s => s.done).length / steps.length) * 100);

  const statusColor = vendor?.status === "submitted" ? "#22a06b" :
                      vendor?.status === "active" ? "#E87A30" : "#888";
  const statusLabel = vendor?.status === "submitted" ? "Dossier soumis" :
                      vendor?.status === "active" ? "Compte actif" : "En cours";

  return (
    <div style={{minHeight:"100vh",background:"#f9f7f4"}}>
      <div style={{background:"white",borderBottom:"1px solid #e5e3df",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,background:"#E87A30",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:600,fontSize:14}}>C</div>
          <span style={{fontWeight:500,fontSize:18}}>arlow</span>
          <span style={{color:"#888",fontSize:13,marginLeft:4}}>Portail vendeur</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:13,color:"#666"}}>{vendor?.name}</span>
          <button onClick={()=>{ localStorage.removeItem("vendorId"); router.push("/login"); }}
            style={{fontSize:12,color:"#888",background:"none",border:"0.5px solid #e5e3df",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>
            Deconnexion
          </button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
        <h1 style={{fontSize:20,fontWeight:500,margin:"0 0 4px"}}>Bonjour, {vendor?.name} !</h1>
        <p style={{color:"#666",fontSize:14,margin:"0 0 28px"}}>Voici l etat de votre dossier vendeur Carlow.</p>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12,marginBottom:28}}>
          <div style={{background:"white",borderRadius:10,padding:"16px 20px",border:"1px solid #e5e3df"}}>
            <div style={{fontSize:12,color:"#888",marginBottom:6}}>Statut dossier</div>
            <div style={{fontSize:18,fontWeight:500,color:statusColor}}>{statusLabel}</div>
          </div>
          <div style={{background:"white",borderRadius:10,padding:"16px 20px",border:"1px solid #e5e3df"}}>
            <div style={{fontSize:12,color:"#888",marginBottom:6}}>Progression</div>
            <div style={{fontSize:18,fontWeight:500,color:"#E87A30"}}>{progress}%</div>
          </div>
          <div style={{background:"white",borderRadius:10,padding:"16px 20px",border:"1px solid #e5e3df"}}>
            <div style={{fontSize:12,color:"#888",marginBottom:6}}>Societe</div>
            <div style={{fontSize:15,fontWeight:500,color:"#333"}}>{vendor?.companyName || "Non renseignee"}</div>
          </div>
        </div>

        <div style={{background:"white",borderRadius:10,padding:"20px 24px",border:"1px solid #e5e3df",marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:16}}>Progression du dossier</div>
          <div style={{background:"#f1efe8",borderRadius:20,height:8,marginBottom:20}}>
            <div style={{background:"#E87A30",borderRadius:20,height:8,width:`${progress}%`,transition:"width .5s"}} />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10}}>
            {steps.map((step, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:8,background:step.done?"#fff7f0":"#f9f7f4",border:`1px solid ${step.done?"#E87A30":"#e5e3df"}`}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:step.done?"#E87A30":"#e5e3df",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white",fontWeight:600,flexShrink:0}}>
                  {step.done ? "v" : i+1}
                </div>
                <span style={{fontSize:12,fontWeight:step.done?500:400,color:step.done?"#E87A30":"#888"}}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {(vendor?.onboardingStep ?? 0) < 6 && vendor?.status !== "submitted" && (
          <div style={{background:"#fff7f0",borderRadius:10,padding:"16px 20px",border:"1px solid #E87A30",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:"#E87A30",marginBottom:2}}>Dossier incomplet</div>
              <div style={{fontSize:13,color:"#666"}}>Completez votre dossier pour activer votre compte vendeur.</div>
            </div>
            <button onClick={()=>router.push("/step-2-company")}
              style={{padding:"8px 16px",background:"#E87A30",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap"}}>
              Continuer
            </button>
          </div>
        )}

        {vendor?.status === "submitted" && (
          <div style={{background:"#f0faf5",borderRadius:10,padding:"16px 20px",border:"1px solid #22a06b"}}>
            <div style={{fontSize:14,fontWeight:500,color:"#22a06b",marginBottom:2}}>Dossier en cours de verification</div>
            <div style={{fontSize:13,color:"#666"}}>Notre equipe verifie votre dossier sous 24-48h. Vous recevrez un email de confirmation.</div>
          </div>
        )}
      </div>
    </div>
  );
}