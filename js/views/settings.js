// Comfort settings: sensory and reading preferences. Changes apply immediately.
import { store } from '../store.js';
import { esc } from '../util.js';
import { icon, pageHead } from '../icons.js';

const GROUPS = [
  {
    key: 'theme', legend: 'Colours', icon: 'sparkle',
    options: [
      ['system', 'Automatic', 'auto'],
      ['calm', 'Light', 'today'],
      ['dark', 'Dark', 'moon'],
      ['contrast', 'High contrast', 'contrast'],
    ],
  },
  {
    key: 'textSize', legend: 'Text size', icon: 'text',
    options: [['s', 'Standard', 'text'], ['m', 'Larger', 'text'], ['l', 'Large', 'text'], ['xl', 'Extra large', 'text']],
  },
  {
    key: 'font', legend: 'Font', icon: 'pen',
    options: [
      ['hyperlegible', 'Atkinson Hyperlegible', 'text'],
      ['verdana', 'Verdana', 'text'],
      ['system', 'Device font', 'text'],
    ],
  },
  {
    key: 'spacing', legend: 'Spacing', icon: 'list',
    options: [['normal', 'Normal', 'lines-tight'], ['relaxed', 'Relaxed', 'lines-mid'], ['spacious', 'Spacious', 'lines-wide']],
  },
  {
    key: 'motion', legend: 'Movement', icon: 'motion-off',
    options: [
      ['system', 'Automatic', 'auto'],
      ['reduce', 'None', 'motion-off'],
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
              <label for="lowStim" class="with-icon-inline">${icon('eye', 24)} Low-stimulation mode</label>
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
        ${g.options.map(([value, label, iconName]) => `
          <label class="choice choice-iconed">
            <input type="radio" name="${g.key}" id="${g.key}-${value}" value="${value}" ${st[g.key] === value ? 'checked' : ''}>
            <span class="choice-icon" aria-hidden="true">${optionIcon(g.key, value, iconName)}</span>
            <span class="choice-title">${esc(label)}</span>
            ${g.key === 'theme' ? `<span class="swatch swatch-${value}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>` : ''}
          </label>`).join('')}
      </div>
    </fieldset>`;
}

// Text size and font options show a live "Aa" sample instead of a pictogram.
function optionIcon(key, value, iconName) {
  if (key === 'textSize') return `<span class="size-sample size-${value}">Aa</span>`;
  if (key === 'font') return `<span class="font-sample font-${value}">Aa</span>`;
  return icon(iconName, 30);
}
