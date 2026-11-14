import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
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
initGarage({ button: "#grgbtn", overlay: "#grg", canvas: "#grgc", close: "#grgb", hint: "#grgh", title: "#grgt", url: CAR_URL });
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
prog(2, "Caricamento auto 3D\u2026 0%");
var glb = loadGLB();
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
var [r] = await Promise.all([glb, game]);
if (r.ok) {
  prog(100, "Auto 3D pronta");
  const ok = typeof window.applyCarModel === "function" && window.applyCarModel(r.scene);
  if (!ok) toast("Auto 3D non utilizzabile (struttura inattesa): uso il modello integrato.");
} else {
  console.warn("GLB non caricato:", r.why);
  toast("Auto 3D non disponibile (" + r.why + "): uso il modello integrato.");
}
if (ld) ld.remove();
