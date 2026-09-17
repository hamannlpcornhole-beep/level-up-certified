// Giveaways: countdown, calendar, prizes, free entry, draft official rules.
import { CONFIG } from '../config.js';
import { icon, hydrateIcons } from '../icons.js';
import { escapeHtml as esc, toast } from '../site.js';
import { fmtDate } from '../store.js';

const $ = (id) => document.getElementById(id);

/* ---------- countdown ---------- */
const cd = $('countdown');
if (cd) {
  const target = new Date(CONFIG.nextDrawing).getTime();
  const els = ['d', 'h', 'm', 's'].map((k) => cd.querySelector(`[data-cd="${k}"]`));
  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');
  const tick = () => {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    els[0].textContent = pad(d); els[1].textContent = pad(h); els[2].textContent = pad(m); els[3].textContent = pad(Math.floor(diff / 1000));
  };
  tick(); setInterval(tick, 1000);
}

/* ---------- calendar ---------- */
const CAL = [
  { q: 'Drawing 1', when: fmtDate(CONFIG.nextDrawing), note: 'Sample date. Locked in before launch.', next: true },
  { q: 'Drawing 2', when: 'Date TBA', note: 'Winter drawing for everyone certified by then.' },
  { q: 'Drawing 3', when: 'Date TBA', note: 'Spring drawing, right as league season ramps up.' },
  { q: 'Drawing 4', when: 'Date TBA', note: 'Summer drawing heading into the big events.' },
];
$('calendar').innerHTML = CAL.map((c) => `
  <div class="tl-item${c.next ? ' is-next' : ''}">
    <span class="mono tiny ${c.next ? 'amber' : 'muted'}">${esc(c.q)}</span>
    <b class="display h-4">${esc(c.when)}</b>
    <p class="text-2 small">${esc(c.note)}</p>
    ${c.next ? '<span class="badge">Sample date</span>' : '<span class="badge muted">TBA</span>'}
  </div>`).join('');

/* ---------- prizes ---------- */
const PRIZES = [
  { t: 'Level Up x BG bags', d: 'A set of the ACL Pro stamped collab bags.', i: 'bag' },
  { t: 'A month of Pro coaching', d: 'One on one with a Level Up pro for a month.', i: 'grad' },
  { t: 'Level Up apparel pack', d: 'Tees, a hoodie and a hat from the shop.', i: 'star' },
  { t: 'Video breakdown', d: 'Send your throw in and get it picked apart.', i: 'video' },
  { t: '1 on 1 call', d: 'A live call with a Level Up coach.', i: 'phone' },
  { t: 'Certified only drops', d: 'Gear and surprises that only go out to certified players.', i: 'gift' },
];
$('prizes').innerHTML = PRIZES.map((p) => `
  <article class="prize">
    <span class="badge muted">Example prize</span>
    <span class="card-icon">${icon(p.i)}</span>
    <h3 class="card-title">${esc(p.t)}</h3>
    <p class="card-text">${esc(p.d)}</p>
  </article>`).join('');

/* ---------- free entry ---------- */
const STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
$('fState').innerHTML = `<option value="">Pick your state</option>${STATES.map((s) => `<option>${s}</option>`).join('')}`;

$('freeForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const err = $('freeErr');
  const name = $('fName').value.trim();
  const email = $('fEmail').value.trim();
  const state = $('fState').value;
  const age = $('fAge').checked;
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !state || !age) {
    err.textContent = 'Name, a real email, your state and the age box are all required.';
    err.classList.remove('hide');
    return;
  }
  err.classList.add('hide');
  $('freeForm').reset();
  $('fState').innerHTML = `<option value="">Pick your state</option>${STATES.map((s) => `<option>${s}</option>`).join('')}`;
  $('freeResult').innerHTML = `
    <div class="card mt-16">
      <span class="badge muted">Demo mode</span>
      <h3 class="card-title mt-12">Entry not saved</h3>
      <p class="card-text">This is a test build, so nothing was stored or sent. When the giveaways go live this form will file your free entry and email you a confirmation.</p>
    </div>`;
  toast('Demo mode: entry not saved.', 'info');
  hydrateIcons($('freeResult'));
});

/* ---------- draft official rules ---------- */
const RULES = [
  { t: '1. Sponsor', b: ['Level Up Cornhole LLC, [mailing address]. The sponsor runs the giveaway and picks the winners.'] },
  { t: '2. Eligibility', b: ['Open to legal residents of the [fifty United States and the District of Columbia] who are 18 or older, or 13 to 17 with a parent or guardian\'s permission.', 'Employees of the sponsor and their immediate families are not eligible.', 'Void where prohibited or restricted by law.'] },
  { t: '3. Entry period', b: ['The entry period for each drawing runs from [start date and time] to [end date and time], [time zone]. Entries received outside the period do not count.'] },
  { t: '4. How to enter', b: ['Automatic entry: complete Level Up Certified during the entry period and you get one entry for that drawing.', 'Free entry, no purchase necessary: submit the free entry form on this page during the entry period. A free entry has the same chance of winning as an automatic entry.', 'A purchase or payment does not improve your chance of winning.'] },
  { t: '5. Entry limits', b: ['One entry per person per drawing, no matter which method you use. Duplicate or automated entries are disqualified.'] },
  { t: '6. Prizes', b: ['Each drawing awards [number] prize(s). The prize and its approximate retail value are posted with each drawing at [prize page].', 'Prizes are not transferable and cannot be exchanged for cash, except that the sponsor may substitute a prize of equal or greater value.'] },
  { t: '7. Odds', b: ['Odds of winning depend on the number of eligible entries received for that drawing.'] },
  { t: '8. Winner selection and notification', b: ['Winners are picked at random from all eligible entries within [number] days after the entry period closes.', 'Winners are notified by email at the address on their entry and have [number] days to respond. If a winner does not respond in time, the sponsor may pick an alternate.'] },
  { t: '9. Publicity', b: ['Except where prohibited, accepting a prize allows the sponsor to use the winner\'s first name, last initial, city, state and league for promotion, without extra payment.'] },
  { t: '10. General conditions', b: ['The sponsor may disqualify anyone who tampers with the entry process or violates these rules.', 'If the giveaway cannot run as planned, the sponsor may cancel, change or suspend it and award prizes from the eligible entries received to that point.'] },
  { t: '11. Release and limitation of liability', b: ['By entering you release the sponsor from any claim or liability connected to the giveaway or to accepting or using a prize, to the extent allowed by law.'] },
  { t: '12. Taxes', b: ['Winners are responsible for all taxes on a prize. If a prize value requires it, the sponsor may issue tax forms as required by law.'] },
  { t: '13. Privacy', b: ['Entry information is used to run the giveaway and, if you opted in, to send Level Up email. See the Level Up privacy policy at [privacy policy link].'] },
  { t: '14. Winners list', b: ['To get the list of winners for a drawing, email [contact email] with the drawing name within [number] days after it closes.'] },
];
$('rulesDoc').innerHTML = RULES.map((r, i) => `
  <details${i === 0 ? ' open' : ''}>
    <summary>${esc(r.t)}</summary>
    <div class="doc-body">${r.b.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
  </details>`).join('');

$('printRules').addEventListener('click', () => {
  $('rulesDoc').querySelectorAll('details').forEach((d) => { d.open = true; });
  setTimeout(() => window.print(), 120);
});

hydrateIcons(document);
