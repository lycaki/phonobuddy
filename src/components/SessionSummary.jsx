import { useMemo } from 'react';
import PhonoBuddyOwl from './PhonoBuddyOwl';
import { MASTERY_LEVELS, getMasteryLevel } from '../data/leitner';

export default function SessionSummary({ sessionResults, sessionTimer, knownCount, onHome, onDashboard, onAssess, sessionMode, progress }) {
  const correctCount = sessionResults.filter(r => r.correct).length;
  const incorrectCount = sessionResults.filter(r => !r.correct).length;
  const newSounds = sessionResults.filter(r => r.activity.type === "introduce").length;
  const totalActivities = sessionResults.length;
  const accuracy = totalActivities > 0 ? Math.round((correctCount / totalActivities) * 100) : 0;
  const isAssessment = sessionMode === "assess";

  // Build mastery change report for assessment
  const masteryChanges = useMemo(() => {
    if (!isAssessment || !progress) return [];
    const changes = [];
    const seen = new Set();
    sessionResults.forEach(r => {
      if (r.activity.type === "identify" && r.activity.phoneme) {
        const id = r.activity.phoneme.id;
        if (seen.has(id)) return;
        seen.add(id);
        const prog = progress[id];
        if (prog) {
          changes.push({
            grapheme: r.activity.phoneme.grapheme,
            emoji: r.activity.phoneme.emoji,
            mastery: prog.mastery || 1,
            correct: r.correct,
          });
        }
      }
    });
    return changes.sort((a, b) => a.mastery - b.mastery);
  }, [sessionResults, isAssessment, progress]);

  return (
    <div style={{textAlign:"center",paddingTop:32}}>
      <div style={{animation:"bounceIn 0.5s ease"}}>
        <PhonoBuddyOwl size={120} mood={accuracy >= 70 ? "excited" : "thinking"} speaking />
      </div>
      <h2 style={{fontFamily:"'Fredoka'",fontSize:32,color:"#ffd966",margin:"16px 0"}}>
        {isAssessment ? "Assessment Complete! 📋" : "Session Complete! 🎉"}
      </h2>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns: isAssessment ? "1fr 1fr 1fr" : "1fr 1fr 1fr",gap:12,marginBottom:24}}>
        <div style={{background:"#1a2744",borderRadius:14,padding:16}}>
          <div style={{fontFamily:"'Fredoka'",fontSize:28,color:"#4ecdc4"}}>
            {Math.floor(sessionTimer / 60)}:{String(sessionTimer % 60).padStart(2,'0')}
          </div>
          <div style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0"}}>Duration</div>
        </div>
        <div style={{background:"#1a2744",borderRadius:14,padding:16}}>
          <div style={{fontFamily:"'Fredoka'",fontSize:28,color:"#7bc67e"}}>{correctCount}/{totalActivities}</div>
          <div style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0"}}>Correct</div>
        </div>
        <div style={{background:"#1a2744",borderRadius:14,padding:16}}>
          <div style={{fontFamily:"'Fredoka'",fontSize:28,color: accuracy >= 80 ? "#7bc67e" : accuracy >= 50 ? "#ffd966" : "#e88d8d"}}>{accuracy}%</div>
          <div style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0"}}>Accuracy</div>
        </div>
      </div>

      {/* Assessment: mastery level breakdown */}
      {isAssessment && masteryChanges.length > 0 && (
        <div style={{background:"#1a2744",borderRadius:16,padding:16,marginBottom:24,textAlign:"left"}}>
          <h3 style={{fontFamily:"'Fredoka'",fontSize:16,color:"#b088f9",margin:"0 0 12px"}}>Mastery Levels</h3>
          <div style={{display:"grid",gap:6}}>
            {masteryChanges.map((c, i) => {
              const ml = getMasteryLevel(c.mastery);
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"#0f1729",borderRadius:10}}>
                  <span style={{fontSize:20,width:30,textAlign:"center"}}>{c.emoji}</span>
                  <span style={{fontFamily:"'Andika'",fontSize:22,color:"white",width:40,textAlign:"center"}}>{c.grapheme}</span>
                  <span style={{fontSize:14}}>{c.correct ? "✅" : "❌"}</span>
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:14}}>{ml.emoji}</span>
                    <span style={{fontFamily:"'Andika'",fontSize:12,color:ml.color}}>{ml.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary counts */}
          <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap",justifyContent:"center"}}>
            {MASTERY_LEVELS.map(ml => {
              const count = masteryChanges.filter(c => c.mastery === ml.level).length;
              if (count === 0) return null;
              return (
                <div key={ml.level} style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"4px 10px",textAlign:"center"}}>
                  <span style={{fontSize:12}}>{ml.emoji}</span>
                  <span style={{fontFamily:"'Fredoka'",fontSize:14,color:ml.color,marginLeft:4}}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Learning session: stars */}
      {!isAssessment && (
        <>
          <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:24}}>
            {sessionResults.filter(r => r.correct).slice(0, 8).map((_, i) => (
              <span key={i} style={{fontSize:36,animation:`bounceIn 0.3s ease ${i * 0.1}s both`}}>⭐</span>
            ))}
          </div>
          {newSounds > 0 && (
            <p style={{fontFamily:"'Andika'",fontSize:16,color:"#b088f9",marginBottom:8}}>
              {newSounds} new sound{newSounds > 1 ? "s" : ""} introduced!
            </p>
          )}
        </>
      )}

      <p style={{fontFamily:"'Andika'",fontSize:16,color:"#a0aec0",marginBottom:24}}>
        {isAssessment
          ? `${accuracy >= 80 ? "Brilliant! " : accuracy >= 50 ? "Good progress! " : "Keep practising! "}${knownCount} sounds discovered.`
          : `Great work! ${knownCount} sounds discovered so far.`
        }
      </p>

      {/* Action buttons */}
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button onClick={onHome} style={{background:"#4ecdc4",border:"none",borderRadius:16,padding:"16px 32px",fontSize:20,fontFamily:"'Fredoka'",color:"#0f1729",cursor:"pointer"}}>
          🏠 Home
        </button>
        <button onClick={onDashboard} style={{background:"#1a2744",border:"2px solid #4ecdc4",borderRadius:16,padding:"16px 32px",fontSize:20,fontFamily:"'Fredoka'",color:"#4ecdc4",cursor:"pointer"}}>
          📊 Progress
        </button>

        {/* After a learning session: suggest assessment */}
        {!isAssessment && onAssess && (
          <button onClick={onAssess} style={{background:"linear-gradient(135deg, #b088f9, #7c5cbf)",border:"none",borderRadius:16,padding:"16px 24px",fontSize:18,fontFamily:"'Fredoka'",color:"white",cursor:"pointer"}}>
            📋 Test Logan now
          </button>
        )}
      </div>
    </div>
  );
}
