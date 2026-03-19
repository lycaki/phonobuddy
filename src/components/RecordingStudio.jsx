import { useState, useRef, useContext, useMemo } from 'react';
import { PHONEMES, WORDS } from '../data/phonemes';
import PhonoBuddyOwl from './PhonoBuddyOwl';
import { RecordingsContext } from '../App';
import { speakPhoneme, speak } from '../utils/speech';

export default function RecordingStudio() {
  const [recording, setRecording] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // phoneme id or "word:xxx"
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [tab, setTab] = useState("sounds"); // "sounds" or "words"
  const [wordPhaseFilter, setWordPhaseFilter] = useState(0);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timerRef = useRef(null);
  const { saveRecording, getPlaybackUrl, hasRecording, syncStatus } = useContext(RecordingsContext);

  const isWord = selectedItem && selectedItem.startsWith("word:");
  const selectedWordObj = isWord ? WORDS.find(w => w.word === selectedItem.slice(5)) : null;
  const selectedPhoneme = !isWord ? PHONEMES.find(p => p.id === selectedItem) : null;

  const soundRecordedCount = PHONEMES.filter(p => hasRecording(p.id)).length;
  const wordRecordedCount = WORDS.filter(w => hasRecording(`word:${w.word}`)).length;

  const filteredWords = useMemo(() => {
    if (wordPhaseFilter === 0) return WORDS;
    return WORDS.filter(w => w.phase === wordPhaseFilter);
  }, [wordPhaseFilter]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
      });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        await saveRecording(selectedItem, blob);
        const url = await getPlaybackUrl(selectedItem);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
        clearInterval(timerRef.current);
      };
      mediaRecorder.current.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 100);
    } catch {
      alert("Microphone access needed. Please allow mic access in your browser settings.");
    }
  }

  function stopRecording() {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  }

  async function selectItem(id) {
    setSelectedItem(id);
    setRecordingTime(0);
    if (hasRecording(id)) {
      const url = await getPlaybackUrl(id);
      setAudioUrl(url);
    } else {
      setAudioUrl(null);
    }
  }

  async function deleteRecording() {
    if (!selectedItem) return;
    const { db } = await import('../utils/storage');
    await db.recordings.delete(selectedItem);
    setAudioUrl(null);
    const id = selectedItem;
    setSelectedItem(null);
    setTimeout(() => selectItem(id), 50);
  }

  function playPreview() {
    // Always use playSound — it checks for recordings first, falls back to TTS
    if (isWord && selectedWordObj) {
      playSound(`word:${selectedWordObj.word}`);
    } else if (selectedPhoneme) {
      playSound(selectedPhoneme.id);
    }
  }

  function getItemList() {
    if (tab === "sounds") return PHONEMES.map(p => p.id);
    return filteredWords.map(w => `word:${w.word}`);
  }

  const phonemeGroups = useMemo(() => {
    const groups = [];
    [1, 2, 3, 4, 5].forEach(set => {
      groups.push({ label: `Phase 2 · Set ${set}`, items: PHONEMES.filter(p => p.phase === 2 && p.set === set) });
    });
    const p3labels = { 6: "j, v, w, x", 7: "y, z, zz, qu", 8: "ch, sh, th, ng", 9: "Vowel digraphs", 10: "More digraphs" };
    [6, 7, 8, 9, 10].forEach(set => {
      const items = PHONEMES.filter(p => p.phase === 3 && p.set === set);
      if (items.length > 0) groups.push({ label: `Phase 3 · ${p3labels[set] || `Set ${set}`}`, items });
    });
    return groups;
  }, []);

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <PhonoBuddyOwl size={60} mood={recording ? "excited" : "happy"} speaking={recording} />
        <div>
          <h2 style={{fontFamily:"'Fredoka'",fontSize:28,color:"#ffd966",margin:0}}>Recording Studio</h2>
          <p style={{fontFamily:"'Andika'",fontSize:14,color:"#a0aec0",margin:0}}>
            {soundRecordedCount}/{PHONEMES.length} sounds · {wordRecordedCount}/{WORDS.length} words
            {syncStatus === 'uploading' && <span style={{color:"#f4a261"}}> — uploading...</span>}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      {!selectedItem && (
        <>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <button onClick={() => setTab("sounds")} style={{
              flex:1, background: tab === "sounds" ? "#4ecdc4" : "#1a2744",
              color: tab === "sounds" ? "#0f1729" : "#a0aec0",
              border: `2px solid ${tab === "sounds" ? "#4ecdc4" : "#2a3a5c"}`,
              borderRadius:12, padding:"10px 16px", fontSize:15, fontFamily:"'Fredoka'", cursor:"pointer",
            }}>
              🔤 Sounds ({soundRecordedCount}/{PHONEMES.length})
            </button>
            <button onClick={() => setTab("words")} style={{
              flex:1, background: tab === "words" ? "#b088f9" : "#1a2744",
              color: tab === "words" ? "#0f1729" : "#a0aec0",
              border: `2px solid ${tab === "words" ? "#b088f9" : "#2a3a5c"}`,
              borderRadius:12, padding:"10px 16px", fontSize:15, fontFamily:"'Fredoka'", cursor:"pointer",
            }}>
              📖 Words ({wordRecordedCount}/{WORDS.length})
            </button>
          </div>

          {/* Progress bar */}
          <div style={{background:"#0f1729",borderRadius:8,height:8,marginBottom:16,overflow:"hidden"}}>
            <div style={{
              background: tab === "sounds" ? "linear-gradient(90deg, #7bc67e, #4ecdc4)" : "linear-gradient(90deg, #b088f9, #7c5cbf)",
              height:"100%",
              width: tab === "sounds" ? `${(soundRecordedCount / PHONEMES.length) * 100}%` : `${(wordRecordedCount / Math.max(1, WORDS.length)) * 100}%`,
              borderRadius:8, transition:"width 0.5s"
            }} />
          </div>
        </>
      )}

      {!selectedItem ? (
        <div>
          {/* ─── SOUNDS TAB ─── */}
          {tab === "sounds" && (
            <>
              <div style={{background:"#1a2744",borderRadius:16,padding:14,marginBottom:16}}>
                <p style={{fontFamily:"'Fredoka'",fontSize:14,color:"#f4a261",margin:"0 0 4px"}}>Tips for pure sounds</p>
                <p style={{fontFamily:"'Andika'",fontSize:12,color:"#a0aec0",margin:0,lineHeight:1.5}}>
                  15-20cm away. ONLY the pure sound.
                  <strong style={{color:"#4ecdc4"}}> Stretchy</strong> = hold it: "sssss".
                  <strong style={{color:"#f4a261"}}> Bouncy</strong> = short and crisp.
                </p>
              </div>

              {phonemeGroups.map(group => {
                const done = group.items.filter(p => hasRecording(p.id)).length;
                return (
                  <div key={group.label} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <h3 style={{fontFamily:"'Fredoka'",fontSize:13,color:"#4ecdc4",margin:0}}>{group.label}</h3>
                      <span style={{fontFamily:"'Andika'",fontSize:11,color:done === group.items.length ? "#7bc67e" : "#a0aec0"}}>
                        {done === group.items.length ? "✓" : `${done}/${group.items.length}`}
                      </span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(56px, 1fr))",gap:6}}>
                      {group.items.map(p => {
                        const recorded = hasRecording(p.id);
                        return (
                          <button key={p.id} onClick={() => selectItem(p.id)} style={{
                            background: recorded ? "#1a3a1a" : "#1e2d4f",
                            border: `2px solid ${recorded ? "#7bc67e" : "#2a3a5c"}`,
                            borderRadius:10, padding:"6px 4px", cursor:"pointer", position:"relative",
                          }}>
                            <span style={{fontFamily:"'Andika'",fontSize:20,color:"white",display:"block"}}>{p.grapheme}</span>
                            {recorded && <span style={{position:"absolute",top:2,right:2,fontSize:8}}>🎙️</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ─── WORDS TAB ─── */}
          {tab === "words" && (
            <>
              <div style={{background:"#1a2744",borderRadius:16,padding:14,marginBottom:12}}>
                <p style={{fontFamily:"'Fredoka'",fontSize:14,color:"#b088f9",margin:"0 0 4px"}}>Recording words</p>
                <p style={{fontFamily:"'Andika'",fontSize:12,color:"#a0aec0",margin:0,lineHeight:1.5}}>
                  Say the word clearly and naturally. Logan will hear your voice when practising.
                </p>
              </div>

              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {[{v:0,l:"All"},{v:2,l:"Phase 2"},{v:3,l:"Phase 3"},{v:4,l:"Phase 4"}].map(f => (
                  <button key={f.v} onClick={() => setWordPhaseFilter(f.v)} style={{
                    background: wordPhaseFilter === f.v ? "#b088f9" : "#1a2744",
                    color: wordPhaseFilter === f.v ? "#0f1729" : "#a0aec0",
                    border: `2px solid ${wordPhaseFilter === f.v ? "#b088f9" : "#2a3a5c"}`,
                    borderRadius:8, padding:"4px 12px", fontSize:12, fontFamily:"'Fredoka'", cursor:"pointer",
                  }}>
                    {f.l}
                  </button>
                ))}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(76px, 1fr))",gap:6}}>
                {filteredWords.map(w => {
                  const wid = `word:${w.word}`;
                  const recorded = hasRecording(wid);
                  return (
                    <button key={wid} onClick={() => { setTab("words"); selectItem(wid); }} style={{
                      background: recorded ? "#2a1a3a" : "#1e2d4f",
                      border: `2px solid ${recorded ? "#b088f9" : "#2a3a5c"}`,
                      borderRadius:10, padding:"6px 2px", cursor:"pointer", position:"relative",
                    }}>
                      <span style={{fontSize:16,display:"block"}}>{w.image}</span>
                      <span style={{fontFamily:"'Andika'",fontSize:14,color:"white",display:"block"}}>{w.word}</span>
                      {recorded && <span style={{position:"absolute",top:2,right:2,fontSize:8}}>🎙️</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{textAlign:"center"}}>
          {/* ─── RECORDING VIEW ─── */}
          {isWord ? (
            <>
              <div style={{fontSize:56,marginBottom:8}}>{selectedWordObj?.image}</div>
              <div style={{background:"#1e2d4f",border:"4px solid #b088f9",borderRadius:24,padding:"16px 40px",display:"inline-block",marginBottom:12}}>
                <span style={{fontFamily:"'Andika'",fontSize:56,color:"white"}}>{selectedWordObj?.word}</span>
              </div>
              <div style={{marginBottom:8}}>
                <span style={{fontFamily:"'Fredoka'",fontSize:13,background:"rgba(176,136,249,0.2)",color:"#b088f9",padding:"4px 14px",borderRadius:20,border:"1px solid #b088f9"}}>
                  {selectedWordObj?.structure} · Phase {selectedWordObj?.phase}
                </span>
              </div>
              <p style={{fontFamily:"'Andika'",fontSize:14,color:"#a0aec0",margin:"0 0 16px"}}>
                Sounds: {selectedWordObj?.phonemes.join(" · ")}
              </p>
            </>
          ) : (
            <>
              <div style={{marginBottom:8}}>
                <span style={{fontSize:48}}>{selectedPhoneme?.emoji}</span>
              </div>
              <div style={{background:"#1e2d4f",border:"4px solid #ffd966",borderRadius:24,padding:"20px 48px",display:"inline-block",marginBottom:12}}>
                <span style={{fontFamily:"'Andika'",fontSize:80,color:"white"}}>{selectedPhoneme?.grapheme}</span>
              </div>
              <div style={{marginBottom:12}}>
                <span style={{
                  fontFamily:"'Fredoka'", fontSize:14,
                  background: selectedPhoneme?.type === "stretchy" ? "rgba(78,205,196,0.2)" : "rgba(244,162,97,0.2)",
                  color: selectedPhoneme?.type === "stretchy" ? "#4ecdc4" : "#f4a261",
                  padding:"4px 14px", borderRadius:20,
                  border: `1px solid ${selectedPhoneme?.type === "stretchy" ? "#4ecdc4" : "#f4a261"}`
                }}>
                  {selectedPhoneme?.type === "stretchy" ? "Stretchy — hold it" : "Bouncy — quick and crisp"}
                </span>
              </div>
              <p style={{fontFamily:"'Andika'",fontSize:16,color:"#f0f0f0",maxWidth:400,margin:"0 auto 4px"}}>
                {selectedPhoneme?.hint}
              </p>
              <p style={{fontFamily:"'Andika'",fontSize:14,color:"#a0aec0",maxWidth:400,margin:"0 auto 16px"}}>
                {selectedPhoneme?.action}
              </p>
            </>
          )}

          {/* Audio controls */}
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:16}}>
            <button onClick={playPreview} style={{
              background:"#1e2d4f",border:"2px solid #4ecdc4",borderRadius:14,
              padding:"14px 20px",fontSize:16,color:"#4ecdc4",cursor:"pointer",fontFamily:"'Fredoka'",
              display:"flex",alignItems:"center",gap:8
            }}>
              🔊 AI voice
            </button>

            {!recording ? (
              <button onClick={startRecording} style={{
                background:"#c0392b",border:"none",borderRadius:14,
                padding:"14px 24px",fontSize:16,color:"white",cursor:"pointer",fontFamily:"'Fredoka'",
                display:"flex",alignItems:"center",gap:8,
                boxShadow:"0 4px 16px rgba(192,57,43,0.4)"
              }}>
                🔴 Record
              </button>
            ) : (
              <button onClick={stopRecording} style={{
                background:"#e74c3c",border:"none",borderRadius:14,
                padding:"14px 24px",fontSize:16,color:"white",cursor:"pointer",fontFamily:"'Fredoka'",
                animation:"pulse 1s infinite",
                display:"flex",alignItems:"center",gap:8
              }}>
                ⏹ Stop ({(recordingTime / 10).toFixed(1)}s)
              </button>
            )}
          </div>

          {/* Playback */}
          {audioUrl && (
            <div style={{background: isWord ? "#2a1a3a" : "#1a3a1a",border:`2px solid ${isWord ? "#b088f9" : "#7bc67e"}`,borderRadius:16,padding:16,marginBottom:16,maxWidth:360,margin:"0 auto 16px"}}>
              <p style={{fontFamily:"'Fredoka'",fontSize:14,color: isWord ? "#b088f9" : "#7bc67e",margin:"0 0 10px"}}>🎙️ Your recording</p>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button onClick={() => new Audio(audioUrl).play()} style={{
                  background: isWord ? "#3a2a4a" : "#2a5a2a",border:`2px solid ${isWord ? "#b088f9" : "#7bc67e"}`,borderRadius:12,
                  padding:"10px 24px",fontSize:16,color: isWord ? "#b088f9" : "#7bc67e",cursor:"pointer",fontFamily:"'Fredoka'"
                }}>
                  ▶️ Play
                </button>
                <button onClick={startRecording} style={{
                  background:"#1e2d4f",border:"2px solid #f4a261",borderRadius:12,
                  padding:"10px 24px",fontSize:16,color:"#f4a261",cursor:"pointer",fontFamily:"'Fredoka'"
                }}>
                  🔄 Re-record
                </button>
                <button onClick={deleteRecording} style={{
                  background:"transparent",border:"1px solid #4a2020",borderRadius:12,
                  padding:"10px 16px",fontSize:16,color:"#e88d8d",cursor:"pointer",fontFamily:"'Fredoka'"
                }}>
                  🗑️
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{display:"flex",gap:12,justifyContent:"center",alignItems:"center",marginBottom:8}}>
            {(() => {
              const list = getItemList();
              const idx = list.indexOf(selectedItem);
              const prev = idx > 0 ? list[idx - 1] : null;
              const next = idx < list.length - 1 ? list[idx + 1] : null;
              const lbl = (id) => {
                if (!id) return '';
                if (id.startsWith("word:")) return id.slice(5);
                return PHONEMES.find(p => p.id === id)?.grapheme || id;
              };
              return (
                <>
                  <button onClick={() => prev && selectItem(prev)} disabled={!prev}
                    style={{background:"transparent",border:"2px solid #2a3a5c",borderRadius:12,padding:"10px 20px",fontSize:16,color:prev?"#a0aec0":"#2a3a5c",cursor:prev?"pointer":"default",fontFamily:"'Fredoka'"}}>
                    ← {lbl(prev)}
                  </button>
                  <span style={{fontFamily:"'Andika'",fontSize:13,color:"#4a5578"}}>
                    {idx + 1} / {list.length}
                  </span>
                  <button onClick={() => next && selectItem(next)} disabled={!next}
                    style={{background:"transparent",border:"2px solid #2a3a5c",borderRadius:12,padding:"10px 20px",fontSize:16,color:next?"#a0aec0":"#2a3a5c",cursor:next?"pointer":"default",fontFamily:"'Fredoka'"}}>
                    {lbl(next)} →
                  </button>
                </>
              );
            })()}
          </div>

          <button onClick={() => setSelectedItem(null)} style={{
            background:"transparent",border:"2px solid #a0aec0",borderRadius:12,
            padding:"10px 24px",fontSize:16,color:"#a0aec0",cursor:"pointer",fontFamily:"'Fredoka'"
          }}>
            ← Back to all {tab}
          </button>
        </div>
      )}
    </div>
  );
}
