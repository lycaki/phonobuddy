import { useState, useContext, useMemo } from 'react';
import { WORDS, PHONEMES, TRICKY_WORDS } from '../data/phonemes';
import PhonoBuddyOwl from './PhonoBuddyOwl';
import { RecordingsContext } from '../App';
import { speak } from '../utils/speech';

export default function WordPractice({ progress }) {
  const [selectedPhase, setSelectedPhase] = useState(0); // 0 = all
  const [selectedWord, setSelectedWord] = useState(null);
  const [blendStep, setBlendStep] = useState(0);
  const [showTricky, setShowTricky] = useState(false);
  const { playSound } = useContext(RecordingsContext);

  const knownIds = useMemo(() => {
    return new Set(Object.entries(progress).filter(([, p]) => p.introduced).map(([id]) => id));
  }, [progress]);

  const filteredWords = useMemo(() => {
    if (selectedPhase === 0) return WORDS;
    return WORDS.filter(w => w.phase === selectedPhase);
  }, [selectedPhase]);

  // Words the child can decode (all phonemes known)
  const decodableWords = useMemo(() => {
    return filteredWords.filter(w => w.phonemes.every(p => knownIds.has(p)));
  }, [knownIds, filteredWords]);

  // Words they can't yet decode (at least one unknown phoneme)
  const lockedWords = useMemo(() => {
    return filteredWords.filter(w => !w.phonemes.every(p => knownIds.has(p)));
  }, [knownIds, filteredWords]);

  // Tricky words for the selected phase
  const filteredTricky = useMemo(() => {
    if (selectedPhase === 0) return TRICKY_WORDS;
    return TRICKY_WORDS.filter(tw => tw.phase === selectedPhase);
  }, [selectedPhase]);

  function openWord(word) {
    setSelectedWord(word);
    setBlendStep(0);
  }

  function handleBlendStep() {
    const next = blendStep + 1;
    setBlendStep(next);
    if (next === 1) {
      selectedWord.phonemes.forEach((p, i) => setTimeout(() => playSound(p), i * 450));
    } else if (next === 2) {
      // Use recorded word if available, falls back to TTS inside playSound
      setTimeout(() => playSound(`word:${selectedWord.word}`), 300);
    }
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <PhonoBuddyOwl size={60} mood="happy" />
        <div>
          <h2 style={{fontFamily:"'Fredoka'",fontSize:28,color:"#ffd966",margin:0}}>Word Practice</h2>
          <p style={{fontFamily:"'Andika'",fontSize:15,color:"#a0aec0",margin:0}}>
            {decodableWords.length} words ready · {lockedWords.length} locked
          </p>
        </div>
      </div>

      {/* Word detail view */}
      {selectedWord ? (
        <div style={{textAlign:"center"}}>
          {/* Big word display with blend animation */}
          <div style={{background:"rgba(26,39,68,0.6)",borderRadius:24,padding:32,backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.05)",marginBottom:20}}>
            <div style={{fontSize:56,marginBottom:8}}>{selectedWord.image}</div>

            <div style={{display:"flex",justifyContent:"center",gap:blendStep >= 1 ? 4 : 16,transition:"gap 0.5s ease",marginBottom:20}}>
              {selectedWord.phonemes.map((p, i) => (
                <button key={i} onClick={() => playSound(p)} style={{
                  background: blendStep === 0 ? "#1e2d4f" : blendStep >= 2 ? "#2a4a2a" : "#1e3d5f",
                  border: `3px solid ${blendStep >= 2 ? "#7bc67e" : "#4ecdc4"}`,
                  borderRadius: 16, padding: "12px 20px", minWidth: 56, cursor: "pointer",
                  transition: "all 0.4s ease", transitionDelay: `${i * 0.1}s`,
                }}>
                  <span style={{fontFamily:"'Andika'",fontSize:44,color:"white"}}>{p}</span>
                </button>
              ))}
            </div>

            {blendStep >= 2 && (
              <div style={{animation:"bounceIn 0.4s ease"}}>
                <p style={{fontFamily:"'Fredoka'",fontSize:36,color:"#ffd966",margin:"0 0 4px"}}>{selectedWord.word}</p>
              </div>
            )}

            {/* Sweep line */}
            {blendStep === 1 && (
              <div style={{width:180,height:4,background:"#2a3a5c",borderRadius:2,margin:"0 auto 16px",overflow:"hidden"}}>
                <div style={{width:40,height:4,background:"#ffd966",borderRadius:2,animation:"sweep 1.5s ease-in-out infinite"}} />
              </div>
            )}

            {blendStep < 2 ? (
              <button onClick={handleBlendStep} style={{background:"#4ecdc4",border:"none",borderRadius:16,padding:"14px 36px",fontSize:18,fontFamily:"'Fredoka'",color:"#0f1729",cursor:"pointer"}}>
                {blendStep === 0 ? "🔊 Sound it out" : "🔗 Blend together"}
              </button>
            ) : (
              <button onClick={() => playSound(`word:${selectedWord.word}`)} style={{background:"#4ecdc4",border:"none",borderRadius:16,padding:"14px 36px",fontSize:18,fontFamily:"'Fredoka'",color:"#0f1729",cursor:"pointer"}}>
                🔊 Hear it again
              </button>
            )}
          </div>

          {/* Phoneme breakdown */}
          <div style={{background:"#1a2744",borderRadius:14,padding:16,marginBottom:16,textAlign:"left"}}>
            <p style={{fontFamily:"'Fredoka'",fontSize:14,color:"#4ecdc4",margin:"0 0 8px"}}>Sound breakdown</p>
            {selectedWord.phonemes.map((p, i) => {
              const phoneme = PHONEMES.find(ph => ph.id === p);
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:i < selectedWord.phonemes.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none"}}>
                  <button onClick={() => playSound(p)} style={{background:"#0f1729",border:"1px solid #2a3a5c",borderRadius:8,width:36,height:36,fontSize:18,color:"white",cursor:"pointer",fontFamily:"'Andika'",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {p}
                  </button>
                  <span style={{fontSize:18}}>{phoneme?.emoji}</span>
                  <span style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0"}}>{phoneme?.hint}</span>
                </div>
              );
            })}
          </div>

          <button onClick={() => setSelectedWord(null)} style={{background:"transparent",border:"2px solid #a0aec0",borderRadius:12,padding:"10px 24px",fontSize:16,color:"#a0aec0",cursor:"pointer",fontFamily:"'Fredoka'"}}>
            ← Back to words
          </button>
        </div>
      ) : (
        <div>
          {/* Phase filter tabs */}
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            {[{v:0,l:"All",c:"#4ecdc4"},{v:2,l:"Phase 2 (CVC)",c:"#7c9aed"},{v:3,l:"Phase 3 (digraphs)",c:"#b088f9"},{v:4,l:"Phase 4 (clusters)",c:"#ff9a9e"}].map(tab => (
              <button key={tab.v} onClick={() => setSelectedPhase(tab.v)} style={{
                background: selectedPhase === tab.v ? tab.c : "#1a2744",
                color: selectedPhase === tab.v ? "#0f1729" : "#a0aec0",
                border: `2px solid ${selectedPhase === tab.v ? tab.c : "#2a3a5c"}`,
                borderRadius:10, padding:"6px 12px", fontSize:13, fontFamily:"'Fredoka'", cursor:"pointer",
              }}>
                {tab.l}
              </button>
            ))}
          </div>

          {/* Tricky words toggle */}
          <button onClick={() => setShowTricky(!showTricky)} style={{
            background: showTricky ? "#3a2020" : "#1a2744",
            border: `2px solid ${showTricky ? "#f4a261" : "#2a3a5c"}`,
            borderRadius:12, padding:"10px 16px", width:"100%", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16,
          }}>
            <span style={{fontFamily:"'Fredoka'",fontSize:16,color:"#f4a261"}}>Tricky Words ({filteredTricky.length})</span>
            <span style={{fontSize:14,color:"#a0aec0"}}>{showTricky ? "▲" : "▼"}</span>
          </button>

          {showTricky && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10,marginBottom:20}}>
              {filteredTricky.map(tw => (
                <button key={tw.id} onClick={() => playSound(`word:${tw.word}`)} style={{
                  background:"#2a2010",border:"2px solid #f4a261",borderRadius:14,padding:12,cursor:"pointer",textAlign:"center",position:"relative",
                }}>
                  <span style={{fontFamily:"'Andika'",fontSize:28,color:"white",display:"block"}}>{tw.word}</span>
                  <span style={{fontFamily:"'Andika'",fontSize:11,color:"#f4a261",display:"block",marginTop:2}}>
                    tricky: {tw.trickyPart}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Decodable words — the fun grid */}
          {decodableWords.length > 0 && (
            <>
              <h3 style={{fontFamily:"'Fredoka'",fontSize:16,color:"#7bc67e",margin:"0 0 10px"}}>
                Ready to read ({decodableWords.length})
              </h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(90px, 1fr))",gap:10,marginBottom:20}}>
                {decodableWords.map(w => (
                  <button key={w.word} onClick={() => openWord(w)} style={{
                    background:"#1a2744",border:"2px solid #2a3a5c",borderRadius:14,padding:10,cursor:"pointer",textAlign:"center",
                    transition:"transform 0.15s",
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <div style={{fontSize:28}}>{w.image}</div>
                    <div style={{fontFamily:"'Andika'",fontSize:24,color:"white",margin:"2px 0"}}>{w.word}</div>
                    <div style={{fontFamily:"'Andika'",fontSize:10,color:"#4ecdc4"}}>
                      {w.structure || w.phonemes.join("·")}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Locked words */}
          {lockedWords.length > 0 && (
            <>
              <h3 style={{fontFamily:"'Fredoka'",fontSize:16,color:"#4a5578",margin:"0 0 10px"}}>
                Coming soon ({lockedWords.length})
              </h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(90px, 1fr))",gap:10,marginBottom:20,opacity:0.5}}>
                {lockedWords.slice(0, 12).map(w => (
                  <div key={w.word} style={{background:"#0f1729",border:"2px solid #1e2d4f",borderRadius:14,padding:10,textAlign:"center"}}>
                    <div style={{fontSize:28}}>🔒</div>
                    <div style={{fontFamily:"'Andika'",fontSize:24,color:"#4a5578",margin:"2px 0"}}>{w.word}</div>
                    <div style={{fontFamily:"'Andika'",fontSize:10,color:"#4a5578"}}>
                      {w.phonemes.map(p => knownIds.has(p) ? p : "?").join(" · ")}
                    </div>
                  </div>
                ))}
                {lockedWords.length > 12 && (
                  <div style={{background:"transparent",borderRadius:14,padding:10,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontFamily:"'Andika'",fontSize:14,color:"#4a5578"}}>+{lockedWords.length - 12} more</span>
                  </div>
                )}
              </div>
            </>
          )}

          {decodableWords.length === 0 && !showTricky && (
            <div style={{textAlign:"center",padding:40}}>
              <PhonoBuddyOwl size={80} mood="thinking" />
              <p style={{fontFamily:"'Fredoka'",fontSize:18,color:"#a0aec0",marginTop:12}}>
                Start a session to unlock sounds, then come back to practise words!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
