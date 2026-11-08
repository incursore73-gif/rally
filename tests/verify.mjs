// Verifica geometrica in Node (senza WebGL): continuità, tornanti, corrispondenza strada/terreno, guardrail, istanze.
// Uso: npm i three@0.160.0 && node tests/verify.mjs
import * as THREE from 'three';
import {createEnvironment} from '../src/environment.js';
globalThis.window={devicePixelRatio:1};
const renderer={shadowMap:{},setPixelRatio(){}},results={};let fail=0;
const ck=(n,ok,info='')=>{console.log((ok?'OK   ':'FAIL ')+n+(info?'  '+info:''));if(!ok)fail++};
for(const preset of['HIGH','PERFORMANCE']){
  const t0=performance.now(),env=createEnvironment(new THREE.Scene(),renderer,{render:{preset}}),R=env.road,st=env.stats;
  console.log(`\n== ${preset} == generazione ${(performance.now()-t0).toFixed(0)} ms`,st);
  let maxStep=0,maxGrade=0,maxYStep=0;for(let i=1;i<R.N;i++){maxStep=Math.max(maxStep,Math.hypot(R.X[i]-R.X[i-1],R.Z[i]-R.Z[i-1]));maxGrade=Math.max(maxGrade,Math.abs(R.Y[i]-R.Y[i-1])/Math.hypot(R.X[i]-R.X[i-1],R.Z[i]-R.Z[i-1]))}
  ck('tornanti >= 8',st.hairpins>=8,`(${st.hairpins})`);ck('passo campioni costante (<2.5 m)',maxStep<2.5,`(${maxStep.toFixed(2)} m)`);ck('pendenza max <= 12%',maxGrade<=.12,`(${(maxGrade*100).toFixed(1)}%)`);
  let dmax=0,omax=0,sMax=0;for(let i=0;i<R.N;i+=3){for(const o of[-R.hw,0,R.hw]){const x=R.X[i]+R.NX[i]*o,z=R.Z[i]+R.NZ[i]*o,ty=env.getTerrainHeightExact(x,z);dmax=Math.max(dmax,Math.abs(R.Y[i]-.1-ty));omax=Math.max(omax,ty-R.Y[i])}}
  ck('terreno sotto la carreggiata (scarto da quota strada-0.1 < 0.35 m)',dmax<.35,`(max ${dmax.toFixed(2)} m)`);ck('terreno mai sopra la carreggiata',omax<.01,`(${omax.toFixed(3)})`);
  let minClear=1e9;for(let i=0;i<R.N;i+=3)for(let j=i+25;j<R.N;j+=3)minClear=Math.min(minClear,Math.hypot(R.X[i]-R.X[j],R.Z[i]-R.Z[j]));ck('nessun attraversamento fra tratti',minClear>=2*(R.hw+R.shoulder)+3,`(distanza min ${minClear.toFixed(1)} m)`);
  ck('guardrail presenti',env.guardrails.length>0,`(${env.guardrails.length} tratti, ${env.guardrails.reduce((a,g)=>a+g.points.length*2,0)} m)`);
  const p0=env.getStart();ck('punto iniziale sulla strada',env.isOnRoad(p0.position.x,p0.position.z).onRoad);
  const off=env.isOnRoad(R.X[100]+R.NX[100]*30,R.Z[100]+R.NZ[100]*30);ck('fuori strada rilevato',!off.onRoad&&!off.onShoulder);
  const rp=env.getResetPoint(R.X[100]+R.NX[100]*30,R.Z[100]+R.NZ[100]*30);ck('reset sicuro sulla strada',env.isOnRoad(rp.position.x,rp.position.z).onRoad);
  let drop=0,at=0;for(let i=0;i<R.N;i+=2)for(const s of[-1,1]){const d=R.Y[i]-env.getTerrainHeightExact(R.X[i]+R.NX[i]*s*25,R.Z[i]+R.NZ[i]*s*25);if(d>drop){drop=d;at=i}}ck('precipizi: caduta oltre 20 m entro 25 m dall\'asse',drop>20,`(max ${drop.toFixed(0)} m, a s=${R.S[at].toFixed(0)} m)`);
  ck('dislivello totale > 100 m',R.maxY-R.minY>100,`(${(R.maxY-R.minY).toFixed(0)} m)`);
  results[preset]=st;env.dispose();
}
console.log(fail?`\n${fail} controlli FALLITI`:'\nTutti i controlli superati');process.exit(fail?1:0);
