import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ListRestart } from 'lucide-react';
import { RecordingsContext } from '../../context/RecordingsContext';
import {
  YEAR1_BLOCKS,
  YEAR1_GPC_BY_ID,
  YEAR1_PROFILE,
  YEAR1_PSEUDO_WORDS,
  getYear1Coverage,
} from '../../data/year1Profile';
import { chooseSessionItems, getBlockReadiness, requiredSessionSounds } from '../../utils/year1Session';

function VoxelDino({ walking = false }) {
  return (
    <div className={`voxel-dino ${walking ? 'is-walking' : ''}`} aria-label="blocky dinosaur">
      <div className="dino-tail" />
      <div className="dino-body" />
      <div className="dino-head"><span className="dino-eye" /></div>
      <div className="dino-leg dino-leg-one" />
      <div className="dino-leg dino-leg-two" />
    </div>
  );
}

function VoxelRover({ driving = false }) {
  return (
    <div className={`voxel-rover ${driving ? 'is-driving' : ''}`} aria-label="blocky rover">
      <div className="rover-cab" />
      <div className="rover-body" />
      <div className="rover-wheel rover-wheel-one" />
      <div className="rover-wheel rover-wheel-two" />
    </div>
  );
}

function FocusedWord({ item }) {
  const mapping = YEAR1_GPC_BY_ID[item.mappingId];
  if (!mapping) return <span>{item.word}</span>;

  const grapheme = mapping.grapheme.replace('-', '');
  const lowerWord = item.word.toLowerCase();

  if (mapping.split) {
    const first = lowerWord.indexOf(mapping.grapheme[0]);
    const last = lowerWord.lastIndexOf(mapping.grapheme.at(-1));
    return (
      <>
        {item.word.slice(0, first)}
        <mark>{item.word[first]}</mark>
        {item.word.slice(first + 1, last)}
        <mark>{item.word[last]}</mark>
        {item.word.slice(last + 1)}
      </>
    );
  }

  const start = lowerWord.indexOf(grapheme);
  if (start < 0) return <span>{item.word}</span>;
  return (
    <>
      {item.word.slice(0, start)}
      <mark>{item.word.slice(start, start + grapheme.length)}</mark>
      {item.word.slice(start + grapheme.length)}
    </>
  );
}

function RoadPiece({ itemPart, index, joined, next, onJoin }) {
  return (
    <button
      className={`sound-road-piece ${joined ? 'is-joined' : ''} ${next ? 'is-next' : ''}`}
      onClick={() => onJoin(index)}
      disabled={!next}
      aria-label={next ? `Touch ${itemPart.text} to add it to the sound road` : itemPart.text}
    >
      <span>{itemPart.text}</span>
      <small>{joined ? '✓' : next ? 'touch' : ''}</small>
    </button>
  );
}

export default function Year1Adventure({ year1, onExit, onOpenSettings, onReadStories }) {
  const { autoProgress, attempts, setSelectedBlock } = year1;
  const recordings = useContext(RecordingsContext);
  const [stage, setStage] = useState('map');
  const [items, setItems] = useState([]);
  const [round, setRound] = useState(0);
  const [joinedCount, setJoinedCount] = useState(0);
  const [transformed, setTransformed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [retries, setRetries] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const busyRef = useRef(false);
  const generation = useRef(0);
  const advanceTimer = useRef(null);
  const audioController = useRef(null);
  const starting = useRef(false);
  const autoHandled = useRef(false);
  const [sessionBlockId, setSessionBlockId] = useState(0);
  const [sessionKey, setSessionKey] = useState(0);
  const [autoNotice, setAutoNotice] = useState('');
  const readyAt = useRef(null);
  const firstInteractionAt = useRef(null);

  const block = YEAR1_BLOCKS.find(entry => entry.id === year1.selectedBlock) || YEAR1_BLOCKS[0];
  const item = items[round];
  const coverage = useMemo(
    () => getYear1Coverage(recordings.recordingIds),
    [recordings.recordingIds],
  );
  const nextItems = useMemo(() => chooseSessionItems(block.id, year1.batchOffsets[block.id] || 0, year1.pseudoApproved),
    [block.id, year1.batchOffsets, year1.pseudoApproved]);
  const missing = requiredSessionSounds(nextItems).filter(id =>
    !['schwa', 'th_voiced'].includes(id) && !recordings.recordingIds.has(id));
  const voiceReady = missing.length === 0;
  const voiceLoading = recordings.syncStatus === 'downloading';
  const readiness = getBlockReadiness(block.id, year1.attempts);

  useEffect(() => () => {
    generation.current += 1;
    clearTimeout(advanceTimer.current);
    audioController.current?.abort();
  }, []);

  useEffect(() => {
    if (stage !== 'complete' || autoHandled.current) return;
    autoHandled.current = true;
    if (autoProgress && sessionBlockId < YEAR1_BLOCKS.at(-1).id && getBlockReadiness(sessionBlockId, attempts).ready) {
      setSelectedBlock(sessionBlockId + 1);
      setAutoNotice(`Next section ready: ${YEAR1_BLOCKS[sessionBlockId + 1].label}`);
    }
  }, [stage, sessionBlockId, autoProgress, attempts, setSelectedBlock]);

  useEffect(() => {
    if (stage !== 'mission' || !item) return;
    readyAt.current = Date.now();
    firstInteractionAt.current = null;
    setJoinedCount(0);
    setTransformed(item.mission !== 'transform');
    setCelebrating(false);
    setRetries(0);
    setBusy(false);
    busyRef.current = false;
    setNotice('');
    return () => {
      generation.current += 1;
      clearTimeout(advanceTimer.current);
      audioController.current?.abort();
    };
  }, [stage, round, item, sessionKey]);

  function stopSession() {
    generation.current += 1;
    clearTimeout(advanceTimer.current);
    audioController.current?.abort();
    setStage('map');
  }

  async function startSession() {
    if (starting.current) return;
    if (!voiceReady) { stopSession(); return; }
    starting.current = true;
    generation.current += 1;
    clearTimeout(advanceTimer.current);
    audioController.current?.abort();
    busyRef.current = true;
    setBusy(true);
    const token = generation.current;
    try {
      const next = await year1.takeNextBatch();
      if (generation.current !== token) return;
      setItems(next);
      setRound(0);
      setSessionCorrect(0);
      setSessionBlockId(block.id);
      setSessionKey(key => key + 1);
      autoHandled.current = false;
      setAutoNotice('');
      setStage('mission');
    } catch {
      setStage('map');
      setNotice('The next batch could not be saved. Try again without clearing website data.');
    } finally {
      starting.current = false;
    }
  }

  function selectBlock(value) {
    stopSession();
    year1.setSelectedBlock(value);
  }

  const parentNavigation = <nav className="practice-controls" aria-label="Parent practice controls">
    <label htmlFor="year1-block">Practice point</label>
    <select id="year1-block" value={block.id} onChange={event => selectBlock(event.target.value)}>
      {YEAR1_BLOCKS.map(entry => <option key={entry.id} value={entry.id}>{entry.id + 1}. {entry.term}: {entry.label}</option>)}
    </select>
    <div className="practice-navigation">
      <button onClick={() => selectBlock(block.id - 1)} disabled={block.id === 0} title="Previous section" aria-label="Previous section"><ArrowLeft size={20} /></button>
      <button onClick={startSession}><ListRestart size={20} /> Next batch</button>
      <button onClick={() => selectBlock(block.id + 1)} disabled={block.id === YEAR1_BLOCKS.at(-1).id}>Next section <ArrowRight size={20} /></button>
    </div>
    <label className="auto-progression"><input type="checkbox" checked={year1.autoProgress} onChange={event => year1.setAutoProgress(event.target.checked)} /> Auto next section</label>
    <small>{readiness.secure} of {readiness.total} section words read correctly twice without a retry. Auto progression checks at the end of a road.</small>
  </nav>;

  function noteFirstInteraction() {
    if (!firstInteractionAt.current) firstInteractionAt.current = Date.now();
  }

  function activateTransformation() {
    noteFirstInteraction();
    setTransformed(true);
  }

  async function joinPiece(index) {
    if (!item || busyRef.current || celebrating || index !== joinedCount || !transformed) return;
    busyRef.current = true;
    setBusy(true);
    const token = generation.current;
    audioController.current = new AbortController();
    noteFirstInteraction();
    const itemPart = item.parts[index];
    try {
      for (const soundId of itemPart.soundIds || []) {
        const played = await recordings.playSound(soundId, {
          allowTts: false, waitForEnd: true, signal: audioController.current.signal,
        });
        if (generation.current !== token) return;
        if (!played) setNotice('This clip could not play. Dad can say the sound, or skip this word.');
      }
    } catch {
      if (generation.current === token) setNotice('Sound unavailable. Dad can say it, or skip this word.');
    } finally {
      if (generation.current === token) {
        setJoinedCount(index + 1);
        busyRef.current = false;
        setBusy(false);
      }
    }
  }

  function nextMission() {
    generation.current += 1;
    clearTimeout(advanceTimer.current);
    audioController.current?.abort();
    if (round + 1 >= items.length) setStage('complete');
    else setRound(round + 1);
  }

  async function judge(correct) {
    if (!item || busyRef.current || celebrating || joinedCount !== item.parts.length) return;
    busyRef.current = true;
    setBusy(true);
    setNotice('');
    const token = generation.current;
    try {
      await year1.recordAttempt({
      itemId: item.id,
      itemType: item.pseudo ? 'pseudo' : 'real',
      mode: item.mission === 'transform' ? 'split-digraph-transform' : 'sound-road',
      correct,
      retries,
      presentationReadyAt: readyAt.current,
      firstInteractionAt: firstInteractionAt.current,
      });
    } catch {
      if (generation.current === token) {
        setNotice('This answer could not be saved on this device. Try Yes again, or stop. Do not clear website data.');
        busyRef.current = false;
        setBusy(false);
      }
      return;
    }
    if (generation.current !== token) return;

    if (!correct) {
      setRetries(count => count + 1);
      setJoinedCount(0);
      firstInteractionAt.current = null;
      readyAt.current = Date.now();
      busyRef.current = false;
      setBusy(false);
      return;
    }

    setSessionCorrect(count => count + 1);
    setCelebrating(true);
    if (!item.pseudo) {
      audioController.current = new AbortController();
      recordings.playSound(`word:${item.word}`, {
        allowTts: false, waitForEnd: true, signal: audioController.current.signal,
      }).catch(() => {});
    }

    advanceTimer.current = window.setTimeout(() => {
      if (generation.current === token) nextMission();
    }, 1250);
  }

  if (stage === 'map') {
    return (
      <div className="year1-adventure">
        <header className="adventure-topbar">
          <button className="quiet-button" onClick={onExit}>← Home</button>
          <span className="profile-chip">Year 1 · {block.id === 0 ? 'Sound review' : 'Phase 5'}</span>
        </header>

        <section className="adventure-map-card">
          <div className="adventure-sky">
            <div className="pixel-cloud cloud-one" />
            <div className="pixel-cloud cloud-two" />
            <VoxelDino walking />
          </div>
          <div className="map-copy">
            <p className="eyebrow">DINO ROAD BUILDERS</p>
            <h1>Build the sounds.<br />Drive the word.</h1>
            <p className="child-instruction">Join each blue sound block, then read the finished word to Dad.</p>
            {!voiceReady && (
              <div className={`voice-bank-status ${voiceLoading ? 'is-loading' : ''}`}>
                <strong>{voiceLoading ? 'Loading Dad’s voice…' : 'Dad’s voice is not connected'}</strong>
                <span>
                  {voiceLoading
                    ? 'The road will open when the sound bank is ready.'
                    : `Missing sounds for this road: ${missing.join(', ')}. Connect the family recordings.`}
                </span>
                {!voiceLoading && <button type="button" onClick={onOpenSettings}>Open Settings</button>}
              </div>
            )}
            {voiceReady && (
              <div className="voice-bank-ready">Dad’s recorded sounds are ready ✓</div>
            )}
            <button className="adventure-start" onClick={startSession} disabled={!voiceReady}>
              {!voiceReady && voiceLoading ? 'Loading sounds…' : 'Build today’s road'} <span>{voiceReady ? '▶' : '🔒'}</span>
            </button>
            <button className="quiet-button" onClick={onReadStories}>Read a story</button>
            <div className="map-stats">
              <span><strong>{year1.stats.completedItems}</strong> words built</span>
              <span><strong>{year1.stats.total ? year1.stats.accuracy : '—'}</strong>{year1.stats.total ? '%' : ''} accuracy</span>
              <span><strong>6</strong> quick missions</span>
            </div>
          </div>
        </section>

        <section className="current-zone">
          <div>
            <span className="zone-label">{block.term}</span>
            <h2>{block.label}</h2>
            <p>{block.detail}</p>
          </div>
          <div className="zone-code">{block.shortLabel}</div>
        </section>

        {notice && <p className="mission-notice" role="status">{notice}</p>}
        {parentNavigation}

        <details className="parent-drawer">
          <summary>Parent controls & profile</summary>
          <div className="parent-drawer-content">
            <p>
              <strong>{YEAR1_PROFILE.label}</strong> · {YEAR1_PROFILE.status}. Confirm the school’s current
              programme and point in September, then update this profile rather than changing the game.
            </p>
            <div className="coverage-grid">
              <span><strong>{coverage.reusableSounds.length}</strong> reusable sound clips</span>
              <span><strong>{coverage.recordedWords.length}</strong> Year 1 words recorded</span>
              <span><strong>{coverage.missingSounds.length}</strong> missing sound clips</span>
              <span><strong>{coverage.questionableSounds.length}</strong> contextual clips to review</span>
              <span><strong>{coverage.dadModelWords.length}</strong> words for Dad to model</span>
            </div>
            <div className="pseudo-approval">
              <h3>Pseudo-word review</h3>
              <p>
                These are disabled until you have checked them. They are shown only with a creature:
              </p>
              <div className="pseudo-chip-list">
                {YEAR1_PSEUDO_WORDS.map(pseudo => <span key={pseudo.id}>{pseudo.word}</span>)}
              </div>
              <button
                type="button"
                className={year1.pseudoApproved ? 'pseudo-approved' : ''}
                onClick={() => year1.setPseudoApproved(!year1.pseudoApproved)}
              >
                {year1.pseudoApproved ? 'Approved for this family ✓' : 'I have reviewed these words'}
              </button>
            </div>
          </div>
        </details>
      </div>
    );
  }

  if (stage === 'complete') {
    return (
      <div className="year1-adventure adventure-finish">
        <div className="finish-sun">★</div>
        <VoxelDino walking />
        <h1>Road complete!</h1>
        <p>You built {sessionCorrect} of {items.length} words.</p>
        {autoNotice && <p role="status">{autoNotice}</p>}
        <button className="adventure-start" onClick={startSession} disabled={!voiceReady}>Build another road</button>
        <button className="quiet-button" onClick={onReadStories}>Read a story</button>
        <button className="adventure-start" onClick={() => setStage('map')}>Back to the map</button>
        {parentNavigation}
      </div>
    );
  }

  const roadReady = item && joinedCount === item.parts.length;
  const progressPercent = items.length ? ((round + (celebrating ? 1 : 0)) / items.length) * 100 : 0;

  return (
    <div className="year1-adventure mission-screen">
      <header className="adventure-topbar">
        <button className="quiet-button" onClick={stopSession}>← Stop</button>
        <div className="mission-progress" aria-label={`Mission ${round + 1} of ${items.length}`}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="mission-count">{round + 1}/{items.length}</span>
      </header>

      <section className={`mission-world ${celebrating ? 'is-celebrating' : ''}`}>
        <div className="world-hills" />
        {item?.pseudo ? <VoxelDino walking={celebrating} /> : <VoxelRover driving={celebrating} />}
        <div className="road-line" />
      </section>

      <main className="mission-card">
        {item?.pseudo && <div className="creature-warning">Creature name · this is a made-up word</div>}

        {item?.mission === 'transform' && !transformed ? (
          <div className="transform-mission">
            <p className="mission-prompt">Wake up magic e</p>
            <div className="base-word">{item.baseWord}</div>
            <button className="magic-e-block" onClick={activateTransformation}>
              <span>e</span>
              <small>touch me</small>
            </button>
            <p className="transform-hint">It jumps over one letter and changes the vowel sound.</p>
          </div>
        ) : (
          <>
            {item?.mission === 'transform' && (
              <div className="transform-result"><span>{item.baseWord}</span><b> + magic e → </b><strong>{item.word}</strong></div>
            )}
            <p className="mission-prompt">{roadReady ? 'Now read the whole word to Dad' : 'Touch the next blue block'}</p>
            <div className="mission-word"><FocusedWord item={item} /></div>

            <div className="sound-road" aria-label="Sound road">
              {item?.parts.map((itemPart, index) => (
                <RoadPiece
                  key={`${item.id}-${index}`}
                  itemPart={itemPart}
                  index={index}
                  joined={index < joinedCount}
                  next={index === joinedCount && !busy && !celebrating}
                  onJoin={joinPiece}
                />
              ))}
            </div>

            {roadReady && !celebrating && (
              <div className="dad-judge">
                <p>Dad: did Logan read it?</p>
                <div>
                  <button className="try-again-button" disabled={busy} onClick={() => judge(false)}>Try again</button>
                  <button className="correct-button" disabled={busy} onClick={() => judge(true)}>{busy ? 'Saving on this device...' : 'Yes ✓'}</button>
                </div>
              </div>
            )}

            {celebrating && (
              <div className="word-powered">
                <span>{item.pseudo ? 'Dino rescued!' : 'Rover powered!'}</span>
                <b>{item.word}</b>
                <button className="quiet-button" onClick={nextMission}>Next word →</button>
              </div>
            )}
          </>
        )}
      </main>
      {notice && <p className="mission-notice" role="status">{notice}</p>}
      {!celebrating && <button className="quiet-button" onClick={nextMission}>Skip word →</button>}
      {parentNavigation}
    </div>
  );
}
