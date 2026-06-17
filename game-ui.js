/* PROD-EX v2 UI: three-phase flow (Pianifica / Concentrati / Bilancio),
   dashboard, progression HUD, history + export. Pixel-art on canvas. */
(function () {
  "use strict";
  var G = window.PRODEX, PROG = window.PRODEX_PROG, HIST = window.PRODEX_HIST;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var LS = window.localStorage;

  /* ---------------- pixel art ---------------- */
  var PAL = {
    "K": "#0a0814", "W": "#ffffff", "l": "#cfd0e0", "d": "#3a3658",
    "b": "#4f8be8", "B": "#27407e", "s": "#cfe0ff", "g": "#f4c95d", "G": "#a9781e",
    "r": "#e0566a", "R": "#8a2230", "n": "#5bc77f", "N": "#1f5a36",
    "p": "#9b6ff0", "P": "#5b3aa0", "o": "#e0883a", "m": "#7a4a2a", "y": "#ffe9a8", "c": "#3fb6c8"
  };
  var SPR = {
    book:["                ","   KKKKKKKKKK   ","  KBbbbbbbbbBK  ","  KbWWWWWWWWbK  ","  KbBbbbbbbBbK  ","  KbWWWWWWWWbK  ","  KbBbbbbbbBbK  ","  KbWWWWWWWWbK  ","  KbBbbbbbbBbK  ","  KbWWWWWWWWbK  ","  KbBsssssbBbK  ","  KbbBBBBBBbbK  ","  KKbbbbbbbbKK  ","    KKKKKKKK    ","                ","                "],
    coin:["                ","     KKKKKK     ","   KKggggggKK   ","  KggGggggGggK  "," KggggWWWWggggK "," KgggWggggWgggK "," KggGgggggggGgK "," KggggggWgggggK "," KgggggWggggGgK "," KggGgWggggggGK "," KggggWWWWggggK ","  KggGggggGggK  ","   KKggggggKK   ","     KKKKKK     ","                ","                "],
    mug:["                ","   s  s  s      ","  s  s  s       ","                ","  KKKKKKKKK     ","  KrrrrrrrK KK  ","  KrWWWWWrKK rK ","  KrWrrrWrK  rK ","  KrWrrrWrK rK  ","  KrWWWWWrKKK   ","  KrrrrrrrK     ","  KRRRRRRRK     ","  KKKKKKKKK     ","                ","                ","                "],
    tomato:["                ","      nNn       ","     nNKNn      ","    KKrrrKK     ","   KrrrrrrrK    ","  KrrWrrrrrrK   ","  KrWWrrrrrrK   ","  KrrrrrrrrrK   ","  KrrrrrrrrrK   ","  KRrrrrrrRrK   ","   KRrrrrRrK    ","   KKRRRRRKK    ","    KKKKKKK     ","                ","                ","                "],
    wave:["                ","                ","  K          K  "," KbK   KK   KbK "," KbbK KssK KbbK ","KbbbBKsssBKbbbK ","KsbbbBsssBbbbsK "," KBbbbBBBbbbBK  ","  KBsbbbbbsBK   ","   KBbbbbbBK    ","    KBbbbBK     ","  K  KBBBK   K  "," KbK   K    KbK "," KbbK     KssK  ","                ","                "],
    clock:["                ","     KKKKKK     ","   KKbbbbbbKK   ","  KbbWWWWWWbbK  "," KbWWlllllWWbK  "," KbWlWlllWlWbK  "," KbWlllWlllWbK  "," KbWllWKllWlbK  "," KbWllKKWllWbK  "," KbWlllWlllWbK  "," KbWWlllllWWbK  ","  KbbWWWWWWbbK  ","   KKbbbbbbKK   ","     KKKKKK     ","                ","                "],
    arrow:["                ","                ","      KK        ","   gg KgK       ","  gWWg KgK      ","  gWWg  KgK     ","  gggKKKKKgK    ","  ggKgggggGgK   ","  ggKgggggGgK   ","  gggKKKKKgK    ","  gWWg  KgK     ","  gWWg KgK      ","   gg KgK       ","      KK        ","                ","                "],
    grid:["                "," KKKKKKKKKKKKK  "," KnnnnnKgggggK  "," KnnWnnKggggGK  "," KnnnnnKgggggK  "," KnnnnnKggGggK  "," KKKKKKKKKKKKK  "," KrrrrrKbbbbbK  "," KrrRrrKbbbWbK  "," KrrrrrKbbbbbK  "," KrRrrrKbbbbbK  "," KrrrrrKbbbbbK  "," KKKKKKKKKKKKK  ","                ","                ","                "],
    leaf:["                ","         KK     ","        KnNK    ","       KnnNK    ","   KK KnnnNK    ","  KnNKnnnNK     ","  KnnNnnNK  K   ","  KnnnWNK  KnK  ","   KnWWNK KnNK  ","   KnnNK KnnNK  ","    KnNKnnnNK   ","    KNKnnNKK    ","     KNNKK      ","    KmmK        ","    KmK         ","                "],
    orb:["                ","      KKKK      ","    KKggggKK    ","   KgyWyggGgK   ","  KgyWWyggGGgK  ","  KgyWyggggGgK  ","  KggggggggGgK  ","  KggggggGGGgK  ","  KgGggGGGGGgK  ","   KgGGGGGGgK   ","    KKgGGgKK    ","      KKKK      ","                ","                ","                ","                "],
    slime:["                ","                ","                ","     KKKKKK     ","    KccccccK    ","   KcWKccWKcK   ","   KcWKccWKcK   ","  KccccccccccK  ","  KcKccccccKcK  ","  KccKKKKKKccK  ","  KcccccccccCK  "," KcccccccccccK  "," KcCcCcCcCcCcK  "," KKKKKKKKKKKKK  ","                ","                "]
  };
  function drawPixels(cv, sprite, opt) {
    opt = opt || {}; var ctx = cv.getContext("2d");
    var n = sprite.length, m = 0, i, j;
    for (i = 0; i < n; i++) m = Math.max(m, sprite[i].length);
    var px = Math.floor(Math.min(cv.width / m, cv.height / n));
    var ox = Math.floor((cv.width - px * m) / 2), oy = Math.floor((cv.height - px * n) / 2);
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (i = 0; i < n; i++) for (j = 0; j < sprite[i].length; j++) {
      var ch = sprite[i][j]; if (ch === " ") continue;
      var col = (opt.recolor && opt.recolor[ch]) || PAL[ch]; if (!col) continue;
      ctx.fillStyle = col; ctx.fillRect(ox + j * px, oy + i * px, px, px);
    }
  }

  /* ---------------- audio ---------------- */
  var AC = null, soundOn = true;
  function actx() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return AC; }
  function beep(f, dur, type, vol, when) {
    if (!soundOn) return; var c = actx(); if (!c) return;
    var t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || "square"; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  var SFX = {
    click: function () { beep(420, .06, "square", .08); },
    land: function () { beep(620, .07, "triangle", .1); beep(880, .08, "triangle", .08, .05); },
    hit: function () { beep(180, .12, "sawtooth", .14); beep(90, .16, "square", .1, .02); },
    kill: function () { [523, 659, 784, 1046].forEach(function (f, i) { beep(f, .1, "square", .1, i * .06); }); },
    bad: function () { beep(140, .18, "sawtooth", .13); beep(110, .22, "square", .1, .06); },
    ding: function () { beep(880, .12, "sine", .12); beep(1320, .2, "sine", .1, .08); },
    win: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { beep(f, .16, "square", .11, i * .12); }); },
    lose: function () { [330, 294, 262, 196].forEach(function (f, i) { beep(f, .22, "sawtooth", .12, i * .16); }); },
    levelup: function () { [659, 880, 1046, 1318].forEach(function (f, i) { beep(f, .14, "triangle", .12, i * .09); }); }
  };

  /* ---------------- persistence ---------------- */
  var ACTIVE = "prodex_active", SND = "prodex_sound";
  function lsGet(k, d) { try { var v = LS.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { LS.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function lsDel(k) { try { LS.removeItem(k); } catch (e) {} }

  /* ---------------- state ---------------- */
  var hist, core = null, planned = [], focusMinutes = 0, phase = "plan", pendingT = 2, pendingSave = null;
  var ICON = { deep_work: "book", quick_win: "coin", caffeine: "mug", pomodoro: "tomato", flow: "wave", time_block: "clock", delegate: "arrow", eisenhower: "grid", recovery: "leaf" };
  var HAND = ["pomodoro", "flow", "time_block", "delegate", "eisenhower", "recovery"];

  function saveActive() {
    if (phase === "plan") lsSet(ACTIVE, { phase: phase, planned: planned });
    else if (phase === "focus" && core) lsSet(ACTIVE, { phase: phase, planned: planned, focusMinutes: focusMinutes, core: core });
  }
  function clearActive() { lsDel(ACTIVE); }

  function todayMeta() {
    var d = new Date(), iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    var wd = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"][d.getDay()];
    return { date: iso, weekday: wd };
  }

  /* ---------------- phase control ---------------- */
  function setPhase(p) {
    phase = p;
    $$(".phase").forEach(function (el) { el.classList.remove("on"); });
    var map = { plan: "phasePlan", focus: "phaseFocus", review: "phaseReview", history: "phaseHistory" };
    var el = document.getElementById(map[p]); if (el) el.classList.add("on");
    $$(".step").forEach(function (s) {
      s.classList.remove("on", "done");
      var ph = s.getAttribute("data-ph");
      var order = { plan: 0, focus: 1, review: 2 };
      if (p !== "history") {
        if (ph === p) s.classList.add("on");
        else if (order[ph] < order[p]) s.classList.add("done");
      }
    });
    if (p === "plan") renderPlan();
    if (p === "focus") renderFocus();
    if (p === "review") renderReview();
    if (p === "history") renderHistory();
    renderHUD();
  }

  /* ---------------- HUD ---------------- */
  function renderHUD() {
    var info = PROG.levelInfo(hist.progress.xp);
    $("#lvlTitle").textContent = info.title;
    $("#xpFill").style.width = info.pct + "%";
    $("#xpText").textContent = "Lv " + info.level + " · " + info.xp + " XP";
    var f = core ? core.focus : 0;
    $("#focusN").textContent = f; if ($("#focusN2")) $("#focusN2").textContent = f;
    var maxC = core ? core.maxComposure : 10, comp = core ? core.composure : maxC;
    var hb = $("#hearts"); hb.innerHTML = "";
    for (var i = 0; i < maxC; i++) { var h = document.createElement("div"); h.className = "heart" + (i < comp ? "" : " off"); hb.appendChild(h); }
    $("#streakN").textContent = HIST.aggregate(hist.days).currentStreak;
  }

  /* ---------------- PLAN ---------------- */
  function renderPlan() {
    var box = $("#planList"); box.innerHTML = "";
    planned.forEach(function (t, idx) {
      var row = document.createElement("div"); row.className = "trow";
      var dot = document.createElement("div"); dot.className = "dot d" + t.toughness; dot.textContent = t.toughness; row.appendChild(dot);
      var tx = document.createElement("div"); tx.className = "txt"; tx.textContent = t.text; row.appendChild(tx);
      var del = document.createElement("button"); del.className = "del btn-red"; del.textContent = "X";
      del.onclick = function () { planned.splice(idx, 1); SFX.click(); saveActive(); renderPlan(); };
      row.appendChild(del); box.appendChild(row);
    });
    if (!planned.length) box.innerHTML = '<div class="empty-note">Aggiungi le Prove di oggi per iniziare.</div>';
    $("#startDayBtn").disabled = planned.length === 0;
  }
  function addPlanned() {
    var txt = $("#taskText").value.trim();
    if (!txt) { toast("Scrivi prima la Prova"); SFX.bad(); $("#taskText").focus(); return; }
    planned.push({ text: txt.slice(0, 80), toughness: pendingT });
    $("#taskText").value = ""; SFX.land(); saveActive(); renderPlan();
  }
  function startDay() {
    if (!planned.length) return;
    core = G.newGame({ tasks: planned.map(function (t) { return { text: t.text, toughness: t.toughness }; }) });
    G.startDay(core); core.resolveOpen = false; focusMinutes = 0;
    var rec = G.recommend(core); core.target = rec ? rec.id : null;
    SFX.ding(); resetPomo("work"); setPhase("focus"); saveActive();
  }

  /* ---------------- FOCUS ---------------- */
  function renderFocus() {
    if (!core) return;
    var done = core.completed.filter(function (c) { return c.outcome === "superata"; }).length;
    var total = core.completed.length + core.tasks.length;
    $("#progTag").textContent = done + "/" + total + " superate";
    core.recommended = core.recommended || null;
    // enemies
    var box = $("#enemies"); box.innerHTML = "";
    if (!core.tasks.length) box.innerHTML = '<div class="empty-note">Nessuna Prova rimasta. Chiudi la giornata.</div>';
    core.tasks.forEach(function (t) {
      var el = document.createElement("div");
      el.className = "enemy pixel-border" + (core.target === t.id ? " sel" : "") + (core.recommended === t.id ? " rec" : "");
      var variant = t.toughness >= 3 ? { c: "#e0566a", C: "#8a2230" } : t.toughness === 2 ? { c: "#f4c95d", C: "#a9781e" } : { c: "#5bc77f", C: "#1f5a36" };
      var cv = document.createElement("canvas"); cv.width = 40; cv.height = 40; el.appendChild(cv); drawPixels(cv, SPR.slime, { recolor: variant });
      var mid = document.createElement("div"); mid.style.flex = "1";
      var nm = document.createElement("div"); nm.className = "nm"; nm.textContent = t.text + (t.enchanted ? " 🔒" : ""); mid.appendChild(nm);
      var hp = document.createElement("div"); hp.className = "hp";
      for (var k = 0; k < t.maxToughness; k++) { var p = document.createElement("div"); p.className = "pip" + (k < t.toughness ? "" : " gone"); if (k < t.toughness) p.style.background = variant.c; hp.appendChild(p); }
      mid.appendChild(hp); el.appendChild(mid);
      el.onclick = function () { core.target = t.id; SFX.click(); renderFocus(); };
      box.appendChild(el);
    });
    // done list
    var dl = $("#doneList"); dl.innerHTML = "";
    core.completed.forEach(function (c) {
      var d = document.createElement("div"); d.className = "done-trial";
      d.textContent = (c.outcome === "affidata" ? "→ " : "✔ ") + c.text; dl.appendChild(d);
    });
    // target + window
    var tg = G.findTask(core, core.target);
    $("#pTarget").textContent = "Prova: " + (tg ? tg.text : "scegline una a sinistra");
    $("#windowTag").innerHTML = core.resolveOpen ? '<span class="window ok">AVANZAMENTO SBLOCCATO</span>' : '<span class="window no">FAI UN POMODORO</span>';
    renderLands(); renderDists(); renderHand(); renderLog(); renderHUD();
  }
  function renderLands() {
    var box = $("#lands"); box.innerHTML = "";
    core.lands.forEach(function (l) {
      var def = G.CARDS[l.card], el = document.createElement("div");
      el.className = "land pixel-border" + (l.tapped ? " tapped" : "");
      var cv = document.createElement("canvas"); cv.width = 34; cv.height = 34; el.appendChild(cv); drawPixels(cv, SPR[ICON[l.card]]);
      var nm = document.createElement("div"); nm.className = "ln"; nm.textContent = def.name; el.appendChild(nm);
      var lp = document.createElement("div"); lp.className = "lp"; lp.textContent = l.tapped ? "TAP." : "+" + def.produce; el.appendChild(lp);
      el.onclick = function () { if (l.tapped) return; var r = G.tapLand(core, l.id); if (!r.ok) { toast(r.reason); SFX.bad(); } else SFX.land(); saveActive(); renderFocus(); };
      box.appendChild(el);
    });
  }
  function renderDists() {
    var box = $("#dists"); box.innerHTML = "";
    if (!core.distractions.length) { box.innerHTML = '<span class="mini">Nessuna. Per ora.</span>'; return; }
    core.distractions.forEach(function (d) {
      var el = document.createElement("div"); el.className = "dist";
      var fx = d.effect === "composure" ? "-2 Vigore" : d.effect === "scope" ? "+1 diff." : "ruba land";
      el.innerHTML = '<b>!</b> ' + d.text + ' <span class="mini">tra ' + d.timer + " · " + fx + '</span>';
      var b = document.createElement("button"); b.className = "btn-red"; b.textContent = "1F";
      b.onclick = function () { var r = G.dismissDistraction(core, d.id); if (!r.ok) { toast(r.reason); SFX.bad(); } else SFX.click(); saveActive(); renderFocus(); };
      el.appendChild(b); box.appendChild(el);
    });
  }
  function renderHand() {
    var box = $("#hand"); box.innerHTML = "";
    HAND.forEach(function (id) {
      var c = G.CARDS[id], needW = c.kind === "damage", afford = core.focus >= c.cost, dis = !afford || (needW && !core.resolveOpen);
      var el = document.createElement("div"); el.className = "card pixel-border " + c.ident + (dis ? " dis" : "");
      el.innerHTML = '<div class="cost">' + c.cost + "</div>";
      var cv = document.createElement("canvas"); cv.width = 38; cv.height = 38; el.appendChild(cv); drawPixels(cv, SPR[ICON[id]]);
      var nm = document.createElement("div"); nm.className = "cn"; nm.textContent = c.name; el.appendChild(nm);
      var tt = document.createElement("div"); tt.className = "ct"; tt.textContent = c.text; el.appendChild(tt);
      el.onclick = function () { if (dis) { toast(!afford ? "Focus insufficiente" : "Completa prima un Pomodoro"); SFX.bad(); return; } doPlay(id); };
      box.appendChild(el);
    });
  }
  function renderLog() {
    var box = $("#log"); box.innerHTML = "";
    core.log.slice(-30).forEach(function (m) {
      var p = document.createElement("p");
      if (/Vigore|scope creep|DISTRAZIONE|ruba|rallenta|fermi|zero/.test(m)) p.className = "warn";
      if (/SUPERATA|conquistata|Blocco|\+\d+ Focus|COMPLETATO/.test(m)) p.className = "sys";
      p.textContent = "› " + m; box.appendChild(p);
    });
    box.scrollTop = box.scrollHeight;
  }
  function addTrialFocus(t) {
    if (!core || core.status !== "playing") return;
    var txt = $("#focusTaskText").value.trim();
    if (!txt) { toast("Scrivi la Prova"); SFX.bad(); $("#focusTaskText").focus(); return; }
    var tk = G.addTask(core, txt.slice(0, 80), t);
    if (!core.target) core.target = tk.id;
    $("#focusTaskText").value = ""; SFX.land(); saveActive(); renderFocus();
  }
  function doPlay(id) {
    var c = G.CARDS[id], needT = (c.kind === "damage" || c.kind === "protect" || c.kind === "remove");
    if (needT && !G.findTask(core, core.target)) { toast("Scegli una Prova"); SFX.bad(); return; }
    var before = core.tasks.length, r = G.playCard(core, id, core.target);
    if (!r.ok) { toast(r.reason); SFX.bad(); return; }
    if (c.kind === "damage") { core.tasks.length < before ? SFX.kill() : SFX.hit(); } else SFX.click();
    saveActive();
    if (core.status !== "playing") return goReview();
    renderFocus();
  }

  /* ---------------- pomodoro ---------------- */
  var timer = { running: false, mode: "work", endAt: 0, remain: 1500, raf: null };
  function fmt(s) { s = Math.max(0, Math.round(s)); var m = Math.floor(s / 60), ss = s % 60; return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss; }
  function setClock() { $("#clock").textContent = fmt(timer.remain); }
  function workSecs() { return Math.max(1, parseInt($("#workMin").value, 10) || 25) * 60; }
  function breakSecs() { return Math.max(1, parseInt($("#breakMin").value, 10) || 5) * 60; }
  function pmodeUI() { var e = $("#pmode"); e.textContent = timer.mode === "work" ? "LAVORO" : "PAUSA"; e.className = "mode head" + (timer.mode === "break" ? " break" : ""); }
  function tick() {
    if (!timer.running) return;
    timer.remain = (timer.endAt - Date.now()) / 1000;
    if (timer.remain <= 0) { timer.remain = 0; setClock(); return completePomo(); }
    setClock(); timer.raf = requestAnimationFrame(tick);
  }
  function startPomo() {
    if (timer.running) return;
    if (timer.mode === "work") {
      if (!G.findTask(core, core.target)) { toast("Scegli prima una Prova"); SFX.bad(); return; }
      core.resolveOpen = false; renderFocus();
    }
    timer.running = true; timer.endAt = Date.now() + timer.remain * 1000;
    $("#pStart").disabled = true; $("#pPause").disabled = false; SFX.click(); tick();
  }
  function pausePomo() {
    if (!timer.running) return; timer.running = false; cancelAnimationFrame(timer.raf);
    timer.remain = (timer.endAt - Date.now()) / 1000;
    $("#pStart").disabled = false; $("#pPause").disabled = true; setClock();
  }
  function resetPomo(mode) {
    timer.running = false; cancelAnimationFrame(timer.raf); timer.mode = mode || "work";
    timer.remain = timer.mode === "work" ? workSecs() : breakSecs();
    if ($("#pStart")) { $("#pStart").disabled = false; $("#pPause").disabled = true; }
    pmodeUI(); setClock();
  }
  function completePomo() {
    timer.running = false; cancelAnimationFrame(timer.raf); SFX.ding();
    if (timer.mode === "work") {
      focusMinutes += Math.round(workSecs() / 60);
      G.completeBlock(core, core.target);
      flashTitle("✔ BLOCCO FATTO"); saveActive();
      if (core.status !== "playing") return goReview();
      resetPomo("break"); toast("Pomodoro fatto! Tappa le Focus e gioca le carte.");
    } else { flashTitle("PRONTO"); resetPomo("work"); toast("Pausa finita. Nuovo blocco?"); }
    renderFocus();
  }

  /* ---------------- REVIEW ---------------- */
  function goReview() {
    timer.running = false; cancelAnimationFrame(timer.raf);
    var summary = G.daySummary(core, { focusMinutes: focusMinutes });
    var meta = todayMeta(); meta.notes = "";
    // preview progression without saving
    var provisional = HIST.buildRecord(meta, summary);
    var totals = HIST.aggregate(hist.days.concat([provisional]));
    var preview = PROG.applyDay(hist.progress, summary, totals);
    pendingSave = { summary: summary, meta: meta, preview: preview };
    if (summary.result === "vinta") SFX.win(); else if (summary.result === "persa") SFX.lose();
    setPhase("review");
  }
  function renderReview() {
    if (!pendingSave) return;
    var s = pendingSave.summary, pv = pendingSave.preview;
    var bn = $("#revBanner");
    if (s.result === "vinta") bn.innerHTML = '<div class="banner win">GIORNATA CONQUISTATA</div>';
    else if (s.result === "persa") bn.innerHTML = '<div class="banner lose">TI SEI FERMATO</div>';
    else bn.innerHTML = '<div class="banner" style="background:#1c3360;color:#bcd6ff;border:3px solid #000">GIORNATA CHIUSA</div>';
    var stats = [
      ["Prove superate", s.trialsDone + "/" + s.trialsTotal], ["Pomodori", s.pomodoros],
      ["Minuti focus", Math.round(s.focusMinutes)], ["Distrazioni ok", s.distractionsHandled],
      ["Distraz. esplose", s.distractionsExploded], ["Focus generato", s.focusGenerated]
    ];
    $("#revStats").innerHTML = stats.map(function (x) { return '<div class="rcard"><div class="v">' + x[1] + '</div><div class="l">' + x[0] + "</div></div>"; }).join("");
    var xpTxt = "+" + pv.xpGained + " XP";
    if (pv.leveledTo > pv.leveledFrom) { xpTxt += "  ·  LIVELLO " + pv.leveledTo + "!"; SFX.levelup(); }
    $("#revXp").textContent = xpTxt;
    var med = $("#revMedals");
    if (pv.newMedals.length) {
      med.innerHTML = pv.newMedals.map(function (id) { var m = PROG.medalById(id); return '<span class="medal">🏅 ' + (m ? m.name : id) + "</span>"; }).join("");
    } else med.innerHTML = "";
    $("#saveDayBtn").classList.remove("hidden"); $("#newDayBtn").classList.add("hidden");
    renderHUD();
  }
  function saveDay() {
    if (!pendingSave) return;
    pendingSave.meta.notes = $("#revNotes").value || "";
    HIST.recordDay(hist, pendingSave.summary, pendingSave.meta, PROG);
    HIST.save(LS, hist); clearActive(); pendingSave = null; core = null; planned = [];
    $("#saveDayBtn").classList.add("hidden"); $("#newDayBtn").classList.remove("hidden");
    $("#revNotes").value = ""; SFX.click(); toast("Giornata salvata nello storico."); renderHUD();
  }
  function newDay() { planned = []; core = null; focusMinutes = 0; pendingSave = null; resetPomo("work"); setPhase("plan"); }

  /* ---------------- HISTORY ---------------- */
  function renderHistory() {
    var days = hist.days, agg = HIST.aggregate(days);
    $("#histTag").textContent = days.length + " giornate";
    var heat = $("#heat"); heat.innerHTML = "";
    var last = days.slice(-28);
    for (var i = 0; i < 28 - last.length; i++) { var e = document.createElement("div"); e.className = "cell h-none"; heat.appendChild(e); }
    last.forEach(function (d) {
      var cls = d.result === "vinta" ? "h-win" : d.result === "persa" ? "h-lose" : "h-part";
      var c = document.createElement("div"); c.className = "cell " + cls; c.title = d.date + " · " + d.result; heat.appendChild(c);
    });
    var info = PROG.levelInfo(hist.progress.xp);
    var stats = [
      ["Giornate vinte", agg.winsTotal], ["Serie attuale", agg.currentStreak], ["Record serie", agg.recordStreak],
      ["Pomodori", agg.pomodorosTotal], ["Minuti focus", agg.focusMinutesTotal], ["Prove superate", agg.trialsDoneTotal],
      ["Livello", info.level], ["Medaglie", hist.progress.medals.length + "/" + PROG.MEDALS.length]
    ];
    $("#histStats").innerHTML = stats.map(function (x) { return '<div class="rcard"><div class="v">' + x[1] + '</div><div class="l">' + x[0] + "</div></div>"; }).join("");
    var dl = $("#daylist"); dl.innerHTML = "";
    days.slice().reverse().forEach(function (d) {
      var row = document.createElement("div"); row.className = "dayrow";
      var badge = d.result === "vinta" ? '<span class="b btn-green">VINTA</span>' : d.result === "persa" ? '<span class="b btn-red">PERSA</span>' : '<span class="b btn-blue">CHIUSA</span>';
      row.innerHTML = badge + "<span>" + d.date + " (" + d.weekday + ")</span><span class='mini'>" + d.trialsDone + "/" + d.trialsTotal + " prove · " + d.pomodoros + " pomo · " + Math.round(d.focusMinutes) + " min</span>";
      dl.appendChild(row);
    });
    renderHUD();
  }
  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain" }), url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------------- misc ---------------- */
  var toastT = null;
  function toast(m) { var t = $("#toast"); t.textContent = m; t.style.display = "block"; clearTimeout(toastT); toastT = setTimeout(function () { t.style.display = "none"; }, 1700); }
  var titleBase = "PROD-EX: The Workday Standoff";
  function flashTitle(s) { document.title = s + " · PROD-EX"; setTimeout(function () { document.title = titleBase; }, 4000); }

  /* ---------------- events ---------------- */
  function wire() {
    $("#startBtn").onclick = function () { $("#title").style.display = "none"; $("#game").classList.remove("hidden"); actx(); SFX.ding(); boot2(); };
    $$(".tBtn").forEach(function (b) { b.onclick = function () { pendingT = parseInt(b.getAttribute("data-t"), 10); addPlanned(); }; });
    $("#taskText").addEventListener("keydown", function (e) { if (e.key === "Enter") addPlanned(); });
    $("#startDayBtn").onclick = startDay;
    $$(".ftBtn").forEach(function (b) { b.onclick = function () { addTrialFocus(parseInt(b.getAttribute("data-t"), 10)); }; });
    $("#focusTaskText").addEventListener("keydown", function (e) { if (e.key === "Enter") addTrialFocus(2); });
    $("#pStart").onclick = startPomo; $("#pPause").onclick = pausePomo; $("#pReset").onclick = function () { resetPomo(timer.mode); SFX.click(); };
    $("#endDayBtn").onclick = function () { if (confirm("Chiudere la giornata adesso?")) goReview(); };
    $("#saveDayBtn").onclick = saveDay; $("#newDayBtn").onclick = newDay;
    $("#histBtn").onclick = function () { setPhase("history"); };
    $("#backBtn").onclick = function () { setPhase(core ? "focus" : (pendingSave ? "review" : "plan")); };
    $("#expCsv").onclick = function () { download("prodex_storico.csv", HIST.toCSV(hist.days), "text/csv"); SFX.click(); };
    $("#expJson").onclick = function () { download("prodex_backup.json", HIST.toJSON(hist), "application/json"); SFX.click(); };
    $("#impJson").onclick = function () { $("#impFile").click(); };
    $("#impFile").onchange = function (e) {
      var f = e.target.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () { try { hist = HIST.parseImport(rd.result); HIST.save(LS, hist); toast("Storico importato."); renderHistory(); } catch (err) { toast("File non valido"); SFX.bad(); } };
      rd.readAsText(f); e.target.value = "";
    };
    $("#resetHist").onclick = function () { if (confirm("Azzerare tutto lo storico e la progressione? Operazione irreversibile.")) { hist = HIST.empty(); HIST.save(LS, hist); SFX.bad(); renderHistory(); } };
    $("#sndBtn").onclick = function () { soundOn = !soundOn; lsSet(SND, soundOn); $("#sndBtn").textContent = soundOn ? "♪ ON" : "♪ OFF"; if (soundOn) SFX.ding(); };
    $("#workMin").onchange = function () { if (timer.mode === "work" && !timer.running) resetPomo("work"); };
    $("#breakMin").onchange = function () { if (timer.mode === "break" && !timer.running) resetPomo("break"); };
  }

  /* ---------------- init ---------------- */
  function boot2() {
    // restore active day if present
    var act = lsGet(ACTIVE, null);
    if (act && act.phase === "focus" && act.core) {
      core = act.core; core._rng = G.makeRng(); focusMinutes = act.focusMinutes || 0;
      planned = act.planned || []; resetPomo("work"); setPhase("focus");
    } else if (act && act.phase === "plan") {
      planned = act.planned || []; setPhase("plan");
    } else { setPhase("plan"); }
  }
  function init() {
    hist = HIST.load(LS);
    soundOn = lsGet(SND, true); $("#sndBtn").textContent = soundOn ? "♪ ON" : "♪ OFF";
    wire();
    drawPixels($("#titleArt"), SPR.slime, { recolor: { c: "#9b6ff0", C: "#5b3aa0" } });
    drawPixels($("#focusOrb"), SPR.orb);
    resetPomo("work"); renderHUD();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
