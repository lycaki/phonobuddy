import { useState, useEffect, useContext } from 'react';
import { RecordingsContext } from '../../App';
import { speak } from '../../utils/speech';

export default function IntroduceSound({ phoneme, onComplete }) {
  const [step, setStep] = useState(0);
  const { playSound } = useContext(RecordingsContext);

  useEffect(() => { setStep(0); }, [phoneme.id]);

  function next() {
    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep === 2) setTimeout(() => playSound(phoneme.grapheme), 500);
    if (nextStep === 4) onComplete();
  }

  return (
    <div style={{textAlign:"center"}}>
      {step === 0 && (
        <div style={{animation:"bounceIn 0.5s ease"}}>
          <div style={{fontSize:100,marginBottom:16}}>🎁</div>
          <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:26,color:"#ffd966"}}>A new sound to discover!</p>
          <button onClick={next} style={{background:"#ffd966",border:"none",borderRadius:16,padding:"16px 40px",fontSize:22,fontFamily:"'Fredoka', sans-serif",color:"#0f1729",cursor:"pointer",marginTop:16}}>Open it!</button>
        </div>
      )}
      {step === 1 && (
        <div style={{animation:"bounceIn 0.5s ease"}}>
          <div style={{fontSize:100,marginBottom:8}}>{phoneme.emoji}</div>
          <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:22,color:"#a0aec0"}}>{phoneme.action}</p>
          <button onClick={next} style={{background:"#4ecdc4",border:"none",borderRadius:16,padding:"16px 40px",fontSize:20,fontFamily:"'Fredoka', sans-serif",color:"#0f1729",cursor:"pointer",marginTop:16}}>Hear the sound! 🔊</button>
        </div>
      )}
      {step === 2 && (
        <div style={{animation:"bounceIn 0.5s ease"}}>
          <div style={{fontSize:100,marginBottom:8}}>{phoneme.emoji}</div>
          <div style={{background:"#1e2d4f",border:"4px solid #ffd966",borderRadius:24,display:"inline-block",padding:"20px 48px",margin:"16px 0"}}>
            <span style={{fontFamily:"'Andika', sans-serif",fontSize:96,color:"white"}}>{phoneme.grapheme}</span>
          </div>
          <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:20,color:"#f0f0f0",maxWidth:400,margin:"12px auto"}}>{phoneme.hint}</p>
          <button onClick={() => playSound(phoneme.grapheme)} style={{background:"#ffd966",border:"none",borderRadius:50,width:60,height:60,fontSize:28,cursor:"pointer",margin:"8px 8px"}}>🔊</button>
          <button onClick={next} style={{background:"#4ecdc4",border:"none",borderRadius:16,padding:"14px 32px",fontSize:18,fontFamily:"'Fredoka', sans-serif",color:"#0f1729",cursor:"pointer"}}>Next →</button>
        </div>
      )}
      {step === 3 && (
        <div style={{animation:"bounceIn 0.5s ease"}}>
          <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:24,color:"#ffd966",marginBottom:16}}>Words with <span style={{fontFamily:"'Andika'",fontSize:36}}>{phoneme.grapheme}</span></p>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,justifyContent:"center",marginBottom:20}}>
            {phoneme.words.slice(0,4).map(w => (
              <button key={w} onClick={() => playSound(`word:${w}`)} style={{background:"#1e2d4f",border:"2px solid #4ecdc4",borderRadius:14,padding:"12px 20px",cursor:"pointer"}}>
                <span style={{fontFamily:"'Andika', sans-serif",fontSize:28,color:"white"}}>{w}</span>
              </button>
            ))}
          </div>
          <button onClick={next} style={{background:"#7bc67e",border:"none",borderRadius:16,padding:"16px 40px",fontSize:20,fontFamily:"'Fredoka', sans-serif",color:"#0f1729",cursor:"pointer"}}>I've got it! ⭐</button>
        </div>
      )}
    </div>
  );
}
