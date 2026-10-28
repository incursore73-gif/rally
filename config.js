// Parametri modificabili. 1 unità Three.js = 1 metro.
export const DEFAULTS={
  seed:7,theme:'alpine',
  road:{minRadius:12,minLength:1800,surface:'asphalt',width:6.5,shoulder:1.2,hairpins:10,radiusMin:12,radiusMax:18,legMin:90,xRange:[-170,170],legTilt:[4,9],
        maxGrade:0.11,smoothWindow:110,sampleStep:2},
  terrain:{terrace:0,wallX:330,wallK:0.5,baseSlope:0.3,noiseAmp:26,ridgeAmp:260,fineMargin:120,coarseStep:40,coarseExtent:2600,
           cliffSlope:1.7,cutSlope:1.15,gorge:26,influence:90,skirt:45},
  rails:{dropMin:2.2,postSpacing:4,offset:0.85},
  veg:{minRoadDist:9},
  sun:{hour:15.5,intensity:1},
  render:{preset:'HIGH'}
};
export const PRESETS={
  HIGH:{pixelRatio:1.5,shadows:true,shadowMap:1024,fineStep:3.5,trees:{near:2400,far:2600},rocks:900,fogFar:5200,far:7000,lambert:false},
  PERFORMANCE:{pixelRatio:1,shadows:false,shadowMap:512,fineStep:5,trees:{near:900,far:900},rocks:350,fogFar:3200,far:4500,lambert:true}
};
export function merge(a,b){const o=Array.isArray(a)?[...a]:{...a};for(const k in b){o[k]=b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])?merge(a[k]||{},b[k]):b[k]}return o}
