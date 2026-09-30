// Skill swap: exchange skills hour-for-hour, or pay with hours (the app's points).
import { store, findMember, overlap, hoursText } from '../store.js';
import { esc, uid, COMMS, hoursLabel } from '../util.js';
import { icon, pageHead, heading, COMMS_ICON } from '../icons.js';

const STATUS = {
  pending: 'Waiting',
  accepted: 'Agreed',
  declined: 'Declined',
  done: 'Completed',
  withdrawn: 'Withdrawn',
};

const STATUS_ICON = {
  pending: 'clock', accepted: 'check', declined: 'close', done: 'check-circle', withdrawn: 'close',
};

const initials = (name) => name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

const DECLINE_REASONS = [
  'I do not have capacity right now.',
  'This is not a good match for my skills.',
  'I would prefer a different exchange.',
];

export default {
  title: 'Skill swap',

  render() {
    const s = store.state;
    const me = s.profile;
    const scored = s.members
      .map((m) => ({ m, forMe: overlap(m.offers, me.needs), forThem: overlap(me.offers, m.needs) }))
      .sort((a, b) => (b.forMe.length + b.forThem.length) - (a.forMe.length + a.forThem.length));
    const active = s.swaps.filter((w) => w.status === 'pending' || w.status === 'accepted');
    const past = s.swaps.filter((w) => !active.includes(w));

    return `
      ${pageHead('swap', 'Skill swap')}

      ${active.length ? `
        <section class="card card-feature" aria-labelledby="req-h">
          ${heading('req-h', 'inbox', 'Your swaps')}
          ${active.map(swapItem).join('')}
        </section>` : ''}

      <section aria-labelledby="all-h">
        ${heading('all-h', 'cowork', 'People')}
        <div class="field">
          <label for="search" class="with-icon-inline">${icon('search', 24)} Search</label>
          <input type="search" id="search" autocomplete="off">
        </div>
        <p id="result-count" aria-live="polite" class="visually-hidden"></p>
        <div class="member-grid" id="all-members">
          ${scored.map((x) => memberCard(x, 'all')).join('')}
        </div>
      </section>

      ${past.length ? `
        <details class="card disclosure">
          <summary>${icon('clock', 28)} Past swaps (${past.length})</summary>
          ${past.map(swapItem).join('')}
        </details>` : ''}

      <dialog id="request-dialog" aria-labelledby="dlg-h"></dialog>
    `;
  },

  mount(root, _params, ctx) {
    const dialog = root.querySelector('#request-dialog');
    let opener = null;

    // Filtering hides cards in place instead of re-rendering, so typing is never interrupted.
    const search = root.querySelector('#search');
    const filter = () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      root.querySelectorAll('#all-members .member').forEach((card) => {
        const ok = !q || card.dataset.search.includes(q);
        card.hidden = !ok;
        if (ok) shown += 1;
      });
      root.querySelector('#result-count').textContent = `${shown} ${shown === 1 ? 'person' : 'people'}`;
    };
    search.addEventListener('input', filter);

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'request') {
        opener = btn;
        dialog.innerHTML = requestForm(findMember(id));
        dialog.showModal();
        return;
      }
      if (action === 'close-dialog') {
        dialog.close();
        return;
      }
      if (action === 'fill-message') {
        fillMessage(dialog);
        ctx.announce('Message written. You can edit it.');
        return;
      }
      const swap = store.state.swaps.find((w) => w.id === id);
      if (!swap) return;
      const name = findMember(swap.memberId).name;
      if (action === 'accept') {
        store.update(() => { swap.status = 'accepted'; });
        ctx.rerender(`#swap-${id}`);
        ctx.announce(`You agreed to swap with ${name}.`);
      }
      if (action === 'decline') {
        const reason = root.querySelector(`#reason-${id}`).value;
        store.update(() => { swap.status = 'declined'; swap.reply = reason; });
        ctx.rerender(`#swap-${id}`);
        ctx.announce('Declined.');
      }
      if (action === 'withdraw') {
        store.update(() => { swap.status = 'withdrawn'; });
        ctx.rerender(`#swap-${id}`);
        ctx.announce('Request withdrawn.');
      }
      if (action === 'complete') {
        // You earn hours for the help you give, and spend them when you pay with hours.
        const paidWithHours = swap.direction === 'out' && swap.iGive === 'credit';
        store.update((s) => {
          swap.status = 'done';
          s.hours = Math.max(0, s.hours + (paidWithHours ? -swap.hours : swap.hours));
        });
        ctx.rerender(`#swap-${id}`);
        ctx.announce(paidWithHours ? `Done. You spent ${hoursText(swap.hours)}.` : `Done. +${hoursText(swap.hours)}.`);
      }
    });

    dialog.addEventListener('close', () => opener?.focus());

    dialog.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const memberId = f.dataset.member;
      const message = f.message.value.trim();
      if (!message) {
        f.querySelector('#msg-error').hidden = false;
        f.message.setAttribute('aria-invalid', 'true');
        f.message.focus();
        return;
      }
      const hours = Number(f.hours.value);
      if (f.iGive.value === 'credit' && store.state.hours < hours) {
        f.querySelector('#credit-error').hidden = false;
        f.iGive.focus();
        return;
      }
      store.update((s) => {
        s.swaps.unshift({
          id: uid(), memberId, direction: 'out', status: 'pending', hours, created: Date.now(),
          theyGive: f.theyGive.value, iGive: f.iGive.value, message,
        });
      });
      dialog.close();
      ctx.rerender('#req-h');
      ctx.announce(`Sent to ${findMember(memberId).name}.`);
    });
  },
};

function commsList(comms) {
  return comms.length ? `<ul class="comms">${comms.map((c) => `<li>${icon(COMMS_ICON[c], 22)}${esc(COMMS[c])}</li>`).join('')}</ul>` : '';
}

function memberCard({ m, forMe }, prefix) {
  const hId = `${prefix}-${m.id}-h`;
  return `
    <article class="card member" aria-labelledby="${hId}"
      data-search="${esc([m.name, m.business, ...m.offers, ...m.needs].join(' ').toLowerCase())}"
>
      ${forMe.length ? `<p class="match-badge">${icon('sparkle', 22)} Good match</p>` : ''}
      <h3 id="${hId}" class="member-name"><span class="avatar" aria-hidden="true">${esc(initials(m.name))}</span><span>${esc(m.name)} <span class="muted small">(${esc(m.pronouns)})</span></span></h3>
      <p class="muted">${esc(m.business)}</p>
      <dl class="skills">
        <dt>Offers</dt><dd>${m.offers.map((o) => `<span class="chip ${forMe.includes(o) ? 'chip-match' : ''}">${esc(o)}${forMe.includes(o) ? '<span class="visually-hidden"> (you need this)</span>' : ''}</span>`).join(' ')}</dd>
        <dt>Needs</dt><dd>${m.needs.map((n) => `<span class="chip">${esc(n)}</span>`).join(' ')}</dd>
      </dl>
      <details>
        <summary>${icon('message', 26)} How they work</summary>
        ${commsList(m.comms)}
        <p>${esc(m.about)}</p>
      </details>
      <button type="button" class="btn btn-primary" data-action="request" data-id="${m.id}">${icon('swap')}Ask to swap<span class="visually-hidden"> with ${esc(m.name)}</span></button>
    </article>`;
}

function swapItem(w) {
  const m = findMember(w.memberId);
  const give = (x) => (x === 'credit' ? hoursText(w.hours) : esc(x));
  const summary = w.direction === 'in'
    ? `<strong>${esc(m.name)}</strong> wants ${esc(w.theyWant)}, gives ${give(w.theyGive)}`
    : `You asked <strong>${esc(m.name)}</strong> for ${esc(w.theyGive)}, give ${give(w.iGive)}`;
  let actions = '';
  if (w.direction === 'in' && w.status === 'pending') {
    actions = `
      <div class="actions">
        <button type="button" class="btn btn-primary" id="swap-${w.id}" data-action="accept" data-id="${w.id}">${icon('check')}Accept</button>
      </div>
      <details class="decline">
        <summary>Decline</summary>
        <div class="field">
          <label for="reason-${w.id}">Reply</label>
          <select id="reason-${w.id}">${DECLINE_REASONS.map((r) => `<option>${esc(r)}</option>`).join('')}</select>
        </div>
        <button type="button" class="btn" data-action="decline" data-id="${w.id}">Send</button>
      </details>`;
  } else if (w.direction === 'out' && w.status === 'pending') {
    actions = `<div class="actions"><button type="button" class="btn btn-quiet" id="swap-${w.id}" data-action="withdraw" data-id="${w.id}">${icon('close')}Withdraw</button></div>`;
  } else if (w.status === 'accepted') {
    actions = `<div class="actions"><button type="button" class="btn" id="swap-${w.id}" data-action="complete" data-id="${w.id}">${icon('check-circle')}Mark done</button></div>`;
  }
  return `
    <div class="swap-item" ${actions ? '' : `id="swap-${w.id}" tabindex="-1"`}>
      <p><span class="status status-${w.status}">${icon(STATUS_ICON[w.status], 22)}${STATUS[w.status]}</span> · ${hoursLabel(w.hours)}</p>
      <p>${summary}</p>
      ${w.reply ? `<p class="muted">Reply: ${esc(w.reply)}</p>` : ''}
      ${actions}
    </div>`;
}

function requestForm(m) {
  const me = store.state.profile;
  const first = m.name.split(' ')[0];
  return `
    <form method="dialog" data-member="${m.id}" novalidate>
      <h2 id="dlg-h" class="with-icon">${icon('swap', 30)}<span>Swap with ${esc(m.name)}</span></h2>
      <div class="card card-note">
        <p class="with-icon-inline">${icon('info', 26)} <strong>Good to know</strong></p>
        ${commsList(m.comms)}
      </div>
      <div class="field">
        <label for="theyGive">You get</label>
        <select id="theyGive" name="theyGive">${m.offers.map((o) => `<option>${esc(o)}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label for="iGive">You give</label>
        <select id="iGive" name="iGive" aria-describedby="credit-error">
          ${me.offers.map((o) => `<option ${m.needs.includes(o) ? 'selected' : ''}>${esc(o)}</option>`).join('')}
          <option value="credit">My hours (${store.state.hours} left)</option>
        </select>
        <p class="error" id="credit-error" hidden>Not enough hours.</p>
      </div>
      <fieldset class="field">
        <legend>Time</legend>
        <div class="radio-row">
          ${[0.5, 1, 2].map((h) => `<label><input type="radio" name="hours" value="${h}" ${h === 1 ? 'checked' : ''}> ${hoursLabel(h)}</label>`).join('')}
        </div>
      </fieldset>
      <div class="field">
        <label for="message">Message</label>
        <textarea id="message" name="message" rows="6" aria-describedby="msg-error"></textarea>
        <p class="error" id="msg-error" hidden>Write a short message.</p>
        <button type="button" class="btn" data-action="fill-message" data-name="${esc(first)}" data-prefs="${esc(me.comms.map((c) => COMMS[c].toLowerCase()).join('; '))}">${icon('sparkle')}Write it for me</button>
      </div>
      <div class="actions">
        <button type="submit" class="btn btn-primary">${icon('send')}Send</button>
        <button type="button" class="btn btn-quiet" data-action="close-dialog">Cancel</button>
      </div>
    </form>`;
}

function fillMessage(dialog) {
  const f = dialog.querySelector('form');
  const btn = dialog.querySelector('[data-action="fill-message"]');
  const hours = hoursLabel(Number(f.hours.value));
  const give = f.iGive.value === 'credit' ? `${hours} from my hours` : f.iGive.value.toLowerCase();
  const prefs = btn.dataset.prefs ? `\n\nAbout me: ${btn.dataset.prefs}.` : '';
  f.message.value = `Hi ${btn.dataset.name},\n\nCould you help me with ${f.theyGive.value.toLowerCase()}? I can offer ${give}. About ${hours}.\n\nNo rush.${prefs}`;
  f.message.focus();
}
