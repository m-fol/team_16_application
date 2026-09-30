import { store, currentEnergy, fitsEnergy, byUrgency } from '../store.js';
import { esc, uid, ENERGY, fmtDate, relDays, softDeadline, splitLines } from '../util.js';
import { icon, pageHead, heading, ENERGY_ICON } from '../icons.js';

// Ready-made breakdowns for common business tasks that are hard to start.
const TEMPLATES = {
  invoice: {
    title: 'Send an invoice', energy: 'low',
    steps: ['Open the last invoice you sent', 'Change the client name, date and invoice number', 'Check the amount and your bank details', 'Export it as a PDF', 'Send it with a short message: “Hi, here is invoice #__ for __. Thank you!”'],
  },
  proposal: {
    title: 'Write a proposal for a client', energy: 'plenty',
    steps: ['Read the client’s message again and write down what they asked for', 'List 3 things you will deliver', 'Choose a price and a date', 'Write a rough draft. Messy is fine.', 'Read it once and fix only the obvious mistakes', 'Send it'],
  },
  social: {
    title: 'Post about my business', energy: 'some',
    steps: ['Pick one photo or piece of work', 'Write 2 or 3 sentences about it', 'Add 3 hashtags', 'Post it. You do not have to reply to comments today.'],
  },
  books: {
    title: 'Do my bookkeeping for this month', energy: 'some',
    steps: ['Download the bank statement', 'Put all receipts in one folder', 'Match money received to invoices', 'Write down anything unclear. Do not solve it now.', 'Save and close'],
  },
  reply: {
    title: 'Reply to a difficult email', energy: 'some',
    steps: ['Open the email and read it once', 'Write down in one sentence what they want', 'Write a 3-sentence reply', 'Ask someone in a swap to check it (optional)', 'Send it'],
  },
};

let filterToEnergy = false;

export default {
  title: 'Planner',

  render() {
    const s = store.state;
    const buffer = s.settings.bufferDays;
    const energy = currentEnergy(s);
    const isOpen = (t) => t.steps.some((st) => !st.done) || !t.steps.length;
    let tasks = [...s.tasks].sort(byUrgency(buffer));
    if (filterToEnergy && energy) tasks = tasks.filter((t) => fitsEnergy(t, energy));
    const open = tasks.filter(isOpen);
    const finished = tasks.filter((t) => !isOpen(t));

    return `
      ${pageHead('plan', 'Planner', `Big tasks, split into small steps. We suggest aiming <strong>${buffer} ${buffer === 1 ? 'day' : 'days'}</strong> before each real deadline, so there is room for bad days. <a href="#/settings">Change this</a>.`)}

      <section class="card" aria-labelledby="add-h">
        ${heading('add-h', 'plus', 'Add a task')}
        <form id="add-task" novalidate>
          <div class="field">
            <label for="tpl">Start from a template (optional)</label>
            <select id="tpl">
              <option value="">No template</option>
              ${Object.entries(TEMPLATES).map(([k, t]) => `<option value="${k}">${esc(t.title)}</option>`).join('')}
            </select>
            <p class="hint" id="tpl-hint">Choosing a template fills in the steps below. You can edit them.</p>
          </div>
          <div class="field">
            <label for="t-title">What is the task? <span class="req">(required)</span></label>
            <input id="t-title" name="title" required autocomplete="off" aria-describedby="t-title-error">
            <p class="error" id="t-title-error" hidden>Please write a name for the task.</p>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="t-deadline">Real deadline (optional)</label>
              <input type="date" id="t-deadline" name="deadline">
            </div>
            <div class="field">
              <label for="t-energy">Energy this needs</label>
              <select id="t-energy" name="energy">
                ${Object.entries(ENERGY).map(([k, e]) => `<option value="${k}" ${k === 'some' ? 'selected' : ''}>${e.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="field">
            <label for="t-steps">Steps, one per line</label>
            <textarea id="t-steps" name="steps" rows="5" aria-describedby="t-steps-hint"></textarea>
            <p class="hint" id="t-steps-hint">Tip: make the first step very small, like “open the file”.</p>
          </div>
          <button type="submit" class="btn btn-primary">${icon('plus')}Add task</button>
        </form>
      </section>

      <section aria-labelledby="list-h">
        ${heading('list-h', 'list', 'Your tasks')}
        ${energy ? `
          <div class="field-check">
            <input type="checkbox" id="filter-energy" ${filterToEnergy ? 'checked' : ''}>
            <label for="filter-energy">Only show tasks that fit my energy today (${ENERGY[energy].label})</label>
          </div>` : '<p class="muted">Tell us your energy on the <a href="#/today">Today page</a> to filter tasks by energy.</p>'}
        ${open.length ? open.map((t) => taskCard(t, buffer)).join('') : '<p class="muted">No open tasks here.</p>'}
        ${finished.length ? `
          <details class="card">
            <summary>${icon('check-circle', 28)} Finished tasks (${finished.length})</summary>
            ${finished.map((t) => taskCard(t, buffer)).join('')}
          </details>` : ''}
      </section>
    `;
  },

  mount(root, _params, ctx) {
    const form = root.querySelector('#add-task');

    root.querySelector('#tpl').addEventListener('change', (e) => {
      const t = TEMPLATES[e.target.value];
      if (!t) return;
      form.title.value = t.title;
      form.energy.value = t.energy;
      form.steps.value = t.steps.join('\n');
      ctx.announce(`Template added: ${t.steps.length} steps.`);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = form.title.value.trim();
      const error = root.querySelector('#t-title-error');
      if (!title) {
        error.hidden = false;
        form.title.setAttribute('aria-invalid', 'true');
        form.title.focus();
        return;
      }
      const steps = splitLines(form.steps.value).map((text) => ({ id: uid(), text, done: false }));
      store.update((s) => {
        s.tasks.push({ id: uid(), title, deadline: form.deadline.value || null, energy: form.energy.value, steps, created: Date.now() });
      });
      ctx.rerender('#list-h');
      ctx.announce(`Task added: ${title}.`);
    });

    root.addEventListener('change', (e) => {
      if (e.target.id === 'filter-energy') {
        filterToEnergy = e.target.checked;
        ctx.rerender('#filter-energy');
        return;
      }
      const { taskId, stepId } = e.target.dataset;
      if (!stepId) return;
      store.update((s) => { findStep(s, taskId, stepId).done = e.target.checked; });
      const task = store.state.tasks.find((t) => t.id === taskId);
      const left = task.steps.filter((st) => !st.done).length;
      ctx.rerender(left ? null : '#list-h');
      ctx.announce(left ? `${left} ${left === 1 ? 'step' : 'steps'} left in ${task.title}.` : `All steps done in ${task.title}. It moved to finished tasks.`);
    });

    root.addEventListener('submit', (e) => {
      if (!e.target.matches('.inline-add')) return;
      e.preventDefault();
      const input = e.target.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      const { taskId } = e.target.dataset;
      store.update((s) => { s.tasks.find((t) => t.id === taskId).steps.push({ id: uid(), text, done: false }); });
      ctx.rerender(`#${input.id}`);
      ctx.announce(`Step added: ${text}.`);
    });

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { taskId, stepId } = btn.dataset;
      if (btn.dataset.action === 'remove-step') {
        let removed; let index;
        store.update((s) => {
          const task = s.tasks.find((t) => t.id === taskId);
          index = task.steps.findIndex((st) => st.id === stepId);
          [removed] = task.steps.splice(index, 1);
        });
        ctx.rerender(`#ns-${taskId}`);
        ctx.toast(`Step removed: ${removed.text}`, {
          undo: () => {
            store.update((s) => { s.tasks.find((t) => t.id === taskId).steps.splice(index, 0, removed); });
            ctx.rerender(`#st-${stepId}`);
          },
        });
      }
      if (btn.dataset.action === 'delete-task') {
        let removed; let index;
        store.update((s) => {
          index = s.tasks.findIndex((t) => t.id === taskId);
          [removed] = s.tasks.splice(index, 1);
        });
        ctx.rerender('#list-h');
        ctx.toast(`Task deleted: ${removed.title}`, {
          undo: () => {
            store.update((s) => { s.tasks.splice(index, 0, removed); });
            ctx.rerender(`#task-${taskId}-h`);
          },
        });
      }
    });
  },
};

function findStep(s, taskId, stepId) {
  return s.tasks.find((t) => t.id === taskId).steps.find((st) => st.id === stepId);
}

function taskCard(t, buffer) {
  const done = t.steps.filter((st) => st.done).length;
  const total = t.steps.length;
  const soft = softDeadline(t.deadline, buffer);
  return `
    <article class="card task" aria-labelledby="task-${t.id}-h">
      <div class="task-head">
        <h3 id="task-${t.id}-h" tabindex="-1">${esc(t.title)}</h3>
        <span class="tag tag-${t.energy}">${icon(ENERGY_ICON[t.energy], 26)}Energy: ${ENERGY[t.energy].label}</span>
      </div>
      ${t.deadline
        ? `<p class="list-icon">${icon('calendar', 28)}<span><strong>Aim for ${fmtDate(soft)}</strong> (${relDays(soft)}).<br><span class="muted">Real deadline: ${fmtDate(t.deadline)}.</span></span></p>`
        : '<p class="muted">No deadline.</p>'}
      ${total ? `
        <div class="progress-row">
          <progress max="${total}" value="${done}" aria-labelledby="prog-${t.id}"></progress>
          <span id="prog-${t.id}">${done} of ${total} steps done</span>
        </div>` : ''}
      <ul class="steps">
        ${t.steps.map((st) => `
          <li class="${st.done ? 'is-done' : ''}">
            <input type="checkbox" id="st-${st.id}" data-task-id="${t.id}" data-step-id="${st.id}" ${st.done ? 'checked' : ''}>
            <label for="st-${st.id}">${esc(st.text)}</label>
            <button type="button" class="btn-icon" data-action="remove-step" data-task-id="${t.id}" data-step-id="${st.id}" aria-label="Remove step: ${esc(st.text)}">
              ${icon('close', 22)}
            </button>
          </li>`).join('')}
      </ul>
      <form class="inline-add" data-task-id="${t.id}">
        <label for="ns-${t.id}" class="visually-hidden">New step for ${esc(t.title)}</label>
        <input id="ns-${t.id}" autocomplete="off" placeholder="Add a step">
        <button type="submit" class="btn">${icon('plus')}Add step</button>
      </form>
      <div class="actions">
        ${done < total ? `<a class="btn btn-primary" href="#/focus/${t.id}">${icon('focus')}Focus on this</a>` : ''}
        <button type="button" class="btn btn-quiet" data-action="delete-task" data-task-id="${t.id}">${icon('trash')}Delete task</button>
      </div>
    </article>`;
}
