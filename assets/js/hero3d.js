// Home hero: a broadcast-style cornhole court in 3D.
// Modeled on real ACL event footage: wrapped glossy board tops, natural birch
// frames, red carpet lanes on polished concrete, a score tower, printed bags.
// Units are feet. Board 2 x 4, 6 inch hole 9 inches from the back edge,
// front edge about 3 inches off the ground, back edge 12 inches.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const HOLE_Z = -1.25;
const DECK_T = 0.06;
const RAIL_H = 0.2;
const TILT = Math.asin(0.75 / 4);
const BOARD_Y = 0.625;
const LANE = 31; // front edge to front edge is 27ft, plus the far board's length

const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inQuad: (t) => t * t,
  outBounce: (t) => (t < 0.5 ? 1 - Math.pow(1 - t * 2, 2) * 0.35 : 1),
};
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------------------------------------------------------------- textures */
function cvs(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, c);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { tex: t, canvas: c, g };
}

// Printed board wrap: Level Up orange on charcoal, ring around the hole.
function drawWrap(g, logo) {
  const W = 1024; const H = 2048;
  // cream vinyl wrap with a faint print texture
  g.fillStyle = '#F2EADB'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(120,96,62,${rnd(0.012, 0.045).toFixed(3)})`;
    g.fillRect(rnd(0, W), rnd(0, H), rnd(1, 3), rnd(1, 3));
  }
  const shade = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1200);
  shade.addColorStop(0, 'rgba(255,255,255,0)'); shade.addColorStop(1, 'rgba(90,70,40,.10)');
  g.fillStyle = shade; g.fillRect(0, 0, W, H);
  // border lines like the real boards
  g.strokeStyle = '#1B1E2A'; g.lineWidth = 18; g.strokeRect(44, 44, W - 88, H - 88);
  g.strokeStyle = '#E4561B'; g.lineWidth = 7; g.strokeRect(76, 76, W - 152, H - 152);
  // ring around the hole (hole center sits at canvas y 384)
  const hx = W / 2; const hy = 384;
  g.fillStyle = '#E4561B'; g.beginPath(); g.arc(hx, hy, 236, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#1B1E2A'; g.lineWidth = 8; g.beginPath(); g.arc(hx, hy, 236, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#F2EADB'; g.beginPath(); g.arc(hx, hy, 160, 0, Math.PI * 2); g.fill();
  // text around the ring, reading for the thrower
  g.fillStyle = '#FFFFFF';
  g.font = '800 30px "Barlow Condensed", Impact, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const ringText = 'LEVEL UP  ·  CERTIFIED  ·  LEVEL UP  ·  ';
  const span = Math.PI * 0.92;
  for (let i = 0; i < ringText.length; i++) {
    const a = Math.PI - (Math.PI - span) / 2 - (i / (ringText.length - 1)) * span;
    g.save();
    g.translate(hx + Math.cos(a) * 198, hy + Math.sin(a) * 198);
    g.rotate(a - Math.PI / 2);
    g.fillText(ringText[i], 0, 0);
    g.restore();
  }
  // side edge text, like the "anyone can play" strip
  g.save();
  g.translate(W - 118, 640); g.rotate(Math.PI / 2);
  g.font = '700 30px "JetBrains Mono", monospace'; g.fillStyle = '#1B1E2A';
  g.fillText('LEVELUPCORNHOLE.SHOP', 0, 0);
  g.restore();
  g.save();
  g.translate(118, 640); g.rotate(-Math.PI / 2);
  g.font = '700 30px "JetBrains Mono", monospace'; g.fillStyle = '#1B1E2A';
  g.fillText('LEVEL UP CERTIFIED', 0, 0);
  g.restore();
  // logo and wordmark near the thrower end
  if (logo) {
    const lw = 520; const lh = lw * (logo.height / logo.width);
    g.save(); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 18;
    g.drawImage(logo, W / 2 - lw / 2, 1060, lw, lh);
    g.restore();
  }
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = 'italic 900 118px "Barlow Condensed", Impact, sans-serif';
  g.fillStyle = '#1B1E2A';
  g.fillText('LEVEL UP', W / 2, 1810);
  g.font = '700 34px "JetBrains Mono", monospace';
  g.fillStyle = '#E4561B';
  g.fillText('C E R T I F I E D', W / 2, 1866);
}

// Birch plywood for the frame and legs.
function drawWood(g) {
  const W = 512; const H = 512;
  g.fillStyle = '#C9A470'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    const y = rnd(0, H);
    g.strokeStyle = `rgba(${rnd(90, 140) | 0},${rnd(60, 95) | 0},${rnd(25, 55) | 0},${rnd(0.05, 0.22).toFixed(2)})`;
    g.lineWidth = rnd(0.6, 3.4);
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin((x + i * 17) * 0.02) * rnd(1, 5));
    g.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const x = rnd(40, W - 40); const y = rnd(40, H - 40);
    const rr = rnd(6, 16);
    const grd = g.createRadialGradient(x, y, 1, x, y, rr * 2.4);
    grd.addColorStop(0, 'rgba(104,70,34,.55)'); grd.addColorStop(1, 'rgba(104,70,34,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, rr * 2.4, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 0.5; g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, 0, W, 60); g.globalAlpha = 1;
}

// Front rail stamp, like the ACL PRO stamp on real boards.
function drawRail(g) {
  const W = 1024; const H = 128;
  g.fillStyle = '#C9A470'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = `rgba(120,80,40,${rnd(0.05, 0.18).toFixed(2)})`;
    g.lineWidth = rnd(0.6, 2.6);
    const y = rnd(0, H);
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + rnd(-4, 4)); g.stroke();
  }
  g.fillStyle = '#17171B';
  g.textAlign = 'center';
  g.font = 'italic 900 62px "Barlow Condensed", Impact, sans-serif';
  g.fillText('LEVEL UP', W / 2 - 92, 76);
  g.fillStyle = '#F36C21';
  g.font = '700 30px "JetBrains Mono", monospace';
  g.fillText('CERTIFIED  2026/27', W / 2 + 132, 72);
  // screws
  ['#8a7047', '#8a7047'].forEach((c, i) => {
    const x = i === 0 ? 40 : W - 40;
    g.fillStyle = c; g.beginPath(); g.arc(x, H / 2, 9, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x - 5, H / 2); g.lineTo(x + 5, H / 2); g.stroke();
  });
  return null;
}

// Red carpet lane mats with white brush marks and a sponsor strip.
function drawMat(g) {
  const W = 512; const H = 1024;
  g.fillStyle = '#17181E'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 3500; i++) {
    g.fillStyle = `rgba(255,255,255,${rnd(0.01, 0.035).toFixed(3)})`;
    g.fillRect(rnd(0, W), rnd(0, H), rnd(1, 2), rnd(1, 2));
  }
  g.strokeStyle = '#C3261A'; g.lineWidth = 14; g.strokeRect(10, 10, W - 20, H - 20);
  g.fillStyle = 'rgba(255,255,255,.45)';
  g.font = '700 22px "JetBrains Mono", monospace'; g.textAlign = 'center';
  g.fillText('LEVEL UP CORNHOLE', W / 2, 60);
  g.fillText('LEVEL UP CERTIFIED', W / 2, H - 44);
}

// Printed competition bag faces.
function drawBagFace(g, opts) {
  const W = 256;
  g.fillStyle = opts.base; g.fillRect(0, 0, W, W);
  // duck cloth weave
  for (let y = 0; y < W; y += 2) { g.fillStyle = `rgba(0,0,0,${(0.03 + Math.random() * 0.05).toFixed(3)})`; g.fillRect(0, y, W, 1); }
  for (let x = 0; x < W; x += 2) { g.fillStyle = `rgba(255,255,255,${(0.02 + Math.random() * 0.04).toFixed(3)})`; g.fillRect(x, 0, 1, W); }
  // printed pattern
  g.save(); g.globalAlpha = 0.9;
  for (let i = 0; i < 22; i++) {
    g.fillStyle = opts.print;
    g.save();
    g.translate(rnd(0, W), rnd(0, W)); g.rotate(rnd(0, Math.PI));
    g.fillRect(-rnd(14, 40), -rnd(3, 9), rnd(28, 80), rnd(6, 18));
    g.restore();
  }
  g.restore();
  // mark
  g.font = 'italic 900 70px "Barlow Condensed", Impact, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = opts.mark;
  g.fillText('LU', W / 2, W / 2 + 4);
  // stitched edge
  const roundRect = (x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };
  g.setLineDash([11, 9]); g.lineWidth = 5; g.strokeStyle = opts.stitch;
  roundRect(20, 20, W - 40, W - 40, 44); g.stroke();
  g.setLineDash([]);
  g.lineWidth = 9; g.strokeStyle = 'rgba(0,0,0,.25)';
  roundRect(5, 5, W - 10, W - 10, 56); g.stroke();
}

function drawTower(g) {
  const W = 256; const H = 1024;
  g.fillStyle = '#15151A'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#F4F1EA'; g.fillRect(18, 60, W - 36, H - 120);
  for (let i = 0; i < 21; i++) {
    const y = 70 + i * 42;
    g.fillStyle = i % 2 ? '#B3140F' : '#F4F1EA';
    g.fillRect(22, y, W - 44, 40);
    g.fillStyle = i % 2 ? '#F4F1EA' : '#B3140F';
    g.font = '700 28px "JetBrains Mono", monospace'; g.textAlign = 'center';
    g.fillText(String(21 - i), W / 2, y + 29);
  }
  g.fillStyle = '#F36C21'; g.fillRect(0, 0, W, 54);
  g.fillStyle = '#0B0B0E'; g.font = 'italic 900 34px "Barlow Condensed", Impact, sans-serif';
  g.textAlign = 'center'; g.fillText('LEVEL UP', W / 2, 38);
}

function drawBanner(g) {
  const W = 2048; const H = 256;
  g.fillStyle = '#0C0C10'; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(243,108,33,.9)'; g.fillRect(0, H - 16, W, 16);
  g.textAlign = 'left';
  for (let i = 0; i < 6; i++) {
    g.font = 'italic 900 88px "Barlow Condensed", Impact, sans-serif';
    g.fillStyle = i % 2 ? 'rgba(255,255,255,.16)' : 'rgba(243,108,33,.5)';
    g.fillText('LEVEL UP CORNHOLE', 40 + i * 350, 150);
  }
  return null;
}

function softDot(color = 'rgba(255,255,255,1)') {
  return cvs(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, color); r.addColorStop(0.4, 'rgba(255,220,180,.35)'); r.addColorStop(1, 'rgba(255,180,120,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }).tex;
}

function pillow(geo, half) {
  const p = geo.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = Math.min(1, Math.max(Math.abs(v.x), Math.abs(v.z)) / half);
    p.setY(i, v.y * (1 - 0.42 * Math.pow(d, 2.6)));
  }
  geo.computeVertexNormals();
  return geo;
}

/* ---------------------------------------------------------------- shots */
const SHOTS = {
  slideIn: { land: [0.05, 0.055, 0.55], end: [0, 0.055, HOLE_Z], slide: 0.78, result: 'in', arc: 2.1, name: 'Slide' },
  airmailIn: { land: [0, 0.3, HOLE_Z], end: null, slide: 0, result: 'in', arc: 3.0, name: 'Airmail' },
  woodie: { land: [0.4, 0.055, 0.3], end: [0.36, 0.055, -0.25], slide: 0.5, result: 'on', arc: 2.0, name: 'Woodie' },
  blocker: { land: [-0.06, 0.055, 0.2], end: [-0.04, 0.055, -0.72], slide: 0.62, result: 'on', arc: 1.95, name: 'Blocker' },
  short: { land: [0.25, 0.05, 2.75], end: null, slide: 0, result: 'off', arc: 1.7, name: 'Short' },
};

const ROUNDS = [
  [['o', 'slideIn'], ['w', 'woodie', -0.46, -0.1], ['o', 'airmailIn'], ['w', 'slideIn'],
    ['o', 'woodie', 0.44, -0.42], ['w', 'short'], ['o', 'slideIn'], ['w', 'woodie', -0.34, 0.55]],
  [['w', 'airmailIn'], ['o', 'blocker'], ['w', 'slideIn'], ['o', 'slideIn'],
    ['w', 'woodie', 0.48, -0.2], ['o', 'woodie', -0.5, 0.2], ['w', 'woodie', 0.3, 0.75], ['o', 'short']],
];
const THROW_GAP = 1.8;

/* ---------------------------------------------------------------- scene */
export function startHero({ canvas, container, logoUrl, onScore, onRound, onReady }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) { return null; }
  if (!renderer || !renderer.getContext()) return null;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => container.clientWidth < 760;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small() ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x141416, 20, 62);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  const camBase = new THREE.Vector3();
  const camLook = new THREE.Vector3();

  /* venue lighting */
  scene.add(new THREE.HemisphereLight(0xf2f0ea, 0x2a2018, 0.62));
  const key = new THREE.DirectionalLight(0xfff6ec, 2.1);
  key.position.set(-5, 9, 4);
  scene.add(key);
  const overhead = new THREE.SpotLight(0xffffff, 38, 15, 0.6, 0.85, 1.6);
  overhead.position.set(0.4, 8, -0.5);
  overhead.target.position.set(0, 0, -0.5);
  scene.add(overhead, overhead.target);
  const farLight = new THREE.SpotLight(0xffeedd, 70, 26, 0.6, 0.8, 1.6);
  farLight.position.set(0, 8, -28);
  farLight.target.position.set(0, 0, -29);
  scene.add(farLight, farLight.target);
  const warm = new THREE.PointLight(0xff8a2b, 22, 12, 2);
  warm.position.set(2.8, 1.6, 2.2);
  scene.add(warm);

  /* floor: hardwood gym court, like the event footage */
  const floorTex = cvs(1024, 1024, (g) => {
    const W = 1024;
    for (let col = 0; col < 32; col++) {
      let y = -rnd(0, 240);
      while (y < W) {
        const len = rnd(180, 440);
        const t = Math.random();
        g.fillStyle = `rgb(${(192 + t * 30) | 0},${(146 + t * 26) | 0},${(94 + t * 20) | 0})`;
        g.fillRect(col * 32, y, 32, len);
        for (let k = 0; k < 7; k++) {
          g.fillStyle = `rgba(120,78,36,${rnd(0.04, 0.11).toFixed(2)})`;
          g.fillRect(col * 32 + rnd(2, 30), y + rnd(0, len), 1, rnd(18, 90));
        }
        g.fillStyle = 'rgba(60,38,18,.35)'; g.fillRect(col * 32, y + len - 1, 32, 2);
        y += len;
      }
      g.fillStyle = 'rgba(60,38,18,.25)'; g.fillRect(col * 32 + 31, 0, 1, W);
    }
    const sheen = g.createLinearGradient(0, 0, W, W);
    sheen.addColorStop(0, 'rgba(255,255,255,.07)'); sheen.addColorStop(0.5, 'rgba(255,255,255,0)'); sheen.addColorStop(1, 'rgba(255,255,255,.05)');
    g.fillStyle = sheen; g.fillRect(0, 0, W, W);
  }).tex;
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(12, 12);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.32, metalness: 0.02, color: 0xb3a89b }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  /* mats */
  const matTex = cvs(512, 1024, drawMat).tex;
  const matMat = new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.95, metalness: 0 });
  const addMat = (z, w = 3.9, l = 7.2) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, l), matMat);
    m.position.set(0, 0.006, z);
    scene.add(m);
    return m;
  };
  addMat(0.2, 4.1, 9.2);
  addMat(-(LANE - 1.2));
  addMat(-(LANE + 5.2), 4.2, 5.5);

  /* board builder */
  const wrapTex = cvs(1024, 2048, (g) => drawWrap(g, null));
  wrapTex.tex.repeat.set(0.5, 0.25);
  wrapTex.tex.offset.set(0.5, 0.5);
  const woodTex = cvs(512, 512, drawWood).tex;
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  const railTex = cvs(1024, 128, drawRail).tex;

  const deckMat = new THREE.MeshPhysicalMaterial({ map: wrapTex.tex, roughness: 0.18, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 0.9 });
  const edgeMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55 });
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62 });
  const railMat = new THREE.MeshStandardMaterial({ map: railTex, roughness: 0.5 });

  function buildBoard() {
    const group = new THREE.Group();
    const shape = new THREE.Shape();
    const rr = 0.03;
    shape.moveTo(-1 + rr, -2); shape.lineTo(1 - rr, -2); shape.quadraticCurveTo(1, -2, 1, -2 + rr);
    shape.lineTo(1, 2 - rr); shape.quadraticCurveTo(1, 2, 1 - rr, 2); shape.lineTo(-1 + rr, 2);
    shape.quadraticCurveTo(-1, 2, -1, 2 - rr); shape.lineTo(-1, -2 + rr); shape.quadraticCurveTo(-1, -2, -1 + rr, -2);
    const hole = new THREE.Path();
    hole.absarc(0, -HOLE_Z, 0.25, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: DECK_T, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2, curveSegments: 64 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -DECK_T, 0);
    group.add(new THREE.Mesh(geo, [deckMat, edgeMat]));

    [-0.94, 0.94].forEach((x) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.11, RAIL_H, 3.98), woodMat);
      m.position.set(x, -DECK_T - RAIL_H / 2, 0);
      group.add(m);
    });
    const front = new THREE.Mesh(new THREE.BoxGeometry(1.88, RAIL_H, 0.11), woodMat);
    front.position.set(0, -DECK_T - RAIL_H / 2, 1.95);
    group.add(front);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.88, RAIL_H, 0.11), railMat);
    back.position.set(0, -DECK_T - RAIL_H / 2, -1.95);
    group.add(back);
    return group;
  }

  function addLegs(z) {
    [-0.78, 0.78].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.1), woodMat);
      leg.position.set(x, 0.36, z);
      scene.add(leg);
    });
  }

  // near board (bags land here, hole faces the camera)
  const board = buildBoard();
  board.position.set(0, BOARD_Y, 0);
  board.rotation.x = TILT;
  scene.add(board);
  addLegs(-1.78);

  // far board down the lane
  const farBoard = buildBoard();
  farBoard.position.set(0, BOARD_Y, -LANE);
  farBoard.rotation.set(-TILT, Math.PI, 0);
  scene.add(farBoard);
  [-0.78, 0.78].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.1), woodMat);
    leg.position.set(x, 0.36, -(LANE - 1.78));
    scene.add(leg);
  });

  /* hole glow + score flash */
  const holeGlow = new THREE.Mesh(new THREE.CircleGeometry(0.245, 48), new THREE.MeshBasicMaterial({
    map: cvs(128, 128, (g) => {
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, '#120A05'); r.addColorStop(0.6, '#0A0603'); r.addColorStop(1, '#050302');
      g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    }).tex,
    toneMapped: false, side: THREE.DoubleSide,
  }));
  holeGlow.rotation.x = -Math.PI / 2;
  holeGlow.position.set(0, -0.62, HOLE_Z);
  board.add(holeGlow);
  const catchBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.248, 0.248, 0.62, 36, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.95, side: THREE.BackSide }),
  );
  catchBox.position.set(0, -0.32, HOLE_Z);
  board.add(catchBox);
  const flash = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.4, 64), new THREE.MeshBasicMaterial({ color: 0xff7a1f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  flash.rotation.x = -Math.PI / 2;
  flash.position.set(0, 0.007, HOLE_Z);
  board.add(flash);
  const holeAnchor = new THREE.Object3D();
  holeAnchor.position.set(0, 0.12, HOLE_Z);
  board.add(holeAnchor);

  /* score tower + banner */
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.6, 0.06), new THREE.MeshStandardMaterial({ map: cvs(256, 1024, drawTower).tex, roughness: 0.7 }));
  tower.position.set(2.6, 1.55, -(LANE - 2.4));
  tower.rotation.y = 0.45;
  scene.add(tower);
  const towerPost = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.08), new THREE.MeshStandardMaterial({ color: 0x1a1a1f, roughness: 0.6 }));
  towerPost.position.set(2.6, 0.6, -(LANE - 2.4));
  scene.add(towerPost);

  const crowd = cvs(2048, 512, (g) => {
    const W = 2048; const H = 512;
    const wall = g.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, '#1B2A4E'); wall.addColorStop(0.55, '#23365F'); wall.addColorStop(1, '#141A2A');
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 256) {
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x + 30, 40, 190, 170);
      g.fillStyle = 'rgba(243,108,33,.55)'; g.fillRect(x + 30, 200, 190, 10);
      g.font = 'italic 900 44px "Barlow Condensed", Impact, sans-serif'; g.fillStyle = 'rgba(255,255,255,.35)';
      g.textAlign = 'center'; g.fillText('LEVEL UP', x + 125, 140);
    }
    for (let i = 0; i < 260; i++) {
      const x = rnd(0, W); const y = rnd(300, 470); const sc = rnd(0.7, 1.25);
      g.fillStyle = ['#0F1118', '#1A1C24', '#2A2D38', '#3A2A22', '#4A3A30', '#262A36'][i % 6];
      g.beginPath(); g.arc(x, y, 14 * sc, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(x, y + 44 * sc, 26 * sc, 32 * sc, 0, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#0C0D12'; g.fillRect(0, 470, W, 42);
  });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(90, 22.5), new THREE.MeshStandardMaterial({ map: crowd.tex, roughness: 0.9 }));
  backdrop.position.set(0, 11.25, -(LANE + 16));
  scene.add(backdrop);
  // other courts down the gym, like a real event floor
  [6.4, 14].forEach((x) => {
    [-12, -24, -36].forEach((z) => {
      const b = buildBoard();
      b.position.set(x, BOARD_Y, z);
      b.rotation.set(TILT, 0, 0);
      scene.add(b);
      [-0.78, 0.78].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.1), woodMat);
        leg.position.set(x + lx, 0.36, z - 1.78);
        scene.add(leg);
      });
      const m = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.012, 6.8), matMat);
      m.position.set(x, 0.006, z + 1.6);
      scene.add(m);
    });
  });

  /* light cones for the broadcast look */
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff0dd, transparent: true, opacity: 0.022, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  [[0.2, -0.3], [0, -LANE]].forEach(([x, z]) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8, 32, 1, true), coneMat);
    cone.position.set(x, 4.1, z);
    scene.add(cone);
  });

  /* bags */
  const BAG = 0.5;
  const makeBagGeo = (seed) => {
    const geo = new RoundedBoxGeometry(BAG, BAG, BAG, 7, 0.16);
    geo.scale(1, 0.34, 1);
    const pos = geo.attributes.position; const v = new THREE.Vector3();
    const p1 = seed * 1.9 + 0.4; const p2 = seed * 2.7 + 1.1;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const d = Math.min(1, Math.max(Math.abs(v.x), Math.abs(v.z)) / (BAG / 2));
      let y = v.y * (1 - 0.46 * Math.pow(d, 2.4));
      y *= 1 + 0.16 * Math.sin(v.x * 10 + p1) * Math.cos(v.z * 8 + p2);
      if (v.y > 0) y -= 0.02 * Math.sin(v.x * 4 + p2) * (1 - d);
      pos.setXYZ(i, v.x * (1 + 0.025 * Math.sin(v.z * 11 + p1)), y, v.z * (1 + 0.025 * Math.cos(v.x * 11 + p2)));
    }
    geo.computeVertexNormals();
    return geo;
  };
  const bagGeos = [0, 1, 2, 3].map(makeBagGeo);
  const bagMats = {
    o: new THREE.MeshStandardMaterial({ map: cvs(256, 256, (g) => drawBagFace(g, { base: '#E25A17', print: 'rgba(90,28,6,.5)', mark: 'rgba(255,255,255,.9)', stitch: 'rgba(255,225,200,.85)' })).tex, roughness: 0.97, metalness: 0 }),
    w: new THREE.MeshStandardMaterial({ map: cvs(256, 256, (g) => drawBagFace(g, { base: '#4B4F5A', print: 'rgba(20,22,28,.45)', mark: 'rgba(255,255,255,.8)', stitch: 'rgba(255,255,255,.5)' })).tex, roughness: 0.97, metalness: 0 }),
  };
  const pool = [];
  const getBag = (team) => {
    let b = pool.find((x) => !x.userData.busy);
    if (!b) { b = new THREE.Mesh(bagGeos[pool.length % bagGeos.length], bagMats[team]); board.add(b); pool.push(b); }
    b.material = bagMats[team];
    b.userData.busy = true;
    b.visible = true;
    b.scale.set(1, 1, 1);
    return b;
  };

  /* particles: venue haze + dust puffs */
  const dot = softDot();
  const N = small() ? 90 : 190;
  const pPos = new Float32Array(N * 3); const pSpd = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pPos[i * 3] = rnd(-7, 7);
    pPos[i * 3 + 1] = rnd(0, 5);
    pPos[i * 3 + 2] = rnd(-16, 8);
    pSpd[i] = rnd(0.02, 0.12);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.04, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd9b0, opacity: 0.4 })));

  const B = 60;
  const bPos = new Float32Array(B * 3); const bVel = new Float32Array(B * 3);
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  const burstMat = new THREE.PointsMaterial({ size: 0.075, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffc070, opacity: 0 });
  scene.add(new THREE.Points(bGeo, burstMat));
  let burstLife = 0;
  const tmp = new THREE.Vector3();
  function burstAt(obj, strength = 1, spreadUp = 2.4) {
    obj.getWorldPosition(tmp);
    for (let i = 0; i < B; i++) {
      bPos[i * 3] = tmp.x; bPos[i * 3 + 1] = tmp.y; bPos[i * 3 + 2] = tmp.z;
      const a = Math.random() * Math.PI * 2; const s = rnd(0.4, 1.5) * strength;
      bVel[i * 3] = Math.cos(a) * s * 0.7;
      bVel[i * 3 + 1] = rnd(0.6, spreadUp) * strength;
      bVel[i * 3 + 2] = Math.sin(a) * s * 0.7;
    }
    bGeo.attributes.position.needsUpdate = true;
    burstLife = 1;
  }

  /* logo + fonts, then redraw the wrap */
  const img = new Image();
  const fontsReady = (document.fonts && document.fonts.ready) ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  fontsReady.then(() => {
    const finish = (logo) => {
      drawWrap(wrapTex.g, logo);
      wrapTex.tex.needsUpdate = true;
    };
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = logoUrl;
  });

  /* framing */
  function frame() {
    const w = container.clientWidth; const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (w / h > 1.05) {
      camera.fov = 32;
      camera.setViewOffset(w, h, -w * 0.2, h * 0.04, w, h);
      camBase.set(3.1, 4.3, 9.6); camLook.set(0.05, 0.3, -3.2);
    } else {
      camera.fov = 40;
      camera.setViewOffset(w, h, 0, h * 0.16, w, h);
      camBase.set(1.4, 6.4, 14.2); camLook.set(0, 0.05, -2.8);
    }
    camera.updateProjectionMatrix();
  }
  frame();
  const ro = new ResizeObserver(() => { frame(); if (!running) renderer.render(scene, camera); });
  ro.observe(container);

  const ptr = { x: 0, y: 0 }; const sm = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ------------------------------------------------- throw engine */
  const active = [];
  const resting = [];
  let clock = 0; let roundIdx = 0; let roundStart = 1.2; let fired = 0; let scored = false;
  let roundPts = { o: 0, w: 0 };
  let match = { o: 0, w: 0 };
  let roundNo = 1;

  const screenOf = (obj) => {
    obj.getWorldPosition(tmp);
    tmp.project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * container.clientWidth, y: (-tmp.y * 0.5 + 0.5) * container.clientHeight };
  };

  function launch(i) {
    const [team, shotName, ox, oz] = ROUNDS[roundIdx][i];
    const s = SHOTS[shotName];
    const mesh = getBag(team);
    // start the throw in world space (just behind the camera) then convert to board space
    const from = board.worldToLocal(new THREE.Vector3(rnd(2.0, 3.2), rnd(1.3, 1.7), rnd(7.6, 8.6)));
    mesh.position.copy(from);
    mesh.rotation.set(rnd(-0.5, -0.2), rnd(0, 6), rnd(-0.15, 0.15));
    const land = new THREE.Vector3(
      (ox !== undefined ? ox : s.land[0]) + rnd(-0.05, 0.05),
      s.land[1],
      (oz !== undefined ? oz : s.land[2]) + rnd(-0.08, 0.08),
    );
    const end = s.end ? new THREE.Vector3(s.end[0] + rnd(-0.04, 0.04), s.end[1], s.end[2] + rnd(-0.05, 0.05)) : null;
    active.push({ mesh, s, team, i, shotName, phase: 'fly', t: 0, from, land, end, spin: rnd(6, 10) * (Math.random() < 0.5 ? 1 : -1) });
  }

  function addPoints(team, pts, kind, shotName, mesh) {
    roundPts[team] += pts;
    if (kind === 'in') {
      flash.material.opacity = 0.55;
      burstAt(holeAnchor, 1.25, 3);
    }
    if (onScore) {
      onScore({
        team, pts, kind, shot: SHOTS[shotName].name, roundPts: { ...roundPts },
        match: { ...match }, index: fired - 1, screen: screenOf(kind === 'in' ? holeAnchor : mesh),
      });
    }
  }

  function nudgeNeighbors(bag) {
    resting.forEach((r) => {
      if (r === bag) return;
      const dx = r.mesh.position.x - bag.mesh.position.x;
      const dz = r.mesh.position.z - bag.mesh.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.46 && d > 0.001) {
        const push = (0.46 - d) * 0.75;
        r.nudge = { t: 0, dur: 0.28, x: (dx / d) * push, z: (dz / d) * push, rot: rnd(-0.25, 0.25) };
      }
    });
  }

  function clearBoard() {
    resting.forEach((r) => { r.phase = 'clear'; r.t = 0; });
  }

  function step(dt) {
    clock += dt;
    const round = ROUNDS[roundIdx];
    const tr = clock - roundStart;

    if (fired < round.length && tr >= fired * THROW_GAP) {
      if (fired === 0 && onRound) onRound({ phase: 'start', round: roundNo, match: { ...match }, roundPts: { ...roundPts } });
      launch(fired);
      fired += 1;
    }

    for (let k = active.length - 1; k >= 0; k--) {
      const a = active[k];
      a.t += dt;
      if (a.phase === 'fly') {
        const dur = 1.05;
        const p = Math.min(1, a.t / dur);
        a.mesh.position.lerpVectors(a.from, a.land, p);
        a.mesh.position.y += a.s.arc * 4 * p * (1 - p);
        a.mesh.rotation.y += a.spin * dt;
        a.mesh.rotation.x = -0.45 * (1 - p) + Math.sin(p * 3) * 0.05;
        if (p >= 1) {
          a.t = 0;
          a.mesh.rotation.x = 0; a.mesh.rotation.z = 0;
          a.mesh.rotation.y = rnd(-0.3, 0.3);
          if (a.s.result === 'in' && !a.end) { a.phase = 'drop'; addPoints(a.team, 3, 'in', a.shotName, a.mesh); } else {
            a.phase = 'settle';
            a.mesh.scale.set(1.12, 0.62, 1.12);
            if (a.s.result === 'off') burstAt(a.mesh, 0.35, 0.7);
          }
        }
      } else if (a.phase === 'settle') {
        const p = Math.min(1, a.t / 0.18);
        const sc = 1.12 - 0.12 * ease.outCubic(p);
        a.mesh.scale.set(sc, 0.62 + 0.38 * ease.outCubic(p), sc);
        if (p >= 1) {
          a.t = 0;
          a.mesh.scale.set(1, 1, 1);
          nudgeNeighbors(a);
          if (a.end) a.phase = 'slide';
          else if (a.s.result === 'off') { a.phase = 'rest'; addPoints(a.team, 0, 'off', a.shotName, a.mesh); resting.push(a); active.splice(k, 1); }
          else { a.phase = 'rest'; a.mesh.rotation.x = rnd(-0.05, 0.05); a.mesh.rotation.z = rnd(-0.05, 0.05); addPoints(a.team, 1, 'on', a.shotName, a.mesh); resting.push(a); active.splice(k, 1); }
        }
      } else if (a.phase === 'slide') {
        const p = Math.min(1, a.t / a.s.slide);
        a.mesh.position.lerpVectors(a.land, a.end, ease.outQuint(p));
        a.mesh.rotation.y += a.spin * dt * (1 - p) * 0.18;
        if (p >= 1) {
          a.t = 0;
          if (a.s.result === 'in') { a.phase = 'drop'; addPoints(a.team, 3, 'in', a.shotName, a.mesh); } else {
            a.phase = 'rest';
            addPoints(a.team, 1, 'on', a.shotName, a.mesh);
            nudgeNeighbors(a);
            resting.push(a); active.splice(k, 1);
          }
        }
      } else if (a.phase === 'drop') {
        const p = Math.min(1, a.t / 0.42);
        const startY = (a.end ? a.end.y : a.land.y);
        a.mesh.position.y = startY - ease.inQuad(p) * 1.2;
        a.mesh.scale.set(1 - p * 0.35, 1 + p * 0.2, 1 - p * 0.15);
        a.mesh.rotation.x = p * 0.9;
        if (p >= 1) { a.mesh.visible = false; a.mesh.userData.busy = false; active.splice(k, 1); }
      }
    }

    // resting bag nudges and clearing
    for (let k = resting.length - 1; k >= 0; k--) {
      const r = resting[k];
      if (r.nudge) {
        r.nudge.t += dt;
        const p = Math.min(1, r.nudge.t / r.nudge.dur);
        const e = ease.outCubic(p);
        r.mesh.position.x += (r.nudge.x * dt) / r.nudge.dur * (1 - p) * 1.6;
        r.mesh.position.z += (r.nudge.z * dt) / r.nudge.dur * (1 - p) * 1.6;
        r.mesh.rotation.y += r.nudge.rot * dt;
        if (p >= 1) r.nudge = null;
      }
      if (r.phase === 'clear') {
        r.t += dt;
        const p = Math.min(1, r.t / 0.4);
        const sc = Math.max(0.001, 1 - ease.inQuad(p));
        r.mesh.scale.set(sc, sc, sc);
        if (p >= 1) { r.mesh.visible = false; r.mesh.userData.busy = false; resting.splice(k, 1); }
      }
    }

    // end of round
    const lastAt = (round.length - 1) * THROW_GAP + 2.6;
    if (fired === round.length && !scored && tr > lastAt) {
      scored = true;
      const diff = Math.abs(roundPts.o - roundPts.w);
      const winner = roundPts.o === roundPts.w ? null : (roundPts.o > roundPts.w ? 'o' : 'w');
      if (winner) match[winner] += diff;
      const gameOver = match.o >= 21 || match.w >= 21;
      if (onRound) onRound({ phase: 'end', round: roundNo, roundPts: { ...roundPts }, diff, winner, match: { ...match }, gameOver });
      setTimeout(() => clearBoard(), 1500);
      if (gameOver) {
        setTimeout(() => {
          if (onRound) onRound({ phase: 'game', winner: match.o >= 21 ? 'o' : 'w', match: { ...match } });
        }, 1900);
      }
    }

    if (scored && tr > lastAt + 3.4) {
      resting.forEach((r) => { r.mesh.visible = false; r.mesh.userData.busy = false; });
      resting.length = 0;
      active.forEach((a) => { a.mesh.visible = false; a.mesh.userData.busy = false; });
      active.length = 0;
      if (match.o >= 21 || match.w >= 21) { match = { o: 0, w: 0 }; roundNo = 0; }
      roundPts = { o: 0, w: 0 };
      roundIdx = (roundIdx + 1) % ROUNDS.length;
      roundNo += 1;
      roundStart = clock + 0.5;
      fired = 0; scored = false;
    }
  }

  /* ------------------------------------------------- loop */
  let running = false; let raf = 0; let last = 0; let elapsed = 0; let readyFired = false;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now; elapsed += dt;

    sm.x += (ptr.x - sm.x) * 0.04;
    sm.y += (ptr.y - sm.y) * 0.04;
    const scrollP = Math.min(1, window.scrollY / Math.max(1, container.clientHeight));
    const drift = Math.sin(elapsed * 0.24) * 0.12;
    camera.position.set(
      camBase.x + sm.x * 0.45 + drift,
      camBase.y - sm.y * 0.22 + scrollP * 1.5 + Math.sin(elapsed * 0.4) * 0.015,
      camBase.z + scrollP * 1.1,
    );
    camera.lookAt(camLook.x - sm.x * 0.12, camLook.y - scrollP * 0.4, camLook.z);

    try { step(dt); } catch (err) { if (!loop.warned) { loop.warned = true; console.error('hero step failed', err); } }

    for (let i = 0; i < N; i++) {
      const iy = i * 3 + 1;
      pPos[iy] += pSpd[i] * dt;
      pPos[iy - 1] += Math.sin(elapsed * 0.5 + i) * 0.0007;
      if (pPos[iy] > 5.2) pPos[iy] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;

    if (burstLife > 0) {
      burstLife = Math.max(0, burstLife - dt * 1.25);
      for (let i = 0; i < B; i++) {
        bVel[i * 3 + 1] -= 4.4 * dt;
        bPos[i * 3] += bVel[i * 3] * dt;
        bPos[i * 3 + 1] += bVel[i * 3 + 1] * dt;
        bPos[i * 3 + 2] += bVel[i * 3 + 2] * dt;
      }
      bGeo.attributes.position.needsUpdate = true;
      burstMat.opacity = burstLife * 0.9;
    }
    flash.material.opacity *= Math.pow(0.03, dt);
    flash.scale.setScalar(1 + (1 - flash.material.opacity) * 0.45);

    renderer.render(scene, camera);
    if (!readyFired) { readyFired = true; if (onReady) onReady(); }
  }
  function start() { if (running || reduced) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  if (reduced) {
    // static composition: a few bags on the board
    [['o', 0.1, -0.55], ['w', -0.45, 0.1], ['o', 0.42, 0.5], ['w', -0.2, 0.95]].forEach(([team, x, z]) => {
      const m = getBag(team);
      m.position.set(x, 0.055, z);
      m.rotation.y = rnd(-0.4, 0.4);
    });
    camera.position.copy(camBase);
    camera.lookAt(camLook);
    setTimeout(() => { renderer.render(scene, camera); if (onReady) onReady(); }, 150);
    img.addEventListener('load', () => setTimeout(() => renderer.render(scene, camera), 60));
  } else {
    const onScreen = () => {
      const r = container.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || 0) + 40;
    };
    const sync = () => ((onScreen() && !document.hidden) ? start() : stop());
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
  }

  return { start, stop };
}
