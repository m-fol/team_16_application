// Comfort settings: sensory and reading preferences. Changes apply immediately.
import { store } from '../store.js';
import { esc, download } from '../util.js';
import { icon, pageHead } from '../icons.js';

const GROUPS = [
  {
    key: 'theme', legend: 'Colours', icon: 'sparkle',
    options: [
      ['system', 'Automatic'],
      ['calm', 'Light'],
      ['dark', 'Dark'],
      ['contrast', 'High contrast'],
    ],
  },
  {
    key: 'textSize', legend: 'Text size', icon: 'search',
    options: [['s', 'Standard'], ['m', 'Larger'], ['l', 'Large'], ['xl', 'Extra large']],
  },
  {
    key: 'font', legend: 'Font', icon: 'message',
    options: [
      ['hyperlegible', 'Atkinson Hyperlegible'],
      ['verdana', 'Verdana'],
      ['system', 'Device font'],
    ],
  },
  {
    key: 'spacing', legend: 'Spacing', icon: 'list',
    options: [['normal', 'Normal'], ['relaxed', 'Relaxed'], ['spacious', 'Spacious']],
  },
  {
    key: 'motion', legend: 'Movement', icon: 'pause',
    options: [
      ['system', 'Automatic'],
      ['reduce', 'None'],
    ],
  },
];

export default {
  title: 'Settings',

  render() {
    const st = store.state.settings;
    return `
      ${pageHead('settings', 'Settings')}

      <form id="settings-form">
        ${GROUPS.slice(0, 2).map((g) => group(g, st, true)).join('')}

        <details class="card disclosure">
          <summary>${icon('settings', 28)} More options</summary>
          ${GROUPS.slice(2).map((g) => group(g, st, false)).join('')}

          <fieldset class="field">
            <legend class="with-icon">${icon('eye', 26)}<span>Less to look at</span></legend>
            <div class="field-check">
              <input type="checkbox" id="lowStim" name="lowStim" ${st.lowStim ? 'checked' : ''}>
              <label for="lowStim">Low-stimulation mode</label>
            </div>
          </fieldset>

          <div class="field">
            <label for="bufferDays" class="with-icon">${icon('calendar', 26)}<span>Finish early by</span></label>
            <select id="bufferDays" name="bufferDays">
              ${[0, 1, 2, 3, 5, 7].map((n) => `<option value="${n}" ${st.bufferDays === n ? 'selected' : ''}>${n} ${n === 1 ? 'day' : 'days'}</option>`).join('')}
            </select>
          </div>

          <div class="field">
            <p class="with-icon"><strong>${icon('save', 26)}</strong><strong>Your data</strong></p>
            <p>Saved only on this device.</p>
            <div class="actions">
              <button type="button" class="btn" data-action="export">${icon('download')}Download</button>
              <button type="button" class="btn btn-quiet" data-action="reset">${icon('reset')}Start over</button>
            </div>
          </div>
        </details>
      </form>
    `;
  },

  mount(root, _params, ctx) {
    root.querySelector('#settings-form').addEventListener('change', (e) => {
      const { name, type, checked, value } = e.target;
      store.update((s) => {
        if (type === 'checkbox') s.settings[name] = checked;
        else if (name === 'bufferDays') s.settings[name] = Number(value);
        else s.settings[name] = value;
      });
      ctx.applySettings();
      ctx.announce('Saved.');
    });

    root.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'export') {
        download('thrivetogether-data.json', JSON.stringify(store.state, null, 2), 'application/json');
        ctx.announce('Downloaded.');
      }
      if (action === 'reset') {
        // eslint-disable-next-line no-alert
        if (!window.confirm('Start over? This deletes everything on this device.')) return;
        store.reset();
        ctx.applySettings();
        ctx.rerender('h1');
        ctx.announce('Reset.');
      }
    });
  },
};

// One group of big radio choices. Main groups are cards; the rest sit inside "More options".
function group(g, st, asCard) {
  return `
    <fieldset class="${asCard ? 'card' : 'field'}">
      <legend class="${asCard ? 'card-legend ' : ''}with-icon">${icon(g.icon, asCard ? 30 : 26)}<span>${g.legend}</span></legend>
      <div class="choices">
        ${g.options.map(([value, label, hint]) => `
          <label class="choice">
            <input type="radio" name="${g.key}" id="${g.key}-${value}" value="${value}" ${st[g.key] === value ? 'checked' : ''}>
            <span class="choice-title">${esc(label)}</span>
            ${g.key === 'theme' ? `<span class="swatch swatch-${value}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>` : ''}
            ${g.key === 'textSize' ? `<span class="size-sample size-${value}" aria-hidden="true">Aa</span>` : ''}
            ${hint ? `<span class="choice-hint">${esc(hint)}</span>` : ''}
          </label>`).join('')}
      </div>
    </fieldset>`;
}
