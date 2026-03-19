import { useState, useEffect, useContext } from 'react';
import PhonoBuddyOwl from '../PhonoBuddyOwl';
import { RecordingsContext } from '../../App';
import { speak } from '../../utils/speech';

export default function Blending({ word, onResult }) {
  const [blendStep, setBlendStep] = useState(0);
  const [showImage, setShowImage] = useState(false);
  const [answered, setAnswered] = useState(false);
  const { playSound } = useContext(RecordingsContext);

  useEffect(() => {
    setBlendStep(0);
    setShowImage(false);
    setAnswered(false);
  }, [word.word]);

  function handleNextStep() {
    if (blendStep < 3) {
      const next = blendStep + 1;
      setBlendStep(next);
      if (next === 1) {
        word.phonemes.forEach((p, i) => setTimeout(() => playSound(p), i * 400));
      } else if (next === 2) {
        // Prefer recorded word, fall back to TTS
        setTimeout(() => playSound(`word:${word.word}`), 300);
      } else if (next === 3) {
        setShowImage(true);
      }
    }
  }

  function handleResult(correct) {
    setAnswered(true);
    onResult(correct);
  }

  return (
    <div style={{textAlign:"center"}}>
      <div style={{marginBottom:12}}>
        <PhonoBuddyOwl size={80} mood={blendStep >= 2 ? "excited" : "happy"} speaking={blendStep === 1} />
      </div>
      <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:24,color:"#ffd966",margin:"0 0 20px"}}>
        {blendStep === 0 && "Let's blend this word!"}
        {blendStep === 1 && "Push the sounds together..."}
        {blendStep === 2 && "What does it say?"}
        {blendStep === 3 && `${word.word}! ${word.image}`}
      </p>

      {/* Letter display */}
      <div style={{display:"flex",justifyContent:"center",gap:blendStep >= 1 ? 4 : 20,transition:"gap 0.6s ease",marginBottom:24}}>
        {word.phonemes.map((p, i) => (
          <div key={i} style={{
            background: blendStep === 0 ? "#1e2d4f" : blendStep >= 2 ? "#2a4a2a" : "#1e3d5f",
            border: `3px solid ${blendStep >= 2 ? "#7bc67e" : "#4ecdc4"}`,
            borderRadius: 16,
            padding: "16px 24px",
            minWidth: 64,
            transition: "all 0.4s ease",
            transitionDelay: `${i * 0.1}s`,
            transform: blendStep === 1 ? `translateX(${(i - (word.phonemes.length-1)/2) * -4}px)` : "none"
          }}>
            <span style={{fontFamily:"'Andika', sans-serif",fontSize:48,color:"white"}}>{p}</span>
          </div>
        ))}
      </div>

      {/* Sweep line animation */}
      {blendStep === 1 && (
        <div style={{width:200,height:4,background:"#2a3a5c",borderRadius:2,margin:"0 auto 20px",overflow:"hidden"}}>
          <div style={{width:40,height:4,background:"#ffd966",borderRadius:2,animation:"sweep 1.5s ease-in-out infinite"}} />
        </div>
      )}

      {showImage && (
        <div style={{fontSize:72,marginBottom:16,animation:"bounceIn 0.5s ease"}}>{word.image}</div>
      )}

      {blendStep < 3 ? (
        <button onClick={handleNextStep} style={{background:"#4ecdc4",border:"none",borderRadius:16,padding:"16px 40px",fontSize:20,fontFamily:"'Fredoka', sans-serif",color:"#0f1729",cursor:"pointer",marginTop:8}}>
          {blendStep === 0 ? "🔊 Sound it out" : blendStep === 1 ? "🔗 Blend together" : "👀 Show me!"}
        </button>
      ) : !answered ? (
        <div style={{marginTop:16}}>
          <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:18,color:"#a0aec0",marginBottom:12}}>Did they read it correctly?</p>
          <div style={{display:"flex",gap:16,justifyContent:"center"}}>
            <button onClick={() => handleResult(true)} style={{background:"#2a5a2a",border:"3px solid #7bc67e",borderRadius:16,padding:"14px 32px",fontSize:20,color:"#7bc67e",cursor:"pointer",fontFamily:"'Fredoka', sans-serif"}}>✓ Yes!</button>
            <button onClick={() => handleResult(false)} style={{background:"#5a2a2a",border:"3px solid #e88d8d",borderRadius:16,padding:"14px 32px",fontSize:20,color:"#e88d8d",cursor:"pointer",fontFamily:"'Fredoka', sans-serif"}}>✗ Not yet</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
