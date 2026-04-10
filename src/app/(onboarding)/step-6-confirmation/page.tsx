"use client";
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
