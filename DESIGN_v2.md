# PROD-EX v2 - Progetto di redesign

Obiettivo: rendere il gioco chiaro e immediato (senza istruzioni), con flusso guidato, e aggiungere profondita' nel tempo (storico, progressione, export). Estetica 16bit pixel invariata. Resta single-file cross-platform, deployabile su GitHub Pages.

## Decisioni (2026-06-17)

- Flusso: tre fasi guidate (Pianifica -> Concentrati -> Bilancio), una sola azione evidente per volta.
- Profondita': storico/export + progressione del planeswalker (XP, livelli, medaglie).
- Dati: export CSV (analisi in R/Excel) + JSON (backup completo) + import JSON (cross-device).

## Flusso a tre fasi

### 1. Pianifica (apertura giornata)
Schermata pulita: aggiungi le Prove della giornata (testo + difficolta' 1-3). Lista ordinabile. Azione primaria unica: "Inizia la giornata". Suggerimento automatico di ordine (Eisenhower integrato): le Prove piu' rapide o prioritarie in cima, modificabile.

### 2. Concentrati (loop di lavoro)
Il cuore. Una sola Prova in evidenza (il bersaglio corrente) + Pomodoro grande al centro.
- Scegli o accetta la Prova suggerita, avvia il Pomodoro (durata configurabile). Puoi saltare liberamente a un'altra Prova quando vuoi: il suggerimento e' solo una guida, non un vincolo.
- Durante il blocco: timer, eventuali Distrazioni entrano con un timer in blocchi.
- A fine Pomodoro: si sblocca l'Avanzamento. Le Focus Land si stappano, generi Focus, e giochi le carte di progresso (Pomodoro Strike, Flow State) per far avanzare la Prova. Le carte appaiono solo quando sono giocabili.
- Gestisci le Distrazioni con Focus / Time Block / Recovery.
- Avanti finche' superi tutte le Prove o scegli "Chiudi la giornata".
Principio: la prossima azione e' sempre una sola e ben evidente.

### 3. Bilancio (chiusura giornata)
Riepilogo: Prove superate/affidate/non finite, pomodori, minuti di focus, Distrazioni gestite/esplose, esito (vinta/persa/chiusa), XP guadagnati e medaglie sbloccate. Campo note libero. La giornata viene salvata nello storico ed e' esportabile.

## Regole (riuso del motore v1)

Invariate nella sostanza: 9 carte (3 Focus Land + 6 Azioni), Focus guadagnato completando Pomodori reali, Vigore eroso dalle Distrazioni, vittoria = cammino completato. Le carte vengono riorganizzate per fase (planificazione vs avanzamento) invece di stare tutte insieme.

## Progressione

- XP: +10 per Pomodoro completato, +5 x difficolta' per Prova superata, +25 per giornata vinta, bonus serie.
- Livelli: soglie crescenti, con titoli del planeswalker per fascia (es. Apprendista, Evocatore, Arcanista, Maestro del Tempo). HUD mostra livello + barra XP.
- Medaglie iniziali: Prima luce (1a vittoria), Serie x3/x5/x10 (giorni consecutivi), Maratoneta (8 pomodori in un giorno), Domatore di colossi (10 Prove diff.3), Zen (giornata con 0 distrazioni esplose), Centurione (100 pomodori totali), Stratega (3 Time Block in un giorno).

## Storico e dati

Record giornata (JSON):
data, giorno_settimana, prove [{testo, difficolta', esito}], prove_totali, prove_superate, pomodori, minuti_focus, focus_generato, focus_speso, distrazioni_gestite, distrazioni_esplose, esito, livello_fine, xp_fine, note.

Viste storico: heatmap ultimi giorni (verde vinta, rosso persa, giallo chiusa/parziale, grigio nessuna), metriche cumulate (giornate vinte, serie attuale e record, pomodori totali, minuti focus, Prove superate), lista giornate espandibile.

Export/Import:
- CSV: una riga per giornata (per analisi in R/Excel).
- JSON: backup completo (tutte le giornate, progressione, medaglie).
- Import JSON: ripristina/sposta i dati tra dispositivi (localStorage e' per-dispositivo).
- Azzera storico con conferma.

## Architettura tecnica

- `game-core.js` - motore di regole della partita (esteso dal v1).
- `progression.js` - XP, livelli, medaglie (puro, testabile).
- `history.js` - persistenza giornate, export CSV/JSON, import (testabile con shim storage).
- `game-ui.js` - rende le tre fasi, dashboard, storico.
- `index.html` - markup + stile pixel 16bit (riordinato).
- `test/` - unit per core, progression, history + smoke DOM.

Vincoli mantenuti: universale Win/Mac/Linux, nessun em dash, zero asset di terzi (no copyright), Press Start 2P/VT323 via Google Fonts con fallback, audio WebAudio, persistenza localStorage.

## Fuori scope v1

Integrazione automatica con Todoist (richiede backend/token, non fattibile su pagina statica pura): valutabile in futuro. Per ora le Prove si inseriscono a mano (o si importano via JSON).
