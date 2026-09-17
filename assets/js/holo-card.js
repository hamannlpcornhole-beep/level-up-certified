// The Level Up Certified player card: holographic tilt, flip to QR, PNG export.
import { CONFIG } from './config.js';
import { url, escapeHtml } from './site.js';
import { qrSVG, drawQR, rrect } from './qr.js';
import { fmtDate } from './store.js';

let uid = 0;

export function emblemSVG(season = CONFIG.season) {
  const k = `e${++uid}`;
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <linearGradient id="${k}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD58A"/><stop offset=".45" stop-color="#FF8A2B"/><stop offset="1" stop-color="#E0560F"/></linearGradient>
      <radialGradient id="${k}h" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#2A1206"/><stop offset=".7" stop-color="#0B0B0E"/><stop offset="1" stop-color="#000"/></radialGradient>
      <path id="${k}arc" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0"/>
    </defs>
    <circle cx="100" cy="100" r="95" fill="none" stroke="url(#${k}g)" stroke-width="1" stroke-dasharray="1.5 4.2" opacity=".8"/>
    <circle cx="100" cy="100" r="84" fill="none" stroke="url(#${k}g)" stroke-width="3"/>
    <text font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" letter-spacing="3.1" fill="#FFB23F"><textPath href="#${k}arc">LEVEL UP CERTIFIED &#8226; PLAYER &#8226; ${season} &#8226;</textPath></text>
    <circle cx="100" cy="100" r="54" fill="url(#${k}h)" stroke="url(#${k}g)" stroke-width="5"/>
    <circle cx="100" cy="100" r="44" fill="none" stroke="rgba(255,178,63,.35)" stroke-width="1"/>
    <path d="M78 101.5 93 116.5 124 84" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function validThru(expires) {
  return fmtDate(expires, { month: 'short', year: 'numeric' }).toUpperCase();
}

export function cardHTML(d, { large = false } = {}) {
  const name = escapeHtml(d.name || 'Your Name');
  const id = escapeHtml(d.id || 'LU-26-XXXXXX');
  const league = d.league ? ` &middot; ${escapeHtml(d.league)}` : '';
  const thru = d.expires ? validThru(d.expires) : 'SEP 2027';
  return `
  <div class="holo${large ? ' lg' : ''}" data-holo tabindex="0" role="button" aria-label="Player card for ${name}. Press to flip.">
    <div class="holo-shadow"></div>
    <div class="holo-inner">
      <div class="holo-face holo-front">
        <div class="hc">
          <div class="hc-top">
            <img src="${url('assets/img/logo.png')}" alt="" width="300" height="332">
            <div class="t"><b>Level Up</b><span>Certified</span></div>
            <span class="season">${escapeHtml(d.season || CONFIG.season)}</span>
          </div>
          <div class="hc-emblem">${emblemSVG(d.season || CONFIG.season)}</div>
          <div class="hc-name">${name}</div>
          <div class="hc-role"><i></i> Certified player${league}</div>
          <div class="hc-meta">
            <div><span>Cert ID</span><b>${id}</b></div>
            <div><span>Valid thru</span><b>${thru}</b></div>
          </div>
        </div>
        <div class="holo-foil"></div><div class="holo-sparkle"></div><div class="holo-glare"></div>
      </div>
      <div class="holo-face holo-back">
        <div class="hc hc-back">
          <div class="hc-qr" data-qr></div>
          <div class="scan">Scan to verify</div>
          <div class="id">${id}</div>
          <p class="fine">Leagues: scan this code or enter the ID on the Level Up verify page.</p>
        </div>
        <div class="holo-foil"></div><div class="holo-glare"></div>
      </div>
    </div>
  </div>`;
}

export async function mountCard(host, data, opts = {}) {
  host.innerHTML = cardHTML(data, opts);
  const holo = host.querySelector('[data-holo]');
  attachTilt(holo, opts);
  const qrHost = holo.querySelector('[data-qr]');
  try {
    qrHost.innerHTML = await qrSVG(url(`verify/?id=${encodeURIComponent(data.id || 'LU-26-DEMO01')}`));
  } catch { qrHost.innerHTML = ''; }
  return holo;
}

export function attachTilt(holo, { idle = true } = {}) {
  const set = (rx, ry, mx, my, h) => {
    holo.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    holo.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    holo.style.setProperty('--mx', `${mx.toFixed(1)}%`);
    holo.style.setProperty('--my', `${my.toFixed(1)}%`);
    holo.style.setProperty('--hover', h.toFixed(2));
  };
  let mode = idle ? 'idle' : 'rest';
  let raf = 0; let t0 = performance.now(); let inView = true; let resumeTimer = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const idleLoop = (now) => {
    raf = 0;
    if (mode !== 'idle' || !inView || reduced) return;
    const t = (now - t0) / 1000;
    const ry = Math.sin(t * 0.7) * 14; const rx = Math.cos(t * 0.55) * 7;
    set(rx, ry, 50 + ry * 2.6, 50 - rx * 3.4, 0.55 + Math.sin(t * 0.9) * 0.25);
    raf = requestAnimationFrame(idleLoop);
  };
  const kick = () => { if (!raf && mode === 'idle') { holo.classList.add('is-live'); raf = requestAnimationFrame(idleLoop); } };

  holo.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    mode = 'pointer'; clearTimeout(resumeTimer);
    holo.classList.add('is-live');
    const r = holo.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    set((0.5 - py) * 22, (px - 0.5) * 28, px * 100, py * 100, 1);
  });
  holo.addEventListener('pointerleave', () => {
    holo.classList.remove('is-live');
    set(0, 0, 50, 50, 0);
    mode = 'rest';
    if (idle) resumeTimer = setTimeout(() => { mode = 'idle'; t0 = performance.now(); kick(); }, 1400);
  });

  // phone tilt
  let gyroOn = false; let base = null;
  const onOrient = (e) => {
    if (e.beta == null || e.gamma == null) return;
    if (!base) base = { b: e.beta, g: e.gamma };
    mode = 'gyro'; holo.classList.add('is-live');
    const ry = Math.max(-18, Math.min(18, (e.gamma - base.g) * 0.9));
    const rx = Math.max(-14, Math.min(14, -(e.beta - base.b) * 0.6));
    set(rx, ry, 50 + ry * 2.6, 50 - rx * 3.4, 0.9);
  };
  const enableGyro = async () => {
    if (gyroOn || typeof DeviceOrientationEvent === 'undefined') return;
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') return;
      }
      window.addEventListener('deviceorientation', onOrient);
      gyroOn = true;
    } catch { /* not allowed */ }
  };

  const flip = () => { holo.classList.toggle('is-flipped'); if (matchMedia('(pointer:coarse)').matches) enableGyro(); };
  holo.addEventListener('click', flip);
  holo.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => { inView = en.isIntersecting; if (inView) kick(); });
    }).observe(holo);
  }
  if (idle) kick();
  return { enableGyro };
}

/* ---------- PNG export ---------- */
async function loadImg(src) {
  return new Promise((resolve) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = src; });
}

function drawEmblem(g, cx, cy, R) {
  const grad = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  grad.addColorStop(0, '#FFD58A'); grad.addColorStop(0.45, '#FF8A2B'); grad.addColorStop(1, '#E0560F');
  g.save();
  g.strokeStyle = grad; g.lineWidth = R * 0.03; g.beginPath(); g.arc(cx, cy, R * 0.84, 0, Math.PI * 2); g.stroke();
  g.setLineDash([R * 0.015, R * 0.042]); g.lineWidth = R * 0.01; g.beginPath(); g.arc(cx, cy, R * 0.95, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
  const hole = g.createRadialGradient(cx, cy - R * 0.1, 0, cx, cy, R * 0.54);
  hole.addColorStop(0, '#2A1206'); hole.addColorStop(0.7, '#0B0B0E'); hole.addColorStop(1, '#000');
  g.fillStyle = hole; g.beginPath(); g.arc(cx, cy, R * 0.54, 0, Math.PI * 2); g.fill();
  g.lineWidth = R * 0.05; g.stroke();
  g.strokeStyle = '#fff'; g.lineWidth = R * 0.1; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(cx - R * 0.22, cy + R * 0.015); g.lineTo(cx - R * 0.07, cy + R * 0.165); g.lineTo(cx + R * 0.24, cy - R * 0.16); g.stroke();
  // ring text
  g.fillStyle = '#FFB23F'; g.font = `700 ${Math.round(R * 0.1)}px "JetBrains Mono", monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const text = `LEVEL UP CERTIFIED • PLAYER • ${CONFIG.season} • `;
  const step = (Math.PI * 2) / text.length;
  for (let i = 0; i < text.length; i++) {
    const a = -Math.PI + i * step;
    g.save(); g.translate(cx + Math.cos(a) * R * 0.7, cy + Math.sin(a) * R * 0.7); g.rotate(a + Math.PI / 2); g.fillText(text[i], 0, 0); g.restore();
  }
  g.restore();
}

function fitText(g, text, maxW, size, weight = 900, family = '"Barlow Condensed", Impact, sans-serif', italic = false) {
  let s = size;
  do { g.font = `${italic ? 'italic ' : ''}${weight} ${s}px ${family}`; s -= 2; } while (g.measureText(text).width > maxW && s > 12);
  return s + 2;
}

export async function exportCardPNG(d, format = 'story') {
  if (document.fonts) {
    await Promise.race([Promise.all([
      document.fonts.load('900 80px "Barlow Condensed"'), document.fonts.load('italic 900 80px "Barlow Condensed"'),
      document.fonts.load('700 20px "JetBrains Mono"'), document.fonts.load('600 20px "Barlow"'),
    ]), new Promise((r) => setTimeout(r, 1500))]);
  }
  const story = format === 'story';
  const W = 1080; const H = story ? 1920 : 1350;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const logo = await loadImg(url('assets/img/logo.png'));

  // background
  g.fillStyle = '#08080A'; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, H * 0.55, 50, W / 2, H * 0.55, H * 0.6);
  glow.addColorStop(0, 'rgba(243,108,33,.45)'); glow.addColorStop(1, 'rgba(243,108,33,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 2;
  for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }

  // headline
  const topY = story ? 190 : 120;
  g.textAlign = 'center'; g.fillStyle = '#F6F4F0';
  g.font = 'italic 900 118px "Barlow Condensed", Impact, sans-serif';
  g.fillText('I\'M LEVEL UP', W / 2, topY);
  const hg = g.createLinearGradient(W * 0.25, 0, W * 0.75, 0); hg.addColorStop(0, '#FFB23F'); hg.addColorStop(1, '#F36C21');
  g.fillStyle = hg; g.fillText('CERTIFIED', W / 2, topY + 112);

  // card
  const cw = story ? 760 : 640; const ch = cw * 1.4;
  const cx = (W - cw) / 2; const cy = story ? 400 : 300;
  g.save();
  g.shadowColor = 'rgba(243,108,33,.55)'; g.shadowBlur = 90; g.shadowOffsetY = 30;
  rrect(g, cx, cy, cw, ch, 48); g.fillStyle = '#111114'; g.fill();
  g.restore();
  g.save(); rrect(g, cx, cy, cw, ch, 48); g.clip();
  const cb = g.createLinearGradient(cx, cy, cx + cw, cy + ch); cb.addColorStop(0, '#1B1B21'); cb.addColorStop(0.55, '#0C0C0F'); cb.addColorStop(1, '#170A03');
  g.fillStyle = cb; g.fillRect(cx, cy, cw, ch);
  const cg = g.createRadialGradient(cx + cw / 2, cy + ch * 1.05, 20, cx + cw / 2, cy + ch * 1.05, ch * 0.7);
  cg.addColorStop(0, 'rgba(243,108,33,.6)'); cg.addColorStop(1, 'rgba(243,108,33,0)'); g.fillStyle = cg; g.fillRect(cx, cy, cw, ch);
  // foil sweep
  const foil = g.createLinearGradient(cx, cy, cx + cw, cy + ch);
  ['rgba(255,122,224,.10)', 'rgba(122,243,255,.12)', 'rgba(255,233,122,.10)', 'rgba(122,255,170,.08)', 'rgba(255,122,224,.10)'].forEach((col, i, a) => foil.addColorStop(i / (a.length - 1), col));
  g.fillStyle = foil; g.fillRect(cx, cy, cw, ch);
  g.restore();
  g.save(); rrect(g, cx + 1.5, cy + 1.5, cw - 3, ch - 3, 47); const eg = g.createLinearGradient(cx, cy, cx + cw, cy + ch);
  eg.addColorStop(0, 'rgba(255,178,63,.95)'); eg.addColorStop(0.35, 'rgba(243,108,33,.25)'); eg.addColorStop(0.6, 'rgba(122,243,255,.35)'); eg.addColorStop(1, 'rgba(255,178,63,.9)');
  g.strokeStyle = eg; g.lineWidth = 3; g.stroke(); g.restore();

  const pad = cw * 0.07;
  if (logo) g.drawImage(logo, cx + pad, cy + pad, cw * 0.13, cw * 0.13 * (logo.height / logo.width));
  g.textAlign = 'left'; g.fillStyle = '#F6F4F0'; g.font = `900 ${Math.round(cw * 0.05)}px "Barlow Condensed", Impact, sans-serif`;
  g.fillText('LEVEL UP', cx + pad + cw * 0.16, cy + pad + cw * 0.06);
  g.fillStyle = '#FFB23F'; g.font = `700 ${Math.round(cw * 0.024)}px "JetBrains Mono", monospace`;
  g.fillText('C E R T I F I E D', cx + pad + cw * 0.16, cy + pad + cw * 0.1);
  g.textAlign = 'right'; g.font = `700 ${Math.round(cw * 0.028)}px "JetBrains Mono", monospace`;
  g.fillText(d.season || CONFIG.season, cx + cw - pad, cy + pad + cw * 0.075);

  drawEmblem(g, cx + cw / 2, cy + ch * 0.4, cw * 0.33);

  g.textAlign = 'left'; g.fillStyle = '#F6F4F0';
  const nameText = String(d.name || 'Your Name').toUpperCase();
  fitText(g, nameText, cw - pad * 2, Math.round(cw * 0.13));
  g.fillText(nameText, cx + pad, cy + ch * 0.745);
  g.fillStyle = '#34E08C'; g.beginPath(); g.arc(cx + pad + 8, cy + ch * 0.79 - 8, 8, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#FFB23F'; g.font = `700 ${Math.round(cw * 0.026)}px "JetBrains Mono", monospace`;
  g.fillText(`CERTIFIED PLAYER${d.league ? `  ·  ${String(d.league).toUpperCase()}` : ''}`, cx + pad + 26, cy + ch * 0.79);
  g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + pad, cy + ch * 0.83); g.lineTo(cx + cw - pad - cw * 0.26, cy + ch * 0.83); g.stroke();
  g.fillStyle = '#8F8F97'; g.font = `500 ${Math.round(cw * 0.02)}px "JetBrains Mono", monospace`;
  g.fillText('CERT ID', cx + pad, cy + ch * 0.87); g.fillText('VALID THRU', cx + pad + cw * 0.3, cy + ch * 0.87);
  g.fillStyle = '#F6F4F0'; g.font = `700 ${Math.round(cw * 0.032)}px "JetBrains Mono", monospace`;
  g.fillText(d.id || 'LU-26-XXXXXX', cx + pad, cy + ch * 0.915); g.fillText(d.expires ? validThru(d.expires) : 'SEP 2027', cx + pad + cw * 0.3, cy + ch * 0.915);
  // QR
  const qs = cw * 0.22; const qx = cx + cw - pad - qs; const qy = cy + ch - pad - qs;
  rrect(g, qx - 12, qy - 12, qs + 24, qs + 24, 18); g.fillStyle = '#fff'; g.fill();
  try { await drawQR(g, url(`verify/?id=${encodeURIComponent(d.id || '')}`), qx, qy, qs); } catch { /* offline */ }

  // footer
  g.textAlign = 'center';
  g.fillStyle = '#CBC9C4'; g.font = '600 38px "Barlow", sans-serif';
  const fy = cy + ch + (story ? 150 : 90);
  g.fillText('Rules. Etiquette. Gear. How to play.', W / 2, fy);
  g.fillStyle = '#F36C21'; g.font = '700 30px "JetBrains Mono", monospace';
  g.fillText('GET CERTIFIED  ·  LEVEL UP CORNHOLE', W / 2, fy + 64);

  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'));
}
