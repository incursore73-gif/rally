# Guida: pubblicare Rally 3D su GitHub con GitHub Desktop

Risultato finale: il gioco online su `https://TUO-UTENTE.github.io/rally-alpine-3d/`, apribile anche dal telefono.

## 0. Che cosa serve
- Un account GitHub gratuito (https://github.com/signup).
- GitHub Desktop (https://desktop.github.com) installato; al primo avvio **File → Options → Accounts → Sign in** e accedi.
- La cartella del progetto `rally-alpine-3d` con questi file nella **radice**:
  `index.html`, `game.js`, `explore.html`, `package.json`, `README.md`, `.gitignore`, `.nojekyll` e le cartelle `src/`, `tests/`, `assets/`.

## 1. Metti la cartella dove GitHub Desktop la trova
1. Copia l'intera cartella in `Documenti/GitHub/rally-alpine-3d` (Windows) o `~/Documents/GitHub/rally-alpine-3d` (macOS).
2. Apri la cartella e controlla che `index.html` sia **direttamente dentro** `rally-alpine-3d` (non dentro un'altra sottocartella con lo stesso nome). Se hai estratto uno ZIP, spesso c'è una cartella doppia: sposta i file di un livello in su.

## 2. Crea il repository locale
1. GitHub Desktop → **File → Add local repository…** → **Choose…** → seleziona `rally-alpine-3d` → **Add repository**.
2. Compare l'avviso *"This directory does not appear to be a Git repository"*: clicca **create a repository**.
3. Nome: `rally-alpine-3d`. Description: libera. **Git ignore: None** (il file `.gitignore` c'è già). License: None. Clicca **Create repository**.

## 3. Primo commit
1. Nel pannello sinistro vedi l'elenco dei file modificati (spunta tutti).
2. In basso, *Summary*: `Prima versione Rally 3D alpino`.
3. Clicca **Commit to main**.

## 4. Pubblica su GitHub
1. In alto clicca **Publish repository**.
2. Lascia il nome. **Togli la spunta da "Keep this code private"**: GitHub Pages gratuito funziona solo con repository pubblici.
3. Clicca **Publish repository**. Dopo qualche secondo il codice è su GitHub.

## 5. Attiva GitHub Pages
1. In GitHub Desktop: **Repository → View on GitHub** (si apre il browser).
2. **Settings → Pages** (menu a sinistra).
3. *Build and deployment* → **Source: Deploy from a branch**.
4. *Branch*: **main**, cartella **/ (root)** → **Save**.
5. Attendi 1–3 minuti e ricarica la pagina Settings → Pages: compare *"Your site is live at https://…github.io/rally-alpine-3d/"*.

## 6. Prova il gioco
- Apri l'indirizzo da Chrome (anche su Android). Il primo caricamento scarica Three.js dalla rete (jsDelivr), quindi serve la connessione.
- Tocca **Avvia**: l'audio parte solo dopo il primo tocco (regola dei browser).
- Se è lento: **⚙ → Qualità → Prestazioni** (meno oggetti, niente ombre).

## 7. Aggiornare il gioco in seguito
1. Sostituisci/modifica i file nella cartella del repository.
2. GitHub Desktop mostra le modifiche → scrivi un *Summary* → **Commit to main**.
3. Clicca **Push origin** (in alto). Pages si aggiorna in 1–2 minuti.
4. Se il telefono mostra ancora la versione vecchia, in `index.html` cambia `game.js?v=1` in `game.js?v=2` (forza il download) oppure svuota la cache del browser.

## 8. Problemi comuni
| Sintomo | Causa e rimedio |
|---|---|
| Pagina bianca / errore 404 | `index.html` non è nella radice del repository (cartella doppia). Sposta i file un livello più in su e fai commit + push. |
| Funziona online ma non facendo doppio clic su `index.html` | Normale: i moduli ES richiedono HTTP. In locale usa `npx http-server -c-1 .` oppure l'estensione *Live Server* di VS Code. |
| "Publish repository" non permette Pages | Il repository è privato: Settings → General → *Danger Zone* → *Change visibility* → Public. |
| Dopo il push non cambia nulla | Aspetta 2 minuti (Actions → *pages build and deployment* deve essere verde) e ricarica con Ctrl+F5 / cache svuotata. |
| Errore su file maiuscole/minuscole | GitHub distingue `Game.js` da `game.js`: tieni i nomi esattamente come in `index.html`. |
| Schermo nero con errore `three` | Controlla la connessione/blocchi di jsDelivr; aprendo la console (F12) vedi l'URL non raggiunto. |

## 9. Verifica automatica (facoltativa, sul PC)
Installa Node.js, poi nella cartella: `npm install` e `npm test` (controlla geometria della strada e fa giocare un autopilota; non misura FPS né il rendering WebGL).
