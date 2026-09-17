// Branded QR codes (rounded dots, orange finder centers) as SVG or on a canvas.
import { loadScript } from './site.js';

const QR_SRC = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';

export async function qrMatrix(text, ecc = 'M') {
  await loadScript(QR_SRC);
  const qr = window.qrcode(0, ecc);
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const m = [];
  for (let r = 0; r < n; r++) { const row = []; for (let c = 0; c < n; c++) row.push(qr.isDark(r, c)); m.push(row); }
  return m;
}

const inFinder = (r, c, n) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

export async function qrSVG(text, { color = '#0B0B0C', accent = '#F36C21' } = {}) {
  const m = await qrMatrix(text);
  const n = m.length;
  let dots = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (m[r][c] && !inFinder(r, c, n)) dots += `<rect x="${c + 0.08}" y="${r + 0.08}" width="0.84" height="0.84" rx="0.3"/>`;
  }
  const finder = (x, y) => `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.7" fill="none" stroke="${color}" stroke-width="1"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.9" fill="${accent}"/>`;
  return `<svg viewBox="0 0 ${n} ${n}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR code"><g fill="${color}">${dots}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export async function drawQR(ctx, text, x, y, size, { color = '#0B0B0C', accent = '#F36C21' } = {}) {
  const m = await qrMatrix(text);
  const n = m.length; const s = size / n;
  ctx.fillStyle = color;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (m[r][c] && !inFinder(r, c, n)) { rrect(ctx, x + c * s + s * 0.08, y + r * s + s * 0.08, s * 0.84, s * 0.84, s * 0.3); ctx.fill(); }
  }
  [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([fx, fy]) => {
    ctx.lineWidth = s; ctx.strokeStyle = color;
    rrect(ctx, x + (fx + 0.5) * s, y + (fy + 0.5) * s, 6 * s, 6 * s, 1.7 * s); ctx.stroke();
    ctx.fillStyle = accent; rrect(ctx, x + (fx + 2) * s, y + (fy + 2) * s, 3 * s, 3 * s, 0.9 * s); ctx.fill();
    ctx.fillStyle = color;
  });
}

export { rrect };
