/* PROD-EX UI layer: pixel-art rendering, Pomodoro, audio, persistence. */
(function () {
  "use strict";
  var G = window.PRODEX;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---------------- pixel art ----------------
  var PAL = {
    "K": "#0a0814", "W": "#ffffff", "l": "#cfd0e0", "d": "#3a3658",
    "b": "#4f8be8", "B": "#27407e", "s": "#cfe0ff",
    "g": "#f4c95d", "G": "#a9781e",
    "r": "#e0566a", "R": "#8a2230",
    "n": "#5bc77f", "N": "#1f5a36",
    "p": "#9b6ff0", "P": "#5b3aa0",
    "o": "#e0883a", "m": "#7a4a2a", "y": "#ffe9a8", "c": "#3fb6c8"
  };
  // 16x16 sprites. Space = transparent.
  var SPR = {
    book: [
      "                ",
      "   KKKKKKKKKK   ",
      "  KBbbbbbbbbBK  ",
      "  KbWWWWWWWWbK  ",
      "  KbBbbbbbbBbK  ",
      "  KbWWWWWWWWbK  ",
      "  KbBbbbbbbBbK  ",
      "  KbWWWWWWWWbK  ",
      "  KbBbbbbbbBbK  ",
      "  KbWWWWWWWWbK  ",
      "  KbBsssssbBbK  ",
      "  KbbBBBBBBbbK  ",
      "  KKbbbbbbbbKK  ",
      "    KKKKKKKK    ",
      "                ",
      "                "
    ],
    coin: [
      "                ",
      "     KKKKKK     ",
      "   KKggggggKK   ",
      "  KggGggggGggK  ",
      " KggggWWWWggggK ",
      " KgggWggggWgggK ",
      " KggGgggggggGgK ",
      " KggggggWgggggK ",
      " KgggggWggggGgK ",
      " KggGgWggggggGK ",
      " KggggWWWWggggK ",
      "  KggGggggGggK  ",
      "   KKggggggKK   ",
      "     KKKKKK     ",
      "                ",
      "                "
    ],
    mug: [
      "                ",
      "   s  s  s      ",
      "  s  s  s       ",
      "                ",
      "  KKKKKKKKK     ",
      "  KrrrrrrrK KK  ",
      "  KrWWWWWrKK rK ",
      "  KrWrrrWrK  rK ",
      "  KrWrrrWrK rK  ",
      "  KrWWWWWrKKK   ",
      "  KrrrrrrrK     ",
      "  KRRRRRRRK     ",
      "  KKKKKKKKK     ",
      "                ",
      "                ",
      "                "
    ],
    tomato: [
      "                ",
      "      nNn       ",
      "     nNKNn      ",
      "    KKrrrKK     ",
      "   KrrrrrrrK    ",
      "  KrrWrrrrrrK   ",
      "  KrWWrrrrrrK   ",
      "  KrrrrrrrrrK   ",
      "  KrrrrrrrrrK   ",
      "  KRrrrrrrRrK   ",
      "   KRrrrrRrK    ",
      "   KKRRRRRKK    ",
      "    KKKKKKK     ",
      "                ",
      "                ",
      "                "
    ],
    wave: [
      "                ",
      "                ",
      "  K          K  ",
      " KbK   KK   KbK ",
      " KbbK KssK KbbK ",
      "KbbbBKsssBKbbbK ",
      "KsbbbBsssBbbbsK ",
      " KBbbbBBBbbbBK  ",
      "  KBsbbbbbsBK   ",
      "   KBbbbbbBK    ",
      "    KBbbbBK     ",
      "  K  KBBBK   K  ",
      " KbK   K    KbK ",
      " KbbK     KssK  ",
      "                ",
      "                "
    ],
    clock: [
      "                ",
      "     KKKKKK     ",
      "   KKbbbbbbKK   ",
      "  KbbWWWWWWbbK  ",
      " KbWWlllllWWbK  ",
      " KbWlWlllWlWbK  ",
      " KbWlllWlllWbK  ",
      " KbWllWKllWlbK  ",
      " KbWllKKWllWbK  ",
      " KbWlllWlllWbK  ",
      " KbWWlllllWWbK  ",
      "  KbbWWWWWWbbK  ",
      "   KKbbbbbbKK   ",
      "     KKKKKK     ",
      "                ",
      "                "
    ],
    arrow: [
      "                ",
      "                ",
      "      KK        ",
      "   gg KgK       ",
      "  gWWg KgK      ",
      "  gWWg  KgK     ",
      "  gggKKKKKgK    ",
      "  ggKgggggGgK   ",
      "  ggKgggggGgK   ",
      "  gggKKKKKgK    ",
      "  gWWg  KgK     ",
      "  gWWg KgK      ",
      "   gg KgK       ",
      "      KK        ",
      "                ",
      "                "
    ],
    grid: [
      "                ",
      " KKKKKKKKKKKKK  ",
      " KnnnnnKgggggK  ",
      " KnnWnnKggggGK  ",
      " KnnnnnKgggggK  ",
      " KnnnnnKggGggK  ",
      " KKKKKKKKKKKKK  ",
      " KrrrrrKbbbbbK  ",
      " KrrRrrKbbbWbK  ",
      " KrrrrrKbbbbbK  ",
      " KrRrrrKbbbbbK  ",
      " KrrrrrKbbbbbK  ",
      " KKKKKKKKKKKKK  ",
      "                ",
      "                ",
      "                "
    ],
    leaf: [
      "                ",
      "         KK     ",
      "        KnNK    ",
      "       KnnNK    ",
      "   KK KnnnNK    ",
      "  KnNKnnnNK     ",
      "  KnnNnnNK  K   ",
      "  KnnnWNK  KnK  ",
      "   KnWWNK KnNK  ",
      "   KnnNK KnnNK  ",
      "    KnNKnnnNK   ",
      "    KNKnnNKK    ",
      "     KNNKK      ",
      "    KmmK        ",
      "    KmK         ",
      "                "
    ],
    orb: [
      "                ",
      "      KKKK      ",
      "    KKggggKK    ",
      "   KgyWyggGgK   ",
      "  KgyWWyggGGgK  ",
      "  KgyWyggggGgK  ",
      "  KggggggggGgK  ",
      "  KggggggGGGgK  ",
      "  KgGggGGGGGgK  ",
      "   KgGGGGGGgK   ",
      "    KKgGGgKK    ",
      "      KKKK      ",
      "                ",
      "                ",
      "                ",
      "                "
    ],
    // enemy slimes (color filled at draw via variant)
    slime: [
      "                ",
      "                ",
      "                ",
      "     KKKKKK     ",
      "    KccccccK    ",
      "   KcWKccWKcK   ",
      "   KcWKccWKcK   ",
      "  KccccccccccK  ",
      "  KcKccccccKcK  ",
      "  KccKKKKKKccK  ",
      "  KcccccccccCK  ",
      " KcccccccccccK  ",
      " KcCcCcCcCcCcK  ",
      " KKKKKKKKKKKKK  ",
      "                ",
      "                "
    ]
  };

  function drawPixels(cv, sprite, opt) {
    opt = opt || {};
    var ctx = cv.getContext("2d");
    var n = sprite.length, m = 0, i, j;
    for (i = 0; i < n; i++) m = Math.max(m, sprite[i].length);
    var px = Math.floor(Math.min(cv.width / m, cv.height / n));
    var offx = Math.floor((cv.width - px * m) / 2), offy = Math.floor((cv.height - px * n) / 2);
    ctx.clearRect(0, 0, cv.width, cv.height);
    var pal = opt.pal || PAL;
    for (i = 0; i < n; i++) {
      for (j = 0; j < sprite[i].length; j++) {
        var ch = sprite[i][j];
        if (ch === " ") continue;
        var col = pal[ch];
        if (opt.recolor && opt.recolor[ch]) col = opt.recolor[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(offx + j * px, offy + i * px, px, px);
      }
    }
  }

  // ---------------- audio ----------------
  var AC = null, soundOn = true;
  function actx() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return AC; }
  function beep(freq, dur, type, vol, when) {
    if (!soundOn) return;
    var c = actx(); if (!c) return;
    var t = c.currentTime + (when || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "square"; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  var SFX = {
    click: function () { beep(420, 0.06, "square", 0.08); },
    land:  function () { beep(620, 0.07, "triangle", 0.1); beep(880, 0.08, "triangle", 0.08, 0.05); },
    hit:   function () { beep(180, 0.12, "sawtooth", 0.14); beep(90, 0.16, "square", 0.1, 0.02); },
    kill:  function () { [523, 659, 784, 1046].forEach(function (f, i) { beep(f, 0.1, "square", 0.1, i * 0.06); }); },
    bad:   function () { beep(140, 0.18, "sawtooth", 0.13); beep(110, 0.22, "square", 0.1, 0.06); },
    ding:  function () { beep(880, 0.12, "sine", 0.12); beep(1320, 0.2, "sine", 0.1, 0.08); },
    win:   function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { beep(f, 0.16, "square", 0.11, i * 0.12); }); },
    lose:  function () { [330, 294, 262, 196].forEach(function (f, i) { beep(f, 0.22, "sawtooth", 0.12, i * 0.16); }); }
  };

  // ---------------- persistence ----------------
  var KEY = { tasks: "prodex_tasks", wins: "prodex_wins", set: "prodex_settings", snd: "prodex_sound" };
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // ---------------- game state ----------------
  var st, wins, pendingT = 2;
  function saveTasks() { lsSet(KEY.tasks, st.tasks.map(function (t) { return { text: t.text, toughness: t.toughness }; })); }

  function freshGame(tasks) {
    st = G.newGame({ tasks: tasks || [] });
    G.startDay(st);
    st.resolveOpen = false;
  }

  function boot() {
    wins = lsGet(KEY.wins, 0);
    soundOn = lsGet(KEY.snd, true);
    var s = lsGet(KEY.set, { work: 25, brk: 5 });
    $("#workMin").value = s.work; $("#breakMin").value = s.brk;
    $("#sndBtn").textContent = soundOn ? "ON" : "OFF";
    freshGame(lsGet(KEY.tasks, []));
  }

  // ---------------- render ----------------
  var ICON = {
    deep_work: "book", quick_win: "coin", caffeine: "mug",
    pomodoro: "tomato", flow: "wave", time_block: "clock",
    delegate: "arrow", eisenhower: "grid", recovery: "leaf"
  };
  var HAND_ORDER = ["pomodoro", "flow", "time_block", "delegate", "eisenhower", "recovery"];

  function cls(ident) { return ident; }

  function render() {
    // HUD
    $("#focusN").textContent = st.focus;
    $("#blockN").textContent = st.block;
    $("#winsN").textContent = wins;
    // hearts
    var hb = $("#hearts"); hb.innerHTML = "";
    for (var i = 0; i < st.maxComposure; i++) {
      var h = document.createElement("div");
      h.className = "heart" + (i < st.composure ? "" : " off"); hb.appendChild(h);
    }
    // window tag
    var wt = $("#windowTag");
    if (st.resolveOpen) { wt.innerHTML = '<span class="window on">AVANZAMENTO SBLOCCATO</span>'; }
    else { wt.innerHTML = '<span class="window off">FAI UN POMODORO</span>'; }

    renderEnemies();
    renderDists();
    renderLands();
    renderHand();
    renderLog();
    var tg = G.findTask(st, st.target);
    $("#pTarget").textContent = "Prova scelta: " + (tg ? tg.text : "nessuna");
  }

  function renderEnemies() {
    var box = $("#enemies"); box.innerHTML = "";
    if (!st.tasks.length) {
      box.innerHTML = '<div class="empty-note">Nessuna Prova sul cammino. Aggiungi le attivita\' della giornata per tracciare il viaggio.</div>';
      return;
    }
    st.tasks.forEach(function (t) {
      var el = document.createElement("div");
      el.className = "enemy pixel-border" + (st.target === t.id ? " sel" : "") + (st.recommended === t.id ? " rec" : "");
      var variant = t.toughness >= 3 ? { c: "#e0566a", C: "#8a2230" } : t.toughness === 2 ? { c: "#f4c95d", C: "#a9781e" } : { c: "#5bc77f", C: "#1f5a36" };
      var cv = document.createElement("canvas"); cv.width = 48; cv.height = 48;
      el.appendChild(cv);
      drawPixels(cv, SPR.slime, { recolor: variant });
      var nm = document.createElement("div"); nm.className = "nm"; nm.textContent = t.text; el.appendChild(nm);
      var hp = document.createElement("div"); hp.className = "hp";
      for (var k = 0; k < t.maxToughness; k++) {
        var p = document.createElement("div");
        p.className = "pip" + (k < t.toughness ? "" : " gone");
        if (k < t.toughness) p.style.background = variant.c;
        hp.appendChild(p);
      }
      el.appendChild(hp);
      if (t.enchanted) { var lk = document.createElement("div"); lk.className = "mini"; lk.style.color = "#9b6ff0"; lk.textContent = "🔒 protetto"; el.appendChild(lk); }
      el.onclick = function () { st.target = t.id; SFX.click(); render(); };
      box.appendChild(el);
    });
  }

  function renderDists() {
    var box = $("#dists"); box.innerHTML = "";
    if (!st.distractions.length) { box.innerHTML = '<span class="mini">Nessuna distrazione. Per ora.</span>'; return; }
    st.distractions.forEach(function (d) {
      var el = document.createElement("div"); el.className = "dist";
      var fx = d.effect === "composure" ? "-2 Vigore" : d.effect === "scope" ? "+1 difficolta'" : "ruba una land";
      el.innerHTML = '<b>!</b> ' + d.text + ' <span class="mini">esplode tra ' + d.timer + ' · ' + fx + '</span>';
      var b = document.createElement("button"); b.className = "btn-red"; b.textContent = "GESTISCI (1F)";
      b.onclick = function () { var r = G.dismissDistraction(st, d.id); if (!r.ok) toast(r.reason); else { SFX.click(); } render(); };
      el.appendChild(b); box.appendChild(el);
    });
  }

  function renderLands() {
    var box = $("#lands"); box.innerHTML = "";
    st.lands.forEach(function (l) {
      var def = G.CARDS[l.card];
      var el = document.createElement("div");
      el.className = "land pixel-border" + (l.tapped ? " tapped" : "");
      var cv = document.createElement("canvas"); cv.width = 40; cv.height = 40; el.appendChild(cv);
      drawPixels(cv, SPR[ICON[l.card]]);
      var nm = document.createElement("div"); nm.className = "ln"; nm.textContent = def.name; el.appendChild(nm);
      var lp = document.createElement("div"); lp.className = "lp"; lp.textContent = (l.tapped ? "TAPPATA" : "+" + def.produce + " F"); el.appendChild(lp);
      el.onclick = function () {
        if (l.tapped) return;
        var r = G.tapLand(st, l.id);
        if (!r.ok) { toast(r.reason); SFX.bad(); } else { SFX.land(); }
        render();
      };
      box.appendChild(el);
    });
  }

  function renderHand() {
    var box = $("#hand"); box.innerHTML = "";
    HAND_ORDER.forEach(function (id) {
      var c = G.CARDS[id];
      var needWindow = (c.kind === "damage");
      var afford = st.focus >= c.cost;
      var disabled = !afford || (needWindow && !st.resolveOpen);
      var el = document.createElement("div");
      el.className = "card pixel-border " + cls(c.ident) + (disabled ? " dis" : "");
      el.innerHTML = '<div class="cost">' + c.cost + '</div>';
      var cv = document.createElement("canvas"); cv.width = 40; cv.height = 40; el.appendChild(cv);
      drawPixels(cv, SPR[ICON[id]]);
      var nm = document.createElement("div"); nm.className = "cn"; nm.textContent = c.name; el.appendChild(nm);
      var tt = document.createElement("div"); tt.className = "ct"; tt.textContent = c.text; el.appendChild(tt);
      el.onclick = function () { if (disabled) { toast(!afford ? "Focus insufficiente" : "Completa prima un Pomodoro"); SFX.bad(); return; } playCard(id); };
      box.appendChild(el);
    });
  }

  function renderLog() {
    var box = $("#log"); box.innerHTML = "";
    var items = st.log.slice(-40);
    items.forEach(function (m) {
      var p = document.createElement("p");
      if (/Vigore|scope creep|DISTRAZIONE|ruba|rallenta|fermi|zero/.test(m)) p.className = "warn";
      if (/SUPERATA|conquistata|Blocco|\+\d+ Focus|COMPLETATO/.test(m)) p.className = "sys";
      p.textContent = "› " + m; box.appendChild(p);
    });
    box.scrollTop = box.scrollHeight;
  }

  function playCard(id) {
    var c = G.CARDS[id];
    var needTarget = (c.kind === "damage" || c.kind === "protect" || c.kind === "remove");
    if (needTarget && !G.findTask(st, st.target)) { toast("Scegli una Prova"); SFX.bad(); return; }
    var before = st.tasks.length;
    var r = G.playCard(st, id, st.target);
    if (!r.ok) { toast(r.reason); SFX.bad(); return; }
    if (c.kind === "damage") { (st.tasks.length < before) ? SFX.kill() : SFX.hit(); }
    else SFX.click();
    saveTasks();
    checkEnd();
    render();
  }

  // ---------------- pomodoro ----------------
  var timer = { running: false, mode: "work", endAt: 0, remain: 25 * 60, raf: null };
  function fmt(s) { s = Math.max(0, Math.round(s)); var m = Math.floor(s / 60); var ss = s % 60; return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss; }
  function setClock() { $("#clock").textContent = fmt(timer.remain); }
  function pmodeUI() {
    var e = $("#pmode"); e.textContent = timer.mode === "work" ? "LAVORO" : "PAUSA";
    e.className = "mode head" + (timer.mode === "break" ? " break" : "");
  }
  function workSecs() { return Math.max(1, parseInt($("#workMin").value, 10) || 25) * 60; }
  function breakSecs() { return Math.max(1, parseInt($("#breakMin").value, 10) || 5) * 60; }

  function tick() {
    if (!timer.running) return;
    timer.remain = (timer.endAt - Date.now()) / 1000;
    if (timer.remain <= 0) { timer.remain = 0; setClock(); completePomo(); return; }
    setClock();
    timer.raf = requestAnimationFrame(tick);
  }
  function startPomo() {
    if (timer.running) return;
    if (timer.mode === "work") {
      if (!G.findTask(st, st.target)) { toast("Scegli prima una Prova da affrontare"); SFX.bad(); return; }
      st.resolveOpen = false; // must earn the window again
      render();
    }
    timer.running = true;
    timer.endAt = Date.now() + timer.remain * 1000;
    $("#pStart").disabled = true; $("#pPause").disabled = false;
    SFX.click(); tick();
  }
  function pausePomo() {
    if (!timer.running) return;
    timer.running = false; cancelAnimationFrame(timer.raf);
    timer.remain = (timer.endAt - Date.now()) / 1000;
    $("#pStart").disabled = false; $("#pPause").disabled = true; setClock();
  }
  function resetPomo(toMode) {
    timer.running = false; cancelAnimationFrame(timer.raf);
    timer.mode = toMode || "work";
    timer.remain = timer.mode === "work" ? workSecs() : breakSecs();
    $("#pStart").disabled = false; $("#pPause").disabled = true;
    pmodeUI(); setClock();
  }
  function completePomo() {
    timer.running = false; cancelAnimationFrame(timer.raf);
    SFX.ding();
    if (timer.mode === "work") {
      G.completeBlock(st, st.target);
      saveTasks();
      flashTitle("✔ BLOCCO FATTO");
      checkEnd();
      resetPomo("break");
      toast("Pomodoro completato! Tappa le Focus e gioca le carte.");
    } else {
      // break over: a little recovery · untap non-daily lands already handled on next block
      flashTitle("PRONTO");
      resetPomo("work");
      toast("Pausa finita. Nuovo blocco?");
    }
    render();
  }

  // ---------------- misc ui ----------------
  var toastT = null;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.style.display = "block";
    clearTimeout(toastT); toastT = setTimeout(function () { t.style.display = "none"; }, 1700);
  }
  var titleBase = document.title;
  function flashTitle(s) { document.title = s + " · PROD-EX"; setTimeout(function () { document.title = titleBase; }, 4000); }

  function checkEnd() {
    if (st.status === "won") {
      wins += 1; lsSet(KEY.wins, wins); lsSet(KEY.tasks, []);
      SFX.win(); showEnd(true);
    } else if (st.status === "lost") {
      SFX.lose(); showEnd(false);
    }
  }
  function showEnd(won) {
    var e = $("#end");
    e.className = won ? "win" : "lose"; e.style.display = "flex";
    $("#endTitle").textContent = won ? "GIORNATA CONQUISTATA!" : "TI SEI FERMATO";
    $("#endMsg").innerHTML = won
      ? "Cammino completato. Vittoria n. " + wins + ". Il lavoro vero e' fatto: la carta era solo il segnavia."
      : "Il Vigore e' a zero: troppe Distrazioni ignorate. Domani: meno Prove aperte, piu' Time Block.";
  }

  // ---------------- events ----------------
  function wire() {
    $("#startBtn").onclick = function () {
      $("#title").style.display = "none"; $("#game").classList.remove("hidden");
      actx(); SFX.ding(); render();
    };
    $$(".tBtn").forEach(function (b) {
      b.onclick = function () {
        pendingT = parseInt(b.getAttribute("data-t"), 10);
        var txt = $("#taskText").value.trim();
        if (!txt) { toast("Scrivi prima la Prova"); SFX.bad(); $("#taskText").focus(); return; }
        G.addTask(st, txt, pendingT); saveTasks();
        $("#taskText").value = ""; SFX.land(); render();
      };
    });
    $("#taskText").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var txt = $("#taskText").value.trim(); if (!txt) return;
        G.addTask(st, txt, pendingT); saveTasks(); $("#taskText").value = ""; SFX.land(); render();
      }
    });
    $("#pStart").onclick = startPomo;
    $("#pPause").onclick = pausePomo;
    $("#pReset").onclick = function () { resetPomo(timer.mode); SFX.click(); };
    $("#workMin").onchange = function () { lsSet(KEY.set, { work: +$("#workMin").value, brk: +$("#breakMin").value }); if (timer.mode === "work" && !timer.running) resetPomo("work"); };
    $("#breakMin").onchange = function () { lsSet(KEY.set, { work: +$("#workMin").value, brk: +$("#breakMin").value }); if (timer.mode === "break" && !timer.running) resetPomo("break"); };
    $("#resetBtn").onclick = function () {
      if (!confirm("Nuova giornata? Vigore, Focus e blocchi si azzerano. Le Prove aperte restano.")) return;
      var keep = st.tasks.map(function (t) { return { text: t.text, toughness: t.maxToughness }; });
      freshGame(keep); resetPomo("work"); SFX.click(); render();
    };
    $("#sndBtn").onclick = function () { soundOn = !soundOn; lsSet(KEY.snd, soundOn); $("#sndBtn").textContent = soundOn ? "ON" : "OFF"; if (soundOn) SFX.ding(); };
    $("#endBtn").onclick = function () {
      $("#end").style.display = "none";
      var keep = (st.status === "lost") ? st.tasks.map(function (t) { return { text: t.text, toughness: t.maxToughness }; }) : [];
      freshGame(keep); resetPomo("work"); render();
    };
  }

  // ---------------- init ----------------
  function init() {
    boot(); wire();
    // title art
    var ta = $("#titleArt");
    if (ta) drawPixels(ta, SPR.slime, { recolor: { c: "#9b6ff0", C: "#5b3aa0" } });
    drawPixels($("#focusOrb"), SPR.orb);
    resetPomo("work");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
