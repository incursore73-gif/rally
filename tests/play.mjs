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
js+=';globalThis.T={startLevel,keys,get state(){return state},get me(){return me},get raceT(){return raceT},get S(){return S},get ENVI(){return ENVI},get dmg(){return dmg},get me3(){return me3},ST,rail,obst}';
(0,eval)(js);
const frame=()=>{t+=16.7;raf(t)};let fail=0;const ck=(n,ok,i='')=>{console.log((ok?'OK   ':'FAIL ')+n+(i?'  '+i:''));if(!ok)fail++};
const pilot=(k,maxF=26000)=>{T.startLevel(k);const S=T.S;let n=0,off=0,hit=0,air=false;
  while(T.state!=='done'&&n<maxF){const q=T.me,i=Math.min(q.idx+10,S.N-1),p=S.P[i],w=Math.atan2(p.y-q.y,p.x-q.x),e=Math.atan2(Math.sin(w-q.h),Math.cos(w-q.h)),sp=Math.hypot(q.vf,q.vl);
    // limita la velocità in curva (autopilota prudente)
    const nxt=S.notes.find(nn=>nn.i1>q.idx&&nn.i0-q.idx<60),vmax=nxt&&(nxt.t==='hair'||nxt.t==='vh')?190:nxt&&nxt.t==='c90'?300:520;
    T.keys.KeyD=e>.04?1:0;T.keys.KeyA=e<-.04?1:0;T.keys.KeyW=sp<vmax?1:0;T.keys.Space=Math.abs(e)>.6&&sp>260?1:0;frame();n++;if(Math.abs(q.lat)>S.hw)off++;if(q.air)air=true}
  return{state:T.state,time:T.raceT,frames:n,off,air,dmg:T.dmg,N:S.N,notes:S.notes.length,hair:S.notes.filter(x=>x.t==='hair').length,J:S.J.length,tr:S.tr.length,srf:T.ST[k].srf}};
for(const k of[0,1,3,5,9]){const r=pilot(k);console.log('lvl',k,JSON.stringify(r));ck('prova '+k+' completata',r.state==='done');ck('prova '+k+' ha tornanti e note',r.hair>=3&&r.notes>=8);if(r.srf==='gravel')ck('prova '+k+' salti (sterrato)',r.J>=1,`(${r.J})`)}
// guardrail: spingi l'auto contro un tratto protetto e verifica che venga respinta
T.startLevel(0);{const E=T.ENVI,R=E.road,fl=E.guardFlags.right;let idx=-1;for(let i=100;i<R.N-100;i++)if(fl[i]&&fl[i+5]&&fl[i-5]){idx=i;break}
  const q=T.me;const X=R.X[idx]+R.NX[idx]*(R.hw+R.shoulder+.6),Z=R.Z[idx]+R.NZ[idx]*(R.hw+R.shoulder+.6);q.x=X/.06;q.y=Z/.06;q.h=Math.atan2(R.TZ[idx],R.TX[idx])+1.2;q.vf=400;q.vl=0;let n=0;while(T.state!=='race'&&n<400){frame();n++}
  q.x=X/.06;q.y=Z/.06;T.rail();const L=E.road.nearest(q.x*.06,q.y*.06,10).lat;ck('guardrail respinge l\'auto',L<R.hw+R.shoulder+.05,`(lat ${L.toFixed(2)} m, limite ${(R.hw+R.shoulder).toFixed(2)} m)`)}
console.log(fail?`\n${fail} controlli FALLITI`:'\nTutti i controlli di gioco superati');process.exit(fail?1:0);
