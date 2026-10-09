import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, Maximize, NotebookPen, RotateCcw, Volume2, X } from 'lucide-react';
import { RecordingsContext } from '../../context/RecordingsContext';
import { speak, stopSpeaking } from '../../utils/speech';
import { playClip, primeBookAudio, stopBookAudio, wordTimeline } from '../../utils/bookAudio';
import { playDinoRoar } from '../../utils/dinoSounds';
import { wordKey } from '../../utils/bookWords';
import { DinoArt } from '../art/ReadingArt';
import { ReadingEntryForm } from '../school/HomeReadingRecord';

const READ_TO_ME_KEY = 'phonobuddy:read-to-me:v1';
const FIRST_PAGE = 3;

function useAsset(loader, ref) {
  const [state, setState] = useState({ h: null, url: null, failed: false });
  useEffect(() => {
    if (!ref?.h) return undefined;
    let live = true;
    loader.url(ref).then(
      url => { if (live) setState({ h: ref.h, url, failed: false }); },
      () => { if (live) setState({ h: ref.h, url: null, failed: true }); },
    );
    return () => { live = false; };
  }, [loader, ref]);
  return ref?.h && state.h === ref.h ? state : { url: null, failed: false };
}

function Picture({ loader, imageRef, alt }) {
  const asset = useAsset(loader, imageRef);
  if (!imageRef || asset.failed) {
    return <div className="pb-placeholder"><DinoArt /><span>{asset.failed ? 'This picture could not be opened.' : 'Picture coming soon'}</span></div>;
  }
  return <div className="pb-picture">
    {asset.url && <><img className="pb-backdrop" src={asset.url} alt="" aria-hidden="true" /><img className="pb-image" src={asset.url} alt={alt} /></>}
  </div>;
}

function Thumb({ loader, imageRef }) {
  const asset = useAsset(loader, imageRef);
  return asset.url ? <img src={asset.url} alt="" /> : <DinoArt />;
}

// Shared voice for the reader: Dad's recordings, then the book's Fish Audio
// clips, then the chosen browser reading voice. One sound at a time.
function useBookVoice(book, loader) {
  const recordings = useContext(RecordingsContext);
  const [speaking, setSpeaking] = useState(null);
  const [notice, setNotice] = useState('');
  const active = useRef(null);

  const stop = useCallback(() => {
    active.current?.abort();
    active.current = null;
    stopBookAudio();
    stopSpeaking();
    setSpeaking(null);
  }, []);

  const begin = useCallback(state => {
    stop();
    const controller = new AbortController();
    active.current = controller;
    setNotice('');
    setSpeaking(state);
    return controller.signal;
  }, [stop]);

  const finish = useCallback((signal, played, message) => {
    if (signal.aborted) return played;
    active.current = null;
    setSpeaking(null);
    if (!played) setNotice(message);
    return played;
  }, []);

  const playRef = useCallback(async (ref, text, signal, onProgress) => {
    if (ref) {
      try {
        const url = await loader.url(ref);
        if (signal.aborted) return false;
        if (await playClip(url, { signal, onProgress })) return true;
      } catch { /* Fall back to the reading voice. */ }
    }
    if (signal.aborted) return false;
    return speak(text, undefined, { signal });
  }, [loader]);

  const hearWord = useCallback(async (token, id) => {
    const key = wordKey(token);
    if (!key) return false;
    const spoken = token.replace(/[^A-Za-z' ]/g, '').trim();
    const signal = begin({ target: 'word', id });
    let played = false;
    try {
      played = await recordings.playSound(`word:${key}`, { allowTts: false, waitForEnd: true, signal });
    } catch { /* No recording for this word. */ }
    if (!played && !signal.aborted) played = await playRef(book.words?.[key], spoken, signal);
    return finish(signal, played, `Ask a grown-up to read "${spoken}" with you.`);
  }, [begin, book, finish, playRef, recordings]);

  const hearLine = useCallback(async (target, text, ref) => {
    const timeline = wordTimeline(text.split(/\s+/).filter(Boolean));
    const signal = begin({ target, index: -1 });
    const played = await playRef(ref, text, signal, fraction => {
      const index = timeline.findIndex(end => fraction <= end + 1e-6);
      setSpeaking(current => (current?.target === target && current.index !== index ? { ...current, index } : current));
    });
    return finish(signal, played, 'Read this one together.');
  }, [begin, finish, playRef]);

  useEffect(() => stop, [stop]);
  return { speaking, notice, setNotice, hearWord, hearLine, stop };
}

function Words({ text, target, speaking, onWord }) {
  let wordIndex = -1;
  return text.split(/(\s+)/).map((token, index) => {
    if (!token.trim()) return <span key={index}>{token}</span>;
    wordIndex += 1;
    const id = `${target}:${wordIndex}`;
    let state = '';
    if (speaking?.target === target) state = speaking.index < 0 ? 'pb-reading' : wordIndex < speaking.index ? 'pb-read' : wordIndex === speaking.index ? 'pb-now' : '';
    if (speaking?.target === 'word' && speaking.id === id) state = 'pb-now';
    return <button type="button" key={index} className={`pb-word ${state}`} onClick={() => onWord(token, id)} aria-label={`Hear ${token.replace(/[^A-Za-z' ]/g, '')}`}>{token}</button>;
  });
}

export default function PictureBookReader({ book, loader, colour, levelLabel, initialSlide = 0, onClose, onProgress, onNextBook }) {
  const slides = useMemo(() => [
    { kind: 'cover' }, { kind: 'words' }, { kind: 'cast' },
    ...book.pages.map((page, index) => ({ kind: 'page', page, index })),
    { kind: 'end' },
  ], [book]);
  const last = slides.length - 1;
  const [slide, setSlide] = useState(() => Math.min(Math.max(Number(initialSlide) || 0, 0), last - 1));
  const [readToMe, setReadToMe] = useState(() => { try { return localStorage.getItem(READ_TO_ME_KEY) === 'on'; } catch { return false; } });
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const voice = useBookVoice(book, loader);
  const { stop, hearLine, hearWord, setNotice } = voice;
  const root = useRef(null);
  const swipe = useRef(null);
  const finished = useRef(false);
  const current = slides[slide];
  const canFullscreen = Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);

  const go = useCallback(next => {
    const target = Math.min(Math.max(next, 0), last);
    if (target === slide) return;
    stop();
    setNotice('');
    setLogging(false);
    void playDinoRoar();
    setSlide(target);
    const completed = target === last && !finished.current;
    if (completed) finished.current = true;
    onProgress?.(target, completed);
  }, [last, onProgress, setNotice, slide, stop]);

  const close = useCallback(() => {
    stop();
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch?.(() => {});
    onClose();
  }, [onClose, stop]);

  useEffect(() => {
    root.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const keys = event => {
      if (event.target.closest?.('input, textarea, select')) return;
      if (event.key === 'ArrowRight') go(slide + 1);
      else if (event.key === 'ArrowLeft') go(slide - 1);
      else if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  }, [close, go, slide]);

  // Warm the next pictures and this page's clips so taps feel instant.
  useEffect(() => {
    for (const offset of [1, 2]) loader.url(slides[slide + offset]?.page?.image).catch(() => {});
    const page = current.page;
    if (page) {
      for (const ref of [page.audio?.text, page.audio?.bubble]) loader.url(ref).catch(() => {});
      for (const token of `${page.text} ${page.bubble?.text || ''}`.split(/\s+/)) loader.url(book.words?.[wordKey(token)]).catch(() => {});
    }
  }, [book, current, loader, slide, slides]);

  useEffect(() => {
    if (!readToMe || current.kind !== 'page') return undefined;
    const page = current.page;
    const timer = setTimeout(async () => {
      const played = await hearLine('text', page.text, page.audio?.text);
      if (played && page.bubble) await hearLine('bubble', page.bubble.text, page.audio?.bubble);
    }, 500);
    return () => clearTimeout(timer);
  }, [current, hearLine, readToMe]);

  function toggleReadToMe() {
    primeBookAudio();
    const next = !readToMe;
    setReadToMe(next);
    if (!next) stop();
    try { localStorage.setItem(READ_TO_ME_KEY, next ? 'on' : 'off'); } catch { /* Remember for this visit only. */ }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (root.current.requestFullscreen || root.current.webkitRequestFullscreen)?.call(root.current);
  }

  const swipeStart = event => { swipe.current = { x: event.clientX, y: event.clientY }; };
  const swipeEnd = event => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(slide + (dx < 0 ? 1 : -1));
  };

  const speaking = voice.speaking;
  const page = current.page;
  const stageProps = { onPointerDown: swipeStart, onPointerUp: swipeEnd, onPointerCancel: () => { swipe.current = null; } };

  // Portalled to <body> so it sits above the app's bottom navigation.
  return createPortal(<div className="pb-reader" ref={root} role="dialog" aria-modal="true" aria-label={book.title} tabIndex={-1} style={{ '--level': colour }}>
    <header className="pb-top">
      <button type="button" className="pb-icon" onClick={close} aria-label="Close book" title="Close book"><X /></button>
      <div className="pb-top-title"><span>{book.title}</span>{page && <small>Page {current.index + 1} of {book.pages.length}</small>}</div>
      <button type="button" className={`pb-toggle${readToMe ? ' is-on' : ''}`} aria-pressed={readToMe} onClick={toggleReadToMe}><Volume2 size={20} />Read to me</button>
      {canFullscreen && <button type="button" className="pb-icon" onClick={toggleFullscreen} aria-label="Full screen" title="Full screen"><Maximize /></button>}
    </header>
    <div className="pb-progress" aria-hidden="true"><span style={{ width: `${(slide / last) * 100}%` }} /></div>

    {current.kind === 'cover' && <>
      <div className="pb-stage" {...stageProps}>
        <Picture loader={loader} imageRef={book.cover} alt={`Cover of ${book.title}`} />
        <h1 className="pb-cover-title"><button type="button" onClick={() => hearLine('title', book.title, book.titleAudio)}>{book.title}</button></h1>
      </div>
      <div className="pb-band pb-cover-band">
        <div><span className="pb-level">{levelLabel}</span><p>{book.before}</p></div>
        <button type="button" className="pb-start" onClick={() => { primeBookAudio(); go(1); }}>Start <ArrowRight /></button>
      </div>
    </>}

    {current.kind === 'words' && <div className="pb-panel" {...stageProps}>
      <h2>Words in this book</h2>
      {[['Sound them out', book.practise, 'practise'], ['Tricky words', book.common, 'tricky'], ['Grown-up help', book.challenge, 'challenge']].map(([title, list, tone]) => list.length > 0 && <section key={tone} className={`pb-word-group pb-${tone}`}>
        <h3>{title}</h3>
        <div>{list.map((word, index) => <button type="button" key={word} className={`pb-chip${speaking?.id === `${tone}:${index}` ? ' pb-now' : ''}`} onClick={() => hearWord(word, `${tone}:${index}`)}>{word}</button>)}</div>
      </section>)}
      <p className="pb-talk"><strong>Talk about it:</strong> {book.before}</p>
    </div>}

    {current.kind === 'cast' && <div className="pb-panel" {...stageProps}>
      <h2>In this story...</h2>
      <div className="pb-cast">
        {book.cast.map((member, index) => <button type="button" key={member.role} className={speaking?.id === `cast:${index}` ? 'pb-now' : ''} onClick={() => hearWord(member.name, `cast:${index}`)}>
          <span className="pb-portrait"><Thumb loader={loader} imageRef={member.portrait} /></span><span>{member.name}</span>
        </button>)}
        {book.mystery && <div className="pb-mystery"><span aria-hidden="true">?</span><p>{book.mystery}</p></div>}
      </div>
    </div>}

    {page && <>
      <div className="pb-stage" {...stageProps}>
        <Picture loader={loader} imageRef={page.image} alt={page.alt} />
        {page.bubble && <div className={`pb-bubble pb-bubble-${page.bubble.side || 'left'}`}>
          <span className="pb-speaker">{page.bubble.name}</span>
          <span className="pb-bubble-words"><Words text={page.bubble.text} target="bubble" speaking={speaking} onWord={hearWord} /></span>
          <button type="button" className="pb-bubble-listen" onClick={() => hearLine('bubble', page.bubble.text, page.audio?.bubble)} aria-label={`Hear what ${page.bubble.name} says`}><Volume2 size={22} /></button>
        </div>}
      </div>
      <div className="pb-band" onClick={event => { if (!event.target.closest('button')) hearLine('text', page.text, page.audio?.text); }}>
        <button type="button" className="pb-listen" onClick={() => hearLine('text', page.text, page.audio?.text)} aria-label="Read this page to me" title="Read this page to me"><Volume2 /></button>
        <p className="pb-line"><Words text={page.text} target="text" speaking={speaking} onWord={hearWord} /></p>
      </div>
    </>}

    {current.kind === 'end' && <div className="pb-panel pb-end" {...stageProps}>
      <h2><Check size={34} /> The End</h2>
      <h3>Retell the story</h3>
      <ol className="pb-retell">{book.retell.map((number, index) => <li key={number}>
        <button type="button" onClick={() => go(number + FIRST_PAGE - 1)} aria-label={`Go to page ${number}`}><Thumb loader={loader} imageRef={book.pages[number - 1]?.image} /><span>{index + 1}</span></button>
      </li>)}</ol>
      <section className="pb-after"><h3>Talk about it</h3><ul>{book.after.map(question => <li key={question}>{question}</li>)}<li>Which part did you like best?</li></ul></section>
      <div className="pb-actions">
        <button type="button" onClick={() => go(FIRST_PAGE)}><RotateCcw size={20} />Read again</button>
        {onNextBook && <button type="button" onClick={onNextBook}><BookOpen size={20} />Next book</button>}
        {!logged && !logging && <button type="button" onClick={() => setLogging(true)}><NotebookPen size={20} />Add to reading record</button>}
      </div>
      {logged && <p role="status">Added to the reading record.</p>}
      {logging && <ReadingEntryForm title={book.title} onCancel={() => setLogging(false)} onSaved={() => { setLogging(false); setLogged(true); }} />}
    </div>}

    {slide > 0 && <button type="button" className="pb-nav pb-prev" onClick={() => go(slide - 1)} aria-label="Previous page"><ArrowLeft /></button>}
    {slide < last && slide > 0 && <button type="button" className="pb-nav pb-next" onClick={() => go(slide + 1)} aria-label={slide === last - 1 ? 'Finish the book' : 'Next page'}><ArrowRight /></button>}
    <p className="pb-notice" role="status">{voice.notice}</p>
  </div>, document.body);
}
