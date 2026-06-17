/* PROD-EX: The Workday Standoff · core rules engine (no DOM).
   Works in browser (window.PRODEX) and Node (module.exports) for testing.
   Metaphor: your day is an adventure. Tasks = Trials on the path ("Prove",
   difficulty 1-3). Focus = mana, earned by completing real Pomodoro work blocks
   (tap Focus lands). Progress cards can only be played in the window opened by a
   completed Pomodoro (the psychological rule: act in-game only after the real
   work). The adversary is Distraction/Entropy, on a block-based clock; ignore it
   and you lose Vigore. Complete the path to win the day.
   NOTE: internal keys (toughness, composure, dmg) are kept for stability; the
   themed wording lives in user-facing strings and the UI layer. */
(function (root) {
  "use strict";

  // ---------- static data ----------
  var CARDS = {
    deep_work:   { name: "Deep Work",        kind: "land",   ident: "blue",  produce: 3, oncedaily: false,
                   type: "Focus Land",        text: "Tappa per +3 Focus. Si stappa a ogni nuovo blocco." },
    quick_win:   { name: "Quick Win",        kind: "land",   ident: "gold",  produce: 1, oncedaily: false,
                   type: "Focus Land",        text: "Tappa per +1 Focus. Si stappa a ogni nuovo blocco." },
    caffeine:    { name: "Caffeine Rush",    kind: "land",   ident: "red",   produce: 2, oncedaily: true,
                   type: "Focus Land",        text: "Tappa per +2 Focus. Una sola volta per giornata." },
    pomodoro:    { name: "Pomodoro Strike",  kind: "damage", ident: "red",   cost: 1, dmg: 1,
                   type: "Azione - Istante",  text: "Avanzi di 1 su una Prova. Solo dopo un Pomodoro." },
    flow:        { name: "Flow State",       kind: "damage", ident: "blue",  cost: 3, dmg: 3,
                   type: "Azione - Stregoneria", text: "Superi una Prova: 3 di progresso. Solo dopo un Pomodoro." },
    time_block:  { name: "Time Block",       kind: "protect",ident: "blue",  cost: 2,
                   type: "Azione - Aura",     text: "Blindi una Prova: niente Distrazioni finche' non la superi." },
    delegate:    { name: "Delegate",         kind: "remove", ident: "gold",  cost: 2,
                   type: "Azione - Istante",  text: "Affidi una Prova ad altri: lascia il cammino." },
    eisenhower:  { name: "Eisenhower Filter",kind: "sort",   ident: "blue",  cost: 1,
                   type: "Azione - Istante",  text: "Studi le Prove e marchi da dove iniziare." },
    recovery:    { name: "Recovery",         kind: "recover",ident: "green", cost: 1,
                   type: "Azione - Istante",  text: "Stappa una carta Focus ora, oppure annulla una Distrazione." }
  };

  var DISTRACTIONS = [
    { text: "Slack ping",      effect: "composure" },
    { text: "Email urgente",   effect: "composure" },
    { text: "Context switch",  effect: "scope" },
    { text: "Notifica push",   effect: "composure" },
    { text: "Riunione a sorpresa", effect: "tap" },
    { text: "Doomscrolling",   effect: "scope" }
  ];

  var DEFAULTS = { maxComposure: 10, spawnEvery: 2, distractTimer: 2 };

  // ---------- helpers ----------
  function uid(prefix) { return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 8); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function makeRng(seed) {
    // deterministic PRNG for tests; if no seed, use Math.random
    if (seed == null) return Math.random;
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  // ---------- state ----------
  function newGame(opts) {
    opts = opts || {};
    var rng = makeRng(opts.seed);
    var st = {
      focus: 0,
      composure: opts.maxComposure || DEFAULTS.maxComposure,
      maxComposure: opts.maxComposure || DEFAULTS.maxComposure,
      tasks: [],
      lands: [
        { id: "deep_work", card: "deep_work", tapped: false, usedToday: false },
        { id: "quick_win", card: "quick_win", tapped: false, usedToday: false },
        { id: "caffeine",  card: "caffeine",  tapped: false, usedToday: false }
      ],
      distractions: [],
      block: 0,
      target: null,            // currently selected enemy task id
      resolveOpen: false,      // damage window open (just finished a Pomodoro)
      recommended: null,       // eisenhower suggestion
      status: "playing",
      log: [],
      _rng: rng,
      spawnEvery: opts.spawnEvery || DEFAULTS.spawnEvery,
      distractTimer: opts.distractTimer || DEFAULTS.distractTimer
    };
    (opts.tasks || []).forEach(function (t) { addTask(st, t.text, t.toughness); });
    return st;
  }

  function log(st, msg) { st.log.push(msg); if (st.log.length > 200) st.log.shift(); return msg; }

  function addTask(st, text, toughness) {
    toughness = clamp(parseInt(toughness, 10) || 1, 1, 3);
    var t = { id: uid("task"), text: (text || "Task").toString().slice(0, 80),
              toughness: toughness, maxToughness: toughness, enchanted: false };
    st.tasks.push(t);
    log(st, "Nuova Prova sul cammino: " + t.text + " (difficolta' " + toughness + ")");
    return t;
  }

  function removeTask(st, id, reason) {
    var i = st.tasks.findIndex(function (t) { return t.id === id; });
    if (i < 0) return false;
    var t = st.tasks[i];
    st.tasks.splice(i, 1);
    if (st.target === id) st.target = null;
    log(st, (reason || "Rimosso") + ": " + t.text);
    checkWin(st);
    return true;
  }

  function findTask(st, id) { return st.tasks.find(function (t) { return t.id === id; }); }
  function landDef(l) { return CARDS[l.card]; }

  // ---------- economy ----------
  function tapLand(st, landId) {
    var l = st.lands.find(function (x) { return x.id === landId; });
    if (!l) return { ok: false, reason: "Land inesistente" };
    if (l.tapped) return { ok: false, reason: "Gia' tappata" };
    var def = landDef(l);
    if (def.oncedaily && l.usedToday) return { ok: false, reason: "Caffeine: gia' usata oggi" };
    l.tapped = true;
    if (def.oncedaily) l.usedToday = true;
    st.focus += def.produce;
    log(st, def.name + ": +" + def.produce + " Focus (tot " + st.focus + ")");
    return { ok: true, focus: st.focus };
  }

  function untapLands(st, all) {
    st.lands.forEach(function (l) {
      // Caffeine stays tapped for the day (oncedaily) unless full reset
      if (landDef(l).oncedaily && !all) return;
      l.tapped = false;
    });
  }

  // ---------- pomodoro block ----------
  // Called when a real Pomodoro work session completes (focused on target task).
  function completeBlock(st, targetId) {
    if (st.status !== "playing") return { ok: false, reason: "Partita finita" };
    st.block += 1;
    if (targetId) st.target = targetId;
    untapLands(st, false);                 // new block: lands ready again
    st.resolveOpen = true;                 // you worked: progress window opens
    log(st, "Blocco " + st.block + " completato. Avanzamento sbloccato, Focus lands stappate.");

    // pressure arrives for this block
    if (st.block % st.spawnEvery === 0) spawnDistraction(st);
    // protection: a focused block on an enchanted target shields you from one distraction
    var tgt = findTask(st, st.target);
    if (tgt && tgt.enchanted && st.distractions.length) {
      var d = st.distractions.shift();
      log(st, "Time Block ti protegge: " + d.text + " annullata.");
    }
    // remaining distractions tick down and may trigger
    advanceDistractions(st);
    checkLose(st);
    return { ok: true, block: st.block };
  }

  function spawnDistraction(st) {
    if (st.status !== "playing") return null;
    var tmpl = DISTRACTIONS[Math.floor(st._rng() * DISTRACTIONS.length)];
    var d = { id: uid("dist"), text: tmpl.text, effect: tmpl.effect, timer: st.distractTimer };
    st.distractions.push(d);
    log(st, "DISTRAZIONE: " + d.text + " (esplode tra " + d.timer + " blocchi)");
    return d;
  }

  function advanceDistractions(st) {
    var survivors = [];
    st.distractions.forEach(function (d) {
      d.timer -= 1;
      if (d.timer > 0) { survivors.push(d); return; }
      // trigger effect
      if (d.effect === "composure") {
        st.composure = clamp(st.composure - 2, 0, st.maxComposure);
        log(st, d.text + " ti rallenta: -2 Vigore (" + st.composure + ")");
      } else if (d.effect === "scope") {
        var open = st.tasks.filter(function (t) { return true; });
        if (open.length) {
          var t = open[Math.floor(st._rng() * open.length)];
          t.toughness = clamp(t.toughness + 1, 1, 9);
          t.maxToughness = Math.max(t.maxToughness, t.toughness);
          log(st, d.text + ": scope creep, la Prova " + t.text + " sale a difficolta' " + t.toughness);
        } else {
          st.composure = clamp(st.composure - 1, 0, st.maxComposure);
        }
      } else if (d.effect === "tap") {
        var untapped = st.lands.filter(function (l) { return !l.tapped; });
        if (untapped.length) {
          untapped[0].tapped = true;
          log(st, d.text + ": ti ruba una Focus land (" + landDef(untapped[0]).name + " tappata)");
        } else {
          st.composure = clamp(st.composure - 1, 0, st.maxComposure);
        }
      }
    });
    st.distractions = survivors;
  }

  function dismissDistraction(st, id) {
    if (st.focus < 1) return { ok: false, reason: "Serve 1 Focus" };
    var i = st.distractions.findIndex(function (d) { return d.id === id; });
    if (i < 0) return { ok: false, reason: "Distrazione inesistente" };
    st.focus -= 1;
    var d = st.distractions.splice(i, 1)[0];
    log(st, "Gestisci " + d.text + ": -1 Focus.");
    return { ok: true };
  }

  // ---------- play cards ----------
  function playCard(st, cardId, targetId) {
    if (st.status !== "playing") return { ok: false, reason: "Partita finita" };
    var c = CARDS[cardId];
    if (!c) return { ok: false, reason: "Carta inesistente" };
    var needsTarget = (c.kind === "damage" || c.kind === "protect" || c.kind === "remove");
    var tgt = needsTarget ? findTask(st, targetId || st.target) : null;
    if (needsTarget && !tgt) return { ok: false, reason: "Scegli una Prova" };

    if (c.kind === "damage") {
      if (!st.resolveOpen) return { ok: false, reason: "Completa prima un Pomodoro reale" };
      if (st.focus < c.cost) return { ok: false, reason: "Focus insufficiente" };
      st.focus -= c.cost;
      tgt.toughness -= c.dmg;
      log(st, c.name + " sulla Prova " + tgt.text + ": +" + c.dmg + " di progresso (resta " + Math.max(0, tgt.toughness) + ")");
      if (tgt.toughness <= 0) removeTask(st, tgt.id, "PROVA SUPERATA");
      return { ok: true };
    }
    if (c.kind === "protect") {
      if (st.focus < c.cost) return { ok: false, reason: "Focus insufficiente" };
      st.focus -= c.cost; tgt.enchanted = true;
      log(st, "Time Block su " + tgt.text + ": protetto.");
      return { ok: true };
    }
    if (c.kind === "remove") {
      if (st.focus < c.cost) return { ok: false, reason: "Focus insufficiente" };
      st.focus -= c.cost; removeTask(st, tgt.id, "Prova affidata ad altri");
      return { ok: true };
    }
    if (c.kind === "sort") {
      if (st.focus < c.cost) return { ok: false, reason: "Focus insufficiente" };
      st.focus -= c.cost;
      var rec = recommend(st);
      st.recommended = rec ? rec.id : null;
      log(st, "Eisenhower Filter: inizia dalla Prova " + (rec ? rec.text : "nessuna"));
      return { ok: true, recommended: st.recommended };
    }
    if (c.kind === "recover") {
      if (st.focus < c.cost) return { ok: false, reason: "Focus insufficiente" };
      st.focus -= c.cost;
      // prefer cancelling a distraction if any, else untap a land
      if (st.distractions.length) {
        var d = st.distractions.shift();
        log(st, "Recovery: " + d.text + " annullata.");
      } else {
        var tappedLand = st.lands.find(function (l) { return l.tapped && !landDef(l).oncedaily; });
        if (tappedLand) { tappedLand.tapped = false; log(st, "Recovery: " + landDef(tappedLand).name + " stappata."); }
        else log(st, "Recovery: niente da stappare, ti riposi.");
      }
      return { ok: true };
    }
    return { ok: false, reason: "Tipo carta non gestito" };
  }

  // suggest target: lowest toughness you can finish, else highest priority (toughness)
  function recommend(st) {
    if (!st.tasks.length) return null;
    var sorted = st.tasks.slice().sort(function (a, b) { return a.toughness - b.toughness; });
    return sorted[0];
  }

  // ---------- end states ----------
  function checkWin(st) {
    if (st.status === "playing" && st.tasks.length === 0 && st._started) {
      st.status = "won"; log(st, "CAMMINO COMPLETATO. Giornata conquistata!");
    }
    return st.status;
  }
  function checkLose(st) {
    if (st.status === "playing" && st.composure <= 0) {
      st.status = "lost"; log(st, "Vigore a zero. Ti fermi: riparti domani.");
    }
    return st.status;
  }

  // mark that the day actually started (so an empty board at setup isn't an instant win)
  function startDay(st) { st._started = true; checkWin(st); return st; }

  var API = {
    CARDS: CARDS, DISTRACTIONS: DISTRACTIONS, DEFAULTS: DEFAULTS,
    newGame: newGame, startDay: startDay, addTask: addTask, removeTask: removeTask,
    tapLand: tapLand, untapLands: untapLands, completeBlock: completeBlock,
    spawnDistraction: spawnDistraction, advanceDistractions: advanceDistractions,
    dismissDistraction: dismissDistraction, playCard: playCard, recommend: recommend,
    checkWin: checkWin, checkLose: checkLose, findTask: findTask, makeRng: makeRng
  };

  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.PRODEX = API;
})(typeof window !== "undefined" ? window : globalThis);
