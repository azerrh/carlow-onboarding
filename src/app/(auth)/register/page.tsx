"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("vendorId", data.vendorId);
      router.push("/step-2-company");
    } else {
      setError(data.error);
      setLoading(false);
    }
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#f9f7f4"}}>
      <div style={{flex:1,display:"none",background:"linear-gradient(135deg,#E87A30,#c4621a)",padding:48,flexDirection:"column",justifyContent:"center",alignItems:"flex-start"}}>
        <div style={{color:"white"}}>
          <div style={{fontSize:32,fontWeight:700,marginBottom:16}}>Carlow</div>
          <div style={{fontSize:18,opacity:.9,marginBottom:24}}>Marketplace BtoB specialiste EnR</div>
          <div style={{fontSize:14,opacity:.8,lineHeight:1.8}}>
            Vendez vos equipements photovoltaiques,<br/>
            pompes a chaleur, biomasse et plus encore.
          </div>
        </div>
      </div>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:"100%",maxWidth:420,background:"white",borderRadius:16,padding:40,boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #e5e3df"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32}}>
            <div style={{width:36,height:36,background:"#E87A30",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:18}}>C</div>
            <span style={{fontWeight:600,fontSize:20,color:"#1a1a1a"}}>arlow</span>
            <span style={{background:"#fff7f0",color:"#E87A30",fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:500,border:"1px solid #ffd9b8"}}>Portail vendeur</span>
          </div>

          <h1 style={{fontSize:24,fontWeight:600,color:"#1a1a1a",margin:"0 0 6px"}}>Creez votre compte</h1>
          <p style={{color:"#666",fontSize:14,margin:"0 0 28px"}}>Rejoignez la marketplace BtoB specialiste EnR</p>

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:500,color:"#333",display:"block",marginBottom:6}}>Nom complet</label>
              <input
                value={name}
                onChange={e=>setName(e.target.value)}
                placeholder="Paul-Emile Dours"
                required
                style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #e5e3df",fontSize:14,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"}}
              />
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:500,color:"#333",display:"block",marginBottom:6}}>Email professionnel</label>
              <input
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="contact@entreprise.fr"
                required
                style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #e5e3df",fontSize:14,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"}}
              />
            </div>
            <div style={{marginBottom:24}}>
              <label style={{fontSize:13,fontWeight:500,color:"#333",display:"block",marginBottom:6}}>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="8 caracteres minimum"
                required
                minLength={8}
                style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #e5e3df",fontSize:14,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"}}
              />
            </div>

            {error && (
              <div style={{background:"#fff0f0",color:"#cc0000",padding:"10px 14px",borderRadius:8,fontSize:13,marginBottom:16,border:"1px solid #ffd0d0"}}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{width:"100%",padding:"12px",background:loading?"#f0a070":"#E87A30",color:"white",border:"none",borderRadius:8,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
            >
              {loading ? "Creation en cours..." : "Creer mon compte →"}
            </button>
          </form>

          <div style={{textAlign:"center",marginTop:24,paddingTop:20,borderTop:"1px solid #f1efe8"}}>
            <span style={{fontSize:14,color:"#666"}}>Deja un compte ? </span>
            <a href="/login" style={{fontSize:14,fontWeight:500,color:"#E87A30",textDecoration:"none"}}>Se connecter</a>
          </div>
        </div>
      </div>
    </div>
  );
}