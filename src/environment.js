import * as THREE from 'three';
import {DEFAULTS,PRESETS,merge} from './config.js';
import {createMaterials} from './materials.js';
import {createNatural,createTerrain} from './terrain.js';
import {createRoad,buildRoadMeshes,buildFurniture} from './road.js';
import {buildVegetation} from './vegetation.js';
import {THEMES} from './themes.js';
var KEYS = [
  [0, "#02050b", "#0a1222", "#08101c", "#7f93c8", 0.06, 0.26],
  [5.5, "#243a66", "#f0b07a", "#cfa996", "#ff9a55", 0.55, 0.46],
  [8, "#3f79c9", "#cfe6f8", "#b8d0e6", "#ffe0ad", 1.05, 0.82],
  [12, "#2f72d8", "#d6ecff", "#b7d3ec", "#fff4de", 1.25, 0.92],
  [17, "#3e7ace", "#d8e8f6", "#bfd5e8", "#ffe6bf", 1.1, 0.86],
  [19.2, "#2b3f73", "#f4ad6c", "#d7a58f", "#ff8642", 0.62, 0.46],
  [21.5, "#02050b", "#0a1222", "#08101c", "#7f93c8", 0.06, 0.26],
  [24, "#02050b", "#0a1222", "#08101c", "#7f93c8", 0.06, 0.26]
];
var lerpHex = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
function palette(h) {
  let i = 0;
  while (i < KEYS.length - 2 && h > KEYS[i + 1][0]) i++;
  const A = KEYS[i], B = KEYS[i + 1], t = Math.min(1, Math.max(0, (h - A[0]) / (B[0] - A[0])));
  return { top: lerpHex(A[1], B[1], t), hor: lerpHex(A[2], B[2], t), fog: lerpHex(A[3], B[3], t), sun: lerpHex(A[4], B[4], t), sunI: A[5] + (B[5] - A[5]) * t, hemi: A[6] + (B[6] - A[6]) * t };
}
function skyMesh() {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() } },
    vertexShader: "varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: "varying vec3 v;uniform vec3 top,hor,sunCol,sunDir;void main(){vec3 d=normalize(v);float h=max(d.y,0.);float k=pow(h,.42);vec3 zen=mix(top,top*vec3(.92,.96,1.08),smoothstep(.35,1.,h));vec3 c=mix(hor,zen,k);float hband=1.-smoothstep(0.,.22,h);c=mix(c,hor*vec3(1.04,1.01,.96)+sunCol*.06,hband*.55);float s=max(dot(d,sunDir),0.);c+=sunCol*(pow(s,1400.)*2.4+pow(s,220.)*.22+pow(s,18.)*.10);float mie=pow(max(0.,dot(d,normalize(sunDir+vec3(0.,.12,0.)))),6.);c+=sunCol*mie*.06*smoothstep(-.05,.25,d.y);if(d.y<0.){float g=min(1.,-d.y*3.5);c=mix(hor,hor*vec3(.58,.62,.7),g);}gl_FragColor=vec4(c,1.);}"
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(6400, 32, 16), m);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return mesh;
}
function fitPoints(pts, th, mirror) {
  const A = pts[0], B = pts[pts.length - 1], a = Math.atan2(B.y - A.y, B.x - A.x), rot2 = -Math.PI / 2 - a, c = Math.cos(rot2), s = Math.sin(rot2), m = mirror ? -1 : 1;
  const q = pts.map((p) => {
    const dx = p.x - A.x, dy = p.y - A.y;
    return { x: (dx * c - dy * s) * m, y: dx * s + dy * c };
  });
  let x0 = 1e9, x1 = -1e9;
  for (const p of q) {
    x0 = Math.min(x0, p.x);
    x1 = Math.max(x1, p.x);
  }
  const cx = th.road && th.road.cx || 0;
  let sh = cx - (x0 + x1) / 2;
  if (th.terrain && th.terrain.sea) sh = Math.min(sh, 120 - x1);
  return { pts: q.map((p) => ({ x: p.x + sh, y: p.y })), x0: x0 + sh, x1: x1 + sh };
}
function disposeTree(o) {
  o.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
  });
}
export function createEnvironment(scene, renderer, userCfg = {}) {
  let cfg = merge(DEFAULTS, userCfg), preset = PRESETS[cfg.render.preset], hour = cfg.sun.hour, sunScale = cfg.sun.intensity, state = null, M = null, content = null, rain = false, shadowsOn = true;
  const sky = skyMesh(), sun = new THREE.DirectionalLight(16777215, 1), hemi = new THREE.HemisphereLight(14478591, 8026208, 0.8), sunTarget = new THREE.Object3D(), sunDir = new THREE.Vector3();
  scene.add(sky, sun, sun.target, hemi, sunTarget);
  scene.fog = new THREE.Fog(11454172, 80, preset.fogFar);
  const GRAY = new THREE.Color("#8a939c");
  function applyLighting() {
    const p = palette(hour), el = Math.asin(Math.sin((hour - 6) / 12 * Math.PI) * 0.92), az = 2.2;
    {
      const th = THEMES[cfg.theme] || THEMES.alpine;
      if (th.tint) {
        const c = new THREE.Color(th.tint.c);
        p.hor.lerp(c, th.tint.k);
        p.fog.lerp(c, th.tint.k);
        p.top.lerp(c, th.tint.k * 0.35);
      }
    }
    if (rain) {
      p.top.lerp(GRAY, 0.65);
      p.hor.lerp(GRAY, 0.55);
      p.fog.lerp(GRAY, 0.6);
      p.sunI *= 0.45;
      p.hemi *= 0.85;
    }
    sunDir.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).normalize();
    sky.material.uniforms.top.value.copy(p.top);
    sky.material.uniforms.hor.value.copy(p.hor);
    sky.material.uniforms.sunCol.value.copy(p.sun);
    sky.material.uniforms.sunDir.value.copy(sunDir);
    sun.color.copy(p.sun);
    const day = Math.max(0, Math.min(1, (el + 0.08) / 0.7));
    sun.intensity = el > 0 ? p.sunI * sunScale * (0.85 + 0.25 * day) : p.sunI * sunScale * 0.18;
    hemi.color.copy(p.hor).lerp(p.top, 0.35);
    hemi.groundColor.copy(scene.fog.color || p.fog).multiplyScalar(0.55);
    hemi.intensity = p.hemi * (0.75 + 0.25 * day) * (rain ? 0.9 : 1);
    scene.fog.color.copy(p.fog);
    {
      const ff = preset.fogFar * ((THEMES[cfg.theme] || THEMES.alpine).fogK || 1);
      scene.fog.far = rain ? Math.min(ff, 1400) : ff * (0.92 + 0.18 * day);
    }
    scene.fog.near = rain ? 25 : 55;
    scene.background = p.top.clone().lerp(p.hor, 0.35);
    renderer.shadowMap.enabled = preset.shadows && shadowsOn;
    sun.castShadow = preset.shadows && shadowsOn && el > 0.05;
    if (sun.castShadow) {
      sun.shadow.mapSize.set(preset.shadowMap, preset.shadowMap);
      const c = sun.shadow.camera;
      c.left = c.bottom = -120;
      c.right = c.top = 120;
      c.near = 10;
      c.far = 1200;
      sun.shadow.bias = -4e-4;
      sun.shadow.normalBias = 0.35;
    }
  }
  function clear() {
    if (content) {
      scene.remove(content);
      disposeTree(content);
      content = null;
    }
    if (M) {
      M.dispose();
      M = null;
    }
  }
  function build() {
    clear();
    const t0 = performance.now(), th = THEMES[cfg.theme] || THEMES.alpine, E = { ...cfg, themeDef: th, road: { ...th.road || {}, ...cfg.road } }, natural = (() => {
      if (E.road.points) {
        const f = fitPoints(E.road.points, th, cfg.seed % 2 === 0);
        E.road = { ...E.road, points: f.pts };
        const ext = Math.max(Math.abs(f.x0), Math.abs(f.x1));
        E.themeDef = { ...th, terrain: { ...th.terrain, wallX: Math.max((th.terrain && th.terrain.wallX) ?? 330, ext + 90) } };
      }
      return createNatural(E);
    })(), road = createRoad(E, natural), terrain = createTerrain(E, natural, road, preset);
    M = createMaterials(preset, cfg.textures || {}, cfg.road.surface);
    M.rock.color.set(th.rock);
    const g = new THREE.Group();
    g.add(terrain.build(M), buildRoadMeshes(road, M));
    if (terrain.seaY != null) {
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(9e3, 9e3), preset.lambert ? new THREE.MeshLambertMaterial({ color: 2980512 }) : new THREE.MeshStandardMaterial({ color: 2980512, roughness: 0.22, metalness: 0.15, transparent: true, opacity: 0.93 }));
      sm.rotation.x = -Math.PI / 2;
      sm.position.set(0, terrain.seaY, -800);
      g.add(sm);
    }
    const furn = buildFurniture(road, terrain.heightAt, M, E), veg = buildVegetation(E, preset, terrain, road, M);
    g.add(furn.group, veg.group);
    scene.add(g);
    content = g;
    state = { natural, road, terrain, furn, veg, buildMs: performance.now() - t0 };
    renderer.setPixelRatio(Math.min(preset.pixelRatio, window.devicePixelRatio || 1));
    applyLighting();
  }
  build();
  const lane = () => state.road.hw * 0.5;
  const api = {
    get config() {
      return cfg;
    },
    get preset() {
      return cfg.render.preset;
    },
    get stats() {
      return { buildMs: state.buildMs, hairpins: state.road.hairpins.length, length: state.road.length, attempts: state.road.attempts, ...state.veg.counts };
    },
    get roadWidth() {
      return state.road.width;
    },
    get roadLength() {
      return state.road.length;
    },
    get far() {
      return preset.far;
    },
    get road() {
      return state.road;
    },
    get guardrails() {
      return state.furn.guardrails;
    },
    get landmarks() {
      return state.furn.landmarks;
    },
    regenerate(patch = {}) {
      cfg = merge(cfg, patch);
      preset = PRESETS[cfg.render.preset];
      build();
      return api;
    },
    setPreset(name) {
      return api.regenerate({ render: { preset: name } });
    },
    setTimeOfDay(h) {
      hour = (h % 24 + 24) % 24;
      applyLighting();
    },
    get timeOfDay() {
      return hour;
    },
    setSunIntensity(v) {
      sunScale = v;
      applyLighting();
    },
    getRoadPoint(s) {
      return state.road.pointAt(s);
    },
    getTerrainHeight(x, z) {
      return state.terrain.fast(x, z);
    },
    getTerrainHeightExact(x, z) {
      return state.terrain.heightAt(x, z);
    },
    get colliders() {
      return state.veg.colliders;
    },
    get guardFlags() {
      return state.furn.flags;
    },
    get sun() {
      return sun;
    },
    get hemi() {
      return hemi;
    },
    setRain(v) {
      rain = !!v;
      applyLighting();
    },
    setShadows(v) {
      shadowsOn = !!v;
      applyLighting();
    },
    getRoadHeight(x, z) {
      const q = state.road.nearest(x, z, 40);
      return q ? state.road.Y[q.i] : null;
    },
    isOnRoad(x, z, margin = 0) {
      return state.road.info(x, z, margin);
    },
    getStart() {
      const p = state.road.pointAt(12);
      return { position: p.position.clone().addScaledVector(p.normal, lane()).setY(p.position.y + 0.3), tangent: p.tangent.clone(), yaw: Math.atan2(p.tangent.x, p.tangent.z), s: 12 };
    },
    getResetPoint(x, z) {
      const q = state.road.nearest(x, z, 400) || { s: 12 }, p = state.road.pointAt(q.s);
      return { position: p.position.clone().addScaledVector(p.normal, lane()).setY(p.position.y + 0.3), tangent: p.tangent.clone(), yaw: Math.atan2(p.tangent.x, p.tangent.z), s: q.s };
    },
    getCameraAnchor(s, { mode = "chase", lateral = lane() } = {}) {
      const p = state.road.pointAt(s), c = p.position.clone().addScaledVector(p.normal, lateral);
      if (mode === "cockpit") return { position: c.clone().add(new THREE.Vector3(0, 1.15, 0)).addScaledVector(p.tangent, 0.3), lookAt: c.clone().addScaledVector(p.tangent, 30).add(new THREE.Vector3(0, 1, 0)) };
      return { position: c.clone().addScaledVector(p.tangent, -7.5).add(new THREE.Vector3(0, 2.6, 0)), lookAt: c.clone().addScaledVector(p.tangent, 8).add(new THREE.Vector3(0, 1.1, 0)) };
    },
    // Da chiamare ogni frame: il sole (ombre) segue la zona osservata e il cielo segue la camera.
    update(camera, focus) {
      sky.position.copy(camera.position);
      const f = focus || camera.position;
      sun.target.position.copy(f);
      sun.position.copy(f).addScaledVector(sunDir, 500);
    },
    dispose() {
      clear();
      scene.remove(sky, sun, sun.target, hemi, sunTarget);
      sky.geometry.dispose();
      sky.material.dispose();
      sun.dispose && sun.dispose();
    }
  };
  return api;
}
