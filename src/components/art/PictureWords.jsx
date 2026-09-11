import { useContext, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Volume2 } from 'lucide-react';
import { PICTURE_WORDS } from '../../data/wordArt';
import { RecordingsContext } from '../../context/RecordingsContext';
import { DinoArt, WordPicture } from './ReadingArt';

export default function PictureWords() {
  const [selected, setSelected] = useState('frog');
  const [notice, setNotice] = useState('');
  const [revealed, setRevealed] = useState('');
  const audio = useRef(null);
  const { playSound } = useContext(RecordingsContext);
  useEffect(() => () => audio.current?.abort(), []);

  async function hear(word) {
    audio.current?.abort();
    const controller = new AbortController();
    audio.current = controller;
    setSelected(word);
    setNotice('');
    setRevealed('');
    try {
      const played = await playSound(`word:${word}`, { waitForEnd: true, signal: controller.signal,
        onStart: () => { if (!controller.signal.aborted) setRevealed(word); } });
      if (!played && !controller.signal.aborted) setNotice(`Read together: ${word}`);
    } catch {
      if (!controller.signal.aborted) setNotice(`Read together: ${word}`);
    }
  }

  function choose(word) {
    audio.current?.abort();
    setNotice('');
    setRevealed('');
    setSelected(word);
  }
  function move(delta) { choose(PICTURE_WORDS[(PICTURE_WORDS.indexOf(selected) + delta + PICTURE_WORDS.length) % PICTURE_WORDS.length]); }

  return <section className="picture-words">
    <header className="picture-heading"><div><p>READ TOGETHER</p><h1>Picture words</h1></div><DinoArt /></header>
    <div className="picture-stage">
      <div className="picture-reveal-slot">{revealed === selected ? <WordPicture word={selected} onHear={hear} /> : <DinoArt />}</div>
      <nav aria-label="Picture words"><button onClick={() => move(-1)} aria-label="Previous picture word" title="Previous word"><ArrowLeft /></button>
        <button className="picture-hear" onClick={() => hear(selected)} aria-label={`Hear ${selected}`}><Volume2 size={24} />{selected}</button>
        <button onClick={() => move(1)} aria-label="Next picture word" title="Next word"><ArrowRight /></button></nav>
    </div>
    <p className="picture-notice" role="status">{notice}</p>
    <div className="picture-word-grid">{PICTURE_WORDS.map(word => <button key={word} onClick={() => choose(word)} aria-pressed={selected === word} aria-label={`Choose ${word}`}>
      <span>{word}</span>
    </button>)}</div>
  </section>;
}
