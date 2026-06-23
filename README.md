# PROD-EX v2.0

**Un gioco di carte fantasy in pixel art, alimentato dalla produttività reale.**

Il tuo lavoro vero (minuti di concentrazione) diventa *essenza*. Con l'essenza **forgi carte** sempre più potenti, **costruisci un mazzo** e **scali La Torre** in battaglie a turni stile Hearthstone. Più lavori, più forte diventa il mazzo, più in alto sali.

> Il deck-building **è** la produttività: il gioco vero (le battaglie) è il banco di prova di quanto hai costruito, giorno dopo giorno.

## Come giocare

È una web app a pagina singola, senza build e senza server.

- **Online**: apri la pagina pubblicata con GitHub Pages.
- **In locale**: apri `index.html` in un browser (oppure servi la cartella, es. `python3 -m http.server` e vai su `http://localhost:8000`).

I progressi si salvano automaticamente nel browser (`localStorage`). Dal pulsante **SALVA** ottieni un codice testuale per esportare/importare la partita su un altro dispositivo.

## Installa come app

PROD-EX è una **PWA**: puoi installarlo come app a tutto schermo, con icona.

- **iPhone / iPad (Safari)**: apri la pagina → tocca *Condividi* → **Aggiungi a Home**.
- **Mac / Windows (Chrome o Edge)**: apri la pagina → icona **Installa** nella barra degli indirizzi (o menu ⋮ → *Installa PROD-EX*).
- **Android (Chrome)**: menu → *Installa app* / *Aggiungi a schermata Home*.

## Il ciclo di gioco

```
lavoro reale → essenza → forgi carte → costruisci il mazzo → combatti nella Torre → sali di piano
```

### 🔥 Il Crogiolo (produttività)
L'unica stanza che tocca il mondo reale. Accumuli minuti di focus in tre modi:
- **Forgia** — blocco a durata scelta (1–60 min)
- **Brace** — cronometro libero
- **Offerta** — importi minuti tracciati altrove

Ogni minuto = 1 essenza. Puoi **categorizzare** il tempo (categorie personalizzabili) e gestire una **lista di task** con i minuti necessari, che si barrano man mano che li completi. Opzionale: ticchettio del timer.

### 📜 Il Grimorio (collezione + mazzo)
- **Collezione** — forgi carte a **rarità crescente** (Comune → Rara → Epica → Leggendaria): più essenza investi, più potenti le carte.
- **Mazzo** — selezioni le carte (max 2 copie, 1 se Leggendaria) con cui combatti. La **potenza del mazzo** determina quanti piani della Torre puoi affrontare.

### 🗼 La Torre (battaglia)
Battaglia a turni stile Hearthstone, tutta a tap:
- mana crescente, creature con attacco/vita, magie
- parole chiave: **Impeto** (attacca subito), **Provocazione** (va colpita per prima), inneschi
- stati chiari delle creature (pronta / attendi / stanca), numeri di danno animati, frantumazione alla morte
- vinci → ricompensa in essenza e piano sbloccato; perdi → torni più forte

### 📊 Il Diario
Statistiche di produttività: minuti oggi/totali, giorni di fila, grafico degli ultimi 14 giorni e ripartizione del tempo per categoria.

## La pipeline delle carte

Le illustrazioni sono **pixel art generata** (su un foglio con sfondo magenta) e poi convertite in **dati-pixel nel codice** (palette + griglia di indici): nessuna immagine importata a runtime.

```
sources/carte_sheet*.png  →  build_cards.py  →  cards_data.js + cards_art.json + gallery HTML
cards_art.json            →  export_pngs.py  →  cards_png/ + foglio A4 stampabile (PNG/PDF)
```

Per rigenerare (serve Python con Pillow + numpy):

```bash
pip install Pillow numpy
python3 build_cards.py    # rigenera i dati delle carte e la galleria
python3 export_pngs.py    # esporta i PNG singoli e il foglio A4
```

Per **espandere il set**: aggiungi un nuovo foglio in `sources/`, registra le carte in `META`/`RAR` dentro `build_cards.py`, e rilancia gli script.

## Struttura dei file

| File / cartella | Cosa contiene |
|---|---|
| `index.html` | il gioco (web app, identico a `PROD-EX_app_prototype.html`) |
| `cards_data.js` | dati delle carte (palette + pixel) usati dal gioco |
| `PROD-EX_carte_v2_gallery.html` | galleria di tutte le carte |
| `build_cards.py` | converte i fogli sorgente in dati-pixel |
| `export_pngs.py` | esporta carte PNG e foglio A4 stampabile |
| `sources/` | i fogli di sprite generati (sorgente delle carte) |
| `fonts/` | font pixel (Pixelify Sans, Press Start 2P) per l'export PNG |
| `cards_png/`, `PROD-EX_carte_v2_A4.*` | carte stampabili generate |

## Tecnologia

HTML/CSS/JavaScript vanilla, nessuna dipendenza a runtime, nessun build step. Audio retro generato con la Web Audio API. Salvataggio in `localStorage`. I font del gioco arrivano da Google Fonts via CDN.

## Autore

Creato da **Enrico D'Ambrosio** — GitHub [@enricodam](https://github.com/enricodam).

## Licenza

[MIT](LICENSE) © 2026 Enrico D'Ambrosio. I font sono di proprietà dei rispettivi autori (Open Font License).
