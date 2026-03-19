import { useState, useEffect } from 'react';

export default function BedTrick({ onClose }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step < 5) {
      const t = setTimeout(() => setStep(s => s + 1), step === 0 ? 800 : 2200);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,41,0.95)",zIndex:1000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{color:"#ffd966",fontFamily:"'Fredoka', sans-serif",fontSize:28,marginBottom:32,textAlign:"center"}}>
        {step < 2 && "Let's remember b and d!"}
        {step === 2 && "Make fists with your thumbs up..."}
        {step >= 3 && step < 5 && "Together they spell..."}
        {step === 5 && "b is on the LEFT — it comes first! 🎉"}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:step >= 3 ? 12 : 60,transition:"gap 0.8s ease",marginBottom:40}}>
        {/* Left hand = b */}
        <div style={{textAlign:"center",opacity:step >= 1 ? 1 : 0.3,transition:"all 0.5s",transform:step >= 1 ? "scale(1)" : "scale(0.8)"}}>
          <div style={{fontSize:80,lineHeight:1}}>👍</div>
          {step >= 1 && (
            <div style={{fontFamily:"'Andika', sans-serif",fontSize:64,color:"#4ecdc4",fontWeight:"bold",marginTop:8,animation:"bounceIn 0.5s ease"}}>b</div>
          )}
        </div>

        {/* Middle - e appears at step 3 */}
        {step >= 3 && (
          <div style={{fontFamily:"'Andika', sans-serif",fontSize:64,color:"#ffd966",fontWeight:"bold",animation:"bounceIn 0.5s ease"}}>e</div>
        )}

        {/* Right hand = d */}
        <div style={{textAlign:"center",opacity:step >= 2 ? 1 : 0.3,transition:"all 0.5s",transform:step >= 2 ? "scale(1) scaleX(-1)" : "scale(0.8) scaleX(-1)"}}>
          <div style={{fontSize:80,lineHeight:1}}>👍</div>
          {step >= 2 && (
            <div style={{fontFamily:"'Andika', sans-serif",fontSize:64,color:"#ff9a9e",fontWeight:"bold",marginTop:8,animation:"bounceIn 0.5s ease",transform:"scaleX(-1)"}}>d</div>
          )}
        </div>
      </div>

      {/* Bed illustration */}
      {step >= 4 && (
        <div style={{background:"#1e2d4f",borderRadius:20,padding:"20px 40px",border:"3px solid #ffd966",animation:"bounceIn 0.5s ease"}}>
          <div style={{fontFamily:"'Andika', sans-serif",fontSize:56,color:"white",letterSpacing:8}}>
            <span style={{color:"#4ecdc4"}}>b</span>
            <span style={{color:"#ffd966"}}>e</span>
            <span style={{color:"#ff9a9e"}}>d</span>
          </div>
          <div style={{textAlign:"center",fontSize:36,marginTop:4}}>🛏️</div>
        </div>
      )}

      {step >= 5 && (
        <button onClick={onClose} style={{marginTop:32,background:"#4ecdc4",border:"none",borderRadius:16,padding:"16px 48px",fontSize:22,fontFamily:"'Fredoka', sans-serif",color:"#0f1729",cursor:"pointer"}}>
          Got it! 👍
        </button>
      )}
    </div>
  );
}
