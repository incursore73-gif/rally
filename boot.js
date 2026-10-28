// Avvio: Three.js + ambiente alpino + gioco (game.js) + auto 3D da URL (GLB) con ripiego sul modello procedurale.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {createEnvironment} from './environment.js';

const QG=new URLSearchParams(location.search).get('glb');   // prova: ?glb=URL_SBAGLIATO simula il ripiego, ?glb=off lo forza
const CAR_URL=(QG&&QG!=='off'?QG:null)||window.CAR_GLB_URL||'https://rally-by-tiziano.netlify.app/auto.glb',TIMEOUT=10000;
window.THREE=THREE;window.ALPINE={createEnvironment};
const ld=document.getElementById('ld'),txt=document.getElementById('ldt'),bar=document.getElementById('ldb');
const prog=(p,t)=>{if(bar)bar.style.width=p+'%';if(txt)txt.textContent=t};
function toast(t){const d=document.createElement('div');d.textContent=t;d.style.cssText='position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);z-index:30;background:rgba(10,14,20,.85);color:#fff;font:600 13px system-ui,sans-serif;padding:8px 14px;border-radius:10px;max-width:86vw;text-align:center';document.body.appendChild(d);setTimeout(()=>d.remove(),7000)}

// Scarica il GLB con percentuale; qualsiasi errore (rete, CORS, formato) o timeout oltre ~10 s => {ok:false}
function loadGLB(){if(QG==='off')return Promise.resolve({ok:false,why:'disattivata da ?glb=off'});return new Promise(res=>{let done=false;const fin=r=>{if(done)return;done=true;clearTimeout(to);res(r)},to=setTimeout(()=>fin({ok:false,why:'timeout oltre '+TIMEOUT/1000+' s'}),TIMEOUT);
  try{const L=new GLTFLoader(),d=new DRACOLoader();d.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');L.setDRACOLoader(d);L.setMeshoptDecoder(MeshoptDecoder);
    L.load(CAR_URL,g=>fin({ok:true,scene:g.scene}),
      e=>{if(e&&e.lengthComputable&&e.total>0){const p=Math.min(99,Math.round(e.loaded/e.total*100));prog(p,'Caricamento auto 3D… '+p+'%')}else if(e)prog(50,'Caricamento auto 3D… '+(e.loaded/1048576).toFixed(1)+' MB')},
      err=>fin({ok:false,why:(err&&err.message)||'rete/CORS'}))}
  catch(e){fin({ok:false,why:e.message})}})}

prog(2,'Caricamento auto 3D… 0%');
const glb=loadGLB();
// Il gioco parte in parallelo: o da codice incorporato (build a file singolo) oppure da game.js
const game=new Promise(res=>{const s=document.createElement('script');
  if(window.__GAME_SRC__){s.textContent=window.__GAME_SRC__;document.body.appendChild(s);res()}
  else{s.src='game.js?v=8';s.onload=()=>res();s.onerror=()=>res();document.body.appendChild(s)}});
const [r]=await Promise.all([glb,game]);
if(r.ok){prog(100,'Auto 3D pronta');const ok=typeof window.applyCarModel==='function'&&window.applyCarModel(r.scene);if(!ok)toast('Auto 3D non utilizzabile (struttura inattesa): uso il modello integrato.')}
else{console.warn('GLB non caricato:',r.why);toast('Auto 3D non disponibile ('+r.why+'): uso il modello integrato.')}
if(ld)ld.remove();
