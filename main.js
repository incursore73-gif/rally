import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createEnvironment} from './environment.js';
import {PRESETS} from './config.js';
const hud=document.getElementById('hud'),ui=document.getElementById('ui');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(62,1,.3,7000);
let env;try{env=createEnvironment(scene,renderer,{render:{preset:new URLSearchParams(location.search).get('preset')==='perf'?'PERFORMANCE':'HIGH'}})}catch(e){hud.textContent='Errore: '+e.message;throw e}
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.495;controls.enabled=false;
const S={mode:'tour',s:12,speed:14,fps:60,auto:true,low:0};
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.far=env.far;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();
function jump(s){S.s=((s%env.roadLength)+env.roadLength)%env.roadLength;const a=env.getCameraAnchor(S.s,{mode:'chase'});camera.position.copy(a.position);camera.lookAt(a.lookAt)}
jump(12);
// Interfaccia
const btn=(t,f)=>{const b=document.createElement('button');b.textContent=t;b.onclick=()=>f(b);ui.appendChild(b);return b};
const bm={};for(const[k,t]of[['tour','Tour'],['cockpit','Abitacolo'],['free','Libera']])bm[k]=btn(t,()=>setMode(k));
function setMode(m){S.mode=m;controls.enabled=m==='free';for(const k in bm)bm[k].classList.toggle('on',k===m);if(m==='free'){const p=env.getRoadPoint(S.s).position;controls.target.copy(p);camera.position.copy(p).add(new THREE.Vector3(40,28,40));controls.update()}}
setMode('tour');
const pb=btn(env.preset==='HIGH'?'HIGH':'PERF',b=>{S.auto=false;const n=env.preset==='HIGH'?'PERFORMANCE':'HIGH';env.setPreset(n);b.textContent=n==='HIGH'?'HIGH':'PERF';resize();jump(S.s)});
btn('Nuovo seed',()=>{env.regenerate({seed:Math.floor(Math.random()*9999)});jump(12)});
const lab=(t,min,max,val,f)=>{const l=document.createElement('label');l.textContent=t;const r=document.createElement('input');r.type='range';r.min=min;r.max=max;r.step='any';r.value=val;r.oninput=()=>f(+r.value);l.appendChild(r);ui.appendChild(l);return r};
const sl=lab('Posizione',0,env.roadLength,12,v=>{jump(v);if(S.mode==='free'){const p=env.getRoadPoint(S.s).position;controls.target.copy(p);camera.position.copy(p).add(new THREE.Vector3(40,28,40))}});
lab('Ora',0,24,env.timeOfDay,v=>env.setTimeOfDay(v));
lab('Velocità',2,40,14,v=>S.speed=v);
// Ciclo
const clock=new THREE.Clock();let acc=0,frames=0,fpsT=0;
renderer.setAnimationLoop(()=>{const dt=Math.min(.05,clock.getDelta());
  if(S.mode!=='free'){S.s=(S.s+S.speed*dt)%env.roadLength;const a=env.getCameraAnchor(S.s,{mode:S.mode==='cockpit'?'cockpit':'chase'}),k=1-Math.exp(-(S.mode==='cockpit'?18:5)*dt);camera.position.lerp(a.position,k);
    const p=env.getTerrainHeight(camera.position.x,camera.position.z);if(camera.position.y<p+1.2)camera.position.y=p+1.2;camera.lookAt(a.lookAt);sl.value=S.s;env.update(camera,a.lookAt)}
  else{controls.update();const t=controls.target;env.update(camera,t)}
  renderer.render(scene,camera);
  // FPS reali misurati sul dispositivo (non stimati) + degradazione automatica se < 40 per ~3 s.
  frames++;fpsT+=dt;if(fpsT>=1){S.fps=frames/fpsT;frames=0;fpsT=0;S.low=S.fps<40?S.low+1:0;
    if(S.auto&&S.low>=3&&env.preset==='HIGH'){env.setPreset('PERFORMANCE');pb.textContent='PERF';resize();S.low=0}
    const i=renderer.info,r=env.isOnRoad(camera.position.x,camera.position.z);
    hud.textContent=`FPS ${S.fps.toFixed(0)}  ·  ${env.preset}\ntriangoli ${(i.render.triangles/1000).toFixed(0)}k  draw call ${i.render.calls}\ntornanti ${env.stats.hairpins}  strada ${env.roadLength.toFixed(0)} m\nquota strada ${env.getRoadPoint(S.s).position.y.toFixed(0)} m  ·  s ${S.s.toFixed(0)} m`}});
window.env=env;window.alpine={env,S,camera,renderer};
