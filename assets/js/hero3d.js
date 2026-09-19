// Home hero: a broadcast-style cornhole court in 3D.
// Modeled on event footage and the Level Up Homework clips: wrapped glossy board tops,
// birch frames, carpet lanes on a gym floor, a score tower, and soft printed bags that
// land flat, skid, stop dead, push each other in and hang on the lip.
// Units are feet. Board 2 x 4, 6 inch hole 9 inches from the back edge,
// front edge about 3 inches off the ground, back edge 12 inches.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HOLE_Z, TILT, BOARD_Y, createSim, addBag, stepSim, settled, teamPoints, bagStatus, planThrow } from './bagsim.js';
import { makeBagGeometry, newField, computeField, applyField, bagTexture, weaveNormalMap, contactTexture, CENTER } from './bagmesh.js';
import { ROUNDS, FROM } from './hero-rounds.js';

const DECK_T = 0.06;
const RAIL_H = 0.2;
const LANE = 31;        // front edge to front edge is 27ft, plus the far board's length
const GF = 32.2;        // gravity, ft/s^2
const THROW_GAP = 1.8;  // seconds between throws
const FLOOR_Y = 0.012;  // top of the carpet lane
const BELLY = 0.045;    // how far a bag's belly hangs in the air before it flattens on landing

const rnd = (a, b) => a + Math.random() * (b - a);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

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

// Printed board wrap: cream vinyl, Level Up orange ring around the hole, wear from sliding bags.
function drawWrap(g, logo) {
  const W = 1024; const H = 2048;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#F2EADB'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(120,96,62,${rnd(0.012, 0.045).toFixed(3)})`;
    g.fillRect(rnd(0, W), rnd(0, H), rnd(1, 3), rnd(1, 3));
  }
  const shade = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1200);
  shade.addColorStop(0, 'rgba(255,255,255,0)'); shade.addColorStop(1, 'rgba(90,70,40,.10)');
  g.fillStyle = shade; g.fillRect(0, 0, W, H);
  // the slide lane: bags wear a faint path from the landing zone up to the hole
  const lane = g.createLinearGradient(0, 1500, 0, 420);
  lane.addColorStop(0, 'rgba(110,86,52,0)'); lane.addColorStop(0.45, 'rgba(110,86,52,.05)'); lane.addColorStop(1, 'rgba(110,86,52,.08)');
  g.fillStyle = lane;
  g.beginPath(); g.ellipse(W / 2 + 30, 960, 250, 620, 0.06, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 140; i++) {
    const x = W / 2 + rnd(-230, 250); const y = rnd(560, 1480); const len = rnd(40, 180);
    g.strokeStyle = Math.random() < 0.6 ? `rgba(95,72,44,${rnd(0.02, 0.06).toFixed(3)})` : `rgba(255,255,255,${rnd(0.05, 0.1).toFixed(3)})`;
    g.lineWidth = rnd(1, 3.5);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(-10, 10), y - len); g.stroke();
  }
  // border lines like the real boards
  g.strokeStyle = '#1B1E2A'; g.lineWidth = 18; g.strokeRect(44, 44, W - 88, H - 88);
  g.strokeStyle = '#E4561B'; g.lineWidth = 7; g.strokeRect(76, 76, W - 152, H - 152);
  // ring around the hole (hole center sits at canvas y 384)
  const hx = W / 2; const hy = 384;
  g.fillStyle = '#E4561B'; g.beginPath(); g.arc(hx, hy, 236, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#1B1E2A'; g.lineWidth = 8; g.beginPath(); g.arc(hx, hy, 236, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#F2EADB'; g.beginPath(); g.arc(hx, hy, 160, 0, Math.PI * 2); g.fill();
  // scuffed rim where bags drag over the lip
  for (let i = 0; i < 90; i++) {
    const a = Math.PI * 0.5 + rnd(-0.9, 0.9); const r = rnd(128, 170);
    g.strokeStyle = `rgba(70,52,30,${rnd(0.03, 0.09).toFixed(3)})`; g.lineWidth = rnd(1, 3);
    g.beginPath(); g.arc(hx, hy, r, a, a + rnd(0.02, 0.12)); g.stroke();
  }
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

// Back rail stamp.
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
  [40, W - 40].forEach((x) => {
    g.fillStyle = '#8a7047'; g.beginPath(); g.arc(x, H / 2, 9, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x - 5, H / 2); g.lineTo(x + 5, H / 2); g.stroke();
  });
}

// Carpet lane mats with a red border and a sponsor strip.
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

function softDot() {
  return cvs(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,220,180,.35)'); r.addColorStop(1, 'rgba(255,180,120,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }).tex;
}

// Long soft streak, the reflection of a ceiling light in a glossy gym floor.
function streak() {
  return cvs(64, 256, (g) => {
    const r = g.createRadialGradient(32, 128, 0, 32, 128, 32);
    r.addColorStop(0, 'rgba(255,248,236,1)'); r.addColorStop(0.35, 'rgba(255,240,220,.35)'); r.addColorStop(1, 'rgba(255,240,220,0)');
    g.setTransform(1, 0, 0, 4, 0, -384); g.fillStyle = r; g.fillRect(0, 0, 64, 256);
  }).tex;
}

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x141416, 20, 62);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  const camBase = new THREE.Vector3();
  const camLook = new THREE.Vector3();

  /* venue lighting: a key light that casts the shadows, overhead cans, warm fill */
  scene.add(new THREE.HemisphereLight(0xf2f0ea, 0x2a2018, 0.62));
  const key = new THREE.DirectionalLight(0xfff6ec, 2.1);
  key.position.set(-5, 9, 4);
  key.target.position.set(0, 0.4, -0.6);
  key.position.add(key.target.position);
  key.castShadow = true;
  const sm = small() ? 1024 : 2048;
  key.shadow.mapSize.set(sm, sm);
  Object.assign(key.shadow.camera, { left: -3.6, right: 3.6, top: 3.6, bottom: -3.6, near: 2, far: 24 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
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
  floor.receiveShadow = true;
  scene.add(floor);

  // painted court lines and ceiling lights reflected in the finish
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x1c1c22, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  [[-4.6, 0.17, 90, -30], [10.2, 0.17, 90, -30]].forEach(([x, w, l, z]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), lineMat);
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.002, z); scene.add(m);
  });
  const baseLine = new THREE.Mesh(new THREE.PlaneGeometry(60, 0.17), lineMat);
  baseLine.rotation.x = -Math.PI / 2; baseLine.position.set(0, 0.002, -45); scene.add(baseLine);
  const glowMat = new THREE.MeshBasicMaterial({ map: streak(), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const x of [-8, -2.6, 4.2, 10, 16.5]) {
    for (const z of [-7, -15, -23, -31, -40]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 4.2), glowMat);
      m.rotation.x = -Math.PI / 2; m.position.set(x + rnd(-0.4, 0.4), 0.004, z + rnd(-1, 1));
      scene.add(m);
    }
  }

  /* mats */
  const matTex = cvs(512, 1024, drawMat).tex;
  const matMat = new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.95, metalness: 0 });
  const addMat = (z, w = 3.9, l = 7.2) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, l), matMat);
    m.position.set(0, 0.006, z);
    m.receiveShadow = true;
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

  function buildBoard(shadows = false) {
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
    const deck = new THREE.Mesh(geo, [deckMat, edgeMat]);
    group.add(deck);
    const parts = [deck];
    [-0.94, 0.94].forEach((x) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.11, RAIL_H, 3.98), woodMat);
      m.position.set(x, -DECK_T - RAIL_H / 2, 0);
      group.add(m); parts.push(m);
    });
    const front = new THREE.Mesh(new THREE.BoxGeometry(1.88, RAIL_H, 0.11), woodMat);
    front.position.set(0, -DECK_T - RAIL_H / 2, 1.95);
    group.add(front); parts.push(front);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.88, RAIL_H, 0.11), railMat);
    back.position.set(0, -DECK_T - RAIL_H / 2, -1.95);
    group.add(back); parts.push(back);
    if (shadows) parts.forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
    return group;
  }

  function addLegs(x0, z, shadows = false) {
    [-0.78, 0.78].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.1), woodMat);
      leg.position.set(x0 + x, 0.36, z);
      leg.castShadow = shadows;
      scene.add(leg);
    });
  }

  // near board: bags land here, hole faces the camera
  const board = buildBoard(true);
  board.position.set(0, BOARD_Y, 0);
  board.rotation.x = TILT;
  scene.add(board);
  addLegs(0, -1.78, true);

  // far board down the lane
  const farBoard = buildBoard();
  farBoard.position.set(0, BOARD_Y, -LANE);
  farBoard.rotation.set(-TILT, Math.PI, 0);
  scene.add(farBoard);
  addLegs(0, -(LANE - 1.78));

  /* the hole: dark catch box below, a warm flash on the rim when one drops */
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

  /* score tower */
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

  /* bags: printed duck cloth with a soft fabric sheen */
  const weave = weaveNormalMap();
  const LOOK = {
    o: { base: '#E25A17', print: 'rgba(90,28,6,.45)', print2: 'rgba(255,190,120,.35)', mark: 'rgba(255,255,255,.92)', stitch: 'rgba(255,226,200,.9)', pattern: 'logo', sheen: 0xffb27a },
    w: { base: '#1E4F93', print: 'rgba(10,30,70,.45)', print2: 'rgba(120,175,240,.32)', mark: 'rgba(255,255,255,.9)', stitch: 'rgba(225,236,255,.8)', pattern: 'star', sheen: 0x8fb8ff },
  };
  const bagTex = { o: bagTexture(LOOK.o, null), w: bagTexture(LOOK.w, null) };
  const bagMat = (team) => new THREE.MeshPhysicalMaterial({
    map: bagTex[team], normalMap: weave, normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.88, metalness: 0, sheen: 0.5, sheenRoughness: 0.55, sheenColor: new THREE.Color(LOOK[team].sheen),
  });
  const sharedBagMat = { o: bagMat('o'), w: bagMat('w') };
  const contactTex = contactTexture();
  const blobGeo = new THREE.PlaneGeometry(0.68, 0.68);
  blobGeo.rotateX(-Math.PI / 2);

  // other courts down the gym, games in progress
  const restGeos = [11, 12, 13].map(makeBagGeometry);
  [6.4, 14].forEach((x) => {
    [-12, -24, -36].forEach((z) => {
      const b = buildBoard();
      b.position.set(x, BOARD_Y, z);
      b.rotation.set(TILT, 0, 0);
      scene.add(b);
      addLegs(x, z - 1.78);
      const m = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.012, 6.8), matMat);
      m.position.set(x, 0.006, z + 1.6);
      scene.add(m);
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const bag = new THREE.Mesh(restGeos[i % 3], sharedBagMat[Math.random() < 0.5 ? 'o' : 'w']);
        bag.position.set(rnd(-0.6, 0.6), CENTER, rnd(-1.4, 0.8));
        bag.rotation.y = rnd(0, Math.PI);
        b.add(bag);
      }
    });
  });

  /* light cones for the broadcast look */
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff0dd, transparent: true, opacity: 0.022, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  [[0.2, -0.3], [0, -LANE]].forEach(([x, z]) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8, 32, 1, true), coneMat);
    cone.position.set(x, 4.1, z);
    scene.add(cone);
  });

  /* venue haze */
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

  /* logo + fonts, then redraw the wrap and the Level Up bags */
  const img = new Image();
  const fontsReady = (document.fonts && document.fonts.ready) ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  fontsReady.then(() => {
    const finish = (logo) => {
      drawWrap(wrapTex.g, logo);
      wrapTex.tex.needsUpdate = true;
      bagTexture(LOOK.o, logo, bagTex.o);
      bagTexture(LOOK.w, null, bagTex.w);
      if (!running) renderer.render(scene, camera);
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

  const ptr = { x: 0, y: 0 }; const smp = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  scene.updateMatrixWorld(true);

  /* ------------------------------------------------- bags in play */
  const UP = new THREE.Vector3(0, 1, 0);
  const ident = new THREE.Quaternion();
  const qa = new THREE.Quaternion(); const qb = new THREE.Quaternion(); const qc = new THREE.Quaternion();
  const eul = new THREE.Euler(0, 0, 0, 'YXZ');
  const tmp = new THREE.Vector3();
  const boardInv = board.quaternion.clone().invert();
  const zeroField = newField();
  const qYaw = (q, yaw) => q.setFromAxisAngle(UP, yaw);

  const vis = [];
  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(makeBagGeometry(i + 1), bagMat('o'));
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.visible = false;
    scene.add(mesh);
    const blob = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: contactTex, color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
    blob.visible = false;
    board.add(blob);
    vis.push({ id: i, mesh, blob, mode: 'idle', t: 0, team: 'o', resid: new THREE.Quaternion(), dp: { x: 0, z: 0, yaw: 0, field: newField(), dirty: false }, airAmt: 0, fieldAmt: 1, flutter: 0, impact: 0, lift0: 0, order: 0 });
  }

  function setLook(v, team) {
    v.team = team;
    v.mesh.material.map = bagTex[team];
    v.mesh.material.sheenColor.set(LOOK[team].sheen);
  }

  function hideBag(v) {
    v.mode = 'idle'; v.mesh.visible = false; v.blob.visible = false;
  }

  function putBlob(v, parent, x, y, z, yaw, opacity) {
    if (v.blob.parent !== parent) parent.add(v.blob);
    v.blob.visible = opacity > 0.004;
    v.blob.position.set(x, y, z);
    v.blob.rotation.set(0, yaw, 0);
    v.blob.material.opacity = opacity;
  }

  /* ------------------------------------------------- the game */
  let sim = createSim();
  let clock = 0; let roundIdx = 0; let roundNo = 1; let roundStart = 1.0; let fired = 0;
  let phase = 'play'; let endAt = 0; let match = { o: 0, w: 0 }; let over = false; let gameSent = false;

  const screenOf = (x, y, z, local = true) => {
    tmp.set(x, y, z);
    if (local) board.localToWorld(tmp);
    tmp.project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * container.clientWidth, y: (-tmp.y * 0.5 + 0.5) * container.clientHeight };
  };
  const points = () => ({ o: teamPoints(sim, 'o'), w: teamPoints(sim, 'w') });
  function dots() {
    const out = { o: [], w: [] };
    ROUNDS[roundIdx].forEach((th, i) => {
      out[th.t].push(bagStatus(sim.bags.find((b) => b.id === i)));
    });
    return out;
  }
  function report(extra = {}) {
    if (onScore) onScore({ roundPts: points(), bags: dots(), match: { ...match }, ...extra });
  }

  function flight(from, to, apex) {
    const H = Math.max(from.y, to.y) + apex;
    const vy = Math.sqrt(2 * GF * (H - from.y));
    const T = (vy + Math.sqrt(2 * GF * (H - to.y))) / GF;
    return { from: from.clone(), vx: (to.x - from.x) / T, vy, vz: (to.z - from.z) / T, T, yaw0: rnd(0, Math.PI * 2), spin: rnd(7, 11) * (Math.random() < 0.5 ? 1 : -1), ph: rnd(0, 6) };
  }

  function release(i) {
    const spec = ROUNDS[roundIdx][i];
    const v = vis[i];
    setLook(v, spec.t);
    const from = new THREE.Vector3(...FROM[spec.t]).add(tmp.set(rnd(-0.12, 0.12), rnd(-0.08, 0.08), rnd(-0.15, 0.15)));
    let to; let apex = 1.35;
    v.plan = null;
    if (spec.kind === 'air') {
      to = board.localToWorld(new THREE.Vector3(0, CENTER + BELLY, HOLE_Z));
      apex = 2.2;
    } else if (spec.kind === 'short') {
      to = new THREE.Vector3(spec.land[0], FLOOR_Y + CENTER + BELLY, spec.land[1]);
      apex = 1.0;
    } else {
      v.plan = planThrow(spec, [from.x, from.y, from.z], sim);
      const lift = spec.onto !== undefined ? 0.12 : 0;
      to = board.localToWorld(new THREE.Vector3(v.plan.L[0], CENTER + BELLY + lift, v.plan.L[1]));
      v.lift0 = lift;
    }
    if (spec.kind !== 'slide') v.lift0 = 0;
    v.fl = flight(from, to, apex);
    v.spec = spec; v.mode = 'air'; v.t = 0; v.touched = false; v.pending = true; v.before = points(); v.scored = false;
    v.mesh.scale.set(1, 1, 1);
    v.mesh.material.opacity = 1;
    if (v.mesh.material.transparent) { v.mesh.material.transparent = false; v.mesh.material.needsUpdate = true; }
    if (v.mesh.parent !== scene) scene.add(v.mesh);
    v.mesh.visible = true;
    v.blob.visible = false;
    updateAir(v, 0);
  }

  function updateAir(v, dt) {
    const f = v.fl;
    v.t += dt;
    const t = Math.min(v.t, f.T);
    const p = t / f.T;
    v.mesh.position.set(f.from.x + f.vx * t, f.from.y + f.vy * t - 0.5 * GF * t * t, f.from.z + f.vz * t);
    const yaw = f.yaw0 + f.spin * t;
    const wob = (1 - p) * (1 - p);
    eul.set(-0.1 + 0.22 * Math.sin(t * 9 + f.ph) * wob, yaw, 0.15 * Math.sin(t * 7 + f.ph * 2) * wob);
    qa.setFromEuler(eul);
    // by touchdown it lines up with the surface, nose a touch high so it slaps down flat
    qYaw(qc, yaw);
    eul.set(-0.09, 0, 0.035); qb.setFromEuler(eul);
    qc.multiply(qb);
    if (v.spec.kind !== 'short') qc.premultiply(board.quaternion);
    qa.slerp(qc, smooth(0.45, 1, p));
    v.mesh.quaternion.copy(qa);
    v.airAmt = 1; v.flutter = wob;
    if (v.t >= f.T) touchdown(v);
  }

  function touchdown(v) {
    const f = v.fl; const spec = v.spec;
    const wv = new THREE.Vector3(f.vx, f.vy - GF * f.T, f.vz);
    v.touched = true; v.t = 0; v.impact = Math.min(1, Math.abs(wv.y) / 14);
    if (spec.kind === 'short') {
      addBag(sim, { id: v.id, team: v.team, x: 0, z: 9 });
      startFloor(v, wv.x * 0.3, wv.z * 0.3, f.spin * 0.25);
      return;
    }
    board.attach(v.mesh);
    eul.setFromQuaternion(v.mesh.quaternion, 'YXZ');
    const yaw = eul.y;
    v.resid.copy(qYaw(qa, yaw).invert().multiply(v.mesh.quaternion));
    if (spec.kind === 'air') {
      const b = addBag(sim, { id: v.id, team: v.team, x: 0, z: HOLE_Z, airmail: true, yaw });
      v.order = b.order;
      wv.applyQuaternion(boardInv);
      startHole(v, wv.x, wv.z, -wv.y, yaw, true);
      return;
    }
    const p = v.plan;
    const b = addBag(sim, { id: v.id, team: v.team, x: p.L[0], z: p.L[1], vx: p.v[0], vz: p.v[1], yaw, w: f.spin * 0.22 });
    v.sim = b; v.order = b.order; v.mode = 'board';
    Object.assign(v.dp, { x: b.x, z: b.z, yaw });
    v.dp.field.fill(0);
    v.dirty = true;
  }

  function updateBoard(v, dt) {
    const b = v.sim;
    v.t += dt;
    if (b.state === 'in') { startHole(v, b.vx, b.vz, 0, b.yaw, false); return; }
    if (b.state === 'off') { startEdge(v, b); return; }
    const k = smooth(0, 0.09, v.t);
    v.airAmt = 1 - smooth(0, 0.08, v.t);
    v.fieldAmt = k;
    v.mesh.position.set(b.x, CENTER + BELLY * v.airAmt + v.lift0 * (1 - k), b.z);
    qYaw(qa, b.yaw);
    qb.copy(v.resid).slerp(ident, 1 - Math.exp(-v.t / 0.035));
    v.mesh.quaternion.copy(qa).multiply(qb);
    const e = v.t < 0.035 ? v.t / 0.035 : Math.exp(-(v.t - 0.035) / 0.07);
    const sq = 0.08 * e * v.impact;
    v.mesh.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    const moved = b.x !== v.dp.x || b.z !== v.dp.z || b.yaw !== v.dp.yaw;
    Object.assign(v.dp, { x: b.x, z: b.z, yaw: b.yaw });
    v.dirty = v.dirty || moved || v.t < 0.25;
    putBlob(v, board, b.x, 0.004, b.z, b.yaw, b.layer === 0 ? 0.42 * k : 0);
  }

  // Into the hole, like the film: it skids on over the lip with the front sagging in,
  // then hinges down through the hole like a trapdoor so the back edge never pops up.
  function startHole(v, vx, vz, vy, yaw, fromAir) {
    const sp = Math.hypot(vx, vz);
    let dx = 0; let dz = -1;
    if (sp > 0.05) { dx = vx / sp; dz = vz / sp; }
    const x0 = v.mesh.position.x; const z0 = v.mesh.position.z;
    const cx = dx * 0.03; const cz = HOLE_Z + dz * 0.03;
    const speed = fromAir ? 0 : Math.max(1.2, sp);
    const glide = fromAir ? 0 : Math.min(0.2, Math.hypot(cx - x0, cz - z0) / speed);
    v.hole = { x0, z0, cx, cz, y0: v.mesh.position.y, dx, dz, vy: Math.max(0, vy), yaw, fromAir, glide, drift: fromAir ? Math.min(2, sp) * 0.25 : 0.35, axis: new THREE.Vector3(dz, 0, -dx).normalize() };
    v.mode = 'hole'; v.t = 0; v.dirty = true;
    flash.material.opacity = 0.32;
  }

  function updateHole(v, dt) {
    const h = v.hole; v.t += dt; const t = v.t;
    const g = h.glide > 0 ? Math.min(1, t / h.glide) : 1;
    const tf = Math.max(0, t - h.glide);
    const drop = h.vy * tf + 0.5 * 26 * tf * tf;
    const x = h.x0 + (h.cx - h.x0) * g + h.dx * tf * h.drift;
    const z = h.z0 + (h.cz - h.z0) * g + h.dz * tf * h.drift;
    const th = Math.asin(Math.min(1, drop / 0.3)) * 0.97;
    v.mesh.position.set(x, h.y0 - drop, z);
    qa.setFromAxisAngle(h.axis, th);
    qYaw(qb, h.yaw);
    qc.copy(v.resid).slerp(ident, 1 - Math.exp(-t / 0.035));
    v.mesh.quaternion.copy(qa).multiply(qb).multiply(qc);
    const sq = smooth(0, 0.16, tf);
    v.mesh.scale.set(1 - 0.18 * sq, 1, 1 - 0.18 * sq);
    v.fieldAmt = 1 - smooth(0, 0.07, tf);
    v.airAmt = h.fromAir ? 1 : 0;
    Object.assign(v.dp, { x, z, yaw: h.yaw });
    v.dirty = true;
    v.blob.material.opacity *= Math.pow(0.02, dt);
    if (tf > 0.28 || drop > 1.1) hideBag(v);
  }

  // Slid or knocked off the board: falls to the carpet and skids to a stop.
  function startEdge(v, b) {
    scene.attach(v.mesh);
    const w = new THREE.Vector3(b.vx, 0, b.vz).applyQuaternion(board.quaternion);
    v.edge = { vx: w.x, vy: w.y, vz: w.z, spin: b.w, axis: new THREE.Vector3(w.z, 0, -w.x).normalize() };
    v.mode = 'edge'; v.t = 0;
    v.blob.visible = false;
  }

  function updateEdge(v, dt) {
    const e = v.edge; v.t += dt;
    e.vy -= GF * dt;
    v.mesh.position.x += e.vx * dt; v.mesh.position.y += e.vy * dt; v.mesh.position.z += e.vz * dt;
    qa.setFromAxisAngle(e.axis, 2.5 * dt);
    v.mesh.quaternion.premultiply(qa);
    v.fieldAmt = Math.max(0, 1 - v.t / 0.15);
    if (v.mesh.position.y <= FLOOR_Y + CENTER) {
      v.impact = 0.6;
      startFloor(v, e.vx * 0.4, e.vz * 0.4, e.spin);
    }
  }

  function startFloor(v, vx, vz, w) {
    if (v.mesh.parent !== scene) scene.attach(v.mesh);
    eul.setFromQuaternion(v.mesh.quaternion, 'YXZ');
    v.fp = { x: v.mesh.position.x, z: v.mesh.position.z, vx, vz, yaw: eul.y, w };
    v.resid.copy(qYaw(qa, eul.y).invert().multiply(v.mesh.quaternion));
    v.mode = 'floor'; v.t = 0;
    v.dp.field.fill(0);
  }

  function updateFloor(v, dt) {
    const f = v.fp; v.t += dt;
    const sp = Math.hypot(f.vx, f.vz);
    if (sp > 0) { const k = Math.max(0, sp - 18 * dt) / sp; f.vx *= k; f.vz *= k; }
    f.x += f.vx * dt; f.z += f.vz * dt;
    if (Math.abs(f.x) < 1.3 && f.z < 2.32 && f.z > 1.2) { f.z = 2.32; f.vz = Math.max(0, f.vz); }
    const dw = 14 * dt; f.w = Math.abs(f.w) <= dw ? 0 : f.w - Math.sign(f.w) * dw;
    f.yaw += f.w * dt;
    v.airAmt = 1 - smooth(0, 0.08, v.t);
    v.fieldAmt = 0;
    v.mesh.position.set(f.x, FLOOR_Y + CENTER + BELLY * v.airAmt, f.z);
    qYaw(qa, f.yaw);
    qb.copy(v.resid).slerp(ident, 1 - Math.exp(-v.t / 0.035));
    v.mesh.quaternion.copy(qa).multiply(qb);
    const e = v.t < 0.035 ? v.t / 0.035 : Math.exp(-(v.t - 0.035) / 0.07);
    const sq = 0.08 * e * v.impact;
    v.mesh.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    putBlob(v, scene, f.x, FLOOR_Y + 0.003, f.z, f.yaw, 0.4 * smooth(0, 0.1, v.t));
  }

  function updateFade(v, dt) {
    v.t += dt;
    const o = 1 - smooth(0, 0.45, v.t);
    v.mesh.material.opacity = o;
    v.blob.material.opacity = Math.min(v.blob.material.opacity, 0.42 * o);
    if (o <= 0) hideBag(v);
  }

  // Drapes every bag over what is under it, oldest first, only when something moved.
  function updateDrapes() {
    const act = vis.filter((v) => v.mode !== 'idle' && v.mode !== 'fade').sort((a, b) => a.order - b.order);
    const under = [];
    for (const v of act) {
      const geo = v.mesh.geometry;
      if (v.mode === 'board' || v.mode === 'hole') {
        const near = under.filter((o) => Math.abs(o.x - v.dp.x) < 0.9 && Math.abs(o.z - v.dp.z) < 0.9);
        const redo = v.dirty || v.fieldAmt < 1 || near.some((o) => o.dirty);
        v.dp.dirty = redo ? (computeField(v.dp, near, v.fieldAmt) || v.dirty) : false;
        if (v.dp.dirty || v.airAmt > 0) applyField(geo, v.dp.field, v.airAmt);
        if (v.mode === 'board') under.push(v.dp);
      } else if (v.mode === 'air') {
        applyField(geo, zeroField, 1, v.flutter, clock);
      } else if (v.airAmt > 0 || v.fieldAmt > 0) {
        applyField(geo, zeroField, v.airAmt);
      }
      v.dirty = false;
    }
  }

  function handleEvents() {
    for (const e of sim.events.splice(0)) {
      const v = vis[e.id];
      if (e.type === 'in') {
        report({ team: e.team, pop: `+${v.scored ? 2 : 3}`, screen: screenOf(0, 0.12, HOLE_Z), big: true });
        v.scored = true;
      } else if (e.type === 'rest' && e.first) {
        v.scored = true;
        report({ team: e.team, pop: '+1', screen: screenOf(v.sim.x, 0.2, v.sim.z) });
      } else if (e.type === 'off') {
        report({ team: e.team });
      }
    }
  }

  // once the thrown bag has settled and nothing on the board moves, call the shot
  function resolveThrows() {
    for (const v of vis) {
      if (!v.pending || !v.touched || !settled(sim)) continue;
      if (v.mode === 'floor' && (v.fp.vx || v.fp.vz)) continue;
      if (v.mode === 'hole' && v.t < 0.15) continue;
      v.pending = false;
      const now = points();
      report({ team: v.team, shot: v.spec.name, pts: now[v.team] - v.before[v.team] });
    }
  }

  function newRound() {
    vis.forEach((v) => { hideBag(v); if (v.mesh.parent !== scene) scene.add(v.mesh); });
    sim = createSim();
    roundIdx = (roundIdx + 1) % ROUNDS.length;
    roundNo += 1;
    roundStart = clock + 0.6;
    fired = 0; phase = 'play';
  }

  function step(dt) {
    clock += dt;
    const round = ROUNDS[roundIdx];
    const tr = clock - roundStart;

    if (phase === 'play' && fired < round.length && tr >= fired * THROW_GAP) {
      if (fired === 0 && onRound) onRound({ phase: 'start', round: roundNo, match: { ...match }, roundPts: { o: 0, w: 0 } });
      release(fired);
      fired += 1;
    }

    for (const v of vis) if (v.mode === 'air') updateAir(v, dt);
    stepSim(sim, dt);
    handleEvents();
    for (const v of vis) {
      if (v.mode === 'board') updateBoard(v, dt);
      else if (v.mode === 'hole') updateHole(v, dt);
      else if (v.mode === 'edge') updateEdge(v, dt);
      else if (v.mode === 'floor') updateFloor(v, dt);
      else if (v.mode === 'fade') updateFade(v, dt);
    }
    updateDrapes();
    resolveThrows();

    if (phase === 'play' && fired === round.length && vis.every((v) => !v.pending) && tr > fired * THROW_GAP) {
      phase = 'end'; endAt = clock;
      const pts = points();
      const diff = Math.abs(pts.o - pts.w);
      const winner = pts.o === pts.w ? null : (pts.o > pts.w ? 'o' : 'w');
      if (winner) match[winner] += diff;
      over = match.o >= 21 || match.w >= 21;
      gameSent = false;
      if (onRound) onRound({ phase: 'end', round: roundNo, roundPts: pts, diff, winner, match: { ...match }, gameOver: over });
    }
    if (phase === 'end') {
      const te = clock - endAt;
      if (te > 1.7) {
        vis.forEach((v) => {
          if (v.mode === 'board' || v.mode === 'floor') {
            v.mode = 'fade'; v.t = 0;
            v.mesh.material.transparent = true; v.mesh.material.needsUpdate = true;
          }
        });
      }
      if (over && !gameSent && te > 2.1) {
        gameSent = true;
        if (onRound) onRound({ phase: 'game', winner: match.o >= 21 ? 'o' : 'w', match: { ...match } });
      }
      if (te > (over ? 5.2 : 3.0)) {
        if (over) { match = { o: 0, w: 0 }; roundNo = 0; over = false; }
        newRound();
      }
    }
  }

  /* ------------------------------------------------- loop */
  const debug = /herodebug/.test(location.search);
  let running = false; let raf = 0; let last = 0; let elapsed = 0; let readyFired = false; let paused = debug;
  function tick(dt, draw = true) {
    elapsed += dt;
    smp.x += (ptr.x - smp.x) * 0.04;
    smp.y += (ptr.y - smp.y) * 0.04;
    const scrollP = Math.min(1, window.scrollY / Math.max(1, container.clientHeight));
    const drift = Math.sin(elapsed * 0.24) * 0.12;
    camera.position.set(
      camBase.x + smp.x * 0.45 + drift,
      camBase.y - smp.y * 0.22 + scrollP * 1.5 + Math.sin(elapsed * 0.4) * 0.015,
      camBase.z + scrollP * 1.1,
    );
    camera.lookAt(camLook.x - smp.x * 0.12, camLook.y - scrollP * 0.4, camLook.z);

    try { step(dt); } catch (err) { if (!tick.warned) { tick.warned = true; console.error('hero step failed', err); } }

    for (let i = 0; i < N; i++) {
      const iy = i * 3 + 1;
      pPos[iy] += pSpd[i] * dt;
      pPos[iy - 1] += Math.sin(elapsed * 0.5 + i) * 0.0007;
      if (pPos[iy] > 5.2) pPos[iy] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;
    flash.material.opacity *= Math.pow(0.03, dt);
    flash.scale.setScalar(1 + (1 - flash.material.opacity) * 0.45);

    if (draw) renderer.render(scene, camera);
    if (!readyFired) { readyFired = true; if (onReady) onReady(); }
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    tick(dt);
  }
  function start() { if (running || reduced || paused) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  if (reduced) {
    // a settled board: a hanger, a blocker, one riding on it and a woodie
    [['o', 0.04, -0.93, 0.3], ['w', -0.02, -0.42, -0.4], ['o', 0.55, -0.15, 0.9], ['w', 0.14, -0.56, 0.2]].forEach(([team, x, z, yaw], i) => {
      const b = addBag(sim, { id: i, team, x, z, yaw });
      stepSim(sim, 0.2);
      const v = vis[i];
      setLook(v, team);
      board.attach(v.mesh);
      v.sim = b; v.order = b.order; v.mode = 'board'; v.t = 1; v.lift0 = 0; v.mesh.visible = true;
      v.resid.identity();
      updateBoard(v, 0);
    });
    vis.forEach((v) => { v.dirty = true; });
    updateDrapes();
    camera.position.copy(camBase);
    camera.lookAt(camLook);
    setTimeout(() => { renderer.render(scene, camera); if (onReady) onReady(); }, 150);
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

  // QA hook: ?herodebug starts paused so screenshots can scrub to exact moments
  if (debug) {
    window.__hero = {
      pause() { paused = true; stop(); },
      play() { paused = false; start(); },
      advance(sec, fps = 60) {
        const n = Math.max(1, Math.round(sec * fps));
        for (let i = 0; i < n; i++) tick(1 / fps, i === n - 1);
        return { clock, roundIdx, fired, phase, bags: sim.bags.map((b) => `${b.team}${b.id}:${b.state}@${b.x.toFixed(2)},${b.z.toFixed(2)}`) };
      },
    };
  }

  return { start, stop };
}
