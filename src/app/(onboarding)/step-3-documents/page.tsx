"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";

interface UploadedDoc {
  name: string;
  status: "uploading" | "done" | "error";
}

const DOCS = [
  { key: "kbis",    label: "K-Bis",               desc: "Moins de 3 mois" },
  { key: "statuts", label: "Statuts societe",      desc: "PDF" },
  { key: "id",      label: "Piece identite",       desc: "Dirigeant recto/verso" },
  { key: "rib",     label: "RIB bancaire",         desc: "Coordonnees bancaires" },
];

export default function StepDocumentsPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState<Record<string, UploadedDoc>>({});

  async function handleUpload(key: string, file: File) {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) return;

    setUploads(u => ({ ...u, [key]: { name: file.name, status: "uploading" } }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", vendorId);
    formData.append("type", key);

    try {
      const res = await fetch("/api/vendor/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setUploads(u => ({ ...u, [key]: { name: file.name, status: "done" } }));
      } else {
        setUploads(u => ({ ...u, [key]: { name: file.name, status: "error" } }));
      }
    } catch {
      setUploads(u => ({ ...u, [key]: { name: file.name, status: "error" } }));
    }
  }

  const allUploaded = DOCS.every(d => uploads[d.key]?.status === "done");

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#f9f7f4",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:560,background:"white",borderRadius:16,padding:40,boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #e5e3df"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
          <div style={{width:36,height:36,background:"#E87A30",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:18}}>C</div>
          <span style={{fontWeight:600,fontSize:20,color:"#1a1a1a"}}>arlow</span>
        </div>
        <StepperBar current={2} />
        <h1 style={{fontSize:22,fontWeight:600,color:"#1a1a1a",margin:"0 0 6px"}}>Documents reglementaires</h1>
        <p style={{color:"#666",fontSize:14,margin:"0 0 24px"}}>Deposez les 4 documents obligatoires pour activer votre compte.</p>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
          {DOCS.map(doc => {
            const upload = uploads[doc.key];
            const isDone = upload?.status === "done";
            const isUploading = upload?.status === "uploading";
            const isError = upload?.status === "error";

            return (
              <label key={doc.key} style={{cursor:"pointer"}}>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{display:"none"}}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(doc.key, file);
                  }}
                />
                <div style={{
                  border:`2px ${isDone?"solid":"dashed"} ${isDone?"#22a06b":isError?"#cc0000":"#e5e3df"}`,
                  borderRadius:10,
                  padding:"16px",
                  textAlign:"center",
                  background:isDone?"#f0faf5":isError?"#fff0f0":"#fafaf8",
                  transition:"all 0.2s"
                }}>
                  <div style={{fontSize:24,marginBottom:8}}>
                    {isDone ? "✓" : isUploading ? "⏳" : isError ? "✗" : "+"}
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:isDone?"#22a06b":isError?"#cc0000":"#333",marginBottom:4}}>
                    {doc.label}
                  </div>
                  <div style={{fontSize:11,color:"#888"}}>
                    {isUploading ? "Upload en cours..." :
                     isDone ? upload.name :
                     isError ? "Erreur — reessayez" :
                     doc.desc}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {!allUploaded && (
          <div style={{background:"#fff7f0",border:"1px solid #ffd9b8",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#E87A30",marginBottom:16,textAlign:"center"}}>
            Deposez les 4 documents pour continuer
          </div>
        )}

        <div style={{display:"flex",gap:12}}>
          <button
            onClick={()=>router.push("/step-2-company")}
            style={{flex:1,padding:"11px",background:"white",color:"#666",border:"1.5px solid #e5e3df",borderRadius:8,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}
          >
            Retour
          </button>
          <button
            onClick={()=>router.push("/step-4-certifications")}
            disabled={!allUploaded}
            style={{flex:2,padding:"11px",background:allUploaded?"#E87A30":"#f1efe8",color:allUploaded?"white":"#aaa",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:allUploaded?"pointer":"not-allowed",fontFamily:"inherit"}}
          >
            {allUploaded ? "Continuer →" : "Deposez tous les documents"}
          </button>
        </div>
      </div>
    </div>
  );
}