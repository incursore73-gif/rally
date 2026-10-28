// Test headless del gioco completo (senza WebGL): carica game.js con Three r160 + ambiente alpino e fa giocare un autopilota.
import fs from 'node:fs';import * as THREE from 'three';import {createEnvironment} from '../src/environment.js';
const U=()=>new Proxy(function(){},{get:(t,k)=>{if(k===Symbol.toPrimitive)return()=>0;if(k==='length')return 0;return U()},apply:()=>U(),set:()=>true,construct:()=>U()});
const stubEl=()=>({querySelector:()=>stubEl(),style:{},classList:{add(){},remove(){},toggle(){}},children:[{firstChild:{style:{}},lastChild:{textContent:''},className:''},{firstChild:{style:{}},lastChild:{textContent:''},className:''},{firstChild:{style:{}},lastChild:{textContent:''},className:''}],textContent:'',innerHTML:'',onclick:null,volume:0,getContext:()=>U(),getBoundingClientRect:()=>({left:0,right:10,top:0,bottom:10,width:10,height:10}),appendChild(){},insertBefore(){},pause(){},play(){return Promise.resolve()},width:320,height:320});
const els={};const T3={...THREE};Object.assign(globalThis,{THREE:T3,ALPINE:{createEnvironment},window:globalThis,innerWidth:900,innerHeight:450,devicePixelRatio:1,addEventListener(){},Path2D:class{moveTo(){}lineTo(){}},screen:{},AudioContext:undefined,
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}},atob:s=>Buffer.from(s,'base64').toString('binary'),spoken:[],speechSynthesis:{cancel(){},speak(u){spoken.push(u.text)}},SpeechSynthesisUtterance:function(t){this.text=t}});
globalThis.document={querySelector:s=>els[s]||(els[s]=stubEl()),createElement:()=>stubEl(),body:{insertBefore(){},appendChild(){}},documentElement:{},addEventListener(){},hidden:false};
let raf=null,t=0;globalThis.requestAnimationFrame=f=>{raf=f};globalThis.performance={now:()=>t};
T3.WebGLRenderer=function(){this.shadowMap={};this.setPixelRatio=()=>{};this.setSize=()=>{};this.render=()=>{}};
let js=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
js+=';globalThis.T={startLevel,keys,get state(){return state},get me(){return me},get raceT(){return raceT},get S(){return S},get ENVI(){return ENVI},get dmg(){return dmg},get me3(){return me3},get gh3(){return gh3},get src(){return CARSRC},applyCarModel,put,ST,rail,obst}';
(0,eval)(js);

const frame=()=>{t+=16.7;raf(t)};let fail=0;const ck=(n,ok,i='')=>{console.log((ok?'OK   ':'FAIL ')+n+(i?'  '+i:''));if(!ok)fail++};
const V=()=>new THREE.Vector3();
// Auto finta con la struttura descritta: 4 GRUPPI "ruota_*" (cerchio+gomma figli, origine al mozzo) + carrozzeria + faro + stop
function fake({alpha=0,scale=1,mirror=false,names=['ruota_ad','ruota-pd','ruota_as','ruota_ps'],yrot=0}){
  const sc=new THREE.Group();sc.name='Scene';const std=c=>new THREE.MeshStandardMaterial({color:c});
  const body=new THREE.Mesh(new THREE.BoxGeometry(4.4,.6,1.8),std(0xff0000));body.name='carrozzeria';body.position.y=.7;sc.add(body);
  const cab=new THREE.Mesh(new THREE.BoxGeometry(2,.5,1.5),Object.assign(std(0x223344),{name:'vetro'}));cab.position.set(-.2,1.2,0);sc.add(cab);
  const hl=new THREE.Mesh(new THREE.BoxGeometry(.1,.2,.4),Object.assign(std(0xffffff),{name:'faro'}));hl.position.set(2.2,.8,.6);sc.add(hl);
  const tl=new THREE.Mesh(new THREE.BoxGeometry(.1,.2,.4),Object.assign(std(0x550000),{name:'stop'}));tl.position.set(-2.2,.8,.6);sc.add(tl);
  // posizioni ideali (avanti +X, destra +Z); nomi: a=anteriore p=posteriore, d=destra s=sinistra
  const spec=[[names[0],1.35,.8],[names[1],-1.35,.8],[names[2],1.35,-.8],[names[3],-1.35,-.8]];
  for(const[n,x,z]of spec){const g=new THREE.Group();g.name=n;g.position.set(x,.36,z);const t=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.3,16),std(0x111111));t.rotation.x=Math.PI/2;t.name='gomma';const c=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.32,12),std(0xcccccc));c.rotation.x=Math.PI/2;c.name='cerchio';g.add(t,c);sc.add(g)}
  const outer=new THREE.Group();outer.add(sc);outer.rotation.y=alpha;outer.scale.set(scale,scale,mirror?-scale:scale);return outer}
const cases=[['avanti +X',{alpha:0}],['avanti -Z (rot +90°)',{alpha:Math.PI/2}],['avanti +Z (rot -90°)',{alpha:-Math.PI/2}],['avanti -X (rot 180°)',{alpha:Math.PI}],['unità in cm (x100)',{scale:100,alpha:.7}],['unità x0.01',{scale:.01,alpha:2.2}],['specchiato (destra/sinistra scambiate)',{mirror:true,alpha:.3}]];
T.startLevel(0);
for(const[name,opt]of cases){
  const ok=T.applyCarModel(fake(opt));const g=T.me3;
  let r=ok;const w=g.wh.map(p=>p.position);
  const pos=w.length===4&&w[0].x>0&&w[1].x>0&&w[2].x<0&&w[3].x<0&&w[0].z>0&&w[1].z>0&&w[2].z<0&&w[3].z<0;   // ordine: [ad, pd?]
  // nell'auto il gioco usa [anteriore dx, anteriore sx, posteriore dx, posteriore sx]
  const okOrder=w[0].x>0&&w[1].x>0&&w[2].x<0&&w[3].x<0&&w[0].z>0&&w[1].z<0&&w[2].z>0&&w[3].z<0;
  g.position.set(0,0,0);g.rotation.set(0,0,0);g.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(g);const sz=box.getSize(V());
  const spinBefore=g.sp[0].rotation.z;T.put(g,0,0,0,0,0,300,.016,false);const spun=g.sp[0].rotation.z!==spinBefore;g.position.set(0,0,0);g.rotation.set(0,0,0);g.updateMatrixWorld(true);
  // il cerchio e la gomma devono restare insieme: stesso gruppo-ruota => stessa posizione mondo del centro
  const wp=g.sp[0].children[0],kids=wp.children.map(c=>c.getWorldPosition(V()));const together=kids.every(k=>k.distanceTo(g.wh[0].getWorldPosition(V()))<.05);
  ck(name+': applicato',ok);ck(name+': ruote davanti/destra corrette',okOrder,'('+w.map(p=>p.x.toFixed(1)+','+p.z.toFixed(1)).join(' ')+')');
  ck(name+': lunghezza ~4.15 m e a terra',Math.abs(sz.x-4.15)<.15&&Math.abs(box.min.y)<.03&&sz.y>1,'(L '+sz.x.toFixed(2)+', h '+sz.y.toFixed(2)+', minY '+box.min.y.toFixed(3)+')');
  ck(name+': ruota gira sul perno e cerchio+gomma restano uniti',spun&&together,'(raggio '+g.wr.toFixed(2)+' m)');
}
// ruote mancanti => fallback (restano le ruote procedurali)
T.startLevel(0);const bad=fake({names:['ruota_ad','ruota_pd','ruota_as','cofano']});const wh0=T.me3.wh.length;const ok2=T.applyCarModel(bad);ck('nomi inattesi: ripiego sul modello procedurale',ok2===false&&T.me3.wh.length===wh0);
// il gioco continua a funzionare con l'auto GLB (partita simulata)
T.applyCarModel(fake({alpha:1}));{const S0=T.startLevel(2),q=T.me;let n=0;while(T.state!=='done'&&n<9000){const S=T.S,i=Math.min(q.idx+10,S.N-1),p=S.P[i],w=Math.atan2(p.y-q.y,p.x-q.x),e=Math.atan2(Math.sin(w-q.h),Math.cos(w-q.h)),sp=Math.hypot(q.vf,q.vl);T.keys.KeyD=e>.04?1:0;T.keys.KeyA=e<-.04?1:0;T.keys.KeyW=sp<300?1:0;frame();n++}
  ck('partita con auto GLB: nessun errore e prova avanzata',n>2000&&T.me.idx>100,'(frame '+n+', idx '+Math.round(T.me.idx)+')')}
console.log(fail?`\n${fail} controlli FALLITI`:'\nTutti i controlli GLB superati');process.exit(fail?1:0);
