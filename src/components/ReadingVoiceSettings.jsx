import { useEffect, useRef, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { DEFAULT_READING_VOICE, chooseReadingVoice, getReadingVoices, getReadingVoicePreferences, saveReadingVoicePreferences, speak } from '../utils/speech';
import './ReadingVoiceSettings.css';

export default function ReadingVoiceSettings() {
  const [voices, setVoices] = useState([]);
  const [prefs, setPrefs] = useState(DEFAULT_READING_VOICE);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const preview = useRef(null);
  const saveLock = useRef(false);
  useEffect(() => {
    let mounted = true;
    const refresh = () => setVoices(getReadingVoices());
    refresh();
    globalThis.speechSynthesis?.addEventListener('voiceschanged', refresh);
    getReadingVoicePreferences().then(value => {
      if (mounted) { setPrefs(value); setLoaded(true); }
    });
    return () => {
      mounted = false;
      globalThis.speechSynthesis?.removeEventListener('voiceschanged', refresh);
      preview.current?.abort();
    };
  }, []);

  async function change(patch) {
    if (saveLock.current) return;
    saveLock.current = true;
    preview.current?.abort();
    const previous = prefs;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    setMessage('');
    try { setPrefs(await saveReadingVoicePreferences(next)); }
    catch {
      setPrefs(previous);
      setMessage('The voice choice could not be saved. Your recordings are unchanged.');
    }
    finally { saveLock.current = false; setSaving(false); }
  }

  async function playPreview() {
    if (preview.current) { preview.current.abort(); return; }
    const controller = new AbortController();
    preview.current = controller;
    setPlaying(true);
    setMessage('');
    const success = await speak('The blue bird flew over the tree. Shall we read a story together?', undefined, { signal: controller.signal });
    if (!controller.signal.aborted && !success) setMessage('This voice could not play. Try another voice or check the device volume.');
    preview.current = null;
    setPlaying(false);
  }

  const chosen = chooseReadingVoice(voices, prefs.voiceURI);
  const unavailable = prefs.voiceURI !== 'auto' && !voices.some(voice => voice.voiceURI === prefs.voiceURI);
  return <section className="reading-voice-settings" aria-labelledby="reading-voice-heading">
    <h3 id="reading-voice-heading">Reading voice</h3>
    <p>Your recordings come first. The reading voice is only for missing words and story narration, never isolated phonics sounds.</p>
    <label className="voice-toggle"><input type="checkbox" checked={prefs.enabled} disabled={!loaded || saving} onChange={event => change({enabled:event.target.checked})} /> Use a fallback reading voice</label>
    <label htmlFor="reading-voice">Fallback voice</label>
    <select id="reading-voice" value={prefs.voiceURI} disabled={!loaded || saving} onChange={event => change({voiceURI:event.target.value})}>
      <option value="auto">Automatic - prefer female, British English</option>
      {unavailable && <option value={prefs.voiceURI}>Saved voice unavailable on this device</option>}
      {voices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}
    </select>
    <p className="voice-current">{chosen ? `Current voice: ${chosen.name}` : 'No recognised female English voice is available. Choose an English voice above, or read together.'}{unavailable && ' Automatic selection is being used for now.'}</p>
    <label htmlFor="reading-rate">Reading speed: {prefs.rate.toFixed(2)}x</label>
    <input id="reading-rate" type="range" min="0.7" max="1.15" step="0.05" value={prefs.rate} disabled={!loaded || saving} onChange={event => change({rate:Number(event.target.value)})} />
    <button type="button" disabled={!loaded || saving || !prefs.enabled || !chosen} onClick={playPreview}>{playing ? <Square size={20} /> : <Volume2 size={20} />}{playing ? 'Stop preview' : 'Preview voice'}</button>
    {message && <p role="status">{message}</p>}
    <details><summary>iPhone and iPad voices</summary><p>Voice quality depends on the voices Safari makes available. Download a higher-quality English voice in the device's accessibility speech settings, then reopen this page and choose it here if it appears. The voice choice is saved on this browser only.</p><a href="https://support.apple.com/en-gb/111798" target="_blank" rel="noreferrer">Apple voice download guide</a></details>
  </section>;
}
