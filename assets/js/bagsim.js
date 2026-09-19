// Bag physics on the board surface. Plain JS (no three.js) so it runs in node for testing.
// Board-local feet: x runs across (-1 to 1), z runs along (+2 is the front edge, -2 the back).
// The hole is centered at (0, HOLE_Z). Gravity along the tilted board pulls toward +z.
// Tuned against the Level Up Homework film: bags hit flat, skid a short way and stop dead,
// plow into the bag in front and carry it, hang on the lip, and ride on top of each other.

export const HOLE_Z = -1.25;
export const HOLE_R = 0.25;
export const BAG_HALF = 0.25;
export const TILT = Math.asin(0.75 / 4);
export const BOARD_Y = 0.625;

const G = 32.2;
export const G_SLOPE = G * Math.sin(TILT);   // along the board, toward the front edge
const G_NORM = G * Math.cos(TILT);
export const FR = 0.3 * G_NORM;               // kinetic friction, slick side on clearcoat
const RIDE_FR = 1.1 * G_NORM;                 // bag on bag grabs hard
export const CONTACT = 0.47;                  // center gap where two soft bags touch
export const CAPTURE_R = 0.235;               // center this close to the hole center and it drops
export const HANG_R = 0.47;                   // closer than this and part of it hangs over the lip
const RIDE_R = 0.3;                           // land this close to a bag and you ride on it
const RIDE_OFF = 0.36;                        // a rider this far off its base slides off
const REST = 0.08;                            // bags are dead, they barely bounce
const WAKE = 0.06;                            // speed that breaks a resting bag loose
const SPIN_FR = 14;                           // rad/s^2, spin dies fast on the board
export const SUB = 1 / 240;

export const holeDist = (x, z) => Math.hypot(x, z - HOLE_Z);
export const onBoard = (x, z) => Math.abs(x) <= 1 && z <= 2 && z >= -2;
const live = (b) => b.state === 'slide' || b.state === 'rest';

// One friction step. Returns false when friction wins and the bag stops dead.
function slideStep(b, fr, dt) {
  const sp = Math.hypot(b.vx, b.vz);
  if (sp < 1e-4) { b.vx = 0; b.vz = 0; return false; }
  const nvx = b.vx - (fr * b.vx / sp) * dt;
  const nvz = b.vz + (-(fr * b.vz / sp) + G_SLOPE) * dt;
  if (nvx * b.vx + nvz * b.vz <= 0) { b.vx = 0; b.vz = 0; return false; }
  b.x += (b.vx + nvx) * 0.5 * dt;
  b.z += (b.vz + nvz) * 0.5 * dt;
  b.vx = nvx; b.vz = nvz;
  return true;
}

// Where a bag stops if nothing gets in its way.
export function freeSlide(x, z, vx, vz) {
  const b = { x, z, vx, vz };
  let t = 0;
  while (t < 6 && slideStep(b, FR, SUB)) t += SUB;
  return { x: b.x, z: b.z, t };
}

// Launch speed on the board that makes a bag landing at L stop at E.
export function solveSlide(L, E) {
  const dx = E[0] - L[0]; const dz = E[1] - L[1];
  const d = Math.hypot(dx, dz);
  if (d < 1e-3) return [0, 0];
  const ux = dx / d; const uz = dz / d;
  const v = Math.sqrt(2 * (FR - G_SLOPE * uz) * d);
  let vx = ux * v; let vz = uz * v;
  for (let i = 0; i < 24; i++) {
    const r = freeSlide(L[0], L[1], vx, vz);
    const ex = E[0] - r.x; const ez = E[1] - r.z;
    if (Math.hypot(ex, ez) < 2e-4) break;
    const k = Math.hypot(vx, vz) / (2 * Math.max(0.05, d));
    vx += ex * k; vz += ez * k;
  }
  return [vx, vz];
}

export function createSim() {
  return { bags: [], events: [], t: 0, acc: 0, order: 0 };
}

function emit(sim, type, b, extra) {
  sim.events.push({ type, id: b.id, team: b.team, t: sim.t, ...extra });
}

const byId = (sim, id) => sim.bags.find((b) => b.id === id);

// A bag arrives: on the board, in the hole, or off the board.
export function addBag(sim, { id, team, x, z, vx = 0, vz = 0, yaw = 0, w = 0, airmail = false }) {
  const b = {
    id, team, x, z, vx, vz, yaw, w, state: 'slide', layer: 0, base: null,
    ox: 0, oz: 0, rvx: 0, rvz: 0, pushedBy: null, order: sim.order++, moving: true, thrown: true, counted: false,
  };
  sim.bags.push(b);
  if (!onBoard(x, z)) {
    b.state = 'off';
    emit(sim, 'off', b, { reason: 'short', vx, vz });
    return b;
  }
  if (airmail || holeDist(x, z) < CAPTURE_R) {
    b.state = 'in';
    emit(sim, 'in', b, { how: 'airmail', vx, vz });
    return b;
  }
  let base = null; let best = RIDE_R;
  for (const o of sim.bags) {
    if (o === b || o.layer !== 0 || !live(o)) continue;
    const d = Math.hypot(o.x - x, o.z - z);
    if (d < best) { best = d; base = o; }
  }
  if (base) {
    // landed on top of a bag: most of the hit goes into shoving the bag underneath
    b.layer = 1; b.base = base.id;
    b.ox = x - base.x; b.oz = z - base.z;
    b.rvx = vx * 0.18; b.rvz = vz * 0.18;
    base.vx += vx * 0.3; base.vz += vz * 0.3;
    if (Math.hypot(base.vx, base.vz) > WAKE) {
      if (base.state === 'rest') emit(sim, 'push', base, { by: b.id, byTeam: b.team });
      base.state = 'slide'; base.pushedBy = b.id;
    } else { base.vx = 0; base.vz = 0; }
    emit(sim, 'stack', b, { on: base.id, onTeam: base.team });
  }
  emit(sim, 'land', b);
  return b;
}

function dropRider(sim, r, base) {
  r.layer = 0; r.base = null; r.state = 'slide';
  r.vx = (base ? base.vx * 0.5 : 0) + r.rvx;
  r.vz = (base ? base.vz * 0.5 : 0) + r.rvz;
  r.rvx = 0; r.rvz = 0;
}

function wake(sim, b, by) {
  if (b.state !== 'rest') return;
  if (Math.hypot(b.vx, b.vz) > WAKE) {
    b.state = 'slide'; b.pushedBy = by.id;
    emit(sim, 'push', b, { by: by.id, byTeam: by.team });
  } else { b.vx = 0; b.vz = 0; }
}

function sub(sim, dt) {
  sim.t += dt;
  const on = sim.bags.filter(live);

  for (const b of on) {
    b.moving = false;
    if (b.w) {
      const dw = SPIN_FR * dt;
      b.w = Math.abs(b.w) <= dw ? 0 : b.w - Math.sign(b.w) * dw;
      b.yaw += b.w * dt;
      b.moving = true;
    }
    if (b.layer === 0 && b.state === 'slide') {
      slideStep(b, FR, dt);
      b.moving = true;
    }
  }

  // riders go where their base goes, plus their own short skid
  for (const r of on) {
    if (r.layer !== 1) continue;
    const base = byId(sim, r.base);
    if (!base || !live(base)) { dropRider(sim, r, base); continue; }
    const rs = Math.hypot(r.rvx, r.rvz);
    if (rs > 0) {
      const k = Math.max(0, rs - RIDE_FR * dt) / rs;
      r.rvx *= k; r.rvz *= k;
      r.ox += r.rvx * dt; r.oz += r.rvz * dt;
    }
    r.x = base.x + r.ox; r.z = base.z + r.oz;
    r.vx = base.vx + r.rvx; r.vz = base.vz + r.rvz;
    r.moving = r.moving || base.moving || rs > 0;
    r.state = (base.state === 'slide' || rs > 0) ? 'slide' : r.state;
    if (Math.hypot(r.ox, r.oz) > RIDE_OFF) dropRider(sim, r, base);
  }

  // contact between bags lying on the board
  for (let i = 0; i < on.length; i++) {
    for (let j = i + 1; j < on.length; j++) {
      const a = on[i]; const c = on[j];
      if (a.layer !== 0 || c.layer !== 0 || !live(a) || !live(c)) continue;
      let dx = c.x - a.x; let dz = c.z - a.z;
      let d = Math.hypot(dx, dz);
      if (d >= CONTACT) continue;
      if (d < 1e-6) { dx = 0; dz = -1; d = 1e-6; }
      const nx = dx / d; const nz = dz / d;
      const vn = (a.vx - c.vx) * nx + (a.vz - c.vz) * nz;
      if (vn > 0) {
        const jn = (1 + REST) * 0.5 * vn;
        a.vx -= jn * nx; a.vz -= jn * nz;
        c.vx += jn * nx; c.vz += jn * nz;
        // the fabric grabs, so a little of the sideways rub carries over and twists them
        const tx = -nz; const tz = nx;
        const vt = (a.vx - c.vx) * tx + (a.vz - c.vz) * tz;
        const jt = Math.max(-0.3 * jn, Math.min(0.3 * jn, vt * 0.5));
        a.vx -= jt * tx; a.vz -= jt * tz;
        c.vx += jt * tx; c.vz += jt * tz;
        a.w += vt * 1.6; c.w -= vt * 1.6;
        wake(sim, c, a); wake(sim, a, c);
      }
      // push apart: moving bags give way, a resting bag holds its ground
      const wa = a.state === 'slide' ? 1 : 0.02;
      const wc = c.state === 'slide' ? 1 : 0.02;
      const pen = CONTACT - d;
      a.x -= nx * pen * (wa / (wa + wc)); a.z -= nz * pen * (wa / (wa + wc));
      c.x += nx * pen * (wc / (wa + wc)); c.z += nz * pen * (wc / (wa + wc));
    }
  }

  // the hole, the edges, and coming to rest
  for (const b of on) {
    if (!live(b)) continue;
    if (b.layer === 0 && b.state === 'slide' && holeDist(b.x, b.z) < CAPTURE_R) {
      b.state = 'in';
      emit(sim, 'in', b, { how: b.pushedBy !== null ? 'pushed' : 'slide', vx: b.vx, vz: b.vz, by: b.pushedBy });
      for (const r of sim.bags) if (r.base === b.id && live(r)) dropRider(sim, r, b);
      continue;
    }
    if (!onBoard(b.x, b.z)) {
      b.state = 'off';
      emit(sim, 'off', b, { reason: b.pushedBy !== null ? 'knocked' : 'slid', vx: b.vx, vz: b.vz, by: b.pushedBy });
      for (const r of sim.bags) if (r.base === b.id && live(r)) dropRider(sim, r, b);
      continue;
    }
    const still = b.layer === 0
      ? (b.vx === 0 && b.vz === 0)
      : (b.rvx === 0 && b.rvz === 0 && (byId(sim, b.base)?.state === 'rest'));
    if (b.state === 'slide' && still) {
      b.state = 'rest';
      b.counted = true;
      emit(sim, 'rest', b, { hang: b.layer === 0 && holeDist(b.x, b.z) < HANG_R, first: b.thrown });
      b.thrown = false;
    }
  }
}

export function stepSim(sim, dt) {
  sim.acc += dt;
  while (sim.acc >= SUB) { sim.acc -= SUB; sub(sim, SUB); }
}

export function settled(sim) {
  return sim.bags.every((b) => b.state !== 'slide');
}

// 3 in the hole, 1 once it has settled on the board (riding on a bag counts), 0 anywhere else.
export function teamPoints(sim, team) {
  return sim.bags.filter((b) => b.team === team)
    .reduce((acc, b) => acc + (b.state === 'in' ? 3 : (live(b) && b.counted) ? 1 : 0), 0);
}

export function bagStatus(b) {
  if (!b) return '';
  if (b.state === 'in') return 'in';
  if (b.state === 'off') return 'off';
  return 'on';
}

/* ------------------------------------------------------------ throw planning */
// World to board-local for the near board (board at y BOARD_Y, tilted TILT about x).
export function toBoardLocal(wx, wy, wz) {
  const y = wy - BOARD_Y;
  return [wx, y * Math.cos(TILT) + wz * Math.sin(TILT), -y * Math.sin(TILT) + wz * Math.cos(TILT)];
}

// Plans the on-board part of a throw. The bag travels on the line it was thrown on:
// it lands on that line and skids along it to the natural stop point E.
//   spec.stop   natural stop point [x, z] if nothing is in the way
//   spec.len    skid length on the board (for a push: run-up to the hit)
//   spec.push   { target: [x, z], toward: [x, z], extra } aims the skid so the hit drives
//               the target bag toward a point (the hole) with extra run left in the bag
//   spec.stack  { base: [x, z], off: [dx, dz], speed } lands on top of a bag
export function planSlide(spec, from) {
  const R = toBoardLocal(from[0], from[1], from[2]);
  if (spec.stack) {
    const [bx, bz] = spec.stack.base;
    const off = spec.stack.off || [0, 0];
    const L = [bx + off[0], bz + off[1]];
    const dir = norm(L[0] - R[0], L[1] - R[2]);
    const sp = spec.stack.speed ?? 3;
    return { L, E: L, v: [dir[0] * sp, dir[1] * sp], dir };
  }
  if (spec.push) {
    const [tx, tz] = spec.push.target;
    const [hx, hz] = spec.push.toward || [0, HOLE_Z];
    let nx = hx - tx; let nz = hz - tz;
    const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    const cx = tx - nx * CONTACT; const cz = tz - nz * CONTACT;
    const dir = norm(cx - R[0], cz - R[2]);
    const E = [cx + dir[0] * spec.push.extra, cz + dir[1] * spec.push.extra];
    const L = [cx - dir[0] * spec.len, cz - dir[1] * spec.len];
    return { L, E, v: solveSlide(L, E), dir };
  }
  const E = spec.stop;
  const dir = norm(E[0] - R[0], E[1] - R[2]);
  const L = [E[0] - dir[0] * spec.len, E[1] - dir[1] * spec.len];
  return { L, E, v: solveSlide(L, E), dir };
}

function norm(x, z) { const l = Math.hypot(x, z) || 1; return [x / l, z / l]; }

// Stop point past the hole on the line from the thrower, so the skid runs through it.
function throughHole(from, past = 0.4) {
  const R = toBoardLocal(from[0], from[1], from[2]);
  const [dx, dz] = norm(-R[0], HOLE_Z - R[2]);
  return [dx * past, HOLE_Z + dz * past];
}

// Plays a throw out in a copy of the board without touching the real one.
function trial(sim, plan, steps = 600) {
  const t = { bags: sim.bags.map((b) => ({ ...b })), events: [], t: sim.t, acc: 0, order: sim.order };
  addBag(t, { id: -1, team: '-', x: plan.L[0], z: plan.L[1], vx: plan.v[0], vz: plan.v[1] });
  for (let i = 0; i < steps && !settled(t); i++) sub(t, SUB);
  return t;
}

// Turns a scripted throw into a landing point and skid, using where bags sit right now.
// Pushes get test-played first, nudging the aim until the pushed bag really drops
// (and the pusher follows it in, or stays out, when the script asks for that).
export function planThrow(spec, from, sim) {
  const s = { ...spec };
  const find = (id) => sim.bags.find((b) => b.id === id && live(b));
  if (spec.to === 'hole') s.stop = throughHole(from, spec.past);
  if (spec.push) {
    const tb = find(spec.push.bag);
    if (tb) {
      let best = null;
      for (const shift of [0, 0.03, -0.03, 0.06, -0.06, 0.09, 0.12, 0.15, 0.18, -0.09]) {
        const plan = planSlide({ ...s, push: { ...spec.push, target: [tb.x, tb.z], toward: [shift, HOLE_Z] } }, from);
        const t = trial(sim, plan);
        const target = t.bags.find((b) => b.id === spec.push.bag);
        const pusher = t.bags.find((b) => b.id === -1);
        if (target.state !== 'in') continue;
        if (!best) best = plan;
        if (spec.push.follow === undefined || (pusher.state === 'in') === spec.push.follow) return plan;
      }
      if (best) return best;
      s.push = { ...spec.push, target: [tb.x, tb.z] };
    } else { delete s.push; s.stop = throughHole(from); s.len = 1.5; }
  }
  if (spec.onto !== undefined) {
    const tb = find(spec.onto);
    if (tb) s.stack = { base: [tb.x, tb.z], off: spec.off, speed: spec.speed };
    else { s.stop = [0.45, -0.3]; s.len = 1; }
  }
  return planSlide(s, from);
}
