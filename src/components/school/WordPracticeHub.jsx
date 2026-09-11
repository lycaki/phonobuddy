import { useState } from 'react';
import { BookOpen, Blocks, Images } from 'lucide-react';
import WordPractice from '../WordPractice';
import SchoolPractice from './SchoolPractice';
import PictureWords from '../art/PictureWords';
import { playDinoRoar } from '../../utils/dinoSounds';
import './SchoolReading.css';

export default function WordPracticeHub({progress}) {
  const [view, setView] = useState('school');
  function select(next) { if (next !== view) void playDinoRoar(); setView(next); }
  function navigate(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const views = ['school', 'sounds', 'pictures'];
    const next = event.key === 'Home' ? 'school' : event.key === 'End' ? 'pictures' : views[(views.indexOf(view) + (event.key === 'ArrowLeft' ? 2 : 1)) % views.length];
    select(next);
    event.currentTarget.querySelector(`#word-view-${next}`)?.focus();
  }
  return <>
    <div className="school-view-tabs" role="tablist" aria-label="Word practice view" onKeyDown={navigate}>
      <button role="tab" id="word-view-school" aria-controls="word-practice-panel" tabIndex={view === 'school' ? 0 : -1} aria-selected={view === 'school'} onClick={() => select('school')}><BookOpen size={20} />School lists</button>
      <button role="tab" id="word-view-sounds" aria-controls="word-practice-panel" tabIndex={view === 'sounds' ? 0 : -1} aria-selected={view === 'sounds'} onClick={() => select('sounds')}><Blocks size={20} />Sound blending</button>
      <button role="tab" id="word-view-pictures" aria-controls="word-practice-panel" tabIndex={view === 'pictures' ? 0 : -1} aria-selected={view === 'pictures'} onClick={() => select('pictures')}><Images size={20} />Picture words</button>
    </div>
    <div role="tabpanel" id="word-practice-panel" aria-labelledby={`word-view-${view}`}>{view === 'school' ? <SchoolPractice /> : view === 'pictures' ? <PictureWords /> : <WordPractice progress={progress} />}</div>
  </>;
}
