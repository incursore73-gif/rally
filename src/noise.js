// Rumore deterministico (value noise + fbm + ridged) e PRNG con seed.
export function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function makeNoise(seed){
  const hash=(x,y)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed|0,2147483647);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
  const sm=t=>t*t*(3-2*t);
  const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),u=sm(x-xi),v=sm(y-yi),a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
  const fbm=(x,y,o=5)=>{let s=0,a=.5,f=1,n=0;for(let i=0;i<o;i++){s+=a*(vn(x*f,y*f)*2-1);n+=a;a*=.5;f*=2}return s/n};
  const ridged=(x,y,o=5)=>{let s=0,a=.5,f=1,n=0;for(let i=0;i<o;i++){const v=1-Math.abs(vn(x*f,y*f)*2-1);s+=a*v*v;n+=a;a*=.5;f*=2.03}return s/n};
  return{vn,fbm,ridged,hash};
}
