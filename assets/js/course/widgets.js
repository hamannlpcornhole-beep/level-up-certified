// Interactive pieces inside the course modules.
// renderWidget(name, host, ctx) renders into host and returns an optional cleanup function.
// ctx = { load, update, toast, url, icon, awardXP(amount, key), onPledgeChange(signed) }
import { CONFIG } from '../config.js';
import { PLEDGE } from './content.js';

export const WIDGET_NAMES = ['court', 'lanes', 'round', 'scorer', 'foul', 'etiquette', 'bag', 'collab', 'throw', 'training', 'apps', 'ppr', 'formats', 'checklist', 'pledge'];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const q = (root, sel) => root.querySelector(sel);
const qa = (root, sel) => [...root.querySelectorAll(sel)];
const wrap = (name, inner) => `<div class="wg wg-${name}">${inner}</div>`;

/* ---------------------------------------------------------------- court */
const COURT_SPOTS = [
  { x: 100, y: 78, label: '1', title: 'The board', value: '2 x 4 FT', text: 'Every regulation board is 2 feet wide and 4 feet long. Smooth wood, at least 1/2 inch thick with backing or 3/4 inch without.' },
  { x: 100, y: 51, label: '2', title: 'The hole', value: '6 IN', text: 'The hole is 6 inches across, centered side to side, with its center 9 inches from the back edge.' },
  { x: 62, y: 70, label: '3', title: "Pitcher's box", value: '3 x 4 FT', text: 'A box on each side of each board, 3 feet wide and 4 feet long. Four boxes per court. You pitch all your bags from your own box.' },
  { x: 100, y: 103, label: '4', title: 'Foul line', value: 'FRONT EDGE', text: 'The foul line is the front edge of the board. At release, part of one foot has to be in your box touching the ground, and nothing can touch or cross the line until the bag lands.' },
  { x: 176, y: 300, label: '5', title: 'The distance', value: '27 FT', text: 'Boards face each other 27 feet apart, measured front edge to front edge. Same at every ACL event.' },
  { x: 100, y: 592, label: '6', title: 'Board height', value: '12 IN / 3 IN', text: 'The back edge sits 12 inches off the ground. The front edge sits 2.5 to 3.5 inches off the ground. Indoors you want at least 12 feet of ceiling.', side: true },
];

const SIDE_VIEW = `<svg viewBox="0 0 220 96" class="side-view" aria-hidden="true">
  <defs><linearGradient id="svg-deck" x1="0" x2="1"><stop offset="0" stop-color="#2A2A31"/><stop offset="1" stop-color="#17171C"/></linearGradient></defs>
  <line x1="6" y1="84" x2="214" y2="84" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>
  <path d="M30 78 L186 30 L186 38 L30 86 Z" fill="url(#svg-deck)" stroke="#F36C21" stroke-width="1.5"/>
  <line x1="182" y1="34" x2="182" y2="84" stroke="rgba(255,255,255,.35)" stroke-width="2"/>
  <line x1="190" y1="30" x2="190" y2="84" stroke="#FFB23F" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="196" y="60" fill="#FFB23F" font-family="JetBrains Mono, monospace" font-size="9">12 in</text>
  <line x1="24" y1="78" x2="24" y2="84" stroke="#FFB23F" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="2" y="72" fill="#FFB23F" font-family="JetBrains Mono, monospace" font-size="9">3 in</text>
  <text x="96" y="22" fill="#8F8F97" font-family="JetBrains Mono, monospace" font-size="9" text-anchor="middle">SIDE VIEW</text>
</svg>`;

function courtSVG() {
  const board = (y) => `
    <rect x="85" y="${y}" width="30" height="60" rx="2" fill="#15151A" stroke="#F36C21" stroke-width="1.6"/>
    <rect x="88" y="${y + 3}" width="24" height="54" rx="1.5" fill="none" stroke="rgba(243,108,33,.25)" stroke-width="0.8"/>`;
  const box = (x, y) => `<rect x="${x}" y="${y}" width="45" height="60" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.18)" stroke-width="0.8" stroke-dasharray="4 3"/>`;
  return `<svg viewBox="0 0 200 640" class="court-map" role="img" aria-label="Regulation cornhole court from above">
    <defs>
      <radialGradient id="cm-hole"><stop offset="0" stop-color="#FFB23F"/><stop offset="0.55" stop-color="#F36C21"/><stop offset="1" stop-color="#1a0c03"/></radialGradient>
      <marker id="cm-arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 z" fill="#FFB23F"/></marker>
    </defs>
    ${box(40, 40)}${box(115, 40)}${board(40)}
    <circle cx="100" cy="51.25" r="3.75" fill="url(#cm-hole)"/>
    <line x1="40" y1="100" x2="160" y2="100" stroke="#FFB23F" stroke-width="1.6"/>
    ${box(40, 505)}${box(115, 505)}${board(505)}
    <circle cx="100" cy="553.75" r="3.75" fill="url(#cm-hole)"/>
    <line x1="40" y1="505" x2="160" y2="505" stroke="#FFB23F" stroke-width="1.6"/>
    <line x1="176" y1="104" x2="176" y2="501" stroke="#FFB23F" stroke-width="1" marker-start="url(#cm-arrow)" marker-end="url(#cm-arrow)"/>
    <text x="170" y="300" fill="#FFB23F" font-family="JetBrains Mono, monospace" font-size="11" text-anchor="middle" transform="rotate(-90 170 300)">27 FT</text>
    <text x="100" y="30" fill="#8F8F97" font-family="JetBrains Mono, monospace" font-size="9" text-anchor="middle">BACK EDGE</text>
    <text x="100" y="118" fill="#8F8F97" font-family="JetBrains Mono, monospace" font-size="9" text-anchor="middle">FOUL LINE</text>
    <text x="62" y="36" fill="#8F8F97" font-family="JetBrains Mono, monospace" font-size="8" text-anchor="middle">PITCHER'S BOX</text>
  </svg>`;
}

function court(host) {
  host.innerHTML = wrap('court', `
    <div class="court-grid">
      <div class="court-stage">
        ${courtSVG()}
        ${COURT_SPOTS.map((s, i) => `<button class="spot" type="button" data-i="${i}" style="left:${(s.x / 200) * 100}%; top:${(s.y / 640) * 100}%" aria-label="${esc(s.title)}"><span>${s.label}</span></button>`).join('')}
      </div>
      <div class="court-info" role="status">
        <span class="badge">Tap a number</span>
        <h4 class="display h-4">The court</h4>
        <p class="muted">Six things to know before you set up a court or step into a box.</p>
      </div>
    </div>`);
  const info = q(host, '.court-info');
  qa(host, '.spot').forEach((btn) => btn.addEventListener('click', () => {
    qa(host, '.spot').forEach((b) => b.classList.toggle('is-on', b === btn));
    const s = COURT_SPOTS[+btn.dataset.i];
    info.innerHTML = `<span class="badge">${s.label} of 6</span><h4 class="display h-4">${esc(s.title)}</h4><div class="big-val mono">${esc(s.value)}</div><p class="text-2">${esc(s.text)}</p>${s.side ? SIDE_VIEW : ''}`;
  }));
}

/* ---------------------------------------------------------------- lanes */
function lanes(host) {
  const players = {
    singles: [{ x: 26, y: 50, t: 'You', c: 'o' }, { x: 26, y: 78, t: 'Them', c: 'w' }],
    doubles: [{ x: 26, y: 50, t: 'You', c: 'o' }, { x: 26, y: 78, t: 'Them', c: 'w' }, { x: 74, y: 50, t: 'Partner', c: 'o' }, { x: 74, y: 78, t: 'Partner', c: 'w' }],
  };
  const captions = {
    singles: 'Both players pitch from the same end, then walk down and pitch back. You cover the whole court.',
    doubles: 'Partners split up. You stand at opposite boards in the same lane, straight across from each other. Never diagonal.',
  };
  host.innerHTML = wrap('lanes', `
    <div class="seg" role="tablist">
      <button type="button" class="seg-btn is-on" data-mode="singles" role="tab" aria-selected="true">Singles</button>
      <button type="button" class="seg-btn" data-mode="doubles" role="tab" aria-selected="false">Doubles</button>
    </div>
    <div class="lane-stage">
      <svg viewBox="0 0 400 130" class="lane-map" aria-hidden="true">
        <rect x="8" y="30" width="384" height="70" rx="6" fill="rgba(255,255,255,.02)" stroke="rgba(255,255,255,.1)"/>
        <rect x="60" y="44" width="26" height="42" rx="2" fill="#15151A" stroke="#F36C21" stroke-width="1.4" transform="rotate(90 73 65)"/>
        <circle cx="62" cy="65" r="3.4" fill="#F36C21"/>
        <rect x="314" y="44" width="26" height="42" rx="2" fill="#15151A" stroke="#F36C21" stroke-width="1.4" transform="rotate(90 327 65)"/>
        <circle cx="338" cy="65" r="3.4" fill="#F36C21"/>
        <line x1="86" y1="34" x2="86" y2="96" stroke="#FFB23F" stroke-width="1.2"/>
        <line x1="314" y1="34" x2="314" y2="96" stroke="#FFB23F" stroke-width="1.2"/>
        <text x="200" y="22" fill="#8F8F97" font-family="JetBrains Mono, monospace" font-size="9" text-anchor="middle">27 FT</text>
        <line x1="90" y1="16" x2="310" y2="16" stroke="rgba(255,178,63,.4)" stroke-width="1"/>
      </svg>
      <div class="lane-players"></div>
    </div>
    <p class="lane-caption text-2"></p>`);
  const draw = (mode) => {
    q(host, '.lane-players').innerHTML = players[mode].map((p) => `<span class="pl pl-${p.c}" style="left:${p.x}%; top:${p.y}%">${esc(p.t)}</span>`).join('');
    q(host, '.lane-caption').textContent = captions[mode];
  };
  qa(host, '.seg-btn').forEach((b) => b.addEventListener('click', () => {
    qa(host, '.seg-btn').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', String(x === b)); });
    draw(b.dataset.mode);
  }));
  draw('singles');
}

/* ---------------------------------------------------------------- round */
const ROUND_BAGS = [
  { side: 'o', text: 'Orange pitches bag 1.', pts: 1 },
  { side: 'w', text: 'White answers. You always alternate, one bag at a time.', pts: 0 },
  { side: 'o', text: 'Orange goes in the hole. That is 3 points.', pts: 3 },
  { side: 'w', text: 'White lands on the board for 1.', pts: 1 },
  { side: 'o', text: 'Orange slides one on for 1.', pts: 1 },
  { side: 'w', text: 'White misses. Bags on the ground score nothing.', pts: 0 },
  { side: 'o', text: 'Orange sticks the last one on the board.', pts: 0 },
  { side: 'w', text: 'White drops one in for 3. All 8 bags are down.', pts: 3 },
];

function round(host) {
  let i = 0;
  host.innerHTML = wrap('round', `
    <div class="round-track" aria-hidden="true">${ROUND_BAGS.map((b, n) => `<span class="rb rb-${b.side}" data-n="${n}"></span>`).join('')}</div>
    <div class="round-body">
      <p class="round-text text-2">Eight bags make a round. Four each, taking turns. Tap Pitch to walk through one.</p>
      <div class="round-score"><span><b class="o-dot"></b> Orange <b class="mono" data-o>0</b></span><span><b class="w-dot"></b> White <b class="mono" data-w>0</b></span></div>
    </div>
    <div class="row wrap-row">
      <button type="button" class="btn btn-primary btn-sm" data-next>Pitch a bag</button>
      <button type="button" class="btn btn-ghost btn-sm" data-reset>Reset</button>
    </div>`);
  const text = q(host, '.round-text');
  const oEl = q(host, '[data-o]'); const wEl = q(host, '[data-w]');
  const btn = q(host, '[data-next]');
  const reset = () => {
    i = 0; oEl.textContent = '0'; wEl.textContent = '0';
    qa(host, '.rb').forEach((b) => b.classList.remove('is-on'));
    text.textContent = 'Eight bags make a round. Four each, taking turns. Tap Pitch to walk through one.';
    btn.disabled = false; btn.textContent = 'Pitch a bag';
  };
  q(host, '[data-reset]').addEventListener('click', reset);
  btn.addEventListener('click', () => {
    if (i >= ROUND_BAGS.length) return;
    const b = ROUND_BAGS[i];
    q(host, `.rb[data-n="${i}"]`).classList.add('is-on');
    text.textContent = b.text;
    const el = b.side === 'o' ? oEl : wEl;
    el.textContent = String(+el.textContent + b.pts);
    i += 1;
    if (i === ROUND_BAGS.length) {
      const o = +oEl.textContent; const w = +wEl.textContent;
      const diff = Math.abs(o - w);
      const winner = o === w ? null : (o > w ? 'Orange' : 'White');
      text.innerHTML = winner
        ? `Round over. Orange ${o}, White ${w}. Only the difference counts, so <strong>${winner} scores ${diff}</strong>. ${winner} scored, so ${winner} throws first next round.`
        : `Round over. ${o} to ${w}. That is a wash, nobody scores, and the same side keeps throwing first.`;
      btn.disabled = true; btn.textContent = 'Round complete';
    }
  });
}

/* ---------------------------------------------------------------- scorer */
const BOARD_W = 200; const BOARD_H = 400; const HOLE_R = 25;
const HOLE_CX = BOARD_W / 2; const HOLE_CY = 75;

function bagShape(x, y, cls, rot) {
  return `<g class="sbag ${cls}" transform="translate(${x} ${y}) rotate(${rot})"><rect x="-25" y="-25" width="50" height="50" rx="12"/><rect class="st" x="-17" y="-17" width="34" height="34" rx="8"/></g>`;
}

function scorer(host, ctx) {
  const state = { tab: 'build', side: 'o', bags: { o: [], w: [] }, quiz: null, streak: 0, best: 0 };
  host.innerHTML = wrap('scorer', `
    <div class="seg" role="tablist">
      <button type="button" class="seg-btn is-on" data-tab="build" role="tab" aria-selected="true">Build a round</button>
      <button type="button" class="seg-btn" data-tab="quiz" role="tab" aria-selected="false">Call the score</button>
    </div>
    <div class="score-panes">
      <div class="score-pane" data-pane="build">
        <div class="side-pick">
          <button type="button" class="side-btn is-on" data-side="o"><i class="o-dot"></i> Orange <span class="mono" data-left-o>4</span></button>
          <button type="button" class="side-btn" data-side="w"><i class="w-dot"></i> White <span class="mono" data-left-w>4</span></button>
        </div>
        <div class="board-stage" data-stage>
          <svg viewBox="-60 -40 320 500" class="board-svg" data-svg>
            <rect x="-60" y="-40" width="320" height="500" fill="transparent"/>
            <rect class="deck" x="0" y="0" width="${BOARD_W}" height="${BOARD_H}" rx="6"/>
            <rect class="deck-in" x="8" y="8" width="${BOARD_W - 16}" height="${BOARD_H - 16}" rx="4"/>
            <circle class="hole" cx="${HOLE_CX}" cy="${HOLE_CY}" r="${HOLE_R}"/>
            <g data-bags></g>
            <g data-inhole></g>
          </svg>
          <p class="stage-hint mono">Tap the board to drop a bag</p>
        </div>
      </div>
      <div class="score-pane hide" data-pane="quiz">
        <div class="quiz-stage">
          <svg viewBox="-60 -40 320 500" class="board-svg">
            <rect class="deck" x="0" y="0" width="${BOARD_W}" height="${BOARD_H}" rx="6"/>
            <rect class="deck-in" x="8" y="8" width="${BOARD_W - 16}" height="${BOARD_H - 16}" rx="4"/>
            <circle class="hole" cx="${HOLE_CX}" cy="${HOLE_CY}" r="${HOLE_R}"/>
            <g data-qbags></g><g data-qinhole></g>
          </svg>
          <div class="quiz-side">
            <p class="mono tiny muted">Call it</p>
            <h4 class="display h-4">Who scores, and how many?</h4>
            <div class="quiz-opts" data-opts></div>
            <p class="quiz-why text-2" data-why></p>
            <div class="row wrap-row">
              <button type="button" class="btn btn-primary btn-sm hide" data-nextq>Next round</button>
              <span class="chip" data-streak>Streak 0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="score-out">
      <div class="score-col"><span class="mono tiny muted">Orange</span><b class="mono" data-pts-o>0</b><span class="tiny muted" data-detail-o>0 in, 0 on</span></div>
      <div class="score-res"><span class="mono tiny muted">Result</span><b class="display h-4" data-result>Nobody scores yet</b></div>
      <div class="score-col"><span class="mono tiny muted">White</span><b class="mono" data-pts-w>0</b><span class="tiny muted" data-detail-w>0 in, 0 on</span></div>
    </div>
    <div class="row wrap-row" data-build-actions>
      <button type="button" class="btn btn-ghost btn-sm" data-undo>Undo</button>
      <button type="button" class="btn btn-ghost btn-sm" data-clear>Clear board</button>
    </div>`);

  const svg = q(host, '[data-svg]');
  const bagsG = q(host, '[data-bags]');
  const inHoleG = q(host, '[data-inhole]');

  const tally = (list) => {
    const inn = list.filter((b) => b.kind === 'in').length;
    const on = list.filter((b) => b.kind === 'on').length;
    return { inn, on, pts: inn * 3 + on };
  };
  const paint = () => {
    const o = tally(state.bags.o); const w = tally(state.bags.w);
    q(host, '[data-pts-o]').textContent = String(o.pts);
    q(host, '[data-pts-w]').textContent = String(w.pts);
    q(host, '[data-detail-o]').textContent = `${o.inn} in, ${o.on} on`;
    q(host, '[data-detail-w]').textContent = `${w.inn} in, ${w.on} on`;
    q(host, '[data-left-o]').textContent = String(4 - state.bags.o.length);
    q(host, '[data-left-w]').textContent = String(4 - state.bags.w.length);
    const res = q(host, '[data-result]');
    if (!state.bags.o.length && !state.bags.w.length) res.textContent = 'Nobody scores yet';
    else if (o.pts === w.pts) res.innerHTML = 'Wash. <span class="muted">Nobody scores.</span>';
    else {
      const win = o.pts > w.pts ? 'Orange' : 'White';
      res.innerHTML = `${win} scores <span class="grad">${Math.abs(o.pts - w.pts)}</span>`;
    }
    bagsG.innerHTML = [...state.bags.o.map((b) => ({ ...b, c: 'o' })), ...state.bags.w.map((b) => ({ ...b, c: 'w' }))]
      .filter((b) => b.kind !== 'in').map((b) => bagShape(b.x, b.y, `sb-${b.c}${b.kind === 'off' ? ' is-off' : ''}`, b.rot)).join('');
    const ins = { o: tally(state.bags.o).inn, w: tally(state.bags.w).inn };
    inHoleG.innerHTML = (ins.o + ins.w)
      ? `<g class="hole-count" transform="translate(${HOLE_CX} ${HOLE_CY})"><circle r="${HOLE_R}" class="hole-fill"/><text y="6" text-anchor="middle">${ins.o + ins.w}</text></g>`
      : '';
  };
  const place = (evt) => {
    const list = state.bags[state.side];
    if (list.length >= 4) { ctx.toast('That side already threw 4 bags.', 'info'); return; }
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    const dist = Math.hypot(loc.x - HOLE_CX, loc.y - HOLE_CY);
    let kind = 'off';
    if (dist < HOLE_R * 0.95) kind = 'in';
    else if (loc.x > 0 && loc.x < BOARD_W && loc.y > 0 && loc.y < BOARD_H) kind = 'on';
    list.push({ x: Math.max(-40, Math.min(240, loc.x)), y: Math.max(-20, Math.min(440, loc.y)), kind, rot: Math.round(Math.random() * 40 - 20) });
    paint();
  };
  svg.addEventListener('click', place);
  q(host, '[data-undo]').addEventListener('click', () => { state.bags[state.side].pop(); paint(); });
  q(host, '[data-clear]').addEventListener('click', () => { state.bags = { o: [], w: [] }; paint(); });
  qa(host, '.side-btn').forEach((b) => b.addEventListener('click', () => {
    state.side = b.dataset.side;
    qa(host, '.side-btn').forEach((x) => x.classList.toggle('is-on', x === b));
  }));

  /* quiz tab */
  const rand = (n) => Math.floor(Math.random() * n);
  const newQuiz = () => {
    const mk = () => { const inn = rand(3); const on = rand(4 - inn); return { inn, on }; };
    const o = mk(); const w = mk();
    const op = o.inn * 3 + o.on; const wp = w.inn * 3 + w.on;
    const diff = Math.abs(op - wp);
    const right = op === wp ? 'Wash. Nobody scores.' : `${op > wp ? 'Orange' : 'White'} scores ${diff}`;
    const wrongs = new Set();
    wrongs.add(`Orange scores ${op}`);
    wrongs.add(`White scores ${wp}`);
    wrongs.add(op === wp ? `Orange scores ${op}` : 'Wash. Nobody scores.');
    wrongs.delete(right);
    const opts = [right, ...[...wrongs].slice(0, 2)].sort(() => Math.random() - 0.5);
    state.quiz = { o, w, op, wp, right, opts };
    const bagsFor = (t, c, side) => {
      const out = [];
      for (let i = 0; i < t.on; i++) out.push(bagShape(30 + rand(140), 140 + rand(230), `sb-${c}`, rand(40) - 20));
      return out.join('');
    };
    q(host, '[data-qbags]').innerHTML = bagsFor(o, 'o', 'o') + bagsFor(w, 'w', 'w');
    const totalIn = o.inn + w.inn;
    q(host, '[data-qinhole]').innerHTML = totalIn
      ? `<g class="hole-count" transform="translate(${HOLE_CX} ${HOLE_CY})"><circle r="${HOLE_R}" class="hole-fill"/><text y="6" text-anchor="middle">${totalIn}</text></g>` : '';
    q(host, '[data-why]').textContent = `Orange: ${o.inn} in the hole and ${o.on} on the board. White: ${w.inn} in and ${w.on} on.`;
    q(host, '[data-opts]').innerHTML = opts.map((t) => `<button type="button" class="opt" data-opt="${esc(t)}">${esc(t)}</button>`).join('');
    q(host, '[data-nextq]').classList.add('hide');
    qa(host, '[data-opts] .opt').forEach((b) => b.addEventListener('click', () => {
      const ok = b.dataset.opt === right;
      qa(host, '[data-opts] .opt').forEach((x) => {
        x.disabled = true;
        if (x.dataset.opt === right) x.classList.add('is-right');
        else if (x === b) x.classList.add('is-wrong');
      });
      state.streak = ok ? state.streak + 1 : 0;
      state.best = Math.max(state.best, state.streak);
      q(host, '[data-streak]').textContent = `Streak ${state.streak}`;
      q(host, '[data-why]').innerHTML = `Orange had ${op}, White had ${wp}. ${op === wp ? 'Same score, so it is a wash.' : `Only the difference counts, so ${right.toLowerCase()}.`}`;
      if (state.streak === 3) { ctx.awardXP(10, 'scorer-streak-3'); ctx.toast('3 in a row. Nice. +10 XP', 'sparkles'); }
      q(host, '[data-nextq]').classList.remove('hide');
    }));
  };
  q(host, '[data-nextq]').addEventListener('click', newQuiz);
  qa(host, '.seg-btn').forEach((b) => b.addEventListener('click', () => {
    state.tab = b.dataset.tab;
    qa(host, '.seg-btn').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', String(x === b)); });
    qa(host, '.score-pane').forEach((p) => p.classList.toggle('hide', p.dataset.pane !== state.tab));
    q(host, '.score-out').classList.toggle('hide', state.tab === 'quiz');
    q(host, '[data-build-actions]').classList.toggle('hide', state.tab === 'quiz');
    if (state.tab === 'quiz' && !state.quiz) newQuiz();
  }));
  paint();
}

/* ---------------------------------------------------------------- foul */
const FOUL_CARDS = [
  { t: 'Your front foot is on the foul line when you let go of the bag.', a: 'foul', why: 'Your foot cannot touch or cross the foul line before the bag lands.' },
  { t: 'Your bag lands on the board and slides into the hole.', a: 'legal', why: 'That is a slide. Three points.' },
  { t: 'Your bag hits the ground, bounces up and slides onto the board.', a: 'foul', why: 'It touched the ground first. Dead bag, worth 0, and it gets pulled.' },
  { t: 'Your bag clips the ceiling, then lands on the board.', a: 'foul', why: 'Hit the ceiling, a person or anything else before the board and the bag is dead.' },
  { t: "Your opponent's bag knocks your bag into the hole.", a: 'legal', why: 'A bag knocked into the hole counts 3, no matter who knocked it in.' },
  { t: 'You grab bags off the board before the round is scored.', a: 'foul', why: 'The round ends right there and the other side gets bonus points. Hands off until the score is agreed.' },
  { t: "You take 25 seconds to pitch after your opponent's bag stops.", a: 'foul', why: 'You get 15 seconds once their bag comes to rest.' },
  { t: 'You throw the bag overhand.', a: 'legal', why: 'ACL rules allow underhand or overhand. Most players throw underhand.' },
  { t: "You pitch a bag from your partner's box by mistake.", a: 'foul', why: 'Wrong box means a dead bag. Pitch every bag from your own box.' },
  { t: 'Your bag hangs over the edge of the hole when the round ends.', a: 'legal', why: 'A hanger is still on the board. One point, unless it falls in.' },
];

function foul(host, ctx) {
  let i = 0; let right = 0;
  host.innerHTML = wrap('foul', `
    <div class="foul-head"><span class="chip"><i class="dot"></i> <span data-prog>1 of 10</span></span><span class="chip chip-green" data-right>0 right</span></div>
    <div class="foul-stack" data-stack></div>
    <div class="foul-actions">
      <button type="button" class="btn btn-ghost btn-lg fb-foul" data-ans="foul">Foul</button>
      <button type="button" class="btn btn-green btn-lg fb-legal" data-ans="legal">Legal</button>
    </div>
    <p class="foul-why text-2" data-why>Read the situation. Call it. Swipe the card or tap a button.</p>`);
  const stack = q(host, '[data-stack]');
  const draw = () => {
    if (i >= FOUL_CARDS.length) {
      stack.innerHTML = `<div class="fcard is-done"><span class="mono tiny muted">Done</span><h4 class="display h-3">${right} of ${FOUL_CARDS.length} right</h4><p class="text-2">${right === FOUL_CARDS.length ? 'Perfect. You know the rules.' : 'Run it back and lock them in.'}</p><button type="button" class="btn btn-primary btn-sm" data-again>Play again</button></div>`;
      q(host, '[data-again]').addEventListener('click', () => { i = 0; right = 0; q(host, '[data-right]').textContent = '0 right'; draw(); });
      qa(host, '.foul-actions .btn').forEach((b) => { b.disabled = true; });
      if (right === FOUL_CARDS.length) { ctx.awardXP(25, 'foul-perfect'); ctx.toast('10 for 10. +25 XP', 'trophy'); }
      return;
    }
    qa(host, '.foul-actions .btn').forEach((b) => { b.disabled = false; });
    q(host, '[data-prog]').textContent = `${i + 1} of ${FOUL_CARDS.length}`;
    const next = FOUL_CARDS[i + 1];
    stack.innerHTML = `
      ${next ? `<div class="fcard is-behind"><p>${esc(next.t)}</p></div>` : ''}
      <div class="fcard is-live" data-card><span class="mono tiny muted">Situation ${i + 1}</span><p>${esc(FOUL_CARDS[i].t)}</p></div>`;
    dragify(q(host, '[data-card]'));
  };
  const answer = (choice) => {
    const card = q(host, '[data-card]');
    if (!card) return;
    const c = FOUL_CARDS[i];
    const ok = c.a === choice;
    if (ok) { right += 1; q(host, '[data-right]').textContent = `${right} right`; }
    card.classList.add(choice === 'legal' ? 'fly-right' : 'fly-left', ok ? 'was-right' : 'was-wrong');
    q(host, '[data-why]').innerHTML = `<strong class="${ok ? 'green' : 'red'}">${ok ? 'Correct.' : `Nope, that is ${c.a}.`}</strong> ${esc(c.why)}`;
    i += 1;
    setTimeout(draw, 420);
  };
  qa(host, '.foul-actions .btn').forEach((b) => b.addEventListener('click', () => answer(b.dataset.ans)));
  function dragify(card) {
    if (!card) return;
    let x0 = null;
    card.addEventListener('pointerdown', (e) => { x0 = e.clientX; card.setPointerCapture(e.pointerId); card.classList.add('is-drag'); });
    card.addEventListener('pointermove', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      card.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
      card.classList.toggle('hint-legal', dx > 40);
      card.classList.toggle('hint-foul', dx < -40);
    });
    const end = (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      card.classList.remove('is-drag', 'hint-legal', 'hint-foul');
      card.style.transform = '';
      if (Math.abs(dx) > 70) answer(dx > 0 ? 'legal' : 'foul');
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', () => { x0 = null; card.style.transform = ''; });
  }
  draw();
}

/* ---------------------------------------------------------------- etiquette */
const ETIQUETTE = [
  { q: 'Your opponent is lining up a shot and your partner starts telling you a story.', o: ['Keep chatting, just quietly', 'Hold it until the bag lands', 'Walk over and grab your bags'], a: 1, why: 'Still and quiet while they throw. Talk between rounds.' },
  { q: 'You just lost a close game.', o: ['Walk off', 'Shake hands and report the score', 'Complain about the boards'], a: 1, why: 'Shake hands win or lose, then report the score right away.' },
  { q: 'You think their bag touched the ground, they say it did not.', o: ['Argue until they give in', 'Call the director over', 'Pull the bag yourself'], a: 1, why: 'Get an official or the director. Their call stands and nobody has to argue.' },
  { q: 'A new player on the next lane is standing in the wrong box.', o: ['Laugh about it', 'Say nothing', 'Politely tell them between rounds'], a: 2, why: 'Help new players. Just wait until the round is over so you do not distract anybody.' },
  { q: 'The round is over and nobody has called the score.', o: ['Grab your bags to keep things moving', 'Call the score out loud and agree first', 'Let the other side figure it out'], a: 1, why: 'Call it, agree on it, then touch bags. That is how you avoid arguments.' },
  { q: 'You are way better than the rest of your division.', o: ['Stay put and collect wins', 'Move up to the division that fits you', 'Lose a few on purpose to stay put'], a: 1, why: 'Playing down is sandbagging. Certified players are honest about their level.' },
];

function etiquette(host, ctx) {
  let i = 0; let perfect = true;
  host.innerHTML = wrap('etiquette', `<div class="et-card" data-card></div>`);
  const card = q(host, '[data-card]');
  const draw = () => {
    if (i >= ETIQUETTE.length) {
      card.innerHTML = `<span class="mono tiny muted">Done</span><h4 class="display h-3">${perfect ? 'Every one right.' : 'Now you know.'}</h4><p class="text-2">${perfect ? 'That is exactly how a certified player handles league night.' : 'Run it again and lock it in.'}</p><button type="button" class="btn btn-ghost btn-sm" data-again>Run it again</button>`;
      q(host, '[data-again]').addEventListener('click', () => { i = 0; perfect = true; draw(); });
      if (perfect) { ctx.awardXP(20, 'etiquette-all'); ctx.toast('Perfect run. +20 XP', 'thumbsUp'); }
      return;
    }
    const s = ETIQUETTE[i];
    card.innerHTML = `
      <span class="mono tiny muted">Situation ${i + 1} of ${ETIQUETTE.length}</span>
      <h4 class="display h-4">${esc(s.q)}</h4>
      <div class="et-opts">${s.o.map((t, n) => `<button type="button" class="opt" data-n="${n}">${esc(t)}</button>`).join('')}</div>
      <p class="et-why text-2 hide" data-why></p>
      <button type="button" class="btn btn-primary btn-sm hide" data-next>Next</button>`;
    qa(card, '.opt').forEach((b) => b.addEventListener('click', () => {
      const n = +b.dataset.n;
      if (n !== s.a) perfect = false;
      qa(card, '.opt').forEach((x) => {
        x.disabled = true;
        if (+x.dataset.n === s.a) x.classList.add('is-right');
        else if (x === b) x.classList.add('is-wrong');
      });
      const why = q(card, '[data-why]');
      why.innerHTML = `<strong class="${n === s.a ? 'green' : 'amber'}">${n === s.a ? 'That is the move.' : 'Better move:'}</strong> ${esc(s.why)}`;
      why.classList.remove('hide');
      const next = q(card, '[data-next]');
      next.classList.remove('hide');
      next.addEventListener('click', () => { i += 1; draw(); });
    }));
  };
  draw();
}

/* ---------------------------------------------------------------- bag anatomy */
const BAG_TABS = [
  { k: 'size', label: 'Size', value: '6 x 6 IN', text: 'Every legal bag is 6 inches by 6 inches, give or take a quarter inch.' },
  { k: 'weight', label: 'Weight', value: '15.5 to 16.5 OZ', text: 'Under ACL rules a bag weighs 15.5 to 16.5 ounces. Heavier bags feel slower in the air.' },
  { k: 'thick', label: 'Thickness', value: '1.1 to 1.5 IN', text: 'Thickness is capped too, so bags stack and slide the way everyone expects.' },
  { k: 'fill', label: 'Fill', value: 'RESIN', text: 'League bags are filled with plastic resin so they play the same every night. You cannot add or take out fill after you buy them.' },
  { k: 'sides', label: 'Sides', value: 'SLICK / STICKY', text: 'The two faces can be different. A slick side slides farther, a sticky side stops faster. All 4 bags in your set have to match.' },
  { k: 'stamp', label: 'Stamp', value: 'PRO / COMP / REC', text: 'Approved bags get stamped PRO, COMP, REC or MINI. For ACL events they have to be on the current approved list, stamps before 2023 do not count, and the Pro division needs PRO.' },
];

function bag(host) {
  host.innerHTML = wrap('bag', `
    <div class="bag-grid">
      <div class="bag-art">
        <svg viewBox="0 0 220 220" aria-hidden="true">
          <defs>
            <linearGradient id="bg-face" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8A2B"/><stop offset="1" stop-color="#D9540F"/></linearGradient>
            <linearGradient id="bg-face2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F0E8"/><stop offset="1" stop-color="#CFC8BC"/></linearGradient>
          </defs>
          <g class="ba-back"><rect x="58" y="28" width="120" height="120" rx="26" fill="url(#bg-face2)" opacity=".85"/></g>
          <g class="ba-front"><rect x="34" y="60" width="130" height="130" rx="28" fill="url(#bg-face)"/>
            <rect class="ba-stitch" x="48" y="74" width="102" height="102" rx="20" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="3" stroke-dasharray="9 7"/>
            <text x="99" y="134" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-style="italic" font-weight="900" font-size="46" fill="rgba(255,255,255,.9)">LU</text>
          </g>
          <g class="ba-dim"><line x1="34" y1="206" x2="164" y2="206" stroke="#FFB23F" stroke-width="2"/><text x="99" y="200" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" fill="#FFB23F">6 in</text></g>
          <g class="ba-stamp"><circle cx="176" cy="176" r="26" fill="#0B0B0E" stroke="#FFB23F" stroke-width="2"/><text x="176" y="181" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="#FFB23F">PRO</text></g>
        </svg>
      </div>
      <div class="bag-side">
        <div class="tabs" role="tablist">${BAG_TABS.map((t, i) => `<button type="button" class="tab${i === 0 ? ' is-on' : ''}" data-k="${t.k}" role="tab" aria-selected="${i === 0}">${t.label}</button>`).join('')}</div>
        <div class="bag-info" role="status"><div class="big-val mono" data-val></div><p class="text-2" data-text></p></div>
      </div>
    </div>`);
  const art = q(host, '.bag-art svg');
  const set = (k) => {
    const t = BAG_TABS.find((x) => x.k === k);
    q(host, '[data-val]').textContent = t.value;
    q(host, '[data-text]').textContent = t.text;
    art.dataset.focus = k;
  };
  qa(host, '.tab').forEach((b) => b.addEventListener('click', () => {
    qa(host, '.tab').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', String(x === b)); });
    set(b.dataset.k);
  }));
  set('size');
}

/* ---------------------------------------------------------------- collab */
function collab(host, ctx) {
  host.innerHTML = wrap('collab', `
    <div class="collab-card">
      <div class="collab-art" aria-hidden="true">
        <span class="cb cb1"></span><span class="cb cb2"></span><span class="cb cb3"></span><span class="cb cb4"></span>
      </div>
      <div class="collab-copy">
        <span class="badge">Level Up partner</span>
        <h4 class="display h-3">Level Up x BG Collab</h4>
        <p class="text-2">ACL Pro stamped bags, set of 4, built with BG Cornhole. Same bags the Level Up coaches throw.</p>
        <div class="row wrap-row">
          <a class="btn btn-primary btn-sm" href="${CONFIG.bgCollabUrl}" target="_blank" rel="noopener">See the bags <span class="tag">$90</span></a>
          <a class="link" href="${ctx.url('gear/')}">Full gear guide</a>
        </div>
      </div>
    </div>`);
}

/* ---------------------------------------------------------------- throw */
const THROW_STEPS = [
  { t: 'Stance', d: 'Stand in your box facing the board, balanced and relaxed. Pick a stance you can repeat every single throw. Consistency beats style.', art: 'stance' },
  { t: 'Grip', d: 'Hold the bag flat with your fingers spread across it. Some players fold the front edge over their fingers. Find a grip that lets the bag leave your hand flat.', art: 'grip' },
  { t: 'Swing', d: 'Let your arm swing like a pendulum. Straight back, straight through, right at your target. Smooth, not muscled.', art: 'swing' },
  { t: 'Release', d: 'Let go around waist height with a little spin so the bag stays flat in the air. Flat and spinning means predictable.', art: 'release' },
  { t: 'Follow through', d: 'Finish with your hand pointing at your target and hold it for a beat. Messy follow through, messy bags.', art: 'follow' },
];

function throwSteps(host, ctx) {
  const state = ctx.load();
  host.innerHTML = wrap('throw', `
    <ol class="steps-list">${THROW_STEPS.map((s, i) => `
      <li class="tstep${state.checklist[`throw-${i}`] ? ' is-done' : ''}" data-i="${i}">
        <div class="tstep-n mono">${String(i + 1).padStart(2, '0')}</div>
        <div class="tstep-body">
          <h4 class="display h-4">${s.t}</h4>
          <p class="text-2">${s.d}</p>
        </div>
        <button type="button" class="tstep-check" data-check="${i}" aria-pressed="${!!state.checklist[`throw-${i}`]}"><span class="tick"></span> Got it</button>
      </li>`).join('')}</ol>
    <div class="steps-bar"><div class="xpbar"><i style="--p:0%"></i></div><span class="mono tiny muted" data-count>0 of 5</span></div>`);
  const paint = () => {
    const s = ctx.load();
    const n = THROW_STEPS.filter((_, i) => s.checklist[`throw-${i}`]).length;
    q(host, '.steps-bar .xpbar i').style.setProperty('--p', `${(n / THROW_STEPS.length) * 100}%`);
    q(host, '[data-count]').textContent = `${n} of ${THROW_STEPS.length}`;
    if (n === THROW_STEPS.length) ctx.awardXP(15, 'throw-steps');
  };
  qa(host, '[data-check]').forEach((b) => b.addEventListener('click', () => {
    const i = b.dataset.check;
    const now = !ctx.load().checklist[`throw-${i}`];
    ctx.update((s) => { s.checklist[`throw-${i}`] = now; });
    b.setAttribute('aria-pressed', String(now));
    b.closest('.tstep').classList.toggle('is-done', now);
    paint();
  }));
  paint();
}

/* ---------------------------------------------------------------- training link */
function training(host, ctx) {
  host.innerHTML = wrap('training', `
    <div class="grid g-2">
      <a class="card hover" href="${ctx.url('training/')}">
        <span class="card-icon">${ctx.icon('dumbbell')}</span>
        <h4 class="card-title">Training center</h4>
        <p class="card-text">Free drills, a PPR tracker and the beginner path.</p>
      </a>
      <a class="card hover" href="${CONFIG.findYourProgramUrl}" target="_blank" rel="noopener">
        <span class="card-icon">${ctx.icon('compass')}</span>
        <h4 class="card-title">Find your program</h4>
        <p class="card-text">Five questions and we match you with a coach.</p>
      </a>
    </div>`);
}

/* ---------------------------------------------------------------- apps */
const APPS = [
  { k: 'acl', name: 'The Cornhole App', tag: 'Official ACL app', text: 'Keep score, track stats, find ACL events and sign up. Free to download. Some features need an ACL membership.', ios: 'https://apps.apple.com/us/app/cornhole-app/id6752613073', and: 'https://play.google.com/store/apps/details?id=com.aclapp.mobile', glyph: 'target' },
  { k: 'scoreholio', name: 'Scoreholio', tag: 'League and tournament nights', text: 'Tons of local leagues run on it. Check in with a QR code, see your bracket, get told which board to go to. Free, with an optional paid stats upgrade.', ios: 'https://apps.apple.com/us/app/scoreholio/id1370777926', and: 'https://play.google.com/store/apps/details?id=com.scoreholio.android', glyph: 'phone' },
];

function apps(host, ctx) {
  const state = ctx.load();
  host.innerHTML = wrap('apps', `<div class="grid g-2">${APPS.map((a) => `
    <div class="app-card${state.checklist[`app-${a.k}`] ? ' is-got' : ''}" data-app="${a.k}">
      <div class="app-top"><span class="app-glyph">${ctx.icon(a.glyph)}</span><div><h4 class="display h-4">${a.name}</h4><span class="mono tiny orange">${a.tag}</span></div></div>
      <p class="text-2">${a.text}</p>
      <div class="row wrap-row">
        <a class="btn btn-ghost btn-sm" href="${a.ios}" target="_blank" rel="noopener">iPhone</a>
        <a class="btn btn-ghost btn-sm" href="${a.and}" target="_blank" rel="noopener">Android</a>
      </div>
      <button type="button" class="tstep-check" data-got="${a.k}" aria-pressed="${!!state.checklist[`app-${a.k}`]}"><span class="tick"></span> I downloaded it</button>
    </div>`).join('')}</div>`);
  qa(host, '[data-got]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.got;
    const now = !ctx.load().checklist[`app-${k}`];
    ctx.update((s) => { s.checklist[`app-${k}`] = now; });
    b.setAttribute('aria-pressed', String(now));
    b.closest('.app-card').classList.toggle('is-got', now);
  }));
}

/* ---------------------------------------------------------------- ppr */
function ppr(host) {
  host.innerHTML = wrap('ppr', `
    <div class="ppr-grid">
      <div class="ppr-inputs">
        <div class="field"><label class="label" for="ppr-pts">Points you scored</label><input class="input mono" id="ppr-pts" type="number" min="0" inputmode="numeric" placeholder="60"></div>
        <div class="field"><label class="label" for="ppr-rounds">Rounds played</label><input class="input mono" id="ppr-rounds" type="number" min="1" inputmode="numeric" placeholder="10"></div>
        <button type="button" class="btn btn-ghost btn-sm" data-example>Use an example</button>
        <p class="hint">Count every bag before cancellation. Twelve is the most you can score in one round.</p>
      </div>
      <div class="ppr-gauge">
        <svg viewBox="0 0 200 120" aria-hidden="true">
          <defs><linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="#F36C21"/><stop offset="1" stop-color="#FFB23F"/></linearGradient></defs>
          <path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="14" stroke-linecap="round"/>
          <path data-arc d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="url(#pg)" stroke-width="14" stroke-linecap="round" stroke-dasharray="251" stroke-dashoffset="251"/>
        </svg>
        <div class="ppr-num"><b class="display" data-val>0.0</b><span class="mono tiny muted">PPR</span></div>
      </div>
    </div>`);
  const calc = () => {
    const p = parseFloat(q(host, '#ppr-pts').value) || 0;
    const r = parseFloat(q(host, '#ppr-rounds').value) || 0;
    const v = r > 0 ? Math.min(12, p / r) : 0;
    q(host, '[data-val]').textContent = v.toFixed(1);
    q(host, '[data-arc]').style.strokeDashoffset = String(251 - (v / 12) * 251);
  };
  qa(host, 'input').forEach((i) => i.addEventListener('input', calc));
  q(host, '[data-example]').addEventListener('click', () => {
    q(host, '#ppr-pts').value = '60'; q(host, '#ppr-rounds').value = '10'; calc();
  });
}

/* ---------------------------------------------------------------- formats */
const FORMATS = [
  { k: 'blind', name: 'Blind draw', text: 'Sign up by yourself and get paired with a random partner. Best way to meet people at a new league.', art: 'shuffle' },
  { k: 'byop', name: 'Bring your partner', text: 'You and a partner sign up together. Also called BYOP.', art: 'pair' },
  { k: 'singles', name: 'Singles', text: 'One on one. Just you, four bags and the board.', art: 'solo' },
  { k: 'rr', name: 'Round robin', text: 'You play a set of games against different opponents, usually before a bracket starts.', art: 'grid' },
  { k: 'de', name: 'Double elimination', text: 'A bracket where you are not out until you lose twice. Lose once and you drop to the back side.', art: 'bracket' },
];

function formats(host) {
  const art = {
    shuffle: '<svg viewBox="0 0 120 70"><g stroke="#F36C21" stroke-width="2" fill="none"><path d="M10 20 C45 20 70 50 110 50"/><path d="M10 50 C45 50 70 20 110 20"/></g><circle cx="10" cy="20" r="5" fill="#FF8A2B"/><circle cx="10" cy="50" r="5" fill="#ECE7DE"/><circle cx="110" cy="20" r="5" fill="#ECE7DE"/><circle cx="110" cy="50" r="5" fill="#FF8A2B"/></svg>',
    pair: '<svg viewBox="0 0 120 70"><circle cx="40" cy="35" r="10" fill="#FF8A2B"/><circle cx="62" cy="35" r="10" fill="#FF8A2B"/><circle cx="92" cy="35" r="10" fill="#ECE7DE"/><circle cx="114" cy="35" r="10" fill="#ECE7DE"/></svg>',
    solo: '<svg viewBox="0 0 120 70"><circle cx="30" cy="35" r="12" fill="#FF8A2B"/><circle cx="90" cy="35" r="12" fill="#ECE7DE"/><line x1="50" y1="35" x2="70" y2="35" stroke="#F36C21" stroke-width="2" stroke-dasharray="4 4"/></svg>',
    grid: '<svg viewBox="0 0 120 70">' + [0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${20 + c * 30}" y="${10 + r * 18}" width="22" height="12" rx="3" fill="${(r + c) % 2 ? 'rgba(243,108,33,.35)' : 'rgba(255,255,255,.12)'}"/>`).join('')).join('') + '</svg>',
    bracket: '<svg viewBox="0 0 120 70" stroke="#F36C21" stroke-width="2" fill="none"><path d="M10 15h20v20h20"/><path d="M10 55h20V35"/><path d="M50 35h20v-8h20"/><path d="M50 60h40v-8"/></svg>',
  };
  host.innerHTML = wrap('formats', `
    <div class="tabs" role="tablist">${FORMATS.map((f, i) => `<button type="button" class="tab${i === 0 ? ' is-on' : ''}" data-k="${f.k}" role="tab" aria-selected="${i === 0}">${f.name}</button>`).join('')}</div>
    <div class="fmt-body"><div class="fmt-art" data-art></div><div><h4 class="display h-4" data-name></h4><p class="text-2" data-text></p></div></div>`);
  const set = (k) => {
    const f = FORMATS.find((x) => x.k === k);
    q(host, '[data-name]').textContent = f.name;
    q(host, '[data-text]').textContent = f.text;
    q(host, '[data-art]').innerHTML = art[f.art];
  };
  qa(host, '.tab').forEach((b) => b.addEventListener('click', () => {
    qa(host, '.tab').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', String(x === b)); });
    set(b.dataset.k);
  }));
  set('blind');
}

/* ---------------------------------------------------------------- checklist */
const GAME_DAY = ['Bags, clean and dry', 'Your Level Up player card on your phone', 'Apps downloaded and logged in', 'Entry fee or payment app', 'Water', 'A towel', 'Flat, stable shoes', 'A good attitude'];

function checklist(host, ctx) {
  const state = ctx.load();
  host.innerHTML = wrap('checklist', `
    <ul class="check-list">${GAME_DAY.map((t, i) => `
      <li><button type="button" class="check-row${state.checklist[`gd-${i}`] ? ' is-on' : ''}" data-i="${i}" aria-pressed="${!!state.checklist[`gd-${i}`]}"><span class="tick"></span> ${esc(t)}</button></li>`).join('')}</ul>
    <div class="steps-bar"><div class="xpbar"><i style="--p:0%"></i></div><span class="mono tiny muted" data-count>0 of ${GAME_DAY.length}</span></div>
    <p class="ready hide" data-ready>Ready to roll. Go get your bags.</p>`);
  const paint = () => {
    const s = ctx.load();
    const n = GAME_DAY.filter((_, i) => s.checklist[`gd-${i}`]).length;
    q(host, '.steps-bar .xpbar i').style.setProperty('--p', `${(n / GAME_DAY.length) * 100}%`);
    q(host, '[data-count]').textContent = `${n} of ${GAME_DAY.length}`;
    q(host, '[data-ready]').classList.toggle('hide', n !== GAME_DAY.length);
  };
  qa(host, '.check-row').forEach((b) => b.addEventListener('click', () => {
    const i = b.dataset.i;
    const now = !ctx.load().checklist[`gd-${i}`];
    ctx.update((s) => { s.checklist[`gd-${i}`] = now; });
    b.classList.toggle('is-on', now);
    b.setAttribute('aria-pressed', String(now));
    paint();
  }));
  paint();
}

/* ---------------------------------------------------------------- pledge */
function pledge(host, ctx) {
  const signed = ctx.load().pledge;
  const render = () => {
    const p = ctx.load().pledge;
    if (p) {
      host.innerHTML = wrap('pledge', `
        <div class="pledge-signed">
          <span class="badge green">${ctx.icon('checkCircle')} Signed</span>
          <p class="text-2">You signed the Level Up Player Pledge.</p>
          <div class="sig">${esc(p.name)}</div>
          <p class="mono tiny muted">${new Date(p.at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <button type="button" class="btn btn-ghost btn-sm" data-edit>Edit my pledge</button>
        </div>`);
      q(host, '[data-edit]').addEventListener('click', () => {
        ctx.update((s) => { s.pledge = null; });
        ctx.onPledgeChange(false);
        render();
      });
      return;
    }
    host.innerHTML = wrap('pledge', `
      <ul class="pledge-list">${PLEDGE.map((t, i) => `<li><button type="button" class="check-row" data-i="${i}" aria-pressed="false"><span class="tick"></span> ${esc(t)}</button></li>`).join('')}</ul>
      <div class="pledge-sign">
        <div class="field"><label class="label" for="sig-name">Sign it. Type your full name.</label><input class="input" id="sig-name" autocomplete="name" placeholder="Your name"></div>
        <button type="button" class="btn btn-primary btn-lg" data-sign disabled>Sign the pledge</button>
        <p class="hint" data-hint>Check all ${PLEDGE.length} lines and type your name.</p>
      </div>`);
    const checks = new Set();
    const nameEl = q(host, '#sig-name');
    const signBtn = q(host, '[data-sign]');
    const refresh = () => {
      const ready = checks.size === PLEDGE.length && nameEl.value.trim().length >= 3;
      signBtn.disabled = !ready;
      q(host, '[data-hint]').textContent = ready ? 'Looks good. Sign it.' : `Checked ${checks.size} of ${PLEDGE.length}.`;
    };
    qa(host, '.check-row').forEach((b) => b.addEventListener('click', () => {
      const i = b.dataset.i;
      const on = !checks.has(i);
      if (on) checks.add(i); else checks.delete(i);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      refresh();
    }));
    nameEl.addEventListener('input', refresh);
    signBtn.addEventListener('click', () => {
      ctx.update((s) => { s.pledge = { name: nameEl.value.trim(), at: new Date().toISOString() }; });
      ctx.onPledgeChange(true);
      ctx.toast('Pledge signed. Respect.', 'shield');
      render();
    });
    refresh();
  };
  render();
  if (signed) ctx.onPledgeChange(true);
}

/* ---------------------------------------------------------------- registry */
const REGISTRY = { court, lanes, round, scorer, foul, etiquette, bag, collab, throw: throwSteps, training, apps, ppr, formats, checklist, pledge };

export function renderWidget(name, host, ctx) {
  const fn = REGISTRY[name];
  if (!fn || !host) return undefined;
  try {
    return fn(host, ctx);
  } catch (err) {
    console.error('widget failed', name, err);
    host.innerHTML = '<p class="placeholder-note">This piece did not load. Refresh the page and it should come back.</p>';
    return undefined;
  }
}
