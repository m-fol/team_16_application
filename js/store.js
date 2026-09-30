// App state, persisted to localStorage. This is a prototype: everything lives in the browser
// and the community members below are fictional seed data.
import { ENERGY, uid, todayISO, addDaysISO, softDeadline } from './util.js';

const KEY = 'thrivetogether.v1';

function seed() {
  const today = todayISO();
  const now = new Date();
  const at = (days, hour, minute = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  const inHours = (h) => {
    const d = new Date(now.getTime() + h * 36e5);
    d.setMinutes(0, 0, 0);
    return d.toISOString();
  };
  const steps = (...texts) => texts.map((text) => ({ id: uid(), text, done: false }));

  return {
    version: 1,
    settings: {
      theme: 'system',
      textSize: 'm',
      font: 'hyperlegible',
      spacing: 'relaxed',
      motion: 'system',
      lowStim: false,
      bufferDays: 2,
      onboarded: false,
    },
    profile: {
      name: '',
      pronouns: '',
      business: '',
      offers: ['Proofreading', 'Spreadsheets'],
      needs: ['Website', 'Bookkeeping', 'Pricing advice'],
      comms: ['written', 'slow'],
      about: '',
      portfolio: '',
    },
    energy: null,
    skip: null,
    credits: 1,
    tasks: [
      {
        id: uid(), title: 'Send invoice to Harbour Café', energy: 'low', created: 1,
        deadline: addDaysISO(today, 3),
        steps: steps('Open last month\'s invoice', 'Change the date and invoice number', 'Export as PDF', 'Email it with the short template'),
      },
      {
        id: uid(), title: 'Update my price list', energy: 'some', created: 2,
        deadline: addDaysISO(today, 9),
        steps: steps('Write down what I charge now', 'Look at 3 similar businesses', 'Pick new prices (can change later)', 'Update the website text'),
      },
    ],
    members: [
      {
        id: 'm1', name: 'Sam Okafor', pronouns: 'they/them', business: 'Illustration & brand design',
        offers: ['Logo design', 'Illustration', 'Canva templates'], needs: ['Bookkeeping', 'Pricing advice'],
        comms: ['written', 'agenda', 'no-camera'],
        about: 'I work best in the mornings. Send me examples of what you like rather than describing it.',
        portfolio: '40+ brand identities for small shops and charities.',
      },
      {
        id: 'm2', name: 'Priya Nair', pronouns: 'she/her', business: 'Bookkeeping for small businesses',
        offers: ['Bookkeeping', 'Tax deadlines', 'Spreadsheets'], needs: ['Website', 'Social media posts'],
        comms: ['direct', 'no-smalltalk'],
        about: 'I like clear questions. A list of bullet points is perfect.',
        portfolio: 'Former accountant, 8 years self-employed.',
      },
      {
        id: 'm3', name: 'Jonah Weiss', pronouns: 'he/him', business: 'Web developer',
        offers: ['Website', 'Accessibility audits', 'Email setup'], needs: ['Copywriting', 'Illustration'],
        comms: ['written', 'slow'],
        about: 'I hyperfocus in the evenings, so replies may come late at night. No need to answer fast.',
        portfolio: 'Built sites for 25 sole traders. Open-source contributor.',
      },
      {
        id: 'm4', name: 'Ren Takahashi', pronouns: 'they/them', business: 'Copywriter & editor',
        offers: ['Copywriting', 'Proofreading', 'Pricing advice'], needs: ['Spreadsheets', 'Accountability buddy'],
        comms: ['voice-notes', 'direct'],
        about: 'Voice notes are easier for me than typing. Happy to receive text back.',
        portfolio: 'Website copy, grant applications and product descriptions.',
      },
      {
        id: 'm5', name: 'Alex Moreau', pronouns: 'she/they', business: 'Handmade ceramics shop',
        offers: ['Product photography', 'Packaging ideas', 'Accountability buddy'], needs: ['Website', 'Bookkeeping'],
        comms: ['written', 'no-camera', 'no-smalltalk'],
        about: 'I host the quiet morning co-work sessions. Cameras are always optional.',
        portfolio: 'Online shop with 300+ five-star reviews.',
      },
      {
        id: 'm6', name: 'Dev Patel', pronouns: 'he/him', business: 'Mobile app consultant',
        offers: ['Pitch deck review', 'Grant applications', 'Social media posts'], needs: ['Proofreading', 'Logo design'],
        comms: ['agenda', 'direct'],
        about: 'Please send an agenda before any call. I prefer 30-minute calls maximum.',
        portfolio: 'Helped 12 founders raise their first grant.',
      },
    ],
    swaps: [
      {
        id: uid(), memberId: 'm4', direction: 'in', status: 'pending', hours: 1, created: Date.now(),
        theyWant: 'Spreadsheets', theyGive: 'Pricing advice',
        message: 'Hi! Could you help me set up a simple spreadsheet to track my clients? In return I can look at your prices with you. About 1 hour. No rush.',
      },
      {
        id: uid(), memberId: 'm2', direction: 'out', status: 'accepted', hours: 1, created: Date.now() - 864e5,
        theyGive: 'Bookkeeping', iGive: 'credit',
        message: 'Hi Priya, could you show me how to categorise my expenses? I can pay with a time credit.',
      },
    ],
    sessions: [
      {
        id: uid(), title: 'Quiet focus hour', host: 'Alex Moreau', start: inHours(2), minutes: 60,
        formats: ['silent', 'camera-optional'], joined: false,
        description: 'Write what you are working on in the chat. Then we work in silence. Short check-in at the end — you can skip it.',
      },
      {
        id: uid(), title: 'Admin power hour', host: 'Priya Nair', start: at(1, 14), minutes: 60,
        formats: ['text-only', 'camera-optional'], joined: true,
        description: 'Invoices, emails, forms. Bring the task you have been avoiding. Nobody will ask what it is.',
      },
      {
        id: uid(), title: 'Pomodoro sprint', host: 'Jonah Weiss', start: at(1, 19), minutes: 90,
        formats: ['pomodoro', 'camera-optional'], joined: false,
        description: 'Three rounds of 25 minutes work and 5 minutes break. The timer is shared on screen.',
      },
      {
        id: uid(), title: 'Late-night body doubling', host: 'Ren Takahashi', start: at(2, 21, 30), minutes: 60,
        formats: ['silent', 'text-only'], joined: false,
        description: 'For night owls. Microphones stay off. Leave whenever you want.',
      },
      {
        id: uid(), title: 'Weekly business check-in circle', host: 'Sam Okafor', start: at(3, 17), minutes: 45,
        formats: ['talking', 'agenda', 'camera-optional'], joined: false,
        description: 'Each person gets 5 minutes: one win, one problem, one next step. The agenda is sent the day before. You can always pass.',
      },
    ],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === 1) return s;
    }
  } catch { /* storage blocked or corrupt: start fresh */ }
  return seed();
}

let state = load();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export const store = {
  get state() { return state; },
  update(fn) { fn(state); save(); },
  reset() { state = seed(); save(); },
  replace(next) { state = next; save(); },
};

export const findMember = (id) => state.members.find((m) => m.id === id);

export function currentEnergy(s = state) {
  return s.energy && s.energy.date === todayISO() ? s.energy.level : null;
}

export const fitsEnergy = (task, energy) => !energy || ENERGY[task.energy].rank <= ENERGY[energy].rank;

export function byUrgency(buffer) {
  return (a, b) => {
    const sa = softDeadline(a.deadline, buffer) || '9999';
    const sb = softDeadline(b.deadline, buffer) || '9999';
    return sa < sb ? -1 : sa > sb ? 1 : a.created - b.created;
  };
}

// The single next step to suggest: most urgent task that fits today's energy.
export function nextStep(s = state) {
  const energy = currentEnergy(s);
  const skipped = s.skip && s.skip.date === todayISO() ? s.skip.ids : [];
  const open = s.tasks.filter((t) => t.steps.some((st) => !st.done));
  const fits = open.filter((t) => fitsEnergy(t, energy)).sort(byUrgency(s.settings.bufferDays));
  for (const task of fits) {
    const step = task.steps.find((st) => !st.done && !skipped.includes(st.id));
    if (step) return { task, step };
  }
  return { none: true, hasOpen: open.length > 0, allFilteredOut: open.length > 0 && fits.length === 0 };
}

// Rough overlap between two skill lists ("website" matches "Website design").
export function overlap(a, b) {
  const norm = (x) => x.toLowerCase();
  return a.filter((x) => b.some((y) => norm(y).includes(norm(x)) || norm(x).includes(norm(y))));
}
