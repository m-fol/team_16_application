// Original line-art illustrations in the style of the team's slide deck:
// bold black outlines, aqua and white fills, on a sky-blue rounded panel.
// Decorative only (aria-hidden); hidden in low-stimulation and high-contrast modes.

const INK = '#121417';
const AQUA = '#5ce1e6';
const BLUE = '#38b6ff';
const WHITE = '#ffffff';

const s = `stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
const panel = `<rect x="8" y="16" width="224" height="136" rx="24" fill="${BLUE}"/>`;

// Rounded speech bubble with a tail, from (x, y) with size w×h; tail points down at tx.
function bubble(x, y, w, h, tx, fill = WHITE) {
  const r = 12;
  const b = y + h;
  return `<path ${s} fill="${fill}" d="M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${b - r}
    A${r} ${r} 0 0 1 ${x + w - r} ${b} H${tx + 8} L${tx} ${b + 12} V${b} H${x + r} A${r} ${r} 0 0 1 ${x} ${b - r}
    V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z"/>`;
}

function dots(cx, cy) {
  return [-13, 0, 13].map((dx) => `<circle ${s} stroke-width="2.5" cx="${cx + dx}" cy="${cy}" r="4.5" fill="${AQUA}"/>`).join('');
}

function star(cx, cy, r) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return `<polygon ${s} stroke-width="2" fill="${AQUA}" points="${pts}"/>`;
}

// Simple person: black hair, white face, shoulders in the given colour. Cropped by the panel bottom.
function person(cx, cy, shirt) {
  return `
    <path ${s} fill="${shirt}" d="M${cx - 30} 152 C${cx - 30} ${cy + 22} ${cx + 30} ${cy + 22} ${cx + 30} 152"/>
    <circle ${s} cx="${cx}" cy="${cy}" r="15" fill="${WHITE}"/>
    <path fill="${INK}" d="M${cx - 16} ${cy + 1} A16 16 0 0 1 ${cx + 16} ${cy + 1} C${cx + 8} ${cy - 5} ${cx - 6} ${cy - 5} ${cx - 16} ${cy + 1} Z"/>
    <circle cx="${cx - 5}" cy="${cy + 4}" r="1.8" fill="${INK}"/>
    <circle cx="${cx + 5}" cy="${cy + 4}" r="1.8" fill="${INK}"/>
    <path ${s} stroke-width="2.5" fill="none" d="M${cx - 5} ${cy + 9} Q${cx} ${cy + 12.5} ${cx + 5} ${cy + 9}"/>`;
}

const ART = {
  // Laptop, a speech bubble and a light bulb: "one small step".
  today: `${panel}
    <path ${s} fill="${WHITE}" d="M60 128 V66 a6 6 0 0 1 6 -6 H150 a6 6 0 0 1 6 6 V128"/>
    <path ${s} d="M74 80 H122 M74 92 H108"/>
    <rect ${s} x="118" y="88" width="26" height="24" rx="4" fill="${AQUA}"/>
    <path ${s} fill="${AQUA}" d="M44 128 H172 L164 142 H52 Z"/>
    ${bubble(150, 26, 64, 34, 166)}
    ${dots(182, 43)}
    <circle ${s} cx="36" cy="54" r="13" fill="${AQUA}"/>
    <rect ${s} x="29" y="66" width="14" height="10" rx="2" fill="${WHITE}"/>
    <path ${s} d="M36 28 V33 M18 40 L22 43 M54 40 L50 43"/>`,

  // Clipboard checklist and a stack of books.
  plan: `${panel}
    <rect ${s} x="62" y="32" width="92" height="112" rx="10" fill="${WHITE}"/>
    <rect ${s} x="89" y="24" width="38" height="16" rx="6" fill="${AQUA}"/>
    ${[60, 86, 112].map((y, i) => `
      <rect ${s} x="76" y="${y - 9}" width="18" height="18" rx="4" fill="${i < 2 ? AQUA : WHITE}"/>
      ${i < 2 ? `<path ${s} stroke-width="2.5" fill="none" d="M80 ${y} L84 ${y + 4} L91 ${y - 5}"/>` : ''}
      <path ${s} d="M104 ${y} H140"/>`).join('')}
    <rect ${s} x="166" y="116" width="52" height="16" rx="6" fill="${AQUA}"/>
    <rect ${s} x="172" y="100" width="46" height="16" rx="6" fill="${WHITE}"/>
    <rect ${s} x="164" y="84" width="48" height="16" rx="6" fill="${AQUA}"/>
    <circle ${s} cx="190" cy="70" r="10" fill="${WHITE}"/>
    <path ${s} fill="none" d="M190 60 q2 -6 8 -6"/>`,

  // Two people talking; one bubble with dots, one with five stars.
  swap: `${panel}
    ${person(66, 108, AQUA)}
    ${person(174, 108, WHITE)}
    ${bubble(22, 26, 78, 36, 52)}
    ${dots(61, 44)}
    ${bubble(118, 36, 104, 34, 176)}
    ${[134, 152, 170, 188, 206].map((x) => star(x, 53, 8)).join('')}`,

  // A video-call window with two people working side by side.
  cowork: `${panel}
    <rect ${s} x="34" y="26" width="172" height="118" rx="10" fill="${WHITE}"/>
    <path ${s} d="M34 46 H206"/>
    ${[48, 60, 72].map((x) => `<circle ${s} stroke-width="2.5" cx="${x}" cy="36" r="4" fill="${AQUA}"/>`).join('')}
    <rect ${s} x="46" y="56" width="70" height="78" rx="8" fill="${AQUA}"/>
    <rect ${s} x="124" y="56" width="70" height="78" rx="8" fill="${BLUE}"/>
    <svg x="46" y="56" width="70" height="78" viewBox="46 56 70 78" overflow="hidden">${person(81, 90, WHITE)}</svg>
    <svg x="124" y="56" width="70" height="78" viewBox="124 56 70 78" overflow="hidden">${person(159, 90, AQUA)}</svg>
    <rect ${s} x="46" y="56" width="70" height="78" rx="8" fill="none"/>
    <rect ${s} x="124" y="56" width="70" height="78" rx="8" fill="none"/>`,
};

export function art(name) {
  if (!ART[name]) return '';
  // Clip everything to the rounded panel so nothing pokes out of its corners.
  return `<svg class="page-art" aria-hidden="true" focusable="false" viewBox="0 0 240 160" width="240" height="160">
    <defs><clipPath id="art-clip-${name}"><rect x="8" y="0" width="224" height="152" rx="24"/></clipPath></defs>
    <g clip-path="url(#art-clip-${name})">${ART[name]}</g>
  </svg>`;
}
