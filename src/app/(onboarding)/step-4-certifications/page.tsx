"use client";
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
