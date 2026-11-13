import * as THREE from '../node_modules/three/build/three.module.js';
const CP=[[-90,-70],[-30,-85],[40,-80],[95,-60],[112,-15],[88,32],[35,42],
          [-8,62],[-52,78],[-96,62],[-118,18],[-122,-32]];
const curve=new THREE.CatmullRomCurve3(CP.map(p=>new THREE.Vector3(p[0],0,p[1])),true,'catmullrom',0.6);
const N=500, len=curve.getLength(), ds=len/N;
const pts=[],hl=[];
for(let i=0;i<N;i++){const p=curve.getPointAt(i/N),t=curve.getTangentAt(i/N);
  pts.push([p.x,p.z]);hl.push(Math.atan2(t.x,t.z));}
const wrapA=a=>{a=(a+Math.PI)%(Math.PI*2);if(a<0)a+=Math.PI*2;return a-Math.PI;};
// raggio minimo di curva
let minR=1e9;
for(let i=0;i<N;i++){const c=Math.abs(wrapA(hl[(i+1)%N]-hl[i]))/ds;if(c>1e-6)minR=Math.min(minR,1/c);}
// auto-intersezioni: distanza minima tra campioni non adiacenti
let minD=1e9;
for(let i=0;i<N;i+=2)for(let j=i+40;j<N;j+=2){
  const gap=Math.min(j-i,N-(j-i));
  if(gap<40)continue; // salta anche l'adiacenza alla chiusura dell'anello
  const dx=pts[i][0]-pts[j][0],dz=pts[i][1]-pts[j][1];
  const d=Math.hypot(dx,dz); if(d<minD)minD=d;
}
console.log('lunghezza circuito:',len.toFixed(1),'m');
console.log('raggio curva minimo:',minR.toFixed(1),'m');
console.log('distanza minima tra tratti lontani:',minD.toFixed(1),'m');
console.log(minD>20?'OK: nessuna sovrapposizione (larghezza pista 17,2 m)':'PROBLEMA: pista che si sovrappone!');
