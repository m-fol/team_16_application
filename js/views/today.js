import { store, nextStep, currentEnergy } from '../store.js';
import { esc, ENERGY, todayISO, fmtDateTime, relDays, softDeadline } from '../util.js';
import { icon, pageHead, heading, ENERGY_ICON } from '../icons.js';

export default {
  title: 'Today',

  render() {
    const s = store.state;
    const energy = currentEnergy(s);
    const name = s.profile.name.trim();
    const next = nextStep(s);
    const now = Date.now();

    // "Coming up": at most three things, soonest first. Nothing else competes with the next step.
    const upcoming = [
      ...s.tasks
        .filter((t) => t.deadline && t.steps.some((st) => !st.done))
        .map((t) => {
          const soft = softDeadline(t.deadline, s.settings.bufferDays);
          return { at: `${soft}T23:59`, icon: 'plan', html: `<strong>${esc(t.title)}</strong><br><span class="muted">Aim to finish ${relDays(soft)}</span>` };
        }),
      ...s.sessions
        .filter((x) => x.joined && new Date(x.start).getTime() + x.minutes * 6e4 > now)
        .map((x) => ({ at: x.start, icon: 'cowork', html: `<strong>${esc(x.title)}</strong><br><span class="muted">${fmtDateTime(x.start)}</span>` })),
    ].sort((a, b) => new Date(a.at) - new Date(b.at)).slice(0, 3);
    const incoming = s.swaps.filter((w) => w.direction === 'in' && w.status === 'pending').length;

    return `
      ${pageHead('today', name ? `Hello, ${esc(name)}` : 'Hello', 'One small step is enough.')}

      ${s.settings.onboarded ? '' : `
        <section class="card card-note" aria-labelledby="welcome-h">
          ${heading('welcome-h', 'sparkle', 'Welcome to ThriveTogether')}
          <p>Swap skills, plan in small steps, and work alongside others.</p>
          <div class="actions">
            <a class="btn btn-primary" href="#/settings">${icon('settings')}Make it comfortable for me</a>
            <button type="button" class="btn btn-quiet" data-action="dismiss-welcome">Hide this</button>
          </div>
        </section>`}

      <section class="card" aria-labelledby="energy-h">
        ${heading('energy-h', 'battery-some', 'How is your energy?')}
        <fieldset class="choices">
          <legend class="visually-hidden">Energy level</legend>
          ${Object.entries(ENERGY).map(([key, e]) => `
            <label class="choice choice-energy energy-${key}">
              <input type="radio" name="energy" id="energy-${key}" value="${key}" ${energy === key ? 'checked' : ''}>
              <span class="choice-icon">${icon(ENERGY_ICON[key], 60)}</span>
              <span class="choice-title">${e.label}</span>
            </label>`).join('')}
        </fieldset>
      </section>

      <section class="card card-feature" aria-labelledby="next-h">
        ${heading('next-h', 'focus', 'Your next small step')}
        ${renderNext(next, energy)}
      </section>

      <section class="card" aria-labelledby="up-h">
        ${heading('up-h', 'calendar', 'Coming up')}
        ${upcoming.length
          ? `<ul class="plain-list">${upcoming.map((u) => `<li class="list-icon">${icon(u.icon, 28)}<span>${u.html}</span></li>`).join('')}</ul>`
          : '<p class="muted">Nothing coming up.</p>'}
        ${incoming ? `<p><a class="link-arrow" href="#/swap">${icon('inbox', 24)} ${incoming} skill swap ${incoming === 1 ? 'request is' : 'requests are'} waiting for you</a></p>` : ''}
      </section>
    `;
  },

  mount(root, _params, ctx) {
    root.addEventListener('change', (e) => {
      if (e.target.name !== 'energy') return;
      const level = e.target.value;
      store.update((s) => { s.energy = { date: todayISO(), level }; });
      ctx.rerender(`#energy-${level}`);
      ctx.announce(`Energy set to ${ENERGY[level].label}. Your next step was updated.`);
    });

    root.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'dismiss-welcome') {
        store.update((s) => { s.settings.onboarded = true; });
        ctx.rerender('#energy-h');
        return;
      }
      const { taskId, stepId } = e.target.closest('[data-action]').dataset;
      if (action === 'step-done') {
        let stepText = '';
        store.update((s) => {
          const step = s.tasks.find((t) => t.id === taskId).steps.find((st) => st.id === stepId);
          step.done = true;
          stepText = step.text;
        });
        ctx.rerender('#next-h');
        ctx.toast(`Done: ${stepText}`, {
          undo: () => {
            store.update((s) => { s.tasks.find((t) => t.id === taskId).steps.find((st) => st.id === stepId).done = false; });
            ctx.rerender('#next-h');
          },
        });
      }
      if (action === 'step-skip') {
        store.update((s) => {
          if (!s.skip || s.skip.date !== todayISO()) s.skip = { date: todayISO(), ids: [] };
          s.skip.ids.push(stepId);
        });
        ctx.rerender('#next-h');
        ctx.announce('Okay, not now. Showing a different step.');
      }
      if (action === 'unskip') {
        store.update((s) => { s.skip = null; });
        ctx.rerender('#next-h');
      }
    });
  },
};

function renderNext(next, energy) {
  if (!next.none) {
    const { task, step } = next;
    const index = task.steps.indexOf(step) + 1;
    return `
      <p class="step-text">${esc(step.text)}</p>
      <p class="muted">Part of “${esc(task.title)}” · step ${index} of ${task.steps.length}</p>
      <div class="actions">
        <button type="button" class="btn btn-primary" data-action="step-done" data-task-id="${task.id}" data-step-id="${step.id}">${icon('check')}Mark as done</button>
        <button type="button" class="btn" data-action="step-skip" data-task-id="${task.id}" data-step-id="${step.id}">${icon('later')}Not now</button>
        <a class="btn" href="#/focus/${task.id}">${icon('focus')}Open focus mode</a>
      </div>`;
  }
  if (!next.hasOpen) {
    return '<p>Nothing is planned. You can <a href="#/plan">add a task</a>, or take the day as it comes.</p>';
  }
  if (next.allFilteredOut) {
    return `<p>Nothing on your list fits ${energy === 'low' ? 'a low-energy moment' : 'your energy right now'}. That is okay. Rest is part of running a business.</p>
      <p>If you want to, you can still <a href="#/plan">pick any task in the planner</a>.</p>`;
  }
  return `<p>You said “not now” to every step that fits. That is fine.</p>
    <div class="actions"><button type="button" class="btn" data-action="unskip">${icon('reset')}Show them again</button></div>`;
}
