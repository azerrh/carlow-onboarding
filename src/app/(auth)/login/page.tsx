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
    <div style={{display:"flex",minHeight:"100vh",background:"var(--gray-50)"}}>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
        <div style={{width:"100%",maxWidth:420}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:40}}>
            <div style={{width:36,height:36,background:"var(--orange)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:18,boxShadow:"0 2px 8px rgba(232,122,48,0.3)"}}>C</div>
            <span style={{fontWeight:600,fontSize:22,color:"var(--gray-900)"}}>arlow</span>
            <span style={{background:"var(--orange-light)",color:"var(--orange)",fontSize:12,padding:"2px 8px",borderRadius:20,fontWeight:500}}>Portail vendeur</span>
          </div>

          <h1 style={{fontSize:26,fontWeight:600,color:"var(--gray-900)",margin:"0 0 8px"}}>Bon retour !</h1>
          <p style={{color:"var(--gray-600)",fontSize:15,margin:"0 0 32px"}}>Connectez-vous a votre espace vendeur</p>

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:500,color:"var(--gray-900)",display:"block",marginBottom:6}}>Email professionnel</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="contact@entreprise.fr" required />
            </div>
            <div style={{marginBottom:24}}>
              <label style={{fontSize:13,fontWeight:500,color:"var(--gray-900)",display:"block",marginBottom:6}}>Mot de passe</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Votre mot de passe" required />
            </div>

            {error && (
              <div style={{background:"#fff0f0",color:"var(--red)",padding:"10px 14px",borderRadius:"var(--radius-sm)",fontSize:13,marginBottom:16,border:"1px solid #ffd0d0"}}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{width:"100%",padding:"12px",background:loading?"#f0a070":"var(--orange)",color:"white",border:"none",borderRadius:"var(--radius-sm)",fontSize:15,fontWeight:600,boxShadow:"0 2px 8px rgba(232,122,48,0.3)"}}>
              {loading ? "Connexion..." : "Se connecter →"}
            </button>
          </form>

          <div style={{textAlign:"center",marginTop:24,paddingTop:24,borderTop:"1px solid var(--gray-200)"}}>
            <span style={{fontSize:14,color:"var(--gray-600)"}}>Pas encore de compte ? </span>
            <a href="/register" style={{fontSize:14,fontWeight:500}}>Creer un compte</a>
          </div>
        </div>
      </div>
    </div>
  );
}