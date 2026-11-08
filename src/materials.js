import * as THREE from 'three';
var dom = typeof document !== "undefined";
function tex(w, h, draw, rep, an) {
  if (!dom) return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = an || 4;
  if (rep) t.repeat.set(rep[0], rep[1]);
  return t;
}
var texCache = /* @__PURE__ */ new Map();
var cachedTex = (key, mk2) => {
  if (!texCache.has(key)) texCache.set(key, mk2());
  return texCache.get(key);
};
var grain = (g, w, h, n, a) => {
  for (let i = 0; i < n; i++) {
    const v = Math.random() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${Math.random() * a})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
};

var rng32 = (a) => () => {
  a |= 0;
  a = a + 1831565813 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
var wrapAt = (w, h, x, y, r, fn) => {
  const xs = x < r ? [0, w] : x > w - r ? [0, -w] : [0], ys = y < r ? [0, h] : y > h - r ? [0, -h] : [0];
  for (const dx of xs) for (const dy of ys) fn(x + dx, y + dy);
};
var blotches = (g, S, R, n, rmin, rmax, light, dark, amin, amax) => {
  for (let i = 0; i < n; i++) {
    const x = R() * S, y = R() * S, r = rmin + R() * (rmax - rmin), a = amin + R() * (amax - amin), c = R() < 0.5 ? light : dark;
    wrapAt(S, S, x, y, r, (X, Y) => {
      const gr = g.createRadialGradient(X, Y, 0, X, Y, r);
      gr.addColorStop(0, `rgba(${c},${a})`);
      gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr;
      g.fillRect(X - r, Y - r, 2 * r, 2 * r);
    });
  }
};
var speckle = (g, S, R, n, size, lo, hi, a) => {
  for (let i = 0; i < n; i++) {
    const l = Math.round(lo + R() * (hi - lo)), x = R() * S, y = R() * S, s = size * (0.6 + R() * 1.4), al = a * (0.3 + R() * 0.7);
    g.fillStyle = `rgba(${l},${l},${l + (R() < 0.3 ? 6 : 0)},${al})`;
    wrapAt(S, S, x, y, s, (X, Y) => g.fillRect(X, Y, s, s));
  }
};
var pebbles = (g, S, R, n, rmin, rmax, tone, shadow) => {
  for (let i = 0; i < n; i++) {
    const x = R() * S, y = R() * S, r = rmin + R() * (rmax - rmin), rot = R() * 3, sq = 0.65 + R() * 0.3, l = tone(R);
    wrapAt(S, S, x, y, r + 2, (X, Y) => {
      g.fillStyle = `rgba(0,0,0,${shadow})`;
      g.beginPath();
      g.ellipse(X + r * 0.4, Y + r * 0.45, r, r * sq, rot, 0, 7);
      g.fill();
      g.fillStyle = l;
      g.beginPath();
      g.ellipse(X, Y, r, r * sq, rot, 0, 7);
      g.fill();
    });
  }
};
var crack = (g, S, R, x, y, ang, len, w, depth) => {
  const pts = [[x, y]], br = [];
  for (let d = 0; d < len; d += 9) {
    ang += (R() - 0.5) * 0.5;
    x += Math.cos(ang) * 9;
    y += Math.sin(ang) * 9;
    if (x < 4 || y < 4 || x > S - 4 || y > S - 4) break;
    pts.push([x, y]);
    if (depth < 2 && R() < 0.14) br.push([x, y, ang + (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.8)]);
  }
  g.lineCap = "round";
  g.lineWidth = w;
  g.strokeStyle = "rgba(0,0,0,.55)";
  g.beginPath();
  pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
  g.stroke();
  g.lineWidth = w * 0.6;
  g.strokeStyle = "rgba(255,255,255,.07)";
  g.beginPath();
  pts.forEach((p, i) => i ? g.lineTo(p[0] + 1.2, p[1] + 1.2) : g.moveTo(p[0] + 1.2, p[1] + 1.2));
  g.stroke();
  for (const b of br) crack(g, S, R, b[0], b[1], b[2], len * 0.45, w * 0.7, depth + 1);
};
function drawAsphalt(g, S, R) {
  const k = S / 512, m = Math.max(1, k);
  g.fillStyle = "#3d3f44";
  g.fillRect(0, 0, S, S);
  blotches(g, S, R, 44, 50 * k, 190 * k, "150,150,156", "8,8,10", 0.035, 0.1);
  speckle(g, S, R, Math.round(30000 * k * k), m, 15, 70, 0.26);
  speckle(g, S, R, Math.round(24000 * k * k), m, 140, 235, 0.22);
  pebbles(g, S, R, Math.round(620 * k * k), 1.4 * m, 3.4 * m, (r) => {
    const l = 110 + (r() * 90 | 0);
    return `rgba(${l},${l},${l + 4},.55)`;
  }, 0.3);
  blotches(g, S, R, 4, 24 * k, 60 * k, "0,0,0", "0,0,0", 0.06, 0.13);
  const nc = 2 + (R() * 2 | 0);
  for (let i = 0; i < nc; i++) crack(g, S, R, 30 + R() * (S - 60), 30 + R() * (S - 60), R() * 6.28, (110 + R() * 150) * k, (0.8 + R() * 0.8) * m, 0);
}
function drawGravel(g, S, R) {
  const k = S / 512, m = Math.max(1, k);
  g.fillStyle = "#8b7b63";
  g.fillRect(0, 0, S, S);
  blotches(g, S, R, 50, 40 * k, 170 * k, "205,185,150", "70,52,34", 0.05, 0.14);
  speckle(g, S, R, Math.round(22000 * k * k), m, 40, 110, 0.35);
  speckle(g, S, R, Math.round(22000 * k * k), m, 160, 245, 0.3);
  pebbles(g, S, R, Math.round(2600 * k * k), 0.9 * m, 2.4 * m, (r) => `rgba(${r() < 0.5 ? "215,196,160" : "96,74,50"},${0.35 + r() * 0.35})`, 0.28);
  pebbles(g, S, R, Math.round(260 * k * k), 2.8 * m, 5.2 * m, (r) => {
    const t = 120 + (r() * 90 | 0);
    return `rgba(${t},${t - 6},${t - 14},.8)`;
  }, 0.38);
  blotches(g, S, R, 6, 20 * k, 60 * k, "40,30,20", "40,30,20", 0.1, 0.2);
}
function drawWear(g, W, H, R, gravel) {
  const lanes = [0.202, 0.298, 0.702, 0.798], sig = (gravel ? 0.032 : 0.025) * W, peak = gravel ? 0.38 : 0.33, segs = 72;
  g.clearRect(0, 0, W, H);
  for (const uc of lanes) {
    const cx = uc * W;
    for (let s = 0; s < segs; s++) {
      const y0 = s * H / segs, hh = H / segs + 1, f = 0.6 + R() * 0.65;
      for (let x = Math.floor(cx - 3.2 * sig); x <= cx + 3.2 * sig; x++) {
        const d = (x - cx) / sig, a = peak * f * Math.exp(-d * d / 2);
        if (a < 0.008) continue;
        g.fillStyle = `rgba(0,0,0,${Math.min(0.7,a)})`;
        g.fillRect(x, y0, 1, hh);
      }
    }
  }
  for (let i = 0; i < 14; i++) {
    const uc = lanes[i % lanes.length] + (R() - 0.5) * 0.03, x = uc * W, y = R() * H, len = (18 + R() * 55) * (H / 512), w = 2 + R() * 3;
    g.fillStyle = `rgba(0,0,0,${0.12 + R() * 0.18})`;
    g.fillRect(x - w / 2, y, w, len);
  }
  for (let i = 0; i < 16; i++) {
    const x = R() * W, y = R() * H, r = 6 + R() * 18, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(0,0,0,${0.1 + R() * 0.14})`);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
}
function drawShoulder(g, S, R) {
  const k = S / 256, m = Math.max(1, k);
  g.fillStyle = "#6f6858";
  g.fillRect(0, 0, S, S);
  blotches(g, S, R, 34, 18 * k, 78 * k, "176,164,136", "58,52,42", 0.07, 0.18);
  blotches(g, S, R, 14, 12 * k, 46 * k, "132,122,100", "40,38,32", 0.05, 0.14);
  blotches(g, S, R, 6, 14 * k, 40 * k, "82,94,56", "82,94,56", 0.04, 0.1);
  speckle(g, S, R, Math.round(11000 * k * k), m, 25, 95, 0.36);
  speckle(g, S, R, Math.round(8000 * k * k), m, 145, 225, 0.24);
  pebbles(g, S, R, Math.round(520 * k * k), 0.8 * m, 2.8 * m, (r) => {
    const l = 88 + (r() * 105 | 0);
    return `rgba(${l},${l - 6},${l - 15},${0.55 + r() * 0.25})`;
  }, 0.28);
  for (let i = 0; i < Math.round(18 * k); i++) {
    const y = R() * S, h = (2 + R() * 5) * k;
    g.fillStyle = `rgba(0,0,0,${0.04 + R() * 0.08})`;
    g.fillRect(0, y, S, h);
  }
}
function drawTerrainDetail(g, S, R) {
  const k = S / 256;
  g.fillStyle = "#bcbcbc";
  g.fillRect(0, 0, S, S);
  blotches(g, S, R, 60, 16 * k, 70 * k, "235,235,235", "120,120,120", 0.05, 0.16);
  for (let i = 0; i < Math.round(5200 * k * k); i++) {
    const x = R() * S, y = R() * S, a = -1.57 + (R() - 0.5) * 1.4, l = (5 + R() * 8) * Math.max(1, k * 0.8), light = R() < 0.5, al = 0.06 + R() * 0.12;
    g.strokeStyle = light ? `rgba(255,255,255,${al})` : `rgba(0,0,0,${al})`;
    g.lineWidth = 1;
    wrapAt(S, S, x, y, l, (X, Y) => {
      g.beginPath();
      g.moveTo(X, Y);
      g.lineTo(X + Math.cos(a) * l, Y + Math.sin(a) * l);
      g.stroke();
    });
  }
  pebbles(g, S, R, Math.round(150 * k * k), 0.9 * Math.max(1, k), 2.2 * Math.max(1, k), (r) => r() < 0.5 ? "rgba(255,255,255,.3)" : "rgba(40,40,40,.35)", 0.2);
}
function drawRock(g, S, R) {
  g.fillStyle = "#b9b9b9";
  g.fillRect(0, 0, S, S);
  blotches(g, S, R, 30, 10, 40, "235,235,235", "90,90,90", 0.07, 0.2);
  for (let i = 0; i < 14; i++) {
    const y0 = R() * S, amp = 2 + R() * 5, f = 0.04 + R() * 0.08, ph = R() * 6.28;
    g.strokeStyle = `rgba(0,0,0,${0.08 + R() * 0.16})`;
    g.lineWidth = 0.8 + R() * 1.6;
    g.beginPath();
    for (let x = 0; x <= S; x += 4) {
      const y = y0 + Math.sin(x * f + ph) * amp;
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  speckle(g, S, R, 2600, 1, 20, 90, 0.28);
  speckle(g, S, R, 2600, 1, 180, 255, 0.26);
  for (let i = 0; i < 4; i++) crack(g, S, R, 10 + R() * (S - 20), 10 + R() * (S - 20), R() * 6.28, 50 + R() * 50, 1, 1);
}
export function createMaterials(preset, ext = {}, surface = "asphalt") {
  const mk = (o, r2 = 0.9, m = 0) => preset.lambert ? new THREE.MeshLambertMaterial(o) : new THREE.MeshStandardMaterial({ roughness: r2, metalness: m, ...o });
  const gravel = surface === "gravel";
  const S = preset.lambert ? 256 : 512;
  const asphaltTex = cachedTex((gravel ? "g" : "a") + S, () => tex(S, S, (g) => (gravel ? drawGravel : drawAsphalt)(g, S, rng32(gravel ? 7311 : 4177)), null, 8));
  const wearTex = cachedTex((gravel ? "wg2" : "wa2") + S, () => tex(256, S, (g, w, h) => drawWear(g, w, h, rng32(gravel ? 91 : 53), gravel), null, 8));
  const shoulderTex = cachedTex("s2" + S, () => tex(S / 2, S / 2, (g) => drawShoulder(g, S / 2, rng32(2207)), null, 4));
  const detail = cachedTex("d" + S, () => tex(S / 2, S / 2, (g) => drawTerrainDetail(g, S / 2, rng32(1301)), null, 8));
  const macroTex = cachedTex("m", () => tex(128, 128, (g, w) => {
    g.fillStyle = "#808080";
    g.fillRect(0, 0, w, w);
    blotches(g, w, rng32(555), 46, 12, 56, "255,255,255", "0,0,0", 0.14, 0.34);
  }, null, 2));
  const rockTex = cachedTex("r" + S, () => tex(128, 128, (g) => drawRock(g, 128, rng32(77)), null, 4));
  const M = {
    asphalt: mk({ color: asphaltTex ? 16053492 : gravel ? 8618883 : 3487029, map: asphaltTex, ...preset.lambert || !asphaltTex ? {} : { bumpMap: asphaltTex, bumpScale: 0.6 }, side: THREE.DoubleSide }, 0.86),
    wear: mk({ color: 0, map: wearTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, 0.92),
    shoulder: mk({ color: shoulderTex ? 15000804 : 7039851, map: shoulderTex, side: THREE.DoubleSide }, 0.98),
    line: mk({ color: 15790320, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, 0.62),
    terrain: mk({ vertexColors: true, map: detail, ...preset.lambert || !detail ? {} : { bumpMap: detail, bumpScale: 0.22 }, side: THREE.DoubleSide }, 0.98),
    rock: mk({ color: 9144192, map: rockTex, vertexColors: true, flatShading: true }, 0.96),
    tree: mk({ vertexColors: true }, 1),
    rail: mk({ color: 13224393, side: THREE.DoubleSide }, 0.32, 0.72),
    post: mk({ color: 9605778 }, 0.55, 0.45),
    wall: mk({ color: 9341570, flatShading: true }, 1),
    sign: mk({ color: 15909376 }, 0.6),
    delin: mk({ color: 16053488 }, 0.7)
  };
  if (macroTex) {
    const macro = (mat) => {
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.macroMap = { value: macroTex };
        sh.fragmentShader = sh.fragmentShader.replace("void main() {", "uniform sampler2D macroMap;\nvoid main() {").replace("#include <map_fragment>", "#include <map_fragment>\n#ifdef USE_MAP\n diffuseColor.rgb *= 0.74 + 0.5 * texture2D(macroMap, vMapUv * 0.06).r;\n#endif");
      };
      mat.customProgramCacheKey = () => "macro";
    };
    macro(M.asphalt);
  }
  if (typeof TextureLoader !== "undefined" || dom) {
    for (const k in ext) {
      const m = M[k];
      if (!m || !ext[k].map) continue;
      new THREE.TextureLoader().load(ext[k].map, (t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        m.map = t;
        m.color.set(16777215);
        m.needsUpdate = true;
      }, void 0, () => console.info("texture non trovata, uso materiale procedurale:", ext[k].map));
    }
  }
  M.dispose = () => {
    for (const k in M) {
      const m = M[k];
      if (m && m.dispose) {
        m.map && m.map.dispose();
        m.dispose();
      }
    }
  };
  return M;
}
