// League partner page: sample dashboard, earnings example, QR poster kit, apply form.
import { CONFIG } from '../config.js';
import { icon, hydrateIcons } from '../icons.js';
import { url, copyText, toast, escapeHtml as esc } from '../site.js';
import { qrSVG, drawQR, rrect } from '../qr.js';

const $ = (id) => document.getElementById(id);

/* ---------- how it works ---------- */
const STEPS = [
  { t: 'Apply', d: 'Tell us your league name, size and how often you play. Takes two minutes.' },
  { t: 'Get your kit', d: 'We send your league link, a QR poster you can print, and the announcement text.' },
  { t: 'Players certify', d: `They scan the code, pay ${CONFIG.priceLabel} and go through the course on their phone.` },
  { t: 'Scan them in', d: 'On league night, scan the QR code on their card. Green means good to play.' },
  { t: 'Get paid', d: 'Every certification from your league is tracked to you. Your share is set in your partner agreement.' },
];
$('howSteps').innerHTML = STEPS.map((s, i) => `
  <li><span class="lv">${String(i + 1).padStart(2, '0')}</span>
    <div class="lv-body"><h3>${esc(s.t)}</h3><p class="text-2">${esc(s.d)}</p></div>
  </li>`).join('');

/* ---------- sample dashboard ---------- */
const ROSTER = [
  { n: 'J. Carter', id: 'LU-26-7KQ4MX', s: 'Verified', exp: 'Sep 2027' },
  { n: 'M. Lopez', id: 'LU-26-3HT9PW', s: 'Verified', exp: 'Aug 2027' },
  { n: 'T. Nguyen', id: 'LU-25-R8C2ND', s: 'Renew soon', exp: 'Oct 2026' },
  { n: 'A. Brooks', id: 'LU-26-Z4V6KE', s: 'Verified', exp: 'Jul 2027' },
  { n: 'D. Whitmore', id: 'LU-26-QP81LA', s: 'Verified', exp: 'Sep 2027' },
  { n: 'S. Patel', id: 'LU-25-KD73BX', s: 'Expired', exp: 'Mar 2026' },
  { n: 'R. Ellis', id: 'LU-26-MW52TC', s: 'Verified', exp: 'Jun 2027' },
  { n: 'B. Cruz', id: 'LU-26-FV39HD', s: 'Verified', exp: 'Sep 2027' },
];
const badgeFor = (s) => (s === 'Verified' ? 'green' : (s === 'Expired' ? 'red' : ''));
const panes = $('dashPanes');
const checked = new Set();

function rosterPane(filter = '') {
  const rows = ROSTER.filter((p) => (p.n + p.id).toLowerCase().includes(filter.toLowerCase()));
  return `
    <div class="field"><input class="input" id="rSearch" placeholder="Search players" value="${esc(filter)}"></div>
    <div class="dash-kpis mt-16">
      <div class="dash-kpi"><span>Certified</span><b class="tabular">${ROSTER.filter((p) => p.s !== 'Expired').length}</b></div>
      <div class="dash-kpi"><span>Renew soon</span><b class="tabular amber">${ROSTER.filter((p) => p.s === 'Renew soon').length}</b></div>
      <div class="dash-kpi"><span>Lapsed</span><b class="tabular red">${ROSTER.filter((p) => p.s === 'Expired').length}</b></div>
    </div>
    <div class="dash-table mt-12">
      <div class="dash-row"><span>Player</span><span>Cert ID</span><span>Status</span></div>
      ${rows.map((p) => `<div class="dash-row"><span class="who"><span class="av">${esc(p.n.replace('. ', '').slice(0, 2).toUpperCase())}</span>${esc(p.n)}</span><span class="id">${esc(p.id)}</span><span class="badge ${badgeFor(p.s)}">${esc(p.s)}</span></div>`).join('')
    || '<div class="dash-row"><span class="muted">Nobody by that name.</span></div>'}
    </div>`;
}

function checkinPane() {
  return `
    <div class="dash-kpis">
      <div class="dash-kpi"><span>Checked in</span><b class="tabular green" id="ciCount">${checked.size}</b></div>
      <div class="dash-kpi"><span>On the roster</span><b class="tabular">${ROSTER.length}</b></div>
      <div class="dash-kpi"><span>Not here yet</span><b class="tabular">${ROSTER.length - checked.size}</b></div>
    </div>
    <div class="dash-table mt-12">
      ${ROSTER.map((p, i) => `
        <div class="dash-row"><span class="who"><span class="av">${esc(p.n.replace('. ', '').slice(0, 2).toUpperCase())}</span>${esc(p.n)}</span>
        <span class="id">${esc(p.id)}</span>
        <button class="btn btn-sm ${checked.has(i) ? 'btn-green' : 'btn-ghost'}" type="button" data-ci="${i}">${checked.has(i) ? 'In' : 'Check in'}</button></div>`).join('')}
    </div>
    <p class="hint mt-12">On a real league night you would scan their card instead of tapping. Same result.</p>`;
}

function earningsPane() {
  return `
    <div class="calc">
      <div class="row-in"><label class="label" for="cPlayers">Players who certify <b class="mono amber" data-out="players">120</b></label><input type="range" id="cPlayers" min="10" max="500" step="5" value="120"></div>
      <div class="row-in"><label class="label" for="cPrice">Price per player <b class="mono amber" data-out="price">$1</b></label><input type="range" id="cPrice" min="1" max="10" step="1" value="1"></div>
      <div class="row-in"><label class="label" for="cShare">Example share <b class="mono amber" data-out="share">20%</b></label><input type="range" id="cShare" min="0" max="50" step="5" value="20"></div>
      <div class="out"><span class="mono tiny muted">Example league earnings per year</span><b data-out="total">$24</b></div>
      <p class="hint">Example only. Your actual share is set in your partner agreement.</p>
    </div>`;
}

function paintPane(tab) {
  if (tab === 'roster') panes.innerHTML = rosterPane();
  else if (tab === 'checkin') panes.innerHTML = checkinPane();
  else panes.innerHTML = earningsPane();
  hydrateIcons(panes);

  const search = $('rSearch');
  if (search) {
    search.addEventListener('input', () => {
      const v = search.value;
      panes.innerHTML = rosterPane(v);
      const again = $('rSearch');
      again.focus();
      again.setSelectionRange(v.length, v.length);
      paintPaneListeners();
    });
  }
  paintPaneListeners();
}

function paintPaneListeners() {
  panes.querySelectorAll('[data-ci]').forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.ci;
    if (checked.has(i)) checked.delete(i); else checked.add(i);
    paintPane('checkin');
  }));
  const sliders = panes.querySelectorAll('input[type="range"]');
  if (sliders.length) {
    const calc = () => {
      const players = +$('cPlayers').value;
      const price = +$('cPrice').value;
      const share = +$('cShare').value;
      panes.querySelector('[data-out="players"]').textContent = String(players);
      panes.querySelector('[data-out="price"]').textContent = `$${price}`;
      panes.querySelector('[data-out="share"]').textContent = `${share}%`;
      panes.querySelector('[data-out="total"]').textContent = `$${Math.round(players * price * (share / 100))}`;
    };
    sliders.forEach((s) => s.addEventListener('input', calc));
    calc();
  }
}

document.querySelectorAll('#dashTabs .tab').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#dashTabs .tab').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', String(x === b)); });
  paintPane(b.dataset.tab);
}));
paintPane('roster');

/* ---------- poster kit ---------- */
const nameEl = $('pName');
const codeEl = $('pCode');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
let autoCode = true;

async function paintPoster() {
  const league = nameEl.value.trim() || 'Your League';
  const code = slug(codeEl.value || league);
  const link = url(`certify/?league=${encodeURIComponent(code)}`);
  $('pLink').textContent = link;
  $('openLink').href = link;
  $('posterLeague').textContent = league;
  $('posterFoot').textContent = `${CONFIG.priceLabel} · good for a year · levelupcornhole.shop`;
  $('announceText').textContent = `Heads up ${league} players: you have to be Level Up Certified to play this season. It's ${CONFIG.priceLabel}, takes about 35 minutes on your phone, and covers the rules, etiquette, gear and how league night runs. Get it done before your first game: ${link}`;
  try { $('posterQr').innerHTML = await qrSVG(link); } catch { $('posterQr').innerHTML = ''; }
}
nameEl.addEventListener('input', () => { if (autoCode) codeEl.value = slug(nameEl.value); paintPoster(); });
codeEl.addEventListener('input', () => { autoCode = false; paintPoster(); });
paintPoster();

$('copyLink').addEventListener('click', async () => { await copyText($('pLink').textContent); toast('League link copied.', 'link'); });
$('copyAnnounce').addEventListener('click', async () => { await copyText($('announceText').textContent); toast('Announcement copied.', 'copy'); });

$('dlPoster').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const old = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = 'Building';
  try {
    const league = nameEl.value.trim() || 'Your League';
    const code = slug(codeEl.value || league);
    const link = url(`certify/?league=${encodeURIComponent(code)}`);
    if (document.fonts) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
    const W = 1080; const H = 1350;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#08080A'; g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W / 2, 120, 40, W / 2, 200, 900);
    glow.addColorStop(0, 'rgba(243,108,33,.5)'); glow.addColorStop(1, 'rgba(243,108,33,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    const logo = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = url('assets/img/logo.png'); });
    if (logo) g.drawImage(logo, W / 2 - 90, 70, 180, 180 * (logo.height / logo.width));
    g.textAlign = 'center';
    g.fillStyle = '#F6F4F0';
    g.font = 'italic 900 96px "Barlow Condensed", Impact, sans-serif';
    g.fillText('GET LEVEL UP', W / 2, 400);
    const grd = g.createLinearGradient(W * 0.25, 0, W * 0.75, 0);
    grd.addColorStop(0, '#FFB23F'); grd.addColorStop(1, '#F36C21');
    g.fillStyle = grd;
    g.fillText('CERTIFIED', W / 2, 490);
    g.fillStyle = '#CBC9C4';
    g.font = '600 38px "Barlow", sans-serif';
    g.fillText('before league night', W / 2, 552);
    const qs = 420;
    rrect(g, W / 2 - qs / 2 - 20, 610, qs + 40, qs + 40, 28);
    g.fillStyle = '#fff'; g.fill();
    await drawQR(g, link, W / 2 - qs / 2, 630, qs);
    g.fillStyle = '#FFB23F';
    g.font = '700 30px "JetBrains Mono", monospace';
    g.fillText(league.toUpperCase(), W / 2, 1140);
    g.fillStyle = '#8F8F97';
    g.font = '500 26px "JetBrains Mono", monospace';
    g.fillText(`${CONFIG.priceLabel}  ·  ABOUT 35 MIN  ·  GOOD FOR A YEAR`, W / 2, 1195);
    g.fillStyle = '#F36C21';
    g.font = '700 24px "JetBrains Mono", monospace';
    g.fillText(link.replace(/^https?:\/\//, ''), W / 2, 1250);
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `level-up-certified-poster-${code}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Poster saved. Print it and tape it up.', 'printer');
  } catch (err) { toast('That did not save. Try again.', 'alert'); }
  btn.disabled = false; btn.innerHTML = old;
  hydrateIcons(btn);
});

/* ---------- apply form ---------- */
$('applyForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = (id) => $(id).value.trim();
  const err = $('applyErr');
  if (!v('aLeague') || !v('aName') || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('aEmail')) || !v('aCity')) {
    err.textContent = 'Fill in your league, name, a real email and your city.';
    err.classList.remove('hide');
    return;
  }
  err.classList.add('hide');
  const body = [
    `League: ${v('aLeague')}`, `Contact: ${v('aName')}`, `Email: ${v('aEmail')}`, `City: ${v('aCity')}`,
    `Players: ${$('aPlayers').value}`, `Nights per week: ${$('aNights').value}`, '', v('aMsg'),
  ].join('\n');
  window.location.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(`Partner league: ${v('aLeague')}`)}&body=${encodeURIComponent(body)}`;
  toast('Opening your email with everything filled in.', 'mail', 4200);
});

hydrateIcons(document);
