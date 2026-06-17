/* PROD-EX Duel v2 UI - Appunti mana, variable-duration Pomodoros, boss gauntlet. */
(function () {
  "use strict";
  var D = window.PRODEX_DUEL, CR = window.PRODEX_CARDREND, DB = window.PRODEX_CARDS, CARDS = DB.CARDS;
  var PROG = window.PRODEX_PROG, HIST = window.PRODEX_HIST, LS = window.localStorage;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var st = null, mode = "idle", sel = {}, pending = null, blockMap = {}, blockPick = null, selectedRitual = null;
  var SKEY = "prodex_duel2", SND = "prodex_duel_snd";

  /* audio */
  var AC = null, snd = true;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return AC; }
  function beep(f, d, t, v, w) { if (!snd) return; var c = ac(); if (!c) return; var tt = c.currentTime + (w || 0), o = c.createOscillator(), g = c.createGain(); o.type = t || "square"; o.frequency.setValueAtTime(f, tt); g.gain.setValueAtTime(.0001, tt); g.gain.exponentialRampToValueAtTime(v || .1, tt + .01); g.gain.exponentialRampToValueAtTime(.0001, tt + d); o.connect(g); g.connect(c.destination); o.start(tt); o.stop(tt + d + .02); }
  var SFX = { click: function () { beep(420, .05, "square", .07); }, play: function () { beep(560, .08, "triangle", .09); }, hit: function () { beep(170, .12, "sawtooth", .12); }, kill: function () { [523, 784, 1046].forEach(function (f, i) { beep(f, .1, "square", .1, i * .05); }); }, bad: function () { beep(130, .18, "sawtooth", .12); }, ding: function () { beep(880, .12, "sine", .11); beep(1320, .18, "sine", .09, .07); }, boss: function () { [392, 523, 659, 880].forEach(function (f, i) { beep(f, .14, "square", .11, i * .1); }); }, lose: function () { [330, 294, 262, 196].forEach(function (f, i) { beep(f, .2, "sawtooth", .11, i * .15); }); } };

  /* persistence */
  function lsGet(k, d) { try { var v = LS.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { LS.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function lsDel(k) { try { LS.removeItem(k); } catch (e) {} }
  function save() { if (st && st.status === "playing") lsSet(SKEY, { st: st, mode: (mode === "block" ? "await" : mode) }); else lsDel(SKEY); }
  function playerLevel() { try { return PROG.levelInfo(HIST.load(LS).progress.xp).level; } catch (e) { return 1; } }

  function showScreen(n) { ["intro", "battle", "overlay"].forEach(function (id) { var el = $("#" + id); if (el) el.classList.toggle("hidden", id !== n); }); }

  /* ---------- intro: ritual picker ---------- */
  function renderRituals() {
    var box = $("#ritualBox"); if (!box) return;
    var lvl = playerLevel();
    var html = '<div class="mini" style="margin-bottom:6px">Livello mago <b style="color:var(--purple)">' + lvl + '</b>. Scegli un Rituale (bonus passivo del giorno):</div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">';
    html += '<button class="ritBtn" data-r="" style="font-size:8px;' + (selectedRitual === null ? 'box-shadow:0 0 0 3px var(--gold),0 4px 0 #000' : '') + '">NESSUNO</button>';
    DB.RITUALS.forEach(function (r) {
      var locked = lvl < r.unlock, s = selectedRitual === r.id;
      html += '<button class="ritBtn" data-r="' + r.id + '"' + (locked ? ' disabled' : '') + ' title="' + r.desc + '" style="font-size:8px;' + (s ? 'box-shadow:0 0 0 3px var(--gold),0 4px 0 #000;' : '') + '">' + (locked ? "🔒 " : "") + r.name + (locked ? " (Lv " + r.unlock + ")" : "") + '</button>';
    });
    html += '</div><div class="mini" style="text-align:center;margin-top:6px;color:var(--gold)">' + (selectedRitual ? DB.ritualById(selectedRitual).desc : "Nessun rituale.") + '</div>';
    box.innerHTML = html;
    $$("#ritualBox .ritBtn").forEach(function (b) { b.onclick = function () { selectedRitual = b.getAttribute("data-r") || null; SFX.click(); renderRituals(); }; });
  }

  /* ---------- start ---------- */
  function startGame() {
    var lvl = playerLevel();
    var opts = { deck: DB.STARTER_DECK, level: lvl, maxVigor: 32 + (selectedRitual === "tempra" ? 8 : 0),
                 bonusMana: selectedRitual === "mattiniero" ? 1 : 0, bonusDraw: selectedRitual === "lettore" ? 1 : 0 };
    st = D.newDuel(opts); mode = "await"; sel = {}; pending = null;
    showScreen("battle"); ac(); SFX.ding(); resetPomo(); render(); save();
    toastHint("Scrivi cosa fai e scegli una durata per fare il primo Pomodoro.");
  }

  /* ---------- coach ---------- */
  var flash = "", flashUntil = 0, flashT = null;
  function toastHint(m) { flash = m || ""; flashUntil = Date.now() + 2600; $("#hint").textContent = flash; clearTimeout(flashT); flashT = setTimeout(renderHint, 2700); }
  function renderHint() { $("#hint").textContent = (Date.now() < flashUntil && flash) ? flash : coachText(); }
  function coachText() {
    if (!st || st.status !== "playing") return "";
    if (mode === "await") return "Scrivi il task e scegli una durata (riquadro oro) per fare un Pomodoro: genera Appunti (mana).";
    if (mode === "block") return "Il nemico attacca: clicca un attaccante nemico, poi una TUA creatura per pararlo. Poi CONFERMA.";
    if (mode === "target") return "Scegli il bersaglio della magia.";
    var ready = st.board.filter(function (c) { return !c.tapped && !c.sick && c.power > 0; });
    var selN = Object.keys(sel).filter(function (k) { return sel[k]; }).length;
    var playable = st.hand.some(function (h) { return st.mana >= CARDS[h.cardId].cost; });
    if (selN) return "Creatura pronta: clicca il nemico in alto per colpirlo (o premi ATTACCA).";
    if (ready.length) return "Hai una creatura pronta (oro): cliccala, poi clicca il nemico in alto.";
    if (playable) return "Clicca una CARTA in basso per evocarla (spende Appunti). Poi attacca.";
    return "Niente altro da fare: premi FINE TURNO.";
  }
  function coachTarget() {
    if (!st || st.status !== "playing") return null;
    if (mode === "await") return "pomoBox";
    if (mode === "block") return "confirmBlockBtn";
    if (mode === "target") return null;
    var ready = st.board.filter(function (c) { return !c.tapped && !c.sick && c.power > 0; });
    var selN = Object.keys(sel).filter(function (k) { return sel[k]; }).length;
    var playable = st.hand.some(function (h) { return st.mana >= CARDS[h.cardId].cost; });
    if (selN) return "bossWrap"; if (ready.length) return "yourBoard"; if (playable) return "hand"; return "endBtn";
  }
  function coachSpotlight() {
    ["hand", "yourBoard", "pomoBox", "endBtn", "confirmBlockBtn", "bossWrap"].forEach(function (id) { var e = document.getElementById(id); if (e) e.classList.remove("coach"); });
    var t = coachTarget(); if (t) { var e = document.getElementById(t); if (e) e.classList.add("coach"); }
  }

  /* ---------- render ---------- */
  function render() {
    if (!st) return;
    $("#manaN").textContent = st.mana; $("#vigorN").textContent = Math.max(0, st.vigor);
    $("#bossN").textContent = st.bossesDefeated; $("#turnN").textContent = st.turn;
    var e = st.enemy;
    $("#bossName").textContent = e.name;
    $("#bossHp").style.width = Math.max(0, e.hp / e.maxHp * 100) + "%";
    $("#bossHpText").textContent = Math.max(0, e.hp) + " / " + e.maxHp;
    var ib = $("#intentBadge"), it = e.intent;
    ib.textContent = it.label; ib.className = "intent " + (it.type === "attack" ? "atk" : it.type === "summon" ? "sum" : "buf");
    CR.drawArt($("#bossArt"), "boss");
    $("#bossArt").className = "bossface" + ((mode === "target" && pending && needFace(pending)) || (mode === "block" && st.pendingEnemyAttack && st.pendingEnemyAttack.boss > 0) ? " tgt" : "");
    renderBoard("#enemyBoard", e.board, "enemy"); renderBoard("#yourBoard", st.board, "you");
    renderAppunti(); renderHand(); renderLog();
    var playing = st.status === "playing";
    $("#attackBtn").disabled = !(playing && mode === "play");
    $("#endBtn").disabled = !(playing && mode === "play");
    $("#confirmBlockBtn").classList.toggle("hidden", mode !== "block");
    var bt = $("#battle"); if (bt) bt.setAttribute("data-mode", mode);
    var on = { st1: mode === "await", st2: mode === "play", st3: mode === "play", st4: (mode === "play" || mode === "block") };
    ["st1", "st2", "st3", "st4"].forEach(function (id) { var el = $("#" + id); if (el) el.style.color = on[id] ? "var(--gold)" : "var(--dim)"; });
    coachSpotlight(); renderHint();
  }
  function needFace(p) { return p.def.effect && p.def.effect.type === "damage_any"; }
  function renderAppunti() {
    var box = $("#appunti"); box.innerHTML = "";
    if (!st.appunti.length) { box.innerHTML = '<span class="mini">Nessun Appunto: fai un Pomodoro per generarne.</span>'; return; }
    st.appunti.forEach(function (a) {
      var el = document.createElement("div"); el.className = "appunto";
      el.innerHTML = '<div class="av">+' + a.value + ' (' + a.dur + "m)</div><div class='at'>" + a.task + "</div>";
      box.appendChild(el);
    });
  }
  function renderBoard(selStr, list, side) {
    var box = $(selStr); box.innerHTML = "";
    if (!list.length) { box.innerHTML = '<span class="mini">vuoto</span>'; return; }
    list.forEach(function (inst) {
      var el = CR.renderToken(inst);
      if (side === "you" && sel[inst.uid]) el.classList.add("sel");
      if (side === "you" && Object.keys(blockMap).some(function (k) { return blockMap[k] === inst.uid; })) el.classList.add("block");
      if (mode === "block" && side === "enemy" && st.pendingEnemyAttack && st.pendingEnemyAttack.attackers.indexOf(inst.uid) >= 0) el.classList.add("sel");
      el.onclick = function () { onToken(inst, side); };
      box.appendChild(el);
    });
  }
  function renderHand() {
    var box = $("#hand"); box.innerHTML = "";
    st.hand.forEach(function (h) {
      var def = CARDS[h.cardId], el = CR.renderCard(h.cardId, {});
      var dis = !(st.status === "playing" && (mode === "play" || mode === "target")) || st.mana < def.cost;
      if (dis) el.classList.add("dis");
      if (pending && pending.uid === h.uid) el.classList.add("sel");
      el.onclick = function () { if (dis) { SFX.bad(); return; } onCard(h); };
      box.appendChild(el);
    });
  }
  function renderLog() {
    var box = $("#log"); box.innerHTML = "";
    st.log.slice(-26).forEach(function (m) {
      var p = document.createElement("p");
      if (/colpisce|Vigore|distrutto|travolge|zero/.test(m)) p.className = "warn";
      if (/SCONFITTO|Pomodoro|danni a|Evochi/.test(m)) p.className = "sys";
      p.textContent = "› " + m; box.appendChild(p);
    });
    box.scrollTop = box.scrollHeight;
  }

  /* ---------- interactions ---------- */
  function onCard(h) {
    var def = CARDS[h.cardId];
    var needsTarget = def.kind === "spell" && ["damage_any", "destroy", "buff_heal", "untap"].indexOf(def.effect.type) >= 0;
    if (!needsTarget) { var r = D.playCard(st, h.uid); if (!r.ok) { toastHint(r.reason); SFX.bad(); return; } SFX.play(); pending = null; mode = "play"; afterAction(); return; }
    pending = { uid: h.uid, def: def }; mode = "target";
    toastHint(def.effect.type === "buff_heal" || def.effect.type === "untap" ? "Scegli una tua creatura" : def.effect.type === "destroy" ? "Scegli una creatura nemica" : "Scegli un bersaglio"); render();
  }
  function onToken(inst, side) {
    if (mode === "target" && pending) {
      var et = pending.def.effect.type;
      var okT = (et === "destroy" && side === "enemy") || ((et === "buff_heal" || et === "untap") && side === "you") || (et === "damage_any");
      if (!okT) { toastHint("Bersaglio non valido"); SFX.bad(); return; }
      var r = D.playCard(st, pending.uid, inst.uid); if (!r.ok) { toastHint(r.reason); SFX.bad(); return; }
      SFX.play(); pending = null; mode = "play"; afterAction(); return;
    }
    if (mode === "block") {
      if (side === "enemy" && st.pendingEnemyAttack.attackers.indexOf(inst.uid) >= 0) { blockPick = inst.uid; toastHint("Ora scegli la creatura che blocca " + inst.name); render(); return; }
      if (side === "you" && blockPick) { blockMap[blockPick] = inst.uid; toastHint(inst.name + " blocchera'."); blockPick = null; render(); return; }
      return;
    }
    if (mode === "play" && side === "you") {
      if (inst.sick) { toastHint(inst.name + " e' appena entrata: attacca dal prossimo turno."); SFX.bad(); return; }
      if (inst.tapped) { toastHint(inst.name + " ha gia' attaccato. Fine turno + un Pomodoro per ripartire."); SFX.bad(); return; }
      if (inst.power <= 0) { toastHint(inst.name + " ha potenza 0: difende ma non attacca."); SFX.bad(); return; }
      sel[inst.uid] = !sel[inst.uid]; SFX.click();
      var n = Object.keys(sel).filter(function (k) { return sel[k]; }).length;
      toastHint(n ? "Pronte (" + n + "): premi ATTACCA o clicca il nemico." : ""); render();
    }
  }
  function onBossFace() {
    if (mode === "target" && pending && needFace(pending)) { var r = D.playCard(st, pending.uid, "ENEMY_FACE"); if (!r.ok) { toastHint(r.reason); SFX.bad(); return; } SFX.play(); pending = null; mode = "play"; afterAction(); return; }
    if (mode === "block" && st.pendingEnemyAttack && st.pendingEnemyAttack.boss > 0) { blockPick = "BOSS"; toastHint("Scegli la creatura che para il colpo"); render(); return; }
    if (mode === "play" && Object.keys(sel).some(function (k) { return sel[k]; })) doAttack();
  }
  function doAttack() {
    var ids = Object.keys(sel).filter(function (k) { return sel[k]; });
    if (!ids.length) { toastHint("Clicca prima una tua creatura, poi ATTACCA"); SFX.bad(); return; }
    var r = D.declareAttack(st, ids); if (!r.ok) { toastHint(r.reason); SFX.bad(); return; }
    (r.faceDamage ? SFX.hit() : SFX.click()); sel = {}; afterAction();
  }
  function doEndTurn() {
    var r = D.endTurn(st); sel = {};
    if (r.needsBlocks) { mode = "block"; blockMap = {}; blockPick = null; toastHint("Il nemico attacca! Assegna i bloccanti e CONFERMA."); SFX.click(); render(); save(); }
    else { SFX.click(); if (!afterEnemy()) { mode = "await"; toastHint("Turno chiuso. Fai un Pomodoro per il prossimo turno."); render(); resetPomo(); save(); } }
  }
  function confirmBlocks() { D.assignBlocks(st, blockMap); blockMap = {}; blockPick = null; if (!afterEnemy()) { mode = "await"; toastHint("Fai un Pomodoro per il prossimo turno."); render(); resetPomo(); save(); } }
  function afterAction() { if (st.status === "lost") return endGame(); if (st.pendingReward) return showReward(); render(); save(); }
  function afterEnemy() { if (st.status === "lost") { endGame(); return true; } if (st.pendingReward) { showReward(); return true; } return false; }

  /* ---------- reward (after each boss) ---------- */
  function showReward() {
    SFX.boss(); var ov = $("#overlay"); showScreen("overlay");
    var choices = st.pendingReward || [];
    ov.innerHTML = '<div style="text-align:center;padding:18px"><h2 class="head" style="color:var(--gold)">NEMICO SCONFITTO! (n. ' + st.bossesDefeated + ')</h2>' +
      '<div class="mini">Vigore ' + st.vigor + '/' + st.maxVigor + '. Scegli una carta per il mazzo (o salta):</div>' +
      '<div class="reward" id="rewardRow"></div><div style="margin-top:12px"><button id="skipReward" class="btn-blue">SALTA</button></div></div>';
    var row = $("#rewardRow");
    choices.forEach(function (cid) { var el = CR.renderCard(cid, {}); el.onclick = function () { D.takeReward(st, cid); SFX.play(); backToBattle(); }; row.appendChild(el); });
    $("#skipReward").onclick = function () { D.skipReward(st); SFX.click(); backToBattle(); };
  }
  function backToBattle() { showScreen("battle"); mode = "play"; render(); save(); toastHint("Avanti! Continua il turno o premi FINE TURNO."); }

  /* ---------- end of day ---------- */
  function endGame() {
    var won = st.bossesDefeated > 0; record();
    var ov = $("#overlay"); showScreen("overlay");
    var lost = st.status === "lost";
    ov.innerHTML = '<div style="text-align:center;padding:20px"><h2 class="head" style="color:' + (lost ? "var(--red)" : "var(--gold)") + '">' + (lost ? "TI HANNO TRAVOLTO" : "GIORNATA CHIUSA") + '</h2>' +
      '<div class="mini" style="margin:8px 0">Nemici sconfitti oggi: <b style="color:var(--gold)">' + st.bossesDefeated + '</b> · Pomodori: ' + st.pomodoros + ' · Minuti di focus: ' + st.focusMinutes + '</div>' +
      '<div class="mini">' + (won ? "Ottimo lavoro: ogni nemico battuto e' lavoro vero fatto." : "Nessun nemico battuto stavolta. Domani si riparte.") + '</div>' +
      '<div class="controls" style="margin-top:14px"><button id="againBtn" class="btn-gold">NUOVA GIORNATA</button> <button class="btn-blue" onclick="location.href=\'index.html\'">CLASSICA</button></div></div>';
    $("#againBtn").onclick = function () { lsDel(SKEY); st = null; showScreen("intro"); renderRituals(); };
    lsDel(SKEY);
  }
  function record() {
    try {
      var hist = HIST.load(LS), n = st.bossesDefeated;
      var trials = []; for (var i = 0; i < n; i++) trials.push({ text: "Nemico " + (i + 1), difficulty: 2, outcome: "superata" });
      var summary = { result: n > 0 ? "vinta" : "persa", trials: trials, trialsTotal: n, trialsDone: n, trialsDelegated: 0,
        pomodoros: st.pomodoros, focusMinutes: st.focusMinutes, focusGenerated: 0, focusSpent: 0,
        distractionsHandled: 0, distractionsExploded: 0, timeBlocksUsed: 0, diff3Cleared: 0, maxDifficultyCleared: n ? 2 : 0 };
      var d = new Date(), meta = { date: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"), weekday: ["dom", "lun", "mar", "mer", "gio", "ven", "sab"][d.getDay()], notes: "Duello: " + n + " nemici sconfitti" };
      HIST.recordDay(hist, summary, meta, PROG); HIST.save(LS, hist);
    } catch (e) {}
  }

  /* ---------- pomodoro ---------- */
  var timer = { running: false, endAt: 0, remain: 0, raf: null, dur: 0, task: "" };
  function fmt(s) { s = Math.max(0, Math.round(s)); var m = Math.floor(s / 60), ss = s % 60; return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss; }
  function resetPomo() { timer.running = false; cancelAnimationFrame(timer.raf); $("#clock").style.display = "none"; $("#durRow").classList.remove("hidden"); $("#runRow").classList.add("hidden"); }
  function tick() { if (!timer.running) return; timer.remain = (timer.endAt - Date.now()) / 1000; if (timer.remain <= 0) { timer.remain = 0; $("#clock").textContent = "00:00"; return pomoDone(); } $("#clock").textContent = fmt(timer.remain); timer.raf = requestAnimationFrame(tick); }
  function startPomo(dur) {
    if (mode !== "await" || timer.running) { if (mode !== "await") toastHint("Prima chiudi il turno (FINE TURNO)."); return; }
    timer.task = ($("#taskText").value || "Studio").trim() || "Studio"; timer.dur = dur;
    timer.remain = dur * 60; timer.endAt = Date.now() + timer.remain * 1000; timer.running = true;
    $("#clock").style.display = "block"; $("#clock").textContent = fmt(timer.remain);
    $("#durRow").classList.add("hidden"); $("#runRow").classList.remove("hidden"); SFX.click(); tick();
  }
  function pausePomo() { if (!timer.running) return; timer.running = false; cancelAnimationFrame(timer.raf); timer.remain = (timer.endAt - Date.now()) / 1000; $("#pPause").textContent = "RIPRENDI"; $("#pPause").onclick = resumePomo; }
  function resumePomo() { if (timer.running) return; timer.running = true; timer.endAt = Date.now() + timer.remain * 1000; $("#pPause").textContent = "PAUSA"; $("#pPause").onclick = pausePomo; tick(); }
  function pomoDone() {
    timer.running = false; cancelAnimationFrame(timer.raf); SFX.ding();
    if (!st || st.status !== "playing") return;
    D.pomodoro(st, timer.task, timer.dur); mode = "play"; $("#taskText").value = "";
    document.title = "Tocca a te · PROD-EX"; setTimeout(function () { document.title = "PROD-EX Duello"; }, 4000);
    toastHint("Appunto creato (mana). Ora gioca le carte e attacca.");
    resetPomo(); render(); save();
  }

  /* ---------- wire + init ---------- */
  function wire() {
    $("#beginBtn").onclick = startGame;
    $$(".durBtn").forEach(function (b) { b.onclick = function () { startPomo(parseInt(b.getAttribute("data-d"), 10)); }; });
    $("#pPause").onclick = pausePomo;
    $("#pReset").onclick = function () { resetPomo(); SFX.click(); };
    $("#attackBtn").onclick = doAttack;
    $("#endBtn").onclick = doEndTurn;
    $("#confirmBlockBtn").onclick = confirmBlocks;
    $("#endDayBtn").onclick = function () { if (confirm("Chiudere la giornata? Si registra il risultato.")) { D.endDay(st); endGame(); } };
    $("#bossArt").onclick = onBossFace;
    $("#sndBtn").onclick = function () { snd = !snd; lsSet(SND, snd); $("#sndBtn").textContent = snd ? "♪ ON" : "♪ OFF"; if (snd) SFX.ding(); };
    CR.drawArt($("#introArt"), "boss");
  }
  function resume() {
    snd = lsGet(SND, true); $("#sndBtn").textContent = snd ? "♪ ON" : "♪ OFF";
    var sd = lsGet(SKEY, null);
    if (sd && sd.st && sd.st.status === "playing") { st = sd.st; st._rng = D.makeRng(); mode = "await"; showScreen("battle"); resetPomo(); render(); }
    else { renderRituals(); showScreen("intro"); }
  }
  function init() { wire(); resume(); }
  // test hook (harmless in production): lets headless tests drive a completed Pomodoro
  window.__duelTest = { state: function () { return st; }, mode: function () { return mode; },
    forcePomodoro: function (dur) { if (st && st.status === "playing" && mode === "await") { D.pomodoro(st, "test", dur || 25); mode = "play"; render(); } } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
