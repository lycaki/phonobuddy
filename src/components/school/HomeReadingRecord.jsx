import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Pencil, Plus, Printer, Save, X } from 'lucide-react';
import { loadHomeReading, localDate, readingWeek, saveHomeReading } from '../../utils/schoolReading';
import { READING_PROMPTS } from '../../data/schoolWords';
import './SchoolReading.css';

export function ReadingEntryForm({title = '', entry, onSaved, onCancel}) {
  const [value, setValue] = useState(() => entry || {id:crypto.randomUUID(), date:localDate(), title, minutes:10, how:'Together', notes:''});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const change = (field, next) => setValue(previous => ({...previous, [field]:next}));
  async function save(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setPending(true); setError('');
    try { onSaved(await saveHomeReading({...value, minutes:Number(value.minutes)})); }
    catch { setError('This reading entry could not be saved. Check the date, title and minutes, then try again.'); }
    finally { lock.current = false; setPending(false); }
  }
  return <form className="reading-entry-form" onSubmit={save} aria-label="Reading entry">
    <h2>{entry ? 'Edit reading entry' : 'Add a read'}</h2>
    <label htmlFor="reading-date">Reading date</label><input id="reading-date" type="date" max={localDate()} value={value.date} onChange={event => change('date', event.target.value)} required disabled={pending} />
    <label htmlFor="reading-title">Book or text title</label><input id="reading-title" value={value.title} maxLength={160} onChange={event => change('title', event.target.value)} required disabled={pending} />
    <label htmlFor="reading-minutes">Minutes read</label><input id="reading-minutes" type="number" min="1" max="120" step="1" value={value.minutes} onChange={event => change('minutes', event.target.value)} required disabled={pending} />
    <label htmlFor="reading-how">How did they read?</label><select id="reading-how" value={value.how} onChange={event => change('how', event.target.value)} disabled={pending}>{['Together', 'With some help', 'Independently'].map(option => <option key={option}>{option}</option>)}</select>
    <label htmlFor="reading-notes">Comments or words to revisit</label><textarea id="reading-notes" value={value.notes} maxLength={500} rows={3} onChange={event => change('notes', event.target.value)} disabled={pending} />
    {error && <p role="alert">{error}</p>}
    <div className="school-actions"><button type="submit" className="school-primary" disabled={pending}><Save size={20} />{pending ? 'Saving...' : 'Save reading entry'}</button><button type="button" onClick={onCancel} disabled={pending}><X size={20} />Cancel</button></div>
  </form>;
}

export function ReadingConversation({stage}) {
  const label = {before:'Before reading', during:'During reading', after:'After reading'}[stage];
  return <details className="school-guidance reading-conversation"><summary>{label}</summary><ul>{READING_PROMPTS[stage].map(prompt => <li key={prompt}>{prompt}</li>)}</ul>{stage === 'during' && <p>Try a character's voice. Let punctuation help the reading sound natural. Use the letters and sounds to read a word; predictions are for discussing the story, not guessing words.</p>}</details>;
}

export default function HomeReadingRecord({onBack}) {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  async function load() {
    setError('');
    try { setEntries(await loadHomeReading()); setLoaded(true); }
    catch { setError('The reading record could not be opened. Try again without clearing website data.'); }
  }
  useEffect(() => { load(); }, []);
  const week = readingWeek(entries);
  return <section className="school-paper home-reading-record">
    <header className="school-exercise-bar"><button title="Back to stories" aria-label="Back to stories" onClick={onBack}><ArrowLeft /></button><BookOpen size={28} /><button title="Print reading record" aria-label="Print reading record" onClick={() => window.print()}><Printer /></button></header>
    <h1>Home reading record</h1>
    <p className="school-week"><strong>{week.days} / 5</strong> days with at least 10 minutes this week</p>
    <p>{week.sessions} {week.sessions === 1 ? 'read' : 'reads'} this week · {entries.length} {entries.length === 1 ? 'read' : 'reads'} logged</p>
    {error && <p role="alert">{error}<button onClick={load}>Try again</button></p>}
    {!loaded && !error && <p role="status">Opening your reading record...</p>}
    {form ? <ReadingEntryForm key={form.id || 'new'} entry={form.id ? form : undefined} onCancel={() => setForm(null)} onSaved={() => {setForm(null); load();}} /> : <div className="school-actions"><button className="school-primary" disabled={!loaded} onClick={() => setForm({})}><Plus size={20} />Add a read</button></div>}
    <div className="home-reading-entries" aria-label="Saved reading entries">{entries.map(entry => <article className="home-reading-entry" key={entry.id}>
      <header><time dateTime={entry.date}>{new Date(`${entry.date}T12:00:00`).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</time><button aria-label={`Edit reading entry: ${entry.title}`} title="Edit reading entry" onClick={() => setForm(entry)}><Pencil size={18} /></button></header>
      <h2>{entry.title}</h2><p>{entry.minutes} minutes · {entry.how}</p>{entry.notes && <p className="reading-handnote">{entry.notes}</p>}
    </article>)}</div>
    {loaded && !entries.length && <p>No reading entries yet.</p>}
    <details className="school-guidance"><summary>The school's home-reading routine</summary><p>The supplied school record asks for reading five times a week, for at least ten minutes a day. Add the date, title and how the reading went. Short reads on the same day add up towards the daily time.</p><p>The school also mentions recognition for seven reads and for reading four times in a week. This log does not award school house points. Keep the school's paper record up to date and take it to school.</p><p>Share books comfortably, follow favourite authors and interests, visit the library, and try poems, comics, information books and plays. Reading together and talking about books count too.</p><p>Entries stay on this browser and are included in the Settings progress backup. Printing can help with the school record; this is not a school submission or cross-device sync.</p></details>
    {['before', 'during', 'after'].map(stage => <ReadingConversation key={stage} stage={stage} />)}
    {loaded && entries.length > 0 && <p className="school-note"><Check size={16} /> Saved on this browser</p>}
  </section>;
}
