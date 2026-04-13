"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Vendor {
  id: string;
  name: string;
  email: string;
  status: string;
  onboardingStep: number;
  companyName: string | null;
  siret: string | null;
  vatNumber: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/vendors")
      .then(r => r.json())
      .then(data => { setVendors(data.vendors || []); setLoading(false); });
  }, []);

  const filtered = vendors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
                        v.email.toLowerCase().includes(search.toLowerCase()) ||
                        (v.companyName || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || v.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: vendors.length,
    pending: vendors.filter(v => v.status === "pending").length,
    submitted: vendors.filter(v => v.status === "submitted").length,
    active: vendors.filter(v => v.status === "active").length,
  };

  async function updateStatus(id: string, status: string) {
    await fetch("/api/admin/vendors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setVendors(vs => vs.map(v => v.id === id ? { ...v, status } : v));
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      pending:   { bg: "#f1efe8", color: "#888",    label: "En cours" },
      submitted: { bg: "#fff7f0", color: "#E87A30", label: "Soumis" },
      active:    { bg: "#f0faf5", color: "#22a06b", label: "Actif" },
      rejected:  { bg: "#fff0f0", color: "#cc0000", label: "Rejete" },
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{ background: s.bg, color: s.color, padding: "2px 8px",
                     borderRadius: 12, fontSize: 11, fontWeight: 500 }}>
        {s.label}
      </span>
    );
  };

  if (loading) return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#f9f7f4"}}>
      <div style={{fontSize:14,color:"#888"}}>Chargement...</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f9f7f4"}}>
      <div style={{background:"white",borderBottom:"1px solid #e5e3df",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,background:"#E87A30",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:600,fontSize:14}}>C</div>
          <span style={{fontWeight:500,fontSize:18}}>arlow</span>
          <span style={{background:"#fff7f0",color:"#E87A30",fontSize:11,padding:"2px 8px",borderRadius:10,marginLeft:8,fontWeight:500}}>Admin</span>
        </div>
        <button onClick={()=>router.push("/dashboard")}
          style={{fontSize:12,color:"#888",background:"none",border:"0.5px solid #e5e3df",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>
          Portail vendeur
        </button>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px"}}>
        <h1 style={{fontSize:20,fontWeight:500,margin:"0 0 4px"}}>Gestion des vendeurs</h1>
        <p style={{color:"#666",fontSize:14,margin:"0 0 24px"}}>Carlow Marketplace — Interface administration</p>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12,marginBottom:28}}>
          {[
            { label: "Total vendeurs", value: stats.total, color: "#333" },
            { label: "En cours", value: stats.pending, color: "#888" },
            { label: "Dossiers soumis", value: stats.submitted, color: "#E87A30" },
            { label: "Comptes actifs", value: stats.active, color: "#22a06b" },
          ].map((stat, i) => (
            <div key={i} style={{background:"white",borderRadius:10,padding:"16px 20px",border:"1px solid #e5e3df"}}>
              <div style={{fontSize:12,color:"#888",marginBottom:6}}>{stat.label}</div>
              <div style={{fontSize:24,fontWeight:500,color:stat.color}}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{background:"white",borderRadius:10,border:"1px solid #e5e3df",overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid #e5e3df",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher vendeur, email, societe..."
              style={{flex:1,minWidth:200,padding:"7px 12px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13}}
            />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{padding:"7px 12px",borderRadius:8,border:"1px solid #e5e3df",fontSize:13}}>
              <option value="all">Tous les statuts</option>
              <option value="pending">En cours</option>
              <option value="submitted">Soumis</option>
              <option value="active">Actif</option>
              <option value="rejected">Rejete</option>
            </select>
            <span style={{fontSize:13,color:"#888"}}>{filtered.length} vendeur(s)</span>
          </div>

          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"#f9f7f4"}}>
                {["Vendeur","Societe","SIRET","Etape","Statut","Actions"].map((h,i) => (
                  <th key={i} style={{padding:"10px 16px",textAlign:"left",fontSize:12,fontWeight:500,color:"#888",borderBottom:"1px solid #e5e3df"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{padding:"24px",textAlign:"center",fontSize:13,color:"#aaa"}}>Aucun vendeur trouve</td></tr>
              ) : filtered.map((vendor, i) => (
                <tr key={vendor.id} style={{borderBottom:"1px solid #f1efe8",background:i%2===0?"white":"#fdfcfb"}}>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{fontSize:13,fontWeight:500,color:"#333"}}>{vendor.name}</div>
                    <div style={{fontSize:12,color:"#888"}}>{vendor.email}</div>
                  </td>
                  <td style={{padding:"12px 16px",fontSize:13,color:"#555"}}>{vendor.companyName || "-"}</td>
                  <td style={{padding:"12px 16px",fontSize:12,color:"#888",fontFamily:"monospace"}}>{vendor.siret || "-"}</td>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:60,height:6,background:"#f1efe8",borderRadius:10}}>
                        <div style={{width:`${Math.round((vendor.onboardingStep/6)*100)}%`,height:6,background:"#E87A30",borderRadius:10}} />
                      </div>
                      <span style={{fontSize:11,color:"#888"}}>{vendor.onboardingStep}/6</span>
                    </div>
                  </td>
                  <td style={{padding:"12px 16px"}}>{statusBadge(vendor.status)}</td>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {vendor.status === "submitted" && (
                        <button onClick={()=>updateStatus(vendor.id,"active")}
                          style={{fontSize:11,padding:"3px 8px",background:"#f0faf5",color:"#22a06b",border:"1px solid #22a06b",borderRadius:6,cursor:"pointer"}}>
                          Activer
                        </button>
                      )}
                      {vendor.status === "submitted" && (
                        <button onClick={()=>updateStatus(vendor.id,"rejected")}
                          style={{fontSize:11,padding:"3px 8px",background:"#fff0f0",color:"#cc0000",border:"1px solid #cc0000",borderRadius:6,cursor:"pointer"}}>
                          Rejeter
                        </button>
                      )}
                      {vendor.status === "active" && (
                        <button onClick={()=>updateStatus(vendor.id,"pending")}
                          style={{fontSize:11,padding:"3px 8px",background:"#f1efe8",color:"#888",border:"1px solid #e5e3df",borderRadius:6,cursor:"pointer"}}>
                          Suspendre
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}