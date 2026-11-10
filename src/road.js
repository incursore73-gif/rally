import * as THREE from 'three';
import {mulberry32} from './noise.js';
var rot = (v, a) => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });
function layout(rc, rnd) {
  const P = [], rr = (a, b) => a + (b - a) * rnd(), mir = rnd() < 0.5 ? -1 : 1, wd = rr(0.75, 1.1), sh = rr(-50, 50), xa = rc.xRange[0] * wd + sh, xb = rc.xRange[1] * wd + sh;
  let p = { x: mir > 0 ? xa + (xb - xa) * 0.2 : xb - (xb - xa) * 0.2, y: 0 }, h = { x: 0.995 * mir, y: -rr(0.03, 0.16) };
  P.push({ ...p });
  p = { x: p.x + h.x * 50, y: p.y + h.y * 50 };
  P.push({ ...p });
  for (let i = 0; i <= rc.hairpins; i++) {
    const sd = Math.sign(h.x) || 1, u = rnd(), kind = i === 0 ? u < 0.5 ? "long" : "wavy" : u < 0.22 ? "short" : u < 0.5 ? "long" : u < 0.78 ? "wavy" : "normal", room = sd > 0 ? xb - p.x : p.x - xa;
    let span = kind === "short" ? rr(rc.legMin * 0.45, rc.legMin * 0.8) : kind === "long" ? rr(Math.max(150, room * 0.7), Math.max(160, room)) : kind === "wavy" ? rr(110, Math.max(130, room)) : rr(rc.legMin, 170);
    span = Math.max(40, Math.min(span, Math.max(room, 40)));
    const len = span / Math.abs(h.x), k = Math.max(2, Math.round(len / (kind === "wavy" ? 30 : 45))), pr = { x: -h.y, y: h.x };
    const w = (kind === "wavy" ? rr(6, 15) : rr(2, 7)) * (rnd() < 0.5 ? -1 : 1), ph = kind === "wavy" ? rr(1.5, 3.2) : rr(0.7, 1.6);
    for (let j = 1; j <= k; j++) {
      const t = j / k, o = j < k ? Math.sin(t * Math.PI * ph) * w : 0;
      P.push({ x: p.x + h.x * len * t + pr.x * o, y: p.y + h.y * len * t + pr.y * o });
    }
    p = P[P.length - 1];
    if (i === rc.hairpins) {
      P.push({ x: p.x + h.x * 60, y: p.y + h.y * 60 });
      break;
    }
    const n1 = { x: h.y, y: -h.x }, n2 = { x: -h.y, y: h.x }, n = n1.y < n2.y ? n1 : n2, R = rr(rc.radiusMin, rc.radiusMax), c = { x: p.x + n.x * R, y: p.y + n.y * R }, r0 = { x: p.x - c.x, y: p.y - c.y };
    const s = Math.sign(-r0.y * h.x + r0.x * h.y);
    for (let j = 1; j <= 8; j++) {
      const r2 = rot(r0, s * Math.PI * j / 8);
      P.push({ x: c.x + r2.x, y: c.y + r2.y });
    }
    p = P[P.length - 1];
    const a = rr(rc.legTilt[0], rc.legTilt[1]) * Math.PI / 180, c1 = rot({ x: -h.x, y: -h.y }, a), c2 = rot({ x: -h.x, y: -h.y }, -a);
    h = c1.y < c2.y ? c1 : c2;
  }
  return P;
}
function layoutMeander(rc, rnd) {
  const P = [], rr = (a, b) => a + (b - a) * rnd(), cl = (x, a, b) => Math.max(a, Math.min(b, x)), cx = (rc.cx || 0) + rr(-40, 40), half = rc.xHalf || 150, step = rc.step || 40, base = rc.wild || 0.5, cap0 = rc.maxTurn || 0.6, bias = rr(-0.45, 0.45);
  let p = { x: cx, y: 0 }, ang = -Math.PI / 2 + bias * 0.5 + rr(-0.3, 0.3), turn = 0, mode = "straight", left = rr(90, 140);
  P.push({ ...p });
  for (let d = 0, n = Math.round(rc.length / step); d < n; d++) {
    if ((left -= step) <= 0) {
      const u = rnd();
      const tp = rc.techP ?? 0.4;
      mode = u < 1 - tp - 0.22 ? "flow" : u < 0.78 ? "tech" : "straight";
      left = mode === "straight" ? rr(120, 260) : rr(240, 520);
    }
    const wild = mode === "tech" ? base * 2.3 : mode === "straight" ? 0.04 : base * 0.8, cap = mode === "tech" ? Math.min(0.95, cap0 * 1.55) : mode === "straight" ? 0.1 : cap0;
    turn = turn * (mode === "tech" ? 0.9 : 0.8) + (rnd() - 0.5) * wild;
    const lo = rc.xMin ?? cx - half * 1.5, hi = rc.xMax ?? cx + half * 1.5;
    const mg = Math.max(70, step * 2.5);
    let wx = cl((cx - p.x) / half, -1, 1) * 0.9, k = 0.3;
    if (p.x > hi - mg) {
      wx = -1.15;
      k = 0.8;
      turn *= 0.3;
    } else if (p.x < lo + mg) {
      wx = 1.15;
      k = 0.8;
      turn *= 0.3;
    }
    const want = -Math.PI / 2 + bias * 0.5 + wx;
    let da = cl(turn + (want - ang) * k, -cap, cap);
    ang = cl(ang + da, -Math.PI + 0.35, -0.35);
    p = { x: p.x + Math.cos(ang) * step, y: p.y + Math.sin(ang) * step };
    P.push({ ...p });
  }
  return P;
}
var smooth = (a, w) => {
  const n = a.length, o = new Float32Array(n), pre = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];
  for (let i = 0; i < n; i++) {
    const l = Math.max(0, i - w), r2 = Math.min(n - 1, i + w);
    o[i] = (pre[r2 + 1] - pre[l]) / (r2 - l + 1);
  }
  return o;
};
export function createRoad(cfg, natural) {
  const rc = cfg.road, hw = rc.width / 2, sh = rc.shoulder;
  let pts, attempt = 0;
  if (rc.points) {
    const cv = new THREE.CatmullRomCurve3(rc.points.map((p) => new THREE.Vector3(p.x, 0, p.y)), false, "centripetal");
    cv.arcLengthDivisions = 8e3;
    cv.updateArcLengths();
    pts = cv.getSpacedPoints(Math.round(cv.getLength() / rc.sampleStep));
  } else for (; ; attempt++) {
    pts = new THREE.CatmullRomCurve3((rc.style === "meander" ? layoutMeander : layout)(rc, mulberry32(cfg.seed * 7919 + attempt * 104729)).map((p) => new THREE.Vector3(p.x, 0, p.y)), false, "centripetal");
    pts.arcLengthDivisions = 8e3;
    pts.updateArcLengths();
    const sm = pts.getSpacedPoints(Math.round(pts.getLength() / rc.sampleStep)), need = 2 * (hw + sh) + 3;
    let ok = !(rc.minLength && pts.getLength() < rc.minLength);
    {
      const g = 3;
      for (let i = g; i < sm.length - g; i += 2) {
        const a1 = Math.atan2(sm[i].z - sm[i - g].z, sm[i].x - sm[i - g].x), a2 = Math.atan2(sm[i + g].z - sm[i].z, sm[i + g].x - sm[i].x), dd = Math.abs(Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1)));
        if (dd / (g * rc.sampleStep) > 1 / (rc.minRadius || 12)) {
          ok = false;
          break;
        }
      }
    }
    for (let i = 0; i < sm.length && ok; i += 3) for (let j = i + 25; j < sm.length; j += 3) if (Math.hypot(sm[i].x - sm[j].x, sm[i].z - sm[j].z) < need) {
      ok = false;
      break;
    }
    if (ok || attempt > 40) {
      pts = sm;
      break;
    }
  }
  const N = pts.length, X = new Float32Array(N), Z = new Float32Array(N), S = new Float32Array(N), TX = new Float32Array(N), TZ = new Float32Array(N), NX = new Float32Array(N), NZ = new Float32Array(N), K = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    X[i] = pts[i].x;
    Z[i] = pts[i].z;
    if (i) S[i] = S[i - 1] + Math.hypot(X[i] - X[i - 1], Z[i] - Z[i - 1]);
  }
  for (let i = 0; i < N; i++) {
    const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1), dx = X[b] - X[a], dz = Z[b] - Z[a], l = Math.hypot(dx, dz) || 1;
    TX[i] = dx / l;
    TZ[i] = dz / l;
    NX[i] = -TZ[i];
    NZ[i] = TX[i];
  }
  for (let i = 2; i < N - 2; i++) {
    const a = Math.atan2(TZ[i + 2], TX[i + 2]) - Math.atan2(TZ[i - 2], TX[i - 2]);
    K[i] = Math.atan2(Math.sin(a), Math.cos(a)) / (S[i + 2] - S[i - 2]);
  }
  const ds = rc.sampleStep;
  let Y = Float32Array.from(X, (x, i) => natural(x, Z[i]));
  const w = Math.round(rc.smoothWindow / ds / 2);
  Y = smooth(smooth(Y, w), w);
  if (rc.profile) {
    const pr = rc.profile, Lt = S[N - 1];
    for (let i = 0; i < N; i++) {
      const f = Math.min(1, Math.min(S[i], Lt - S[i]) / 60), tp = f * f * (3 - 2 * f);
      Y[i] += pr.amp * (0.62 * Math.sin(6.283 * S[i] / pr.l1 + pr.ph) + 0.38 * Math.sin(6.283 * S[i] / pr.l2 + pr.ph * 1.7)) * tp;
    }
  }
  for (let i = 1; i < N; i++) {
    const mg = rc.maxGrade * (S[i] - S[i - 1]);
    Y[i] = Math.min(Y[i - 1] + mg, Math.max(Y[i - 1] - mg, Y[i]));
  }
  for (let i = N - 2; i >= 0; i--) {
    const mg = rc.maxGrade * (S[i + 1] - S[i]);
    Y[i] = Math.min(Y[i + 1] + mg, Math.max(Y[i + 1] - mg, Y[i]));
  }
  Y = smooth(Y, 2);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, minY = 1e9, maxY = -1e9;
  for (let i = 0; i < N; i++) {
    x0 = Math.min(x0, X[i]);
    x1 = Math.max(x1, X[i]);
    z0 = Math.min(z0, Z[i]);
    z1 = Math.max(z1, Z[i]);
    minY = Math.min(minY, Y[i]);
    maxY = Math.max(maxY, Y[i]);
  }
  const CELL = 20, grid = /* @__PURE__ */ new Map(), key = (a, b) => (a + 4e3) * 2e4 + (b + 4e3);
  for (let i = 0; i < N; i++) {
    const k = key(Math.floor(X[i] / CELL), Math.floor(Z[i] / CELL));
    (grid.get(k) || grid.set(k, []).get(k)).push(i);
  }
  function nearest(x, z, maxD = 60) {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL), R2 = Math.ceil(maxD / CELL);
    let bi = -1, bd = maxD * maxD;
    for (let r2 = 0; r2 <= R2; r2++) {
      for (let a = -r2; a <= r2; a++) for (let b = -r2; b <= r2; b++) {
        if (Math.max(Math.abs(a), Math.abs(b)) !== r2) continue;
        const l = grid.get(key(cx + a, cz + b));
        if (l) for (const i of l) {
          const dx2 = x - X[i], dz2 = z - Z[i], d = dx2 * dx2 + dz2 * dz2;
          if (d < bd) {
            bd = d;
            bi = i;
          }
        }
      }
      if (bi >= 0 && bd <= r2 * CELL * (r2 * CELL)) break;
    }
    if (bi < 0) return null;
    const dx = x - X[bi], dz = z - Z[bi];
    return { i: bi, d: Math.sqrt(bd), lat: dx * NX[bi] + dz * NZ[bi], s: S[bi] };
  }
  const hairpins = [], kT = 1 / (rc.radiusMax * 1.7);
  for (let i = 0; i < N; ) {
    if (Math.abs(K[i]) > kT) {
      let j = i;
      while (j < N && Math.abs(K[j]) > kT * 0.8) j++;
      if (j - i >= 14) {
        const m = i + j >> 1;
        hairpins.push({ index: m, s: S[m], radius: 1 / Math.abs(K[m]), side: Math.sign(K[m]), position: new THREE.Vector3(X[m], Y[m], Z[m]) });
      }
      i = j;
    } else i++;
  }
  const R = {
    surface: rc.surface,
    X,
    Y,
    Z,
    S,
    TX,
    TZ,
    NX,
    NZ,
    K,
    N,
    hw,
    shoulder: sh,
    width: rc.width,
    length: S[N - 1],
    bounds: { x0, x1, z0, z1 },
    minY,
    maxY,
    hairpins,
    attempts: attempt,
    nearest,
    pointAt(s) {
      s = Math.min(Math.max(s, 0), S[N - 1]);
      let i = Math.min(N - 2, Math.floor(s / ds));
      while (i < N - 2 && S[i + 1] < s) i++;
      while (i > 0 && S[i] > s) i--;
      const f = (s - S[i]) / (S[i + 1] - S[i] || 1), L = (a, b) => a + (b - a) * f, t = new THREE.Vector3(L(TX[i], TX[i + 1]), 0, L(TZ[i], TZ[i + 1])).normalize();
      return { s, position: new THREE.Vector3(L(X[i], X[i + 1]), L(Y[i], Y[i + 1]), L(Z[i], Z[i + 1])), tangent: t, normal: new THREE.Vector3(-t.z, 0, t.x), grade: (Y[i + 1] - Y[i]) / (S[i + 1] - S[i] || 1), width: rc.width };
    },
    info(x, z, margin = 0) {
      const q = nearest(x, z, 40);
      if (!q) return { onRoad: false, onShoulder: false, distance: Infinity };
      const a = Math.abs(q.lat);
      return { onRoad: a <= hw + margin, onShoulder: a > hw + margin && a <= hw + sh, distance: q.d, lateral: q.lat, s: q.s, roadY: Y[q.i] };
    }
  };
  return R;
}
function strip(R, o0, o1, dy, vs, mask, ru = 1) {
  const N = R.N, pos = new Float32Array(N * 6), uv = new Float32Array(N * 4), ix = [];
  for (let i = 0; i < N; i++) for (let k = 0; k < 2; k++) {
    const o = k ? o1 : o0, j = i * 2 + k;
    pos[j * 3] = R.X[i] + R.NX[i] * o;
    pos[j * 3 + 1] = R.Y[i] + dy;
    pos[j * 3 + 2] = R.Z[i] + R.NZ[i] * o;
    uv[j * 2] = k * ru;
    uv[j * 2 + 1] = R.S[i] / vs;
  }
  for (let i = 0; i < N - 1; i++) {
    if (mask && !mask(i)) continue;
    const a = i * 2;
    ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(ix);
  g.computeVertexNormals();
  return g;
}
export function buildRoadMeshes(R, M) {
  const g = new THREE.Group(), hw = R.hw, sh = R.shoulder, add = (geo, mat, rs = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.receiveShadow = rs;
    g.add(m);
    return m;
  };
  add(strip(R, -hw, hw, 0, 4, null, Math.max(1, Math.round(hw * 2 / 4))), M.asphalt);
  add(strip(R, -hw, hw, 0.014, 8), M.wear).renderOrder = 1;
  add(strip(R, hw, hw + sh, -0.03, sh), M.shoulder);
  add(strip(R, -hw - sh, -hw, -0.03, sh), M.shoulder);
  add(strip(R, hw + sh, hw + sh + 1.8, -0.065, 1.8), M.shoulder);
  add(strip(R, -hw - sh - 1.8, -hw - sh, -0.065, 1.8), M.shoulder);
  if (R.surface !== "gravel") {
    add(strip(R, hw - 0.42, hw - 0.22, 0.02, 6), M.line, false);
    add(strip(R, -hw + 0.22, -hw + 0.42, 0.02, 6), M.line, false);
    add(strip(R, -0.08, 0.08, 0.02, 6, (i) => Math.floor(R.S[i] / 5) % 2 === 0), M.line, false);
  }
  return g;
}
export function buildFurniture(R, heightAt, M, cfg) {
  const g = new THREE.Group(), hw = R.hw, sh = R.shoulder, N = R.N, ds = cfg.road.sampleStep, rl = cfg.rails, off = hw + sh - 0.15, segs = [], dummy = new THREE.Object3D();
  const postM = [], delM = [], refM = [], railRefM = [], wallM = [], chevM = [], FL = {};
  for (const side of [-1, 1]) {
    const flag = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const o = hw + sh + 2.5;
      flag[i] = R.Y[i] - heightAt(R.X[i] + R.NX[i] * side * o, R.Z[i] + R.NZ[i] * side * o) > rl.dropMin ? 1 : 0;
    }
    for (let i = 1; i < N - 1; i++) if (!flag[i]) {
      let j = i;
      while (j < N && !flag[j]) j++;
      if (flag[i - 1] && j < N && j - i <= 4) for (let k = i; k < j; k++) flag[k] = 1;
      i = j;
    }
    FL[side] = flag;
    for (let i = 0; i < N; ) {
      if (!flag[i]) { i++; continue; }
      let j = i;
      while (j < N && flag[j]) j++;
      if (j - i >= 6) {
        const pts = [];
        for (let k = i; k < j; k++) pts.push(new THREE.Vector3(R.X[k] + R.NX[k] * side * off, R.Y[k] + 0.5, R.Z[k] + R.NZ[k] * side * off));
        segs.push({ side, points: pts });
        const step = Math.round(rl.postSpacing / ds);
        for (let k = i; k < j; k += step) postM.push([R.X[k] + R.NX[k] * side * (off + 0.15), R.Y[k] + 0.45, R.Z[k] + R.NZ[k] * side * (off + 0.15)]);
        for (let k = i + 2; k < j - 2; k += Math.max(3, step)) {
          const x = R.X[k] + R.NX[k] * side * (off - 0.08), z = R.Z[k] + R.NZ[k] * side * (off - 0.08);
          railRefM.push([x, R.Y[k] + 0.58, z, Math.atan2(-R.TZ[k], R.TX[k])]);
        }
      }
      i = j;
    }
    for (let i = 0; i < N; i += 10) {
      if (flag[i]) continue;
      const o = hw + sh + 0.3;
      const dx = R.X[i] + R.NX[i] * side * o, dz = R.Z[i] + R.NZ[i] * side * o, dy = R.Y[i] + 0.45;
      delM.push([dx, dy, dz]);
      refM.push([dx, dy + 0.42, dz]);
    }
    for (let i = 0; i < N; i += 2) {
      const o = hw + sh + 0.3, up = heightAt(R.X[i] + R.NX[i] * side * (o + 2), R.Z[i] + R.NZ[i] * side * (o + 2)) - R.Y[i];
      if (up > 1.2 && up < 8 && !flag[i]) wallM.push([R.X[i] + R.NX[i] * side * o, R.Y[i] + 0.4, R.Z[i] + R.NZ[i] * side * o, Math.atan2(-R.TZ[i], R.TX[i])]);
    }
  }
  const rg = new THREE.BufferGeometry();
  {
    const P = [], I = [], UV = [];
    let b = 0, uAcc = 0;
    for (const s of segs) {
      for (let k = 0; k < s.points.length; k++) {
        const p = s.points[k];
        if (k > 0) uAcc += Math.hypot(p.x - s.points[k - 1].x, p.z - s.points[k - 1].z) / 6;
        P.push(p.x, p.y, p.z, p.x, p.y + 0.32, p.z);
        UV.push(uAcc, 0, uAcc, 1);
        if (k < s.points.length - 1) I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
        b += 2;
      }
    }
    rg.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    rg.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
    rg.setIndex(I);
    rg.computeVertexNormals();
  }
  const rm = new THREE.Mesh(rg, M.rail);
  rm.castShadow = false;
  g.add(rm);
  const inst = (geo, mat, list, withRot) => {
    if (!list.length) return;
    const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => {
      dummy.position.set(p[0], p[1], p[2]);
      dummy.rotation.set(0, withRot ? p[3] : 0, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.receiveShadow = true;
    g.add(m);
  };
  inst(new THREE.BoxGeometry(0.12, 0.85, 0.1), M.post, postM);
  inst(new THREE.BoxGeometry(0.06, 0.95, 0.06), M.delin, delM);
  inst(new THREE.BoxGeometry(0.08, 0.14, 0.03), M.reflect, refM);
  inst(new THREE.BoxGeometry(0.1, 0.08, 0.03), M.reflect, railRefM, true);
  inst(new THREE.BoxGeometry(3, 0.8, 0.55), M.wall, wallM, true);
  for (const h of R.hairpins) {
    for (let k = -3; k <= 3; k++) {
      const i = Math.min(N - 1, Math.max(0, h.index + k * 3)), side = -h.side, o = hw + sh + 0.9;
      chevM.push([R.X[i] + R.NX[i] * side * o, R.Y[i] + 1.3, R.Z[i] + R.NZ[i] * side * o, Math.atan2(-R.TZ[i], R.TX[i])]);
    }
  }
  inst(new THREE.BoxGeometry(1, 0.7, 0.05), M.sign, chevM, true);
  /* ---- paesaggio a bordo pista: muri a secco, case, incroci, ponti (estetica + collider statici) ---- */
  const sideCfg = ({ alpine: { walls: 0.55, houses: 16, bridges: 3, crossings: 4 }, forest: { walls: 0.22, houses: 10, bridges: 2, crossings: 3 }, canyon: { walls: 0.15, houses: 0, bridges: 2, crossings: 3 }, coast: { walls: 0.1, houses: 10, bridges: 2, crossings: 3 } })[cfg.theme] || { walls: 0.4, houses: 12, bridges: 2, crossings: 3 };
  const rnd2 = mulberry32((cfg.seed | 0) * 2654435 + 97), wcol = new THREE.Color(), colsF = [];
  // muretti a secco in pietra
  const drystone = [];
  if (sideCfg.walls > 0) {
    const stepI = Math.max(1, Math.round(2.2 / ds));
    let budget = 950;
    for (const side of [-1, 1]) {
      const flg = FL[side];
      let i = 20 + Math.floor(rnd2() * 60), run = 0, cool = 30 + Math.floor(rnd2() * 120);
      while (i < N - 12 && budget > 0) {
        if (flg[i]) { run = 0; cool = 40 + Math.floor(rnd2() * 90); i += 3; continue; }
        if (cool > 0) { cool -= stepI; i += stepI; continue; }
        if (run <= 0) {
          if (rnd2() < sideCfg.walls) run = 10 + Math.floor(rnd2() * 24);
          else { cool = 120 + Math.floor(rnd2() * 420); i += stepI; continue; }
        }
        const o = hw + sh + 0.95 + rnd2() * 0.15;
        const x = R.X[i] + R.NX[i] * side * o, z = R.Z[i] + R.NZ[i] * side * o;
        const gy = heightAt(x, z), dy = gy - R.Y[i];
        const q2 = R.nearest(x, z, 46);
        const onOther = q2 && q2.d < hw + sh + 0.7 && Math.abs(R.S[q2.i] - R.S[i]) > 60;
        if (!onOther && dy > -1.6 && dy < 1.1) {
          const sy = 0.78 + rnd2() * 0.34;
          drystone.push([x, gy, z, Math.atan2(-R.TZ[i], R.TX[i]) + (rnd2() - 0.5) * 0.06, sy]);
          colsF.push({ x, z, r: 1, rock: true });
          budget--;
        }
        run -= stepI;
        i += stepI;
      }
    }
  }
  if (drystone.length) {
    const wIM = new THREE.InstancedMesh(new THREE.BoxGeometry(2.15, 1, 0.42), M.stone, drystone.length);
    drystone.forEach((p, k) => {
      dummy.position.set(p[0], p[1] + p[4] * 0.5 - 0.06, p[2]);
      dummy.rotation.set((rnd2() - 0.5) * 0.02, p[3], (rnd2() - 0.5) * 0.02);
      dummy.scale.set(1 + (rnd2() - 0.5) * 0.08, p[4], 1);
      dummy.updateMatrix();
      wIM.setMatrixAt(k, dummy.matrix);
      wIM.setColorAt(k, wcol.setHSL(0.07 + rnd2() * 0.03, 0.03 + rnd2() * 0.04, 0.72 + rnd2() * 0.2));
    });
    wIM.instanceColor.needsUpdate = true;
    wIM.castShadow = true;
    g.add(wIM);
    const cIM = new THREE.InstancedMesh(new THREE.BoxGeometry(2.24, 0.16, 0.52), M.stone, drystone.length);
    drystone.forEach((p, k) => {
      dummy.position.set(p[0], p[1] + p[4] + 0.03, p[2]);
      dummy.rotation.set((rnd2() - 0.5) * 0.02, p[3] + (rnd2() - 0.5) * 0.03, (rnd2() - 0.5) * 0.02);
      dummy.scale.set(1 + (rnd2() - 0.5) * 0.06, 1, 1);
      dummy.updateMatrix();
      cIM.setMatrixAt(k, dummy.matrix);
      cIM.setColorAt(k, wcol.setHSL(0.08 + rnd2() * 0.03, 0.03 + rnd2() * 0.04, 0.82 + rnd2() * 0.14));
    });
    cIM.instanceColor.needsUpdate = true;
    cIM.castShadow = true;
    g.add(cIM);
  }
  // case / borgo a bordo strada
  const housB = [], housR = [];
  if (sideCfg.houses > 0) {
    const anchors = [Math.max(5, Math.round(N * 0.03)), Math.round(N * 0.35), Math.round(N * 0.62), Math.round(N * 0.85)];
    for (const h of R.hairpins) anchors.push(Math.min(N - 6, Math.max(6, h.index + (rnd2() < 0.5 ? 14 : -14))));
    let placed = 0;
    for (const ai of anchors) {
      if (placed >= sideCfg.houses) break;
      const n = 2 + Math.floor(rnd2() * 3);
      for (let k = 0; k < n && placed < sideCfg.houses; k++) {
        const i2 = Math.min(N - 6, Math.max(5, ai + Math.floor((rnd2() - 0.5) * 22)));
        const side = rnd2() < 0.5 ? -1 : 1;
        const o = hw + sh + 7 + rnd2() * 9;
        const x = R.X[i2] + R.NX[i2] * side * o, z = R.Z[i2] + R.NZ[i2] * side * o;
        const q2 = R.nearest(x, z, 70);
        if (q2 && q2.d < hw + sh + 4.5) continue;
        const y = heightAt(x, z);
        if (Math.max(Math.abs(heightAt(x + 3, z) - y), Math.abs(heightAt(x, z + 3) - y)) > 1.6) continue;
        const w = 4.2 + rnd2() * 2.2, d = 3.8 + rnd2() * 1.6, hh = 2.8 + rnd2() * 1.4;
        const yaw = Math.atan2(-R.TZ[i2], R.TX[i2]) + (rnd2() - 0.5) * 0.35;
        housB.push([x, y, z, yaw, w, hh, d]);
        housR.push([x, y, z, yaw, w, hh, d, 1.4 + rnd2() * 1]);
        colsF.push({ x, z, r: Math.max(w, d) * 0.5, rock: true });
        placed++;
      }
    }
  }
  if (housB.length) {
    const bIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M.plaster, housB.length);
    const rIM = new THREE.InstancedMesh(new THREE.ConeGeometry(0.707, 1, 4).rotateY(Math.PI / 4), M.roof, housR.length);
    housB.forEach((p, k) => {
      dummy.position.set(p[0], p[1] + p[5] / 2, p[2]);
      dummy.rotation.set(0, p[3], 0);
      dummy.scale.set(p[4], p[5], p[6]);
      dummy.updateMatrix();
      bIM.setMatrixAt(k, dummy.matrix);
      bIM.setColorAt(k, wcol.setHSL(0.09 + rnd2() * 0.05, 0.18 + rnd2() * 0.2, 0.66 + rnd2() * 0.18));
      const q = housR[k], rh = q[7];
      dummy.position.set(q[0], q[1] + q[5] + rh / 2 - 0.1, q[2]);
      dummy.scale.set(q[4] * 1.04, rh, q[6] * 1.04);
      dummy.updateMatrix();
      rIM.setMatrixAt(k, dummy.matrix);
      rIM.setColorAt(k, wcol.setHSL(0.02 + rnd2() * 0.05, 0.3 + rnd2() * 0.2, 0.24 + rnd2() * 0.12));
    });
    bIM.instanceColor.needsUpdate = true;
    rIM.instanceColor.needsUpdate = true;
    bIM.castShadow = rIM.castShadow = true;
    g.add(bIM, rIM);
  }
  // incroci (strade bianche/farm road che attraversano l'asfalto, solo decal)
  if (sideCfg.crossings > 0 && M.cross) {
    const crossIdx = [];
    for (let i = 30, last = -1e9; i < N - 30; i++) if (Math.abs(R.K[i]) < 0.004 && R.S[i] - last > 320 && rnd2() < 0.03) { crossIdx.push(i); last = R.S[i]; if (crossIdx.length >= sideCfg.crossings) break; }
    if (crossIdx.length) {
      const cIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(2 * (hw + sh + 2.6), 6.2).rotateX(-Math.PI / 2), M.cross, crossIdx.length);
      crossIdx.forEach((i, k) => {
        dummy.position.set(R.X[i], R.Y[i] + 0.017, R.Z[i]);
        dummy.rotation.set(0, Math.atan2(-R.NZ[i], R.NX[i]), 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        cIM.setMatrixAt(k, dummy.matrix);
      });
      cIM.receiveShadow = true;
      g.add(cIM);
    }
  }
  // ponti che scavalcano la pista
  const bridgeIdx = [];
  for (const f of [0.3, 0.6, 0.85]) {
    const i = Math.round(N * f);
    if (bridgeIdx.length < sideCfg.bridges && i > 60 && i < N - 60 && (bridgeIdx.length === 0 || R.S[i] - R.S[bridgeIdx[bridgeIdx.length - 1]] > 380)) bridgeIdx.push(i);
  }
  for (const h of R.hairpins) if (bridgeIdx.length < sideCfg.bridges && h.index > 40 && h.index < N - 40 && (!bridgeIdx.length || Math.abs(h.index - bridgeIdx[bridgeIdx.length - 1]) > 190)) bridgeIdx.push(h.index);
  for (const bi of bridgeIdx) {
    const dirX = R.NX[bi], dirZ = R.NZ[bi], span = 2 * (hw + sh + 5.5);
    let yMax = -1e9;
    for (let k = Math.max(0, bi - 18); k <= Math.min(N - 1, bi + 18); k++) yMax = Math.max(yMax, R.Y[k]);
    const deckY = yMax + 4.8, yawD = Math.atan2(-dirZ, dirX);
    const arch = rnd2() < 0.45, rise = Math.min(9, span * 0.22);
    const bg = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(span, 0.8, 4.6), M.deck);
    deck.position.set(R.X[bi], deckY, R.Z[bi]);
    deck.rotation.y = yawD;
    deck.castShadow = true;
    bg.add(deck);
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(span, 0.55, 0.22), M.rail);
      rail.position.set(R.X[bi] + R.TX[bi] * s * 2.2, deckY + 0.55, R.Z[bi] + R.TZ[bi] * s * 2.2);
      rail.rotation.y = yawD;
      bg.add(rail);
      const po = span / 2 - 2.2, px = R.X[bi] + dirX * s * po, pz = R.Z[bi] + dirZ * s * po;
      const gy = heightAt(px, pz), h = deckY - 0.4 - gy;
      if (h > 0.4) {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1, 1.3), M.pier);
        pier.position.set(px, gy + h / 2, pz);
        pier.scale.y = h;
        pier.castShadow = true;
        bg.add(pier);
        colsF.push({ x: px, z: pz, r: 1.1, rock: true });
      }
    }
    if (arch) {
      // variante ponte ad arco in acciaio: due archi (tube) + pendini verticali
      const pts = [];
      for (let t = 0; t <= 1.001; t += 0.083) {
        const a = (t - 0.5) * span;
        pts.push(new THREE.Vector3(R.X[bi] + dirX * a, deckY + 0.55 + Math.sin(Math.PI * t) * rise, R.Z[bi] + dirZ * a));
      }
      const tubeG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.26, 6);
      for (const s of [-1, 1]) {
        const tube = new THREE.Mesh(tubeG, M.steel);
        tube.position.set(R.TX[bi] * s * 2.35, 0, R.TZ[bi] * s * 2.35);
        tube.castShadow = true;
        bg.add(tube);
      }
      const hIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 1, 0.09), M.steel, 18);
      let hn = 0;
      for (let t = 0.12; t <= 0.881; t += 0.095) {
        const a = (t - 0.5) * span, top = 0.15 + Math.sin(Math.PI * t) * rise;
        for (const s of [-1, 1]) {
          dummy.position.set(R.X[bi] + dirX * a + R.TX[bi] * s * 2.35, deckY + 0.4 + top / 2, R.Z[bi] + dirZ * a + R.TZ[bi] * s * 2.35);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, top, 1);
          dummy.updateMatrix();
          hIM.setMatrixAt(hn++, dummy.matrix);
        }
      }
      hIM.instanceMatrix.needsUpdate = true;
      hIM.castShadow = true;
      bg.add(hIM);
    }
    g.add(bg);
  }
  return { group: g, guardrails: segs, flags: { left: FL[-1], right: FL[1] }, landmarks: R.hairpins.map((h) => ({ type: "hairpin", position: h.position, s: h.s, radius: h.radius })), colliders: colsF.filter((c) => {
    const q = R.nearest(c.x, c.z, 30);
    return q && q.d < 30;
  }) };
}
