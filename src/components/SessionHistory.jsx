import { useState, useEffect } from 'react';
import { getSessionHistory } from '../utils/storage';

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getSessionHistory(30).then(setSessions);
  }, []);

  if (sessions.length === 0) {
    return (
      <div style={{background:"#1a2744",borderRadius:16,padding:20,textAlign:"center"}}>
        <p style={{fontFamily:"'Andika'",fontSize:15,color:"#a0aec0",margin:0}}>No sessions yet. Start one from the home screen!</p>
      </div>
    );
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
  }

  function formatDuration(secs) {
    return `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
  }

  return (
    <div>
      <h3 style={{fontFamily:"'Fredoka'",fontSize:18,color:"#f0f0f0",margin:"0 0 12px"}}>Session History</h3>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {sessions.map((s, i) => {
          const accuracy = s.correct + s.incorrect > 0
            ? Math.round((s.correct / (s.correct + s.incorrect)) * 100)
            : 0;
          const isExpanded = expanded === i;

          return (
            <div key={s.id || i}>
              <button onClick={() => setExpanded(isExpanded ? null : i)} style={{
                background:"#1a2744",border:"1px solid #2a3a5c",borderRadius:isExpanded ? "14px 14px 0 0" : 14,
                padding:"12px 16px",cursor:"pointer",width:"100%",textAlign:"left",
                display:"flex",justifyContent:"space-between",alignItems:"center",
              }}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{
                    width:40,height:40,borderRadius:10,
                    background: accuracy >= 80 ? "#1a3a1a" : accuracy >= 50 ? "#2a2a10" : "#3a1a1a",
                    border: `2px solid ${accuracy >= 80 ? "#7bc67e" : accuracy >= 50 ? "#f4a261" : "#e88d8d"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontFamily:"'Fredoka'",fontSize:14,color:accuracy >= 80 ? "#7bc67e" : accuracy >= 50 ? "#f4a261" : "#e88d8d",
                  }}>
                    {accuracy}%
                  </div>
                  <div>
                    <div style={{fontFamily:"'Fredoka'",fontSize:15,color:"#f0f0f0"}}>
                      {s.activitiesCompleted} activities · {formatDuration(s.duration)}
                    </div>
                    <div style={{fontFamily:"'Andika'",fontSize:12,color:"#a0aec0"}}>
                      {formatDate(s.date)}
                      {s.newSoundsIntroduced?.length > 0 && (
                        <span style={{color:"#ffd966"}}> · New: {s.newSoundsIntroduced.join(", ")}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span style={{color:"#4a5578",fontSize:14}}>{isExpanded ? "▲" : "▼"}</span>
              </button>

              {isExpanded && (
                <div style={{background:"#0f1729",border:"1px solid #2a3a5c",borderTop:"none",borderRadius:"0 0 14px 14px",padding:14}}>
                  {/* Stats row */}
                  <div style={{display:"flex",gap:12,marginBottom:12}}>
                    <div style={{background:"#1a3a1a",borderRadius:8,padding:"6px 12px",fontFamily:"'Fredoka'",fontSize:13,color:"#7bc67e"}}>
                      ✓ {s.correct} correct
                    </div>
                    <div style={{background:"#3a1a1a",borderRadius:8,padding:"6px 12px",fontFamily:"'Fredoka'",fontSize:13,color:"#e88d8d"}}>
                      ✗ {s.incorrect} wrong
                    </div>
                  </div>

                  {/* Sounds reviewed */}
                  {s.soundsReviewed?.length > 0 && (
                    <div style={{marginBottom:8}}>
                      <p style={{fontFamily:"'Andika'",fontSize:12,color:"#a0aec0",margin:"0 0 4px"}}>Sounds reviewed:</p>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {s.soundsReviewed.map(g => (
                          <span key={g} style={{fontFamily:"'Andika'",fontSize:18,background:"#1e2d4f",padding:"2px 8px",borderRadius:6,color:"white"}}>{g}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Words tried */}
                  {s.wordsTried?.length > 0 && (
                    <div style={{marginBottom:8}}>
                      <p style={{fontFamily:"'Andika'",fontSize:12,color:"#a0aec0",margin:"0 0 4px"}}>Words practised:</p>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {s.wordsTried.map(w => (
                          <span key={w} style={{fontFamily:"'Andika'",fontSize:16,background:"#1e2d4f",padding:"2px 8px",borderRadius:6,color:"white"}}>{w}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Individual results */}
                  {s.results && (
                    <div>
                      <p style={{fontFamily:"'Andika'",fontSize:12,color:"#a0aec0",margin:"0 0 4px"}}>Activity log:</p>
                      <div style={{display:"flex",flexDirection:"column",gap:2}}>
                        {s.results.map((r, j) => (
                          <div key={j} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0",fontSize:13,fontFamily:"'Andika'",color:"#a0aec0"}}>
                            <span style={{color:r.correct?"#7bc67e":"#e88d8d",fontSize:14}}>{r.correct?"✓":"✗"}</span>
                            <span style={{color:"#4ecdc4",fontSize:11,minWidth:55}}>{r.type}</span>
                            <span style={{fontFamily:"'Andika'",fontSize:16,color:"white"}}>{r.target}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
