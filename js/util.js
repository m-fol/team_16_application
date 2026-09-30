// Shared helpers and vocabularies.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
export const uid = () => Math.random().toString(36).slice(2, 10);

export const ENERGY = {
  low: { rank: 1, label: 'Low', hint: 'Small, familiar tasks. Resting counts too.' },
  some: { rank: 2, label: 'Some', hint: 'Routine work and short focus sessions.' },
  plenty: { rank: 3, label: 'Plenty', hint: 'New, complex or social tasks.' },
};

// How people like to be contacted. Shown on profiles and before sending a request.
export const COMMS = {
  written: 'Prefers written messages over calls',
  agenda: 'Needs an agenda before any call',
  'no-camera': 'Keeps camera off in calls',
  slow: 'Replies within 2–3 days',
  direct: 'Direct, literal feedback is welcome',
  'no-smalltalk': 'Happy to skip small talk',
  'voice-notes': 'Likes voice notes',
};

export const FORMATS = {
  silent: 'Silent work',
  'text-only': 'Text chat only (no voice)',
  'camera-optional': 'Camera optional',
  pomodoro: 'Timed breaks (25 / 5 min)',
  talking: 'Some talking',
  agenda: 'Agenda shared in advance',
};

// ---- dates (tasks use local YYYY-MM-DD strings) ----
export function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const todayISO = () => localISO(new Date());
export function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDaysISO(iso, n) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return localISO(d);
}
export const daysBetween = (a, b) => Math.round((parseISODate(b) - parseISODate(a)) / 864e5);

export const fmtDate = (iso) =>
  parseISODate(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

export const fmtDateTime = (ts) =>
  new Date(ts).toLocaleString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
  });

export function relDays(iso) {
  const n = daysBetween(todayISO(), iso);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

// The date we suggest aiming for: the real deadline minus a buffer, never earlier than today
// (unless the real deadline itself has already passed).
export function softDeadline(deadline, buffer) {
  if (!deadline) return null;
  const today = todayISO();
  const soft = addDaysISO(deadline, -buffer);
  if (soft >= today) return soft;
  return deadline < today ? deadline : today;
}

export function hoursLabel(h) {
  if (h === 0.5) return '30 minutes';
  return h === 1 ? '1 hour' : `${h} hours`;
}

export function splitList(text) {
  return text.split(',').map((s) => s.trim()).filter(Boolean);
}

export function splitLines(text) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

export function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
