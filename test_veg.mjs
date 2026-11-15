// Test di regressione: esegue buildVegetation + buildFurniture con mock (stessi flussi del gioco)
import * as THREE from 'three';
import { buildVegetation } from './src/vegetation.js';
import { buildFurniture } from './src/road.js';

const N = 600;
const X = [], Y = [], Z = [], NX = [], NZ = [], TX = [], TZ = [];
for (let i = 0; i < N; i++) {
  const t = i / (N - 1);
  X.push(t * 400 - 200); Z.push(Math.sin(t * 6.28) * 80); Y.push(t * 10);
  TX.push(1); TZ.push(0);
  NX.push(0); NZ.push(1);
}
const road = {
  X, Y, Z, NX, NZ, TX, TZ, N, hw: 5, shoulder: 1.2, maxY: 10,
  hairpins: [{ index: 300, side: 1, position: { x: 0, z: 0 }, s: 0.5, radius: 15 }],
  nearest: (x, z, maxD) => {
    let best = null;
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(X[i] - x, Z[i] - z);
      if (d <= maxD && (!best || d < best.d)) best = { d, i };
    }
    return best;
  }
};
const terrain = {
  fineRect: { x0: -260, x1: 260, z0: -260, z1: 260 },
  heightAt: (x, z) => Math.sin(x * 0.01) * 3 + z * 0.02,
  natural: (x, z) => Math.sin(x * 0.01) * 3 + z * 0.02,
  slopeAt: () => 0.2,
  seaY: null
};
const mkMat = () => new THREE.MeshStandardMaterial();
const M = { tree: mkMat(), rock: mkMat(), rail: mkMat(), post: mkMat(), delin: mkMat(), wall: mkMat(), sign: mkMat() };
const preset = { lambert: false, shadows: true, trees: { near: 2400, far: 2600 }, rocks: 900 };
const cfg = { seed: 5, veg: { minRoadDist: 9 }, themeDef: { veg: { type: 'conifer', density: 1, hsl: [0.3, 0.36, 0.35, 0.5, 0.25, 0.45] } } };

// mock natura (come window.ALPINE.natura dopo il boot)
const geo = () => new THREE.BoxGeometry(1, 1, 1);
const mat = () => new THREE.MeshStandardMaterial();
globalThis.window = globalThis;
window.ALPINE = {};

try {
  const veg = buildVegetation(cfg, preset, terrain, road, M);
  console.log('natura ASSENTE -> buildVegetation OK | counts:', JSON.stringify(veg.counts), '| colliders:', veg.colliders.length, '| meshes nel gruppo:', veg.group.children.length);
} catch (e) {
  console.log('natura ASSENTE -> buildVegetation CRASH:', e.stack);
}
window.ALPINE = { natura: {
  trees: [{ name: 'albero1', parts: [{ geo: geo(), mat: mat() }] }, { name: 'albero2', parts: [{ geo: geo(), mat: mat() }] }, { name: 'albero3', parts: [{ geo: geo(), mat: mat() }] }],
  rocks: [{ name: 'roccia1', parts: [{ geo: geo(), mat: mat() }] }, { name: 'roccia2', parts: [{ geo: geo(), mat: mat() }] }, { name: 'roccia3', parts: [{ geo: geo(), mat: mat() }] }],
  bushes: [{ name: 'cespuglio1', parts: [{ geo: geo(), mat: mat() }] }],
  props: [{ name: 'gomme1', kind: 'tyre', parts: [{ geo: geo(), mat: mat() }] }, { name: 'fienile1', kind: 'barn', parts: [{ geo: geo(), mat: mat() }] }]
} };

try {
  const veg = buildVegetation(cfg, preset, terrain, road, M);
  console.log('natura PRESENTE -> buildVegetation OK | counts:', JSON.stringify(veg.counts), '| colliders:', veg.colliders.length, '| meshes nel gruppo:', veg.group.children.length);
} catch (e) {
  console.log('natura PRESENTE -> buildVegetation CRASH:', e.stack);
}
try {
  const furn = buildFurniture(road, terrain.heightAt, M, { road: { sampleStep: 1 }, rails: { dropMin: 2.2, postSpacing: 4, offset: 0.85 } });
  console.log('buildFurniture OK | guardrail segs:', furn.guardrails.length, '| meshes nel gruppo:', furn.group.children.length);
} catch (e) {
  console.log('buildFurniture CRASH:', e.stack);
}
