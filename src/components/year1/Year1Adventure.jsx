import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RecordingsContext } from '../../context/RecordingsContext';
import {
  YEAR1_BLOCKS,
  YEAR1_GPC_BY_ID,
  YEAR1_PROFILE,
  YEAR1_PSEUDO_WORDS,
  YEAR1_WORDS,
  getYear1Coverage,
} from '../../data/year1Profile';

const SESSION_LENGTH = 6;

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

function chooseSessionItems(blockId, completedCount, pseudoApproved) {
  const current = YEAR1_WORDS.filter(item => item.block === blockId);
  const review = YEAR1_WORDS.filter(item => item.block < blockId).slice(-8);
  const pool = current.length ? [...current, ...review] : YEAR1_WORDS.filter(item => item.block === 0);
  const offset = pool.length ? completedCount % pool.length : 0;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  const chosen = [];

  for (let index = 0; chosen.length < SESSION_LENGTH && rotated.length; index += 1) {
    chosen.push(rotated[index % rotated.length]);
  }

  if (pseudoApproved && blockId >= 2) {
    const availablePseudo = YEAR1_PSEUDO_WORDS.filter(item => item.block <= blockId);
    if (availablePseudo.length) {
      chosen[SESSION_LENGTH - 1] = availablePseudo[completedCount % availablePseudo.length];
    }
  }
  return chosen;
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

export default function Year1Adventure({ year1, onExit }) {
  const recordings = useContext(RecordingsContext);
  const [stage, setStage] = useState('map');
  const [items, setItems] = useState([]);
  const [round, setRound] = useState(0);
  const [joinedCount, setJoinedCount] = useState(0);
  const [transformed, setTransformed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [retries, setRetries] = useState(0);
  const readyAt = useRef(null);
  const firstInteractionAt = useRef(null);

  const block = YEAR1_BLOCKS.find(entry => entry.id === year1.selectedBlock) || YEAR1_BLOCKS[0];
  const item = items[round];
  const coverage = useMemo(
    () => getYear1Coverage(recordings.recordingIds),
    [recordings.recordingIds],
  );

  useEffect(() => {
    if (stage !== 'mission' || !item) return;
    readyAt.current = Date.now();
    firstInteractionAt.current = null;
    setJoinedCount(0);
    setTransformed(item.mission !== 'transform');
    setCelebrating(false);
    setRetries(0);
  }, [stage, round, item]);

  function startSession() {
    setItems(chooseSessionItems(year1.selectedBlock, year1.stats.completedItems, year1.pseudoApproved));
    setRound(0);
    setSessionCorrect(0);
    setStage('mission');
  }

  function noteFirstInteraction() {
    if (!firstInteractionAt.current) firstInteractionAt.current = Date.now();
  }

  function activateTransformation() {
    noteFirstInteraction();
    setTransformed(true);
  }

  async function joinPiece(index) {
    if (!item || index !== joinedCount || !transformed) return;
    noteFirstInteraction();
    const itemPart = item.parts[index];
    for (const soundId of itemPart.soundIds || []) {
      await recordings.playSound(soundId);
    }
    setJoinedCount(count => count + 1);
  }

  async function judge(correct) {
    if (!item) return;
    await year1.recordAttempt({
      itemId: item.id,
      itemType: item.pseudo ? 'pseudo' : 'real',
      mode: item.mission === 'transform' ? 'split-digraph-transform' : 'sound-road',
      correct,
      retries,
      presentationReadyAt: readyAt.current,
      firstInteractionAt: firstInteractionAt.current,
    });

    if (!correct) {
      setRetries(count => count + 1);
      setJoinedCount(0);
      firstInteractionAt.current = null;
      readyAt.current = Date.now();
      return;
    }

    setSessionCorrect(count => count + 1);
    setCelebrating(true);
    if (!item.pseudo) recordings.playSound(`word:${item.word}`);

    window.setTimeout(() => {
      if (round + 1 >= items.length) {
        setStage('complete');
      } else {
        setRound(index => index + 1);
      }
    }, 1250);
  }

  if (stage === 'map') {
    return (
      <div className="year1-adventure">
        <header className="adventure-topbar">
          <button className="quiet-button" onClick={onExit}>← Home</button>
          <span className="profile-chip">Year 1 · Phase 5</span>
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
            <button className="adventure-start" onClick={startSession}>
              Build today’s road <span>▶</span>
            </button>
            <div className="map-stats">
              <span><strong>{year1.stats.completedItems}</strong> words built</span>
              <span><strong>{year1.stats.accuracy || '—'}</strong>{year1.stats.total ? '%' : ''} accuracy</span>
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

        <details className="parent-drawer">
          <summary>Parent controls & profile</summary>
          <div className="parent-drawer-content">
            <label htmlFor="year1-block">Practice point</label>
            <select
              id="year1-block"
              value={year1.selectedBlock}
              onChange={event => year1.setSelectedBlock(event.target.value)}
            >
              {YEAR1_BLOCKS.map(entry => (
                <option key={entry.id} value={entry.id}>{entry.term}: {entry.label}</option>
              ))}
            </select>
            <p>
              <strong>{YEAR1_PROFILE.label}</strong> · {YEAR1_PROFILE.status}. Confirm the school’s current
              programme and point in September, then update this profile rather than changing the game.
            </p>
            <div className="coverage-grid">
              <span><strong>{coverage.reusableSounds.length}</strong> reusable sound clips</span>
              <span><strong>{coverage.recordedWords.length}</strong> Year 1 words recorded</span>
              <span><strong>{coverage.missingSounds.length}</strong> sound fallbacks</span>
              <span><strong>{coverage.questionableSounds.length}</strong> contextual clips to review</span>
              <span><strong>{coverage.dadModelWords.length}</strong> Dad/TTS word fallbacks</span>
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
        <button className="adventure-start" onClick={() => setStage('map')}>Back to the map</button>
      </div>
    );
  }

  const roadReady = item && joinedCount === item.parts.length;
  const progressPercent = items.length ? ((round + (celebrating ? 1 : 0)) / items.length) * 100 : 0;

  return (
    <div className="year1-adventure mission-screen">
      <header className="adventure-topbar">
        <button className="quiet-button" onClick={() => setStage('map')}>← Stop</button>
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
                  next={index === joinedCount}
                  onJoin={joinPiece}
                />
              ))}
            </div>

            {roadReady && !celebrating && (
              <div className="dad-judge">
                <p>Dad: did Logan read it?</p>
                <div>
                  <button className="try-again-button" onClick={() => judge(false)}>Try again</button>
                  <button className="correct-button" onClick={() => judge(true)}>Yes ✓</button>
                </div>
              </div>
            )}

            {celebrating && (
              <div className="word-powered">
                <span>{item.pseudo ? 'Dino rescued!' : 'Rover powered!'}</span>
                <b>{item.word}</b>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
