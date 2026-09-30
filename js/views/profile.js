// Profile: a "how I work" card and a portfolio instead of an interview.
import { store } from '../store.js';
import { esc, COMMS, splitList } from '../util.js';
import { icon, pageHead, heading } from '../icons.js';

export default {
  title: 'My profile',

  render() {
    const p = store.state.profile;
    return `
      ${pageHead('profile', 'My profile')}

      <form id="profile-form" class="card">
        ${heading('about-h', 'profile', 'About me')}
        <div class="field-row">
          <div class="field"><label for="p-name">Name</label><input id="p-name" name="name" value="${esc(p.name)}" autocomplete="name"></div>
          <div class="field"><label for="p-pronouns">Pronouns</label><input id="p-pronouns" name="pronouns" value="${esc(p.pronouns)}"></div>
        </div>
        <div class="field"><label for="p-business">My business</label><input id="p-business" name="business" value="${esc(p.business)}"></div>

        ${heading('skills-h', 'swap', 'Skills')}
        <div class="field">
          <label for="p-offers">I offer</label>
          <input id="p-offers" name="offers" value="${esc(p.offers.join(', '))}" aria-describedby="comma-hint">
        </div>
        <div class="field">
          <label for="p-needs">I need</label>
          <input id="p-needs" name="needs" value="${esc(p.needs.join(', '))}" aria-describedby="comma-hint">
          <p class="hint" id="comma-hint">Separate with commas.</p>
        </div>

        ${heading('work-h', 'message', 'How I like to work')}
        <fieldset class="field">
          <legend class="visually-hidden">Communication preferences</legend>
          <div class="check-grid">
            ${Object.entries(COMMS).map(([k, label]) => `
              <div class="field-check">
                <input type="checkbox" id="c-${k}" name="comms" value="${k}" ${p.comms.includes(k) ? 'checked' : ''}>
                <label for="c-${k}">${esc(label)}</label>
              </div>`).join('')}
          </div>
        </fieldset>
        <div class="field">
          <label for="p-about">Anything else</label>
          <textarea id="p-about" name="about" rows="3">${esc(p.about)}</textarea>
        </div>
        <div class="field">
          <label for="p-portfolio">My work (links)</label>
          <textarea id="p-portfolio" name="portfolio" rows="3">${esc(p.portfolio)}</textarea>
        </div>

        <button type="submit" class="btn btn-primary" id="save-profile">${icon('save')}Save</button>
      </form>

    `;
  },

  mount(root, _params, ctx) {
    const form = root.querySelector('#profile-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      store.update((s) => {
        Object.assign(s.profile, {
          name: form.name.value.trim(),
          pronouns: form.pronouns.value.trim(),
          business: form.business.value.trim(),
          offers: splitList(form.offers.value),
          needs: splitList(form.needs.value),
          comms: [...form.querySelectorAll('[name="comms"]:checked')].map((x) => x.value),
          about: form.about.value.trim(),
          portfolio: form.portfolio.value.trim(),
        });
      });
      ctx.rerender('#save-profile');
      ctx.announce('Saved.');
    });
  },
};
