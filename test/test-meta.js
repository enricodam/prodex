/* Tests for progression.js + history.js. Run: node test/test-meta.js */
var P = require("../progression.js");
var H = require("../history.js");
var pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error("FAIL: " + m); } }
function eq(a, b, m) { ok(a === b, m + " (got " + a + ", want " + b + ")"); }

// ---- progression: levels ----
eq(P.xpForLevel(1), 0, "level1 at 0");
eq(P.xpForLevel(2), 100, "level2 at 100");
eq(P.xpForLevel(3), 300, "level3 at 300");
eq(P.levelFromXp(0), 1, "0xp -> lvl1");
eq(P.levelFromXp(99), 1, "99xp -> lvl1");
eq(P.levelFromXp(100), 2, "100xp -> lvl2");
eq(P.levelFromXp(299), 2, "299xp -> lvl2");
eq(P.levelFromXp(300), 3, "300xp -> lvl3");
eq(P.titleForLevel(1), "Apprendista", "title lvl1");
eq(P.titleForLevel(9), "Maestro del Tempo", "title lvl9");

// ---- progression: dayXp ----
var sumWin = { result: "vinta", pomodoros: 4, distractionsExploded: 0, timeBlocksUsed: 0,
  trials: [{ outcome: "superata", difficulty: 3 }, { outcome: "superata", difficulty: 1 }] };
// 4*10 + (5*3 + 5*1) + 25 + 5*min(streak,10)
eq(P.dayXp(sumWin, 0), 40 + 20 + 25 + 0, "dayXp win streak0");
eq(P.dayXp(sumWin, 3), 40 + 20 + 25 + 15, "dayXp win streak3");
var sumLose = { result: "persa", pomodoros: 2, trials: [{ outcome: "superata", difficulty: 1 }] };
eq(P.dayXp(sumLose, 5), 20 + 5, "dayXp lose no win bonus");

// ---- progression: medals ----
var ctx = { totals: { winsTotal: 1, recordStreak: 1, pomodorosTotal: 4, diff3ClearedTotal: 0, currentStreak: 1 },
            day: { result: "vinta", distractionsExploded: 0, pomodoros: 4, timeBlocksUsed: 0 } };
var m1 = P.evaluateMedals(ctx, []);
ok(m1.indexOf("prima_luce") >= 0, "prima_luce unlocked on first win");
ok(m1.indexOf("zen") >= 0, "zen unlocked (0 explosions)");
ok(m1.indexOf("serie3") < 0, "serie3 not yet");
var m2 = P.evaluateMedals(ctx, ["prima_luce", "zen"]);
ok(m2.indexOf("prima_luce") < 0, "already-owned not re-returned");

// ---- progression: applyDay ----
var prog0 = { xp: 0, medals: [] };
var totals1 = { winsTotal: 1, recordStreak: 1, currentStreak: 1, pomodorosTotal: 4, diff3ClearedTotal: 0 };
var r = P.applyDay(prog0, sumWin, totals1);
eq(r.xpGained, 40 + 20 + 25 + 5, "applyDay xpGained with streak1");
eq(r.progress.xp, r.xpGained, "progress xp accumulates");
ok(r.newMedals.indexOf("prima_luce") >= 0, "applyDay unlocks prima_luce");

// ---- history: storage shim ----
function memStore() { var m = {}; return { getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = v; } }; }
var store = memStore();
var hist = H.load(store);
eq(hist.days.length, 0, "empty history load");

function fakeSummary(win, pomos, diff3) {
  var trials = [];
  for (var i = 0; i < diff3; i++) trials.push({ outcome: "superata", difficulty: 3 });
  return { result: win ? "vinta" : "persa", trialsTotal: trials.length, trialsDone: trials.length,
    trialsDelegated: 0, pomodoros: pomos, focusMinutes: pomos * 25, focusGenerated: pomos * 3,
    focusSpent: pomos, distractionsHandled: 1, distractionsExploded: win ? 0 : 1,
    timeBlocksUsed: 0, diff3Cleared: diff3, trials: trials, trialsLeft: [] };
}

// record 3 winning days
var meta = function (d) { return { date: "2026-06-1" + d, weekday: "gio", notes: "n" + d }; };
var res1 = H.recordDay(hist, fakeSummary(true, 4, 1), meta(5), P);
var res2 = H.recordDay(hist, fakeSummary(true, 5, 2), meta(6), P);
var res3 = H.recordDay(hist, fakeSummary(false, 2, 0), meta(7), P);
eq(hist.days.length, 3, "3 days recorded");
var agg = H.aggregate(hist.days);
eq(agg.winsTotal, 2, "2 wins total");
eq(agg.recordStreak, 2, "record streak 2");
eq(agg.currentStreak, 0, "current streak 0 (last lost)");
eq(agg.pomodorosTotal, 11, "pomodoros total 11");
eq(agg.diff3ClearedTotal, 3, "diff3 cleared total 3");
ok(hist.progress.xp > 0, "progress xp accumulated");
eq(hist.days[0].levelEnd != null, true, "record has levelEnd");

// CSV
var csv = H.toCSV(hist.days);
ok(/^date,weekday/.test(csv), "csv header");
eq(csv.split("\n").length, 4, "csv has header + 3 rows");
ok(/2026-06-15/.test(csv), "csv contains a date");

// JSON round-trip + import
var json = H.toJSON(hist);
var imported = H.parseImport(json);
eq(imported.days.length, 3, "import restores days");
eq(imported.progress.xp, hist.progress.xp, "import restores xp");
var threw = false; try { H.parseImport('{"foo":1}'); } catch (e) { threw = true; }
ok(threw, "invalid import throws");

console.log("\nmeta tests: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
