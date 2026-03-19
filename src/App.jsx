import { useState, useEffect, useMemo, createContext } from 'react';
import { PHONEMES, WORDS } from './data/phonemes';
import { useProgress } from './hooks/useProgress';
import { useSession, getCurriculumGap } from './hooks/useSession';
import { useRecordings } from './hooks/useRecordings';
import { getFamilyCode, setFamilyCode as saveFamilyCode } from './utils/storage';
import PhonoBuddyOwl from './components/PhonoBuddyOwl';
import BedTrick from './components/BedTrick';
import IdentifySound from './components/activities/IdentifySound';
import Blending from './components/activities/Blending';
import IntroduceSound from './components/activities/IntroduceSound';
import RecordingStudio from './components/RecordingStudio';
import Dashboard from './components/Dashboard';
import SoundLibrary from './components/SoundLibrary';
import SessionSummary from './components/SessionSummary';
import BottomNav from './components/BottomNav';
import Settings from './components/Settings';
import WordPractice from './components/WordPractice';
import SessionHistory from './components/SessionHistory';
import QuickSetup from './components/QuickSetup';

// Context for recordings — so activities can play custom sounds
export const RecordingsContext = createContext({
  playSound: () => {},
  saveRecording: () => {},
  getPlaybackUrl: () => null,
  hasRecording: () => false,
  syncStatus: 'idle',
});

export default function App() {
  const [screen, setScreen] = useState("home");
  const [familyCode, setFamilyCode] = useState(null);

  const { progress, sessionCount, loaded, updatePhonemeProgress, incrementSessionCount, resetAll, syncToCloud, syncFromCloud, syncStatus } = useProgress(familyCode);
  const recordings = useRecordings(familyCode);
  const session = useSession(progress, updatePhonemeProgress, incrementSessionCount, sessionCount);

  // Load family code on mount
  useEffect(() => {
    getFamilyCode().then(code => { if (code) setFamilyCode(code); });
  }, []);

  const knownPhonemes = useMemo(
    () => PHONEMES.filter(p => progress[p.id]?.introduced),
    [progress]
  );

  const gap = useMemo(() => getCurriculumGap(progress), [progress]);

  function handleSetFamilyCode(code) {
    setFamilyCode(code);
    saveFamilyCode(code);
  }

  function handleStartSession() {
    session.startSession();
    setScreen("session");
  }

  function handleStartAssessment() {
    session.startAssessment();
    setScreen("session");
  }

  // Determine when session ends (isActive goes false while screen is session)
  useEffect(() => {
    if (screen === "session" && !session.isActive && session.sessionResults.length > 0) {
      setScreen("summary");
    }
  }, [session.isActive, screen, session.sessionResults.length]);

  if (!loaded) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0f1729"}}>
        <PhonoBuddyOwl size={100} mood="happy" speaking />
        <p style={{color:"#ffd966",fontFamily:"'Fredoka'",fontSize:24,marginLeft:16}}>Loading...</p>
      </div>
    );
  }

  const timerMin = Math.floor(session.sessionTimer / 60);
  const timerSec = session.sessionTimer % 60;

  return (
    <RecordingsContext.Provider value={recordings}>
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg, #0f1729 0%, #162038 50%, #1a2744 100%)",fontFamily:"'Andika', sans-serif",color:"#f0f0f0",position:"relative",overflow:"hidden"}}>

        {/* Stars background */}
        <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden"}}>
          {Array.from({length:40}).map((_, i) => (
            <div key={i} style={{position:"absolute",width:i%3===0?3:2,height:i%3===0?3:2,background:"rgba(255,255,255,0.4)",borderRadius:"50%",top:`${(i*37)%100}%`,left:`${(i*73+11)%100}%`,animation:`twinkle ${2+i%3}s ease-in-out infinite`,animationDelay:`${i*0.3}s`}} />
          ))}
        </div>

        {/* BED Trick Overlay */}
        {session.showBedTrick && <BedTrick onClose={() => session.setShowBedTrick(false)} />}

        {/* Main Content */}
        <div style={{position:"relative",zIndex:1,maxWidth:600,margin:"0 auto",padding:"16px 20px 100px"}}>

          {/* HOME SCREEN */}
          {screen === "home" && (() => {
            const mastered = PHONEMES.filter(p => progress[p.id]?.box >= 4 && progress[p.id]?.correct > 5).length;
            const totalCorrect = Object.values(progress).reduce((s, p) => s + (p.correct || 0), 0);
            const greetings = [
              "Ready to discover some sounds?",
              "Let's learn together!",
              "Time for some phonics fun!",
              "What sounds shall we explore?",
              "PhonoBuddy is excited to see you!",
            ];
            const greeting = sessionCount === 0
              ? "Welcome! Let's start our phonics adventure!"
              : greetings[sessionCount % greetings.length];

            return (
            <div style={{textAlign:"center",paddingTop:32}}>
              <div style={{animation:"float 3s ease-in-out infinite"}}>
                <PhonoBuddyOwl size={130} mood="excited" />
              </div>
              <h1 style={{fontFamily:"'Fredoka', sans-serif",fontSize:38,color:"#ffd966",margin:"12px 0 4px",letterSpacing:1}}>PhonoBuddy</h1>
              <p style={{fontFamily:"'Andika'",fontSize:16,color:"#a0aec0",margin:"0 0 16px"}}>{greeting}</p>

              {/* Catch-up status banner */}
              {gap.soundsBehind > 0 && (
                <div style={{background: gap.catchUpMode === "significant-gap" ? "#3a1a1a" : gap.catchUpMode === "behind" ? "#3a2a10" : "#1a2744", border:`2px solid ${gap.catchUpMode === "significant-gap" ? "#e88d8d" : gap.catchUpMode === "behind" ? "#f4a261" : "#4ecdc4"}`, borderRadius:16, padding:16, marginBottom:16, textAlign:"left"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontFamily:"'Fredoka'",fontSize:16,color: gap.catchUpMode === "significant-gap" ? "#e88d8d" : "#f4a261"}}>
                      {gap.catchUpMode === "significant-gap" ? "🚀 Catch-up mode!" : gap.catchUpMode === "behind" ? "📈 Building up speed" : gap.catchUpMode === "slightly-behind" ? "💪 Nearly there!" : "✨ Almost on track!"}
                    </span>
                    <span style={{fontFamily:"'Andika'",fontSize:12,color:"#a0aec0"}}>Week {gap.weeksIn}</span>
                  </div>
                  <p style={{fontFamily:"'Andika'",fontSize:13,color:"#e0e0e0",margin:"0 0 8px"}}>
                    Logan knows <strong style={{color:"#4ecdc4"}}>{gap.introduced.length}</strong> of <strong style={{color:"#ffd966"}}>{gap.expectedPhonemes.length}</strong> sounds expected by now.
                    {gap.soundsBehind > 0 && <> That's <strong style={{color:"#f4a261"}}>{gap.soundsBehind} sounds</strong> to catch up on.</>}
                  </p>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{flex:1,background:"#0f1729",borderRadius:6,height:6,overflow:"hidden"}}>
                      <div style={{background:"linear-gradient(90deg, #4ecdc4, #7bc67e)",height:"100%",width:`${(gap.introduced.length / gap.expectedPhonemes.length) * 100}%`,borderRadius:6,transition:"width 0.5s"}} />
                    </div>
                    <span style={{fontFamily:"'Fredoka'",fontSize:12,color:"#a0aec0"}}>{Math.round((gap.introduced.length / gap.expectedPhonemes.length) * 100)}%</span>
                  </div>
                  <p style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0",margin:"8px 0 0"}}>
                    {gap.catchUpRate > 2
                      ? `Sessions will introduce ${gap.catchUpRate} new sounds (faster pace to catch up)`
                      : "Sessions will introduce 2 new sounds each"}
                    {gap.struggling.length > 0 && ` · ${gap.struggling.length} sounds need extra practice`}
                  </p>
                </div>
              )}

              {gap.soundsBehind === 0 && sessionCount > 0 && (
                <div style={{background:"#1a3a1a",border:"2px solid #7bc67e",borderRadius:16,padding:16,marginBottom:16,textAlign:"center"}}>
                  <span style={{fontFamily:"'Fredoka'",fontSize:16,color:"#7bc67e"}}>🎉 On track! All {gap.expectedPhonemes.length} expected sounds introduced</span>
                </div>
              )}

              {/* Quick stats bar */}
              {sessionCount > 0 && (
                <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}}>
                  <div style={{background:"#1a2744",borderRadius:12,padding:"8px 14px",textAlign:"center"}}>
                    <div style={{fontFamily:"'Fredoka'",fontSize:20,color:"#4ecdc4"}}>{sessionCount}</div>
                    <div style={{fontFamily:"'Andika'",fontSize:10,color:"#a0aec0"}}>sessions</div>
                  </div>
                  <div style={{background:"#1a2744",borderRadius:12,padding:"8px 14px",textAlign:"center"}}>
                    <div style={{fontFamily:"'Fredoka'",fontSize:20,color:"#ffd966"}}>{knownPhonemes.length}</div>
                    <div style={{fontFamily:"'Andika'",fontSize:10,color:"#a0aec0"}}>sounds</div>
                  </div>
                  <div style={{background:"#1a2744",borderRadius:12,padding:"8px 14px",textAlign:"center"}}>
                    <div style={{fontFamily:"'Fredoka'",fontSize:20,color:"#7bc67e"}}>{mastered}</div>
                    <div style={{fontFamily:"'Andika'",fontSize:10,color:"#a0aec0"}}>mastered</div>
                  </div>
                  <div style={{background:"#1a2744",borderRadius:12,padding:"8px 14px",textAlign:"center"}}>
                    <div style={{fontFamily:"'Fredoka'",fontSize:20,color:"#b088f9"}}>{gap.decodableWords.length}</div>
                    <div style={{fontFamily:"'Andika'",fontSize:10,color:"#a0aec0"}}>words</div>
                  </div>
                </div>
              )}

              <button onClick={handleStartSession} style={{background:"linear-gradient(135deg, #4ecdc4, #44a08d)",border:"none",borderRadius:24,padding:"22px 48px",fontSize:24,fontFamily:"'Fredoka', sans-serif",color:"white",cursor:"pointer",boxShadow:"0 8px 32px rgba(78,205,196,0.3)",display:"block",width:"100%",maxWidth:340,margin:"0 auto 12px"}}>
                ▶️ Start Session
              </button>

              {knownPhonemes.length > 0 && (
                <button onClick={handleStartAssessment} style={{background:"linear-gradient(135deg, #b088f9, #7c5cbf)",border:"none",borderRadius:20,padding:"14px 36px",fontSize:18,fontFamily:"'Fredoka', sans-serif",color:"white",cursor:"pointer",boxShadow:"0 6px 24px rgba(176,136,249,0.3)",display:"block",width:"100%",maxWidth:340,margin:"0 auto 12px"}}>
                  📋 Test Logan
                </button>
              )}

              <button onClick={() => setScreen("quicksetup")} style={{background:"transparent",border:"2px solid #f4a261",borderRadius:16,padding:"10px 24px",fontSize:14,fontFamily:"'Fredoka', sans-serif",color:"#f4a261",cursor:"pointer",display:"block",width:"100%",maxWidth:340,margin:"0 auto 20px"}}>
                ⚡ Quick Setup — mark sounds as known
              </button>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <button onClick={() => setScreen("words")} style={{background:"#1a2744",border:"2px solid #2a3a5c",borderRadius:16,padding:16,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:24}}>📝</div>
                  <div style={{fontFamily:"'Fredoka'",fontSize:13,color:"#f0f0f0",marginTop:4}}>Words</div>
                </button>
                <button onClick={() => setScreen("library")} style={{background:"#1a2744",border:"2px solid #2a3a5c",borderRadius:16,padding:16,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:24}}>📖</div>
                  <div style={{fontFamily:"'Fredoka'",fontSize:13,color:"#f0f0f0",marginTop:4}}>Sounds</div>
                </button>
                <button onClick={() => setScreen("studio")} style={{background:"#1a2744",border:"2px solid #2a3a5c",borderRadius:16,padding:16,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:24}}>🎙️</div>
                  <div style={{fontFamily:"'Fredoka'",fontSize:13,color:"#f0f0f0",marginTop:4}}>Record</div>
                </button>
                <button onClick={() => setScreen("dashboard")} style={{background:"#1a2744",border:"2px solid #2a3a5c",borderRadius:16,padding:16,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:24}}>📊</div>
                  <div style={{fontFamily:"'Fredoka'",fontSize:13,color:"#f0f0f0",marginTop:4}}>Progress</div>
                </button>
                <button onClick={() => session.setShowBedTrick(true)} style={{background:"#1a2744",border:"2px solid #2a3a5c",borderRadius:16,padding:16,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:24}}>🛏️</div>
                  <div style={{fontFamily:"'Fredoka'",fontSize:13,color:"#f0f0f0",marginTop:4}}>b & d</div>
                </button>
                <button onClick={() => setScreen("settings")} style={{background:"#1a2744",border:"2px solid #2a3a5c",borderRadius:16,padding:16,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:24}}>⚙️</div>
                  <div style={{fontFamily:"'Fredoka'",fontSize:13,color:"#f0f0f0",marginTop:4}}>Settings</div>
                </button>
              </div>
            </div>
            );
          })()}

          {/* SESSION SCREEN */}
          {screen === "session" && session.sessionActivities.length > 0 && (
            <div>
              {/* Session header — adult info bar */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={() => { session.endSession(); setScreen("home"); }} style={{background:"transparent",border:"none",color:"#a0aec0",fontSize:14,cursor:"pointer",fontFamily:"'Andika'"}}>
                    ← Exit
                  </button>
                  {session.sessionMode === "assess" && (
                    <span style={{background:"#b088f9",color:"#0f1729",padding:"2px 10px",borderRadius:8,fontSize:11,fontFamily:"'Fredoka'"}}>ASSESSMENT</span>
                  )}
                </div>
                <div style={{display:"flex",gap:16,alignItems:"center"}}>
                  <span style={{fontFamily:"'Andika'",fontSize:14,color:"#a0aec0"}}>
                    {session.activityIndex + 1}/{session.sessionActivities.length}
                  </span>
                  <span style={{fontFamily:"'Fredoka'",fontSize:14,color:session.timerColor}}>
                    ⏱ {timerMin}:{String(timerSec).padStart(2,'0')}
                  </span>
                  {session.sessionTimer > 600 && session.sessionTimer <= 605 && (
                    <span style={{fontSize:12,color:"#f4a261"}}>10 min ⏰</span>
                  )}
                  {session.sessionTimer > 900 && session.sessionTimer <= 905 && (
                    <span style={{fontSize:12,color:"#e88d8d"}}>15 min — wrap up!</span>
                  )}
                </div>
              </div>

              {/* Progress dots */}
              <div style={{display:"flex",gap:4,marginBottom:24,justifyContent:"center",flexWrap:"wrap"}}>
                {session.sessionActivities.map((_, i) => (
                  <div key={i} style={{
                    width:i===session.activityIndex?24:10, height:10, borderRadius:5,
                    background: i < session.activityIndex ? (session.sessionResults[i]?.correct ? "#7bc67e" : "#e88d8d") : i === session.activityIndex ? "#ffd966" : "#2a3a5c",
                    transition:"all 0.3s"
                  }} />
                ))}
              </div>

              {/* Activity content */}
              <div style={{background:"rgba(26,39,68,0.6)",borderRadius:24,padding:24,backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.05)"}}>
                {session.sessionActivities[session.activityIndex]?.type === "identify" && (
                  <IdentifySound
                    targetPhoneme={session.sessionActivities[session.activityIndex].phoneme}
                    allPhonemes={knownPhonemes.length >= 4 ? knownPhonemes : PHONEMES.slice(0, 4)}
                    onResult={session.handleActivityResult}
                  />
                )}
                {session.sessionActivities[session.activityIndex]?.type === "introduce" && (
                  <IntroduceSound
                    phoneme={session.sessionActivities[session.activityIndex].phoneme}
                    onComplete={() => session.handleIntroComplete(session.sessionActivities[session.activityIndex].phoneme)}
                  />
                )}
                {session.sessionActivities[session.activityIndex]?.type === "blend" && (
                  <Blending
                    word={session.sessionActivities[session.activityIndex].word}
                    onResult={(correct) => session.handleActivityResult(correct)}
                  />
                )}
              </div>
            </div>
          )}

          {/* SESSION SUMMARY */}
          {screen === "summary" && (
            <SessionSummary
              sessionResults={session.sessionResults}
              sessionTimer={session.sessionTimer}
              knownCount={knownPhonemes.length}
              sessionMode={session.sessionMode}
              progress={progress}
              onHome={() => setScreen("home")}
              onDashboard={() => setScreen("dashboard")}
              onAssess={handleStartAssessment}
            />
          )}

          {/* DASHBOARD */}
          {screen === "dashboard" && (
            <div>
              <Dashboard progress={progress} sessionCount={sessionCount} />
              <div style={{marginTop:24}}>
                <SessionHistory />
              </div>
            </div>
          )}

          {/* WORD PRACTICE */}
          {screen === "words" && <WordPractice progress={progress} />}

          {/* RECORDING STUDIO */}
          {screen === "studio" && <RecordingStudio />}

          {/* SOUND LIBRARY */}
          {screen === "library" && <SoundLibrary progress={progress} />}

          {/* SETTINGS */}
          {screen === "quicksetup" && (
            <QuickSetup
              progress={progress}
              updatePhonemeProgress={updatePhonemeProgress}
              onClose={() => setScreen("home")}
            />
          )}

          {screen === "settings" && (
            <Settings
              familyCode={familyCode}
              onSetFamilyCode={handleSetFamilyCode}
              onPullFromCloud={recordings.pullFromCloud}
              syncStatus={recordings.syncStatus}
              onReset={resetAll}
              progress={progress}
              sessionCount={sessionCount}
              onSyncProgress={syncToCloud}
              onPullProgress={syncFromCloud}
              progressSyncStatus={syncStatus}
            />
          )}
        </div>

        {/* BOTTOM NAV — hidden during session */}
        {screen !== "session" && (
          <BottomNav screen={screen} onNavigate={setScreen} />
        )}
      </div>
    </RecordingsContext.Provider>
  );
}
