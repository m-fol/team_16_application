import { art } from './art.js';

// Inline SVG icons (24×24 grid, stroke-based). Always decorative: the text next to them carries meaning.

const P = {
  today: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  plan: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17"/>',
  swap: '<path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/>',
  cowork: '<circle cx="8.5" cy="8" r="3.2"/><path d="M2.5 20c0-3.4 2.7-6 6-6s6 2.6 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.1c2.9.2 5 2.6 5 5.9"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  settings: '<path d="M3 6h10M18 6h3M3 12h3M11 12h10M3 18h12M19 18h2"/><circle cx="15.5" cy="6" r="2.3"/><circle cx="8.5" cy="12" r="2.3"/><circle cx="17" cy="18" r="2.3"/>',
  'battery-low': '<rect x="2" y="7" width="18" height="10" rx="2.5"/><path d="M22.5 10.5v3"/><rect x="4.5" y="9.5" width="3.5" height="5" rx=".8" fill="currentColor" stroke="none"/>',
  'battery-some': '<rect x="2" y="7" width="18" height="10" rx="2.5"/><path d="M22.5 10.5v3"/><rect x="4.5" y="9.5" width="3.5" height="5" rx=".8" fill="currentColor" stroke="none"/><rect x="9.25" y="9.5" width="3.5" height="5" rx=".8" fill="currentColor" stroke="none"/>',
  'battery-plenty': '<rect x="2" y="7" width="18" height="10" rx="2.5"/><path d="M22.5 10.5v3"/><rect x="4.5" y="9.5" width="3.5" height="5" rx=".8" fill="currentColor" stroke="none"/><rect x="9.25" y="9.5" width="3.5" height="5" rx=".8" fill="currentColor" stroke="none"/><rect x="14" y="9.5" width="3.5" height="5" rx=".8" fill="currentColor" stroke="none"/>',
  check: '<path d="M4.5 12.5l5 5L20 7"/>',
  'check-circle': '<circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5l3 3 6-6.5"/>',
  clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.5 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 2.5v4M16 2.5v4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  focus: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  message: '<path d="M4 4.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-5 4v-4.5a1 1 0 0 1 0 0V5.5a1 1 0 0 1 1-1z"/>',
  later: '<path d="M4 12h14M13 6l6 6-6 6"/>',
  play: '<path d="M7 4.5l12 7.5-12 7.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v5h5"/>',
  quiet: '<path d="M3.5 9.5v5h4l5 4v-13l-5 4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  camera: '<rect x="2.5" y="6.5" width="13" height="11" rx="2"/><path d="M15.5 10.5l6-3.5v10l-6-3.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1" fill="currentColor"/><circle cx="3.5" cy="12" r="1" fill="currentColor"/><circle cx="3.5" cy="18" r="1" fill="currentColor"/>',
  download: '<path d="M12 3.5v12M7 10.5l5 5 5-5M4.5 20.5h15"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>',
  coin: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v10M9 9.5c0-1 1.3-1.8 3-1.8s3 .8 3 1.8-1.3 1.7-3 1.9-3 .8-3 1.9 1.3 1.8 3 1.8 3-.8 3-1.8"/>',
  inbox: '<path d="M3 13l2.5-8h13L21 13v6H3z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>',
  send: '<path d="M21 3L10 14M21 3l-6.5 18-4.5-7-7-4.5z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',
  split: '<path d="M4 6h7M4 12h16M4 18h7"/><path d="M15 4l2 2-2 2M15 16l2 2-2 2"/>',
  back: '<path d="M20 12H6M11 6l-6 6 6 6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5v.5"/>',
  save: '<path d="M5 3.5h11l3.5 3.5v13H4.5V3.5z"/><path d="M8 3.5v5h7v-5M8 20.5v-6h8v6"/>',
  talk: '<path d="M4 5h11v8H8l-4 3z"/><path d="M15 9h5v8l-3-2.5h-6V13"/>',
  text: '<path d="M5 5.5h14M12 5.5V20M9 20h6"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  auto: '<circle cx="12" cy="12" r="9.5"/><path d="M12 2.5v19A9.5 9.5 0 0 0 12 2.5z" fill="currentColor"/>',
  contrast: '<rect x="2.5" y="2.5" width="19" height="19" rx="4"/><path d="M2.5 21.5L21.5 2.5V17.5a4 4 0 0 1-4 4z" fill="currentColor"/>',
  'lines-tight': '<path d="M4 8h16M4 11h16M4 14h16M4 17h11"/>',
  'lines-mid': '<path d="M4 6h16M4 10.5h16M4 15h16M4 19.5h11"/>',
  'lines-wide': '<path d="M4 4h16M4 10h16M4 16h16M4 22h11"/>',
  'motion-off': '<circle cx="12" cy="12" r="9.5"/><path d="M5.5 5.5l13 13"/>',
  pen: '<path d="M4 20l1-4.5L16 4.5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M14 7l3 3"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  'camera-off': '<rect x="2.5" y="6.5" width="13" height="11" rx="2"/><path d="M15.5 10.5l6-3.5v10l-6-3.5M2 3l20 18"/>',
  'talk-off': '<path d="M4 5h11v8H8l-4 3z"/><path d="M3 3l18 18"/>',
};

export function icon(name, size = 24) {
  return `<svg class="icon" aria-hidden="true" focusable="false" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;
}

// Wavy "badge" shape from the slide deck: a circle ringed with 12 bumps.
const BLOB = `<circle cx="50" cy="50" r="38"/>${Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return `<circle cx="${(50 + 38 * Math.cos(a)).toFixed(1)}" cy="${(50 + 38 * Math.sin(a)).toFixed(1)}" r="11"/>`;
}).join('')}`;

// Page title with a big black icon on a colour tile. `title` must already be escaped.
export function pageHead(iconName, title, lede = '') {
  return `
    <div class="page-head">
      <div class="page-visual" aria-hidden="true">
        <svg class="page-blob" focusable="false" viewBox="0 0 100 100" fill="currentColor">${BLOB}</svg>
        ${art(iconName)}
      </div>
      <span class="page-icon tile-icon">${icon(iconName, 46)}</span>
      <div>
        <h1 tabindex="-1">${title}</h1>
        ${lede ? `<p class="lede">${lede}</p>` : ''}
      </div>
    </div>`;
}

// Section heading with an icon. `text` must already be escaped.
export function heading(id, iconName, text, level = 2) {
  return `<h${level} id="${id}" class="with-icon">${icon(iconName, level === 2 ? 30 : 24)}<span>${text}</span></h${level}>`;
}

export const ENERGY_ICON = { low: 'battery-low', some: 'battery-some', plenty: 'battery-plenty' };

export const COMMS_ICON = {
  written: 'pen', agenda: 'list', 'no-camera': 'camera-off', slow: 'clock',
  direct: 'focus', 'no-smalltalk': 'talk-off', 'voice-notes': 'mic',
};

export const FORMAT_ICON = {
  silent: 'quiet', 'text-only': 'message', 'camera-optional': 'camera',
  pomodoro: 'clock', talking: 'talk', agenda: 'list',
};
