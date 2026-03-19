import { useState, useMemo } from 'react';
import { PHONEMES, WORDS } from '../data/phonemes';
import { MASTERY_LEVELS, getMasteryLevel } from '../data/leitner';

export default function QuickSetup({ progress, updatePhonemeProgress, onClose }) {
  const [selectedPhase, setSelectedPhase] = useState(0); // 0 = all

  const phonemes = useMemo(() => {
    if (selectedPhase === 0) return PHONEMES;
    return PHONEMES.filter(p => p.phase === selectedPhase);
  }, [selectedPhase]);

  function getMastery(id) {
    const prog = progress[id];
    if (!prog || !prog.introduced) return 0;
    return prog.mastery || 1;
  }

  function cycleMastery(phoneme) {
    const current = getMastery(phoneme.id);
    const next = current >= 5 ? 0 : current + 1; // 0 → 1 → 2 → 3 → 4 → 5 → 0

    if (next === 0) {
      // Reset to not introduced
      updatePhonemeProgress(phoneme.id, prev => ({
        ...prev,
        introduced: false,
        mastery: 0,
        box: 0,
      }));
    } else {
      updatePhonemeProgress(phoneme.id, prev => ({
        ...prev,
        introduced: true,
        mastery: next,
        box: next,
        lastSeen: prev.lastSeen || new Date().toISOString(),
        lastSeenSession: prev.lastSeenSession || 0,
      }));
    }
  }

  function setAllInPhase(phase, level) {
    const targets = phase === 0 ? PHONEMES : PHONEMES.filter(p => p.phase === phase);
    targets.forEach(p => {
      updatePhonemeProgress(p.id, prev => ({
        ...prev,
        introduced: level > 0,
        mastery: level,
        box: level,
        lastSeen: prev.lastSeen || new Date().toISOString(),
        lastSeenSession: prev.lastSeenSession || 0,
      }));
    });
  }

  // Count decodable words
  const knownIds = new Set(
    Object.entries(progress).filter(([, p]) => p.introduced && (p.mastery || 0) >= 4).map(([id]) => id)
  );
  const decodableCount = WORDS.filter(w => w.phonemes.every(p => knownIds.has(p))).length;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <h2 style={{fontFamily:"'Fredoka'",fontSize:24,color:"#ffd966",margin:0}}>⚡ Quick Setup</h2>
        <button onClick={onClose} style={{background:"#1a2744",border:"2px solid #2a3a5c",borderRadius:10,padding:"6px 14px",fontSize:13,fontFamily:"'Fredoka'",color:"#a0aec0",cursor:"pointer"}}>
          ← Back
        </button>
      </div>

      <p style={{fontFamily:"'Andika'",fontSize:14,color:"#a0aec0",margin:"0 0 12px"}}>
        Tap any sound to cycle its mastery level. Use the batch buttons to mark whole phases as known.
      </p>

      {/* Legend */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        <span style={{fontFamily:"'Andika'",fontSize:11,color:"#4a5578",padding:"3px 8px",background:"#0f1729",borderRadius:6}}>⚫ Not started</span>
        {MASTERY_LEVELS.map(ml => (
          <span key={ml.level} style={{fontFamily:"'Andika'",fontSize:11,color:ml.color,padding:"3px 8px",background:"#0f1729",borderRadius:6}}>
            {ml.emoji} {ml.label}
          </span>
        ))}
      </div>

      {/* Phase tabs */}
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {[{v:0,l:"All"},{v:2,l:"Phase 2"},{v:3,l:"Phase 3"},{v:4,l:"Phase 4"}].map(tab => (
          <button key={tab.v} onClick={() => setSelectedPhase(tab.v)} style={{
            background: selectedPhase === tab.v ? "#4ecdc4" : "#1a2744",
            color: selectedPhase === tab.v ? "#0f1729" : "#a0aec0",
            border:`2px solid ${selectedPhase === tab.v ? "#4ecdc4" : "#2a3a5c"}`,
            borderRadius:10, padding:"6px 12px", fontSize:13, fontFamily:"'Fredoka'", cursor:"pointer",
          }}>
            {tab.l}
          </button>
        ))}
      </div>

      {/* Batch actions */}
      <div style={{background:"#1a2744",borderRadius:12,padding:12,marginBottom:16}}>
        <p style={{fontFamily:"'Fredoka'",fontSize:13,color:"#f4a261",margin:"0 0 8px"}}>
          Batch set {selectedPhase === 0 ? "ALL sounds" : `Phase ${selectedPhase}`}:
        </p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button onClick={() => setAllInPhase(selectedPhase, 5)} style={{background:"#4ecdc4",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontFamily:"'Fredoka'",color:"#0f1729",cursor:"pointer"}}>
            ⭐ All signed off
          </button>
          <button onClick={() => setAllInPhase(selectedPhase, 4)} style={{background:"#7bc67e",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontFamily:"'Fredoka'",color:"#0f1729",cursor:"pointer"}}>
            🟢 All nearly there
          </button>
          <button onClick={() => setAllInPhase(selectedPhase, 3)} style={{background:"#ffd966",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontFamily:"'Fredoka'",color:"#0f1729",cursor:"pointer"}}>
            🟡 All knows but confuses
          </button>
          <button onClick={() => setAllInPhase(selectedPhase, 1)} style={{background:"#e88d8d",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontFamily:"'Fredoka'",color:"#0f1729",cursor:"pointer"}}>
            🔴 All needs work
          </button>
          <button onClick={() => setAllInPhase(selectedPhase, 0)} style={{background:"#2a3a5c",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontFamily:"'Fredoka'",color:"#a0aec0",cursor:"pointer"}}>
            ⚫ Reset all
          </button>
        </div>
      </div>

      {/* Sound grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(64px, 1fr))",gap:8,marginBottom:16}}>
        {phonemes.map(p => {
          const m = getMastery(p.id);
          const ml = m > 0 ? getMasteryLevel(m) : null;
          const bg = ml ? { 1:"#3a1a1a", 2:"#3a2a1a", 3:"#3a3a1a", 4:"#1a3a1a", 5:"#1a3a2a" }[m] : "#0f1729";
          const border = ml ? `2px solid ${ml.color}` : "2px solid #1e2d4f";

          return (
            <button key={p.id} onClick={() => cycleMastery(p)} style={{
              background: bg, border, borderRadius:12, padding:8, cursor:"pointer",
              textAlign:"center", transition:"all 0.15s",
            }}>
              <span style={{fontFamily:"'Andika'",fontSize:24,color: m > 0 ? "white" : "#4a5578",display:"block"}}>{p.grapheme}</span>
              <span style={{fontSize:10,display:"block",marginTop:2}}>{ml ? ml.emoji : "⚫"}</span>
            </button>
          );
        })}
      </div>

      {/* Status summary */}
      <div style={{background:"#1a2744",borderRadius:12,padding:12}}>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          {MASTERY_LEVELS.map(ml => {
            const count = PHONEMES.filter(p => getMastery(p.id) === ml.level).length;
            return (
              <div key={ml.level} style={{textAlign:"center"}}>
                <span style={{fontSize:14}}>{ml.emoji}</span>
                <span style={{fontFamily:"'Fredoka'",fontSize:16,color:ml.color,marginLeft:4}}>{count}</span>
              </div>
            );
          })}
          <div style={{textAlign:"center"}}>
            <span style={{fontSize:14}}>⚫</span>
            <span style={{fontFamily:"'Fredoka'",fontSize:16,color:"#4a5578",marginLeft:4}}>
              {PHONEMES.filter(p => getMastery(p.id) === 0).length}
            </span>
          </div>
        </div>
        <p style={{fontFamily:"'Andika'",fontSize:12,color:"#a0aec0",textAlign:"center",margin:"8px 0 0"}}>
          {decodableCount} of {WORDS.length} words now decodable
        </p>
      </div>
    </div>
  );
}
