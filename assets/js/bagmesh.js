// Cornhole bag meshes: a filled pillow with a sewn seam and rounded corners that drapes
// over whatever is under it (the board, the lip of the hole, other bags).
// Shape notes from the Homework film: 6 in square, about 1.5 in tall lying down, flat on the
// bottom, domed on top, thin at the seam, and soft enough to sag into the hole and fold over bags.
import * as THREE from 'three';
import { HOLE_Z, HOLE_R, BAG_HALF } from './bagsim.js';

const N = 16;          // mesh grid per side
const M = 8;           // drape field grid per side
const TOP = 0.13;      // dome height above the board, feet
const SEAM = 0.028;    // seam height above the board
export const CENTER = 0.065; // mesh origin sits this far above the board

const rnd = (a, b) => a + Math.random() * (b - a);

// Superellipse (p = 4) norm: 1 on the rounded-square outline of the bag.
export const seNorm = (x, z) => Math.sqrt(Math.sqrt(x * x * x * x + z * z * z * z));

// Grid coords (u, v in -1..1) to bag-local feet, squaring the grid onto the rounded outline.
function mapUV(u, v) {
  const s = Math.max(Math.abs(u), Math.abs(v));
  if (s === 0) return [0, 0, 0];
  const k = s / seNorm(u, v);
  return [u * k * BAG_HALF, v * k * BAG_HALF, s];
}

export const profileTop = (s) => SEAM + (TOP - SEAM) * Math.pow(Math.max(0, 1 - Math.pow(s, 2.3)), 0.6);
const profileBottom = (s) => SEAM * Math.pow(s, 6);

export function makeBagGeometry(seed) {
  const p = [seed * 1.7 + 0.3, seed * 2.9 + 1.2, seed * 0.8 + 2.1, seed * 2.3 + 0.7, seed * 1.1 + 4.2];
  const lump = (u, v, s) => (1 - s * s) * (
    0.011 * Math.sin(2.3 * u + p[0]) * Math.cos(2.1 * v + p[1])
    + 0.006 * Math.sin(4.7 * u - 3.9 * v + p[2])
    + 0.008 * (u * Math.cos(p[3]) + v * Math.sin(p[3])));
  const wrinkle = (u, v, s) => {
    const edge = Math.max(0, Math.min(1, (s - 0.62) / 0.3));
    return 0.0035 * edge * Math.sin(Math.atan2(v, u) * 19 + p[4]) * (1 - edge * 0.4);
  };

  const V = (N + 1) * (N + 1);
  const pos = new Float32Array(V * 2 * 3);
  const uv = new Float32Array(V * 2 * 2);
  const gu = new Float32Array(V * 2);
  const gv = new Float32Array(V * 2);
  const air = new Float32Array(V * 2);   // extra belly when airborne (bottom only)
  let k = 0;
  for (let face = 0; face < 2; face++) {
    for (let j = 0; j <= N; j++) {
      for (let i = 0; i <= N; i++) {
        const u = -1 + (2 * i) / N; const v = -1 + (2 * j) / N;
        const [x, z, s] = mapUV(u, v);
        let y;
        if (face === 0) y = profileTop(s) + lump(u, v, s) + wrinkle(u, v, s) + (s >= 0.999 ? 0.003 : 0);
        else y = profileBottom(s) - (s >= 0.999 ? 0.003 : 0);
        pos[k * 3] = x; pos[k * 3 + 1] = y - CENTER; pos[k * 3 + 2] = z;
        uv[k * 2] = face === 0 ? (u + 1) / 2 : 1 - (u + 1) / 2;
        uv[k * 2 + 1] = (v + 1) / 2;
        gu[k] = u; gv[k] = v;
        air[k] = face === 1 ? -0.045 * Math.pow(Math.max(0, 1 - Math.pow(s, 2.3)), 0.6) : 0.012 * (1 - s * s);
        k++;
      }
    }
  }
  const idx = [];
  const at = (face, i, j) => face * V + j * (N + 1) + i;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = at(0, i, j); const b = at(0, i + 1, j); const c = at(0, i + 1, j + 1); const d = at(0, i, j + 1);
      idx.push(a, d, b, b, d, c);
      const a2 = at(1, i, j); const b2 = at(1, i + 1, j); const c2 = at(1, i + 1, j + 1); const d2 = at(1, i, j + 1);
      idx.push(a2, b2, d2, b2, c2, d2);
    }
  }
  // seam wall: walk the outline and stitch top to bottom
  const ring = [];
  for (let i = 0; i < N; i++) ring.push([i, 0]);
  for (let j = 0; j < N; j++) ring.push([N, j]);
  for (let i = N; i > 0; i--) ring.push([i, N]);
  for (let j = N; j > 0; j--) ring.push([0, j]);
  for (let r = 0; r < ring.length; r++) {
    const [i0, j0] = ring[r]; const [i1, j1] = ring[(r + 1) % ring.length];
    const t0 = at(0, i0, j0); const t1 = at(0, i1, j1); const b0 = at(1, i0, j0); const b1 = at(1, i1, j1);
    idx.push(t0, t1, b0, t1, b1, b0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.userData = { rest: pos.slice(), gu, gv, air };
  // precomputed drape lookups: which field cell each vertex sits in, and its weights
  const cell = new Uint16Array(V * 2); const fx = new Float32Array(V * 2); const fz = new Float32Array(V * 2);
  for (let q = 0; q < V * 2; q++) {
    const a = ((gu[q] + 1) / 2) * M; const b = ((gv[q] + 1) / 2) * M;
    const ia = Math.min(M - 1, Math.floor(a)); const ib = Math.min(M - 1, Math.floor(b));
    cell[q] = ib * (M + 1) + ia; fx[q] = a - ia; fz[q] = b - ib;
  }
  Object.assign(geo.userData, { cell, fx, fz });
  return geo;
}

/* ------------------------------------------------------------------ drape */
// Height of the surface under a point on the board (board-local), before other bags.
// Over the hole or past an edge the fabric droops: more the further out it hangs.
export function boardSag(x, z) {
  let h = 0;
  const dh = Math.hypot(x, z - HOLE_Z);
  if (dh < HOLE_R) { const d = HOLE_R - dh; h = -(0.9 * d + 1.6 * d * d); }
  const e = Math.max(Math.abs(x) - 1, z - 2, -2 - z);
  if (e > 0) h = Math.min(h, -(0.8 * e + 2 * e * e));
  return h;
}

// Field value of a draped bag at a point given in its own grid coords.
function fieldAt(dr, u, v) {
  const a = Math.max(0, Math.min(M - 1e-4, ((u + 1) / 2) * M));
  const b = Math.max(0, Math.min(M - 1e-4, ((v + 1) / 2) * M));
  const ia = Math.floor(a); const ib = Math.floor(b); const fa = a - ia; const fb = b - ib;
  const f = dr.field; const r = M + 1;
  const i0 = ib * r + ia;
  return (f[i0] * (1 - fa) + f[i0 + 1] * fa) * (1 - fb) + (f[i0 + r] * (1 - fa) + f[i0 + r + 1] * fa) * fb;
}

// Top of bag `o` at board point (x, z), or -Infinity when the point is outside it.
function topOf(o, x, z) {
  const dx = x - o.x; const dz = z - o.z;
  const c = Math.cos(o.yaw); const s = Math.sin(o.yaw);
  const lx = (dx * c - dz * s) / BAG_HALF; const lz = (dx * s + dz * c) / BAG_HALF;
  const n = seNorm(lx, lz);
  if (n >= 1) return -Infinity;
  const m = Math.max(Math.abs(lx), Math.abs(lz)) || 1;
  return fieldAt(o, (lx * n) / m, (lz * n) / m) + profileTop(n);
}

// Recomputes a bag's drape field from what is under it. `under` holds the bags that were
// on the board first, already draped. Returns true when the field changed.
export function computeField(bag, under, amount = 1) {
  const f = bag.field;
  const c = Math.cos(bag.yaw); const s = Math.sin(bag.yaw);
  let changed = false;
  for (let j = 0; j <= M; j++) {
    for (let i = 0; i <= M; i++) {
      const u = -1 + (2 * i) / M; const v = -1 + (2 * j) / M;
      const [lx, lz] = mapUV(u, v);
      const x = bag.x + lx * c + lz * s; const z = bag.z - lx * s + lz * c;
      let h = boardSag(x, z);
      for (const o of under) { const t = topOf(o, x, z); if (t > h) h = t; }
      h *= amount;
      const q = j * (M + 1) + i;
      if (Math.abs(f[q] - h) > 1e-5) { f[q] = h; changed = true; }
    }
  }
  return changed;
}

export function newField() { return new Float32Array((M + 1) * (M + 1)); }

// Writes the drape field (plus the airborne belly) into the mesh.
export function applyField(geo, field, airAmt = 0, flutter = 0, time = 0) {
  const { rest, cell, fx, fz, air, gu, gv } = geo.userData;
  const pos = geo.attributes.position.array;
  const r = M + 1;
  for (let q = 0, n = cell.length; q < n; q++) {
    const i0 = cell[q]; const a = fx[q]; const b = fz[q];
    let h = (field[i0] * (1 - a) + field[i0 + 1] * a) * (1 - b) + (field[i0 + r] * (1 - a) + field[i0 + r + 1] * a) * b;
    if (airAmt) h += air[q] * airAmt;
    if (flutter) h += flutter * gu[q] * gv[q] * Math.sin(time * 13 + gu[q] * 2.1) * 0.02;
    pos[q * 3 + 1] = rest[q * 3 + 1] + h;
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
}

/* ------------------------------------------------------------------ fabric */
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// Printed duck cloth: twill weave, the print, a darker seam band and a stitch line.
// Pass an existing texture to redraw it in place (once the logo loads).
export function bagTexture(opts, logo, into) {
  const W = 512; const c = into ? into.image : canvas(W, W); const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]);
  g.fillStyle = opts.base; g.fillRect(0, 0, W, W);
  // soft mottling from the dye and the fill underneath
  for (let i = 0; i < 70; i++) {
    const x = rnd(0, W); const y = rnd(0, W); const r = rnd(30, 110);
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const dark = Math.random() < 0.5;
    grd.addColorStop(0, dark ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.05)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // print
  if (opts.pattern === 'logo' && logo) {
    g.save(); g.globalAlpha = 0.92;
    const lw = W * 0.62; const lh = lw * (logo.height / logo.width);
    g.translate(W / 2, W / 2); g.rotate(-0.06);
    g.drawImage(logo, -lw / 2, -lh / 2, lw, lh);
    g.restore();
  } else if (opts.pattern === 'logo') {
    g.font = 'italic 900 150px "Barlow Condensed", Impact, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = opts.mark;
    g.fillText('LU', W / 2, W / 2 + 6);
  } else if (opts.pattern === 'star') {
    // shards of print with a white star badge, like the blue pro bags in the film
    g.save(); g.globalAlpha = 0.9;
    for (let i = 0; i < 22; i++) {
      g.fillStyle = i % 3 ? opts.print : opts.print2;
      g.beginPath();
      const x = rnd(-40, W + 40); const y = rnd(-40, W + 40); const s = rnd(40, 110);
      g.moveTo(x, y); g.lineTo(x + s, y + rnd(-s, s) * 0.35); g.lineTo(x + rnd(0, s), y + s); g.closePath(); g.fill();
    }
    g.restore();
    g.save(); g.translate(W / 2, W / 2); g.rotate(0.08);
    g.strokeStyle = opts.mark; g.lineWidth = 12;
    g.beginPath(); g.arc(0, 0, 118, 0, Math.PI * 2); g.stroke();
    g.fillStyle = opts.mark; g.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 40 : 96; const a = -Math.PI / 2 + (k * Math.PI) / 5;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath(); g.fill();
    g.restore();
  } else {
    // angular geometric print, like the patterned pro bags in the film
    g.save(); g.globalAlpha = 0.85;
    for (let i = 0; i < 26; i++) {
      g.fillStyle = i % 3 ? opts.print : opts.print2;
      g.beginPath();
      const x = rnd(-40, W + 40); const y = rnd(-40, W + 40); const s = rnd(30, 90);
      g.moveTo(x, y); g.lineTo(x + s, y + rnd(-s, s) * 0.4); g.lineTo(x + rnd(0, s), y + s); g.closePath(); g.fill();
    }
    g.restore();
  }
  // twill weave
  g.globalAlpha = 1;
  for (let y = -W; y < W; y += 3) {
    g.strokeStyle = `rgba(0,0,0,${(0.035 + Math.random() * 0.035).toFixed(3)})`;
    g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + W); g.stroke();
  }
  for (let x = 0; x < W; x += 2) {
    g.fillStyle = `rgba(255,255,255,${(0.012 + Math.random() * 0.02).toFixed(3)})`;
    g.fillRect(x, 0, 1, W);
  }
  // seam band and stitching
  g.lineWidth = 34; g.strokeStyle = 'rgba(0,0,0,.18)'; g.strokeRect(0, 0, W, W);
  g.setLineDash([13, 9]); g.lineWidth = 4; g.strokeStyle = opts.stitch;
  g.strokeRect(24, 24, W - 48, W - 48);
  g.setLineDash([]);
  // wear: scuffs from sliding on boards
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(255,255,255,${rnd(0.02, 0.06).toFixed(3)})`;
    g.lineWidth = rnd(1, 3);
    const x = rnd(40, W - 40); const y = rnd(40, W - 40);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(-30, 30), y + rnd(-8, 8)); g.stroke();
  }
  if (into) { into.needsUpdate = true; return into; }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Fine weave bumps as a normal map, shared by every bag.
export function weaveNormalMap() {
  const S = 256; const c = canvas(S, S); const g = c.getContext('2d');
  const hgt = new Float32Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const warp = Math.sin((x + y) * 0.9) * 0.5 + 0.5;
      const weft = Math.sin((x - y) * 0.45 + Math.sin(y * 0.2)) * 0.5 + 0.5;
      hgt[y * S + x] = warp * 0.6 + weft * 0.4 + Math.random() * 0.15;
    }
  }
  const img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const l = hgt[y * S + ((x - 1 + S) % S)]; const r = hgt[y * S + ((x + 1) % S)];
      const u = hgt[((y - 1 + S) % S) * S + x]; const d = hgt[((y + 1) % S) * S + x];
      let nx = (l - r) * 1.2; let ny = (u - d) * 1.2; const nz = 1;
      const len = Math.hypot(nx, ny, nz); nx /= len; ny /= len;
      const o = (y * S + x) * 4;
      img.data[o] = (nx * 0.5 + 0.5) * 255; img.data[o + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[o + 2] = (nz / len * 0.5 + 0.5) * 255; img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 5);
  return t;
}

// Soft contact shadow that sits under a bag.
export function contactTexture() {
  const S = 128; const c = canvas(S, S); const g = c.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, S * 0.18, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(0.55, 'rgba(0,0,0,.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(c);
}
