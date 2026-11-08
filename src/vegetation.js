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
  const rnd = mulberry32(cfg.seed * 31 + 7), nz = makeNoise(cfg.seed + 99), g = new THREE.Group(), F = terrain.fineRect, hAt = terrain.heightAt, d = new THREE.Object3D(), col = new THREE.Color(), minD = cfg.veg.minRoadDist, treeLine = road.maxY + 70, cols = [], th = cfg.themeDef, VT = th.veg, sea = terrain.seaY;
  function place(count, region, geo, far) {
    const m = new THREE.InstancedMesh(geo, M.tree, count);
    let n = 0;
    for (let a = 0; a < count * 14 && n < count; a++) {
      const x = region.x0 + rnd() * (region.x1 - region.x0), z = region.z0 + rnd() * (region.z1 - region.z0);
      if (!far && !(x > F.x0 && x < F.x1 && z > F.z0 && z < F.z1)) continue;
      if (far && x > F.x0 - 60 && x < F.x1 + 60 && z > F.z0 - 60 && z < F.z1 + 60) continue;
      const y = far ? terrain.natural(x, z) - 0.8 : hAt(x, z), dens = ss2(-0.25, 0.15, nz.fbm(x * 8e-3, z * 8e-3, 3));
      if (sea != null && y < sea + 1.5) continue;
      if (rnd() > dens * VT.density * (VT.treeLine ? 1 - ss2(treeLine - 70, treeLine, y) : 1)) continue;
      if (!far) {
        const q2 = road.nearest(x, z, minD + 8);
        if (q2) {
          if (q2.d < minD) continue;
          if (q2.d < 16 && road.Y[q2.i] - y > 3) continue;
        }
        if (terrain.slopeAt(x, z) > 0.7) continue;
      } else if (Math.hypot(terrain.natural(x + 4, z) - terrain.natural(x - 4, z), terrain.natural(x, z + 4) - terrain.natural(x, z - 4)) / 8 > 0.9) continue;
      const s = 0.8 + rnd() * 0.9;
      if (!far) {
        const q2 = road.nearest(x, z, 24);
        if (q2) cols.push({ x, z, r: 0.45 + 0.3 * s, rock: false });
      }
      d.position.set(x, y, z);
      d.rotation.set(0, rnd() * 6.28, 0);
      d.scale.set(s * (0.85 + rnd() * 0.3), s * (far ? 1.3 : 1) * (0.9 + rnd() * 0.5), s * (0.85 + rnd() * 0.3));
      d.updateMatrix();
      m.setMatrixAt(n, d.matrix);
      const q = VT.hsl;
      m.setColorAt(n, col.setHSL(q[0] + rnd() * (q[1] - q[0]), q[2] + rnd() * (q[3] - q[2]), q[4] + rnd() * (q[5] - q[4])));
      n++;
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.castShadow = !far && preset.shadows;
    m.frustumCulled = true;
    g.add(m);
    return n;
  }
  const nNear = place(Math.round(preset.trees.near * VT.density), F, treeGeo(VT.type), false), nFar = place(Math.round(preset.trees.far * Math.min(1, VT.density)), { x0: -1800, x1: 1800, z0: -2400, z1: 700 }, treeFar(VT.type), true);
  const rg = rockGeo(rnd), rm = new THREE.InstancedMesh(rg, M.rock, preset.rocks);
  let nr = 0;
  for (let a = 0; a < preset.rocks * 30 && nr < preset.rocks; a++) {
    const near = rnd() < 0.55;
    let x, z;
    if (near) {
      const i = Math.floor(rnd() * road.N), side = rnd() < 0.5 ? -1 : 1, o = road.hw + road.shoulder + 2 + rnd() * 10;
      x = road.X[i] + road.NX[i] * side * o;
      z = road.Z[i] + road.NZ[i] * side * o;
    } else {
      x = F.x0 + rnd() * (F.x1 - F.x0);
      z = F.z0 + rnd() * (F.z1 - F.z0);
    }
    const y = hAt(x, z), sl = terrain.slopeAt(x, z), q = road.nearest(x, z, 14);
    if (q && q.d < road.hw + road.shoulder + 1.5) continue;
    if (!near && sl < 0.75) continue;
    const s = near ? 0.25 + rnd() * 0.7 : 1.2 + rnd() * 3.5;
    d.position.set(x, y + s * 0.15, z);
    d.rotation.set(rnd() * 0.6, rnd() * 6.28, rnd() * 0.6);
    d.scale.set(s * (1 + rnd() * 0.5), s * (0.6 + rnd() * 0.5), s * (1 + rnd() * 0.5));
    d.updateMatrix();
    if (near && s > 0.45 || !near) cols.push({ x, z, r: s * 0.85, rock: true });
    rm.setMatrixAt(nr, d.matrix);
    rm.setColorAt(nr, col.setHSL(0.09, 0.06, 0.34 + rnd() * 0.25));
    nr++;
  }
  rm.count = nr;
  rm.castShadow = preset.shadows;
  g.add(rm);
  return { group: g, colliders: cols.filter((c) => {
    const q = road.nearest(c.x, c.z, 24);
    return q && q.d < 24;
  }), counts: { treesNear: nNear, treesFar: nFar, rocks: nr } };
}
