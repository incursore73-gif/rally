// Statistiche su molti seed: tentativi di validazione, larghezza laterale, curve strette, tornanti (alpine). Uso: node tests/seeds.mjs
import * as THREE from 'three';import {createEnvironment} from '../src/environment.js';
globalThis.window={devicePixelRatio:1};const rd={shadowMap:{},setPixelRatio(){}};
for(const th of['alpine','forest','canyon','coast','autumn']){const rows=[];
  for(let seed=1;seed<=24;seed++){const e=createEnvironment(new THREE.Scene(),rd,{seed,theme:th,road:{width:12,shoulder:1.4,hairpins:9,radiusMin:15,radiusMax:24,legMin:80},render:{preset:'PERFORMANCE'}}),R=e.road;
    let x0=1e9,x1=-1e9,minR=1e9;for(let i=0;i<R.N;i++){x0=Math.min(x0,R.X[i]);x1=Math.max(x1,R.X[i])}for(let i=3;i<R.N-3;i++){const a1=Math.atan2(R.Z[i]-R.Z[i-3],R.X[i]-R.X[i-3]),a2=Math.atan2(R.Z[i+3]-R.Z[i],R.X[i+3]-R.X[i]);const d=Math.abs(Math.atan2(Math.sin(a2-a1),Math.cos(a2-a1)));if(d>1e-4)minR=Math.min(minR,6/d)}
    rows.push({attempts:R.attempts,len:R.length,w:x1-x0,minR,h:R.hairpins.length,first:Math.sign(R.K[Math.max(2,R.K.findIndex(k=>Math.abs(k)>.02))])});e.dispose()}
  const med=a=>[...a].sort((p,q)=>p-q)[a.length>>1],mx=a=>Math.max(...a),mn=a=>Math.min(...a);
  console.log(th.padEnd(7),'tentativi max',mx(rows.map(r=>r.attempts)),'| lunghezza',mn(rows.map(r=>r.len)).toFixed(0)+'-'+mx(rows.map(r=>r.len)).toFixed(0),'m | larghezza laterale mediana',med(rows.map(r=>r.w)).toFixed(0),'max',mx(rows.map(r=>r.w)).toFixed(0),'m | raggio min',mn(rows.map(r=>r.minR)).toFixed(0),'m | tornanti',mn(rows.map(r=>r.h))+'-'+mx(rows.map(r=>r.h)),'| prima curva a destra/sinistra',rows.filter(r=>r.first>0).length+'/'+rows.filter(r=>r.first<0).length)}
