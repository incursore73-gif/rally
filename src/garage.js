// Garage: showroom 3D interattivo dell'auto (stesso stile del viewer esterno,
// ma su API three 0.160 — la stessa usata dal gioco). Touch: 1 dito ruota, 2 dita zoom/pan.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const DEC_PATH = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/';

// Texture radiale: fa sfumare il pavimento ai bordi (niente linea d'orizzonte)
function radialTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#ffffff');
  g.addColorStop(1, '#000000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function initGarage({ button, overlay, canvas, close, hint, title, url }) {
  const btn = document.querySelector(button);
  const ov = document.querySelector(overlay);
  const cv = document.querySelector(canvas);
  const cls = document.querySelector(close);
  const tip = document.querySelector(hint);
  const ttl = document.querySelector(title);
  if (!btn || !ov || !cv || !cls) return;

  let renderer = null, controls = null, mixer = null, clock = null, raf = 0, open = false;
  let modelReady = null; // promise del modello (una sola volta)

  const garage = { scene: null, camera: null, dir: null, model: null };

  const HINT_DEFAULT = tip ? tip.textContent : '';

  function setup() {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    garage.scene = new THREE.Scene();
    garage.scene.background = new THREE.Color(0x000000);

    garage.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    garage.camera.position.set(0, 2, 6);

    // Luci: hemi + dir basse (riempimento), spot principale creato al caricamento
    garage.scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x1a1c26, 0.3));
    garage.dir = new THREE.DirectionalLight(0xffffff, 0.25);
    garage.dir.position.set(4, -4, 6);
    garage.scene.add(garage.dir);

    controls = new OrbitControls(garage.camera, cv);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
      if (tip) tip.classList.add('h');
    });

    clock = new THREE.Clock();
  }

  function loadModel() {
    if (modelReady) return modelReady;
    modelReady = new Promise((resolve) => {
      try {
        const L = new GLTFLoader();
        const d = new DRACOLoader();
        d.setDecoderPath(DEC_PATH);
        L.setDRACOLoader(d);
        L.setMeshoptDecoder(MeshoptDecoder);
        L.load(url, (g) => resolve({ ok: true, gltf: g }),
          (e) => {
            if (e && e.lengthComputable && e.total > 0 && tip) {
              const p = Math.min(99, Math.round(e.loaded / e.total * 100));
              tip.textContent = 'Caricamento auto\u2026 ' + p + '%';
            }
          },
          (err) => resolve({ ok: false, why: (err && err.message) || 'rete/CORS' }));
      } catch (e) { resolve({ ok: false, why: e.message }); }
    });
    return modelReady;
  }

  function resize() {
    if (!renderer) return;
    const w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    garage.camera.aspect = w / h;
    garage.camera.updateProjectionMatrix();
  }
  addEventListener('resize', () => { if (open) resize(); });

  function loop() {
    raf = requestAnimationFrame(loop);
    if (controls) controls.update();
    if (mixer) mixer.update(clock.getDelta());
    if (renderer && garage.scene) renderer.render(garage.scene, garage.camera);
  }

  function placeModel(gltf) {
    const model = gltf.scene;
    model.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    // Centro sull'origine, appoggiato sul pavimento (funziona con qualsiasi scala)
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;
    garage.scene.add(model);
    garage.model = model;

    const maxDim = Math.max(size.x, size.y, size.z);

    // Pavimento showroom che sfuma ai bordi
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(maxDim * 7, 64),
      new THREE.MeshStandardMaterial({
        color: 0x1c222d, roughness: 0.9, metalness: 0,
        transparent: true, alphaMap: radialTexture()
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    garage.scene.add(floor);

    // Spot dall'alto: cerchio di luce + ombra (decay 0 = comportamento classico)
    const spot = new THREE.SpotLight(0xffffff, 2.6);
    spot.decay = 0;
    spot.position.set(maxDim * 1.2, maxDim * 3.5, maxDim * 0.8);
    spot.target.position.set(0, size.y * 0.4, 0);
    spot.angle = 0.45;
    spot.penumbra = 0.8;
    spot.castShadow = true;
    spot.shadow.mapSize.set(2048, 2048);
    spot.shadow.camera.near = maxDim * 0.5;
    spot.shadow.camera.far = maxDim * 8;
    spot.shadow.bias = -0.0005;
    garage.scene.add(spot);
    garage.scene.add(spot.target);

    // Camera proporzionata alle dimensioni reali
    garage.camera.position.set(0, size.y * 0.9, maxDim * 1.5);
    garage.camera.near = Math.max(0.001, maxDim * 0.01);
    garage.camera.far = maxDim * 100;
    garage.camera.updateProjectionMatrix();
    controls.target.set(0, size.y * 0.5, 0);
    controls.update();

    garage.dir.position.set(maxDim * 2, maxDim * 2, maxDim * 2.5);

    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      mixer.clipAction(gltf.animations[0]).play();
    }
  }

  async function show() {
    open = true;
    ov.classList.remove('hide');
    if (tip) { tip.classList.remove('h'); tip.textContent = 'Caricamento auto\u2026'; }
    if (!renderer) setup();
    resize();
    if (!raf) loop();
    const r = await loadModel();
    if (!open) return; // chiuso mentre caricava
    if (r.ok) {
      if (!garage.model) placeModel(r.gltf);
      if (tip) tip.textContent = HINT_DEFAULT;
    } else {
      if (tip) tip.textContent = 'Auto 3D non disponibile: ' + r.why;
      if (ttl) ttl.classList.add('h');
    }
  }

  function hide() {
    open = false;
    ov.classList.add('hide');
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  btn.addEventListener('click', show);
  // pointerdown oltre a click: sui dispositivi touch un preventDefault su touchstart
  // (vedi skipEv in game.js) puo' impedire la generazione del click
  cls.addEventListener('pointerdown', hide);
  cls.addEventListener('click', hide);
  addEventListener('keydown', (e) => { if (open && e.key === 'Escape') hide(); });
}
