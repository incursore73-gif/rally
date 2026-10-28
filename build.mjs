// Crea index.html a FILE SINGOLO: shell.html + moduli (bundle esbuild) + game.js incorporato. Three.js resta da CDN (importmap).
import {build} from 'esbuild';import fs from 'node:fs';
const r=await build({entryPoints:['src/boot.js'],bundle:true,format:'esm',write:false,target:'es2022',external:['three','three/addons/*'],legalComments:'none'});
const boot=r.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const game=JSON.stringify(fs.readFileSync('game.js','utf8')).replace(/<\/script/gi,'<\\/script').replace(/<!--/g,'<\\!--');
const html=fs.readFileSync('shell.html','utf8').replace('<!--BOOT-->',`<script>window.__GAME_SRC__=${game};</script>\n<script type="module">\n${boot}</script>`);
fs.writeFileSync('index.html',html);console.log('index.html',(html.length/1024).toFixed(0)+' KB');
