# Guida: aggiornare Alpine Drift 3D sul tuo sito GitHub

Il gioco è già online su **https://incursore73-gif.github.io/rally/** (GitHub Pages, deploy
automatico dal branch `principale`). Quando fai commit + push su quel branch, il sito si
aggiorna da solo in 1–3 minuti: non serve toccare le impostazioni di Pages.

## Cosa caricare (e cosa NO)

| File / cartella | Caricare? | Perché |
|---|---|---|
| `index.html`, `game.js` | **SÌ** | il gioco vero (l'auto GLB e la musica vengono cercate accanto a `index.html`) |
| `auto.glb`, `musica.mp3` | **SÌ** | richiesti da `index.html` |
| `shell.html`, `boot.js`, `build.mjs`, `src/`, `tests/`, `package.json`, `package-lock.json` | **SÌ** | i sorgenti: ora che ci sono, la build e i test (`npm run build`) tornano a funzionare |
| `README.md`, `GUIDA_*.md`, `.gitignore`, `.nojekyll`, `explore.html` | **SÌ** | documentazione e sviluppo, a costo zero |
| `node_modules/` | **NO** | dipendenze di sviluppo (centinaia di MB). Il `.gitignore` la esclude da sola: se la copi per sbaglio non finirà nel commit |
| `assets/models/auto.glb` (doppione) | facoltativo | non è richiesta dal gioco: conviene tenere una sola copia del GLB (quella **in radice**, quella che usa `index.html`) e risparmiare 3,6 MB |
| `_headers_per_netlify.txt` | indifferente | serve solo per pubblicare su Netlify |

## Come fare, con GitHub Desktop — 5 passi

### 1. Clona il repo esistente in locale (una volta sola)
1. Apri **GitHub Desktop** → menu *File* → *Clone repository* → scheda **URL**
2. URL: `https://github.com/incursore73-gif/rally`
3. Local path: una cartella semplice, es. `Documenti\GitHub\rally` → **Clone**
4. Fatto questo, GitHub Desktop terrà il repo nella lista dei tuoi: i prossimi aggiornamenti
   partiranno dal passo 2.

> Nota importante: la tua cartella attuale (`Progetto predefinito`) **non è un repository git**.
> Lavora e sincronizza sempre sulla cartella clonata: così su GitHub si accumula lo storico
> delle versioni, come i salvataggi di un gioco.

### 2. Porta nel clone i file aggiornati
1. Nel progetto (`Progetto predefinito`) copia tutto (Ctrl+A, Ctrl+C) —
   abilita prima in Esplora risorse "Mostra elementi nascosti", perché vengano
   copiati anche `.gitignore` e `.nojekyll`.
2. Incolla nel clone sovrascrivendo (Ctrl+A, Ctrl+V) → "Sostituisci i file di destinazione".
3. Nel clone **elimina** i file superati, se ancora presenti:
   - `glb.mjs` alla radice (ora vive in `tests\glb.mjs`)
   - facoltativo: `assets\models\auto.glb` (doppione)
4. Se hai copiato `node_modules\` per sbaglio, lasciala stare: il `.gitignore` impedisce il
   commit. Nel clone la ricrea `npm install`, eseguita **una volta sola**.

### 3. Commit su GitHub Desktop
1. GitHub Desktop ti mostra le modifiche (a sinistra i file cambiati, a destra le differenze:
   verde = aggiunte, rosso = rimossi)
2. In *Summary* scrivi un titolo riconoscibile, es. `Alpine Drift 3D: sorgenti recuperati e rebrand`
3. Clicca **Commit to main** (se il tuo browser lo traduce "Commit nel ramo principale" è la
   stessa cosa: il branch si chiama `main`)

### 4. Pubblica (push)
Premi **Push origin** in cima alla finestra.

### 5. Verifica il sito aggiornato
1. Aspetta 1–3 minuti: il deploy "github-pages" parte da solo (lo vedi nella scheda
   **Actions** / "Azioni" della pagina del repo)
2. Apri `https://incursore73-gif.github.io/rally/` e fai **Ctrl+F5** (o Ctrl+Shift+R):
   senza ricarica forzata vedi la vecchia pagina per via della cache!
3. Controlli rapidi:
   - il titolo del tab è "**Alpine Drift 3D**"
   - l'auto in pista è la GLB (la livrea con lo sponsor), non quella arancione procedurale
   - `https://incursore73-gif.github.io/rally/index.html?glb=off` mostra il modello
     procedurale di ripiego (test del fallback)

## Problemi comuni

| Sintomo | Causa / rimedio |
|---|---|
| Il sito mostra ancora il vecchio titolo | cache del browser: Ctrl+F5, oppure apri una finestra in incognito |
| Dopo il push il sito non si aggiorna | guarda la scheda **Actions** del repo: se il deploy è in errore, lì trovi il motivo. Altrimenti Settings → Pages → Branch `principale`, cartella `/ (root)` |
| L'auto non si carica e appare "modello integrato" | `auto.glb` non è nella radice del deployment: controlla che `https://.../rally/auto.glb` risponda (aprilo nel browser) |
| GitHub Desktop dice "This directory does not contain a git repository" | stai guardando la cartella PROGETTO (non è un repo): usa la cartella CLONE |
| Il pulsante "Push origin" è grigio | non c'è niente di nuovo da inviare: sei già aggiornato |

## Aggiornamenti dei giorni successivi

1. Lavora sui file **nel clone** (`Documenti\GitHub\rally`)
2. **Abitudine pro**: se tocchi `src/`, `shell.html` o `game.js`, rigenera l'`index.html`
   a file singolo con `npm run build` (in un PC nuovo, la prima volta: prima `npm install`)
3. GitHub Desktop → Summary → **Commit to main** → **Push origin**
4. Ctrl+F5 sul sito: aggiorna la cache. Fine! ✨
