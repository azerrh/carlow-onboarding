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
    <div style={{display:"flex",minHeight:"100vh",background:"var(--gray-50)"}}>
      <div style={{display:"none",flex:1,background:"linear-gradient(135deg, #E87A30 0%, #c4621a 100%)",padding:"48px",flexDirection:"column",justifyContent:"space-between"}} className="left-panel">
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
        <div style={{width:"100%",maxWidth:420}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:40}}>
            <div style={{width:36,height:36,background:"var(--orange)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:18,boxShadow:"0 2px 8px rgba(232,122,48,0.3)"}}>C</div>
            <span style={{fontWeight:600,fontSize:22,color:"var(--gray-900)"}}>arlow</span>
            <span style={{background:"var(--orange-light)",color:"var(--orange)",fontSize:12,padding:"2px 8px",borderRadius:20,fontWeight:500}}>Portail vendeur</span>
          </div>

          <h1 style={{fontSize:26,fontWeight:600,color:"var(--gray-900)",margin:"0 0 8px"}}>Creez votre compte</h1>
          <p style={{color:"var(--gray-600)",fontSize:15,margin:"0 0 32px"}}>Rejoignez la marketplace BtoB specialiste EnR</p>

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:500,color:"var(--gray-900)",display:"block",marginBottom:6}}>Nom complet</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Paul-Emile Dours" required />
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:500,color:"var(--gray-900)",display:"block",marginBottom:6}}>Email professionnel</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="contact@entreprise.fr" required />
            </div>
            <div style={{marginBottom:24}}>
              <label style={{fontSize:13,fontWeight:500,color:"var(--gray-900)",display:"block",marginBottom:6}}>Mot de passe</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="8 caracteres minimum" required minLength={8} />
            </div>

            {error && (
              <div style={{background:"#fff0f0",color:"var(--red)",padding:"10px 14px",borderRadius:"var(--radius-sm)",fontSize:13,marginBottom:16,border:"1px solid #ffd0d0"}}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{width:"100%",padding:"12px",background:loading?"#f0a070":"var(--orange)",color:"white",border:"none",borderRadius:"var(--radius-sm)",fontSize:15,fontWeight:600,boxShadow:"0 2px 8px rgba(232,122,48,0.3)"}}>
              {loading ? "Creation en cours..." : "Creer mon compte →"}
            </button>
          </form>

          <div style={{textAlign:"center",marginTop:24,paddingTop:24,borderTop:"1px solid var(--gray-200)"}}>
            <span style={{fontSize:14,color:"var(--gray-600)"}}>Deja un compte ? </span>
            <a href="/login" style={{fontSize:14,fontWeight:500}}>Se connecter</a>
          </div>
        </div>
      </div>
    </div>
  );
}