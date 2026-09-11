import { useState } from 'react';
import { BookOpen, Blocks } from 'lucide-react';
import WordPractice from '../WordPractice';
import SchoolPractice from './SchoolPractice';
import './SchoolReading.css';

export default function WordPracticeHub({progress}) {
  const [view, setView] = useState('school');
  function navigate(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'school' : event.key === 'End' ? 'sounds' : view === 'school' ? 'sounds' : 'school';
    setView(next);
    event.currentTarget.querySelector(`#word-view-${next}`)?.focus();
  }
  return <>
    <div className="school-view-tabs" role="tablist" aria-label="Word practice view" onKeyDown={navigate}>
      <button role="tab" id="word-view-school" aria-controls="word-practice-panel" tabIndex={view === 'school' ? 0 : -1} aria-selected={view === 'school'} onClick={() => setView('school')}><BookOpen size={20} />School lists</button>
      <button role="tab" id="word-view-sounds" aria-controls="word-practice-panel" tabIndex={view === 'sounds' ? 0 : -1} aria-selected={view === 'sounds'} onClick={() => setView('sounds')}><Blocks size={20} />Sound blending</button>
    </div>
    <div role="tabpanel" id="word-practice-panel" aria-labelledby={`word-view-${view}`}>{view === 'school' ? <SchoolPractice /> : <WordPractice progress={progress} />}</div>
  </>;
}
