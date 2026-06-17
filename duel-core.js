/* PROD-EX Duel v2 - battle engine (pure, no DOM). Arcane-academy roguelike.
   Resource = Appunti: each real Pomodoro creates an Appunto (labeled with the task)
   worth mana by duration (5/10/15/25 -> 1/2/4/6). Appunti ramp permanently and refresh
   each turn (like a mana base). You face a gauntlet of bosses one after another;
   defeat one and the next appears (harder). You lose when Vigore hits 0. */
(function (root) {
  "use strict";
  var DB = (typeof require !== "undefined") ? require("./cards.js") : root.PRODEX_CARDS;
  var CARDS = DB.CARDS, ENEMY_CREATURES = DB.ENEMY_CREATURES, BOSSES = DB.BOSSES;

  function makeRng(seed) { if (seed == null) return Math.random; var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function shuffle(a, rng) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  var _uid = 0; function uid(p) { return (p || "c") + (++_uid); }
  function log(st, m) { st.log.push(m); if (st.log.length > 200) st.log.shift(); return m; }
  function appuntoValue(dur) { return DB.APPUNTO_VALUE[dur] || 1; }
  function aliveTough(c) { return c.tough - c.dmg; }

  function mkCreature(id, side) { var c = CARDS[id]; return { uid: uid("u"), cardId: id, name: c.name, power: c.power, tough: c.tough, dmg: 0, tapped: false, sick: (c.kw || []).indexOf("slancio") < 0, kw: (c.kw || []).slice(), side: side }; }
  function mkEnemyCreature(t) { var x = ENEMY_CREATURES[t]; return { uid: uid("e"), cardId: t, name: x.name, power: x.power, tough: x.tough, dmg: 0, tapped: false, sick: true, kw: [], side: "enemy" }; }

  function bossForIndex(i) {
    var base = BOSSES[Math.min(i, BOSSES.length - 1)];
    var hp = base.hp, name = base.name;
    if (i >= BOSSES.length) { var extra = i - (BOSSES.length - 1); hp = base.hp + extra * 12; name = base.name + " (Eco " + (extra + 1) + ")"; }
    return { name: name, hp: hp, maxHp: hp, board: [], intents: base.intents.slice(), intentIndex: 0, intent: base.intents[0] };
  }

  function newDuel(opts) {
    opts = opts || {};
    var rng = makeRng(opts.seed);
    var maxV = opts.maxVigor || 32;
    var st = {
      appunti: [], mana: 0,
      vigor: maxV, maxVigor: maxV,
      deck: shuffle(opts.deck || DB.STARTER_DECK, rng), hand: [], discard: [], board: [],
      turn: 0, bossIndex: 0, bossesDefeated: 0,
      enemy: bossForIndex(0), pendingEnemyAttack: null, pendingReward: null,
      bonusMana: opts.bonusMana || 0, bonusDraw: opts.bonusDraw || 0, level: opts.level || 1,
      pomodoros: 0, focusMinutes: 0,
      status: "playing", log: [], _rng: rng
    };
    openingHand(st, 5);
    log(st, "Inizia la giornata. Primo avversario: " + st.enemy.name + ".");
    return st;
  }

  // opening hand of N creatures (rest stays in deck)
  function openingHand(st, n) {
    var keep = [], rest = [];
    st.deck.forEach(function (id) {
      if (keep.length < n && CARDS[id].kind === "creature") keep.push(id); else rest.push(id);
    });
    while (keep.length < n && rest.length) keep.push(rest.shift());  // fallback if few creatures
    st.deck = rest;
    keep.forEach(function (id) { st.hand.push({ uid: uid("h"), cardId: id }); });
  }
  function draw(st, n) {
    n = n || 1;
    for (var k = 0; k < n; k++) {
      if (!st.deck.length) { if (!st.discard.length) return; st.deck = shuffle(st.discard, st._rng); st.discard = []; log(st, "Rimescoli gli scarti nel mazzo."); }
      var id = st.deck.shift();
      if (st.hand.length >= 10) { st.discard.push(id); continue; }
      st.hand.push({ uid: uid("h"), cardId: id });
    }
  }
  function totalAppunti(st) { return st.appunti.reduce(function (s, a) { return s + a.value; }, 0); }

  // Complete a real Pomodoro: create an Appunto, start a new turn (refresh+draw+untap).
  function pomodoro(st, task, dur) {
    if (st.status !== "playing") return { ok: false, reason: "Partita finita" };
    var val = appuntoValue(dur);
    st.appunti.push({ task: (task || "Studio").toString().slice(0, 60), dur: dur, value: val });
    st.turn += 1; st.pomodoros += 1; st.focusMinutes += dur;
    st.mana = totalAppunti(st) + st.bonusMana;
    st.board.forEach(function (c) { c.tapped = false; c.sick = false; c.dmg = 0; });
    st.board.forEach(function (c) { var d = CARDS[c.cardId]; if (d && d.upkeep) { if (d.upkeep.type === "mana") st.mana += d.upkeep.amount; if (d.upkeep.type === "draw") draw(st, d.upkeep.amount); } });
    draw(st, 1 + st.bonusDraw);
    log(st, "Pomodoro " + dur + " min su '" + task + "': +" + val + " Appunti. Mana " + st.mana + ".");
    return { ok: true, gained: val };
  }

  function handCard(st, u) { return st.hand.find(function (h) { return h.uid === u; }); }
  function findCreature(st, u) { return st.board.find(function (c) { return c.uid === u; }) || st.enemy.board.find(function (c) { return c.uid === u; }); }
  function rmHand(st, u) { var i = st.hand.findIndex(function (h) { return h.uid === u; }); if (i >= 0) st.hand.splice(i, 1); }

  function playCard(st, u, target) {
    if (st.status !== "playing") return { ok: false, reason: "Partita finita" };
    var h = handCard(st, u); if (!h) return { ok: false, reason: "Carta non in mano" };
    var def = CARDS[h.cardId];
    if (st.mana < def.cost) return { ok: false, reason: "Appunti insufficienti" };
    if (def.kind === "creature") {
      st.mana -= def.cost; rmHand(st, u);
      var cr = mkCreature(h.cardId, "you"); st.board.push(cr);
      log(st, "Evochi " + cr.name + " (" + cr.power + "/" + cr.tough + ").");
      if (def.enter) applyEffect(st, def.enter, target);
      cleanupDeaths(st); checkBoss(st); return { ok: true };
    }
    var need = ["damage_any", "destroy", "buff_heal", "untap"].indexOf(def.effect.type) >= 0;
    if (need && !validTarget(st, def.effect, target)) return { ok: false, reason: "Bersaglio non valido" };
    st.mana -= def.cost; rmHand(st, u);
    applyEffect(st, def.effect, target); st.discard.push(h.cardId);
    log(st, "Lanci " + def.name + ".");
    cleanupDeaths(st); checkBoss(st); return { ok: true };
  }
  function validTarget(st, eff, t) {
    if (eff.type === "damage_any") return t === "ENEMY_FACE" || findCreature(st, t);
    if (eff.type === "destroy") return st.enemy.board.find(function (c) { return c.uid === t; });
    return st.board.find(function (c) { return c.uid === t; });
  }
  function applyEffect(st, eff, t) {
    switch (eff.type) {
      case "damage_enemy": st.enemy.hp -= eff.amount; log(st, eff.amount + " danni a " + st.enemy.name + "."); break;
      case "damage_any": if (t === "ENEMY_FACE") { st.enemy.hp -= eff.amount; log(st, eff.amount + " danni a " + st.enemy.name + "."); } else { var c = findCreature(st, t); if (c) { c.dmg += eff.amount; log(st, eff.amount + " danni a " + c.name + "."); } } break;
      case "draw": draw(st, eff.amount); log(st, "Peschi " + eff.amount + "."); break;
      case "heal": st.vigor = clamp(st.vigor + eff.amount, 0, st.maxVigor); log(st, "+" + eff.amount + " Vigore (" + st.vigor + ")."); break;
      case "mana": st.mana += eff.amount; log(st, "+" + eff.amount + " Appunti disponibili."); break;
      case "buff_heal": var b = st.board.find(function (x) { return x.uid === t; }); if (b) { b.power += eff.power; b.tough += eff.tough; b.dmg = 0; log(st, b.name + " ora " + b.power + "/" + b.tough + "."); } break;
      case "destroy": var i = st.enemy.board.findIndex(function (x) { return x.uid === t; }); if (i >= 0 && st.enemy.board[i].tough <= (eff.maxTough || 99)) { log(st, "Distruggi " + st.enemy.board[i].name + "."); st.enemy.board.splice(i, 1); } break;
      case "untap": var uu = st.board.find(function (x) { return x.uid === t; }); if (uu) { uu.tapped = false; log(st, uu.name + " puo' riattaccare."); } break;
    }
  }

  function declareAttack(st, ids) {
    if (st.status !== "playing") return { ok: false, reason: "Partita finita" };
    var atk = (ids || []).map(function (id) { return st.board.find(function (c) { return c.uid === id; }); }).filter(function (c) { return c && !c.tapped && !c.sick; });
    if (!atk.length) return { ok: false, reason: "Nessun attaccante valido" };
    atk.forEach(function (a) { a.tapped = true; });
    var used = {};
    atk.slice().sort(function (a, b) { return b.power - a.power; }).forEach(function (a) {
      var best = null;
      st.enemy.board.forEach(function (bl) {
        if (used[bl.uid] || bl.tapped) return;
        var surv = aliveTough(bl) > a.power, kills = bl.power >= aliveTough(a), score = (kills ? 2 : 0) + (surv ? 1 : 0);
        if (a.power >= aliveTough(bl) && a.power >= st.enemy.hp) score += 1;
        if (best == null || score > best.score) best = { bl: bl, score: score };
      });
      a._b = (best && best.score > 0) ? best.bl.uid : null; if (a._b) used[a._b] = true;
    });
    var face = 0;
    atk.forEach(function (a) {
      if (a._b) { var bl = st.enemy.board.find(function (c) { return c.uid === a._b; }); bl.dmg += a.power; a.dmg += bl.power; log(st, a.name + " e " + bl.name + " si scontrano."); }
      else { st.enemy.hp -= a.power; face += a.power; }
      delete a._b;
    });
    if (face) log(st, face + " danni a " + st.enemy.name + " (" + Math.max(0, st.enemy.hp) + ").");
    cleanupDeaths(st); checkBoss(st); return { ok: true, faceDamage: face };
  }

  function endTurn(st) {
    if (st.status !== "playing") return { ok: false, reason: "Partita finita" };
    var en = st.enemy;
    en.board.forEach(function (c) { c.tapped = false; c.sick = false; c.dmg = 0; });
    var it = en.intent;
    if (it.type === "summon") { var cr = mkEnemyCreature(it.card); en.board.push(cr); log(st, en.name + " evoca " + cr.name + "."); advanceIntent(st); return { ok: true, needsBlocks: false }; }
    if (it.type === "buff") { en.board.forEach(function (c) { c.power += it.amount; }); log(st, en.name + " rinforza le sue creature (+" + it.amount + ")."); advanceIntent(st); return { ok: true, needsBlocks: false }; }
    var attackers = en.board.filter(function (c) { return !c.sick && c.power > 0; }).map(function (c) { return c.uid; });
    st.pendingEnemyAttack = { boss: it.amount || 0, attackers: attackers };
    log(st, en.name + ": " + it.label + ". Assegna i bloccanti.");
    return { ok: true, needsBlocks: true };
  }
  function assignBlocks(st, bm) {
    var pa = st.pendingEnemyAttack; if (!pa) return { ok: false, reason: "Nessun attacco" };
    bm = bm || {}; var used = {};
    pa.attackers.forEach(function (au) {
      var a = st.enemy.board.find(function (c) { return c.uid === au; }); if (!a) return;
      var bu = bm[au], bl = (bu && !used[bu]) ? st.board.find(function (c) { return c.uid === bu; }) : null;
      if (bl) { used[bu] = true; a.dmg += bl.power; bl.dmg += a.power; log(st, bl.name + " blocca " + a.name + "."); }
      else { st.vigor -= a.power; log(st, a.name + " ti colpisce per " + a.power + " (Vigore " + Math.max(0, st.vigor) + ")."); }
    });
    if (pa.boss > 0) {
      var bb = (bm.BOSS && !used[bm.BOSS]) ? st.board.find(function (c) { return c.uid === bm.BOSS; }) : null;
      if (bb) { used[bm.BOSS] = true; bb.dmg += pa.boss; st.enemy.hp -= bb.power; log(st, bb.name + " para il colpo e ferisce " + st.enemy.name + " di " + bb.power + "."); }
      else { st.vigor -= pa.boss; log(st, st.enemy.name + " ti colpisce per " + pa.boss + " (Vigore " + Math.max(0, st.vigor) + ")."); }
    }
    st.pendingEnemyAttack = null;
    cleanupDeaths(st); advanceIntent(st); checkBoss(st); checkLose(st);
    return { ok: true };
  }
  function advanceIntent(st) { var en = st.enemy; en.intentIndex = (en.intentIndex + 1) % en.intents.length; en.intent = en.intents[en.intentIndex]; }
  function cleanupDeaths(st) {
    st.board = st.board.filter(function (c) { if (aliveTough(c) <= 0) { log(st, c.name + " e' distrutto."); return false; } return true; });
    st.enemy.board = st.enemy.board.filter(function (c) { if (aliveTough(c) <= 0) { log(st, c.name + " e' distrutto."); return false; } return true; });
  }

  function checkBoss(st) {
    if (st.status === "playing" && st.enemy.hp <= 0) advanceBoss(st);
  }
  function advanceBoss(st) {
    st.bossesDefeated += 1;
    log(st, "HAI SCONFITTO " + st.enemy.name + "! (boss n. " + st.bossesDefeated + ")");
    st.pendingReward = pickReward(st);
    st.bossIndex += 1;
    st.enemy = bossForIndex(st.bossIndex);
    st.pendingEnemyAttack = null;
    st.vigor = clamp(st.vigor + 8, 0, st.maxVigor);
    log(st, "Si avvicina " + st.enemy.name + "...");
  }
  function checkLose(st) { if (st.status === "playing" && st.vigor <= 0) { st.status = "lost"; log(st, "Il tuo Vigore e' a zero. La giornata ti travolge."); } }
  function endDay(st) { if (st.status === "playing") { st.status = "ended"; log(st, "Chiudi la giornata. Boss sconfitti: " + st.bossesDefeated + "."); } return st; }

  function pickReward(st) {
    var pool = (DB.REWARD_POOL || []).concat(DB.unlockedCards ? DB.unlockedCards(st.level) : []);
    var out = []; for (var i = 0; i < 3 && pool.length; i++) out.push(pool.splice(Math.floor(st._rng() * pool.length), 1)[0]);
    return out;
  }
  function takeReward(st, id) { if (st.pendingReward && st.pendingReward.indexOf(id) >= 0) { st.deck.push(id); st.pendingReward = null; log(st, "Aggiungi " + CARDS[id].name + " al mazzo."); return true; } return false; }
  function skipReward(st) { st.pendingReward = null; }

  function summary(st) {
    return { result: st.status, bossesDefeated: st.bossesDefeated, pomodoros: st.pomodoros, focusMinutes: st.focusMinutes,
             appunti: st.appunti.map(function (a) { return a.task; }) };
  }

  var API = {
    newDuel: newDuel, pomodoro: pomodoro, playCard: playCard, declareAttack: declareAttack,
    endTurn: endTurn, assignBlocks: assignBlocks, draw: draw, takeReward: takeReward, skipReward: skipReward,
    endDay: endDay, summary: summary, findCreature: findCreature, handCard: handCard,
    appuntoValue: appuntoValue, bossForIndex: bossForIndex, totalAppunti: totalAppunti,
    makeRng: makeRng, CARDS: CARDS, aliveTough: aliveTough
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.PRODEX_DUEL = API;
})(typeof window !== "undefined" ? window : globalThis);
