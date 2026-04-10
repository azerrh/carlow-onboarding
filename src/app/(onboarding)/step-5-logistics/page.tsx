"use client";
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
