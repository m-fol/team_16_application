// Comfort settings: sensory and reading preferences. Changes apply immediately.
import { store } from '../store.js';
import { esc, download } from '../util.js';
import { icon, pageHead, heading } from '../icons.js';

const GROUPS = [
  {
    key: 'theme', legend: 'Colours', icon: 'sparkle',
    options: [
      ['system', 'Match my device', 'Light or dark, following your system setting.'],
      ['calm', 'Calm light', 'Soft, warm background. Low glare.'],
      ['dark', 'Calm dark', 'Dark background, muted colours.'],
      ['contrast', 'High contrast', 'Black and white with strong outlines.'],
    ],
  },
  {
    key: 'textSize', legend: 'Text size', icon: 'search',
    options: [['s', 'Standard'], ['m', 'Larger'], ['l', 'Large'], ['xl', 'Extra large']],
  },
  {
    key: 'font', legend: 'Font', icon: 'message',
    options: [
      ['hyperlegible', 'Atkinson Hyperlegible', 'Designed so similar letters are easy to tell apart.'],
      ['verdana', 'Verdana', 'Wide letters. Many dyslexic readers like it.'],
      ['system', 'My device’s font'],
    ],
  },
  {
    key: 'spacing', legend: 'Line and letter spacing', icon: 'list',
    options: [['normal', 'Normal'], ['relaxed', 'Relaxed'], ['spacious', 'Spacious']],
  },
  {
    key: 'motion', legend: 'Movement', icon: 'pause',
    options: [
      ['system', 'Match my device'],
      ['reduce', 'No movement', 'Turns off all transitions.'],
    ],
  },
];

export default {
  title: 'Comfort settings',

  render() {
    const st = store.state.settings;
    return `
      ${pageHead('settings', 'Comfort settings', 'Make ThriveTogether feel right for your senses. Changes happen straight away and are saved on this device.')}

      <form id="settings-form">
        ${GROUPS.map((g) => `
          <fieldset class="card">
            <legend class="card-legend with-icon">${icon(g.icon, 30)}<span>${g.legend}</span></legend>
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
          </fieldset>`).join('')}

        <fieldset class="card">
          <legend class="card-legend with-icon">${icon('eye', 30)}<span>Less to look at</span></legend>
          <div class="field-check">
            <input type="checkbox" id="lowStim" name="lowStim" ${st.lowStim ? 'checked' : ''} aria-describedby="lowstim-hint">
            <label for="lowStim">Low-stimulation mode</label>
          </div>
          <p class="hint" id="lowstim-hint">Removes colour from labels and hides decorative extras.</p>
        </fieldset>

        <fieldset class="card">
          <legend class="card-legend with-icon">${icon('calendar', 30)}<span>Deadlines</span></legend>
          <div class="field">
            <label for="bufferDays">Aim to finish this many days before a real deadline</label>
            <select id="bufferDays" name="bufferDays">
              ${[0, 1, 2, 3, 5, 7].map((n) => `<option value="${n}" ${st.bufferDays === n ? 'selected' : ''}>${n} ${n === 1 ? 'day' : 'days'}</option>`).join('')}
            </select>
          </div>
        </fieldset>
      </form>

      <section class="card" aria-labelledby="data-h">
        ${heading('data-h', 'save', 'Your data')}
        <p>Everything is stored only in this browser. Nothing is sent anywhere.</p>
        <div class="actions">
          <button type="button" class="btn" data-action="export">${icon('download')}Download my data</button>
          <button type="button" class="btn btn-quiet" data-action="reset" aria-describedby="reset-hint">${icon('reset')}Start over</button>
        </div>
        <p class="hint" id="reset-hint">“Start over” removes your tasks, profile and settings. You will be asked to confirm.</p>
      </section>
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
        ctx.announce('Your data was downloaded as thrivetogether-data.json.');
      }
      if (action === 'reset') {
        // eslint-disable-next-line no-alert
        if (!window.confirm('Start over? This removes your tasks, profile and settings on this device.')) return;
        store.reset();
        ctx.applySettings();
        ctx.rerender('h1');
        ctx.announce('Everything was reset.');
      }
    });
  },
};
