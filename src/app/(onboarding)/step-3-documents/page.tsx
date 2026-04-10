"use client";
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
