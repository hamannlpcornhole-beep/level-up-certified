// Verify a player: type an ID or scan the QR code on their card.
import { icon, hydrateIcons } from '../icons.js';
import { url, openModal, closeModal, loadScript, toast, escapeHtml as esc } from '../site.js';
import { lookupCert, normalizeId, fmtDate } from '../store.js';

const form = document.getElementById('verifyForm');
const input = document.getElementById('certId');
const result = document.getElementById('result');
const recentWrap = document.getElementById('recent');
const recentList = document.getElementById('recentList');
const recent = [];
let clockTimer = 0;

const idFromAnything = (raw) => {
  const text = String(raw || '').trim();
  const m = text.match(/[?&]id=([^&#\s]+)/i);
  return normalizeId(m ? decodeURIComponent(m[1]) : text);
};

function renderRecent() {
  if (!recent.length) return;
  recentWrap.classList.remove('hide');
  recentList.innerHTML = recent.slice(0, 6).map((r) => `
    <li><button type="button" class="recent-row" data-try="${esc(r.id)}">
      <span class="dot ${r.status === 'valid' ? 'green' : 'red'}"></span>
      <span class="mono">${esc(r.id)}</span>
      <span class="muted small">${esc(r.label)}</span>
      <span class="mono tiny muted">${esc(r.time)}</span>
    </button></li>`).join('');
  hydrateIcons(recentList);
}

function show(res) {
  clearInterval(clockTimer);
  if (!res) { result.innerHTML = ''; return; }
  const { status } = res;
  const tone = status === 'valid' ? 'ok' : (status === 'expired' ? 'warn' : 'bad');
  const heads = { ok: 'Verified', warn: 'Expired', bad: 'No record' };
  const icons = { ok: 'checkCircle', warn: 'alert', bad: 'xCircle' };

  const body = status === 'missing'
    ? `<p class="text-2">Nothing on file for <b class="mono">${esc(res.id)}</b>.</p>
       <ul class="tips"><li>Check for a typo. IDs look like LU-26-XXXXXX.</li><li>Ask the player to open their card and read it out.</li><li>If they never certified, they can do it on their phone in about 35 minutes.</li></ul>
       <a class="btn btn-ghost btn-sm" href="${url('certify/')}">Send them to get certified</a>`
    : `<dl class="vfacts">
         <div><dt>Player</dt><dd>${esc(res.name || 'Player')}</dd></div>
         ${res.league ? `<div><dt>League</dt><dd>${esc(res.league)}</dd></div>` : ''}
         <div><dt>Cert ID</dt><dd class="mono">${esc(res.id)}</dd></div>
         <div><dt>Issued</dt><dd>${esc(fmtDate(res.issued))}</dd></div>
         <div><dt>${status === 'expired' ? 'Expired' : 'Valid thru'}</dt><dd>${esc(fmtDate(res.expires))}</dd></div>
       </dl>
       ${status === 'expired' ? '<p class="text-2">This one lapsed. They need to renew before they play.</p>' : ''}`;

  result.innerHTML = `
    <div class="vcard vcard-${tone}">
      <div class="vcard-top">
        <span class="vmark">${icon(icons[tone])}</span>
        <div>
          <h2 class="display h-2">${heads[tone]}</h2>
          <span class="mono tiny">${status === 'valid' ? 'Level Up Certified, current' : (status === 'expired' ? 'Certification lapsed' : 'Not in the registry')}</span>
        </div>
        ${res.sample ? '<span class="badge muted">Sample</span>' : ''}
      </div>
      <div class="vcard-body">${body}</div>
      <div class="vcard-foot mono">Checked at <b data-clock></b> <span class="muted">live check, not a screenshot</span></div>
    </div>`;

  const clock = result.querySelector('[data-clock]');
  const tick = () => { if (clock) clock.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }); };
  tick();
  clockTimer = setInterval(tick, 1000);
  result.classList.remove('is-in');
  void result.offsetWidth;
  result.classList.add('is-in');
}

function check(raw, { push = true } = {}) {
  const id = idFromAnything(raw);
  if (!id) { toast('Type a certification ID first.', 'info'); return; }
  input.value = id;
  const res = lookupCert(id);
  show(res);
  const u = new URL(location.href);
  u.searchParams.set('id', id);
  history.replaceState(null, '', u);
  if (push) {
    recent.unshift({
      id,
      status: res.status,
      label: res.status === 'valid' ? (res.name || 'Certified') : (res.status === 'expired' ? 'Expired' : 'No record'),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    });
    renderRecent();
  }
}

form.addEventListener('submit', (e) => { e.preventDefault(); check(input.value); });
input.addEventListener('input', () => { input.value = input.value.toUpperCase(); });
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-try]');
  if (t) { check(t.dataset.try); window.scrollTo({ top: 0, behavior: 'smooth' }); }
});

/* ---------- camera scanning ---------- */
const video = document.getElementById('scanVideo');
const hint = document.getElementById('scanHint');
let stream = null;
let scanRaf = 0;
let scanning = false;

async function startScan() {
  openModal('scanModal');
  hint.textContent = 'Point the camera at the QR code on the player\'s card.';
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    hint.textContent = 'This browser cannot open the camera. Type the ID instead.';
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    await video.play();
    scanning = true;
    loop();
  } catch (err) {
    hint.textContent = 'Camera is blocked. Allow camera access in your browser, or type the ID instead.';
  }
}

function stopScan() {
  scanning = false;
  cancelAnimationFrame(scanRaf);
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
  video.srcObject = null;
}

async function loop() {
  let detector = null;
  if ('BarcodeDetector' in window) {
    try { detector = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch { detector = null; }
  }
  let jsqr = null;
  if (!detector) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js');
      jsqr = window.jsQR;
    } catch { hint.textContent = 'Scanner did not load. Type the ID instead.'; return; }
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const tick = async () => {
    if (!scanning) return;
    if (video.readyState >= 2 && video.videoWidth) {
      try {
        let text = null;
        if (detector) {
          const codes = await detector.detect(video);
          if (codes.length) text = codes[0].rawValue;
        } else {
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const found = jsqr(data.data, data.width, data.height);
          if (found) text = found.data;
        }
        if (text) {
          const id = idFromAnything(text);
          if (id) {
            stopScan();
            closeModal('scanModal');
            check(id);
            toast('Scanned.', 'checkCircle');
            return;
          }
        }
      } catch { /* keep scanning */ }
    }
    scanRaf = requestAnimationFrame(tick);
  };
  tick();
}

document.getElementById('scanBtn').addEventListener('click', startScan);
document.getElementById('scanModal').addEventListener('click', (e) => { if (e.target.closest('[data-close-modal]') || e.target.id === 'scanModal') stopScan(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') stopScan(); });

/* ---------- boot ---------- */
const startId = new URLSearchParams(location.search).get('id');
if (startId) check(startId);
hydrateIcons(document);
