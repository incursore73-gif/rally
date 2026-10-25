import * as THREE from 'three';
import {makeNoise} from './noise.js';
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
// Terreno naturale deterministico: versante in salita verso -z, pareti laterali, massicci lontani, gobbe e canaloni.
export function createNatural(cfg){const n=makeNoise(cfg.seed),t=cfg.terrain;
  return(x,z)=>{const zc=Math.min(450,Math.max(-3200,z)),climb=-zc*t.baseSlope,wall=Math.max(0,Math.abs(x)-330)*.5,
    mass=t.ridgeAmp*ss(-250,-2400,z)*(.3+n.ridged(x*.0012+9,z*.0012,5)*1.6),
    bump=t.noiseAmp*n.fbm(x*.006,z*.006,5)+6*n.fbm(x*.035,z*.035,3),gully=-16*Math.pow(n.ridged(x*.011+40,z*.011,3),2);
    return 100+climb+wall+mass+bump+gully}}
export function createTerrain(cfg,natural,road,preset){
  const tp=cfg.terrain,d0=road.hw+road.shoulder+.35,nz=makeNoise(cfg.seed+5);
  // Quota finale: terreno naturale vincolato fra una scarpata ripida a valle e una parete di scavo a monte; piatto sotto la carreggiata.
  const heightAt=(x,z)=>{const H=natural(x,z),q=road.nearest(x,z,tp.influence);if(!q)return H;const ry=road.Y[q.i]-.1,e=Math.max(0,q.d-d0),lo=ry-tp.cliffSlope*e,hi=ry+tp.cutSlope*e;
    // Gola sul lato a valle: il terreno cade fino a 'gorge' metri sotto la strada, poi torna al naturale (nessuna discontinuità a fine influenza).
    const w=ss(ry+4,ry-8,H)*ss(0,18,e)*(1-ss(30,80,e)),A=tp.gorge*(.55+.45*nz.fbm(x*.02+3,z*.02,2)),y=H+(Math.min(H,ry-A)-H)*w;
    return Math.min(hi,Math.max(lo,y))};
  const cs=tp.coarseStep,b=road.bounds,m=tp.fineMargin,F={x0:Math.floor((b.x0-m)/cs)*cs,x1:Math.ceil((b.x1+m)/cs)*cs,z0:Math.floor((b.z0-m)/cs)*cs,z1:Math.ceil((b.z1+m)/cs)*cs};
  const low=road.minY-25,top=road.maxY+10,col=h=>new THREE.Color(h),cGr=col('#566b3a'),cMe=col('#7d8a55'),cSc=col('#8d8a7e'),cRo=col('#77746d'),cDk=col('#55524c'),cSn=col('#eef2f6'),cHz=col('#93a5bd'),tmp=new THREE.Color();
  function colorAt(x,y,z,ny,far,out){const r=nz.fbm(x*.02,z*.02,3),a=ss(low,top+60,y+r*18),rockT=ss(.84,.55,ny);
    out.copy(cGr).lerp(cMe,a);out.lerp(cSc,ss(top-10,top+90,y+r*15));out.lerp(cRo,rockT);
    out.multiplyScalar(1+.08*Math.sin(y*1.1+r*6)*rockT);if(rockT>.6)out.lerp(cDk,.25*(.5+.5*Math.sin(y*.37+r*4)));
    if(y>top+150&&ny>.5)out.lerp(cSn,ss(top+150,top+230,y+r*20));
    if(far)out.lerp(cHz,ss(500,2800,Math.hypot(x,z+800))*.85)}
  function grid(x0,z0,x1,z1,step,hf,skip,far){
    const nx=Math.ceil((x1-x0)/step),nzz=Math.ceil((z1-z0)/step),sx=(x1-x0)/nx,sz=(z1-z0)/nzz,V=(nx+1)*(nzz+1),pos=new Float32Array(V*3),uv=new Float32Array(V*2);
    for(let j=0;j<=nzz;j++)for(let i=0;i<=nx;i++){const k=j*(nx+1)+i,x=x0+i*sx,z=z0+j*sz;pos[k*3]=x;pos[k*3+1]=hf(x,z);pos[k*3+2]=z;uv[k*2]=x/14;uv[k*2+1]=z/14}
    const ix=[];for(let j=0;j<nzz;j++)for(let i=0;i<nx;i++){if(skip&&skip(x0+(i+.5)*sx,z0+(j+.5)*sz))continue;const a=j*(nx+1)+i,bb=a+1,c=a+nx+1,d=c+1;ix.push(a,c,bb,bb,c,d)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(ix);g.computeVertexNormals();
    const nr=g.attributes.normal,cl=new Float32Array(V*3);for(let k=0;k<V;k++){colorAt(pos[k*3],pos[k*3+1],pos[k*3+2],nr.getY(k),far,tmp);cl[k*3]=tmp.r;cl[k*3+1]=tmp.g;cl[k*3+2]=tmp.b}
    // Gonne: coprono eventuali fessure fra mesh a risoluzione diversa.
    const ec=new Map(),ek=(a,c)=>a<c?a*V+c:c*V+a;for(let t=0;t<ix.length;t+=3)for(let e=0;e<3;e++){const k=ek(ix[t+e],ix[t+(e+1)%3]);ec.set(k,(ec.get(k)||0)+1)}
    const P=Array.from(pos),NR=Array.from(nr.array),CL=Array.from(cl),UV=Array.from(uv),I=Array.from(ix),map=new Map(),dup=v=>{if(map.has(v))return map.get(v);const id=P.length/3;P.push(pos[v*3],pos[v*3+1]-tp.skirt,pos[v*3+2]);NR.push(nr.getX(v),nr.getY(v),nr.getZ(v));CL.push(cl[v*3],cl[v*3+1],cl[v*3+2]);UV.push(uv[v*2],uv[v*2+1]);map.set(v,id);return id};
    for(let t=0;t<ix.length;t+=3)for(let e=0;e<3;e++){const a=ix[t+e],c=ix[t+(e+1)%3];if(ec.get(ek(a,c))===1){const a2=dup(a),c2=dup(c);I.push(a,c,c2,a,c2,a2)}}
    const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(P,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(NR,3));G.setAttribute('color',new THREE.Float32BufferAttribute(CL,3));G.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));G.setIndex(I);return G}
  const inF=(x,z)=>x>F.x0&&x<F.x1&&z>F.z0&&z<F.z1;
  return{heightAt,natural,fineRect:F,
    slopeAt(x,z,d=3){return Math.hypot(heightAt(x+d,z)-heightAt(x-d,z),heightAt(x,z+d)-heightAt(x,z-d))/(2*d)},
    build(M){const g=new THREE.Group(),E=tp.coarseExtent,fine=new THREE.Mesh(grid(F.x0,F.z0,F.x1,F.z1,preset.fineStep,heightAt,null,false),M.terrain),
        far=new THREE.Mesh(grid(-E,-3000,E,1200,tp.coarseStep,natural,inF,true),M.terrain);fine.receiveShadow=true;far.receiveShadow=false;g.add(fine,far);return g}};
}
