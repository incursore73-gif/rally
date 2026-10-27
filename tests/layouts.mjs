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

for(let k=0;k<10;k++){T.startLevel(k);const S=T.S,P=S.P,L=T.ST[k];let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of P){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)}
 const h0=Math.atan2(P[10].y-P[0].y,P[10].x-P[0].x)*180/Math.PI;
 console.log(k,L.alp.th.padEnd(7),'seed',L.seed,'N',S.N,'start heading',h0.toFixed(0)+'deg','box',((x1-x0)*.06).toFixed(0)+'x'+((y1-y0)*.06).toFixed(0)+'m','prime note:',S.notes.slice(0,7).map(n=>(n.dir>0?'R':'L')+n.t[0]+(n.i0*1.08|0)).join(' '))}
process.exit(0)
