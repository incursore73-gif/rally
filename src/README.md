# Alpine Drift 3D – modulo ambiente alpino

Passo alpino procedurale (Three.js 0.160, WebGL, moduli ES). Nessun backend, nessun build: solo file statici.
1 unità = 1 metro. Il modulo ambiente è separato da auto GLB e fisica di guida.

## Avvio locale
I moduli ES richiedono HTTP (non `file://`):
```bash
cd alpine-drift-3d
npx http-server -c-1 .        # oppure: python3 -m http.server 8000
```
Apri `http://localhost:8080` (o 8000). Parametro `?preset=perf` per partire in modalità PERFORMANCE.
Da smartphone sulla stessa rete: usa l'IP del computer; per WebGL serve un browser recente (Chrome su Android).

## Pubblicazione su GitHub Pages
1. Crea un repository e carica tutti i file (esclusa `node_modules`).
2. Settings → Pages → Source: *Deploy from a branch* → branch `main`, cartella `/ (root)`.
3. Dopo il deploy apri `https://<utente>.github.io/<repo>/` (HTTPS, come richiesto da WebGL su mobile).
Three.js è caricato da jsDelivr (versione fissata 0.160.0, vedi `importmap` in `index.html`).

## Comandi nella pagina
Tour (camera che percorre la strada) · Abitacolo · Libera (OrbitControls, trascina/pizzica) · cursore Posizione (salta lungo la strada) · Ora del giorno · Velocità del tour · HIGH/PERF · Nuovo seed.
Il riquadro in alto mostra FPS misurati sul dispositivo, triangoli e draw call letti da `renderer.info`. Se HIGH resta sotto 40 FPS per ~3 s passa automaticamente a PERFORMANCE.

## API (`createEnvironment(scene, renderer, config)`)
| Funzione | Descrizione |
|---|---|
| `regenerate(patch)` | Rigenera con parametri modificati (libera le risorse GPU precedenti) |
| `setPreset('HIGH'\|'PERFORMANCE')` | Cambia preset e rigenera |
| `getRoadPoint(s)` | `{position, tangent, normal, grade, width}` a distanza `s` dall'inizio |
| `getTerrainHeight(x,z)` / `getRoadHeight(x,z)` | Quota del terreno finale / della strada più vicina |
| `isOnRoad(x,z,margin)` | `{onRoad, onShoulder, distance, lateral, s, roadY}` |
| `getStart()` / `getResetPoint(x,z)` | Posizione, tangente e `yaw` sicuri sulla corsia destra |
| `getCameraAnchor(s,{mode:'chase'\|'cockpit'})` | `{position, lookAt}` |
| `guardrails`, `landmarks`, `roadWidth`, `roadLength` | Dati per il gioco (tratti di guardrail, tornanti) |
| `setTimeOfDay(h)`, `setSunIntensity(v)`, `update(camera, focus)`, `dispose()` | Luce, ombre, pulizia |

## Parametri principali (`src/config.js`)
`seed`, `road.width`, `road.shoulder`, `road.hairpins`, `road.radiusMin/Max`, `road.legMin`, `road.xRange`, `road.maxGrade`,
`terrain.baseSlope`, `terrain.noiseAmp`, `terrain.cliffSlope`, `terrain.gorge`, `rails.dropMin`, `sun.hour`, `render.preset`; preset in `PRESETS`.
Texture PBR esterne (opzionali): `createEnvironment(scene, renderer, {textures:{asphalt:{map:'assets/textures/asphalt_diff.jpg'}}})`; se il file manca si usa il materiale procedurale.

## Verifica
`npm i && npm test` esegue in Node controlli geometrici (continuità, 8+ tornanti, pendenza, assenza di attraversamenti, terreno sotto la carreggiata, precipizi, API). **Non verifica il rendering WebGL né i FPS**: quelli vanno misurati sul telefono.
