// Gear guide: bag speed tool, subnav highlighting, company directory.
import { CONFIG } from '../config.js';
import { icon, hydrateIcons } from '../icons.js';
import { escapeHtml as esc } from '../site.js';

const $ = (id) => document.getElementById(id);

/* collab links */
['collabTop', 'collabBtn'].forEach((id) => { const el = $(id); if (el) el.href = CONFIG.bgCollabUrl; });

/* ---------- subnav highlight ---------- */
const links = [...document.querySelectorAll('.subnav a')];
const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window && sections.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
}

/* ---------- bag speed ---------- */
const COND = { slick: 1.25, normal: 1, sticky: 0.72 };
let cond = 'slick';
const spd = $('spd');
const bag = $('spdBag');
const trail = $('spdTrail');

function paintSpeed() {
  const v = +spd.value;
  $('spdOut').textContent = String(v);
  const slide = (v / 10) * COND[cond];
  const endY = 330 - Math.min(255, slide * 250);
  bag.setAttribute('transform', `translate(110 ${endY.toFixed(0)})`);
  trail.setAttribute('d', `M110 330 L110 ${endY.toFixed(0)}`);
  const inHole = endY < 105 && endY > 62;
  const past = endY <= 62;
  const label = v <= 3 ? 'Grabby' : (v <= 6 ? 'Balanced' : 'Slick');
  const text = v <= 3
    ? 'Stops fast. Good for blockers and holding a spot in front of the hole. Hard to slide one in from deep.'
    : (v <= 6
      ? 'Slides when you want it to and stops when you need it. Easiest place for a new player to start.'
      : 'Slides a long way. Great on sticky boards or for cutting around blockers. On a fast board it runs off the back.');
  $('spdLabel').textContent = label;
  $('spdText').textContent = text;
  $('spdResult').textContent = inHole ? 'That one slides in for 3.' : (past ? 'Too much. That one slid off the back.' : 'That one stops on the board for 1.');
}
spd.addEventListener('input', paintSpeed);
$('cond').addEventListener('click', (e) => {
  const b = e.target.closest('[data-c]');
  if (!b) return;
  cond = b.dataset.c;
  $('cond').querySelectorAll('.tab').forEach((x) => x.classList.toggle('is-on', x === b));
  paintSpeed();
});
paintSpeed();

/* ---------- directory ---------- */
const DIR = [
  { n: 'BG Cornhole', u: 'https://www.bgcornhole.com/', c: ['bags', 'boards'], d: 'The Level Up collab partner. ACL Pro stamped bags plus tournament boards.', partner: true },
  { n: 'AllCornhole', u: 'https://allcornhole.com/', c: ['bags', 'boards'], d: 'Official ACL equipment partner. Bags across the Pro, Comp and Rec levels, plus approved boards.' },
  { n: 'Razor Cornhole Bags', u: 'https://razorcornhole.com/', c: ['bags'], d: 'Made in the USA. ACL Pro stamped series you see all over the tour.' },
  { n: 'Swag Bags Cornhole', u: 'https://swagbagscornhole.com/', c: ['bags'], d: 'Handcrafted ACL Pro bags with a long list of series to pick from.' },
  { n: 'Ultra Cornhole', u: 'https://ultracornhole.com/', c: ['bags'], d: 'San Diego built, big presence on the pro tour.' },
  { n: 'Killshots Cornhole', u: 'https://killshotscornhole.com/', c: ['bags'], d: 'ACL Pro stamped bags with a following in broadcast events.' },
  { n: 'Reynolds Bags', u: 'https://reynoldsbags.com/', c: ['bags', 'boards'], d: 'Started by pro player Jeff Reynolds. Pro, Comp and Rec lines, plus boards.' },
  { n: 'Nola Bags', u: 'https://www.nolabags.com/', c: ['bags'], d: 'Louisiana made, handcrafted ACL Pro bags.' },
  { n: 'Underworld Cornhole', u: 'https://www.ucbagco.com/', c: ['bags'], d: 'Family run shop making handcrafted Pro and Comp bags.' },
  { n: 'Titan', u: 'https://titancornholebags.com/', c: ['bags', 'boards', 'gear'], d: 'Bags, tournament boards and accessories, including the ScoreMate score tower.' },
  { n: 'Escalade Sports', u: 'https://www.escaladesports.com/collections/american-cornhole-league', c: ['boards'], d: 'Officially licensed ACL boards from mini all the way to pro.' },
  { n: 'Dirty Bags Cornhole', u: 'https://dirtybagscornhole.com/', c: ['bags', 'boards'], d: 'ACL licensed shop with house brand boards and bags.' },
  { n: 'West Georgia Cornhole', u: 'https://westgeorgiacornhole.com/', c: ['boards'], d: 'USA made competition boards, including portable tailgate models.' },
  { n: 'AJJ Cornhole', u: 'https://www.ajjcornhole.com/', c: ['boards'], d: 'Backyard and family boards with a huge design catalog.' },
  { n: 'GoSports', u: 'https://www.playgosports.com/collections/cornhole', c: ['boards'], d: 'Mainstream backyard and portable sets you can find just about anywhere.' },
  { n: 'Toss Brightz LED lights', u: 'https://brightz.com/products/toss-brightz', c: ['gear'], d: 'Weather resistant LED kit that lights the board edges and the hole for night play.' },
  { n: 'ZUCA rolling bags', u: 'https://shop.iplayacl.com/collections/zuca-bags-accessories', c: ['gear'], d: 'The ACL\'s official rolling bag and backpack supplier, sold through the ACL shop.' },
  { n: 'Titan ScoreMate 21', u: 'https://titancornholebags.com/ScoreMate21', c: ['gear'], d: 'A 44 inch score tower with cup holders and a tablet slot.' },
  { n: 'ACA bag tote', u: 'https://www.playcornhole.org/products/cornhole-bean-bag-tote-carry-case', c: ['gear'], d: 'Water repellent tote that holds up to 8 bags.' },
];
const FILTERS = [
  { k: 'all', label: 'All' },
  { k: 'bags', label: 'Bags' },
  { k: 'boards', label: 'Boards' },
  { k: 'gear', label: 'Accessories' },
];
let filter = 'all';

$('dirChips').innerHTML = FILTERS.map((f) => `<button class="tab${f.k === 'all' ? ' is-on' : ''}" type="button" data-f="${f.k}">${f.label}</button>`).join('');

function paintDir() {
  const q = $('dirSearch').value.trim().toLowerCase();
  const rows = DIR.filter((d) => (filter === 'all' || d.c.includes(filter)) && (!q || (d.n + d.d).toLowerCase().includes(q)));
  $('dirGrid').innerHTML = rows.length ? rows.map((d) => `
    <article class="dir${d.partner ? ' is-partner' : ''}">
      <div class="row between"><h3>${esc(d.n)}</h3>${d.partner ? '<span class="badge">Partner</span>' : ''}</div>
      <p>${esc(d.d)}</p>
      <div class="tags">${d.c.map((c) => `<span class="badge muted">${esc(FILTERS.find((f) => f.k === c)?.label || c)}</span>`).join('')}</div>
      <a class="link" href="${esc(d.u)}" target="_blank" rel="noopener">Visit ${icon('arrowUpRight')}</a>
    </article>`).join('')
    : '<div class="dir-empty">Nothing matches that. Try another word.</div>';
  $('dirGrid').innerHTML += `
    <article class="dir">
      <div class="row between"><h3>Make gear?</h3><span class="badge muted">Open spot</span></div>
      <p>If you build bags, boards or accessories and want to be listed or partner with Level Up, tell us.</p>
      <a class="link" href="mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent('Gear listing for Level Up Certified')}">Get listed ${icon('arrow')}</a>
    </article>`;
  $('dirCount').textContent = `${rows.length} of ${DIR.length} companies shown. Level Up isn't affiliated with these companies unless marked Partner.`;
  hydrateIcons($('dirGrid'));
}
$('dirChips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]');
  if (!b) return;
  filter = b.dataset.f;
  $('dirChips').querySelectorAll('.tab').forEach((x) => x.classList.toggle('is-on', x === b));
  paintDir();
});
$('dirSearch').addEventListener('input', paintDir);
paintDir();

hydrateIcons(document);
