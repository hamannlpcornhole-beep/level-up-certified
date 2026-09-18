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
  const base = g.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, '#141419'); base.addColorStop(0.55, '#0F0F13'); base.addColorStop(1, '#1A120C');
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  // angled speed lines
  g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
  for (let i = -8; i < 26; i++) {
    g.fillStyle = i % 3 === 0 ? 'rgba(243,108,33,.20)' : 'rgba(255,255,255,.028)';
    g.save(); g.translate(i * 90, 0); g.rotate(0.28);
    g.fillRect(0, -400, i % 3 === 0 ? 16 : 34, 3000);
    g.restore();
  }
  // big brand block low on the board
  const blk = g.createLinearGradient(0, 1500, 0, 1900);
  blk.addColorStop(0, 'rgba(243,108,33,.95)'); blk.addColorStop(1, 'rgba(199,74,15,.95)');
  g.fillStyle = blk;
  g.beginPath(); g.moveTo(0, 1560); g.lineTo(W, 1460); g.lineTo(W, 1760); g.lineTo(0, 1860); g.closePath(); g.fill();
  g.restore();
  // hole ring
  const hx = W / 2; const hy = 384;
  g.strokeStyle = '#F4F1EA'; g.lineWidth = 26;
  g.beginPath(); g.arc(hx, hy, 168, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = '#F36C21'; g.lineWidth = 10;
  g.beginPath(); g.arc(hx, hy, 196, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 3;
  g.beginPath(); g.arc(hx, hy, 236, 0, Math.PI * 2); g.stroke();
  // wording
  g.textAlign = 'center';
  g.font = 'italic 900 132px "Barlow Condensed", Impact, sans-serif';
  g.fillStyle = '#0B0B0E';
  g.save(); g.translate(W / 2, 1690); g.rotate(-0.1); g.fillText('LEVEL UP CERTIFIED', 0, 0); g.restore();
  g.font = '700 34px "JetBrains Mono", monospace';
  g.fillStyle = 'rgba(255,255,255,.55)';
  g.fillText('LEVELUPCORNHOLE.SHOP', W / 2, 1980);
  g.font = '700 30px "JetBrains Mono", monospace'; g.fillStyle = 'rgba(255,255,255,.28)';
  g.fillText('2 FT x 4 FT  ·  6 IN HOLE', W / 2, 700);
  // wordmark that faces the camera side (drawn upside down in the wrap)
  g.save();
  g.translate(W / 2, 760);
  g.font = 'italic 900 96px "Barlow Condensed", Impact, sans-serif';
  g.fillStyle = 'rgba(255,255,255,.9)';
  g.fillText('LEVEL UP', 0, 0);
  g.font = '700 30px "JetBrains Mono", monospace';
  g.fillStyle = 'rgba(243,108,33,.95)';
  g.fillText('C E R T I F I E D', 0, 38);
  g.restore();
  if (logo) {
    const lw = 430; const lh = lw * (logo.height / logo.width);
    g.save(); g.globalAlpha = 0.96; g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 26;
    g.drawImage(logo, W / 2 - lw / 2, 930, lw, lh);
    g.restore();
  }
  // clear coat sheen streaks
  g.globalAlpha = 0.05;
  for (let i = 0; i < 40; i++) {
    g.fillStyle = '#fff';
    g.fillRect(rnd(0, W), rnd(0, H), rnd(40, 260), 1.5);
  }
  g.globalAlpha = 1;
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
  g.fillStyle = '#8E1B12'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(${rnd(120, 190) | 0},${rnd(20, 45) | 0},${rnd(12, 30) | 0},.5)`;
    g.fillRect(rnd(0, W), rnd(0, H), rnd(1, 3), rnd(1, 3));
  }
  g.strokeStyle = 'rgba(244,241,234,.85)';
  g.lineWidth = 26; g.lineCap = 'round';
  g.beginPath(); g.moveTo(70, 250); g.quadraticCurveTo(150, 360, 96, 470); g.stroke();
  g.beginPath(); g.moveTo(430, 620); g.quadraticCurveTo(350, 720, 410, 830); g.stroke();
  g.fillStyle = '#121216'; g.fillRect(0, 0, W, 70); g.fillRect(0, H - 70, W, 70);
  g.fillStyle = 'rgba(255,255,255,.5)';
  g.font = '700 26px "JetBrains Mono", monospace'; g.textAlign = 'center';
  const matText = (t, y) => { g.save(); g.translate(W / 2, y); g.scale(1, -1); g.fillText(t, 0, 0); g.restore(); };
  matText('LEVEL UP CORNHOLE', 46);
  matText('LEVEL UP CERTIFIED', H - 26);
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
const THROW_GAP = 1.5;

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
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x08080a, 14, 48);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.38;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  const camBase = new THREE.Vector3();
  const camLook = new THREE.Vector3();

  /* venue lighting */
  scene.add(new THREE.HemisphereLight(0xcdd6ee, 0x08080a, 0.26));
  const key = new THREE.DirectionalLight(0xfff4e6, 1.5);
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

  /* floor: polished concrete */
  const floorTex = cvs(1024, 1024, (g) => {
    g.fillStyle = '#1C1C21'; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(${rnd(120, 190) | 0},${rnd(120, 190) | 0},${rnd(130, 200) | 0},${rnd(0.02, 0.09).toFixed(2)})`;
      g.beginPath(); g.arc(rnd(0, 1024), rnd(0, 1024), rnd(1, 8), 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 18; i++) {
      const x = rnd(0, 1024); const y = rnd(0, 1024);
      const grd = g.createRadialGradient(x, y, 4, x, y, rnd(60, 220));
      grd.addColorStop(0, 'rgba(255,255,255,.05)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.fillRect(x - 240, y - 240, 480, 480);
    }
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 512); g.lineTo(1024, 512); g.stroke();
    g.beginPath(); g.moveTo(512, 0); g.lineTo(512, 1024); g.stroke();
  }).tex;
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(8, 8);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.5, metalness: 0.05, color: 0x6f757e }));
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
  const flash = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.4, 64), new THREE.MeshBasicMaterial({ color: 0xffb23f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
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

  const banner = new THREE.Mesh(new THREE.PlaneGeometry(26, 3.1), new THREE.MeshStandardMaterial({ map: cvs(2048, 256, drawBanner).tex, roughness: 0.9 }));
  banner.position.set(0, 1.55, -(LANE + 9));
  banner.rotation.y = Math.PI;
  scene.add(banner);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 14), new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 1 }));
  wall.position.set(0, 7, -(LANE + 9.8));
  wall.rotation.y = Math.PI;
  scene.add(wall);

  /* light cones for the broadcast look */
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff0dd, transparent: true, opacity: 0.022, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  [[0.2, -0.3], [0, -LANE]].forEach(([x, z]) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8, 32, 1, true), coneMat);
    cone.position.set(x, 4.1, z);
    scene.add(cone);
  });

  /* bags */
  const BAG = 0.5;
  const bagGeo = new RoundedBoxGeometry(BAG, BAG, BAG, 6, 0.155);
  bagGeo.scale(1, 0.32, 1);
  pillow(bagGeo, BAG / 2);
  const bagMats = {
    o: new THREE.MeshStandardMaterial({ map: cvs(256, 256, (g) => drawBagFace(g, { base: '#E9601A', print: 'rgba(120,40,8,.55)', mark: 'rgba(255,255,255,.85)', stitch: 'rgba(255,220,190,.8)' })).tex, roughness: 0.95, metalness: 0 }),
    w: new THREE.MeshStandardMaterial({ map: cvs(256, 256, (g) => drawBagFace(g, { base: '#20222A', print: 'rgba(255,255,255,.12)', mark: 'rgba(243,108,33,.9)', stitch: 'rgba(255,255,255,.45)' })).tex, roughness: 0.95, metalness: 0 }),
  };
  const pool = [];
  const getBag = (team) => {
    let b = pool.find((x) => !x.userData.busy);
    if (!b) { b = new THREE.Mesh(bagGeo, bagMats[team]); board.add(b); pool.push(b); }
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
    const from = board.worldToLocal(new THREE.Vector3(rnd(-1.5, 1.5), rnd(1.5, 2.0), rnd(8.4, 9.4)));
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
      flash.material.opacity = 1;
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
          else { a.phase = 'rest'; addPoints(a.team, 1, 'on', a.shotName, a.mesh); resting.push(a); active.splice(k, 1); }
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
