import { PHONEMES, WORDS } from '../data/phonemes';
import { getCurriculumGap } from '../hooks/useSession';
import { MASTERY_LEVELS, getMasteryLevel } from '../data/leitner';
import PhonoBuddyOwl from './PhonoBuddyOwl';

export default function Dashboard({ progress, sessionCount }) {
  const gap = getCurriculumGap(progress);
  const introduced = gap.introduced;
  const mastered = PHONEMES.filter(p => (progress[p.id]?.mastery || 0) >= 5);
  const learning = introduced.filter(p => (progress[p.id]?.mastery || 0) >= 3 && (progress[p.id]?.mastery || 0) < 5);
  const struggling = gap.struggling;

  const bdErrors = Object.values(progress).reduce((sum, p) => {
    if (p.id === 'b' || p.id === 'd') return sum + (p.incorrect || 0);
    return sum;
  }, 0);

  // Group sounds by phase for the visual grid
  const phase2 = PHONEMES.filter(p => p.phase === 2);
  const phase3 = PHONEMES.filter(p => p.phase === 3);

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <PhonoBuddyOwl size={60} mood="happy" />
        <div>
          <h2 style={{fontFamily:"'Fredoka', sans-serif",fontSize:28,color:"#ffd966",margin:0}}>Logan's Progress</h2>
          <p style={{fontFamily:"'Andika', sans-serif",fontSize:16,color:"#a0aec0",margin:0}}>Week {gap.weeksIn} of Reception year</p>
        </div>
      </div>

      {/* GAP ANALYSIS — the key panel */}
      <div style={{background: gap.soundsBehind > 0 ? "#1e1a2e" : "#1a3020", borderRadius:16, padding:20, marginBottom:16, border:`2px solid ${gap.soundsBehind > 0 ? "#b088f9" : "#7bc67e"}`}}>
        <h3 style={{fontFamily:"'Fredoka'",fontSize:18,color: gap.soundsBehind > 0 ? "#b088f9" : "#7bc67e",margin:"0 0 12px"}}>
          {gap.soundsBehind > 0 ? "📊 Catch-up Progress" : "🎉 On Track!"}
        </h3>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Fredoka'",fontSize:28,color:"#ffd966"}}>{gap.expectedPhonemes.length}</div>
            <div style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0"}}>Expected by<br/>Week {gap.weeksIn}</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Fredoka'",fontSize:28,color:"#4ecdc4"}}>{introduced.length}</div>
            <div style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0"}}>Logan<br/>knows</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Fredoka'",fontSize:28,color: gap.soundsBehind > 0 ? "#f4a261" : "#7bc67e"}}>{gap.soundsBehind}</div>
            <div style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0"}}>Still to<br/>learn</div>
          </div>
        </div>

        {/* Progress bar: introduced vs expected */}
        <div style={{position:"relative",background:"#0f1729",borderRadius:8,height:20,overflow:"hidden",marginBottom:8}}>
          {/* Expected position marker */}
          <div style={{position:"absolute",left:`${(gap.expectedPhonemes.length / PHONEMES.length) * 100}%`,top:0,bottom:0,width:2,background:"#ffd966",zIndex:2}} />
          {/* Actual progress */}
          <div style={{background:"linear-gradient(90deg, #4ecdc4, #7bc67e)",height:"100%",width:`${(introduced.length / PHONEMES.length) * 100}%`,borderRadius:8,transition:"width 0.5s"}} />
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontFamily:"'Andika'",color:"#a0aec0"}}>
          <span>0</span>
          <span style={{color:"#ffd966"}}>▲ Expected ({gap.expectedPhonemes.length})</span>
          <span>{PHONEMES.length} total</span>
        </div>

        {gap.soundsBehind > 0 && (
          <div style={{marginTop:12,padding:12,background:"rgba(0,0,0,0.2)",borderRadius:10}}>
            <p style={{fontFamily:"'Andika'",fontSize:13,color:"#e0e0e0",margin:"0 0 8px"}}>
              <strong>Next sounds to learn:</strong>
            </p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {gap.missingPhonemes.slice(0, 12).map(p => (
                <span key={p.id} style={{fontFamily:"'Andika'",fontSize:16,background:"#2a1a44",padding:"4px 10px",borderRadius:8,color:"#d0b0ff",border:"1px solid #5a3a8a"}}>
                  {p.grapheme} <span style={{fontSize:10,opacity:0.7}}>{p.emoji}</span>
                </span>
              ))}
              {gap.missingPhonemes.length > 12 && (
                <span style={{fontFamily:"'Andika'",fontSize:12,color:"#a0aec0",padding:"6px"}}>
                  +{gap.missingPhonemes.length - 12} more
                </span>
              )}
            </div>
            <p style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0",margin:"8px 0 0"}}>
              At {gap.catchUpRate} sounds/session, ~{Math.ceil(gap.soundsBehind / gap.catchUpRate)} sessions to catch up
            </p>
          </div>
        )}
      </div>

      {/* WORD STATS */}
      <div style={{background:"#1a2744",borderRadius:16,padding:20,marginBottom:16}}>
        <h3 style={{fontFamily:"'Fredoka'",fontSize:18,color:"#4ecdc4",margin:"0 0 12px"}}>📝 Words</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{textAlign:"center",padding:12,background:"#0f1729",borderRadius:12}}>
            <div style={{fontFamily:"'Fredoka'",fontSize:28,color:"#4ecdc4"}}>{gap.decodableWords.length}</div>
            <div style={{fontFamily:"'Andika'",fontSize:12,color:"#a0aec0"}}>Words Logan<br/>can decode</div>
          </div>
          <div style={{textAlign:"center",padding:12,background:"#0f1729",borderRadius:12}}>
            <div style={{fontFamily:"'Fredoka'",fontSize:28,color:"#ffd966"}}>{gap.expectedWords.length}</div>
            <div style={{fontFamily:"'Andika'",fontSize:12,color:"#a0aec0"}}>Expected by<br/>Week {gap.weeksIn}</div>
          </div>
        </div>
        <div style={{background:"#0f1729",borderRadius:8,height:8,marginTop:12,overflow:"hidden"}}>
          <div style={{background:"linear-gradient(90deg, #4ecdc4, #7bc67e)",height:"100%",width:`${gap.expectedWords.length > 0 ? (gap.decodableWords.length / gap.expectedWords.length) * 100 : 0}%`,borderRadius:8,transition:"width 0.5s"}} />
        </div>
      </div>

      {/* MASTERY BREAKDOWN */}
      <div style={{background:"#1a2744",borderRadius:16,padding:20,marginBottom:16}}>
        <h3 style={{fontFamily:"'Fredoka'",fontSize:18,color:"#f4a261",margin:"0 0 16px"}}>📊 Mastery Breakdown</h3>
        {MASTERY_LEVELS.map(ml => {
          const count = gap.masteryBreakdown[ml.level];
          const pct = introduced.length > 0 ? (count / introduced.length) * 100 : 0;
          return (
            <div key={ml.level} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:16,width:24,textAlign:"center"}}>{ml.emoji}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontFamily:"'Andika'",fontSize:12,color:ml.color}}>{ml.label}</span>
                  <span style={{fontFamily:"'Fredoka'",fontSize:12,color:"#a0aec0"}}>{count}</span>
                </div>
                <div style={{background:"#0f1729",borderRadius:4,height:6,overflow:"hidden"}}>
                  <div style={{background:ml.color,height:"100%",width:`${pct}%`,borderRadius:4,transition:"width 0.5s"}} />
                </div>
              </div>
            </div>
          );
        })}
        <p style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0",margin:"8px 0 0",textAlign:"center"}}>
          {gap.masteryBreakdown[5]} signed off · {gap.masteryBreakdown[4]} nearly there · {gap.masteryBreakdown[1] + gap.masteryBreakdown[2]} need work
        </p>
      </div>

      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:12,marginBottom:16}}>
        {[
          { label:"Sessions", value:sessionCount, color:"#4ecdc4", icon:"📅" },
          { label:"Signed off", value:gap.masteryBreakdown[5], color:"#4ecdc4", icon:"⭐" },
          { label:"Need work", value:gap.masteryBreakdown[1] + gap.masteryBreakdown[2], color:"#e88d8d", icon:"🔴" },
        ].map(s => (
          <div key={s.label} style={{background:"#1a2744",borderRadius:14,padding:16,textAlign:"center"}}>
            <div style={{fontSize:24}}>{s.icon}</div>
            <div style={{fontFamily:"'Fredoka'",fontSize:28,color:s.color}}>{s.value}</div>
            <div style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {bdErrors > 3 && (
        <div style={{background:"#3a2020",border:"2px solid #e88d8d",borderRadius:14,padding:16,marginBottom:16}}>
          <p style={{fontFamily:"'Fredoka'",fontSize:16,color:"#e88d8d",margin:0}}>
            b/d confusion detected ({bdErrors} errors) — BED trick will show automatically
          </p>
        </div>
      )}
      {struggling.length > 0 && (
        <div style={{background:"#2a2a10",border:"2px solid #f4a261",borderRadius:14,padding:16,marginBottom:16}}>
          <p style={{fontFamily:"'Fredoka'",fontSize:16,color:"#f4a261",margin:"0 0 8px"}}>Sounds needing extra practice:</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {struggling.map(p => (
              <span key={p.id} style={{fontFamily:"'Andika'",fontSize:22,background:"#1e2d4f",padding:"4px 12px",borderRadius:8,color:"white"}}>{p.grapheme}</span>
            ))}
          </div>
        </div>
      )}

      {/* Sound grid — Phase 2 */}
      <h3 style={{fontFamily:"'Fredoka'",fontSize:18,color:"#f0f0f0",margin:"20px 0 12px"}}>Phase 2 — Single Letters ({phase2.length})</h3>
      <SoundGrid phonemes={phase2} progress={progress} expectedPhonemes={gap.expectedPhonemes} />

      {/* Sound grid — Phase 3 */}
      <h3 style={{fontFamily:"'Fredoka'",fontSize:18,color:"#f0f0f0",margin:"20px 0 12px"}}>Phase 3 — Digraphs & Trigraphs ({phase3.length})</h3>
      <SoundGrid phonemes={phase3} progress={progress} expectedPhonemes={gap.expectedPhonemes} />
    </div>
  );
}

function SoundGrid({ phonemes, progress, expectedPhonemes }) {
  const expectedIds = new Set(expectedPhonemes.map(p => p.id));

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(56px, 1fr))",gap:8}}>
      {phonemes.map(p => {
        const prog = progress[p.id];
        const isIntroduced = prog?.introduced;
        const mastery = prog?.mastery || 0;
        const ml = mastery > 0 ? getMasteryLevel(mastery) : null;
        const shouldKnow = expectedIds.has(p.id);
        const isMissing = shouldKnow && !isIntroduced;

        let bg = "#0f1729";
        let border = "2px solid #1e2d4f";
        let glow = "none";
        if (mastery === 5) { bg = "#1a3a2a"; border = `2px solid ${ml.color}`; glow = `0 0 10px ${ml.color}33`; }
        else if (mastery >= 4) { bg = "#1a3a1a"; border = `2px solid ${ml.color}`; }
        else if (mastery >= 2) { bg = "#1e2d4f"; border = `2px solid ${ml.color}`; }
        else if (mastery === 1) { bg = "#3a1a1a"; border = `2px solid ${ml.color}`; }
        else if (isMissing) { bg = "#2a1a2a"; border = "2px dashed #f4a261"; }

        return (
          <div key={p.id} title={`${p.grapheme} — ${ml ? ml.label : "Not started"}`} style={{background:bg,border,borderRadius:10,padding:6,textAlign:"center",boxShadow:glow,position:"relative"}}>
            <span style={{fontFamily:"'Andika'",fontSize:22,color:isIntroduced?"white": isMissing ? "#f4a261" :"#4a5578"}}>{p.grapheme}</span>
            {ml && <div style={{fontSize:8,marginTop:1}}>{ml.emoji}</div>}
            {isMissing && <div style={{fontSize:7,marginTop:1,color:"#f4a261"}}>behind</div>}
          </div>
        );
      })}
    </div>
  );
}
