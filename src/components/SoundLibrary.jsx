import { useState, useContext } from 'react';
import { PHONEMES, WORDS } from '../data/phonemes';
import PhonoBuddyOwl from './PhonoBuddyOwl';
import { RecordingsContext } from '../App';
import { speak } from '../utils/speech';

export default function SoundLibrary({ progress }) {
  const { playSound, hasRecording } = useContext(RecordingsContext);
  const [selectedPhoneme, setSelectedPhoneme] = useState(null);

  const phoneme = selectedPhoneme ? PHONEMES.find(p => p.id === selectedPhoneme) : null;
  const prog = selectedPhoneme ? progress[selectedPhoneme] : null;
  const exampleWords = phoneme ? WORDS.filter(w => w.phonemes.includes(phoneme.id)).slice(0, 8) : [];

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <PhonoBuddyOwl size={60} mood={selectedPhoneme ? "excited" : "happy"} />
        <div>
          <h2 style={{fontFamily:"'Fredoka'",fontSize:28,color:"#ffd966",margin:0}}>Sound Library</h2>
          <p style={{fontFamily:"'Andika'",fontSize:15,color:"#a0aec0",margin:0}}>All sounds — Tap to explore</p>
        </div>
      </div>

      {selectedPhoneme && phoneme ? (
        <div>
          {/* Sound detail card */}
          <div style={{background:"rgba(26,39,68,0.6)",borderRadius:24,padding:24,backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.05)",textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:56,marginBottom:4}}>{phoneme.emoji}</div>
            <div style={{background:"#1e2d4f",border:"4px solid #ffd966",borderRadius:24,display:"inline-block",padding:"16px 40px",margin:"8px 0"}}>
              <span style={{fontFamily:"'Andika'",fontSize:72,color:"white"}}>{phoneme.grapheme}</span>
            </div>

            <div style={{marginTop:8,marginBottom:12}}>
              <span style={{
                fontFamily:"'Fredoka'",fontSize:13,
                background: phoneme.type === "stretchy" ? "rgba(78,205,196,0.15)" : "rgba(244,162,97,0.15)",
                color: phoneme.type === "stretchy" ? "#4ecdc4" : "#f4a261",
                padding:"4px 12px",borderRadius:20,border:`1px solid ${phoneme.type === "stretchy" ? "#4ecdc4" : "#f4a261"}`,
              }}>
                {phoneme.type === "stretchy" ? "Stretchy" : "Bouncy"} · {phoneme.ipa}
              </span>
              {hasRecording(phoneme.id) && (
                <span style={{fontFamily:"'Fredoka'",fontSize:13,background:"rgba(123,198,126,0.15)",color:"#7bc67e",padding:"4px 12px",borderRadius:20,border:"1px solid #7bc67e",marginLeft:6}}>
                  🎙️ Recorded
                </span>
              )}
            </div>

            <p style={{fontFamily:"'Andika'",fontSize:16,color:"#f0f0f0",margin:"8px auto",maxWidth:380}}>{phoneme.hint}</p>
            <p style={{fontFamily:"'Andika'",fontSize:14,color:"#a0aec0",margin:"4px auto 16px",maxWidth:380}}>{phoneme.action}</p>

            <button onClick={() => playSound(phoneme.grapheme)} style={{background:"#ffd966",border:"none",borderRadius:50,width:64,height:64,fontSize:28,cursor:"pointer",boxShadow:"0 4px 16px rgba(255,217,102,0.3)"}}>
              🔊
            </button>

            {/* Progress stats */}
            {prog?.introduced && (
              <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:16}}>
                <div style={{background:"#0f1729",borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Fredoka'",fontSize:18,color:"#7bc67e"}}>{prog.correct || 0}</div>
                  <div style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0"}}>correct</div>
                </div>
                <div style={{background:"#0f1729",borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Fredoka'",fontSize:18,color:"#e88d8d"}}>{prog.incorrect || 0}</div>
                  <div style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0"}}>wrong</div>
                </div>
                <div style={{background:"#0f1729",borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Fredoka'",fontSize:18,color:"#ffd966"}}>{prog.streak || 0}</div>
                  <div style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0"}}>streak</div>
                </div>
                <div style={{background:"#0f1729",borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Fredoka'",fontSize:18,color:"#4ecdc4"}}>Box {prog.box || 0}</div>
                  <div style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0"}}>mastery</div>
                </div>
              </div>
            )}
          </div>

          {/* Letter formation */}
          <div style={{background:"#1a2744",borderRadius:14,padding:14,marginBottom:12}}>
            <p style={{fontFamily:"'Fredoka'",fontSize:14,color:"#4ecdc4",margin:"0 0 4px"}}>How to write it</p>
            <p style={{fontFamily:"'Andika'",fontSize:14,color:"#f0f0f0",margin:0}}>{phoneme.formation}</p>
          </div>

          {/* Confused with */}
          {phoneme.confusedWith.length > 0 && (
            <div style={{background:"#2a2010",border:"1px solid #f4a261",borderRadius:14,padding:14,marginBottom:12}}>
              <p style={{fontFamily:"'Fredoka'",fontSize:14,color:"#f4a261",margin:"0 0 4px"}}>
                Often confused with: {phoneme.confusedWith.map(id => PHONEMES.find(p=>p.id===id)?.grapheme).join(", ")}
              </p>
              {phoneme.reversalHelp && (
                <p style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0",margin:0}}>Use the BED trick to help!</p>
              )}
            </div>
          )}

          {/* Example words */}
          {exampleWords.length > 0 && (
            <div style={{marginBottom:16}}>
              <h3 style={{fontFamily:"'Fredoka'",fontSize:16,color:"#f0f0f0",margin:"0 0 8px"}}>Words with {phoneme.grapheme}</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(80px, 1fr))",gap:8}}>
                {exampleWords.map(w => (
                  <button key={w.word} onClick={() => playSound(`word:${w.word}`)} style={{background:"#1a2744",border:"2px solid #2a3a5c",borderRadius:12,padding:8,cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:22}}>{w.image}</div>
                    <div style={{fontFamily:"'Andika'",fontSize:20,color:"white"}}>{w.word}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nav between sounds */}
          <div style={{display:"flex",gap:12,justifyContent:"center",alignItems:"center",marginBottom:8}}>
            {(() => {
              const idx = PHONEMES.findIndex(p => p.id === selectedPhoneme);
              const prev = idx > 0 ? PHONEMES[idx-1] : null;
              const next = idx < PHONEMES.length-1 ? PHONEMES[idx+1] : null;
              return (
                <>
                  <button onClick={() => prev && setSelectedPhoneme(prev.id)} disabled={!prev} style={{background:"transparent",border:"2px solid #2a3a5c",borderRadius:12,padding:"8px 18px",fontSize:15,color:prev?"#a0aec0":"#2a3a5c",cursor:prev?"pointer":"default",fontFamily:"'Fredoka'"}}>← {prev?.grapheme||''}</button>
                  <span style={{fontFamily:"'Andika'",fontSize:12,color:"#4a5578"}}>{PHONEMES.findIndex(p=>p.id===selectedPhoneme)+1}/{PHONEMES.length}</span>
                  <button onClick={() => next && setSelectedPhoneme(next.id)} disabled={!next} style={{background:"transparent",border:"2px solid #2a3a5c",borderRadius:12,padding:"8px 18px",fontSize:15,color:next?"#a0aec0":"#2a3a5c",cursor:next?"pointer":"default",fontFamily:"'Fredoka'"}}>{next?.grapheme||''} →</button>
                </>
              );
            })()}
          </div>
          <div style={{textAlign:"center"}}>
            <button onClick={() => setSelectedPhoneme(null)} style={{background:"transparent",border:"2px solid #a0aec0",borderRadius:12,padding:"10px 24px",fontSize:15,color:"#a0aec0",cursor:"pointer",fontFamily:"'Fredoka'"}}>← All sounds</button>
          </div>
        </div>
      ) : (
        <>
        {/* Phase 2 */}
        <h2 style={{fontFamily:"'Fredoka'",fontSize:18,color:"#7c9aed",margin:"0 0 12px"}}>Phase 2 — Single Letters</h2>
        {[1,2,3,4,5].map(set => (
          <div key={set} style={{marginBottom:20}}>
            <h3 style={{fontFamily:"'Fredoka'",fontSize:14,color:"#4ecdc4",margin:"0 0 8px"}}>Set {set}</h3>
            <SoundGrid phonemes={PHONEMES.filter(p => p.phase === 2 && p.set === set)} progress={progress} onSelect={setSelectedPhoneme} />
          </div>
        ))}

        {/* Phase 3 — consonants */}
        <h2 style={{fontFamily:"'Fredoka'",fontSize:18,color:"#b088f9",margin:"20px 0 12px"}}>Phase 3 — New Letters & Digraphs</h2>
        <div style={{marginBottom:20}}>
          <h3 style={{fontFamily:"'Fredoka'",fontSize:14,color:"#4ecdc4",margin:"0 0 8px"}}>Sets 6-7: j, v, w, x, y, z, zz, qu</h3>
          <SoundGrid phonemes={PHONEMES.filter(p => p.phase === 3 && (p.set === 6 || p.set === 7))} progress={progress} onSelect={setSelectedPhoneme} />
        </div>
        <div style={{marginBottom:20}}>
          <h3 style={{fontFamily:"'Fredoka'",fontSize:14,color:"#4ecdc4",margin:"0 0 8px"}}>Set 8: ch, sh, th, ng</h3>
          <SoundGrid phonemes={PHONEMES.filter(p => p.phase === 3 && p.set === 8)} progress={progress} onSelect={setSelectedPhoneme} />
        </div>
        <div style={{marginBottom:20}}>
          <h3 style={{fontFamily:"'Fredoka'",fontSize:14,color:"#4ecdc4",margin:"0 0 8px"}}>Sets 9-10: Vowel Digraphs</h3>
          <SoundGrid phonemes={PHONEMES.filter(p => p.phase === 3 && (p.set === 9 || p.set === 10))} progress={progress} onSelect={setSelectedPhoneme} />
        </div>
        </>

      )}
    </div>
  );
}

function SoundGrid({ phonemes, progress, onSelect }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(90px, 1fr))",gap:10}}>
      {phonemes.map(p => {
        const pr = progress[p.id];
        const introduced = pr?.introduced;
        const mastered = pr?.box >= 4 && pr?.correct > 5;
        return (
          <button key={p.id} onClick={() => onSelect(p.id)} style={{
            background: mastered ? "#1a3a1a" : introduced ? "#1e2d4f" : "#0f1729",
            border: `2px solid ${mastered ? "#7bc67e" : introduced ? "#4ecdc4" : "#2a3a5c"}`,
            borderRadius:14,padding:10,cursor:"pointer",textAlign:"center",
            boxShadow: mastered ? "0 0 8px rgba(123,198,126,0.2)" : "none",
          }}>
            <div style={{fontSize:24}}>{p.emoji}</div>
            <div style={{fontFamily:"'Andika'",fontSize:32,color:introduced?"white":"#4a5578",margin:"2px 0"}}>{p.grapheme}</div>
            <div style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0"}}>{p.ipa}</div>
            {mastered && <div style={{fontSize:10}}>⭐</div>}
          </button>
        );
      })}
    </div>
  );
}
