import { db } from './storage';
import { SCHOOL_WORDS, schoolWordId } from '../data/schoolWords';

const WORD_PREFIX = 'schoolWord:';
const LOG_PREFIX = 'homeReading:';

export async function loadSchoolWordChecks() {
  const rows = await db.settings.where('key').startsWith(WORD_PREFIX).toArray();
  return Object.fromEntries(rows.map(row => [row.key.slice(WORD_PREFIX.length), row.value]));
}

export async function saveSchoolWordCheck(word, skill, checked) {
  if (!SCHOOL_WORDS.includes(word) || !['read', 'spell'].includes(skill)) throw new Error('Invalid school word check');
  const key = WORD_PREFIX + schoolWordId(word);
  return db.transaction('rw', db.settings, async () => {
    const value = {...(await db.settings.get(key))?.value, [skill]:Boolean(checked), updated:new Date().toISOString()};
    await db.settings.put({key, value});
    return value;
  });
}

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function readingWeek(entries, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const week = entries.filter(entry => entry.date >= localDate(start) && entry.date < localDate(end));
  const minutesByDay = {};
  for (const entry of week) minutesByDay[entry.date] = (minutesByDay[entry.date] || 0) + entry.minutes;
  return {sessions:week.length, days:Object.values(minutesByDay).filter(minutes => minutes >= 10).length};
}

export async function loadHomeReading() {
  const rows = await db.settings.where('key').startsWith(LOG_PREFIX).toArray();
  return rows.map(row => row.value).sort((a, b) => b.date.localeCompare(a.date) || b.updated.localeCompare(a.updated));
}

export async function saveHomeReading(entry) {
  const date = new Date(`${entry.date}T12:00:00`);
  if (!entry.id || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !Number.isFinite(date.getTime()) || localDate(date) !== entry.date
    || entry.date > localDate() || !entry.title?.trim() || entry.title.length > 160
    || !Number.isInteger(entry.minutes) || entry.minutes < 1 || entry.minutes > 120
    || !['Together', 'With some help', 'Independently'].includes(entry.how) || (entry.notes || '').length > 500) {
    throw new Error('Check the date, title and reading time');
  }
  const value = {id:entry.id, date:entry.date, title:entry.title.trim(), minutes:entry.minutes,
    how:entry.how, notes:(entry.notes || '').trim(), updated:new Date().toISOString()};
  await db.settings.put({key:LOG_PREFIX + value.id, value});
  return value;
}
