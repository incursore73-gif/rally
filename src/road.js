import * as THREE from 'three';
import {mulberry32} from './noise.js';
const rot=(v,a)=>({x:v.x*Math.cos(a)-v.y*Math.sin(a),y:v.x*Math.sin(a)+v.y*Math.cos(a)});
// Punti di controllo 2D (x,z): tratti diagonali sul versante collegati da tornanti (semicerchi).
function layout(rc,rnd){
  const P=[],rr=(a,b)=>a+(b-a)*rnd(),[xa,xb]=rc.xRange;let p={x:xa*.5,y:0},h={x:.995,y:-.1};P.push({...p});
  for(let i=0;i<=rc.hairpins;i++){
    const sd=Math.sign(h.x)||1,tx=sd>0?rr(Math.max(p.x+rc.legMin,xb-70),xb):rr(xa,Math.min(p.x-rc.legMin,xa+70));
    const len=Math.abs(tx-p.x)/Math.abs(h.x),k=Math.max(2,Math.round(len/45)),pr={x:-h.y,y:h.x},w=rr(2,7)*(rnd()<.5?-1:1),ph=rr(.7,1.6);
    for(let j=1;j<=k;j++){const t=j/k,o=j<k?Math.sin(t*Math.PI*ph)*w:0;P.push({x:p.x+h.x*len*t+pr.x*o,y:p.y+h.y*len*t+pr.y*o})}
    p=P[P.length-1];
    if(i===rc.hairpins){P.push({x:p.x+h.x*60,y:p.y+h.y*60});break}
    const n1={x:h.y,y:-h.x},n2={x:-h.y,y:h.x},n=n1.y<n2.y?n1:n2,R=rr(rc.radiusMin,rc.radiusMax),c={x:p.x+n.x*R,y:p.y+n.y*R},r0={x:p.x-c.x,y:p.y-c.y};
    const s=Math.sign(-r0.y*h.x+r0.x*h.y);
    for(let j=1;j<=8;j++){const r=rot(r0,s*Math.PI*j/8);P.push({x:c.x+r.x,y:c.y+r.y})}
    p=P[P.length-1];const a=rr(rc.legTilt[0],rc.legTilt[1])*Math.PI/180,c1=rot({x:-h.x,y:-h.y},a),c2=rot({x:-h.x,y:-h.y},-a);h=c1.y<c2.y?c1:c2;
  }
  return P;
}
const smooth=(a,w)=>{const n=a.length,o=new Float32Array(n),pre=new Float64Array(n+1);for(let i=0;i<n;i++)pre[i+1]=pre[i]+a[i];
  for(let i=0;i<n;i++){const l=Math.max(0,i-w),r=Math.min(n-1,i+w);o[i]=(pre[r+1]-pre[l])/(r-l+1)}return o};

export function createRoad(cfg,natural){
  const rc=cfg.road,hw=rc.width/2,sh=rc.shoulder;let pts,attempt=0;
  for(;;attempt++){
    pts=new THREE.CatmullRomCurve3(layout(rc,mulberry32(cfg.seed*7919+attempt*104729)).map(p=>new THREE.Vector3(p.x,0,p.y)),false,'centripetal');
    pts.arcLengthDivisions=8000;pts.updateArcLengths();const sm=pts.getSpacedPoints(Math.round(pts.getLength()/rc.sampleStep)),need=2*(hw+sh)+3;let ok=true;
    for(let i=0;i<sm.length&&ok;i+=3)for(let j=i+25;j<sm.length;j+=3)if(Math.hypot(sm[i].x-sm[j].x,sm[i].z-sm[j].z)<need){ok=false;break}
    if(ok||attempt>40){pts=sm;break}
  }
  const N=pts.length,X=new Float32Array(N),Z=new Float32Array(N),S=new Float32Array(N),TX=new Float32Array(N),TZ=new Float32Array(N),NX=new Float32Array(N),NZ=new Float32Array(N),K=new Float32Array(N);
  for(let i=0;i<N;i++){X[i]=pts[i].x;Z[i]=pts[i].z;if(i)S[i]=S[i-1]+Math.hypot(X[i]-X[i-1],Z[i]-Z[i-1])}
  for(let i=0;i<N;i++){const a=Math.max(0,i-1),b=Math.min(N-1,i+1),dx=X[b]-X[a],dz=Z[b]-Z[a],l=Math.hypot(dx,dz)||1;TX[i]=dx/l;TZ[i]=dz/l;NX[i]=-TZ[i];NZ[i]=TX[i]}
  for(let i=2;i<N-2;i++){const a=Math.atan2(TZ[i+2],TX[i+2])-Math.atan2(TZ[i-2],TX[i-2]);K[i]=Math.atan2(Math.sin(a),Math.cos(a))/(S[i+2]-S[i-2])}
  // Quota: segue il terreno naturale (smussato), con pendenza longitudinale limitata.
  const ds=rc.sampleStep;let Y=Float32Array.from(X,(x,i)=>natural(x,Z[i]));const w=Math.round(rc.smoothWindow/ds/2);Y=smooth(smooth(Y,w),w);
  for(let i=1;i<N;i++){const mg=rc.maxGrade*(S[i]-S[i-1]);Y[i]=Math.min(Y[i-1]+mg,Math.max(Y[i-1]-mg,Y[i]))}for(let i=N-2;i>=0;i--){const mg=rc.maxGrade*(S[i+1]-S[i]);Y[i]=Math.min(Y[i+1]+mg,Math.max(Y[i+1]-mg,Y[i]))}Y=smooth(Y,2);
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,minY=1e9,maxY=-1e9;for(let i=0;i<N;i++){x0=Math.min(x0,X[i]);x1=Math.max(x1,X[i]);z0=Math.min(z0,Z[i]);z1=Math.max(z1,Z[i]);minY=Math.min(minY,Y[i]);maxY=Math.max(maxY,Y[i])}
  // Indice spaziale per interrogazioni di vicinanza.
  const CELL=20,grid=new Map(),key=(a,b)=>(a+4000)*20000+(b+4000);
  for(let i=0;i<N;i++){const k=key(Math.floor(X[i]/CELL),Math.floor(Z[i]/CELL));(grid.get(k)||grid.set(k,[]).get(k)).push(i)}
  function nearest(x,z,maxD=60){const cx=Math.floor(x/CELL),cz=Math.floor(z/CELL),R=Math.ceil(maxD/CELL);let bi=-1,bd=maxD*maxD;
    for(let r=0;r<=R;r++){for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++){if(Math.max(Math.abs(a),Math.abs(b))!==r)continue;const l=grid.get(key(cx+a,cz+b));if(l)for(const i of l){const dx=x-X[i],dz=z-Z[i],d=dx*dx+dz*dz;if(d<bd){bd=d;bi=i}}}
      if(bi>=0&&bd<=(r*CELL)*(r*CELL))break}
    if(bi<0)return null;const dx=x-X[bi],dz=z-Z[bi];return{i:bi,d:Math.sqrt(bd),lat:dx*NX[bi]+dz*NZ[bi],s:S[bi]}}
  // Tornanti = tratti ad alta curvatura continua.
  const hairpins=[],kT=1/(rc.radiusMax*1.7);for(let i=0;i<N;){if(Math.abs(K[i])>kT){let j=i;while(j<N&&Math.abs(K[j])>kT*.8)j++;if(j-i>=14){const m=(i+j)>>1;hairpins.push({index:m,s:S[m],radius:1/Math.abs(K[m]),side:Math.sign(K[m]),position:new THREE.Vector3(X[m],Y[m],Z[m])})}i=j}else i++}
  const R={X,Y,Z,S,TX,TZ,NX,NZ,K,N,hw,shoulder:sh,width:rc.width,length:S[N-1],bounds:{x0,x1,z0,z1},minY,maxY,hairpins,attempts:attempt,nearest,
    pointAt(s){s=Math.min(Math.max(s,0),S[N-1]);let i=Math.min(N-2,Math.floor(s/ds));while(i<N-2&&S[i+1]<s)i++;while(i>0&&S[i]>s)i--;const f=(s-S[i])/(S[i+1]-S[i]||1),L=(a,b)=>a+(b-a)*f,t=new THREE.Vector3(L(TX[i],TX[i+1]),0,L(TZ[i],TZ[i+1])).normalize();
      return{s,position:new THREE.Vector3(L(X[i],X[i+1]),L(Y[i],Y[i+1]),L(Z[i],Z[i+1])),tangent:t,normal:new THREE.Vector3(-t.z,0,t.x),grade:(Y[i+1]-Y[i])/(S[i+1]-S[i]||1),width:rc.width}},
    info(x,z,margin=0){const q=nearest(x,z,40);if(!q)return{onRoad:false,onShoulder:false,distance:Infinity};const a=Math.abs(q.lat);
      return{onRoad:a<=hw+margin,onShoulder:a>hw+margin&&a<=hw+sh,distance:q.d,lateral:q.lat,s:q.s,roadY:Y[q.i]}}};
  return R;
}
// Superfici: nastro continuo tra due offset laterali (maschera opzionale per tratteggi).
function strip(R,o0,o1,dy,vs,mask){const N=R.N,pos=new Float32Array(N*6),uv=new Float32Array(N*4),ix=[];
  for(let i=0;i<N;i++)for(let k=0;k<2;k++){const o=k?o1:o0,j=i*2+k;pos[j*3]=R.X[i]+R.NX[i]*o;pos[j*3+1]=R.Y[i]+dy;pos[j*3+2]=R.Z[i]+R.NZ[i]*o;uv[j*2]=k;uv[j*2+1]=R.S[i]/vs}
  for(let i=0;i<N-1;i++){if(mask&&!mask(i))continue;const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g}
export function buildRoadMeshes(R,M){
  const g=new THREE.Group(),hw=R.hw,sh=R.shoulder,add=(geo,mat,rs=true)=>{const m=new THREE.Mesh(geo,mat);m.receiveShadow=rs;g.add(m);return m};
  add(strip(R,-hw,hw,0,8),M.asphalt);add(strip(R,hw,hw+sh,-.03,6),M.shoulder);add(strip(R,-hw-sh,-hw,-.03,6),M.shoulder);
  add(strip(R,hw-.38,hw-.24,.02,6),M.line,false);add(strip(R,-hw+.24,-hw+.38,.02,6),M.line,false);
  add(strip(R,-.07,.07,.02,6,i=>Math.floor(R.S[i]/5)%2===0),M.line,false);
  return g;
}
// Guardrail, pali, delineatori, pannelli chevron nei tornanti, muretti sul lato a monte.
export function buildFurniture(R,heightAt,M,cfg){
  const g=new THREE.Group(),hw=R.hw,sh=R.shoulder,N=R.N,ds=cfg.road.sampleStep,rl=cfg.rails,off=hw+sh-.15,segs=[],dummy=new THREE.Object3D();
  const postM=[],delM=[],wallM=[],chevM=[];
  for(const side of[-1,1]){
    const flag=new Uint8Array(N);
    for(let i=0;i<N;i++){const o=hw+sh+2.5;flag[i]=R.Y[i]-heightAt(R.X[i]+R.NX[i]*side*o,R.Z[i]+R.NZ[i]*side*o)>rl.dropMin?1:0}
    for(let i=1;i<N-1;i++)if(!flag[i]){let j=i;while(j<N&&!flag[j])j++;if(flag[i-1]&&j<N&&j-i<=4)for(let k=i;k<j;k++)flag[k]=1;i=j}
    for(let i=0;i<N;){if(!flag[i]){i++;continue}let j=i;while(j<N&&flag[j])j++;
      if(j-i>=6){const pts=[];for(let k=i;k<j;k++)pts.push(new THREE.Vector3(R.X[k]+R.NX[k]*side*off,R.Y[k]+.5,R.Z[k]+R.NZ[k]*side*off));
        segs.push({side,points:pts});
        const step=Math.round(rl.postSpacing/ds);for(let k=i;k<j;k+=step)postM.push([R.X[k]+R.NX[k]*side*(off+.15),R.Y[k]+.45,R.Z[k]+R.NZ[k]*side*(off+.15)])}
      i=j}
    for(let i=0;i<N;i+=10){if(flag[i])continue;const o=hw+sh+.3;delM.push([R.X[i]+R.NX[i]*side*o,R.Y[i]+.45,R.Z[i]+R.NZ[i]*side*o])}
    // muretti a monte dove il terreno sale sopra la strada
    for(let i=0;i<N;i+=2){const o=hw+sh+.3,up=heightAt(R.X[i]+R.NX[i]*side*(o+2),R.Z[i]+R.NZ[i]*side*(o+2))-R.Y[i];if(up>1.2&&up<8&&!flag[i])wallM.push([R.X[i]+R.NX[i]*side*o,R.Y[i]+.4,R.Z[i]+R.NZ[i]*side*o,Math.atan2(-R.TZ[i],R.TX[i])])}
  }
  // Nastri guardrail costruiti per singolo tratto (nessun collegamento fra tratti separati).
  const rg=new THREE.BufferGeometry();{const P=[],I=[];let b=0;for(const s of segs){for(let k=0;k<s.points.length;k++){const p=s.points[k];P.push(p.x,p.y,p.z,p.x,p.y+.32,p.z);if(k<s.points.length-1){I.push(b,b+1,b+2,b+1,b+3,b+2)}b+=2}}
    rg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));rg.setIndex(I);rg.computeVertexNormals()}
  const rm=new THREE.Mesh(rg,M.rail);rm.castShadow=false;g.add(rm);
  const inst=(geo,mat,list,withRot)=>{if(!list.length)return;const m=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((p,i)=>{dummy.position.set(p[0],p[1],p[2]);dummy.rotation.set(0,withRot?p[3]:0,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)});m.receiveShadow=true;g.add(m)};
  inst(new THREE.BoxGeometry(.1,.9,.1),M.post,postM);inst(new THREE.BoxGeometry(.09,.9,.09),M.delin,delM);inst(new THREE.BoxGeometry(3,.8,.55),M.wall,wallM,true);
  for(const h of R.hairpins){for(let k=-3;k<=3;k++){const i=Math.min(N-1,Math.max(0,h.index+k*3)),side=-h.side,o=hw+sh+.9;chevM.push([R.X[i]+R.NX[i]*side*o,R.Y[i]+1.3,R.Z[i]+R.NZ[i]*side*o,Math.atan2(-R.TZ[i],R.TX[i])])}}
  inst(new THREE.BoxGeometry(1,.7,.05),M.sign,chevM,true);
  return{group:g,guardrails:segs,landmarks:R.hairpins.map(h=>({type:'hairpin',position:h.position,s:h.s,radius:h.radius}))};
}
