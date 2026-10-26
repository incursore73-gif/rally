// Ambientazioni: forma del terreno, colori, vegetazione, atmosfera e stile del percorso.
export const THEMES={
 alpine:{road:{style:'switchback'},terrain:{},pal:{gr:'#566b3a',me:'#7d8a55',sc:'#8d8a7e',ro:'#77746d',dk:'#55524c',sn:true,snow:'#eef2f6',hz:'#93a5bd'},
  veg:{type:'conifer',density:1,treeLine:true,hsl:[.27,.33,.35,.5,.7,1.15]},rock:0x8b8780,gorgeK:1},
 forest:{road:{style:'meander',length:2300,cx:0,xHalf:150,wild:.5,maxTurn:.6,step:40},terrain:{baseSlope:.14,noiseAmp:34,ridgeAmp:120,wallX:380,wallK:.35},
  pal:{gr:'#2f4a2c',me:'#3e5c37',sc:'#6a6a5a',ro:'#5d5b55',dk:'#403f3a',sn:false,hz:'#8fa59c'},
  veg:{type:'conifer',density:1.6,treeLine:false,hsl:[.3,.36,.3,.45,.45,.85]},rock:0x6d6b64,tint:{c:'#9fb5ab',k:.3},fogK:.6,gorgeK:.25},
 canyon:{road:{style:'meander',length:2100,cx:0,xHalf:100,wild:.9,maxTurn:.8,step:32},terrain:{baseSlope:.12,noiseAmp:16,ridgeAmp:200,terrace:14,wallX:210,wallK:1},
  pal:{gr:'#b08a5a',me:'#c79a62',sc:'#b9774e',ro:'#a4553a',dk:'#7a3b2a',sn:false,hz:'#d8b08c',strata:.22,strataF:2.2},
  veg:{type:'shrub',density:.35,treeLine:false,hsl:[.09,.15,.3,.45,.42,.65]},rock:0xa8573b,tint:{c:'#f0c08a',k:.28},fogK:1.1,gorgeK:.8},
 coast:{road:{style:'meander',length:2500,cx:90,xHalf:70,wild:.45,maxTurn:.55,step:42},terrain:{baseSlope:.05,noiseAmp:24,ridgeAmp:60,wallX:300,wallK:.18,sea:{x0:150,x1:430,drop:170}},
  pal:{gr:'#7d8a52',me:'#a3a064',sc:'#cfc7a8',ro:'#c8c1b0',dk:'#8b8678',sn:false,hz:'#9ec0d8',sand:'#e6d9b0'},
  veg:{type:'pine',density:.55,treeLine:false,hsl:[.24,.3,.3,.45,.45,.8]},rock:0xcfc8b8,tint:{c:'#bfe0f2',k:.2},fogK:1.2,gorgeK:.6},
 autumn:{road:{style:'meander',length:2400,cx:0,xHalf:160,wild:.5,maxTurn:.6,step:40},terrain:{baseSlope:.1,noiseAmp:42,ridgeAmp:80,wallX:420,wallK:.3},
  pal:{gr:'#8a8a3a',me:'#a89a42',sc:'#7b6a4a',ro:'#7a7468',dk:'#5a5248',sn:false,hz:'#c4c8a8'},
  veg:{type:'broadleaf',density:1.2,treeLine:false,hsl:[.02,.13,.7,.85,.38,.55]},rock:0x7e776b,tint:{c:'#ffd9a0',k:.22},fogK:.9,gorgeK:.2}
};
