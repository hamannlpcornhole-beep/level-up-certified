import { CONFIG } from './config.js';
import { url } from './site.js';
import { icon, hydrateIcons } from './icons.js';
import { MODULES } from './catalog.js';
import { mountCard } from './holo-card.js';

/* module grid */
const grid = document.getElementById('modGrid');
if (grid) {
  grid.innerHTML = MODULES.map((m) => `
    <a class="mod" href="${url(`certify/#/m/${m.id}`)}">
      <div class="mod-top"><span class="n">${String(m.n).padStart(2, '0')}</span><span>${m.min} min</span><span class="badge muted">${icon('video')} Video</span></div>
      <h3>${m.title}</h3>
      <p>${m.short}</p>
      <span class="mod-ico">${icon(m.icon)}</span>
    </a>`).join('') + `
    <a class="mod is-final" href="${url('certify/')}">
      <div class="mod-top"><span class="n">&#9733;</span><span>The finish</span><span class="badge">${icon('shield')} Card</span></div>
      <h3>Tap done. Get your card.</h3>
      <p>Your player card, ID and QR code unlock the second you finish.</p>
      <span class="mod-ico">${icon('medal')}</span>
    </a>`;
}

/* showcase card */
const showcase = document.getElementById('showcaseCard');
if (showcase) {
  mountCard(showcase, { name: 'Your Name', id: 'LU-26-DEMO01', league: 'Your League', expires: '2027-09-30', season: CONFIG.season }, { large: true, idle: true });
}

/* countdown */
const cd = document.getElementById('countdown');
if (cd) {
  const target = new Date(CONFIG.nextDrawing).getTime();
  const els = { d: cd.querySelector('[data-cd="d"]'), h: cd.querySelector('[data-cd="h"]'), m: cd.querySelector('[data-cd="m"]'), s: cd.querySelector('[data-cd="s"]') };
  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');
  const tick = () => {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    els.d.textContent = pad(d); els.h.textContent = pad(h); els.m.textContent = pad(m); els.s.textContent = pad(Math.floor(diff / 1000));
  };
  tick(); setInterval(tick, 1000);
}

/* 3D hero */
const hero = document.getElementById('hero');
const canvas = document.getElementById('heroCanvas');
const popLayer = document.getElementById('popLayer');
const hudScore = document.getElementById('hudScore');
const hudBags = document.getElementById('hudBags');

function pop(text, x, y, big = false) {
  const el = document.createElement('div');
  el.className = `score-pop${big ? ' big' : ''}`;
  el.textContent = text;
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  popLayer.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

if (hero && canvas && webglOk()) {
  import('./hero3d.js').then(({ startHero }) => {
    let shown = 0;
    const api = startHero({
      canvas,
      container: hero,
      logoUrl: url('assets/img/logo.png'),
      onReady: () => hero.classList.add('has-3d'),
      onRound: ({ phase, fourBagger }) => {
        if (phase === 'start') {
          shown = 0; hudScore.textContent = '0';
          hudBags.querySelectorAll('i').forEach((i) => { i.className = ''; });
        }
        if (phase === 'end' && fourBagger) {
          const r = hero.getBoundingClientRect();
          pop('Four bagger!', r.width * (r.width > 980 ? 0.7 : 0.5), r.height * (r.width > 980 ? 0.28 : 0.2), true);
        }
      },
      onScore: ({ pts, kind, index, total, screen }) => {
        const bag = hudBags.querySelectorAll('i')[index];
        if (bag) bag.className = kind === 'in' ? 'in' : 'on';
        const from = shown; const to = total; const t0 = performance.now();
        const run = (t) => { const p = Math.min(1, (t - t0) / 400); hudScore.textContent = String(Math.round(from + (to - from) * p)); if (p < 1) requestAnimationFrame(run); };
        requestAnimationFrame(run); shown = total;
        pop(`+${pts}`, screen.x, screen.y, kind === 'in');
      },
    });
    if (!api) hero.classList.remove('has-3d');
  }).catch(() => { /* keep the photo fallback */ });
}

hydrateIcons(document);
