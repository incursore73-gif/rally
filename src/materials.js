import * as THREE from 'three';
const dom=typeof document!=='undefined';
function tex(w,h,draw,rep){if(!dom)return null;const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;if(rep)t.repeat.set(rep[0],rep[1]);return t}
const grain=(g,w,h,n,a)=>{for(let i=0;i<n;i++){const v=Math.random()<.5?0:255;g.fillStyle=`rgba(${v},${v},${v},${Math.random()*a})`;g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2)}};
// ext: {asphalt:{map:'assets/textures/asphalt_diff.jpg',repeat:[1,1]}, ...} (opzionale; se manca il file resta il materiale procedurale)
export function createMaterials(preset,ext={},surface='asphalt'){
  const mk=(o,r=.9,m=0)=>preset.lambert?new THREE.MeshLambertMaterial(o):new THREE.MeshStandardMaterial({roughness:r,metalness:m,...o});
  const gravel=surface==='gravel';
  const asphaltTex=gravel?tex(256,256,(g,w,h)=>{g.fillStyle='#8a7a62';g.fillRect(0,0,w,h);for(let i=0;i<5200;i++){g.fillStyle=`rgba(${Math.random()<.5?'70,52,32':'215,196,160'},${.1+Math.random()*.25})`;g.beginPath();g.arc(Math.random()*w,Math.random()*h,.6+Math.random()*1.8,0,7);g.fill()}g.fillStyle='rgba(60,45,30,.22)';g.fillRect(w*.28,0,w*.1,h);g.fillRect(w*.62,0,w*.1,h)}):tex(256,256,(g,w,h)=>{g.fillStyle='#3a3c40';g.fillRect(0,0,w,h);grain(g,w,h,5000,.12);g.strokeStyle='rgba(0,0,0,.35)';
    for(let i=0;i<5;i++){g.beginPath();let x=Math.random()*w,y=Math.random()*h;g.moveTo(x,y);for(let j=0;j<6;j++){x+=(Math.random()-.5)*60;y+=(Math.random()-.2)*60;g.lineTo(x,y)}g.stroke()}
    g.fillStyle='rgba(20,20,22,.18)';g.fillRect(w*.3,0,w*.1,h);g.fillRect(w*.62,0,w*.1,h)});
  const detail=tex(128,128,(g,w,h)=>{g.fillStyle='#bdbdbd';g.fillRect(0,0,w,h);grain(g,w,h,2500,.25)});
  const M={
    asphalt:mk({color:asphaltTex?0xffffff:(gravel?0x8a7a62:0x3a3c40),map:asphaltTex,side:THREE.DoubleSide},.82),
    shoulder:mk({color:0x6f6a5c,side:THREE.DoubleSide},1),
    line:mk({color:0xe8e8e0,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2},.7),
    terrain:mk({vertexColors:true,map:detail,side:THREE.DoubleSide},1),
    rock:mk({color:0x8b8780,flatShading:true},1),
    tree:mk({vertexColors:true},1),
    rail:mk({color:0xb8bcc2,side:THREE.DoubleSide},.45,.6),
    post:mk({color:0x8a8e94},.6,.4),
    wall:mk({color:0x8e8a82,flatShading:true},1),
    sign:mk({color:0xf2c200},.6),
    delin:mk({color:0xf4f4f0},.7)
  };
  if(typeof TextureLoader!=='undefined'||dom){for(const k in ext){const m=M[k];if(!m||!ext[k].map)continue;
    new THREE.TextureLoader().load(ext[k].map,t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;m.map=t;m.color.set(0xffffff);m.needsUpdate=true},undefined,()=>console.info('texture non trovata, uso materiale procedurale:',ext[k].map))}}
  M.dispose=()=>{for(const k in M){const m=M[k];if(m&&m.dispose){m.map&&m.map.dispose();m.dispose()}}};
  return M;
}
