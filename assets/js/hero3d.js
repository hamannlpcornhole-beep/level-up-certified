// Home hero: a regulation cornhole board in 3D with bags thrown on a loop.
// Units are feet. The board is 2 x 4, hole is 6" wide, 9" from the back edge,
// front edge about 3" off the ground, back edge 12".
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const HOLE_Z = -1.25;
const DECK_T = 0.06;
const TILT = Math.asin(0.75 / 4);

const SHOTS = {
  slideIn:  { land: [0.08, 0.06, 0.35],  end: [0, 0.06, HOLE_Z], slide: 0.75, result: 'in', arc: 1.0, from: [1.1, 3.6, 7.6] },
  slideInR: { land: [0.24, 0.06, 0.6],   end: [0, 0.06, HOLE_Z], slide: 0.85, result: 'in', arc: 1.1, from: [1.6, 3.4, 7.8] },
  airmail:  { land: [0, 0.34, HOLE_Z],   end: null,              slide: 0,    result: 'in', arc: 1.7, from: [0.6, 3.9, 7.4] },
  woodie:   { land: [-0.5, 0.06, -0.05], end: [-0.47, 0.06, -0.6], slide: 0.55, result: 'on', arc: 0.9, from: [0.4, 3.5, 7.6] },
};
const ROUNDS = [
  ['slideIn', 'airmail', 'woodie', 'slideInR'],
  ['airmail', 'slideIn', 'slideInR', 'airmail'],
];
const THROW_GAP = 1.75;

const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inQuad: (t) => t * t,
  outBack: (t) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, c);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { tex: t, canvas: c, g };
}

function drawDeck(g, logo) {
  const W = 1024; const H = 2048;
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1A1A1F'); bg.addColorStop(1, '#0C0C0F');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // grain
  for (let i = 0; i < 220; i++) {
    g.strokeStyle = `rgba(255,255,255,${(Math.random() * 0.022).toFixed(3)})`;
    g.lineWidth = Math.random() * 3 + 0.5;
    const x = Math.random() * W;
    g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= H; y += 64) g.lineTo(x + Math.sin(y * 0.004 + i) * 7, y);
    g.stroke();
  }
  // chevrons low on the board
  g.save();
  g.beginPath(); g.rect(60, 60, W - 120, H - 120); g.clip();
  for (let k = 0; k < 3; k++) {
    const y0 = 1560 + k * 118;
    g.globalAlpha = 0.9 - k * 0.28;
    const grd = g.createLinearGradient(0, y0 - 180, 0, y0 + 44);
    grd.addColorStop(0, '#FF8A2B'); grd.addColorStop(1, '#E0560F');
    g.fillStyle = grd;
    g.beginPath(); g.moveTo(0, y0); g.lineTo(W / 2, y0 - 190); g.lineTo(W, y0); g.lineTo(W, y0 + 46); g.lineTo(W / 2, y0 - 144); g.lineTo(0, y0 + 46); g.closePath(); g.fill();
  }
  g.restore(); g.globalAlpha = 1;
  // border
  g.strokeStyle = '#F36C21'; g.lineWidth = 12; g.strokeRect(36, 36, W - 72, H - 72);
  g.strokeStyle = 'rgba(243,108,33,.3)'; g.lineWidth = 3; g.strokeRect(64, 64, W - 128, H - 128);
  // hole halo
  const hx = W / 2; const hy = 384;
  const halo = g.createRadialGradient(hx, hy, 125, hx, hy, 260);
  halo.addColorStop(0, 'rgba(255,178,63,.55)'); halo.addColorStop(1, 'rgba(243,108,33,0)');
  g.fillStyle = halo; g.beginPath(); g.arc(hx, hy, 260, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#FFB23F'; g.lineWidth = 9; g.beginPath(); g.arc(hx, hy, 146, 0, Math.PI * 2); g.stroke();
  g.setLineDash([6, 14]); g.strokeStyle = 'rgba(255,178,63,.6)'; g.lineWidth = 4; g.beginPath(); g.arc(hx, hy, 190, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
  // type
  g.textAlign = 'center';
  g.font = 'italic 900 250px "Barlow Condensed", Impact, sans-serif';
  g.fillStyle = 'rgba(255,255,255,.045)';
  g.fillText('LEVEL', W / 2, 1010);
  g.fillText('UP', W / 2, 1250);
  if (logo) {
    const lw = 470; const lh = lw * (logo.height / logo.width);
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30;
    g.drawImage(logo, W / 2 - lw / 2, 860, lw, lh);
    g.shadowBlur = 0;
  }
  g.font = '700 38px "JetBrains Mono", monospace';
  g.fillStyle = 'rgba(255,178,63,.8)';
  g.fillText('LEVEL UP CERTIFIED', W / 2, 1935);
}

function drawBag(g, base, stitch, mark) {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 3) { g.fillStyle = `rgba(0,0,0,${(0.04 + Math.random() * 0.05).toFixed(3)})`; g.fillRect(0, y, 256, 1); }
  for (let x = 0; x < 256; x += 3) { g.fillStyle = `rgba(255,255,255,${(0.02 + Math.random() * 0.04).toFixed(3)})`; g.fillRect(x, 0, 1, 256); }
  g.setLineDash([12, 8]); g.lineWidth = 5; g.strokeStyle = stitch; g.strokeRect(20, 20, 216, 216); g.setLineDash([]);
  g.font = 'italic 900 78px "Barlow Condensed", Impact, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = mark;
  g.fillText('LU', 128, 134);
}

function pillow(geo, half) {
  const p = geo.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = Math.min(1, Math.max(Math.abs(v.x), Math.abs(v.z)) / half);
    p.setY(i, v.y * (1 - 0.5 * Math.pow(d, 2.4)));
  }
  geo.computeVertexNormals();
  return geo;
}

function softDot() {
  return canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,200,140,.6)'); r.addColorStop(1, 'rgba(255,140,60,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }).tex;
}

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
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x08080a, 10, 24);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.28;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
  const camBase = new THREE.Vector3();
  const camLook = new THREE.Vector3();

  /* lights */
  scene.add(new THREE.HemisphereLight(0xfff1e2, 0x0a0a0c, 0.7));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.6);
  key.position.set(-3.5, 6.5, 3.5);
  scene.add(key);
  const rim = new THREE.PointLight(0xff6a1a, 26, 10, 2);
  rim.position.set(0.9, 2.4, -3.6);
  scene.add(rim);
  const fill = new THREE.PointLight(0xffb23f, 6, 8, 2);
  fill.position.set(3, 1.4, 2.4);
  scene.add(fill);

  /* floor */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.82, metalness: 0.25 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color('#F36C21') } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uColor; varying vec3 vW;
      float gridLine(vec2 p, float s){ vec2 q = p / s; vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q); return 1.0 - min(min(g.x, g.y), 1.0); }
      void main(){
        float l = gridLine(vW.xz, 1.0) * 0.6 + gridLine(vW.xz, 0.25) * 0.12;
        float d = length(vW.xz - vec2(0.0, -0.6));
        float f = smoothstep(9.0, 0.6, d);
        gl_FragColor = vec4(uColor, l * f * 0.42);
      }`,
  }));
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.002;
  scene.add(grid);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5.4), new THREE.MeshBasicMaterial({
    map: canvasTex(128, 256, (g) => {
      const r = g.createRadialGradient(64, 128, 10, 64, 128, 128);
      r.addColorStop(0, 'rgba(0,0,0,.85)'); r.addColorStop(1, 'rgba(0,0,0,0)');
      g.save(); g.scale(1, 2); g.translate(0, -64); g.fillStyle = r; g.fillRect(0, 0, 128, 256); g.restore();
    }).tex,
    transparent: true, depthWrite: false,
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.004, -0.05);
  scene.add(shadow);

  /* board */
  const board = new THREE.Group();
  board.position.set(0, 0.625, 0);
  board.rotation.x = TILT;
  scene.add(board);

  const shape = new THREE.Shape();
  const rr = 0.03;
  shape.moveTo(-1 + rr, -2); shape.lineTo(1 - rr, -2); shape.quadraticCurveTo(1, -2, 1, -2 + rr);
  shape.lineTo(1, 2 - rr); shape.quadraticCurveTo(1, 2, 1 - rr, 2); shape.lineTo(-1 + rr, 2);
  shape.quadraticCurveTo(-1, 2, -1, 2 - rr); shape.lineTo(-1, -2 + rr); shape.quadraticCurveTo(-1, -2, -1 + rr, -2);
  const holePath = new THREE.Path();
  holePath.absarc(0, -HOLE_Z, 0.25, 0, Math.PI * 2, true);
  shape.holes.push(holePath);
  const deckGeo = new THREE.ExtrudeGeometry(shape, { depth: DECK_T, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 64 });
  deckGeo.rotateX(-Math.PI / 2);
  deckGeo.translate(0, -DECK_T, 0);

  const deck = canvasTex(1024, 2048, (g) => drawDeck(g, null));
  deck.tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  deck.tex.repeat.set(0.5, 0.25);
  deck.tex.offset.set(0.5, 0.5);
  const deckMat = new THREE.MeshStandardMaterial({ map: deck.tex, roughness: 0.42, metalness: 0.08 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.6, metalness: 0.1 });
  board.add(new THREE.Mesh(deckGeo, [deckMat, edgeMat]));

  const railMat = new THREE.MeshStandardMaterial({ color: 0x101013, roughness: 0.7 });
  const railH = 0.19;
  [-0.94, 0.94].forEach((x) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, railH, 3.96), railMat);
    m.position.set(x, -DECK_T - railH / 2, 0); board.add(m);
  });
  [-1.94, 1.94].forEach((z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.76, railH, 0.12), railMat);
    m.position.set(0, -DECK_T - railH / 2, z); board.add(m);
  });
  const orangeStrip = new THREE.MeshBasicMaterial({ color: 0xf36c21, toneMapped: false });
  [-1.0, 1.0].forEach((x) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 3.9), orangeStrip);
    m.position.set(x * 1.001, -DECK_T - 0.05, 0); board.add(m);
  });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x0e0e11, roughness: 0.7 });
  [-0.8, 0.8].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.74, 0.11), legMat);
    leg.position.set(x, 0.37, -1.78); scene.add(leg);
  });

  // glowing hole
  const holeGlow = new THREE.Mesh(new THREE.CircleGeometry(0.245, 48), new THREE.MeshBasicMaterial({
    map: canvasTex(128, 128, (g) => {
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, '#FFD08A'); r.addColorStop(0.35, '#FF8A2B'); r.addColorStop(0.8, '#5a1f05'); r.addColorStop(1, '#120602');
      g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    }).tex,
    toneMapped: false, side: THREE.DoubleSide,
  }));
  holeGlow.rotation.x = -Math.PI / 2;
  holeGlow.position.set(0, -0.16, HOLE_Z);
  board.add(holeGlow);
  const holeLight = new THREE.PointLight(0xff8a2b, 3, 2.4, 2);
  holeLight.position.set(0, 0.35, HOLE_Z);
  board.add(holeLight);
  const flash = new THREE.Mesh(new THREE.RingGeometry(0.27, 0.36, 64), new THREE.MeshBasicMaterial({ color: 0xffb23f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  flash.rotation.x = -Math.PI / 2;
  flash.position.set(0, 0.008, HOLE_Z);
  board.add(flash);
  const holeAnchor = new THREE.Object3D();
  holeAnchor.position.set(0, 0.1, HOLE_Z);
  board.add(holeAnchor);

  /* bags */
  const BAG = 0.5;
  const bagGeo = pillow(new RoundedBoxGeometry(BAG, 0.11, BAG, 4, 0.04), BAG / 2);
  const orangeBag = canvasTex(256, 256, (g) => drawBag(g, '#F36C21', '#FFD7B0', 'rgba(255,255,255,.9)'));
  const whiteBag = canvasTex(256, 256, (g) => drawBag(g, '#ECE7DE', '#1C1C20', '#F36C21'));
  const orangeMat = new THREE.MeshStandardMaterial({ map: orangeBag.tex, roughness: 0.92, metalness: 0 });
  const whiteMat = new THREE.MeshStandardMaterial({ map: whiteBag.tex, roughness: 0.95, metalness: 0 });

  const staticBags = [];
  const addStatic = (mat, x, z, ry) => {
    const m = new THREE.Mesh(bagGeo, mat);
    m.position.set(x, 0.055, z); m.rotation.y = ry; board.add(m); staticBags.push(m); return m;
  };
  addStatic(whiteMat, 0.42, 0.95, 0.5);
  addStatic(whiteMat, -0.2, -1.62, -0.3);

  const pool = Array.from({ length: 4 }, () => {
    const m = new THREE.Mesh(bagGeo, orangeMat);
    m.visible = false; board.add(m); return m;
  });

  /* particles */
  const dot = softDot();
  const N = small() ? 140 : 280;
  const pPos = new Float32Array(N * 3); const pSpd = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 9;
    pPos[i * 3 + 1] = Math.random() * 4.5;
    pPos[i * 3 + 2] = -6 + Math.random() * 9;
    pSpd[i] = 0.05 + Math.random() * 0.22;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const embers = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.05, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xff9a4a, opacity: 0.75 }));
  scene.add(embers);

  const B = 70;
  const bPos = new Float32Array(B * 3); const bVel = new Float32Array(B * 3);
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  const burstMat = new THREE.PointsMaterial({ size: 0.07, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffc070, opacity: 0 });
  const burst = new THREE.Points(bGeo, burstMat);
  scene.add(burst);
  let burstLife = 0;
  const tmp = new THREE.Vector3();
  function fireBurst(strength = 1) {
    holeAnchor.getWorldPosition(tmp);
    for (let i = 0; i < B; i++) {
      bPos[i * 3] = tmp.x; bPos[i * 3 + 1] = tmp.y; bPos[i * 3 + 2] = tmp.z;
      const a = Math.random() * Math.PI * 2; const s = (0.6 + Math.random() * 1.6) * strength;
      bVel[i * 3] = Math.cos(a) * s * 0.6; bVel[i * 3 + 1] = (1.2 + Math.random() * 2.2) * strength; bVel[i * 3 + 2] = Math.sin(a) * s * 0.6;
    }
    bGeo.attributes.position.needsUpdate = true;
    burstLife = 1;
  }

  /* textures that need the logo + fonts */
  const redraw = () => {
    drawBag(orangeBag.g, '#F36C21', '#FFD7B0', 'rgba(255,255,255,.9)'); orangeBag.tex.needsUpdate = true;
    drawBag(whiteBag.g, '#ECE7DE', '#1C1C20', '#F36C21'); whiteBag.tex.needsUpdate = true;
  };
  const img = new Image();
  const fontsReady = (document.fonts && document.fonts.ready) ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  fontsReady.then(() => {
    img.onload = () => { drawDeck(deck.g, img); deck.tex.needsUpdate = true; redraw(); };
    img.onerror = () => { drawDeck(deck.g, null); deck.tex.needsUpdate = true; redraw(); };
    img.src = logoUrl;
  });

  /* framing */
  function frame() {
    const w = container.clientWidth; const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (w / h > 1.05) {
      camera.fov = 30;
      camera.setViewOffset(w, h, -w * 0.21, h * 0.02, w, h);
      camBase.set(3.2, 3.4, 6.8); camLook.set(0.05, 0.5, -0.5);
    } else {
      camera.fov = 36;
      camera.setViewOffset(w, h, 0, h * 0.23, w, h);
      camBase.set(2.3, 4.1, 8.6); camLook.set(0, 0.45, -0.45);
    }
    camera.updateProjectionMatrix();
  }
  frame();
  const ro = new ResizeObserver(() => { frame(); if (!running) render(); });
  ro.observe(container);

  /* pointer + scroll */
  const ptr = { x: 0, y: 0 }; const sm = { x: 0, y: 0 };
  const onPointer = (e) => { ptr.x = (e.clientX / window.innerWidth) * 2 - 1; ptr.y = (e.clientY / window.innerHeight) * 2 - 1; };
  window.addEventListener('pointermove', onPointer, { passive: true });

  /* throw engine */
  let clock = 0; let roundIdx = 0; let roundStart = 0.6; let total = 0; let fired = 0; let cleared = false;
  const active = [];
  const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

  function screenOf(obj) {
    obj.getWorldPosition(tmp);
    tmp.project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * container.clientWidth, y: (-tmp.y * 0.5 + 0.5) * container.clientHeight };
  }

  function score(pts, kind, bag, i) {
    total += pts;
    const four = kind === 'in' && ROUNDS[roundIdx].every((s) => SHOTS[s].result === 'in') && i === 3;
    if (kind === 'in') { flash.material.opacity = 1; holeLight.intensity = 16; fireBurst(four ? 1.6 : 1); }
    if (onScore) onScore({ pts, kind, index: i, total, fourBagger: four, screen: screenOf(kind === 'in' ? holeAnchor : bag) });
  }

  function launch(i) {
    const name = ROUNDS[roundIdx][i];
    const s = SHOTS[name];
    const m = pool[i];
    m.visible = true; m.scale.set(1, 1, 1);
    const from = v3(s.from); from.x += (Math.random() - 0.5) * 0.4;
    m.position.copy(from);
    m.rotation.set(-0.5, Math.random() * 3, 0.1);
    active.push({ m, s, i, phase: 'fly', t: 0, from, land: v3(s.land), end: s.end ? v3(s.end) : null, spin: 7 + Math.random() * 4 });
  }

  function step(dt) {
    clock += dt;
    const round = ROUNDS[roundIdx];
    const tr = clock - roundStart;
    if (fired < round.length && tr >= fired * THROW_GAP) {
      if (fired === 0 && onRound) onRound({ phase: 'start' });
      launch(fired); fired += 1;
    }
    for (let k = active.length - 1; k >= 0; k--) {
      const a = active[k];
      a.t += dt;
      if (a.phase === 'fly') {
        const dur = 0.9;
        const p = Math.min(1, a.t / dur);
        a.m.position.lerpVectors(a.from, a.land, p);
        a.m.position.y += a.s.arc * 4 * p * (1 - p);
        a.m.rotation.y += a.spin * dt;
        a.m.rotation.x = -0.5 * (1 - p);
        a.m.rotation.z = Math.sin(p * Math.PI) * 0.12;
        if (p >= 1) {
          a.t = 0;
          if (a.s.result === 'in' && !a.end) { a.phase = 'drop'; score(3, 'in', a.m, a.i); } else { a.phase = 'slide'; a.m.scale.set(1.06, 0.7, 1.06); }
        }
      } else if (a.phase === 'slide') {
        const p = Math.min(1, a.t / a.s.slide);
        a.m.position.lerpVectors(a.land, a.end, ease.outCubic(p));
        a.m.rotation.y += a.spin * dt * (1 - p) * 0.25;
        a.m.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2);
        if (p >= 1) {
          a.t = 0;
          if (a.s.result === 'in') { a.phase = 'drop'; score(3, 'in', a.m, a.i); } else { a.phase = 'rest'; score(1, 'on', a.m, a.i); }
        }
      } else if (a.phase === 'drop') {
        const p = Math.min(1, a.t / 0.38);
        const startY = a.end ? a.end.y : a.land.y;
        a.m.position.y = startY - ease.inQuad(p) * 1.1;
        const sc = 1 - p * 0.25; a.m.scale.set(sc * 0.9, 1, sc * 0.9);
        a.m.rotation.x = p * 0.6;
        if (p >= 1) { a.m.visible = false; active.splice(k, 1); }
      }
    }
    // end of round
    const lastLand = (round.length - 1) * THROW_GAP + 2.2;
    if (fired === round.length && !cleared && tr > lastLand) {
      cleared = true;
      if (onRound) onRound({ phase: 'end', total, fourBagger: total === 12 });
    }
    if (cleared) {
      const p = Math.min(1, (tr - lastLand) / 0.5);
      active.forEach((a) => { if (a.phase === 'rest') { const s = Math.max(0.001, 1 - ease.inQuad(p)); a.m.scale.set(s, s, s); } });
      if (tr > lastLand + 1.4) {
        active.forEach((a) => { a.m.visible = false; });
        active.length = 0;
        roundIdx = (roundIdx + 1) % ROUNDS.length;
        roundStart = clock + 0.3; fired = 0; total = 0; cleared = false;
      }
    }
  }

  /* loop */
  let running = false; let raf = 0; let last = 0; let elapsed = 0; let readyFired = false;
  function render() { renderer.render(scene, camera); }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now; elapsed += dt;

    sm.x += (ptr.x - sm.x) * 0.045; sm.y += (ptr.y - sm.y) * 0.045;
    const scrollP = Math.min(1, window.scrollY / Math.max(1, container.clientHeight));
    camera.position.set(
      camBase.x + sm.x * 0.5 + Math.sin(elapsed * 0.18) * 0.18,
      camBase.y - sm.y * 0.3 + scrollP * 1.4,
      camBase.z - scrollP * 1.8,
    );
    camera.lookAt(camLook.x, camLook.y - scrollP * 0.25, camLook.z);

    step(dt);

    for (let i = 0; i < N; i++) {
      const iy = i * 3 + 1;
      pPos[iy] += pSpd[i] * dt;
      pPos[iy - 1] += Math.sin(elapsed * 0.6 + i) * 0.0009;
      if (pPos[iy] > 4.6) pPos[iy] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;

    if (burstLife > 0) {
      burstLife = Math.max(0, burstLife - dt * 1.1);
      for (let i = 0; i < B; i++) {
        bVel[i * 3 + 1] -= 4.2 * dt;
        bPos[i * 3] += bVel[i * 3] * dt; bPos[i * 3 + 1] += bVel[i * 3 + 1] * dt; bPos[i * 3 + 2] += bVel[i * 3 + 2] * dt;
      }
      bGeo.attributes.position.needsUpdate = true;
      burstMat.opacity = burstLife;
    }
    flash.material.opacity *= Math.pow(0.04, dt);
    flash.scale.setScalar(1 + (1 - flash.material.opacity) * 0.35);
    holeLight.intensity += (3 + Math.sin(elapsed * 2.2) * 0.8 - holeLight.intensity) * Math.min(1, dt * 3);

    render();
    if (!readyFired) { readyFired = true; if (onReady) onReady(); }
  }
  function start() { if (running || reduced) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  if (reduced) {
    const w = addStatic(orangeMat, -0.47, -0.6, 0.2);
    w.visible = true;
    camera.position.copy(camBase); camera.lookAt(camLook);
    setTimeout(() => { render(); if (onReady) onReady(); }, 120);
    img.addEventListener('load', () => setTimeout(render, 50));
  } else {
    const io = new IntersectionObserver((entries) => { entries.forEach((e) => (e.isIntersecting ? start() : stop())); }, { threshold: 0.01 });
    io.observe(container);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }

  return { stop, start };
}
