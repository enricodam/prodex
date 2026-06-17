# PROD-EX - Modalita' Duello (design)

Nuova modalita' a carte tipo TCG, che **affianca** la modalita' Classica (v2, che resta intatta). Carte in pixel art originali (frame, simboli, nomi, arte miei: nessun trade dress di MTG).

## RIDISEGNO v2 (2026-06-18) - modello attuale (sostituisce le Tappe A/B/C precedenti)

Loop semplificato e piu' fedele a MTG, tema **accademia arcana** (stile "Nome del Vento"):

- **Niente setup separato ne' mappa.** Si entra in partita e si genera tutto durante il gioco.
- **Risorsa = Appunto di Studio.** Ogni Pomodoro reale completato crea un Appunto, **etichettato col task** che hai scritto. Gli Appunti sono il mana: rampano (restano sul tavolo) e si rinnovano ogni turno. Cosi' il "mana base" e' letteralmente il diario del tuo lavoro.
- **Durata variabile a bottoni** (non decisa all'inizio): ogni turno scegli 5/10/15/25 min -> 1/2/4/6 Appunti. Pomodori lunghi = piu' potere.
- **Creature**: parti con 5 creature in mano, peschi una carta a ogni turno (Pomodoro). Le evochi spendendo Appunti.
- **Gauntlet di boss**: affronti i nemici uno dopo l'altro (Compito in Classe -> Sessione d'Esami -> Demone della Procrastinazione -> La Scadenza -> Echi scalati). Battuto un boss arriva il successivo (piu' forte) + ricompensa carta. Creature, Appunti e Vigore persistono; piccolo riposo (+8 Vigore) tra un boss e l'altro.
- **Fine**: perdi quando il Vigore va a 0, oppure chiudi la giornata. A fine giornata vedi **quanti boss hai sconfitto**; il risultato va in storico e progressione condivisi con la Classica.
- **Combattimento completo** (attacco/blocco bidirezionale), come prima.
- **Meta** (carry-over della Tappa C): carte sbloccabili per livello (entrano nel pool ricompense), Rituali passivi scelti a inizio giornata (Mattiniero +1 Appunto/turno, Tempra +8 Vigore, Lettore Vorace +1 pescata/turno).

Architettura: `cards.js` (carte rethemed + BOSSES + APPUNTO_VALUE + unlocks/rituali), `duel-core.js` (motore Appunti + gauntlet), `card-render.js`, `duel-ui.js`, `duel.html`. `run-core.js` deprecato (mappa scontri abbandonata). Test: duel 32 + tappa C 15 + smoke v2; progetto a 161 test verdi. Bilanciamento: ~3-6 boss a giornata con gioco sensato (piu' lavori, piu' ne abbatti).

---

## (Storico) design precedente con mappa-scontri

## Concetto

Sei il planeswalker. L'avversario e' **La Giornata** (un boss: "La Scadenza" / "L'Entropia"), con il suo mazzo di Distrazioni. Lo affronti con un mazzo di carte tue (creature = Spiriti del Focus, piu' magie). Il gancio resta lo stesso: il duello avanza solo se lavori davvero. La carta amplifica e difende, il lavoro reale e' il colpo garantito.

## Gate del lavoro (non negoziabile)

Le risorse del duello arrivano SOLO dai Pomodori reali. Niente Pomodoro completato = niente mana, niente pescata, niente danno garantito. Il gioco di carte non si puo' "barare" saltando il lavoro.

## Risorse

- **Focus** = mana. Lo generi tappando le Focus Land dopo ogni Pomodoro completato.
- **Vigore** = i tuoi punti vita. Le Distrazioni del Boss lo erodono.
- **Vita del Boss** = somma delle difficolta' delle tue Prove reali del giorno (+ piccolo buffer). Cosi' la durata del duello = il tuo carico di lavoro reale.
- **Mazzo / Mano** = peschi 1 carta per ogni Pomodoro completato (piu' una mano iniziale).

## Struttura del turno (un turno = un ciclo Pomodoro)

1. **Upkeep:** stappi Focus Land e creature; il Boss mette in coda una Distrazione (telegrafata, vedi cosa sta per fare).
2. **Lavoro (la parte reale):** scegli una Prova e fai un Pomodoro vero. Al termine: +Focus, peschi 1 carta, e infliggi il **danno garantito** alla Vita del Boss (la Prova progredisce davvero).
3. **Main:** spendi Focus per giocare creature e magie.
4. **Combattimento:** le tue creature attaccano la Vita del Boss; la Distrazione in coda colpisce il tuo Vigore, a meno che una creatura difenda/blocchi.
5. **Fine:** controlli vittoria/sconfitta. Pausa (5 min) opzionale.

## Tipi di carta e set iniziale (originale, ~16 carte)

**Creature - Spiriti del Focus** (costo / potenza / costituzione / abilita'):
- Scintilla (1 / 1 / 1): quando entra, 1 danno al Boss.
- Guardiano del Flusso (3 / 2 / 3): Stap per +1 Focus; le Distrazioni costano 1 in piu' al Boss.
- Sentinella della Soglia (2 / 0 / 4): difensore, ottimo per bloccare.
- Colosso della Concentrazione (5 / 5 / 5): minaccia tardiva.
- Messaggero del Mattino (2 / 2 / 1): quando entra, peschi una carta.

**Magie - Azioni** (riuso e rinominate dal set attuale):
- Pomodoro Strike (1): 1 danno al Boss.
- Flow State (3): 3 danni al Boss.
- Time Block (2): una creatura prende +0/+3 e non puo' essere colpita questo turno.
- Delegate (2): annulla una Distrazione in coda.
- Eisenhower Filter (1): guarda le prossime 3 carte, scegli l'ordine.
- Recovery (1): +3 Vigore, oppure stappa una Focus Land.

**Focus Land** (base mana): Deep Work (+3), Quick Win (+1), Caffeine Rush (+2, una volta al giorno).

## Mazzo dell'avversario "La Giornata"

Gioca una carta a turno, scala con il turno:
- Slack Storm: 2 danni al Vigore.
- Riunione a Sorpresa: tappa 2 delle tue creature.
- Scope Creep: il Boss guadagna +2 Vita (un task si e' gonfiato).
- Email Valanga: scarti una carta.
- Burnout (tardiva): 3 danni al Vigore.

## Vittoria / sconfitta

- **Vinci** quando la Vita del Boss arriva a 0 (= hai smaltito il carico reale del giorno).
- **Perdi** se il Vigore arriva a 0 (troppe Distrazioni ignorate).
- A fine duello: stesso Bilancio della Classica (riepilogo, XP, medaglie, salvataggio nello storico). La progressione (livelli/medaglie) e lo storico sono **condivisi** tra le due modalita'.

## Collezione e progressione

Due opzioni da decidere (vedi domande):
- **Mazzo curato fisso:** parti col set sopra, equilibrato, zero gestione. Semplice.
- **Collezione sbloccabile:** sblocchi nuove carte salendo di livello (usa la progressione gia' esistente) e puoi comporre il mazzo. Piu' "vero TCG", piu' lavoro.

## Architettura tecnica

- `duel-core.js`: motore del duello puro e testabile (mazzo, mano, pescata, mana, board, IA del Boss, combattimento, vittoria/sconfitta). Sul modello di game-core.
- `cards.js`: dati del set (carte + arte: id sprite/scena).
- `card-render.js`: componente carta = canvas pixel (frame + illustrazione) + testo HTML nitido sopra. Riusa la pipeline pixel-art.
- `duel-ui.js`: schermata duello (mano, board, Boss, Pomodoro).
- Riuso: `progression.js`, `history.js`, sprite, audio, fasi Pomodoro.
- Test: unit del duel-core + smoke DOM, come per la v2.

## Convivenza con la Classica

Menu iniziale con due modalita'. Stessa estetica 16bit, stessa progressione e storico. La Classica resta il default consigliato per le giornate "solo lavoro"; il Duello per quando vuoi anche giocare.

## AGGIORNAMENTO (2026-06-17): roguelike deckbuilder + collezione + combattimento completo

Direzione scelta: il Duello diventa un **roguelike deckbuilder** alla Slay the Spire, con **collezione sbloccabile**, **deckbuilding** e **combattimento completo** stile MTG. Sempre con il gate del lavoro reale.

### Il "run" = la giornata
- Un run e' una mappa di **scontri** in sequenza. Gli scontri sono le tue **Prove reali** del giorno; l'ultimo e' il **boss** ("La Scadenza").
- Vinci il run completando tutti gli scontri (= smaltendo il carico reale). Perdi se il Vigore arriva a 0.

### Combattimento completo (stile MTG)
- Evochi **creature** (Spiriti del Focus) con potenza/costituzione, spendendo Focus.
- Il nemico telegrafa la sua mossa (intent): tu **dichiari attaccanti e bloccanti** ogni turno. Danno da combattimento bidirezionale, creature che muoiono, ecc.
- Magie istantanee/stregonerie per rimuovere, potenziare, curare.

### Gate del lavoro (da confermare la mappatura)
- Proposta: **1 Pomodoro reale completato = 1 turno di combattimento** (ti da' Focus + pescata + la tua fase). Lo scontro dura alcuni Pomodori. Completare la Prova reale = colpo forte / chiude lo scontro.

### Deckbuilding nel run + collezione meta
- Dopo ogni scontro vinto: **ricompensa carta** (scegli 1 di 3) che entra nel mazzo del run (deckbuilding alla StS).
- **Collezione permanente:** sali di livello (progressione esistente) e sblocchi nuove carte che possono comparire nelle ricompense o nel mazzo iniziale. Selezione del mazzo/eroe di partenza.
- Opzionale stile StS: **Rituali** (relics) = bonus passivi sbloccabili (es. "Mattiniero: +1 Focus al primo Pomodoro").

### Piano a tappe (costruzione per fette giocabili)
- **Tappa A - vertical slice giocabile [FATTA, 2026-06-17]:** motore di duello + UNA battaglia completa vs "La Scadenza", 16 carte (8 creature + 8 magie), combattimento completo attacco/blocco bidirezionale, nemico con intent telegrafati, ricompensa carta a fine scontro. Carte in pixel art originale (frame + illustrazione procedurale). Gate "1 Pomodoro = 1 turno". File: `duel.html`, `duel-core.js`, `cards.js`, `card-render.js`, `duel-ui.js`. Test: 32 unit + 13 smoke DOM verdi. Raggiungibile dalla schermata iniziale (bottone "Modalita' Duello (beta)").
- **Tappa B - run completo [FATTA, 2026-06-17]:** preparazione Prove -> mappa di scontri (le tue Prove, easiest first) + boss finale "La Scadenza" -> battaglie a carte (Pomodoro-gated) -> ricompensa carta tra gli scontri (deckbuilding nel run) -> Vigore e mazzo che persistono, riposo +10 tra gli scontri -> Bilancio finale registrato in storico e progressione (condivisi con la Classica). File: `run-core.js` + UI in `duel-ui.js`/`duel.html`. Nemici per Prova in `cards.js` (Sciame di Email, Riunione Fiume, Context Switch), HP scalati per difficolta'. Test: run-core 22 + smoke run 13. Bilanciamento reso clemente (perdere dopo molti Pomodori reali sarebbe demoralizzante). Resume da localStorage.
- **Tappa C - meta e collezione [FATTA, 2026-06-17]:** carte sbloccabili salendo di livello (progressione condivisa con la Classica): Lampo di Lucidita' (Lv2), Mentore (Lv3), Baluardo Arcano (Lv4), Titano del Focus (Lv5). Le carte sbloccate entrano nel pool delle ricompense del run. Rituali (bonus passivi scelti a inizio run, sbloccati per livello): Mattiniero (+1 Focus al 1o turno di ogni scontro, Lv1), Resistenza (+8 Vigore max, Lv2), Mano Pronta (+1 carta iniziale per scontro, Lv3). File: dati in `cards.js` (UNLOCKS, RITUALS), effetti in `run-core.js`/`duel-core.js`, picker in `duel-ui.js`/`duel.html`. Test: test-tappac 16. Totale progetto: 182 test verdi.

### Architettura tecnica (aggiornata)
- `duel-core.js` motore puro: energia, mazzo, mano, pescata, board, **combattimento completo**, IA nemico con intent, vittoria/sconfitta.
- `cards.js` dati del set + sblocchi.
- `card-render.js` carta = canvas pixel (frame + illustrazione) + testo HTML.
- `run.js` mappa del run, scontri, ricompense (Tappa B).
- `duel-ui.js` schermata battaglia + run.
- Riuso: `progression.js`, `history.js`, sprite, audio. Test: unit del duel-core + smoke DOM.

## Fuori scope (per ora)

Multiplayer / PvP online; animazioni complesse; bilanciamento fine di un set grande. Prima un single-player solido vs IA, costruito a tappe.
