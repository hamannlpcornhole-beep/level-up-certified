// The course app: enroll, demo checkout, dashboard, modules, the finish, the card.
import { CONFIG } from '../config.js';
import { MODULES, TOTAL_MIN, CERT_XP, levelFor } from '../catalog.js';
import { CONTENT } from './content.js';
import { load, update, reset, getLeagueCode, leagueName, makeCertId, fmtDate } from '../store.js';
import { url, icon, toast, openModal, closeModal, loadScript, copyText, escapeHtml as esc } from '../site.js';
import { hydrateIcons } from '../icons.js';
import { mountCard, exportCardPNG } from '../holo-card.js';

const app = document.getElementById('app');
const idx = (id) => MODULES.findIndex((m) => m.id === id);
const byId = (id) => MODULES.find((m) => m.id === id);
const doneCount = (s = load()) => MODULES.filter((m) => s.done[m.id]).length;
const allDone = (s = load()) => doneCount(s) === MODULES.length;
const nextModule = (s = load()) => MODULES.find((m) => !s.done[m.id]) || null;
const num = (n) => String(n).padStart(2, '0');
let cleanups = [];

function awardXP(amount, key) {
  const s = load();
  const keys = s.xpKeys || [];
  if (keys.includes(key)) return false;
  update((st) => {
    st.xpKeys = [...(st.xpKeys || []), key];
    st.xp = (st.xp || 0) + amount;
  });
  return true;
}

function confetti(opts = {}) {
  loadScript('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js').then(() => {
    if (!window.confetti) return;
    window.confetti({ particleCount: 90, spread: 74, origin: { y: 0.65 }, colors: ['#F36C21', '#FFB23F', '#FFFFFF'], ...opts });
  }).catch(() => {});
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function videoSlot(m, small = false) {
  return `<div class="vslot${small ? ' small' : ''}">
    <div class="vs-frame hud"></div>
    <div class="vs-top"><span class="badge">${icon('video')} Video ${m.video.slot}</span><span class="rec"><i></i> Filming soon</span></div>
    <div class="vs-play">${icon('play')}</div>
    <div class="vs-bottom">
      <div class="vs-title">${esc(m.video.title)}</div>
      <div class="vs-film"><b>What to film:</b> ${esc(m.video.film)}</div>
    </div>
  </div>`;
}

function xpRing(pct, label, sub) {
  const r = 52; const c = 2 * Math.PI * r;
  return `<div class="ring" style="width:132px;height:132px">
    <svg width="132" height="132" viewBox="0 0 132 132">
      <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F36C21"/><stop offset="1" stop-color="#FFB23F"/></linearGradient></defs>
      <circle class="ring-track" cx="66" cy="66" r="${r}" fill="none" stroke-width="9"/>
      <circle class="ring-fill" cx="66" cy="66" r="${r}" fill="none" stroke-width="9" stroke-dasharray="${c}" stroke-dashoffset="${c - (c * pct) / 100}"/>
    </svg>
    <div class="ring-label"><b class="display h-4">${label}</b><span class="mono tiny muted">${sub}</span></div>
  </div>`;
}

/* ------------------------------------------------------------- enroll */
function viewEnroll() {
  const s = load();
  const code = s.enrolled?.league || getLeagueCode();
  app.innerHTML = `
  <section class="enroll">
    <div class="wrap">
      <div class="split wide-left">
        <div class="enroll-copy">
          <span class="kicker">Level Up Certified ${CONFIG.season}</span>
          <h1 class="display h-1 enroll-h">Get certified <span class="grad">for ${CONFIG.priceLabel}</span></h1>
          <p class="lead">One course. Rules, etiquette, gear, apps and how to play. Finish it, tap I'm Done, and your player card is yours for a year.</p>
          <ul class="perk-list">
            <li>${icon('qr')}<span>Player card with your own ID and QR code</span></li>
            <li>${icon('scan')}<span>Leagues verify you in seconds at check-in</span></li>
            <li>${icon('gift')}<span>Entered in Level Up giveaways all year</span></li>
            <li>${icon('refresh')}<span>Good for 365 days, then renew</span></li>
          </ul>
          <div class="mini-mods">
            <div class="row between"><span class="mono tiny muted">What's inside</span><span class="mono tiny muted">${TOTAL_MIN} min total</span></div>
            <ol>${MODULES.map((m) => `<li><span class="mono">${num(m.n)}</span> ${esc(m.title)} <b class="mono tiny muted">${m.min}m</b></li>`).join('')}</ol>
          </div>
          ${CONFIG.showAclDesignation ? `<p class="acl-line" data-acl>${icon('shield')} ${esc(CONFIG.aclDesignation)}</p>` : ''}
        </div>

        <form class="enroll-form glass" id="enrollForm" novalidate>
          <h2 class="display h-4">Start your certification</h2>
          <div class="field">
            <label class="label" for="f-name">Name for your card</label>
            <input class="input" id="f-name" name="name" maxlength="28" autocomplete="name" placeholder="First and last" value="${esc(s.enrolled?.name || '')}" required>
            <p class="err hide" data-err="name"></p>
          </div>
          <div class="field">
            <label class="label" for="f-email">Email</label>
            <input class="input" id="f-email" name="email" type="email" autocomplete="email" placeholder="you@email.com" value="${esc(s.enrolled?.email || '')}" required>
            <p class="err hide" data-err="email"></p>
          </div>
          <div class="field">
            <label class="label" for="f-league">League code <em>optional</em></label>
            <input class="input mono" id="f-league" name="league" placeholder="YOURLEAGUE" value="${esc(code)}">
            <p class="hint league-hint${code ? '' : ' hide'}" data-league-hint>${code ? `Credit goes to ${esc(leagueName(code))}` : ''}</p>
          </div>
          <label class="check"><input type="checkbox" id="f-age" required><span>I'm 13 or older.</span></label>
          <label class="check"><input type="checkbox" id="f-terms" required><span>I'll play by the Level Up Player Pledge.</span></label>
          <p class="err hide" data-err="checks"></p>
          <button class="btn btn-primary btn-lg btn-block" type="submit">Continue to checkout <span class="tag">${CONFIG.priceLabel}</span></button>
          <p class="hint center">${CONFIG.demoMode ? 'Demo mode. Nothing is charged.' : 'Secure checkout. Cancel anytime before you pay.'}</p>
        </form>
      </div>
    </div>
  </section>

  <div class="modal" id="checkout" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Checkout">
    <div class="modal-box">
      <div class="modal-head"><span class="chip"><i class="dot"></i> ${CONFIG.demoMode ? 'Demo checkout' : 'Secure checkout'}</span><button class="icon-btn" type="button" data-close-modal aria-label="Close">${icon('x')}</button></div>
      <div class="modal-body" id="checkoutBody"></div>
    </div>
  </div>`;

  const form = document.getElementById('enrollForm');
  const leagueInput = document.getElementById('f-league');
  leagueInput.addEventListener('input', () => {
    const v = leagueInput.value.trim();
    const hint = form.querySelector('[data-league-hint]');
    hint.classList.toggle('hide', !v);
    if (v) hint.textContent = `Credit goes to ${leagueName(v.toLowerCase())}`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const okName = name.length >= 2;
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    const okChecks = document.getElementById('f-age').checked && document.getElementById('f-terms').checked;
    const setErr = (k, msg) => {
      const el = form.querySelector(`[data-err="${k}"]`);
      el.textContent = msg || '';
      el.classList.toggle('hide', !msg);
    };
    setErr('name', okName ? '' : 'Put the name you want on your card.');
    setErr('email', okEmail ? '' : 'We need a real email for your card link.');
    setErr('checks', okChecks ? '' : 'Check both boxes to keep going.');
    if (!okName || !okEmail || !okChecks) return;
    update((st) => {
      st.enrolled = { name, email, league: leagueInput.value.trim().toLowerCase(), at: new Date().toISOString() };
    });
    openCheckout();
  });
}

function openCheckout() {
  const body = document.getElementById('checkoutBody');
  body.innerHTML = `
    <div class="co-line"><div><b>Level Up Certified ${CONFIG.season}</b><span class="muted">Good for 365 days</span></div><b class="mono">${CONFIG.priceLabel}.00</b></div>
    <div class="co-line total"><b>Total</b><b class="mono">${CONFIG.priceLabel}.00</b></div>
    ${CONFIG.demoMode ? `<p class="placeholder-note">${icon('info')} <span>Demo mode. No card is charged and no card details are collected. This button just unlocks the course so you can look around.</span></p>` : ''}
    <button class="btn btn-primary btn-lg btn-block" type="button" id="payBtn">Pay ${CONFIG.priceLabel} ${CONFIG.demoMode ? '(demo)' : ''}</button>
    <p class="hint center">Payments run through Level Up Cornhole. You can cancel any time before you pay.</p>`;
  openModal('checkout');
  document.getElementById('payBtn').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Opening secure checkout`;
    setTimeout(() => {
      btn.classList.add('is-paid');
      btn.innerHTML = `${icon('checkCircle')} Payment confirmed`;
      update((st) => { st.paid = { at: new Date().toISOString(), demo: !!CONFIG.demoMode, order: `DEMO-${Math.floor(10000 + Math.random() * 89999)}` }; });
      setTimeout(() => {
        closeModal('checkout');
        confetti();
        toast("You're in. Let's get certified.", 'sparkles');
        go('#/dashboard');
      }, 700);
    }, 1200);
  });
}

/* ------------------------------------------------------------- dashboard */
function viewDashboard() {
  const s = load();
  const done = doneCount(s);
  const pct = Math.round((done / MODULES.length) * 100);
  const lvl = levelFor(s.xp || 0, !!s.cert);
  const next = nextModule(s);
  const minsLeft = MODULES.filter((m) => !s.done[m.id]).reduce((a, m) => a + m.min, 0);
  const checks = Object.values(s.checks || {});
  const right = checks.reduce((a, c) => a + (c.right || 0), 0);
  const asked = checks.reduce((a, c) => a + Object.keys(c.answered || {}).length, 0);

  app.innerHTML = `
  <section class="dash-wrap">
    <div class="wrap">
      <div class="dash-top">
        <div class="hud-card glass">
          <div class="hud-id">
            <span class="avatar">${esc((s.enrolled?.name || 'You').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase())}</span>
            <div>
              <h1 class="display h-3">${esc(s.enrolled?.name || 'Player')}</h1>
              <div class="row wrap-row">
                <span class="chip chip-orange">${icon('medal')} ${lvl.name}</span>
                ${s.enrolled?.league ? `<span class="chip">${icon('flag')} ${esc(leagueName(s.enrolled.league))}</span>` : ''}
                ${s.cert ? `<span class="chip chip-green"><i class="dot green"></i> Certified</span>` : ''}
              </div>
            </div>
          </div>
          ${xpRing(pct, `${done}/${MODULES.length}`, 'modules')}
          <div class="hud-stats">
            <div><span class="mono tiny muted">XP</span><b class="mono">${s.xp || 0}</b></div>
            <div><span class="mono tiny muted">Time left</span><b class="mono">${minsLeft}m</b></div>
            <div><span class="mono tiny muted">Quick checks</span><b class="mono">${asked ? `${right}/${asked}` : '0'}</b></div>
          </div>
          <div class="hud-next">
            <div class="xpbar"><i style="--p:${lvl.pct}%"></i></div>
            <span class="mono tiny muted">${lvl.next ? `Next: ${lvl.next}${lvl.nextAt ? ` at ${lvl.nextAt} XP` : ''}` : 'Top level'}</span>
          </div>
        </div>

        <div class="side-card glass">
          ${s.cert ? `
            <span class="badge green">${icon('checkCircle')} Certified</span>
            <div id="miniCard" class="mini-card"></div>
            <a class="btn btn-primary btn-sm btn-block" href="#/card">View my card</a>`
    : `
            <span class="badge muted">${icon('lock')} Locked</span>
            <div class="card-ghost" aria-hidden="true"><div class="ghost-inner">${icon('lock')}</div></div>
            <p class="muted small center">Your player card unlocks when you finish all ${MODULES.length} modules.</p>`}
        </div>
      </div>

      ${next ? `
      <a class="continue-card" href="#/m/${next.id}">
        <div class="cc-video">${videoSlot(next, true)}</div>
        <div class="cc-copy">
          <span class="mono tiny orange">${done === 0 ? 'Start here' : 'Pick up where you left off'}</span>
          <h2 class="display h-3">${num(next.n)}. ${esc(next.title)}</h2>
          <p class="text-2">${esc(next.short)}</p>
          <span class="btn btn-primary btn-sm">${done === 0 ? 'Start' : 'Continue'} ${icon('arrow', 'arrow')}</span>
        </div>
      </a>` : ''}

      <div class="track">
        <h2 class="display h-3 track-h">The course</h2>
        <ol class="track-list">
          ${MODULES.map((m) => {
    const isDone = !!s.done[m.id];
    const isNext = next && next.id === m.id;
    return `<li class="tnode${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}">
              <a href="#/m/${m.id}">
                <span class="tnode-dot">${isDone ? icon('check') : (isNext ? '' : icon(m.icon))}</span>
                <span class="tnode-body">
                  <span class="mono tiny muted">Module ${num(m.n)} &middot; ${m.min} min &middot; +${m.xp} XP</span>
                  <b class="display h-4">${esc(m.title)}</b>
                  <span class="text-2 small">${esc(m.short)}</span>
                </span>
                <span class="tnode-end">${isDone ? '<span class="badge green">Done</span>' : icon('chevronRight')}</span>
              </a>
            </li>`;
  }).join('')}
          <li class="tnode tfinish${allDone(s) ? ' is-ready' : ''}">
            <a href="${allDone(s) ? '#/done' : '#/dashboard'}"${allDone(s) ? '' : ' aria-disabled="true"'}>
              <span class="tnode-dot">${allDone(s) ? icon('flag') : icon('lock')}</span>
              <span class="tnode-body">
                <span class="mono tiny muted">The finish</span>
                <b class="display h-4">${allDone(s) ? "I'm Done. Certify me." : `Finish all ${MODULES.length} modules`}</b>
                <span class="text-2 small">${allDone(s) ? 'Tap here and your card is issued on the spot.' : `${MODULES.length - done} to go.`}</span>
              </span>
              <span class="tnode-end">${allDone(s) ? icon('arrow') : ''}</span>
            </a>
          </li>
        </ol>
      </div>
      ${CONFIG.demoMode ? `<p class="center mt-24"><a class="link small muted" href="#/reset">Reset demo progress</a></p>` : ''}
    </div>
  </section>`;

  if (s.cert) {
    const host = document.getElementById('miniCard');
    mountCard(host, s.cert, { idle: true }).catch(() => {});
  }
  hydrateIcons(app);
}

/* ------------------------------------------------------------- module */
let widgetsMod = null;
async function getWidgets() {
  if (widgetsMod !== null) return widgetsMod;
  try { widgetsMod = await import('./widgets.js'); } catch (err) { console.error('widgets failed to load', err); widgetsMod = false; }
  return widgetsMod;
}

function viewModule(id) {
  const m = byId(id);
  if (!m) { go('#/dashboard'); return; }
  const s = load();
  const c = CONTENT[id] || { intro: '', sections: [], takeaways: [], checks: [] };
  const i = idx(id);
  const prev = MODULES[i - 1]; const next = MODULES[i + 1];
  const isDone = !!s.done[id];

  if (!s.paid) { viewLocked(m, c); return; }

  app.innerHTML = `
  <section class="mod-wrap">
    <div class="mod-bar">
      <div class="wrap row">
        <a class="icon-btn" href="#/dashboard" aria-label="Back to dashboard">${icon('chevronLeft')}</a>
        <span class="mono tiny muted">Module ${num(m.n)} of ${num(MODULES.length - 1)}</span>
        <button class="btn btn-ghost btn-sm mod-list-btn" type="button" data-open-modal="modList">All modules</button>
      </div>
      <div class="mod-progress"><i style="--p:${(doneCount(s) / MODULES.length) * 100}%"></i></div>
    </div>

    <div class="wrap mod-grid">
      <aside class="mod-rail">
        <a class="rail-back link" href="#/dashboard">${icon('chevronLeft')} Dashboard</a>
        <div class="rail-progress"><div class="xpbar"><i style="--p:${(doneCount(s) / MODULES.length) * 100}%"></i></div><span class="mono tiny muted">${doneCount(s)} of ${MODULES.length} done</span></div>
        <ol class="rail-list">${MODULES.map((x) => `<li class="${x.id === id ? 'is-current' : ''}${s.done[x.id] ? ' is-done' : ''}"><a href="#/m/${x.id}"><span class="rl-dot">${s.done[x.id] ? icon('check') : num(x.n)}</span> ${esc(x.title)}</a></li>`).join('')}</ol>
      </aside>

      <main class="lesson">
        <header class="lesson-head">
          <span class="kicker">Module ${num(m.n)} / ${num(MODULES.length - 1)}</span>
          <h1 class="display h-1" tabindex="-1">${esc(m.title)}</h1>
          <div class="row wrap-row lesson-chips">
            <span class="chip">${icon('clock')} ${m.min} min</span>
            <span class="chip">${icon('bolt')} +${m.xp} XP</span>
            ${isDone ? '<span class="chip chip-green">' + icon('checkCircle') + ' Completed</span>' : ''}
          </div>
          <p class="lead">${esc(c.intro)}</p>
        </header>

        ${videoSlot(m)}

        <div class="lesson-body">
          ${c.sections.map((sec, n) => `
            <section class="lsec">
              ${sec.h ? `<h2 class="display h-3">${esc(sec.h)}</h2>` : ''}
              ${sec.html ? `<div class="prose">${sec.html}</div>` : ''}
              ${sec.callout ? `<div class="callout callout-${sec.callout.tone}">${icon(sec.callout.tone === 'orange' ? 'alert' : 'info')}<div>${sec.callout.html}</div></div>` : ''}
              ${sec.widget ? `<div class="wg-host" data-widget="${sec.widget}" data-n="${n}"></div>` : ''}
            </section>`).join('')}
          ${c.footer === 'rules' ? `
            <a class="rules-link card hover" href="${CONFIG.aclRulesUrl}" target="_blank" rel="noopener">
              <span class="card-icon">${icon('book')}</span>
              <div><h3 class="card-title">Read the full official ACL rules</h3><p class="card-text">Rules current as of the ${CONFIG.season} season. If anything here differs, the official ACL rules win.</p></div>
              ${icon('arrowUpRight')}
            </a>` : ''}
        </div>

        ${c.takeaways && c.takeaways.length ? `
        <div class="takeaways">
          <h3 class="display h-4">Know this</h3>
          <ul>${c.takeaways.map((t) => `<li>${icon('check')}<span>${esc(t)}</span></li>`).join('')}</ul>
        </div>` : ''}

        ${c.checks && c.checks.length ? `
        <div class="quickcheck" id="quickcheck">
          <div class="row between">
            <h3 class="display h-4">Quick check</h3>
            <span class="mono tiny muted" data-qc-score></span>
          </div>
          <p class="muted small">Optional. Each one you get right the first time is worth 10 XP.</p>
          <div class="qc-list">${c.checks.map((qq, n) => `
            <div class="qc" data-q="${n}">
              <p class="qc-q">${esc(qq.q)}</p>
              <div class="qc-opts">${qq.options.map((o, oi) => `<button type="button" class="opt" data-o="${oi}">${esc(o)}</button>`).join('')}</div>
              <p class="qc-why hide"></p>
            </div>`).join('')}</div>
          <button class="btn btn-ghost btn-sm" type="button" data-qc-retry>Try again</button>
        </div>` : ''}

        <div class="lesson-nav">
          ${prev ? `<a class="btn btn-ghost btn-sm" href="#/m/${prev.id}">${icon('chevronLeft')} ${esc(prev.title)}</a>` : '<span></span>'}
          ${next ? `<a class="btn btn-ghost btn-sm" href="#/m/${next.id}">${esc(next.title)} ${icon('chevronRight')}</a>` : ''}
        </div>
      </main>
    </div>

    <div class="complete-bar">
      <div class="wrap row between">
        <div class="cb-text">
          <b class="display h-5">${isDone ? 'Module complete' : esc(m.title)}</b>
          <span class="mono tiny muted">${isDone ? `${doneCount(s)} of ${MODULES.length} done` : `+${m.xp} XP when you finish`}</span>
        </div>
        <div class="row">
          ${isDone
    ? (next ? `<a class="btn btn-primary" href="#/m/${next.id}">Next module ${icon('arrow', 'arrow')}</a>` : (allDone(s) ? `<a class="btn btn-primary" href="#/done">I'm Done ${icon('arrow', 'arrow')}</a>` : `<a class="btn btn-primary" href="#/dashboard">Back to dashboard</a>`))
    : `<button class="btn btn-primary" type="button" data-complete${c.requires === 'pledge' && !s.pledge ? ' disabled' : ''}>Got it. Mark complete <span class="tag">+${m.xp}</span></button>`}
        </div>
      </div>
    </div>
  </section>

  <div class="modal" id="modList" aria-hidden="true" role="dialog" aria-modal="true" aria-label="All modules">
    <div class="modal-box">
      <div class="modal-head"><b class="display h-4">All modules</b><button class="icon-btn" type="button" data-close-modal aria-label="Close">${icon('x')}</button></div>
      <div class="modal-body"><ol class="rail-list">${MODULES.map((x) => `<li class="${x.id === id ? 'is-current' : ''}${s.done[x.id] ? ' is-done' : ''}"><a href="#/m/${x.id}" data-close-modal><span class="rl-dot">${s.done[x.id] ? icon('check') : num(x.n)}</span> ${esc(x.title)}</a></li>`).join('')}</ol></div>
    </div>
  </div>`;

  hydrateIcons(app);
  app.querySelector('.lesson-head h1')?.focus({ preventScroll: true });

  /* widgets */
  const ctx = {
    load, update, toast, url, icon,
    awardXP: (amount, key) => { if (awardXP(amount, key)) paintXP(); },
    onPledgeChange: (ok) => {
      const btn = app.querySelector('[data-complete]');
      if (btn && c.requires === 'pledge') btn.disabled = !ok;
    },
  };
  getWidgets().then((mod) => {
    if (!mod) {
      app.querySelectorAll('.wg-host').forEach((h) => { h.innerHTML = '<p class="placeholder-note">Interactive piece coming soon.</p>'; });
      return;
    }
    app.querySelectorAll('.wg-host').forEach((h) => {
      const clean = mod.renderWidget(h.dataset.widget, h, ctx);
      if (typeof clean === 'function') cleanups.push(clean);
      hydrateIcons(h);
    });
  });

  /* quick checks */
  const saved = (load().checks || {})[id] || { answered: {}, right: 0 };
  const scoreEl = app.querySelector('[data-qc-score]');
  const paintScore = () => {
    const st = (load().checks || {})[id] || { answered: {}, right: 0 };
    const answered = Object.keys(st.answered || {}).length;
    if (scoreEl) scoreEl.textContent = answered ? `${st.right} of ${answered} right` : '';
  };
  app.querySelectorAll('.qc').forEach((qcEl) => {
    const n = +qcEl.dataset.q;
    const qq = c.checks[n];
    const lock = (chosen, fromSaved) => {
      qcEl.querySelectorAll('.opt').forEach((b) => {
        b.disabled = true;
        if (+b.dataset.o === qq.a) b.classList.add('is-right');
        else if (+b.dataset.o === chosen) b.classList.add('is-wrong');
      });
      const why = qcEl.querySelector('.qc-why');
      why.innerHTML = `<strong class="${chosen === qq.a ? 'green' : 'amber'}">${chosen === qq.a ? 'Correct.' : 'Not quite.'}</strong> ${esc(qq.why)}`;
      why.classList.remove('hide');
      if (!fromSaved) {
        update((st) => {
          st.checks = st.checks || {};
          const cur = st.checks[id] || { answered: {}, right: 0 };
          cur.answered[n] = chosen;
          if (chosen === qq.a) cur.right = (cur.right || 0) + 1;
          st.checks[id] = cur;
        });
        if (chosen === qq.a && awardXP(10, `check-${id}-${n}`)) { toast('+10 XP', 'bolt', 1600); paintXP(); }
        paintScore();
      }
    };
    if (saved.answered && saved.answered[n] !== undefined) lock(saved.answered[n], true);
    qcEl.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => lock(+b.dataset.o, false)));
  });
  paintScore();
  app.querySelector('[data-qc-retry]')?.addEventListener('click', () => {
    update((st) => { if (st.checks) st.checks[id] = { answered: {}, right: 0 }; });
    render();
  });

  /* complete */
  app.querySelector('[data-complete]')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const before = levelFor(load().xp || 0, false).name;
    update((st) => { st.done[id] = new Date().toISOString(); });
    awardXP(m.xp, `module-${id}`);
    const after = levelFor(load().xp || 0, false).name;
    floatXP(btn, `+${m.xp} XP`);
    btn.disabled = true;
    setTimeout(() => {
      if (after !== before) {
        toast(`Level up. You're a ${after}.`, 'medal', 4200);
        confetti({ particleCount: 60, spread: 60 });
      } else {
        toast('Module complete.', 'checkCircle');
      }
      if (allDone()) { confetti({ particleCount: 140, spread: 90 }); go('#/done'); } else render();
    }, 520);
  });
}

function floatXP(from, text) {
  const r = from.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'xp-float';
  el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function paintXP() {
  const s = load();
  document.querySelectorAll('[data-xp-total]').forEach((el) => { el.textContent = String(s.xp || 0); });
}

function viewLocked(m, c) {
  app.innerHTML = `
  <section class="locked-wrap">
    <div class="wrap wrap-narrow">
      <a class="link" href="#/">${icon('chevronLeft')} Back</a>
      <span class="badge muted mt-16">${icon('lock')} Locked</span>
      <h1 class="display h-1">${esc(m.title)}</h1>
      <p class="lead">${esc(m.short)}</p>
      <div class="locked-video">${videoSlot(m)}<div class="locked-veil">${icon('lock')}</div></div>
      <h2 class="display h-4 mt-32">What's in this module</h2>
      <ul class="locked-list">${(c.sections || []).filter((x) => x.h).map((x) => `<li>${icon('check')}<span>${esc(x.h)}</span></li>`).join('')}</ul>
      <div class="row wrap-row mt-24">
        <a class="btn btn-primary btn-lg" href="#/">Unlock everything <span class="tag">${CONFIG.priceLabel}</span></a>
        <a class="link" href="${url('')}">See what's inside first</a>
      </div>
    </div>
  </section>`;
  hydrateIcons(app);
}

/* ------------------------------------------------------------- done + card */
function viewDone() {
  const s = load();
  if (!allDone(s)) { toast('Finish every module first.', 'info'); go('#/dashboard'); return; }
  app.innerHTML = `
  <section class="done-wrap">
    <div class="wrap wrap-narrow center">
      <span class="kicker plain">The finish</span>
      <h1 class="display h-1 mt-16">You made it.</h1>
      <p class="lead center" style="margin-inline:auto">Every module done. Your pledge is signed. One tap and you're Level Up Certified for the ${CONFIG.season} season.</p>
      <div class="done-grid">${MODULES.map((m) => `<div class="done-chip">${icon('check')}<span>${esc(m.title)}</span></div>`).join('')}</div>
      <div class="done-stats">
        <div><span class="mono tiny muted">XP earned</span><b class="display h-3">${s.xp || 0}</b></div>
        <div><span class="mono tiny muted">Modules</span><b class="display h-3">${MODULES.length}</b></div>
        <div><span class="mono tiny muted">Pledge</span><b class="display h-4">${esc(s.pledge?.name || 'Signed')}</b></div>
      </div>
      <button class="btn btn-primary btn-xl" type="button" id="certifyBtn">I'm Done. Certify me. ${icon('shield')}</button>
      <p class="hint">Your card is issued on the spot and you can download it right away.</p>
    </div>
  </section>
  <div class="reveal" id="reveal" aria-hidden="true">
    <div class="reveal-rings" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="reveal-inner">
      <p class="reveal-status mono" id="revealStatus">Checking your modules</p>
      <div class="reveal-id mono" id="revealId"></div>
      <div class="reveal-card" id="revealCard"></div>
      <h2 class="display h-2 reveal-h hide" id="revealH">You're <span class="grad">Level Up Certified.</span></h2>
      <a class="btn btn-primary btn-lg hide" id="revealGo" href="#/card">See my card ${icon('arrow', 'arrow')}</a>
    </div>
  </div>`;
  hydrateIcons(app);

  document.getElementById('certifyBtn').addEventListener('click', () => {
    const st = load();
    const issued = new Date().toISOString().slice(0, 10);
    const cert = {
      id: makeCertId(),
      name: st.enrolled?.name || 'Player',
      league: st.enrolled?.league ? leagueName(st.enrolled.league) : '',
      issued,
      expires: addDays(issued, CONFIG.validDays),
      season: CONFIG.season,
    };
    update((x) => { x.cert = cert; });
    awardXP(CERT_XP, 'cert');
    runReveal(cert);
  });
}

function runReveal(cert) {
  const reveal = document.getElementById('reveal');
  const statusEl = document.getElementById('revealStatus');
  const idEl = document.getElementById('revealId');
  const cardHost = document.getElementById('revealCard');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  reveal.classList.add('is-on');
  reveal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  const finish = () => {
    idEl.textContent = cert.id;
    document.getElementById('revealH').classList.remove('hide');
    document.getElementById('revealGo').classList.remove('hide');
    mountCard(cardHost, cert, { large: true, idle: true }).then(() => cardHost.classList.add('is-in')).catch(() => {});
    confetti({ particleCount: 180, spread: 100, startVelocity: 45 });
    statusEl.textContent = 'Certification issued';
  };

  if (reduced) { finish(); return; }
  const steps = ['Checking your modules', 'Reading your pledge', 'Issuing your certification ID'];
  let si = 0;
  const stepTimer = setInterval(() => {
    si += 1;
    if (si < steps.length) statusEl.textContent = steps[si];
  }, 750);
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let frame = 0;
  const scramble = setInterval(() => {
    frame += 1;
    const locked = Math.floor(frame / 3);
    idEl.textContent = cert.id.split('').map((ch, i) => (i < locked || ch === '-' ? ch : chars[Math.floor(Math.random() * chars.length)])).join('');
    if (locked > cert.id.length) { clearInterval(scramble); clearInterval(stepTimer); finish(); }
  }, 70);
}

function viewCard() {
  const s = load();
  if (!s.cert) { go('#/dashboard'); return; }
  const c = s.cert;
  app.innerHTML = `
  <section class="card-wrap">
    <div class="wrap">
      <div class="split">
        <div class="card-stage">
          <div id="bigCard"></div>
          <p class="holo-hint">${icon('sparkles')} Tilt your phone or move your mouse. Tap to flip.</p>
        </div>
        <div class="card-side">
          <span class="chip chip-green"><i class="dot green"></i> Active</span>
          <h1 class="display h-2">Your player card</h1>
          <p class="lead">Show this at check-in. Your league scans the QR code or types your ID and gets an answer in a second.</p>
          <dl class="card-facts">
            <div><dt>Name</dt><dd>${esc(c.name)}</dd></div>
            <div><dt>Cert ID</dt><dd class="mono row" style="gap:8px">${esc(c.id)} <button class="icon-btn" type="button" data-copy-id aria-label="Copy ID">${icon('copy')}</button></dd></div>
            ${c.league ? `<div><dt>League</dt><dd>${esc(c.league)}</dd></div>` : ''}
            <div><dt>Issued</dt><dd>${fmtDate(c.issued)}</dd></div>
            <div><dt>Valid thru</dt><dd>${fmtDate(c.expires)}</dd></div>
          </dl>
          <div class="card-actions">
            <button class="btn btn-primary" type="button" data-dl="story">${icon('download')} Story image</button>
            <button class="btn btn-ghost" type="button" data-dl="card">${icon('download')} Card image</button>
            <button class="btn btn-ghost" type="button" data-share>${icon('share')} Share</button>
            <button class="btn btn-ghost" type="button" data-copy-link>${icon('link')} Copy verify link</button>
          </div>
          <div class="card-tips">
            <p>${icon('scan')} <span>League director? Send them to <a class="link" href="${url('verify/')}">the verify page</a>.</span></p>
            <p>${icon('phone')} <span>Add this page to your home screen so your card is one tap away.</span></p>
            <p>${icon('gift')} <span>You're entered in <a class="link" href="${url('giveaways/')}">Level Up giveaways</a> all year.</span></p>
            <p>${icon('refresh')} <span>Renew by ${fmtDate(c.expires)} to stay certified.</span></p>
          </div>
          <a class="link" href="#/dashboard">${icon('chevronLeft')} Review the course anytime</a>
        </div>
      </div>
    </div>
  </section>`;
  hydrateIcons(app);
  mountCard(document.getElementById('bigCard'), c, { large: true, idle: true }).catch(() => {});

  const verifyUrl = url(`verify/?id=${encodeURIComponent(c.id)}`);
  app.querySelector('[data-copy-id]')?.addEventListener('click', async () => { await copyText(c.id); toast('ID copied.', 'copy'); });
  app.querySelector('[data-copy-link]')?.addEventListener('click', async () => { await copyText(verifyUrl); toast('Verify link copied.', 'link'); });
  app.querySelectorAll('[data-dl]').forEach((b) => b.addEventListener('click', async () => {
    const kind = b.dataset.dl;
    const old = b.innerHTML;
    b.disabled = true; b.innerHTML = '<span class="spinner"></span> Building';
    try {
      const blob = await exportCardPNG(c, kind);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `level-up-certified-${c.id}${kind === 'story' ? '-story' : ''}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('Saved. Post it up.', 'download');
    } catch (err) { toast('That did not save. Try again.', 'alert'); }
    b.disabled = false; b.innerHTML = old;
    hydrateIcons(b);
  }));
  app.querySelector('[data-share]')?.addEventListener('click', async () => {
    const text = `I'm Level Up Certified for the ${CONFIG.season} season. ${c.id}`;
    try {
      const blob = await exportCardPNG(c, 'card');
      const file = new File([blob], `level-up-certified-${c.id}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'Level Up Certified' });
        return;
      }
    } catch (err) { /* fall through to link share */ }
    if (navigator.share) { try { await navigator.share({ title: 'Level Up Certified', text, url: verifyUrl }); return; } catch (err) { /* cancelled */ } }
    await copyText(verifyUrl);
    toast('Link copied.', 'link');
  });
}

/* ------------------------------------------------------------- router */
function viewReset() {
  app.innerHTML = `
  <section class="locked-wrap"><div class="wrap wrap-narrow center">
    <h1 class="display h-2">Reset demo progress?</h1>
    <p class="lead center" style="margin-inline:auto">This clears your progress, pledge and card on this device. Only use it for testing.</p>
    <div class="row wrap-row" style="justify-content:center">
      <button class="btn btn-primary btn-lg" type="button" id="doReset">Yes, reset it</button>
      <a class="btn btn-ghost btn-lg" href="#/dashboard">Never mind</a>
    </div>
  </div></section>`;
  document.getElementById('doReset').addEventListener('click', () => {
    reset();
    toast('Progress cleared.', 'refresh');
    go('#/');
  });
}

export function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render() {
  cleanups.forEach((fn) => { try { fn(); } catch (err) { /* ignore */ } });
  cleanups = [];
  const s = load();
  const hash = location.hash || '#/';
  const m = hash.match(/^#\/m\/([a-z-]+)/);
  app.classList.remove('is-in');
  requestAnimationFrame(() => app.classList.add('is-in'));
  if (hash.startsWith('#/reset')) viewReset();
  else if (m) viewModule(m[1]);
  else if (hash.startsWith('#/card')) viewCard();
  else if (hash.startsWith('#/done')) viewDone();
  else if (hash.startsWith('#/dashboard')) { if (s.paid) viewDashboard(); else viewEnroll(); }
  else if (s.paid) viewDashboard();
  else viewEnroll();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

window.addEventListener('hashchange', render);
render();
