import { store, nextStep, currentEnergy, byUrgency } from '../store.js';
import { esc, ENERGY, todayISO, fmtDate, fmtDateTime, relDays, softDeadline } from '../util.js';
import { icon, pageHead, heading, ENERGY_ICON } from '../icons.js';

export default {
  title: 'Today',

  render() {
    const s = store.state;
    const energy = currentEnergy(s);
    const name = s.profile.name.trim();
    const next = nextStep(s);
    const now = Date.now();

    const joined = s.sessions
      .filter((x) => x.joined && new Date(x.start).getTime() + x.minutes * 6e4 > now)
      .sort((a, b) => a.start.localeCompare(b.start));
    const deadlines = s.tasks
      .filter((t) => t.deadline && t.steps.some((st) => !st.done))
      .sort(byUrgency(s.settings.bufferDays))
      .slice(0, 3);
    const incoming = s.swaps.filter((w) => w.direction === 'in' && w.status === 'pending');

    return `
      ${pageHead('today', name ? `Hello, ${esc(name)}` : 'Hello', `${fmtDate(todayISO())}. One small step is enough.`)}

      ${s.settings.onboarded ? '' : `
        <section class="card card-note" aria-labelledby="welcome-h">
          ${heading('welcome-h', 'sparkle', 'Welcome to ThriveTogether')}
          <p>ThriveTogether is a community for autistic and ADHD business owners. You can swap skills, plan in small steps, and work alongside others.</p>
          <p>First, make the app comfortable for you: colours, text size, fonts, and movement.</p>
          <div class="actions">
            <a class="btn btn-primary" href="#/settings">${icon('settings')}Open comfort settings</a>
            <a class="btn" href="#/profile">${icon('profile')}Fill in my profile</a>
            <button type="button" class="btn btn-quiet" data-action="dismiss-welcome">Hide this message</button>
          </div>
        </section>`}

      <section class="card" aria-labelledby="energy-h">
        ${heading('energy-h', 'battery-some', 'How much energy do you have right now?')}
        <p class="muted">This only changes what we suggest. It is private and you can change it any time.</p>
        <fieldset class="choices">
          <legend class="visually-hidden">Energy level</legend>
          ${Object.entries(ENERGY).map(([key, e]) => `
            <label class="choice choice-energy energy-${key}">
              <input type="radio" name="energy" id="energy-${key}" value="${key}" ${energy === key ? 'checked' : ''}>
              <span class="choice-icon">${icon(ENERGY_ICON[key], 60)}</span>
              <span class="choice-title">${e.label}</span>
              <span class="choice-hint">${e.hint}</span>
            </label>`).join('')}
        </fieldset>
      </section>

      <section class="card card-feature" aria-labelledby="next-h">
        ${heading('next-h', 'focus', 'Your next small step')}
        ${renderNext(next, energy)}
      </section>

      <div class="grid-2">
        <section class="card" aria-labelledby="dl-h">
          ${heading('dl-h', 'calendar', 'Coming up')}
          ${deadlines.length ? `<ul class="plain-list">${deadlines.map((t) => {
            const soft = softDeadline(t.deadline, s.settings.bufferDays);
            return `<li class="list-icon">${icon('calendar', 28)}<span><strong>${esc(t.title)}</strong><br><span class="muted">Aim for ${fmtDate(soft)} (${relDays(soft)})</span></span></li>`;
          }).join('')}</ul>` : '<p class="muted">No deadlines. Nice and open.</p>'}
          <p><a class="link-arrow" href="#/plan">Go to planner ${icon('later', 20)}</a></p>
        </section>

        <section class="card" aria-labelledby="cw-h">
          ${heading('cw-h', 'cowork', 'Your co-work sessions')}
          ${joined.length ? `<ul class="plain-list">${joined.slice(0, 2).map((x) => `
            <li class="list-icon">${icon('clock', 28)}<span><strong>${esc(x.title)}</strong> with ${esc(x.host)}<br><span class="muted">${fmtDateTime(x.start)}</span></span></li>`).join('')}</ul>`
            : '<p class="muted">You have not joined a session yet. Working next to someone can make starting easier.</p>'}
          <p><a class="link-arrow" href="#/cowork">Find a session ${icon('later', 20)}</a></p>
        </section>
      </div>

      <section class="card" aria-labelledby="sw-h">
        ${heading('sw-h', 'swap', 'Skill swaps')}
        ${incoming.length
          ? `<p class="with-icon-inline">${icon('inbox', 28)} You have <strong>${incoming.length} ${incoming.length === 1 ? 'request' : 'requests'}</strong> waiting for your reply. There is no deadline to answer.</p>`
          : '<p class="muted">No requests are waiting for you.</p>'}
        <p class="with-icon-inline">${icon('coin', 28)} Time credits: <strong>${s.credits}</strong> <span class="muted">(1 credit = 1 hour of help)</span></p>
        <p><a class="link-arrow" href="#/swap">Go to skill swap ${icon('later', 20)}</a></p>
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
