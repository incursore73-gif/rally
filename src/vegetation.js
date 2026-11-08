import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeNoise,mulberry32} from './noise.js';
var paint = (g, c) => {
  const n = g.attributes.position.count, a = new Float32Array(n * 3), k = new THREE.Color(c);
  for (let i = 0; i < n; i++) {
    a[i * 3] = k.r;
    a[i * 3 + 1] = k.g;
    a[i * 3 + 2] = k.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
};
var ss2 = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
var mrg = (l) => {
  for (const g of l) g.deleteAttribute("uv");
  return mergeGeometries(l.map((g) => g.index ? g.toNonIndexed() : g));
};
var WH = "#ffffff";
var TR = "#4a3626";
function treeGeo(type) {
  if (type === "broadleaf") return mrg([paint(new THREE.CylinderGeometry(0.18, 0.3, 2.6, 5).translate(0, 1.3, 0), TR), paint(new THREE.IcosahedronGeometry(2.1, 1).scale(1, 1.15, 1).translate(0, 4.3, 0), WH), paint(new THREE.IcosahedronGeometry(1.4, 1).translate(0.9, 5.4, 0.3), WH)]);
  if (type === "pine") return mrg([paint(new THREE.CylinderGeometry(0.2, 0.32, 5.8, 5).translate(0, 2.9, 0), TR), paint(new THREE.CylinderGeometry(2.7, 2.2, 0.9, 8).translate(0, 6.4, 0), WH), paint(new THREE.CylinderGeometry(1.8, 1.4, 0.7, 8).translate(0.5, 7.2, 0), WH)]);
  if (type === "shrub") return mrg([paint(new THREE.IcosahedronGeometry(1.1, 1).scale(1.4, 0.7, 1.4).translate(0, 0.6, 0), WH), paint(new THREE.IcosahedronGeometry(0.7, 0).translate(0.9, 0.4, 0.3), WH)]);
  const t = paint(new THREE.CylinderGeometry(0.15, 0.28, 1.8, 5).translate(0, 0.9, 0), TR), c = [[1.7, 3.4, 3.1, "#264a2c"], [1.3, 3, 5, "#2c5632"], [0.85, 2.4, 6.7, "#336338"]].map(([r2, h, y, col]) => paint(new THREE.ConeGeometry(r2, h, 7).translate(0, y, 0), col));
  return mrg([t, ...c]);
}
var treeFar = (type) => type === "conifer" ? mrg([paint(new THREE.ConeGeometry(1.5, 7, 5).translate(0, 4.2, 0), "#2c5632")]) : mrg([paint(new THREE.IcosahedronGeometry(type === "shrub" ? 1.3 : 2.2, 0).translate(0, type === "shrub" ? 0.7 : 4, 0), WH)]);
function rockGeo(rnd) {
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position, map = /* @__PURE__ */ new Map(), ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  for (let i = 0; i < p.count; i++) {
    const x0 = p.getX(i), y0 = p.getY(i), z0 = p.getZ(i), k = x0.toFixed(3) + y0.toFixed(3) + z0.toFixed(3);
    if (!map.has(k)) map.set(k, (0.78 + rnd() * 0.4) * (1 + 0.2 * Math.sin(x0 * 2.1 + ph[0]) * Math.sin(y0 * 1.7 + ph[1]) + 0.12 * Math.sin(z0 * 3.3 + ph[2] + x0 * 1.3)));
    const f = map.get(k);
    p.setXYZ(i, x0 * f, Math.max(y0 * f * 0.8, -0.42), z0 * f);
  }
  g.computeVertexNormals();
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const t = Math.max(0, Math.min(1, (p.getY(i) + 0.42) / 1.2)), a = 0.58 + 0.5 * t;
    col[i * 3] = a * (1 + 0.04 * t);
    col[i * 3 + 1] = a * (1 + 0.05 * t);
    col[i * 3 + 2] = a;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}
export function buildVegetation(cfg, preset, terrain, road, M) {
  const rnd = mulberry32(cfg.seed * 31 + 7), nz = makeNoise(cfg.seed + 99), nz2 = makeNoise(cfg.seed + 211);
  const g = new THREE.Group(), F = terrain.fineRect, hAt = terrain.heightAt, d = new THREE.Object3D(), col = new THREE.Color();
  const minD = cfg.veg.minRoadDist, treeLine = road.maxY + 70, cols = [], th = cfg.themeDef, VT = th.veg, sea = terrain.seaY;
  const mix = VT.mix || (VT.type === "conifer" ? { alt: "pine", p: 0.22, shrub: 0.28 } : VT.type === "broadleaf" ? { alt: "conifer", p: 0.18, shrub: 0.22 } : VT.type === "pine" ? { alt: "shrub", p: 0.2, shrub: 0.18 } : { alt: null, p: 0, shrub: 0.12 });

  function place(count, region, geo, far, opt) {
    opt = opt || {};
    const m = new THREE.InstancedMesh(geo, M.tree, count);
    let n = 0, tries = 0, lim = count * (opt.tries || 14);
    while (tries++ < lim && n < count) {
      const x = region.x0 + rnd() * (region.x1 - region.x0), z = region.z0 + rnd() * (region.z1 - region.z0);
      if (!far && !(x > F.x0 && x < F.x1 && z > F.z0 && z < F.z1)) continue;
      if (far && x > F.x0 - 60 && x < F.x1 + 60 && z > F.z0 - 60 && z < F.z1 + 60) continue;
      const y = far ? terrain.natural(x, z) - 0.8 : hAt(x, z), dens = ss2(-0.25, 0.18, nz.fbm(x * 8e-3, z * 8e-3, 3));
      if (sea != null && y < sea + 1.5) continue;
      const tl = VT.treeLine ? 1 - ss2(treeLine - 70, treeLine, y) : 1;
      if (rnd() > dens * (opt.density || VT.density) * tl) continue;
      if (!far) {
        const q2 = road.nearest(x, z, minD + 10);
        if (q2) {
          if (q2.d < minD * (opt.minK || 1)) continue;
          if (q2.d < 16 && road.Y[q2.i] - y > 3) continue;
        }
        if (terrain.slopeAt(x, z) > (opt.slopeMax || 0.7)) continue;
      } else if (Math.hypot(terrain.natural(x + 4, z) - terrain.natural(x - 4, z), terrain.natural(x, z + 4) - terrain.natural(x, z - 4)) / 8 > 0.9) continue;
      const sv = opt.shrub ? 0.45 + rnd() * 0.7 : 0.72 + rnd() * 1.05;
      if (!far && opt.collide) {
        const q2 = road.nearest(x, z, 24);
        if (q2) cols.push({ x, z, r: (opt.shrub ? 0.2 : 0.42) + 0.28 * sv, rock: false });
      }
      d.position.set(x, y, z);
      const lean = opt.shrub ? 0.18 : far ? 0.04 : 0.12;
      d.rotation.set((rnd() - 0.5) * lean, rnd() * 6.283, (rnd() - 0.5) * lean);
      const sx = sv * (0.75 + rnd() * 0.5), sy = sv * (far ? 1.22 : 1) * (0.78 + rnd() * 0.78), sz = sv * (0.75 + rnd() * 0.5);
      d.scale.set(sx, opt.shrub ? sv * (0.55 + rnd() * 0.55) : sy, sz);
      d.updateMatrix();
      m.setMatrixAt(n, d.matrix);
      const q = opt.hsl || VT.hsl, vj = nz2.fbm(x * 0.018 + 3, z * 0.018, 2);
      m.setColorAt(n, col.setHSL(q[0] + rnd() * (q[1] - q[0]) + vj * 0.015, Math.min(1, q[2] + rnd() * (q[3] - q[2]) + vj * 0.04), q[4] + rnd() * (q[5] - q[4]) + (rnd() - 0.5) * 0.04));
      n++;
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.castShadow = !!(opt.shadow && preset.shadows);
    m.frustumCulled = true;
    g.add(m);
    return n;
  }

  const nearBudget = Math.round(preset.trees.near * VT.density);
  const altN = mix.alt ? Math.round(nearBudget * mix.p) : 0;
  const nNearA = place(Math.max(0, nearBudget - altN), F, treeGeo(VT.type), false, { shadow: true, collide: true });
  const nNearB = altN ? place(altN, F, treeGeo(mix.alt), false, { shadow: true, collide: true, density: VT.density * 0.95 }) : 0;
  const shrubN = Math.round(nearBudget * (mix.shrub || 0));
  const shrubHsl = [Math.max(0, VT.hsl[0] - 0.02), Math.min(1, VT.hsl[1] + 0.02), Math.min(1, VT.hsl[2] + 0.06), Math.min(1, VT.hsl[3] + 0.08), Math.max(0, VT.hsl[4] - 0.04), Math.min(1, VT.hsl[5] + 0.02)];
  const nShrub = shrubN ? place(shrubN, F, treeGeo("shrub"), false, { shrub: true, shadow: false, collide: false, density: VT.density * 1.1, minK: 0.75, slopeMax: 0.82, tries: 12, hsl: shrubHsl }) : 0;
  const nFar = place(Math.round(preset.trees.far * Math.min(1.15, VT.density)), { x0: -1800, x1: 1800, z0: -2400, z1: 700 }, treeFar(VT.type), true, { shadow: false, tries: 12 });

  // rocce: boulder/pareti + ghiaione vicino strada
  const rTotal = Math.round(preset.rocks * (1 + Math.min(0.25, (VT.density - 1) * 0.15)));
  const rMain = Math.round(rTotal * 0.72), rSmall = rTotal - rMain;
  function placeRocks(geo, count, small) {
    const rm = new THREE.InstancedMesh(geo, M.rock, count);
    let nr = 0, tries = 0;
    while (tries++ < count * 34 && nr < count) {
      const near = small ? rnd() < 0.72 : rnd() < 0.5;
      let x, z;
      if (near) {
        const i = Math.floor(rnd() * road.N), side = rnd() < 0.5 ? -1 : 1, o = road.hw + road.shoulder + (small ? 1.2 : 2.2) + rnd() * (small ? 7 : 11);
        x = road.X[i] + road.NX[i] * side * o; z = road.Z[i] + road.NZ[i] * side * o;
      } else { x = F.x0 + rnd() * (F.x1 - F.x0); z = F.z0 + rnd() * (F.z1 - F.z0); }
      const y = hAt(x, z), sl = terrain.slopeAt(x, z), q = road.nearest(x, z, 14);
      if (q && q.d < road.hw + road.shoulder + (small ? 0.9 : 1.5)) continue;
      if (!small && !near && sl < 0.68) continue;
      if (small && !q && sl < 0.35) continue;
      const s = small ? 0.16 + rnd() * 0.42 : near ? 0.3 + rnd() * 0.85 : 1.1 + rnd() * 3.8;
      d.position.set(x, y + s * (small ? 0.08 : 0.15), z);
      d.rotation.set(rnd() * 0.7, rnd() * 6.283, rnd() * 0.7);
      d.scale.set(s * (1 + rnd() * 0.55), s * (0.55 + rnd() * 0.55), s * (1 + rnd() * 0.55));
      d.updateMatrix();
      if ((near && s > 0.38) || (!near && !small)) cols.push({ x, z, r: s * (small ? 0.7 : 0.85), rock: true });
      rm.setMatrixAt(nr, d.matrix);
      const lit = 0.3 + rnd() * 0.3 + (small ? 0.04 : 0);
      rm.setColorAt(nr, col.setHSL(0.075 + rnd() * 0.03, 0.05 + rnd() * 0.04, lit));
      nr++;
    }
    rm.count = nr;
    rm.castShadow = !!(preset.shadows && !small);
    rm.frustumCulled = true;
    g.add(rm);
    return nr;
  }
  const nrMain = placeRocks(rockGeo(rnd), rMain, false);
  const nrSmall = placeRocks(rockGeo(rnd), rSmall, true);
  const nNear = nNearA + nNearB;

  return { group: g, colliders: cols.filter((c) => {
    const q = road.nearest(c.x, c.z, 24);
    return q && q.d < 24;
  }), counts: { treesNear: nNear, treesFar: nFar, rocks: nrMain + nrSmall, shrubs: nShrub } };
}
