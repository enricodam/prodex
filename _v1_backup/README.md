# PROD-EX: The Workday Standoff

Microgioco solitario di gamification della produttivita', in stile retrogaming 16-bit e con atmosfera fantasy alla Magic: The Gathering. Sei un planeswalker in viaggio: la tua giornata e' un'avventura e ogni attivita' reale e' una Prova lungo il cammino. Il lavoro vero supera la Prova, la carta e' solo il segnavia. Il vero avversario non e' la tua giornata, ma la Distrazione (l'entropia che ti rallenta).

Tutto originale: frame, sprite pixel-art, simboli e nomi sono disegnati da zero, nessun asset o marchio di terzi.

## Come si gioca

1. **Aggiungi le attivita'** della tua giornata: ognuna diventa una **Prova** con una *difficolta'* 1-3 (lo sforzo richiesto).
2. **Scegli un bersaglio** e avvia un **Pomodoro** (25 min di lavoro vero, configurabile).
3. Quando il Pomodoro finisce, le **Focus Lands** si stappano e si apre la **finestra danno**: ora puoi tappare le land per generare Focus e giocare le carte Azione sul task su cui hai davvero lavorato.
4. **Pomodoro Strike** (1 progresso) e **Flow State** (3 progresso) fanno avanzare la Prova. A difficolta' zero, la Prova e' superata e lascia il cammino.
5. Il cammino ha ostacoli: ogni paio di blocchi entra una **Distrazione** (Slack, email, context switch) con un timer. Se la ignori esplode e ti toglie **Vigore** o complica una Prova (scope creep). Gestiscila con 1 Focus, con **Time Block** (protezione) o con **Recovery**.
6. **Vittoria:** cammino completato prima che il Vigore arrivi a zero. Le vittorie si accumulano.

La regola psicologica chiave: le carte danno si giocano SOLO dopo un Pomodoro reale. Il gioco non simula il lavoro, lo premia.

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
npm test         # logica core (node) + smoke test DOM (jsdom)
```

- `game-core.js` motore di regole puro, senza DOM (gira anche in Node)
- `game-ui.js` rendering pixel-art su canvas, Pomodoro, audio, persistenza
- `index.html` markup e stile
- `test/test-core.js` unit test del motore (28 casi)
- `test/smoke-dom.js` smoke test dell'interfaccia (jsdom)

## Struttura

```
prodex-game/
  index.html
  game-core.js
  game-ui.js
  test/
    test-core.js
    smoke-dom.js
  package.json
  README.md
  LICENSE
```

## Licenza

MIT (vedi LICENSE). Sprite, regole e codice sono originali.

Enrico D'Ambrosio · progetto personale (hobby). Contatti: [aggiungi qui email o handle GitHub]
