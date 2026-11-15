import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createEnvironment} from './environment.js';
import {initGarage} from './garage.js';
var QG = new URLSearchParams(location.search).get("glb");
var CAR_URL = (QG && QG !== "off" ? QG : null) || window.CAR_GLB_URL || "auto.glb";
var TIMEOUT = 1e4;
window.THREE = THREE;
window.ALPINE = { createEnvironment };
var ld = document.getElementById("ld");
var txt = document.getElementById("ldt");
var bar = document.getElementById("ldb");
var prog = (p, t) => {
  if (bar) bar.style.width = p + "%";
  if (txt) txt.textContent = t;
};
function toast(t) {
  const d = document.createElement("div");
  d.textContent = t;
  d.style.cssText = "position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);z-index:30;background:rgba(10,14,20,.85);color:#fff;font:600 13px system-ui,sans-serif;padding:8px 14px;border-radius:10px;max-width:86vw;text-align:center";
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 7e3);
}
function loadGLB() {
  if (QG === "off") return Promise.resolve({ ok: false, why: "disattivata da ?glb=off" });
  return new Promise((res) => {
    let done = false;
    const fin = (r2) => {
      if (done) return;
      done = true;
      clearTimeout(to);
      res(r2);
    }, to = setTimeout(() => fin({ ok: false, why: "timeout oltre " + TIMEOUT / 1e3 + " s" }), TIMEOUT);
    try {
      const L = new GLTFLoader(), d = new DRACOLoader();
      d.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/");
      L.setDRACOLoader(d);
      L.setMeshoptDecoder(MeshoptDecoder);
      L.load(
        CAR_URL,
        (g) => fin({ ok: true, scene: g.scene }),
        (e) => {
          if (e && e.lengthComputable && e.total > 0) {
            const p = Math.min(99, Math.round(e.loaded / e.total * 100));
            prog(p, "Caricamento auto 3D\u2026 " + p + "%");
          } else if (e) prog(50, "Caricamento auto 3D\u2026 " + (e.loaded / 1048576).toFixed(1) + " MB");
        },
        (err) => fin({ ok: false, why: err && err.message || "rete/CORS" })
      );
    } catch (e) {
      fin({ ok: false, why: e.message });
    }
  });
}
function loadNatura() {
  return new Promise((res) => {
    let done = false;
    const fin = (r2) => {
      if (done) return;
      done = true;
      clearTimeout(to);
      res(r2);
    }, to = setTimeout(() => fin({ ok: false, why: "timeout oltre 15 s" }), 15000);
    try {
      const L = new GLTFLoader(), d = new DRACOLoader();
      d.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/");
      L.setDRACOLoader(d);
      L.setMeshoptDecoder(MeshoptDecoder);
      L.load(
        "natura.glb",
        (g) => fin({ ok: true, gltf: g }),
        (e) => { if (txt && e && e.total > 0) txt.textContent = "Caricamento vegetazione 3D\u2026 " + Math.min(99, Math.round(e.loaded / e.total * 100)) + "%"; },
        (err) => fin({ ok: false, why: err && err.message || "rete/CORS" })
      );
    } catch (e) {
      fin({ ok: false, why: e.message });
    }
  });
}
var NAT_KEYS = /^(albero|roccia|rock|tree|stone)/;
function bakeAsset(scene, meshNames) {
  scene.updateMatrixWorld(true);
  const parts = [];
  scene.traverse((o) => {
    if (!o.isMesh || !o.geometry || !meshNames.includes(o.name)) return;
    const geo = o.geometry.clone();
    geo.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(geo.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") geo.deleteAttribute(k);
    if (!geo.attributes.normal) geo.computeVertexNormals();
    parts.push({ geo, mat: o.material });
  });
  return parts;
}
function normalizeAsset(parts, mode) {
  const box = new THREE.Box3();
  for (const p of parts) {
    p.geo.computeBoundingBox();
    box.union(p.geo.boundingBox);
  }
  const size = box.getSize(new THREE.Vector3());
  const scale = mode === "tree" ? 7 / Math.max(size.y, 0.001) : 2 / Math.max(size.x, size.y, size.z, 0.001);
  const m = new THREE.Matrix4().makeScale(scale, scale, scale).multiply(new THREE.Matrix4().makeTranslation(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2));
  for (const p of parts) p.geo.applyMatrix4(m);
}
function registerNatura(gltf) {
  try {
    const names = new Set();
    gltf.scene.traverse((o) => { if (o.isMesh && o.name) names.add(o.name); });
    const groups = /* @__PURE__ */ new Map();
    for (const n of names) {
      const s = n.toLowerCase().replace(/[^a-z0-9]/g, ""), m = s.match(NAT_KEYS);
      if (!m) continue;
      const kind = m[1] === "albero" ? "tree" : "rock";
      const d2 = s.slice(m[1].length).match(/\d+/), key = (kind === "tree" ? "albero" : "roccia") + (d2 ? d2[0] : "1");
      if (!groups.has(key)) groups.set(key, { kind, meshes: [] });
      groups.get(key).meshes.push(n);
    }
    const trees = [], rocks = [];
    for (const [key, gr] of groups) {
      const parts = bakeAsset(gltf.scene, gr.meshes);
      if (!parts.length) continue;
      normalizeAsset(parts, gr.kind);
      (gr.kind === "tree" ? trees : rocks).push({ name: key, parts });
    }
    const byIdx = (a, b) => (parseInt(a.name.replace(/\D/g, ""), 10) || 0) - (parseInt(b.name.replace(/\D/g, ""), 10) || 0);
    trees.sort(byIdx);
    rocks.sort(byIdx);
    if (!trees.length && !rocks.length) throw new Error("nessuna mesh albero/roccia trovata");
    window.ALPINE.natura = { trees, rocks };
    console.log("[natura] alberi:", trees.map((t) => t.name).join(",") || "-", "| rocce:", rocks.map((r2) => r2.name).join(",") || "-");
    return true;
  } catch (e) {
    console.warn("[natura] non registrata:", e && e.message);
    return false;
  }
}
prog(2, "Caricamento auto 3D\u2026 0%");
var glb = loadGLB(), natura = loadNatura();
var game = new Promise((res) => {
  const s = document.createElement("script");
  if (window.__GAME_SRC__) {
    s.textContent = window.__GAME_SRC__;
    document.body.appendChild(s);
    res();
  } else {
    s.src = "game.js?v=8";
    s.onload = () => res();
    s.onerror = () => res();
    document.body.appendChild(s);
  }
});
var [r, natr] = await Promise.all([glb, game, natura]);
initGarage({ button: "#grgbtn", overlay: "#grg", canvas: "#grgc", close: "#grgb", hint: "#grgh", title: "#grgt", url: "auto.glb" });
if (r.ok) {
  prog(100, "Auto 3D pronta");
  const ok = typeof window.applyCarModel === "function" && window.applyCarModel(r.scene);
  if (!ok) toast("Auto 3D non utilizzabile (struttura inattesa): uso il modello integrato.");
} else {
  console.warn("GLB non caricato:", r.why);
  toast("Auto 3D non disponibile (" + r.why + "): uso il modello integrato.");
}
if (natr && natr.ok) {
  if (!registerNatura(natr.gltf)) toast("Vegetazione 3D non valida: uso alberi/rocce procedurali.");
} else if (natr) console.warn("natura.glb non caricato:", natr.why);
if (ld) ld.remove();
