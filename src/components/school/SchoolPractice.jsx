import { useContext, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronsRight, Eye, EyeOff, Pencil, Printer, RotateCcw, SkipForward, Volume2 } from 'lucide-react';
import { RecordingsContext } from '../../context/RecordingsContext';
import { SCHOOL_WORD_LISTS, SCHOOL_SPOKEN_WORDS, schoolWordId, selectSchoolBatch } from '../../data/schoolWords';
import { loadSchoolWordChecks, saveSchoolWordCheck } from '../../utils/schoolReading';
import { db, getSetting, setSetting } from '../../utils/storage';
import { DinoArt, WordPicture } from '../art/ReadingArt';
import './SchoolReading.css';

export default function SchoolPractice() {
  const [listId, setListId] = useState('r1');
  const [mode, setMode] = useState('read');
  const [checks, setChecks] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [batch, setBatch] = useState(null);
  const [offsets, setOffsets] = useState({});
  const [pending, setPending] = useState(false);
  const [auto, setAuto] = useState(true);
  const lock = useRef(false);
  const list = SCHOOL_WORD_LISTS.find(list => list.id === listId);
  const words = list.words.filter(word => word.toLowerCase().includes(search.toLowerCase().trim()) && (filter === 'all' || !checks[schoolWordId(word)]?.[mode]));

  async function load() {
    setError('');
    try {
      const [checks, savedOffsets, savedAuto] = await Promise.all([loadSchoolWordChecks(), getSetting('schoolBatchOffsets', {}), getSetting('schoolAutoNext', true)]);
      setChecks(checks); setOffsets(savedOffsets || {}); setAuto(savedAuto !== false); setLoaded(true);
    }
    catch { setError('Your word ticks could not be opened. Try again without clearing website data.'); }
  }
  useEffect(() => { load(); }, []);

  async function mark(word, skill, checked) {
    if (lock.current) return false;
    lock.current = true;
    const id = schoolWordId(word);
    const previous = checks[id];
    setChecks(values => ({...values, [id]:{...values[id], [skill]:checked}}));
    setPending(true);
    setError('');
    try {
      const value = await saveSchoolWordCheck(word, skill, checked);
      setChecks(previous => ({...previous, [schoolWordId(word)]:value}));
      return true;
    } catch {
      setChecks(values => ({...values, [id]:previous}));
      setError('That tick could not be saved. Please try again. Existing progress is kept.'); return false;
    }
    finally { lock.current = false; setPending(false); }
  }

  async function startBatch(startWord) {
    if (lock.current || !words.length) return;
    lock.current = true; setPending(true); setError('');
    const key = `${listId}:${mode}:${filter}:${search}`;
    const offset = startWord ? words.indexOf(startWord) : Number.isInteger(offsets[key]) ? offsets[key] : 0;
    const next = selectSchoolBatch(words, offset);
    try {
      const value = await db.transaction('rw', db.settings, async () => {
        const previous = (await db.settings.get('schoolBatchOffsets'))?.value || {};
        const value = {...previous, [key]:offset + next.length};
        await db.settings.put({key:'schoolBatchOffsets', value});
        return value;
      });
      setOffsets(value); setBatch({id:crypto.randomUUID(), words:next});
    } catch { setError('The batch position could not be saved. Please try again. Existing progress is kept.'); }
    finally { lock.current = false; setPending(false); }
  }

  async function changeAuto(value) {
    if (lock.current) return;
    lock.current = true; setPending(true); setAuto(value); setError('');
    try { await setSetting('schoolAutoNext', value); }
    catch { setAuto(!value); setError('The automatic-next choice could not be saved. Please try again.'); }
    finally { lock.current = false; setPending(false); }
  }

  return <section className="school-paper">
    <header className="school-heading"><div><p>SCHOOL READING RECORD</p><h1>Read and spell</h1></div><DinoArt /></header>
    {!batch && <>
      <label htmlFor="school-list">School word list</label>
      <select id="school-list" value={listId} onChange={event => {setListId(event.target.value); setSearch('');}}>{SCHOOL_WORD_LISTS.map(list => <option key={list.id} value={list.id}>{list.label} ({list.words.length} words)</option>)}</select>
      {listId !== 'r1' && <p className="school-note">Optional later-year practice. This does not change the Year 1 sound-road level.</p>}
      <div className="school-modes" role="group" aria-label="Practice skill"><button aria-pressed={mode === 'read'} onClick={() => setMode('read')}><BookOpen size={19} />Read</button><button aria-pressed={mode === 'spell'} onClick={() => setMode('spell')}><Pencil size={19} />Spell</button></div>
      <div className="school-filters"><div><label htmlFor="school-search">Find a word</label><input id="school-search" type="search" value={search} onChange={event => setSearch(event.target.value)} /></div><div><label htmlFor="school-filter">Show</label><select id="school-filter" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All words</option><option value="practice">Still practising {mode === 'read' ? 'reading' : 'spelling'}</option></select></div></div>
      <p className="school-tally">{list.words.filter(word => checks[schoolWordId(word)]?.read).length}/{list.words.length} read · {list.words.filter(word => checks[schoolWordId(word)]?.spell).length}/{list.words.length} spelled</p>
      <div className="school-actions"><button className="school-primary" disabled={!loaded || pending || !words.length} onClick={() => startBatch()}><ArrowRight size={20} />Practise {Math.min(5, words.length)} {words.length === 1 ? 'word' : 'words'}</button><button aria-label="Print word checklist" title="Print word checklist" onClick={() => window.print()}><Printer size={20} /></button></div>
    </>}
    {error && <p role="alert">{error}{!loaded && <button onClick={load}>Try again</button>}</p>}
    {!loaded && !error && <p role="status">Opening your word ticks...</p>}
    {batch ? <PracticeBatch key={batch.id} words={batch.words} mode={mode} mark={mark} pending={pending}
      auto={auto} onAutoChange={changeAuto} onClose={() => setBatch(null)} onNext={() => startBatch()} hasNext={words.length > 0} /> : <>
      <table className="school-checklist"><caption>{list.label}: harder to read and spell words</caption><thead><tr><th scope="col">Word</th><th scope="col">Read</th><th scope="col">Spell</th></tr></thead><tbody>{words.map(word => <tr key={word}>
        <th scope="row"><button className="school-word-link" disabled={!loaded || pending} onClick={() => startBatch(word)}>{word}</button></th>
        {['read', 'spell'].map(skill => <td key={skill}><input type="checkbox" aria-label={`${skill === 'read' ? 'Can read' : 'Can spell'} ${word}`} disabled={!loaded || pending} checked={Boolean(checks[schoolWordId(word)]?.[skill])} onChange={event => mark(word, skill, event.target.checked)} /></td>)}
      </tr>)}</tbody></table>
      {loaded && !words.length && <p>No words match this selection.</p>}
      <details className="school-guidance"><summary>For the grown-up</summary><p>Read the word, talk about its meaning and use it in a sentence. For spelling, look at the word, cover it, write it and check together. A tick is your judgement, not an automatic assessment. Clear a tick whenever it needs more practice.</p><p>The lists match the school sheets supplied on 11 September 2026. Year R/1 is the starting list; later years are optional. Word ticks are saved on this browser only and included in the Settings progress backup. Your sound-road progress is separate.</p></details>
    </>}
  </section>;
}

function PracticeBatch({words, mode, mark, pending, auto, onAutoChange, onClose, onNext, hasNext}) {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState('look');
  const [answer, setAnswer] = useState('');
  const [notice, setNotice] = useState('');
  const [done, setDone] = useState(false);
  const [pictureWord, setPictureWord] = useState('');
  const audio = useRef(null);
  const lock = useRef(false);
  const {playSound} = useContext(RecordingsContext);
  const word = words[index];
  useEffect(() => () => audio.current?.abort(), []);

  function move(next) {
    audio.current?.abort();
    setNotice(''); setAnswer(''); setStage('look');
    setPictureWord('');
    if (next >= words.length) setDone(true);
    else { setIndex(Math.max(0, next)); setDone(false); }
  }
  async function hear() {
    audio.current?.abort();
    const controller = new AbortController();
    audio.current = controller;
    setNotice('');
    setPictureWord('');
    try {
      const played = await playSound(`word:${word}`, {waitForEnd:true, signal:controller.signal, speechText:SCHOOL_SPOKEN_WORDS[word] || word,
        onStart: () => { if (!controller.signal.aborted && (mode === 'read' || stage === 'check')) setPictureWord(word); }});
      if (!played && !controller.signal.aborted) setNotice('Your grown-up can say this word.');
    } catch { if (!controller.signal.aborted) setNotice('Your grown-up can say this word.'); }
  }
  async function verdict(checked) {
    if (lock.current) return;
    lock.current = true;
    try { if (await mark(word, mode, checked)) { if (auto) move(index + 1); else setNotice('Saved.'); } }
    finally { lock.current = false; }
  }
  function nextBatch() { audio.current?.abort(); onNext(); }
  return <div className="school-exercise">
    <div className="school-exercise-bar"><button aria-label="Back to checklist" title="Back to checklist" disabled={pending} onClick={onClose}><ArrowLeft /></button><span>{done ? 'Batch complete' : `${index + 1} / ${words.length}`}</span><span>{mode === 'read' ? 'Reading' : 'Spelling'}</span>{!done && <button disabled={pending} title="Skip word" aria-label="Skip word" onClick={() => move(index + 1)}><SkipForward size={20} /></button>}</div>
    {done ? <div className="school-batch-done"><Check size={40} /><h2>Batch complete</h2><div className="school-actions"><button className="school-primary" disabled={!hasNext || pending} onClick={onNext}><ArrowRight size={20} />Next batch</button><button disabled={pending} onClick={() => move(0)}><RotateCcw size={20} />Repeat batch</button><button disabled={pending} onClick={onClose}>Checklist</button></div></div> : <>
      {mode === 'spell' && <ol className="spelling-stages" aria-label="Spelling steps">{['Look', 'Cover', 'Write', 'Check'].map(label => <li key={label} aria-current={(stage === 'look' && label === 'Look') || (stage === 'write' && label === 'Write') || (stage === 'check' && label === 'Check') ? 'step' : undefined}>{label}</li>)}</ol>}
      <div className="school-big-word" aria-label={mode === 'spell' && stage === 'write' ? 'Word covered' : 'Practice word'}>{mode === 'spell' && stage === 'write' ? <EyeOff size={44} aria-hidden="true" /> : word}</div>
      {pictureWord === word && !(mode === 'spell' && stage === 'write') && <WordPicture word={word} onHear={hear} />}
      <div className="school-actions"><button onClick={hear}><Volume2 size={20} />Hear word</button>{mode === 'spell' && stage === 'look' && <button className="school-primary" onClick={() => setStage('write')}><EyeOff size={20} />Cover word</button>}</div>
      {mode === 'spell' && stage === 'write' && <form onSubmit={event => {event.preventDefault(); setStage('check');}}>
        <label htmlFor="spelling-answer">Your spelling</label><input id="spelling-answer" value={answer} onChange={event => setAnswer(event.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} maxLength={40} />
        <div className="school-actions"><button type="submit"><Eye size={20} />Check word</button></div>
      </form>}
      {mode === 'spell' && stage === 'check' && <p>{answer.trim() ? answer.trim() === word ? 'The spelling matches. Check any capital letters together.' : `You wrote: ${answer}. Compare it with the word above.` : 'Check the spelling you wrote on paper together.'}</p>}
      <p className="school-notice" role="status">{notice}</p>
      {(mode === 'read' || stage === 'check') && <fieldset className="school-verdict"><legend>Grown-up check</legend><button className="school-primary" disabled={pending} onClick={() => verdict(true)}><Check size={20} />{mode === 'read' ? 'Read it' : 'Spelled it'}</button><button disabled={pending} onClick={() => verdict(false)}><RotateCcw size={20} />Needs practice</button></fieldset>}
      <label className="school-toggle"><input type="checkbox" checked={auto} disabled={pending} onChange={event => onAutoChange(event.target.checked)} />Next word automatically</label>
      <nav className="school-actions" aria-label="Word navigation"><button disabled={index === 0 || pending} aria-label="Previous word" title="Previous word" onClick={() => move(index - 1)}><ArrowLeft size={20} /></button><button disabled={pending} aria-label="Next word" title="Next word" onClick={() => move(index + 1)}><ArrowRight size={20} /></button><button disabled={pending || !hasNext} onClick={nextBatch}><ChevronsRight size={20} />Next batch</button></nav>
    </>}
  </div>;
}
