import { useContext, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Printer, RotateCcw } from 'lucide-react';
import { YEAR1_BLOCKS } from '../../data/year1Profile';
import { YEAR1_STORIES, getStorySupportWords, storyWords } from '../../data/year1Stories';
import { db } from '../../utils/storage';
import { RecordingsContext } from '../../context/RecordingsContext';
import Reading from '../Reading';
import PhonoBuddyOwl from '../PhonoBuddyOwl';
import './Year1Reading.css';

const bookmarkKey = id => `year1Story:${id}`;

export default function Year1Reading({ year1, progress }) {
  const [legacy, setLegacy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    db.settings.bulkGet(YEAR1_STORIES.map(story => bookmarkKey(story.id))).then(rows => {
      setHistory(Object.fromEntries(rows.filter(Boolean).map(row => [row.key.slice(11), row.value])));
    }).catch(() => setError('Reading places could not be opened. Reload without clearing website data.'))
      .finally(() => setLoaded(true));
  }, []);

  if (legacy) return <><button className="reading-return" onClick={() => setLegacy(false)}><ArrowLeft size={20} /> Year 1 stories</button><Reading progress={progress} /></>;
  if (selected) return <StoryReader key={selected.id} story={selected} initial={history[selected.id]}
    onClose={() => setSelected(null)} onSaved={value => setHistory(previous => ({ ...previous, [selected.id]: value }))}
    onNext={() => {
      const section = YEAR1_STORIES.filter(story => story.block === selected.block);
      setSelected(section[(section.indexOf(selected) + 1) % section.length]);
    }} />;

  const block = YEAR1_BLOCKS.find(entry => entry.id === year1.selectedBlock) || YEAR1_BLOCKS[0];
  return (
    <div className="year1-reading">
      <header className="reading-heading"><div><p>YEAR 1</p><h1>Story shelf</h1></div><PhonoBuddyOwl size={72} mood="happy" /></header>
      <label className="section-choice" htmlFor="story-section">Reading section</label>
      <select id="story-section" value={block.id} onChange={event => year1.setSelectedBlock(event.target.value)}>
        {YEAR1_BLOCKS.map(entry => <option key={entry.id} value={entry.id}>{entry.term}: {entry.label}</option>)}
      </select>
      <div className="reading-section-title"><h2>{block.label}</h2><span>{block.shortLabel}</span></div>
      {error && <p role="alert">{error}</p>}
      {!loaded && <p role="status">Opening your reading places...</p>}
      <div className="story-list">
        {YEAR1_STORIES.filter(story => story.block === block.id).map((story, index) => {
          const saved = history[story.id];
          return <button className="story-entry" key={story.id} disabled={!loaded || Boolean(error)} onClick={() => setSelected(story)}>
            <BookOpen aria-hidden="true" size={28} />
            <span><small>STORY {index + 1} · {story.sentences.length} pages</small><strong>{story.title}</strong>
              <span className="story-focus">{story.focus.join(' · ')}</span>
              <small>{saved?.page > 0 ? `Continue at page ${saved.page + 1}` : 'Read together'}{saved?.reads ? ` · Read ${saved.reads} ${saved.reads === 1 ? 'time' : 'times'}` : ''}</small>
            </span><ArrowRight aria-hidden="true" size={24} />
          </button>;
        })}
      </div>
      <details className="reading-parent"><summary>Parent notes</summary><p>Original practice stories using words from this section. Read unfamiliar words together. A teaching section is not a reading assessment; use the school book level and teacher's advice.</p><p>Reading places and reread counts are saved on this browser, not shared across devices. All 36 stories remain available; no calendar-based unlocking.</p></details>
      <button className="reading-return" onClick={() => setLegacy(true)}><BookOpen size={20} /> Earlier story collection</button>
    </div>
  );
}

function StoryReader({ story, initial, onClose, onSaved, onNext }) {
  const recordings = useContext(RecordingsContext);
  const [page, setPage] = useState(Math.min(Math.max(Number(initial?.page) || 0, 0), story.sentences.length - 1));
  const [help, setHelp] = useState(true);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const saving = useRef(false);
  const audio = useRef(null);
  const support = getStorySupportWords(story);
  const focus = new Set(story.focus);
  const supportSet = new Set(support);
  const lastPage = page === story.sentences.length - 1;
  const heading = useRef(null);

  useEffect(() => () => audio.current?.abort(), []);
  useEffect(() => { heading.current?.focus(); }, [page, finished]);

  async function move(next, complete = false) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setNotice('');
    audio.current?.abort();
    try {
      const value = await db.transaction('rw', db.settings, async () => {
        const current = (await db.settings.get(bookmarkKey(story.id)))?.value || {};
        const nextValue = { ...current, page: next, reads: (current.reads || 0) + (complete ? 1 : 0),
          ...(complete ? { lastRead: new Date().toISOString() } : {}) };
        await db.settings.put({ key: bookmarkKey(story.id), value: nextValue });
        return nextValue;
      });
      onSaved(value);
      setPage(next);
      setFinished(complete);
    } catch {
      setNotice('Your reading place could not be saved. Try again. Do not clear website data.');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  async function hear(word) {
    audio.current?.abort();
    const controller = new AbortController();
    audio.current = controller;
    setNotice('');
    try {
      const played = await recordings.playSound(`word:${word}`, { allowTts: false, waitForEnd: true, signal: controller.signal });
      if (!played && !controller.signal.aborted) setNotice(`Dad's turn: ${word}`);
    } catch {
      if (!controller.signal.aborted) setNotice(`Dad's turn: ${word}`);
    }
  }

  return <article className="year1-reading story-reader">
    <header className="reader-bar"><button onClick={onClose} title="Back to stories" aria-label="Back to stories"><ArrowLeft /></button><span>{story.title}</span><button onClick={() => window.print()} title="Print story" aria-label="Print story"><Printer /></button></header>
    <div className="reader-screen">
      <div className="reader-options"><span>Page {page + 1} of {story.sentences.length}</span><label><input type="checkbox" checked={help} onChange={event => { setHelp(event.target.checked); setNotice(''); audio.current?.abort(); }} /> Dad's help</label></div>
      {finished ? <div className="story-finish"><Check size={44} /><h1 ref={heading} tabIndex={-1}>Story finished</h1><p>{story.title}</p><button onClick={() => move(0)} disabled={busy}><RotateCcw size={20} /> Read again</button><button onClick={onNext}><BookOpen size={20} /> Next story</button></div> : <>
        <h1 className="reader-title" ref={heading} tabIndex={-1}>{story.title}</h1>
        <div className="story-sentence" aria-label={`Story page ${page + 1}`}>
          {story.sentences[page].split(/(\s+)/).map((token, index) => {
            const word = token.toLowerCase().replace(/[^a-z']/g, '');
            const className = help ? focus.has(word) ? 'focus-word' : supportSet.has(word) ? 'support-word' : '' : '';
            return !word || !help ? <span key={index}>{token}</span> : <button key={index} className={className} onClick={() => hear(word)} aria-label={`Hear ${word}`} title={recordings.hasRecording(`word:${word}`) ? `Hear ${word}` : `Read ${word} with Dad`}>{token}</button>;
          })}
        </div>
        <p className="reader-notice" role="status">{notice}</p>
        {lastPage && <section className="story-question"><h2>Let's talk</h2><p>{story.question}</p><details><summary>For the grown-up</summary><p>{story.answer}</p></details></section>}
        <nav className="reader-navigation" aria-label="Story pages"><button disabled={page === 0 || busy} onClick={() => move(page - 1)} title="Previous page" aria-label="Previous page"><ArrowLeft /></button><progress max={story.sentences.length} value={page + 1} aria-label="Reading progress" /><button disabled={busy} onClick={() => move(lastPage ? 0 : page + 1, lastPage)} aria-label={lastPage ? 'Finish story' : 'Next page'} title={lastPage ? 'Finish story' : 'Next page'}>{lastPage ? <Check /> : <ArrowRight />}</button></nav>
        <details className="reading-parent"><summary>Words for this story</summary><p><strong>Section words:</strong> {story.focus.join(', ')}</p><p><strong>Check together:</strong> {support.join(', ') || 'None outside the review and section word banks.'}</p></details>
      </>}
      {finished && notice && <p role="status">{notice}</p>}
    </div>
    <section className="story-print"><h1>{story.title}</h1><p>Section words: {story.focus.join(', ')}</p>{story.sentences.map((sentence, index) => <p key={index}>{sentence}</p>)}<h2>Let's talk</h2><p>{story.question}</p><p>Check together: {support.join(', ')}</p><small>{storyWords(story).length} different words · PhonoBuddy original story</small></section>
  </article>;
}
