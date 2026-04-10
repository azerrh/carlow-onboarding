const STEPS = ["Compte","Societe","Documents","Certifications","Logistique","Confirmation"];
export function StepperBar({ current }: { current: number }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:28,overflowX:"auto"}}>
      {STEPS.map((s, i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,background:i<current?"#E87A30":i===current?"#fff7f0":"#f1efe8",color:i<current?"white":i===current?"#E87A30":"#aaa",border:i===current?"1.5px solid #E87A30":"1px solid #e5e3df"}}>
              {i < current ? "v" : i + 1}
            </div>
            <div style={{fontSize:10,marginTop:3,color:i===current?"#E87A30":"#aaa",whiteSpace:"nowrap"}}>{s}</div>
          </div>
          {i < STEPS.length - 1 && <div style={{width:20,height:1,background:i<current?"#E87A30":"#e5e3df",marginBottom:14,flexShrink:0}} />}
        </div>
      ))}
    </div>
  );
}
