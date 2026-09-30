// Focus mode: one step on screen at a time, with an optional silent timer.
import { store } from '../store.js';
import { esc, uid, splitLines } from '../util.js';
import { announce } from '../ui.js';
import { icon, pageHead, heading } from '../icons.js';

const LENGTHS = [5, 10, 15, 25];
// Timer state lives at module level so it survives re-renders of this view.
const timer = { total: 15 * 60, remaining: 15 * 60, running: false, endAt: 0, interval: null };

const task = (id) => store.state.tasks.find((t) => t.id === id);
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export default {
  title: (params) => `Focus: ${task(params[0])?.title ?? 'task'}`,

  render([taskId]) {
    const t = task(taskId);
    if (!t) {
      return `<h1 tabindex="-1">Task not found</h1><p><a href="#/plan">Back</a></p>`;
    }
    const index = t.steps.findIndex((st) => !st.done);
    const step = t.steps[index];

    return `
      <p><a class="link-arrow" href="#/plan">${icon('back', 22)} Back</a></p>
      ${pageHead('focus', esc(t.title))}
      ${step ? `
        <p class="muted" id="step-count">Step ${index + 1}/${t.steps.length}</p>
        <section class="card card-feature focus-step" aria-labelledby="step-count">
          <p class="focus-text" id="focus-text" tabindex="-1">${esc(step.text)}</p>
          <div class="actions">
            <button type="button" class="btn btn-primary" data-action="done">${icon('check')}Done</button>
            <button type="button" class="btn" data-action="split" aria-expanded="false" aria-controls="split-form">${icon('split')}Split step</button>
          </div>
          <form id="split-form" hidden>
            <div class="field">
              <label for="split-steps">Smaller steps (one per line)</label>
              <textarea id="split-steps" rows="4"></textarea>
            </div>
            <div class="actions">
              <button type="submit" class="btn btn-primary">${icon('check')}Save</button>
              <button type="button" class="btn btn-quiet" data-action="split-cancel">Cancel</button>
            </div>
          </form>
        </section>` : `
        <section class="card card-feature">
          <p class="focus-text" id="focus-text" tabindex="-1">All done!</p>
          <div class="actions"><a class="btn btn-primary" href="#/today">${icon('today')}Back to Today</a></div>
        </section>`}

      <section class="card" aria-labelledby="timer-h">
        ${heading('timer-h', 'clock', 'Timer')}
        <div class="segmented" role="group" aria-label="Timer length">
          ${LENGTHS.map((m) => `<button type="button" class="btn" id="len-${m}" data-action="len" data-min="${m}" aria-pressed="${timer.total === m * 60}">${m} min</button>`).join('')}
        </div>
        <p class="timer-text" role="timer" id="timer-text">${fmt(timer.remaining)}</p>
        <div class="timer-bar" aria-hidden="true"><div id="timer-fill" style="width:${pct()}%"></div></div>
        <p id="timer-done" class="timer-done" ${timer.remaining === 0 ? '' : 'hidden'}>Time is up.</p>
        <div class="actions">
          <button type="button" class="btn btn-primary" id="timer-toggle" data-action="toggle">${toggleLabel()}</button>
          <button type="button" class="btn" id="timer-reset" data-action="reset">${icon('reset')}Reset</button>
        </div>
      </section>
    `;
  },

  mount(root, [taskId], ctx) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const splitForm = root.querySelector('#split-form');
      switch (btn.dataset.action) {
        case 'done': {
          store.update((s) => { s.tasks.find((t) => t.id === taskId).steps.find((st) => !st.done).done = true; });
          ctx.rerender('#focus-text');
          const next = task(taskId).steps.find((st) => !st.done);
          ctx.announce(next ? `Done. Next step: ${next.text}` : 'All steps are done.');
          break;
        }
        case 'split':
          splitForm.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
          root.querySelector('#split-steps').focus();
          break;
        case 'split-cancel':
          splitForm.hidden = true;
          root.querySelector('[data-action="split"]').setAttribute('aria-expanded', 'false');
          root.querySelector('[data-action="split"]').focus();
          break;
        case 'len':
          stop();
          timer.total = timer.remaining = Number(btn.dataset.min) * 60;
          ctx.rerender(`#len-${btn.dataset.min}`);
          break;
        case 'toggle':
          if (timer.running) stop();
          else start();
          paint();
          announce(timer.running ? 'Timer started.' : 'Timer paused.');
          break;
        case 'reset':
          stop();
          timer.remaining = timer.total;
          paint();
          announce('Timer reset.');
          break;
      }
    });

    root.querySelector('#split-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const texts = splitLines(root.querySelector('#split-steps').value);
      if (!texts.length) return;
      store.update((s) => {
        const t = s.tasks.find((x) => x.id === taskId);
        const i = t.steps.findIndex((st) => !st.done);
        t.steps.splice(i, 1, ...texts.map((text) => ({ id: uid(), text, done: false })));
      });
      ctx.rerender('#focus-text');
      ctx.announce(`Split into ${texts.length} steps.`);
    });
  },

  unmount() {
    stop();
  },
};

function toggleLabel() {
  return timer.running ? `${icon('pause')}Pause` : `${icon('play')}Start`;
}

function pct() {
  return timer.total ? ((timer.total - timer.remaining) / timer.total) * 100 : 0;
}

function start() {
  if (timer.remaining === 0) timer.remaining = timer.total;
  timer.running = true;
  timer.endAt = Date.now() + timer.remaining * 1000;
  timer.interval = setInterval(tick, 500);
}

function stop() {
  timer.running = false;
  clearInterval(timer.interval);
}

function tick() {
  timer.remaining = Math.max(0, Math.round((timer.endAt - Date.now()) / 1000));
  if (timer.remaining === 0) {
    stop();
    announce('Time is up.');
  }
  paint();
}

// Update only the timer elements, so the rest of the page (and focus) is untouched.
function paint() {
  const $ = (id) => document.getElementById(id);
  if (!$('timer-text')) return;
  $('timer-text').textContent = fmt(timer.remaining);
  $('timer-fill').style.width = `${pct()}%`;
  $('timer-toggle').innerHTML = toggleLabel();
  $('timer-done').hidden = timer.remaining !== 0;
}
