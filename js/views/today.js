import { store, nextStep, currentEnergy, setStepDone, levelFor, hoursText, EARN, LEVELS } from '../store.js';
import { BADGES, badgeSvg, badgeList } from '../badges.js';
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
          return { at: `${soft}T23:59`, icon: 'plan', html: `<strong>${esc(t.title)}</strong><br><span class="muted">Due ${relDays(soft)}</span>` };
        }),
      ...s.sessions
        .filter((x) => x.joined && new Date(x.start).getTime() + x.minutes * 6e4 > now)
        .map((x) => ({ at: x.start, icon: 'cowork', html: `<strong>${esc(x.title)}</strong><br><span class="muted">${fmtDateTime(x.start)}</span>` })),
    ].sort((a, b) => new Date(a.at) - new Date(b.at)).slice(0, 3);
    const incoming = s.swaps.filter((w) => w.direction === 'in' && w.status === 'pending').length;

    return `
      ${pageHead('today', name ? `Hello, ${esc(name)}` : 'Hello')}

      ${s.settings.onboarded ? '' : `
        <section class="card card-note" aria-labelledby="welcome-h">
          ${heading('welcome-h', 'sparkle', 'Welcome!')}
          <div class="actions">
            <a class="btn btn-primary" href="#/settings">${icon('settings')}Set up colours and text</a>
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
        ${heading('next-h', 'focus', 'Next step')}
        ${renderNext(next)}
      </section>

      ${hoursCard(s.hours, s.badges)}

      <section class="card" aria-labelledby="up-h">
        ${heading('up-h', 'calendar', 'Coming up')}
        ${upcoming.length
          ? `<ul class="plain-list">${upcoming.map((u) => `<li class="list-icon">${icon(u.icon, 28)}<span>${u.html}</span></li>`).join('')}</ul>`
          : '<p class="muted">Nothing yet.</p>'}
        ${incoming ? `<p><a class="link-arrow" href="#/swap">${icon('inbox', 24)} ${incoming} swap ${incoming === 1 ? 'request' : 'requests'}</a></p>` : ''}
      </section>
    `;
  },

  mount(root, _params, ctx) {
    root.addEventListener('change', (e) => {
      if (e.target.name !== 'energy') return;
      const level = e.target.value;
      store.update((s) => { s.energy = { date: todayISO(), level }; });
      ctx.rerender(`#energy-${level}`);
      ctx.announce(`Energy: ${ENERGY[level].label}.`);
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
        let earned = 0;
        store.update((s) => {
          stepText = s.tasks.find((t) => t.id === taskId).steps.find((st) => st.id === stepId).text;
          earned = setStepDone(s, taskId, stepId, true);
        });
        ctx.rerender('#next-h');
        ctx.toast(`Done: ${stepText} · +${hoursText(earned)}`, {
          undo: () => {
            store.update((s) => { setStepDone(s, taskId, stepId, false); });
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
        ctx.announce('Skipped.');
      }
      if (action === 'unskip') {
        store.update((s) => { s.skip = null; });
        ctx.rerender('#next-h');
      }
    });
  },
};

function renderNext(next) {
  if (!next.none) {
    const { task, step } = next;
    const index = task.steps.indexOf(step) + 1;
    return `
      <p class="step-text">${esc(step.text)}</p>
      <p class="muted">${esc(task.title)} · ${index}/${task.steps.length}</p>
      <div class="actions">
        <button type="button" class="btn btn-primary" data-action="step-done" data-task-id="${task.id}" data-step-id="${step.id}">${icon('check')}Done</button>
        <button type="button" class="btn" data-action="step-skip" data-task-id="${task.id}" data-step-id="${step.id}">${icon('later')}Not now</button>
        <a class="btn" href="#/focus/${task.id}">${icon('focus')}Focus</a>
      </div>`;
  }
  if (!next.hasOpen) {
    return '<p>Nothing planned. <a href="#/plan">Add a task</a></p>';
  }
  if (next.allFilteredOut) {
    return '<p>Nothing fits your energy. Rest is okay.</p>';
  }
  return `<p>All skipped for now.</p>
    <div class="actions"><button type="button" class="btn" data-action="unskip">${icon('reset')}Show again</button></div>`;
}

// Hours: points you earn by doing things. A level name and one progress bar, nothing to lose.
function hoursCard(hours, badges) {
  const level = levelFor(hours);
  const toNext = level.next ? level.next.min - hours : 0;
  const pct = level.next ? Math.round(((hours - level.min) / (level.next.min - level.min)) * 100) : 100;
  return `
    <section class="card hours-card" aria-labelledby="hours-h">
      ${heading('hours-h', 'clock', 'Your hours')}
      <div class="hours-row">
        <p class="hours-total"><strong>${hours}</strong> <span>${hours === 1 ? 'hour' : 'hours'}</span></p>
        <p class="hours-level">${badgeSvg(BADGES[LEVELS.findIndex((l) => l.name === level.name)].id, 34)} ${level.name}</p>
      </div>
      ${level.next ? `
        <div class="progress-row">
          <progress max="100" value="${pct}" aria-labelledby="hours-next"></progress>
          <span id="hours-next">${hoursText(toNext)} to ${level.next.name}</span>
        </div>` : '<p>Top level reached.</p>'}
      <h3 class="badges-title">Badges</h3>
      ${badgeList(badges, hours)}
      <p class="muted">Step +${EARN.step} · Task +${EARN.task} · Co-work +${EARN.cowork} · Helping someone: +1 per hour</p>
    </section>`;
}
