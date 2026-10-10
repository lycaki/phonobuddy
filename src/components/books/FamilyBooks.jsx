import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, LockOpen } from 'lucide-react';
import { isPublicIndex, WrongPasswordError } from '../../utils/bookCrypto';
import {
  createAssetLoader, fetchFamilyIndex, forgetFamilyBooks, loadBookmarks, openRememberedFamilyBooks, saveBookmark, unlockFamilyBooks,
} from '../../utils/familyBooks';
import { DinoArt } from '../art/ReadingArt';
import { playDinoRoar } from '../../utils/dinoSounds';
import PictureBookReader from './PictureBookReader';
import './PictureBooks.css';

function UnlockForm({ busy, error, onUnlock }) {
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  return <form className="family-unlock" onSubmit={event => { event.preventDefault(); if (password.trim()) onUnlock(password, remember); }}>
    <Lock size={30} aria-hidden="true" />
    <h2>These books star our family</h2>
    <p>Type the family password to open them on this device.</p>
    <label htmlFor="family-password">Family password</label>
    <input id="family-password" type="password" value={password} onChange={event => setPassword(event.target.value)}
      autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="current-password" disabled={busy} />
    <label className="family-remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} disabled={busy} /> Remember on this device</label>
    {error && <p role="alert" className="family-error">{error}</p>}
    <button type="submit" disabled={busy || !password.trim()}><LockOpen size={20} />{busy ? 'Opening...' : 'Open the books'}</button>
  </form>;
}

export default function FamilyBooks({ onBack }) {
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState('');
  const [index, setIndex] = useState(null);
  const [library, setLibrary] = useState(null);
  const [bookmarks, setBookmarks] = useState({});
  const [covers, setCovers] = useState({});
  const [reading, setReading] = useState(null);
  const [opening, setOpening] = useState('');
  const live = useRef(true);

  const ready = useCallback(async ({ key, catalog }) => {
    const loader = createAssetLoader(key);
    setLibrary({ catalog, loader });
    setPhase('ready');
    setError('');
    try { setBookmarks(await loadBookmarks(catalog.books.map(book => book.id))); } catch { /* Start every book from the cover. */ }
    for (const book of catalog.books) {
      loader.url(book.cover).then(url => { if (live.current && url) setCovers(previous => ({ ...previous, [book.id]: url })); }, () => {});
    }
  }, []);

  useEffect(() => {
    live.current = true;
    return () => { live.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const found = await fetchFamilyIndex();
        if (!active) return;
        if (!found) { setPhase('empty'); return; }
        setIndex(found);
        const remembered = await openRememberedFamilyBooks(found);
        if (!active) return;
        if (remembered) await ready(remembered);
        else setPhase('locked');
      } catch (problem) {
        if (active) { setError(problem.message || 'The family books could not be opened.'); setPhase('error'); }
      }
    })();
    return () => { active = false; };
  }, [ready]);

  useEffect(() => () => library?.loader.dispose(), [library]);

  async function unlock(password, remember) {
    setPhase('unlocking');
    setError('');
    try {
      const opened = await unlockFamilyBooks(index, password, remember);
      if (live.current) await ready(opened);
    } catch (problem) {
      if (!live.current) return;
      setPhase('locked');
      setError(problem instanceof WrongPasswordError ? 'That password did not open the books. Check it with Dad or Mummy and try again.' : 'The books could not be opened. Check the internet connection and try again.');
    }
  }

  async function open(summary) {
    if (opening) return;
    setOpening(summary.id);
    setError('');
    try {
      const book = await library.loader.json(summary.header);
      void playDinoRoar();
      if (live.current) setReading({ summary, book });
    } catch {
      if (live.current) setError(`${summary.title} could not be opened. Check the internet connection and try again.`);
    } finally {
      if (live.current) setOpening('');
    }
  }

  async function lock() {
    await forgetFamilyBooks();
    setLibrary(null);
    setCovers({});
    setPhase('locked');
  }

  const progress = useCallback(async (id, slide, completed, pages) => {
    try {
      const value = await saveBookmark(id, current => ({
        slide: completed || slide > pages + 2 ? 0 : slide,
        reads: (current.reads || 0) + (completed ? 1 : 0),
        ...(completed ? { lastRead: new Date().toISOString() } : {}),
      }));
      if (live.current) setBookmarks(previous => ({ ...previous, [id]: value }));
    } catch { /* Reading carries on; the place is just not remembered. */ }
  }, []);

  const books = library?.catalog.books || [];
  const next = reading && books.length > 1 ? books[(books.findIndex(book => book.id === reading.summary.id) + 1) % books.length] : null;

  return <div className="family-books">
    <button type="button" className="reading-return" onClick={onBack}><ArrowLeft size={20} /> Story shelf</button>
    <header className="family-heading">
      <div><p>{library?.catalog.series || 'Dash Adventures'}</p><h1>Family picture books</h1></div>
      <DinoArt />
    </header>
    {phase === 'loading' && <p role="status">Opening the family books...</p>}
    {phase === 'empty' && <div className="family-empty"><h2>No family books yet</h2><p>The picture books starring our family are made on the computer. Once Dad has made them, they appear here.</p></div>}
    {(phase === 'locked' || phase === 'unlocking') && <UnlockForm busy={phase === 'unlocking'} error={error} onUnlock={unlock} />}
    {phase === 'error' && <p role="alert" className="family-error">{error}</p>}
    {phase === 'ready' && <>
      {error && <p role="alert" className="family-error">{error}</p>}
      <div className="family-grid">
        {books.map(book => {
          const saved = bookmarks[book.id];
          const page = saved?.slide > 2 ? saved.slide - 2 : 0;
          return <button type="button" key={book.id} className="family-book" style={{ '--level': book.colour }} onClick={() => open(book)} disabled={Boolean(opening)}>
            <span className="family-cover">{covers[book.id] ? <img src={covers[book.id]} alt="" /> : <DinoArt />}</span>
            <span className="family-level">{book.levelLabel}</span>
            <strong>{book.title}</strong>
            <small>{book.levelDetail}</small>
            <small>{opening === book.id ? 'Opening...' : page ? `Continue at page ${page}` : `${book.pages} pages`}{saved?.reads ? ` · Read ${saved.reads} ${saved.reads === 1 ? 'time' : 'times'}` : ''}</small>
            <ArrowRight className="family-go" size={22} aria-hidden="true" />
          </button>;
        })}
      </div>
      <details className="reading-parent family-notes">
        <summary>Parent notes</summary>
        <p>{isPublicIndex(index) ? 'These original books are ready to read without a password.' : 'These original books star our family, so their pictures, names and voices are stored locked. This device remembers the password until you lock it again.'} Reading places and read counts are saved on this device only.</p>
        <p>Level 1 matches the school's Phase 3 books; each level adds the next set of sounds. Words under "Grown-up help" are fine to read for Logan.</p>
        {!isPublicIndex(index) && <button type="button" onClick={lock}><Lock size={18} /> Lock on this device</button>}
      </details>
    </>}
    {reading && <PictureBookReader key={reading.book.id} book={reading.book} loader={library.loader} colour={reading.summary.colour}
      levelLabel={`${reading.summary.levelLabel} · ${reading.summary.levelDetail}`} initialSlide={bookmarks[reading.book.id]?.slide || 0}
      onClose={() => setReading(null)}
      onProgress={(slide, completed) => progress(reading.book.id, slide, completed, reading.book.pages.length)}
      onNextBook={next ? () => { setReading(null); open(next); } : null} />}
  </div>;
}
