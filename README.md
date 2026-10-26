# Rally 3D – Passo alpino

Gioco di rally in terza persona con la giocabilità originale (fisica con derapate e freno a mano, fantasma, settori, copilota vocale, replay con camera TV, medaglie, danni, meteo, ora del giorno, controlli touch in orizzontale) sopra l'ambiente alpino 3D procedurale (Three.js r160, moduli ES).

- `index.html` – pagina, importmap di Three.js e caricamento di `game.js`.
- `game.js` – logica di gioco e rendering (script classico). Usa `window.ALPINE.createEnvironment`.
- `src/` – ambiente alpino: `environment.js` (API e atmosfera), `road.js`, `terrain.js`, `vegetation.js`, `materials.js`, `config.js`, `noise.js`.
- `explore.html` + `src/main.js` – esplorazione libera dell'ambiente senza gioco.
- `tests/` – `verify.mjs` (geometria dell'ambiente) e `play.mjs` (partite simulate headless).
- Pubblicazione: vedi `GUIDA_GITHUB_DESKTOP.md`.

## Controlli
Touch (orizzontale): pedale gas e freno a mano a sinistra, volante a destra (posizione orizzontale del dito, fondo corsa a 90 px, regolabile in ⚙). Tastiera: frecce/WASD e barra spaziatrice per il freno a mano. 🎥 cambia vista (chase, cofano, paraurti), ⚙ apre le impostazioni (voce, musica, ombre, meteo, ora, qualità, sterzo).

## Ambientazioni (`src/themes.js`)
`alpine` (tornanti in quota), `forest` (foresta nordica con nebbia), `canyon` (gradoni rossi, arbusti), `coast` (scogliera sul mare), `autumn` (colline con alberi d'autunno). Ogni prova sceglie `alp.th` in `ST`; le ambientazioni diverse da `alpine` usano percorsi sinuosi (`road.style:'meander'`).

## Come sono collegati ambiente e gioco
Le 10 prove usano strade alpine generate da seed (`ST[i].seed`, `alp.h` = numero di tornanti, `alp.hr` = ora, `alp.rn` = pioggia). Il tracciato di gioco è la linea d'asse della strada ricampionata ogni 18 unità (1 unità = 0,06 m); la quota del terreno per l'auto è letta dalla stessa mesh visibile; alberi e rocce vicino alla strada sono anche gli ostacoli; i guardrail respingono l'auto; sugli sterrati ci sono rampe e salti.
