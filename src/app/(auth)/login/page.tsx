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
      router.push("/step-2-company");
    } else {
      setError(data.error || "Email ou mot de passe incorrect");
      setLoading(false);
    }
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#f9f7f4"}}>
      <div style={{background:"white",borderRadius:12,padding:"32px",width:"100%",maxWidth:440,border:"1px solid #e5e3df"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <div style={{width:28,height:28,background:"#E87A30",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:600,fontSize:14}}>C</div>
          <span style={{fontWeight:500,fontSize:18}}>arlow</span>
          <span style={{color:"#888",fontSize:13,marginLeft:4}}>Portail vendeur</span>
        </div>
        <h1 style={{fontSize:20,fontWeight:500,margin:"0 0 6px"}}>Connectez-vous</h1>
        <p style={{color:"#666",fontSize:14,margin:"0 0 24px"}}>Acces a votre espace vendeur Carlow</p>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contact@entreprise.fr"
              required
              style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #e5e3df",fontSize:14,boxSizing:"border-box"}}
            />
          </div>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #e5e3df",fontSize:14,boxSizing:"border-box"}}
            />
          </div>
          {error && (
            <div style={{background:"#fff0f0",color:"#cc0000",padding:"8px 12px",borderRadius:8,fontSize:13,marginBottom:14}}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{width:"100%",padding:"10px",background:loading?"#f0a070":"#E87A30",color:"white",border:"none",borderRadius:8,fontSize:14,fontWeight:500,cursor:"pointer"}}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p style={{textAlign:"center",fontSize:13,color:"#888",marginTop:16}}>
          Pas encore de compte ?{" "}
          <a href="/register" style={{color:"#E87A30",textDecoration:"none"}}>Creer un compte</a>
        </p>
      </div>
    </div>
  );
}