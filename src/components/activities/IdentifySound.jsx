import { useState, useEffect, useContext, useRef } from 'react';
import PhonoBuddyOwl from '../PhonoBuddyOwl';
import { RecordingsContext } from '../../App';
import { PHONEMES } from '../../data/phonemes';

export default function IdentifySound({ targetPhoneme, allPhonemes, isAssessment = false, onResult }) {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const [canTryAgain, setCanTryAgain] = useState(false);
  const { playSound } = useContext(RecordingsContext);
  const playSoundRef = useRef(playSound);
  useEffect(() => { playSoundRef.current = playSound; }, [playSound]);

  useEffect(() => {
    const pool = allPhonemes.length >= 4 ? allPhonemes : PHONEMES.slice(0, 12);
    const confusionOptions = (targetPhoneme.confusedWith || [])
      .map(id => PHONEMES.find(p => p.id === id))
      .filter(Boolean);
    const distractors = [...confusionOptions, ...pool
      .filter(p => p.id !== targetPhoneme.id)
      .sort(() => Math.random() - 0.5)]
      .filter((p, index, arr) => arr.findIndex(other => other.id === p.id) === index)
      .slice(0, 3);
    const opts = [...distractors, targetPhoneme].sort(() => Math.random() - 0.5);
    setOptions(opts);
    setSelected(null);
    setShowResult(false);
    setHasPlayed(false);
    setRetryMode(false);
    setCanTryAgain(false);

    // Auto-play — use ref to avoid stale closure, try after short delay
    const timer = setTimeout(() => {
      playSoundRef.current(targetPhoneme.id).then(() => setHasPlayed(true)).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [allPhonemes, targetPhoneme]);

  function handlePlaySound() {
    playSound(targetPhoneme.id);
    setHasPlayed(true);
  }

  function handleSelect(p) {
    if (showResult) return;
    setSelected(p.id);
    setShowResult(true);
    const correct = p.id === targetPhoneme.id;
    if (!correct && !isAssessment && !retryMode) {
      setCanTryAgain(true);
      setTimeout(() => playSound(targetPhoneme.id), 350);
      return;
    }
    setTimeout(() => onResult(correct, p.id === "b" || p.id === "d" ? p.id : null), correct ? 1000 : 1400);
  }

  function tryAgain() {
    setSelected(null);
    setShowResult(false);
    setRetryMode(true);
    setCanTryAgain(false);
    handlePlaySound();
  }

  return (
    <div style={{textAlign:"center"}}>
      <div style={{marginBottom:12}}>
        <PhonoBuddyOwl size={80} mood="thinking" speaking />
      </div>
      <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:24,color:"#ffd966",margin:"0 0 8px"}}>
        Listen to the sound...
      </p>
      <button onClick={handlePlaySound} style={{
        background: hasPlayed ? "#ffd966" : "#ff9a9e",
        border: hasPlayed ? "none" : "3px solid #ffd966",
        borderRadius:50, width:72, height:72, fontSize:32, cursor:"pointer",
        marginBottom:24, boxShadow:"0 4px 20px rgba(255,217,102,0.4)",
        animation: hasPlayed ? "none" : "pulse 1.5s infinite",
      }}>
        🔊
      </button>
      {!hasPlayed && (
        <p style={{fontFamily:"'Andika'",fontSize:13,color:"#f4a261",margin:"-16px 0 16px"}}>
          Tap to hear the sound
        </p>
      )}
      <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:22,color:"#f0f0f0",margin:"0 0 20px"}}>
        Which letter makes this sound?
      </p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,maxWidth:400,margin:"0 auto"}}>
        {options.map(p => {
          const isCorrect = p.id === targetPhoneme.id;
          const isSelected = selected === p.id;
          let bg = "#1e2d4f";
          let border = "3px solid #2a3a5c";
          if (showResult && isSelected && isCorrect) { bg = "#1a4a2a"; border = "3px solid #7bc67e"; }
          if (showResult && isSelected && !isCorrect) { bg = "#4a1a1a"; border = "3px solid #e88d8d"; }
          if (showResult && !isSelected && isCorrect) { bg = "#1a4a2a"; border = "3px dashed #7bc67e"; }
          return (
            <button key={p.id} onClick={() => handleSelect(p)} style={{background:bg,border,borderRadius:20,padding:"24px 16px",cursor:"pointer",transition:"all 0.2s"}}>
              <span style={{fontFamily:"'Andika', sans-serif",fontSize:56,color:"white",display:"block"}}>{p.grapheme}</span>
            </button>
          );
        })}
      </div>
      {showResult && selected === targetPhoneme.id && (
        <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:26,color:"#7bc67e",marginTop:20,animation:"bounceIn 0.3s ease"}}>
          ⭐ That's right!
        </p>
      )}
      {showResult && selected !== targetPhoneme.id && (
        <div style={{marginTop:20}}>
          <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:22,color:"#e88d8d",margin:"0 0 12px"}}>
            {canTryAgain ? "Listen again, then try once more." : "Nearly! It was"} <span style={{fontFamily:"'Andika', sans-serif",fontSize:32,color:"#ffd966"}}>{targetPhoneme.grapheme}</span>
          </p>
          {canTryAgain && (
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={tryAgain} style={{background:"#4ecdc4",border:"none",borderRadius:14,padding:"12px 24px",fontSize:18,fontFamily:"'Fredoka'",color:"#0f1729",cursor:"pointer"}}>
                Try again
              </button>
              <button onClick={() => onResult(false, selected === "b" || selected === "d" ? selected : null)} style={{background:"#1a2744",border:"2px solid #e88d8d",borderRadius:14,padding:"12px 20px",fontSize:16,fontFamily:"'Fredoka'",color:"#e88d8d",cursor:"pointer"}}>
                Keep going
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
