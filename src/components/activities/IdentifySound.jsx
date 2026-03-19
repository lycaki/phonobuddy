import { useState, useEffect, useContext } from 'react';
import PhonoBuddyOwl from '../PhonoBuddyOwl';
import { RecordingsContext } from '../../App';
import { speakPhoneme } from '../../utils/speech';

export default function IdentifySound({ targetPhoneme, allPhonemes, onResult }) {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const { playSound } = useContext(RecordingsContext);

  useEffect(() => {
    const distractors = allPhonemes
      .filter(p => p.id !== targetPhoneme.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const opts = [...distractors, targetPhoneme].sort(() => Math.random() - 0.5);
    setOptions(opts);
    setSelected(null);
    setShowResult(false);
    setTimeout(() => playSound(targetPhoneme.grapheme), 500);
  }, [targetPhoneme.id]);

  function handleSelect(p) {
    if (showResult) return;
    setSelected(p.id);
    setShowResult(true);
    const correct = p.id === targetPhoneme.id;
    setTimeout(() => onResult(correct, p.id === "b" || p.id === "d" ? p.id : null), 1400);
  }

  return (
    <div style={{textAlign:"center"}}>
      <div style={{marginBottom:12}}>
        <PhonoBuddyOwl size={80} mood="thinking" speaking />
      </div>
      <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:24,color:"#ffd966",margin:"0 0 8px"}}>
        Listen to the sound...
      </p>
      <button onClick={() => playSound(targetPhoneme.grapheme)} style={{background:"#ffd966",border:"none",borderRadius:50,width:72,height:72,fontSize:32,cursor:"pointer",marginBottom:24,boxShadow:"0 4px 20px rgba(255,217,102,0.4)"}}>
        🔊
      </button>
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
        <p style={{fontFamily:"'Fredoka', sans-serif",fontSize:22,color:"#e88d8d",marginTop:20}}>
          Nearly! It was <span style={{fontFamily:"'Andika', sans-serif",fontSize:32,color:"#ffd966"}}>{targetPhoneme.grapheme}</span>
        </p>
      )}
    </div>
  );
}
