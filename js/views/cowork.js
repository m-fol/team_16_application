// Co-work (body doubling): join short sessions where people work side by side.
import { store } from '../store.js';
import { esc, uid, FORMATS, fmtDateTime, todayISO, download } from '../util.js';
import { icon, pageHead, heading, FORMAT_ICON } from '../icons.js';

export default {
  title: 'Co-work',

  render() {
    const s = store.state;
    const now = Date.now();
    const sessions = s.sessions
      .filter((x) => new Date(x.start).getTime() + x.minutes * 6e4 > now)
      .sort((a, b) => a.start.localeCompare(b.start));

    return `
      ${pageHead('cowork', 'Co-work')}

      <section aria-labelledby="list-h">
        ${heading('list-h', 'calendar', 'Sessions')}
        ${sessions.length ? sessions.map(sessionCard).join('') : '<p class="muted">No sessions yet.</p>'}
      </section>

      <details class="card disclosure">
        <summary id="host-h">${icon('plus', 28)} Host a session</summary>
        <form id="host-form" novalidate>
          <div class="field">
            <label for="h-title">Name</label>
            <input id="h-title" name="title" autocomplete="off" aria-describedby="h-title-error">
            <p class="error" id="h-title-error" hidden>Add a name.</p>
          </div>
          <div class="field-row">
            <div class="field"><label for="h-date">Date</label><input type="date" id="h-date" name="date" value="${todayISO()}" min="${todayISO()}"></div>
            <div class="field"><label for="h-time">Start time</label><input type="time" id="h-time" name="time" value="18:00"></div>
            <div class="field">
              <label for="h-min">Length</label>
              <select id="h-min" name="minutes">
                ${[30, 45, 60, 90, 120].map((m) => `<option value="${m}" ${m === 60 ? 'selected' : ''}>${m} minutes</option>`).join('')}
              </select>
            </div>
          </div>
          <fieldset class="field">
            <legend>Format</legend>
            <div class="check-grid">
              ${Object.entries(FORMATS).map(([k, label]) => `
                <div class="field-check">
                  <input type="checkbox" id="fmt-${k}" name="formats" value="${k}" ${k === 'camera-optional' ? 'checked' : ''}>
                  <label for="fmt-${k}" class="with-icon-inline">${icon(FORMAT_ICON[k], 24)} ${esc(label)}</label>
                </div>`).join('')}
            </div>
          </fieldset>
          <button type="submit" class="btn btn-primary">${icon('plus')}Create session</button>
        </form>
      </details>
    `;
  },

  mount(root, _params, ctx) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const session = store.state.sessions.find((x) => x.id === btn.dataset.id);
      if (btn.dataset.action === 'join') {
        store.update(() => { session.joined = !session.joined; });
        ctx.rerender(`#join-${session.id}`);
        ctx.announce(session.joined
          ? `Joined ${session.title}.`
          : `Left ${session.title}.`);
      }
      if (btn.dataset.action === 'ics') {
        download(`${session.title.replace(/[^\w]+/g, '-')}.ics`, ics(session), 'text/calendar');
        ctx.announce('Calendar file downloaded.');
      }
    });

    const form = root.querySelector('#host-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = form.title.value.trim();
      if (!title) {
        root.querySelector('#h-title-error').hidden = false;
        form.title.setAttribute('aria-invalid', 'true');
        form.title.focus();
        return;
      }
      const start = new Date(`${form.date.value}T${form.time.value || '18:00'}`);
      const id = uid();
      store.update((s) => {
        s.sessions.push({
          id, title, host: s.profile.name.trim() || 'You', start: start.toISOString(),
          minutes: Number(form.minutes.value),
          formats: [...form.querySelectorAll('[name="formats"]:checked')].map((x) => x.value),
          description: '', joined: true,
        });
      });
      ctx.rerender(`#join-${id}`);
      ctx.announce(`Created: ${title}.`);
    });
  },
};

function sessionCard(x) {
  const startsSoon = new Date(x.start).getTime() - Date.now() < 36e5;
  return `
    <article class="card session ${x.joined ? 'is-joined' : ''}" aria-labelledby="s-${x.id}-h">
      <h3 id="s-${x.id}-h">${esc(x.title)}</h3>
      <p class="list-icon">${icon('clock', 28)}<span><strong>${fmtDateTime(x.start)}</strong> · ${x.minutes} min · ${esc(x.host)}
        ${startsSoon ? '<span class="tag tag-soon">Soon</span>' : ''}</span></p>
      <ul class="tags" aria-label="Format">${x.formats.map((f) => `<li class="tag">${icon(FORMAT_ICON[f], 22)}${esc(FORMATS[f])}</li>`).join('')}</ul>
      <div class="actions">
        <button type="button" class="btn ${x.joined ? '' : 'btn-primary'}" id="join-${x.id}" data-action="join" data-id="${x.id}" aria-pressed="${x.joined}">
          ${x.joined ? `${icon('check')}Joined` : `${icon('plus')}Join`}<span class="visually-hidden"> ${esc(x.title)}</span>
        </button>
        <button type="button" class="btn btn-quiet" data-action="ics" data-id="${x.id}">${icon('calendar')}Calendar<span class="visually-hidden"> (${esc(x.title)})</span></button>
      </div>
    </article>`;
}

function ics(x) {
  const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(new Date(x.start).getTime() + x.minutes * 6e4);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ThriveTogether//EN', 'BEGIN:VEVENT',
    `UID:${x.id}@thrivetogether`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(x.start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${x.title} (co-work)`, `DESCRIPTION:${x.description.replace(/\n/g, '\\n')}`,
    'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:Co-work starts in 15 minutes', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
