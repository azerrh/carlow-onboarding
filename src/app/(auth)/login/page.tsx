"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("vendorId", data.vendorId);
      router.push("/dashboard");
    } else {
      setError(data.error || "Email ou mot de passe incorrect");
      setLoading(false);
    }
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#f9f7f4",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:420,background:"white",borderRadius:16,padding:40,boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #e5e3df"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32}}>
          <div style={{width:36,height:36,background:"#E87A30",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:18}}>C</div>
          <span style={{fontWeight:600,fontSize:20,color:"#1a1a1a"}}>arlow</span>
          <span style={{background:"#fff7f0",color:"#E87A30",fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:500,border:"1px solid #ffd9b8"}}>Portail vendeur</span>
        </div>

        <h1 style={{fontSize:24,fontWeight:600,color:"#1a1a1a",margin:"0 0 6px"}}>Bon retour !</h1>
        <p style={{color:"#666",fontSize:14,margin:"0 0 28px"}}>Connectez-vous a votre espace vendeur</p>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:13,fontWeight:500,color:"#333",display:"block",marginBottom:6}}>Email professionnel</label>
            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="contact@entreprise.fr"
              required
              style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #e5e3df",fontSize:14,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit",color:"#1a1a1a",background:"white"}}
            />
          </div>
          <div style={{marginBottom:24}}>
            <label style={{fontSize:13,fontWeight:500,color:"#333",display:"block",marginBottom:6}}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #e5e3df",fontSize:14,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit",color:"#1a1a1a",background:"white"}}
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
            {loading ? "Connexion..." : "Se connecter →"}
          </button>
        </form>

        <div style={{textAlign:"center",marginTop:24,paddingTop:20,borderTop:"1px solid #f1efe8"}}>
          <span style={{fontSize:14,color:"#666"}}>Pas encore de compte ? </span>
          <a href="/register" style={{fontSize:14,fontWeight:500,color:"#E87A30",textDecoration:"none"}}>Creer un compte</a>
        </div>
      </div>
    </div>
  );
}