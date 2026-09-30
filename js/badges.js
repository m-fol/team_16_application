// Level badges: a wavy badge (the slide deck's scalloped shape) with a plant that grows level by level.
// Badges are kept once earned, even if hours later go down.

const INK = '#121417';
const LOCKED = { fill: '#dfe3e8', ink: '#6b7480', a: '#c5ccd4', b: '#c5ccd4' };

export const BADGES = [
  { id: 'seed', name: 'Seed', min: 0, color: '#ffbd59' },
  { id: 'sprout', name: 'Sprout', min: 10, color: '#5ce1e6' },
  { id: 'growing', name: 'Growing', min: 25, color: '#38b6ff' },
  { id: 'blooming', name: 'Blooming', min: 50, color: '#c7b5ff' },
  { id: 'thriving', name: 'Thriving', min: 100, color: '#ffbd59' },
];

export const badgesFor = (hours) => BADGES.filter((b) => hours >= b.min).map((b) => b.id);

const scallops = `<circle cx="50" cy="50" r="38"/>${Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return `<circle cx="${(50 + 38 * Math.cos(a)).toFixed(1)}" cy="${(50 + 38 * Math.sin(a)).toFixed(1)}" r="11"/>`;
}).join('')}`;

// Leaf shapes pointing left/right from a stem at (x, y).
const leafL = (x, y, s = 1) => `M${x} ${y} C${x} ${y - 8 * s} ${x - 7 * s} ${y - 12 * s} ${x - 14 * s} ${y - 11 * s} C${x - 14 * s} ${y - 4 * s} ${x - 8 * s} ${y + 1 * s} ${x} ${y} Z`;
const leafR = (x, y, s = 1) => `M${x} ${y} C${x} ${y - 8 * s} ${x + 7 * s} ${y - 12 * s} ${x + 14 * s} ${y - 11 * s} C${x + 14 * s} ${y - 4 * s} ${x + 8 * s} ${y + 1 * s} ${x} ${y} Z`;

function plant(id, p) {
  const st = `stroke="${p.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  const soil = `<path ${st} d="M33 71 H67"/>`;
  switch (id) {
    case 'seed':
      return `${soil}<ellipse ${st} cx="50" cy="60" rx="8" ry="10.5" fill="${p.a}"/>
        <path ${st} stroke-width="2.5" fill="none" d="M50 51 q3 5 0 10"/>`;
    case 'sprout':
      return `${soil}<path ${st} d="M50 71 V52"/>
        <path ${st} stroke-width="2.5" fill="${p.a}" d="${leafL(50, 56)}"/>
        <path ${st} stroke-width="2.5" fill="${p.b}" d="${leafR(50, 52)}"/>`;
    case 'growing':
      return `${soil}<path ${st} d="M50 71 V34"/>
        <path ${st} stroke-width="2.5" fill="${p.a}" d="${leafL(50, 64, 0.9)}"/>
        <path ${st} stroke-width="2.5" fill="${p.b}" d="${leafR(50, 56, 0.9)}"/>
        <path ${st} stroke-width="2.5" fill="${p.a}" d="${leafL(50, 46, 0.9)}"/>
        <path ${st} stroke-width="2.5" fill="${p.b}" d="${leafR(50, 38, 0.8)}"/>`;
    case 'blooming':
      return `${soil}<path ${st} d="M50 71 V44"/>
        <path ${st} stroke-width="2.5" fill="${p.a}" d="${leafL(50, 64, 0.9)}"/>
        <path ${st} stroke-width="2.5" fill="${p.a}" d="${leafR(50, 58, 0.9)}"/>
        ${[0, 72, 144, 216, 288].map((deg) => {
          const a = (deg - 90) * Math.PI / 180;
          return `<circle ${st} stroke-width="2.5" cx="${(50 + 8 * Math.cos(a)).toFixed(1)}" cy="${(37 + 8 * Math.sin(a)).toFixed(1)}" r="6" fill="${p.b}"/>`;
        }).join('')}
        <circle ${st} stroke-width="2.5" cx="50" cy="37" r="5" fill="${p.c}"/>`;
    case 'thriving':
      return `${soil}<path ${st} fill="${p.c}" d="M46 71 V52 H54 V71"/>
        <path ${st} fill="${p.a}" d="M36 52 a9 9 0 0 1 2 -17 a12 12 0 0 1 24 0 a9 9 0 0 1 2 17 Z"/>
        <circle cx="44" cy="44" r="2.5" fill="${p.b}" stroke="${p.ink}" stroke-width="2"/>
        <circle cx="56" cy="40" r="2.5" fill="${p.b}" stroke="${p.ink}" stroke-width="2"/>
        <circle cx="53" cy="48" r="2.5" fill="${p.b}" stroke="${p.ink}" stroke-width="2"/>`;
    default:
      return '';
  }
}

// Decorative SVG; callers always put the badge name next to it as text.
export function badgeSvg(id, size = 72, earned = true) {
  const b = BADGES.find((x) => x.id === id);
  const p = earned
    ? { fill: b.color, ink: INK, a: '#5ce1e6', b: '#ffbd59', c: '#ffffff' }
    : { ...LOCKED, c: LOCKED.a };
  if (earned && id === 'sprout') p.a = '#ffffff';
  if (earned && id === 'blooming') { p.a = '#5ce1e6'; p.b = '#ffffff'; p.c = '#ffbd59'; }
  if (earned && id === 'thriving') { p.a = '#5ce1e6'; p.b = '#ffffff'; p.c = '#ffffff'; }
  return `<svg class="badge-svg" aria-hidden="true" focusable="false" width="${size}" height="${size}" viewBox="0 0 100 100">
    <g fill="${p.fill}">${scallops}</g>
    <circle cx="50" cy="52" r="29" fill="#ffffff" stroke="${p.ink}" stroke-width="3" ${earned ? '' : 'stroke-dasharray="5 5"'}/>
    ${plant(id, p)}
  </svg>`;
}

// A row of all badges: earned ones in colour, the rest greyed with how many hours to go.
export function badgeList(earnedIds, hours) {
  return `<ul class="badges">${BADGES.map((b) => {
    const earned = earnedIds.includes(b.id);
    return `<li class="badge ${earned ? 'is-earned' : 'is-locked'}">
      ${badgeSvg(b.id, 72, earned)}
      <span class="badge-name">${b.name}</span>
      <span class="badge-status">${earned ? 'Earned' : `${b.min - hours} ${b.min - hours === 1 ? 'hour' : 'hours'} to go`}</span>
    </li>`;
  }).join('')}</ul>`;
}
