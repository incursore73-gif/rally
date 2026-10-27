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

for(let k=0;k<10;k++){T.startLevel(k);const S=T.S,P=S.P,L=T.ST[k],R=T.ENVI.road;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of P){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)}
 let mg=0,up=0,dn=0,minR=1e9;for(let i=1;i<R.N;i++){const g=(R.Y[i]-R.Y[i-1])/(R.S[i]-R.S[i-1]);mg=Math.max(mg,Math.abs(g));if(R.Y[i]>R.Y[i-1])up+=R.Y[i]-R.Y[i-1];else dn+=R.Y[i-1]-R.Y[i]}
 for(let i=3;i<R.N-3;i++){const a1=Math.atan2(R.Z[i]-R.Z[i-3],R.X[i]-R.X[i-3]),a2=Math.atan2(R.Z[i+3]-R.Z[i],R.X[i+3]-R.X[i]),d=Math.abs(Math.atan2(Math.sin(a2-a1),Math.cos(a2-a1)));if(d>1e-4)minR=Math.min(minR,6/d)}
 const cnt={};for(const n of S.notes)cnt[n.t]=(cnt[n.t]||0)+1;
 console.log(k,L.alp.th.padEnd(7),(L.srf[0]).toUpperCase(),'N',S.N,'| curve',JSON.stringify(cnt).replace(/["{}]/g,''),'| quota',(R.maxY-R.minY).toFixed(0)+'m salita',up.toFixed(0)+'m discesa',dn.toFixed(0)+'m pend.max',(mg*100).toFixed(0)+'% | raggio min',minR.toFixed(1)+'m (strada '+(R.hw+R.shoulder).toFixed(1)+'m)','| prime:',S.notes.slice(0,6).map(n=>(n.dir>0?'R':'L')+n.t[0]+(n.i0*1.08|0)).join(' '))}
console.log('--- guardrail per prova');
for(let k=0;k<10;k++){T.startLevel(k);const E=T.ENVI,R=E.road,f=E.guardFlags;let l=0,r=0;for(let i=0;i<R.N;i++){if(f.left[i])l++;if(f.right[i])r++}console.log(k,T.ST[k].alp.th.padEnd(7),'guardrail sx',(l*2)+' m  dx',(r*2)+' m  su',R.length.toFixed(0)+' m  ('+(((l+r)*2/R.length)*50).toFixed(0)+'% dei bordi)','tratti',E.guardrails.length)}
process.exit(0)
