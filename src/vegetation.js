import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeNoise,mulberry32} from './noise.js';
const paint=(g,c)=>{const n=g.attributes.position.count,a=new Float32Array(n*3),k=new THREE.Color(c);for(let i=0;i<n;i++){a[i*3]=k.r;a[i*3+1]=k.g;a[i*3+2]=k.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g};
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
function treeGeo(){const t=paint(new THREE.CylinderGeometry(.15,.28,1.8,5).translate(0,.9,0),'#4a3626'),
  c=[[1.7,3.4,3.1,'#264a2c'],[1.3,3,5,'#2c5632'],[.85,2.4,6.7,'#336338']].map(([r,h,y,col])=>paint(new THREE.ConeGeometry(r,h,7).translate(0,y,0),col));
  for(const g of[t,...c])g.deleteAttribute('uv');return mergeGeometries([t,...c].map(g=>g.index?g.toNonIndexed():g))}
const treeFar=()=>{const g=paint(new THREE.ConeGeometry(1.5,7,5).translate(0,4.2,0),'#2c5632');g.deleteAttribute('uv');return g.toNonIndexed()};
function rockGeo(rnd){const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position,map=new Map();for(let i=0;i<p.count;i++){const k=p.getX(i).toFixed(3)+p.getY(i).toFixed(3)+p.getZ(i).toFixed(3);if(!map.has(k))map.set(k,.72+rnd()*.5);const f=map.get(k);p.setXYZ(i,p.getX(i)*f,p.getY(i)*f*.8,p.getZ(i)*f)}g.computeVertexNormals();return g}
export function buildVegetation(cfg,preset,terrain,road,M){
  const rnd=mulberry32(cfg.seed*31+7),nz=makeNoise(cfg.seed+99),g=new THREE.Group(),F=terrain.fineRect,hAt=terrain.heightAt,d=new THREE.Object3D(),col=new THREE.Color(),minD=cfg.veg.minRoadDist,treeLine=road.maxY+70,cols=[];
  function place(count,region,geo,far){
    const m=new THREE.InstancedMesh(geo,M.tree,count);let n=0;
    for(let a=0;a<count*14&&n<count;a++){
      const x=region.x0+rnd()*(region.x1-region.x0),z=region.z0+rnd()*(region.z1-region.z0);
      if(!far&&!(x>F.x0&&x<F.x1&&z>F.z0&&z<F.z1))continue;if(far&&x>F.x0-60&&x<F.x1+60&&z>F.z0-60&&z<F.z1+60)continue;
      const y=far?terrain.natural(x,z)-.8:hAt(x,z),dens=ss(-.25,.15,nz.fbm(x*.008,z*.008,3));
      if(rnd()>dens*(1-ss(treeLine-70,treeLine,y)))continue;
      if(!far){const q=road.nearest(x,z,minD+8);if(q){if(q.d<minD)continue;if(q.d<16&&road.Y[q.i]-y>3)continue}if(terrain.slopeAt(x,z)>.7)continue}
      else if(Math.hypot(terrain.natural(x+4,z)-terrain.natural(x-4,z),terrain.natural(x,z+4)-terrain.natural(x,z-4))/8>.9)continue;
      const s=.8+rnd()*.9;if(!far){const q2=road.nearest(x,z,24);if(q2)cols.push({x,z,r:.45+.3*s,rock:false})}d.position.set(x,y,z);d.rotation.set(0,rnd()*6.28,0);d.scale.set(s*(.85+rnd()*.3),s*(far?1.3:1)*(.9+rnd()*.5),s*(.85+rnd()*.3));d.updateMatrix();m.setMatrixAt(n,d.matrix);
      m.setColorAt(n,col.setHSL(.27+rnd()*.06,.35+rnd()*.15,.7+rnd()*.45));n++}
    m.count=n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.castShadow=!far&&preset.shadows;m.frustumCulled=true;g.add(m);return n}
  const nNear=place(preset.trees.near,F,treeGeo(),false),nFar=place(preset.trees.far,{x0:-1800,x1:1800,z0:-2400,z1:700},treeFar(),true);
  // Rocce: detriti ai margini della strada, massi e affioramenti sui pendii ripidi.
  const rg=rockGeo(rnd),rm=new THREE.InstancedMesh(rg,M.rock,preset.rocks);let nr=0;
  for(let a=0;a<preset.rocks*30&&nr<preset.rocks;a++){
    const near=rnd()<.55;let x,z;if(near){const i=Math.floor(rnd()*road.N),side=rnd()<.5?-1:1,o=road.hw+road.shoulder+2+rnd()*10;x=road.X[i]+road.NX[i]*side*o;z=road.Z[i]+road.NZ[i]*side*o}else{x=F.x0+rnd()*(F.x1-F.x0);z=F.z0+rnd()*(F.z1-F.z0)}
    const y=hAt(x,z),sl=terrain.slopeAt(x,z),q=road.nearest(x,z,14);if(q&&q.d<road.hw+road.shoulder+1.5)continue;if(!near&&sl<.75)continue;
    const s=near?.25+rnd()*.7:1.2+rnd()*3.5;d.position.set(x,y+s*.15,z);d.rotation.set(rnd()*.6,rnd()*6.28,rnd()*.6);d.scale.set(s*(1+rnd()*.5),s*(.6+rnd()*.5),s*(1+rnd()*.5));d.updateMatrix();if(near&&s>.45||!near)cols.push({x,z,r:s*.85,rock:true});rm.setMatrixAt(nr,d.matrix);rm.setColorAt(nr,col.setHSL(.09,.06,.34+rnd()*.25));nr++}
  rm.count=nr;rm.castShadow=preset.shadows;g.add(rm);
  return{group:g,colliders:cols.filter(c=>{const q=road.nearest(c.x,c.z,24);return q&&q.d<24}),counts:{treesNear:nNear,treesFar:nFar,rocks:nr}};
}
