import * as THREE from 'three';
import {DEFAULTS,PRESETS,merge} from './config.js';
import {createMaterials} from './materials.js';
import {createNatural,createTerrain} from './terrain.js';
import {createRoad,buildRoadMeshes,buildFurniture} from './road.js';
import {buildVegetation} from './vegetation.js';
// Fasce orarie: [ora, cielo alto, orizzonte, nebbia, sole, intensità sole, intensità emisferica]
const KEYS=[[0,'#03060d','#10182a','#0c1220','#8899cc',.08,.3],[5.5,'#3c4f7c','#e9a46e','#c9a58c','#ff9a55',.6,.5],[8,'#5b8fd6','#c4dcf0','#b6cde0','#ffe2b8',1.1,.85],
  [12,'#3f7fd8','#bcd8f2','#a9c4de','#fff6e6',1.3,.95],[17,'#4f86d0','#cfe0ee','#bccfdf','#ffe9c9',1.15,.9],[19.2,'#3a4a78','#f0a05e','#d19a82','#ff8a45',.7,.5],[21.5,'#03060d','#10182a','#0c1220','#8899cc',.08,.3],[24,'#03060d','#10182a','#0c1220','#8899cc',.08,.3]];
const lerpHex=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),t);
function palette(h){let i=0;while(i<KEYS.length-2&&h>KEYS[i+1][0])i++;const A=KEYS[i],B=KEYS[i+1],t=Math.min(1,Math.max(0,(h-A[0])/(B[0]-A[0])));
  return{top:lerpHex(A[1],B[1],t),hor:lerpHex(A[2],B[2],t),fog:lerpHex(A[3],B[3],t),sun:lerpHex(A[4],B[4],t),sunI:A[5]+(B[5]-A[5])*t,hemi:A[6]+(B[6]-A[6])*t}}
function skyMesh(){const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color()},hor:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3(0,1,0)},sunCol:{value:new THREE.Color()}},
  vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 v;uniform vec3 top,hor,sunCol,sunDir;void main(){vec3 d=normalize(v);float h=max(d.y,0.);vec3 c=mix(hor,top,pow(h,.5));float s=max(dot(d,sunDir),0.);c+=sunCol*(pow(s,900.)*3.+pow(s,12.)*.18);if(d.y<0.)c=mix(hor,hor*.6,min(1.,-d.y*4.));gl_FragColor=vec4(c,1.);}'});
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(6400,24,14),m);mesh.frustumCulled=false;mesh.renderOrder=-10;return mesh}
function disposeTree(o){o.traverse(c=>{if(c.geometry)c.geometry.dispose()})}
export function createEnvironment(scene,renderer,userCfg={}){
  let cfg=merge(DEFAULTS,userCfg),preset=PRESETS[cfg.render.preset],hour=cfg.sun.hour,sunScale=cfg.sun.intensity,state=null,M=null,content=null,rain=false,shadowsOn=true;
  const sky=skyMesh(),sun=new THREE.DirectionalLight(0xffffff,1),hemi=new THREE.HemisphereLight(0xdcecff,0x7a7860,.8),sunTarget=new THREE.Object3D(),sunDir=new THREE.Vector3();
  scene.add(sky,sun,sun.target,hemi,sunTarget);scene.fog=new THREE.Fog(0xaec6dc,80,preset.fogFar);
  const GRAY=new THREE.Color('#8a939c');
  function applyLighting(){const p=palette(hour),el=Math.asin(Math.sin((hour-6)/12*Math.PI)*.92),az=2.2;
    if(rain){p.top.lerp(GRAY,.65);p.hor.lerp(GRAY,.55);p.fog.lerp(GRAY,.6);p.sunI*=.45;p.hemi*=.85}
    sunDir.set(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az)).normalize();
    sky.material.uniforms.top.value.copy(p.top);sky.material.uniforms.hor.value.copy(p.hor);sky.material.uniforms.sunCol.value.copy(p.sun);sky.material.uniforms.sunDir.value.copy(sunDir);
    sun.color.copy(p.sun);sun.intensity=el>0?p.sunI*sunScale:p.sunI*sunScale*.2;hemi.intensity=p.hemi;scene.fog.color.copy(p.fog);scene.fog.far=rain?Math.min(preset.fogFar,1500):preset.fogFar;scene.fog.near=rain?30:80;scene.background=p.hor.clone();
    renderer.shadowMap.enabled=preset.shadows&&shadowsOn;sun.castShadow=preset.shadows&&shadowsOn&&el>.05;if(sun.castShadow){sun.shadow.mapSize.set(preset.shadowMap,preset.shadowMap);const c=sun.shadow.camera;c.left=c.bottom=-110;c.right=c.top=110;c.near=10;c.far=1100;sun.shadow.bias=-.0006;sun.shadow.normalBias=.4}}
  function clear(){if(content){scene.remove(content);disposeTree(content);content=null}if(M){M.dispose();M=null}}
  function build(){clear();const t0=performance.now(),natural=createNatural(cfg),road=createRoad(cfg,natural),terrain=createTerrain(cfg,natural,road,preset);M=createMaterials(preset,cfg.textures||{},cfg.road.surface);
    const g=new THREE.Group();g.add(terrain.build(M),buildRoadMeshes(road,M));const furn=buildFurniture(road,terrain.heightAt,M,cfg),veg=buildVegetation(cfg,preset,terrain,road,M);g.add(furn.group,veg.group);
    scene.add(g);content=g;state={natural,road,terrain,furn,veg,buildMs:performance.now()-t0};renderer.setPixelRatio(Math.min(preset.pixelRatio,window.devicePixelRatio||1));applyLighting()}
  build();
  const lane=()=>state.road.hw*.5;
  const api={
    get config(){return cfg},get preset(){return cfg.render.preset},get stats(){return{buildMs:state.buildMs,hairpins:state.road.hairpins.length,length:state.road.length,attempts:state.road.attempts,...state.veg.counts}},
    get roadWidth(){return state.road.width},get roadLength(){return state.road.length},get far(){return preset.far},get road(){return state.road},
    get guardrails(){return state.furn.guardrails},get landmarks(){return state.furn.landmarks},
    regenerate(patch={}){cfg=merge(cfg,patch);preset=PRESETS[cfg.render.preset];build();return api},
    setPreset(name){return api.regenerate({render:{preset:name}})},
    setTimeOfDay(h){hour=((h%24)+24)%24;applyLighting()},get timeOfDay(){return hour},setSunIntensity(v){sunScale=v;applyLighting()},
    getRoadPoint(s){return state.road.pointAt(s)},
    getTerrainHeight(x,z){return state.terrain.fast(x,z)},getTerrainHeightExact(x,z){return state.terrain.heightAt(x,z)},
    get colliders(){return state.veg.colliders},get guardFlags(){return state.furn.flags},get sun(){return sun},get hemi(){return hemi},
    setRain(v){rain=!!v;applyLighting()},setShadows(v){shadowsOn=!!v;applyLighting()},
    getRoadHeight(x,z){const q=state.road.nearest(x,z,40);return q?state.road.Y[q.i]:null},
    isOnRoad(x,z,margin=0){return state.road.info(x,z,margin)},
    getStart(){const p=state.road.pointAt(12);return{position:p.position.clone().addScaledVector(p.normal,lane()).setY(p.position.y+.3),tangent:p.tangent.clone(),yaw:Math.atan2(p.tangent.x,p.tangent.z),s:12}},
    getResetPoint(x,z){const q=state.road.nearest(x,z,400)||{s:12},p=state.road.pointAt(q.s);return{position:p.position.clone().addScaledVector(p.normal,lane()).setY(p.position.y+.3),tangent:p.tangent.clone(),yaw:Math.atan2(p.tangent.x,p.tangent.z),s:q.s}},
    getCameraAnchor(s,{mode='chase',lateral=lane()}={}){const p=state.road.pointAt(s),c=p.position.clone().addScaledVector(p.normal,lateral);
      if(mode==='cockpit')return{position:c.clone().add(new THREE.Vector3(0,1.15,0)).addScaledVector(p.tangent,.3),lookAt:c.clone().addScaledVector(p.tangent,30).add(new THREE.Vector3(0,1,0))};
      return{position:c.clone().addScaledVector(p.tangent,-7.5).add(new THREE.Vector3(0,2.6,0)),lookAt:c.clone().addScaledVector(p.tangent,8).add(new THREE.Vector3(0,1.1,0))}},
    // Da chiamare ogni frame: il sole (ombre) segue la zona osservata e il cielo segue la camera.
    update(camera,focus){sky.position.copy(camera.position);const f=focus||camera.position;sun.target.position.copy(f);sun.position.copy(f).addScaledVector(sunDir,500)},
    dispose(){clear();scene.remove(sky,sun,sun.target,hemi,sunTarget);sky.geometry.dispose();sky.material.dispose();sun.dispose&&sun.dispose()}
  };
  return api;
}
