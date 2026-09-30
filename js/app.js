import { store } from './store.js';
import { announce, toast, applySettings, watchSystemTheme } from './ui.js';
import { icon } from './icons.js';
import today from './views/today.js';
import plan from './views/plan.js';
import focus from './views/focus.js';
import swap from './views/swap.js';
import cowork from './views/cowork.js';
import profile from './views/profile.js';
import settings from './views/settings.js';

const routes = { today, plan, focus, swap, cowork, profile, settings };
// Which nav item to highlight for routes that aren't in the nav.
const navFor = { focus: 'plan' };

const main = document.getElementById('main');
let currentName = null;
let firstLoad = true;

function parse() {
  const [name, ...params] = location.hash.replace(/^#\/?/, '').split('/');
  return { name: routes[name] ? name : 'today', params };
}

function draw() {
  const { name, params } = parse();
  const view = routes[name];
  const container = document.createElement('div');
  container.className = 'view';
  container.innerHTML = view.render(params);
  main.replaceChildren(container);
  view.mount?.(container, params, ctx);
  return { name, params, view };
}

const ctx = {
  announce,
  toast,
  // Re-render the current view, keeping scroll position and keyboard focus.
  rerender(focusSelector) {
    const activeId = document.activeElement?.id;
    const y = window.scrollY;
    draw();
    window.scrollTo(0, y);
    const target = (focusSelector && main.querySelector(focusSelector))
      || (activeId && document.getElementById(activeId))
      || main.querySelector('h1');
    if (!target) return;
    // Headings and other static targets need tabindex to receive focus.
    if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    // The target may be hidden (e.g. inside a closed <details>): never leave focus on <body>.
    if (document.activeElement !== target) main.querySelector('h1')?.focus({ preventScroll: true });
  },
  navigate(hash) { location.hash = hash; },
  applySettings: () => applySettings(store.state.settings),
};

function onRoute() {
  const { name } = parse();
  if (currentName && currentName !== name) {
    routes[currentName].unmount?.();
    // An undo message belongs to the page it was shown on.
    document.getElementById('toast-region').replaceChildren();
  }
  currentName = name;
  const { view, params } = draw();
  const title = typeof view.title === 'function' ? view.title(params) : view.title;
  document.title = `${title} · ThriveTogether`;

  const navName = navFor[name] || name;
  // Each area has its own colour, used for its icons and highlights.
  main.dataset.area = navName;
  document.querySelectorAll('[data-route]').forEach((a) => {
    if (a.dataset.route === navName) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  window.scrollTo(0, 0);
  // Move focus to the new page heading so screen reader and keyboard users land in the content.
  if (!firstLoad) main.querySelector('h1')?.focus();
  firstLoad = false;
}

// Big icons in the main navigation.
document.querySelectorAll('.nav-list a[data-route]').forEach((a) => {
  a.innerHTML = `${icon(a.dataset.route, 32)}<span>${a.textContent}</span>`;
});
document.querySelectorAll('.header-links a[data-route]').forEach((a) => {
  a.innerHTML = `${icon(a.dataset.route, 24)}<span>${a.textContent}</span>`;
});

document.querySelector('.skip-link').addEventListener('click', (e) => {
  e.preventDefault();
  main.focus();
});

applySettings(store.state.settings);
watchSystemTheme(() => store.state.settings);
window.addEventListener('hashchange', onRoute);
onRoute();
