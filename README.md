# PROD-EX: The Workday Standoff

Microgioco solitario di gamification della produttivita', in stile retrogaming 16-bit e con atmosfera fantasy alla Magic: The Gathering. Sei un planeswalker in viaggio: la tua giornata e' un'avventura e ogni attivita' reale e' una Prova lungo il cammino. Il lavoro vero supera la Prova, la carta e' solo il segnavia. Il vero avversario non e' la tua giornata, ma la Distrazione (l'entropia che ti rallenta).

Tutto originale: frame, sprite pixel-art, simboli e nomi sono disegnati da zero, nessun asset o marchio di terzi.

## Come si gioca (tre fasi guidate)

Il gioco ti accompagna passo-passo: c'e' sempre una sola azione evidente da fare.

1. **Pianifica.** Apri la giornata e inserisci le Prove (le attivita' reali) con la loro difficolta' 1-3. Poi premi "Inizia la giornata".
2. **Concentrati.** Il gioco mette una Prova in evidenza col Pomodoro al centro (puoi comunque saltare a un'altra Prova quando vuoi). Fai il lavoro vero: solo a Pomodoro finito si sblocca l'avanzamento. Tappi le Focus Lands per generare Focus e giochi le carte di progresso (Pomodoro Strike +1, Flow State +3) sulla Prova. Le Distrazioni arrivano con un timer: se le ignori esplodono e ti tolgono Vigore o complicano una Prova; le gestisci con Focus, Time Block o Recovery.
3. **Bilancio.** Chiudi la giornata: riepilogo (Prove superate, pomodori, minuti di focus, distrazioni, esito), XP guadagnati e medaglie sbloccate, campo note. Salvi tutto nello storico.

Vinci completando il cammino prima che il Vigore arrivi a zero. La regola psicologica chiave: le carte di progresso si giocano SOLO dopo un Pomodoro reale. Il gioco non simula il lavoro, lo premia.

## Progressione e storico

- **Progressione:** guadagni XP per ogni Pomodoro, Prova superata e giornata vinta; sali di livello (da Apprendista a Maestro del Tempo) e sblocchi medaglie (Prima luce, Maratoneta, Zen, Stratega e altre).
- **Storico:** ogni giornata si salva in locale e diventa una riga di storico, con heatmap della serie e metriche cumulate.
- **Export/Import:** esporti in **CSV** (per analizzare la tua produttivita' in R o Excel) e in **JSON** (backup completo); l'import JSON sposta i dati tra dispositivi, dato che il salvataggio del browser e' per-dispositivo.

## Le carte

**Focus Lands** (mana, si stappano a ogni nuovo blocco): Deep Work (+3), Quick Win (+1), Caffeine Rush (+2, una volta al giorno).

**Azioni** (costano Focus): Pomodoro Strike (1), Flow State (3), Time Block (2, protegge un task), Delegate (2, rimuove un task), Eisenhower Filter (1, suggerisce il bersaglio), Recovery (1, stappa una land o annulla una distrazione).

## Avvio

**In locale:** apri `index.html` con un doppio click in qualsiasi browser (Windows, macOS, Linux). Nessuna installazione. I task, le vittorie e le impostazioni si salvano nel browser (localStorage). Online (Google Fonts) il look pixel e' perfetto; offline degrada a un font monospace.

**Online (GitHub Pages):**

1. Crea un repo su GitHub e carica questi file.
2. Settings > Pages > Branch `main`, cartella `/root`, salva.
3. In un minuto il gioco e' su `https://TUO-UTENTE.github.io/NOME-REPO/`, giocabile da qualsiasi dispositivo.

## Sviluppo e test

La logica di gioco e' separata dalla UI per essere testabile.

```
npm install      # installa jsdom (solo per i test)
npm test         # core + progressione + storico + integrazione + smoke DOM
```

- `game-core.js` motore di regole della partita, senza DOM (gira anche in Node)
- `progression.js` XP, livelli, titoli, medaglie (puro, testabile)
- `history.js` persistenza giornate, aggregati, export CSV/JSON, import (puro)
- `game-ui.js` rendering pixel-art, tre fasi, Pomodoro, audio, storico
- `index.html` markup e stile
- `test/` test-core (28), test-meta (35), test-integration (16), smoke-dom (19)

## Struttura

```
prodex-game/
  index.html
  game-core.js
  progression.js
  history.js
  game-ui.js
  test/
    test-core.js
    test-meta.js
    test-integration.js
    smoke-dom.js
  package.json
  README.md
  LICENSE
  DESIGN_v2.md
```

## Licenza

MIT (vedi LICENSE). Sprite, regole e codice sono originali.

Enrico D'Ambrosio · progetto personale (hobby). Contatti: [aggiungi qui email o handle GitHub]
