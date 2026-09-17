// Training center: beginner path, drills library, PPR tracker, programs, coaches.
import { CONFIG } from '../config.js';
import { icon, hydrateIcons } from '../icons.js';
import { escapeHtml as esc, toast } from '../site.js';

const $ = (id) => document.getElementById(id);
['fypTop', 'fypLink'].forEach((id) => { const el = $(id); if (el) el.href = CONFIG.findYourProgramUrl; });

/* ---------- beginner path ---------- */
const PATH = [
  { n: 'Learn the game', d: 'Rules, etiquette, scoring and gear. Get certified so you never look lost on league night.', link: '../certify/', cta: 'Get certified', icon: 'book' },
  { n: 'Build your throw', d: 'Stance, grip, swing, release, follow through. Same motion every time before you chase fancy shots.', link: '../certify/#/m/throw', cta: 'Throw basics', icon: 'flame' },
  { n: 'Add shots', d: 'Slides, blockers, rolls and airmails. Now you have answers when the board gets crowded.', link: '#drills', cta: 'Free drills', icon: 'target' },
  { n: 'Compete', d: 'Leagues, then local tournaments, then points events. Track your PPR so you can see it working.', link: '../play/', cta: 'Find a league', icon: 'trophy' },
];
$('roadmap').innerHTML = PATH.map((p, i) => `
  <a class="card hover" href="${p.link}">
    <div class="row between"><span class="card-icon">${icon(p.icon)}</span><span class="mono tiny muted">Stage ${i + 1}</span></div>
    <h3 class="card-title">${esc(p.n)}</h3>
    <p class="card-text">${esc(p.d)}</p>
    <span class="link mt-12">${esc(p.cta)} ${icon('arrow')}</span>
  </a>`).join('');

/* ---------- drills ---------- */
const DRILLS = [
  { t: 'Balance', c: 'Mechanics', d: 'Why your finish position decides where the bag lands.' },
  { t: 'Follow Through = Accuracy', c: 'Mechanics', d: 'The one fix that cleans up most misses.' },
  { t: 'Roll Bag Pt 1', c: 'Shots', d: 'How a roll actually works and when to use it.' },
  { t: 'Roll Bag Pt 2', c: 'Shots', d: 'Rolling around blockers without giving up points.' },
  { t: 'Reverse Cut', c: 'Shots', d: 'Cutting back the other way when the board is stacked.' },
  { t: 'Push vs Roll', c: 'Shots', d: 'Two ways past a blocker. Pick the right one.' },
  { t: 'Level 1 Blocker', c: 'Strategy', d: 'Where to put a blocker so it actually blocks.' },
  { t: 'Use the Bags in Front of You', c: 'Strategy', d: 'Read what is already on the board before you throw.' },
  { t: 'Aggressive vs Safe', c: 'Strategy', d: 'When to go for it and when to take the point.' },
  { t: 'Reverse Psychology', c: 'Mental', d: 'Staying level when the other team is hot.' },
];
const CATS = ['All', 'Mechanics', 'Shots', 'Strategy', 'Mental'];
let cat = 'All';
$('drillChips').innerHTML = CATS.map((c) => `<button class="tab${c === 'All' ? ' is-on' : ''}" type="button" data-c="${c}">${c}</button>`).join('');

function paintDrills() {
  const rows = DRILLS.filter((d) => cat === 'All' || d.c === cat);
  $('drillGrid').innerHTML = rows.map((d) => `
    <div class="vslot small">
      <div class="vs-frame hud"></div>
      <div class="vs-top"><span class="badge">${icon('video')} Tip of the week</span><span class="rec"><i></i> Coming soon</span></div>
      <div class="vs-play">${icon('play')}</div>
      <div class="vs-bottom"><div class="vs-title">${esc(d.t)}</div><div class="vs-film">${esc(d.d)}</div></div>
    </div>`).join('');
  hydrateIcons($('drillGrid'));
}
$('drillChips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-c]');
  if (!b) return;
  cat = b.dataset.c;
  $('drillChips').querySelectorAll('.tab').forEach((x) => x.classList.toggle('is-on', x === b));
  paintDrills();
});
paintDrills();

/* ---------- ppr tracker ---------- */
const KEY = 'luc.ppr';
const readPPR = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const writePPR = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v.slice(-40))); } catch { /* ignore */ } };

function paintPPR() {
  const list = readPPR();
  const vals = list.map((x) => x.ppr);
  const fmt = (n) => (n || 0).toFixed(1);
  $('tLatest').textContent = fmt(vals[vals.length - 1]);
  $('tAvg').textContent = fmt(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
  $('tBest').textContent = fmt(vals.length ? Math.max(...vals) : 0);
  $('tCount').textContent = vals.length ? `${vals.length} session${vals.length === 1 ? '' : 's'} logged` : 'No sessions yet';
  const paths = $('spark').querySelectorAll('path');
  if (vals.length < 2) { paths.forEach((p) => p.setAttribute('d', '')); return; }
  const max = Math.max(...vals, 6);
  const step = 300 / (vals.length - 1);
  const pts = vals.map((v, i) => [i * step, 86 - (v / max) * 76]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  paths[1].setAttribute('d', line);
  paths[0].setAttribute('d', `${line} L300 90 L0 90 Z`);
}

$('tAdd').addEventListener('click', () => {
  const p = parseFloat($('tPts').value);
  const r = parseFloat($('tRounds').value);
  if (!(p >= 0) || !(r > 0)) { toast('Put in points and rounds first.', 'info'); return; }
  const ppr = Math.min(12, p / r);
  const list = readPPR();
  list.push({ ppr, at: Date.now() });
  writePPR(list);
  $('tPts').value = ''; $('tRounds').value = '';
  paintPPR();
  toast(`Logged a ${ppr.toFixed(1)} PPR session.`, 'trend');
});
$('tClear').addEventListener('click', () => {
  if (!readPPR().length) return;
  writePPR([]);
  paintPPR();
  toast('Sessions cleared.', 'refresh');
});
paintPPR();

/* ---------- programs ---------- */
const SHOP = CONFIG.shop;
const PROGRAMS = [
  { t: 'Elite Plan', p: '$20/mo', d: 'Self guided. The full training library, drills and breakdowns on your own schedule.', h: 'elite-plan-19-99-month' },
  { t: 'Compete Membership', p: '$45/mo', d: 'Structure and accountability. Training library, weekly drills, stat tracking and a monthly call with your coach.', h: 'compete-membership', hot: true },
  { t: 'Pro Plan with Richard Nyberg', p: '$100/mo', d: 'Ongoing 1 on 1 coaching with an ACL pro. A complete system, not a quick fix.', h: 'elite-plan-19-99-month-copy' },
  { t: 'Video Breakdown', p: '$25', d: 'Send a video of your throw and get a personalized breakdown back.', h: 'video-breakdown-24-99' },
  { t: '1 on 1 call with Richard', p: '$50', d: 'A live call to work through whatever is costing you points.', h: 'richard-1-on-1-add-on-call' },
];
$('programs').innerHTML = PROGRAMS.map((p) => `
  <a class="kit${p.hot ? ' is-mid' : ''}" href="${SHOP}/products/${p.h}" target="_blank" rel="noopener">
    ${p.hot ? '<span class="badge">Most popular</span>' : '<span class="badge muted">Level Up</span>'}
    <h3 class="display h-4">${esc(p.t)}</h3>
    <div class="mono amber" style="font-size:20px">${esc(p.p)}</div>
    <p class="text-2">${esc(p.d)}</p>
    <span class="link">See the plan ${icon('arrowUpRight')}</span>
  </a>`).join('');

/* ---------- coaches ---------- */
const COACHES = [
  { n: 'Richard Nyberg', nick: 'Mr. 11', d: 'Complete game development. Mechanics, strategy and the mental side.', img: 'coach-richard.jpg', alt: 'action-richard.jpg' },
  { n: 'Colin Hodet', nick: 'The Roll King', d: 'Precision and shot making. Building an arsenal, not one trick.', img: 'coach-colin.jpg', alt: 'action-colin.jpg' },
  { n: 'AJ Sims', nick: 'Competition focused', d: 'Direct, no fluff coaching built for tournament prep.', img: 'coach-aj.jpg', alt: 'action-aj.jpg' },
  { n: 'Hunter Thorson', nick: '1 on 1 coaching', d: 'Reading the board, choosing shots and performing under pressure.', img: 'coach-hunter.jpg', alt: 'action-hunter.jpg' },
];
$('coaches').innerHTML = COACHES.map((c) => `
  <article class="coach-card">
    <img src="../assets/img/${c.img}" alt="${esc(c.n)}" loading="lazy" width="480" height="480">
    <div class="cc-b">
      <h3>${esc(c.n)}</h3>
      <span class="nick">${esc(c.nick)}</span>
      <p class="card-text">${esc(c.d)}</p>
    </div>
  </article>`).join('');

hydrateIcons(document);
