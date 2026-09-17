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

/* 3D hero with a broadcast scorebug */
const hero = document.getElementById('hero');
const canvas = document.getElementById('heroCanvas');
const popLayer = document.getElementById('popLayer');
const sb = document.getElementById('scorebug');
const TEAMS = { o: 'Level Up', w: 'Challengers' };
const sbq = (sel) => (sb ? sb.querySelector(sel) : null);
let bagCount = { o: 0, w: 0 };

function setShot(text) {
  const el = sbq('[data-sb="shot"]');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('is-new');
  void el.offsetWidth;
  el.classList.add('is-new');
}

function setScore(team, value) {
  const el = sbq(`[data-score="${team}"]`);
  if (!el || el.textContent === String(value)) return;
  el.textContent = String(value);
  el.classList.remove('is-bump');
  void el.offsetWidth;
  el.classList.add('is-bump');
}

function resetBugRound(round) {
  bagCount = { o: 0, w: 0 };
  const r = sbq('[data-sb="round"]');
  if (r) r.textContent = String(round);
  ['o', 'w'].forEach((t) => {
    const pts = sbq(`[data-pts="${t}"]`);
    if (pts) pts.textContent = '0';
    sb?.querySelectorAll(`[data-bags="${t}"] i`).forEach((i) => { i.className = ''; });
  });
}

function pop(text, x, y, big = false) {
  if (!popLayer) return;
  const el = document.createElement('div');
  el.className = `score-pop${big ? ' big' : ''}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  popLayer.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

if (hero && canvas && webglOk()) {
  import('./hero3d.js').then(({ startHero }) => {
    const api = startHero({
      canvas,
      container: hero,
      logoUrl: url('assets/img/logo.png'),
      onReady: () => hero.classList.add('has-3d'),
      onRound: ({ phase, round, winner, diff, match, gameOver }) => {
        if (phase === 'start') { resetBugRound(round); setShot('Round under way'); return; }
        if (phase === 'end') {
          if (winner) {
            setScore(winner, match[winner]);
            setShot(`${TEAMS[winner]} scores ${diff}`);
            const row = sb?.querySelector(`.sb-row[data-team="${winner}"]`);
            row?.classList.add('is-hot');
            setTimeout(() => row?.classList.remove('is-hot'), 2200);
          } else {
            setShot('Wash. Nobody scores.');
          }
          if (gameOver) return;
          return;
        }
        if (phase === 'game') {
          setShot(`Game. ${TEAMS[winner]} takes it.`);
          const r = hero.getBoundingClientRect();
          pop('Game!', r.width * (r.width > 980 ? 0.62 : 0.5), r.height * (r.width > 980 ? 0.42 : 0.3), true);
          setTimeout(() => { setScore('o', 0); setScore('w', 0); setShot('New game. First to 21.'); }, 2600);
        }
      },
      onScore: ({ team, pts, kind, shot, roundPts, screen }) => {
        const dots = sb?.querySelectorAll(`[data-bags="${team}"] i`);
        const dot = dots && dots[bagCount[team]];
        if (dot) dot.className = kind;
        bagCount[team] = Math.min(3, bagCount[team] + 1);
        const ptsEl = sbq(`[data-pts="${team}"]`);
        if (ptsEl) ptsEl.textContent = String(roundPts[team]);
        setShot(`${TEAMS[team]} ${shot}${pts ? ` +${pts}` : ' no score'}`);
        if (pts) pop(`+${pts}`, screen.x, screen.y, kind === 'in');
      },
    });
    if (!api) hero.classList.remove('has-3d');
  }).catch(() => { /* keep the photo fallback */ });
}

hydrateIcons(document);
