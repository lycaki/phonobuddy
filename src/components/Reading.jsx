import { useState, useContext, useEffect } from 'react';
import { STORIES, DIFFICULTIES, getStoriesByDifficulty, getStoryWordCount } from '../data/stories';
import { PHONEMES, WORDS, TRICKY_WORDS } from '../data/phonemes';
import { RecordingsContext } from '../context/RecordingsContext';
import { speak } from '../utils/speech';
import PhonoBuddyOwl from './PhonoBuddyOwl';
import { db } from '../utils/storage';

export default function Reading({ progress = {} }) {
  const [selectedStory, setSelectedStory] = useState(null);
  const [readingHistory, setReadingHistory] = useState({});

  // Load reading history on mount
  useEffect(() => {
    db.settings.get('readingHistory').then(row => {
      if (row?.value) setReadingHistory(row.value);
    });
  }, []);

  function markAsRead(storyId) {
    const updated = {
      ...readingHistory,
      [storyId]: {
        timesRead: (readingHistory[storyId]?.timesRead || 0) + 1,
        lastRead: new Date().toISOString(),
      },
    };
    setReadingHistory(updated);
    db.settings.put({ key: 'readingHistory', value: updated });
  }

  const knownIds = new Set(Object.entries(progress).filter(([, p]) => p.introduced).map(([id]) => id));
  const knownPhase = Math.max(2, ...Object.entries(progress)
    .filter(([, p]) => p.introduced)
    .map(([id]) => PHONEMES.find(p => p.id === id)?.phase || 2));

  function cleanWord(rawWord) {
    return rawWord.toLowerCase().replace(/[^a-z']/g, '');
  }

  function getWordReadiness(rawWord) {
    const clean = cleanWord(rawWord);
    if (!clean) return { clean, ready: true, type: "space" };
    const tricky = TRICKY_WORDS.find(tw => tw.word.toLowerCase() === clean);
    if (tricky) return { clean, ready: tricky.phase <= knownPhase, type: "tricky" };
    const entry = WORDS.find(w => w.word.toLowerCase() === clean);
    if (!entry) return { clean, ready: false, type: "unknown" };
    return { clean, ready: entry.phonemes.every(p => knownIds.has(p)), type: "decodable" };
  }

  function getStoryReadiness(story) {
    const words = story.sentences.flatMap(sentence => sentence.split(/\s+/).filter(Boolean));
    const statuses = words.map(getWordReadiness);
    const ready = statuses.filter(s => s.ready).length;
    const total = statuses.length || 1;
    return {
      ready,
      total,
      percent: Math.round((ready / total) * 100),
      needsHelp: statuses.filter(s => !s.ready).slice(0, 6).map(s => s.clean),
    };
  }

  if (selectedStory) {
    return (
      <StoryReader
        story={selectedStory}
        getWordReadiness={getWordReadiness}
        onClose={() => setSelectedStory(null)}
        onComplete={() => { markAsRead(selectedStory.id); setSelectedStory(null); }}
      />
    );
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <PhonoBuddyOwl size={60} mood="happy" />
        <div>
          <h2 style={{fontFamily:"'Fredoka'",fontSize:26,color:"#ffd966",margin:0}}>📚 Story Time</h2>
          <p style={{fontFamily:"'Andika'",fontSize:14,color:"#a0aec0",margin:0}}>Choose help or read-it-myself mode</p>
        </div>
      </div>

      {DIFFICULTIES.map(d => {
        const stories = getStoriesByDifficulty(d.id);
        return (
          <div key={d.id} style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:18}}>{d.emoji}</span>
              <h3 style={{fontFamily:"'Fredoka'",fontSize:18,color:d.color,margin:0}}>{d.label}</h3>
              <span style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0"}}>· {d.description}</span>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {stories.map(story => {
                const hist = readingHistory[story.id];
                const wordCount = getStoryWordCount(story);
                const readiness = getStoryReadiness(story);
                const isReady = readiness.percent >= 80;
                return (
                  <button key={story.id} onClick={() => setSelectedStory(story)} style={{
                    background:"#1a2744",border:`2px solid ${isReady ? "#7bc67e" : hist ? d.color : "#2a3a5c"}`,borderRadius:14,
                    padding:14,cursor:"pointer",textAlign:"left",position:"relative",
                  }}>
                    <div style={{fontSize:36,marginBottom:6}}>{story.emoji}</div>
                    <div style={{fontFamily:"'Fredoka'",fontSize:15,color:"#f0f0f0",lineHeight:1.2,marginBottom:4}}>
                      {story.title}
                    </div>
                    <div style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0",marginBottom:6}}>
                      {story.sentences.length} sentences · {wordCount} words
                    </div>
                    <div style={{fontFamily:"'Andika'",fontSize:10,color:isReady ? "#7bc67e" : "#ffd966",marginBottom:6}}>
                      {isReady ? "Ready to read" : `${readiness.percent}% ready · read with help`}
                    </div>
                    {hist && (
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <span style={{fontSize:10,color:d.color}}>⭐</span>
                        <span style={{fontFamily:"'Andika'",fontSize:10,color:d.color}}>
                          Read {hist.timesRead}×
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── STORY READER ───
function StoryReader({ story, getWordReadiness, onClose, onComplete }) {
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [readMode, setReadMode] = useState("help");
  const [showHelp, setShowHelp] = useState(true);
  const { playSound } = useContext(RecordingsContext);
  const sentence = story.sentences[sentenceIdx];
  const isLast = sentenceIdx === story.sentences.length - 1;
  const progress = ((sentenceIdx + 1) / story.sentences.length) * 100;

  // Split sentence into tappable words (preserve punctuation)
  const words = sentence.split(/(\s+)/).filter(s => s.trim());

  function tapWord(rawWord) {
    if (readMode === "myself" && !showHelp) return;
    // Strip punctuation for lookup
    const clean = rawWord.toLowerCase().replace(/[^a-z']/g, '');
    if (!clean) return;
    playSound(`word:${clean}`);
  }

  function readWholeSentence() {
    speak(sentence, 0.85);
  }

  function next() {
    if (isLast) {
      onComplete();
    } else {
      setSentenceIdx(i => i + 1);
      setShowHelp(readMode === "help");
    }
  }

  function back() {
    if (sentenceIdx > 0) {
      setSentenceIdx(i => i - 1);
      setShowHelp(readMode === "help");
    }
  }

  const difficulty = DIFFICULTIES.find(d => d.id === story.difficulty);

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:"#a0aec0",fontSize:14,cursor:"pointer",fontFamily:"'Andika'"}}>
          ← Stories
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>{story.emoji}</span>
          <span style={{fontFamily:"'Fredoka'",fontSize:14,color:"#f0f0f0"}}>{story.title}</span>
          <span style={{background:difficulty.color,color:"#0f1729",padding:"2px 8px",borderRadius:6,fontSize:10,fontFamily:"'Fredoka'"}}>
            {difficulty.label}
          </span>
        </div>
        <div style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0"}}>
          {sentenceIdx + 1}/{story.sentences.length}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{background:"#0f1729",borderRadius:6,height:6,marginBottom:24,overflow:"hidden"}}>
        <div style={{background:`linear-gradient(90deg, ${difficulty.color}, ${difficulty.color}aa)`,height:"100%",width:`${progress}%`,borderRadius:6,transition:"width 0.4s"}} />
      </div>

      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
        {[
          { id:"help", label:"Read with help" },
          { id:"myself", label:"Read myself" },
        ].map(mode => (
          <button key={mode.id} onClick={() => { setReadMode(mode.id); setShowHelp(mode.id === "help"); }} style={{
            background: readMode === mode.id ? "#4ecdc4" : "#1a2744",
            border:`2px solid ${readMode === mode.id ? "#4ecdc4" : "#2a3a5c"}`,
            borderRadius:12,
            padding:"8px 12px",
            fontFamily:"'Fredoka'",
            fontSize:13,
            color: readMode === mode.id ? "#0f1729" : "#a0aec0",
            cursor:"pointer",
          }}>
            {mode.label}
          </button>
        ))}
      </div>

      {/* Sentence display */}
      <div style={{background:"rgba(26,39,68,0.6)",borderRadius:24,padding:"40px 24px",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.05)",minHeight:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",lineHeight:1.6}}>
          {words.map((word, i) => (
            <span key={i}>
              {(() => {
                const readiness = getWordReadiness(word);
                const helpVisible = showHelp && !readiness.ready;
                return (
              <span
                onClick={() => tapWord(word)}
                style={{
                  fontFamily:"'Andika', sans-serif",
                  fontSize: 36,
                  color: helpVisible ? "#ffd966" : "white",
                  display:"inline-block",
                  padding:"4px 8px",
                  margin:"2px",
                  borderRadius:8,
                  cursor: readMode === "myself" && !showHelp ? "default" : "pointer",
                  transition:"all 0.15s",
                  background: helpVisible ? "rgba(255,217,102,0.12)" : "transparent",
                  borderBottom: helpVisible ? "3px solid #ffd966" : "3px solid transparent",
                }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(78,205,196,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background=helpVisible ? "rgba(255,217,102,0.12)" : "transparent"}
              >
                {word}
              </span>
                );
              })()}
            </span>
          ))}
        </div>
      </div>

      {/* Read whole sentence button */}
      <div style={{textAlign:"center",margin:"16px 0"}}>
        {(readMode === "help" || showHelp) ? (
          <>
            <button onClick={readWholeSentence} style={{background:"#1a2744",border:"2px solid #4ecdc4",borderRadius:50,width:60,height:60,fontSize:24,cursor:"pointer"}}>
              🔊
            </button>
            <p style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0",marginTop:6}}>Tap to hear the whole sentence</p>
          </>
        ) : (
          <button onClick={() => setShowHelp(true)} style={{background:"#1a2744",border:"2px solid #ffd966",borderRadius:14,padding:"10px 18px",fontSize:14,fontFamily:"'Fredoka'",color:"#ffd966",cursor:"pointer"}}>
            Need help?
          </button>
        )}
      </div>

      {/* Navigation */}
      <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:24}}>
        <button onClick={back} disabled={sentenceIdx === 0} style={{
          background: sentenceIdx === 0 ? "#1a2744" : "#2a3a5c",
          border:"none",borderRadius:14,padding:"14px 24px",fontSize:18,fontFamily:"'Fredoka'",
          color: sentenceIdx === 0 ? "#4a5578" : "#f0f0f0",
          cursor: sentenceIdx === 0 ? "not-allowed" : "pointer",
        }}>
          ← Back
        </button>
        <button onClick={next} style={{
          background: isLast ? "linear-gradient(135deg, #7bc67e, #5fa862)" : "#4ecdc4",
          border:"none",borderRadius:14,padding:"14px 32px",fontSize:18,fontFamily:"'Fredoka'",color:"#0f1729",cursor:"pointer",
        }}>
          {isLast ? "🎉 Done!" : "Next →"}
        </button>
      </div>
    </div>
  );
}
