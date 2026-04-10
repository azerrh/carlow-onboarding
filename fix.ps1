$base = "$HOME\Desktop\carlow-onboarding\src"

function W($path, $content) {
    $dir = Split-Path $path
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
    Write-Host "CREE: $path" -ForegroundColor Green
}

W "$base\app\page.tsx" 'import { redirect } from "next/navigation";
export default function Home() { redirect("/register"); }
'

W "$base\app\(auth)\register\page.tsx" '"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/step-2-company");
  }
  return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#f9f7f4"}}>
      <div style={{background:"white",borderRadius:12,padding:"32px",width:"100%",maxWidth:440,border:"1px solid #e5e3df"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <div style={{width:28,height:28,background:"#E87A30",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:600,fontSize:14}}>C</div>
          <span style={{fontWeight:500,fontSize:18}}>arlow</span>
          <span style={{color:"#888",fontSize:13,marginLeft:4}}>Portail vendeur</span>
        </div>
        <h1 style={{fontSize:20,fontWeight:500,margin:"0 0 6px"}}>Creez votre espace vendeur</h1>
        <p style={{color:"#666",fontSize:14,margin:"0 0 24px"}}>Vendez vos equipements EnR sur Carlow</p>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Nom complet</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Paul-Emile Dours" required style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #e5e3df",fontSize:14,boxSizing:"border-box"}} />
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Email professionnel</label>
            <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="contact@entreprise.fr" required style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #e5e3df",fontSize:14,boxSizing:"border-box"}} />
          </div>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Mot de passe</label>
            <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="8 caracteres minimum" required minLength={8} style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #e5e3df",fontSize:14,boxSizing:"border-box"}} />
          </div>
          <button type="submit" style={{width:"100%",padding:"10px",background:"#E87A30",color:"white",border:"none",borderRadius:8,fontSize:14,fontWeight:500,cursor:"pointer"}}>
            Creer mon compte
          </button>
        </form>
        <p style={{textAlign:"center",fontSize:13,color:"#888",marginTop:16}}>
          Deja un compte ? <a href="/login" style={{color:"#E87A30",textDecoration:"none"}}>Se connecter</a>
        </p>
      </div>
    </div>
  );
}
'

W "$base\components\onboarding\StepperBar.tsx" 'const STEPS = ["Compte","Societe","Documents","Certifications","Logistique","Confirmation"];
export function StepperBar({ current }: { current: number }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:28,overflowX:"auto"}}>
      {STEPS.map((s, i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,background:i<current?"#E87A30":i===current?"#fff7f0":"#f1efe8",color:i<current?"white":i===current?"#E87A30":"#aaa",border:i===current?"1.5px solid #E87A30":"1px solid #e5e3df"}}>
              {i < current ? "v" : i + 1}
            </div>
            <div style={{fontSize:10,marginTop:3,color:i===current?"#E87A30":"#aaa",whiteSpace:"nowrap"}}>{s}</div>
          </div>
          {i < STEPS.length - 1 && <div style={{width:20,height:1,background:i<current?"#E87A30":"#e5e3df",marginBottom:14,flexShrink:0}} />}
        </div>
      ))}
    </div>
  );
}
'

W "$base\app\(onboarding)\step-2-company\page.tsx" '"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
export default function StepCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState({ company:"", siret:"", vat:"", legal:"SAS", address:"" });
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); router.push("/step-3-documents"); }
  return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#f9f7f4"}}>
      <div style={{background:"white",borderRadius:12,padding:"32px",width:"100%",maxWidth:520,border:"1px solid #e5e3df"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <div style={{width:28,height:28,background:"#E87A30",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:600,fontSize:14}}>C</div>
          <span style={{fontWeight:500,fontSize:18}}>arlow</span>
        </div>
        <StepperBar current={1} />
        <h1 style={{fontSize:18,fontWeight:500,margin:"0 0 6px"}}>Informations societe</h1>
        <p style={{color:"#666",fontSize:13,margin:"0 0 20px"}}>Ces informations seront verifiees.</p>
        <form onSubmit={handleSubmit}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div>
              <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Raison sociale</label>
              <input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="SolarTech SAS" required style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}} />
            </div>
            <div>
              <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>SIRET</label>
              <input value={form.siret} onChange={e=>setForm({...form,siret:e.target.value})} placeholder="12345678900010" required maxLength={14} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}} />
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div>
              <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>N TVA</label>
              <input value={form.vat} onChange={e=>setForm({...form,vat:e.target.value})} placeholder="FR12345678901" required style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}} />
            </div>
            <div>
              <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Forme juridique</label>
              <select value={form.legal} onChange={e=>setForm({...form,legal:e.target.value})} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}}>
                <option>SAS</option><option>SARL</option><option>SA</option><option>EURL</option>
              </select>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Adresse du siege</label>
            <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="12 rue des Energies, 75001 Paris" required style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}} />
          </div>
          <div style={{display:"flex",gap:12}}>
            <button type="button" onClick={()=>router.push("/register")} style={{flex:1,padding:"10px",background:"white",color:"#666",border:"1px solid #e5e3df",borderRadius:8,fontSize:13,cursor:"pointer"}}>Retour</button>
            <button type="submit" style={{flex:2,padding:"10px",background:"#E87A30",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:500,cursor:"pointer"}}>Continuer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
'

W "$base\app\(onboarding)\step-3-documents\page.tsx" '"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
export default function StepDocumentsPage() {
  const router = useRouter();
  const [uploaded, setUploaded] = useState<string[]>([]);
  const docs = ["K-Bis (moins de 3 mois)","Statuts de la societe","Piece identite dirigeant","RIB bancaire"];
  return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#f9f7f4"}}>
      <div style={{background:"white",borderRadius:12,padding:"32px",width:"100%",maxWidth:520,border:"1px solid #e5e3df"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <div style={{width:28,height:28,background:"#E87A30",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:600,fontSize:14}}>C</div>
          <span style={{fontWeight:500,fontSize:18}}>arlow</span>
        </div>
        <StepperBar current={2} />
        <h1 style={{fontSize:18,fontWeight:500,margin:"0 0 6px"}}>Documents reglementaires</h1>
        <p style={{color:"#666",fontSize:13,margin:"0 0 20px"}}>Deposez les documents obligatoires.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          {docs.map((doc, i) => (
            <div key={i} onClick={()=>setUploaded(u=>u.includes(doc)?u:[...u,doc])} style={{border:uploaded.includes(doc)?"1.5px solid #E87A30":"1.5px dashed #e5e3df",borderRadius:8,padding:"16px",textAlign:"center",cursor:"pointer",background:uploaded.includes(doc)?"#fff7f0":"white"}}>
              <div style={{fontSize:22,marginBottom:6}}>{uploaded.includes(doc)?"OK":"+"}</div>
              <div style={{fontSize:11,fontWeight:500,color:uploaded.includes(doc)?"#E87A30":"#333"}}>{doc}</div>
              <div style={{fontSize:10,color:"#aaa",marginTop:2}}>{uploaded.includes(doc)?"Depose":"Cliquer pour deposer"}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:12}}>
          <button onClick={()=>router.push("/step-2-company")} style={{flex:1,padding:"10px",background:"white",color:"#666",border:"1px solid #e5e3df",borderRadius:8,fontSize:13,cursor:"pointer"}}>Retour</button>
          <button onClick={()=>router.push("/step-4-certifications")} style={{flex:2,padding:"10px",background:"#E87A30",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:500,cursor:"pointer"}}>Continuer</button>
        </div>
      </div>
    </div>
  );
}
'

W "$base\app\(onboarding)\step-4-certifications\page.tsx" '"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
export default function StepCertificationsPage() {
  const router = useRouter();
  const [files, setFiles] = useState<string[]>([]);
  const cats = ["Photovoltaique","Pompes a chaleur","Biomasse","Mobilite IRVE","Solaire thermique","GTB"];
  return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#f9f7f4"}}>
      <div style={{background:"white",borderRadius:12,padding:"32px",width:"100%",maxWidth:520,border:"1px solid #e5e3df"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <div style={{width:28,height:28,background:"#E87A30",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:600,fontSize:14}}>C</div>
          <span style={{fontWeight:500,fontSize:18}}>arlow</span>
        </div>
        <StepperBar current={3} />
        <h1 style={{fontSize:18,fontWeight:500,margin:"0 0 6px"}}>Certifications produits EnR</h1>
        <p style={{color:"#666",fontSize:13,margin:"0 0 12px"}}>Deposez vos certificats CE et Certisolis.</p>
        <div style={{background:"#fff7f0",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#E87A30",marginBottom:16}}>Certificats CE et fiches Certisolis PPE2 requis.</div>
        <div onClick={()=>setFiles(f=>[...f,"certificat_"+Date.now()+".pdf"])} style={{border:"1.5px dashed #e5e3df",borderRadius:8,padding:"24px",textAlign:"center",cursor:"pointer",marginBottom:12}}>
          <div style={{fontSize:24,marginBottom:6}}>+</div>
          <div style={{fontSize:13,fontWeight:500}}>Cliquer pour ajouter des fichiers</div>
          <div style={{fontSize:11,color:"#aaa"}}>PDF, ZIP acceptes</div>
        </div>
        {files.length > 0 && <div style={{marginBottom:12}}>{files.map((f,i)=><div key={i} style={{fontSize:12,background:"#f0faf5",color:"#22a06b",borderRadius:6,padding:"4px 10px",marginBottom:4}}>{f}</div>)}</div>}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:"#666",marginBottom:8}}>Categories concernees</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{cats.map((c,i)=><label key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,cursor:"pointer"}}><input type="checkbox" defaultChecked={i===0} /> {c}</label>)}</div>
        </div>
        <div style={{display:"flex",gap:12}}>
          <button onClick={()=>router.push("/step-3-documents")} style={{flex:1,padding:"10px",background:"white",color:"#666",border:"1px solid #e5e3df",borderRadius:8,fontSize:13,cursor:"pointer"}}>Retour</button>
          <button onClick={()=>router.push("/step-5-logistics")} style={{flex:2,padding:"10px",background:"#E87A30",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:500,cursor:"pointer"}}>Continuer</button>
        </div>
      </div>
    </div>
  );
}
'

W "$base\app\(onboarding)\step-5-logistics\page.tsx" '"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
export default function StepLogisticsPage() {
  const router = useRouter();
  const [form, setForm] = useState({ address:"", days:"3", weight:"800", incoterms:"DDP" });
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); router.push("/step-6-confirmation"); }
  return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#f9f7f4"}}>
      <div style={{background:"white",borderRadius:12,padding:"32px",width:"100%",maxWidth:520,border:"1px solid #e5e3df"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <div style={{width:28,height:28,background:"#E87A30",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:600,fontSize:14}}>C</div>
          <span style={{fontWeight:500,fontSize:18}}>arlow</span>
        </div>
        <StepperBar current={4} />
        <h1 style={{fontSize:18,fontWeight:500,margin:"0 0 6px"}}>Logistique et transport</h1>
        <p style={{color:"#666",fontSize:13,margin:"0 0 20px"}}>Configurez vos capacites de livraison.</p>
        <form onSubmit={handleSubmit}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div>
              <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Adresse expedition</label>
              <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Entrepot principal" required style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}} />
            </div>
            <div>
              <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Delai preparation (jours)</label>
              <input type="number" value={form.days} onChange={e=>setForm({...form,days:e.target.value})} min="1" max="30" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}} />
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Matrice de transport</label>
            <div style={{border:"1.5px dashed #e5e3df",borderRadius:8,padding:"14px",textAlign:"center",cursor:"pointer"}}>
              <div style={{fontSize:12,color:"#aaa"}}>Cliquer pour deposer votre fichier Excel/CSV</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            <div>
              <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Poids max palette kg</label>
              <input value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} placeholder="800" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}} />
            </div>
            <div>
              <label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Incoterms</label>
              <select value={form.incoterms} onChange={e=>setForm({...form,incoterms:e.target.value})} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13,boxSizing:"border-box"}}>
                <option value="DDP">DDP - Droits acquittes</option>
                <option value="EXW">EXW - A l usine</option>
                <option value="DAP">DAP - Destination</option>
                <option value="FCA">FCA - Franco transporteur</option>
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:12}}>
            <button type="button" onClick={()=>router.push("/step-4-certifications")} style={{flex:1,padding:"10px",background:"white",color:"#666",border:"1px solid #e5e3df",borderRadius:8,fontSize:13,cursor:"pointer"}}>Retour</button>
            <button type="submit" style={{flex:2,padding:"10px",background:"#E87A30",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:500,cursor:"pointer"}}>Soumettre le dossier</button>
          </div>
        </form>
      </div>
    </div>
  );
}
'

W "$base\app\(onboarding)\step-6-confirmation\page.tsx" '"use client";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
export default function StepConfirmationPage() {
  const router = useRouter();
  const recap = [["Compte","Valide"],["Informations societe","Valide"],["Documents KYC","Deposes"],["Certifications EnR","Deposees"],["Logistique","Configuree"],["Verification TVA","Confirmee"]];
  return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#f9f7f4"}}>
      <div style={{background:"white",borderRadius:12,padding:"40px 32px",width:"100%",maxWidth:480,border:"1px solid #e5e3df",textAlign:"center"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:24}}>
          <div style={{width:28,height:28,background:"#E87A30",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:600,fontSize:14}}>C</div>
          <span style={{fontWeight:500,fontSize:18}}>arlow</span>
        </div>
        <StepperBar current={5} />
        <div style={{width:56,height:56,background:"#E87A30",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",color:"white",fontSize:24,fontWeight:700}}>OK</div>
        <h1 style={{fontSize:20,fontWeight:500,margin:"0 0 8px"}}>Dossier soumis avec succes !</h1>
        <p style={{color:"#666",fontSize:14,margin:"0 0 28px"}}>Notre equipe verifie votre dossier sous 24-48h.</p>
        <div style={{background:"#f9f7f4",borderRadius:8,padding:"16px",textAlign:"left",marginBottom:24}}>
          <div style={{fontSize:12,fontWeight:500,marginBottom:12}}>Recapitulatif</div>
          {recap.map(([label,val],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"6px 0",borderBottom:"1px solid #e5e3df"}}>
              <span style={{color:"#666"}}>{label}</span>
              <span style={{color:"#22a06b",fontWeight:500}}>{val}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>router.push("/register")} style={{width:"100%",padding:"10px",background:"#E87A30",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:500,cursor:"pointer"}}>
          Retour a l accueil
        </button>
      </div>
    </div>
  );
}
'

Write-Host "" 
Write-Host "TOUT EST PRET !" -ForegroundColor Cyan
Write-Host "Testez sur http://localhost:3000" -ForegroundColor Cyan