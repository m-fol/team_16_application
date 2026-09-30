import { icon } from './icons.js';

// Accessibility plumbing: screen reader announcements, undo toasts, and applying comfort settings.

const live = () => document.getElementById('live');

export function announce(message) {
  const el = live();
  el.textContent = '';
  // A short delay makes screen readers re-read identical messages.
  setTimeout(() => { el.textContent = message; }, 60);
}

// Toasts never disappear on a timer (no time pressure). They stay until closed or replaced.
export function toast(message, { undo } = {}) {
  const region = document.getElementById('toast-region');
  region.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'toast';
  box.setAttribute('role', 'status');
  const p = document.createElement('p');
  p.textContent = message;
  box.append(p);
  if (undo) {
    const btn = button('Undo', 'btn');
    btn.addEventListener('click', () => {
      undo();
      region.innerHTML = '';
      announce('Undone.');
    });
    box.append(btn);
  }
  const close = button('', 'toast-close');
  close.setAttribute('aria-label', 'Close message');
  close.innerHTML = icon('close', 22);
  close.addEventListener('click', () => { region.innerHTML = ''; });
  box.append(close);
  region.append(box);
}

function button(label, className) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.textContent = label;
  return b;
}

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function applySettings(settings) {
  const html = document.documentElement;
  const theme = settings.theme === 'system' ? (darkQuery.matches ? 'dark' : 'calm') : settings.theme;
  html.dataset.theme = theme;
  html.dataset.size = settings.textSize;
  html.dataset.font = settings.font;
  html.dataset.spacing = settings.spacing;
  html.dataset.motion = settings.motion;
  html.toggleAttribute('data-lowstim', settings.lowStim);
}

export function watchSystemTheme(getSettings) {
  darkQuery.addEventListener('change', () => applySettings(getSettings()));
}
