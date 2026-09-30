import { store, byUrgency, setStepDone, hoursText } from '../store.js';
import { esc, uid, ENERGY, relDays, softDeadline, splitLines } from '../util.js';
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

// Keep the add form open after adding, so several tasks can be added in a row.
let addOpen = false;

export default {
  title: 'Planner',

  render() {
    const s = store.state;
    const buffer = s.settings.bufferDays;
    const isOpen = (t) => t.steps.some((st) => !st.done) || !t.steps.length;
    const tasks = [...s.tasks].sort(byUrgency(buffer));
    const open = tasks.filter(isOpen);
    const finished = tasks.filter((t) => !isOpen(t));

    return `
      ${pageHead('plan', 'Planner')}

      <section aria-labelledby="list-h">
        ${heading('list-h', 'list', 'Your tasks')}
        ${open.length ? open.map((t) => taskCard(t, buffer)).join('') : '<p class="muted">No tasks yet.</p>'}
      </section>

      <details class="card disclosure" id="add-details" ${addOpen || !s.tasks.length ? 'open' : ''}>
        <summary id="add-h">${icon('plus', 28)} Add a task</summary>
        <form id="add-task" novalidate>
          <div class="field">
            <label for="t-title">Task</label>
            <input id="t-title" name="title" required autocomplete="off" aria-describedby="t-title-error">
            <p class="error" id="t-title-error" hidden>Add a name.</p>
          </div>
          <div class="field">
            <label for="t-steps">Steps (one per line)</label>
            <textarea id="t-steps" name="steps" rows="4"></textarea>
          </div>
          <div class="field">
            <label for="tpl">Or pick a list</label>
            <select id="tpl">
              <option value="">Choose…</option>
              ${Object.entries(TEMPLATES).map(([k, t]) => `<option value="${k}">${esc(t.title)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="t-deadline">Deadline</label>
            <input type="date" id="t-deadline" name="deadline">
          </div>
          <fieldset class="field">
            <legend>Energy</legend>
            <div class="choices">
              ${Object.entries(ENERGY).map(([k, e]) => `
                <label class="choice choice-energy energy-${k}">
                  <input type="radio" name="energy" value="${k}" ${k === 'some' ? 'checked' : ''}>
                  <span class="choice-icon" aria-hidden="true">${icon(ENERGY_ICON[k], 40)}</span>
                  <span class="choice-title">${e.label}</span>
                </label>`).join('')}
            </div>
          </fieldset>
          <button type="submit" class="btn btn-primary">${icon('plus')}Add task</button>
        </form>
      </details>

      ${finished.length ? `
        <details class="card disclosure">
          <summary>${icon('check-circle', 28)} Done (${finished.length})</summary>
          ${finished.map((t) => taskCard(t, buffer)).join('')}
        </details>` : ''}
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
      ctx.announce(`${t.steps.length} steps added.`);
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
      addOpen = true;
      ctx.rerender('#t-title');
      ctx.announce(`Added: ${title}.`);
    });

    root.addEventListener('change', (e) => {
      const { taskId, stepId } = e.target.dataset;
      if (!stepId) return;
      let delta = 0;
      store.update((s) => { delta = setStepDone(s, taskId, stepId, e.target.checked); });
      const task = store.state.tasks.find((t) => t.id === taskId);
      const left = task.steps.filter((st) => !st.done).length;
      ctx.rerender(left ? null : '#list-h');
      const earned = delta > 0 ? ` +${hoursText(delta)}.` : '';
      ctx.announce(left ? `${left} ${left === 1 ? 'step' : 'steps'} left.${earned}` : `${task.title} is done.${earned}`);
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
      ctx.announce(`Added: ${text}.`);
    });

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { taskId } = btn.dataset;
      if (btn.dataset.action === 'delete-task') {
        let removed; let index;
        store.update((s) => {
          index = s.tasks.findIndex((t) => t.id === taskId);
          [removed] = s.tasks.splice(index, 1);
        });
        ctx.rerender('#list-h');
        ctx.toast(`Deleted: ${removed.title}`, {
          undo: () => {
            store.update((s) => { s.tasks.splice(index, 0, removed); });
            ctx.rerender(`#task-${taskId}-h`);
          },
        });
      }
    });
  },
};

function taskCard(t, buffer) {
  const done = t.steps.filter((st) => st.done).length;
  const total = t.steps.length;
  const soft = softDeadline(t.deadline, buffer);
  return `
    <article class="card task" aria-labelledby="task-${t.id}-h">
      <div class="task-head">
        <h3 id="task-${t.id}-h" tabindex="-1">${esc(t.title)}</h3>
        <span class="tag tag-${t.energy}">${icon(ENERGY_ICON[t.energy], 26)}${ENERGY[t.energy].label}<span class="visually-hidden"> energy</span></span>
      </div>
      ${t.deadline
        ? `<p class="list-icon">${icon('calendar', 28)}<span><strong>Due ${relDays(soft)}</strong></span></p>`
        : ''}
      ${total ? `
        <div class="progress-row">
          <progress max="${total}" value="${done}" aria-labelledby="prog-${t.id}"></progress>
          <span id="prog-${t.id}">${done}/${total}</span>
        </div>` : ''}
      <ul class="steps">
        ${t.steps.map((st) => `
          <li class="${st.done ? 'is-done' : ''}">
            <input type="checkbox" id="st-${st.id}" data-task-id="${t.id}" data-step-id="${st.id}" ${st.done ? 'checked' : ''}>
            <label for="st-${st.id}">${esc(st.text)}</label>
          </li>`).join('')}
      </ul>
      <form class="inline-add" data-task-id="${t.id}">
        <label for="ns-${t.id}" class="visually-hidden">New step for ${esc(t.title)}</label>
        <input id="ns-${t.id}" autocomplete="off">
        <button type="submit" class="btn">${icon('plus')}Add step<span class="visually-hidden"> to ${esc(t.title)}</span></button>
      </form>
      <div class="actions">
        ${done < total ? `<a class="btn btn-primary" href="#/focus/${t.id}">${icon('focus')}Focus</a>` : ''}
        <button type="button" class="btn btn-quiet" data-action="delete-task" data-task-id="${t.id}">${icon('trash')}Delete</button>
      </div>
    </article>`;
}
