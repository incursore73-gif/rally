import * as THREE from 'three';
import {createEnvironment} from '../src/environment.js';
globalThis.window={devicePixelRatio:1};
for(const p of['HIGH','PERFORMANCE']){const sc=new THREE.Scene(),env=createEnvironment(sc,{shadowMap:{},setPixelRatio(){}},{render:{preset:p}});
 let tri=0,verts=0,meshes=0,inst=0,nan=0;sc.traverse(o=>{if(o.geometry){meshes++;const g=o.geometry,n=g.index?g.index.count/3:g.attributes.position.count/3;tri+=n*(o.isInstancedMesh?o.count:1);verts+=g.attributes.position.count;if(o.isInstancedMesh)inst++;for(const v of g.attributes.position.array)if(!Number.isFinite(v)){nan++;break}}});
 console.log(p,'oggetti con geometria',meshes,'(istanziati',inst+')','triangoli totali (con istanze) ~',(tri/1000).toFixed(0)+'k','NaN nelle posizioni:',nan,'lunghezza strada',env.roadLength.toFixed(0),'m','tornanti',env.stats.hairpins)}
