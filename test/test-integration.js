/* Integration: a full winning day flowing core -> daySummary -> history -> progression. */
var G = require("../game-core.js");
var P = require("../progression.js");
var H = require("../history.js");
var pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error("FAIL: " + m); } }
function eq(a, b, m) { ok(a === b, m + " (got " + a + ", want " + b + ")"); }

var core = G.newGame({ seed: 1, tasks: [{ text: "Email", toughness: 1 }] });
G.startDay(core); core.resolveOpen = false;
core.target = core.tasks[0].id;

// simulate a real Pomodoro block (opens progress window, untaps lands)
G.completeBlock(core, core.target);
ok(core.resolveOpen, "progress window open after block");

// tap a land, then strike the trial to clear it
G.tapLand(core, "deep_work");
var r = G.playCard(core, "pomodoro", core.target);
ok(r.ok, "pomodoro strike played");
eq(core.tasks.length, 0, "trial cleared");
eq(core.status, "won", "day won");

// build the summary and record it
var summary = G.daySummary(core, { focusMinutes: 25 });
eq(summary.result, "vinta", "summary result vinta");
eq(summary.trialsDone, 1, "one trial done");
eq(summary.pomodoros, 1, "one pomodoro");
ok(summary.distractionsExploded === 0, "no distractions exploded");

function mem() { var m = {}; return { getItem: k => k in m ? m[k] : null, setItem: (k, v) => m[k] = v }; }
var store = mem();
var hist = H.load(store);
var res = H.recordDay(hist, summary, { date: "2026-06-17", weekday: "mer", notes: "ok" }, P);
H.save(store, hist);

eq(hist.days.length, 1, "history has one day");
ok(hist.progress.xp > 0, "xp gained on win");
ok(hist.progress.medals.indexOf("prima_luce") >= 0, "prima_luce unlocked");
ok(hist.progress.medals.indexOf("zen") >= 0, "zen unlocked (win, 0 explosions)");
var agg = H.aggregate(hist.days);
eq(agg.winsTotal, 1, "winsTotal 1");
eq(agg.currentStreak, 1, "current streak 1");

// reload from storage round-trips
var hist2 = H.load(store);
eq(hist2.days.length, 1, "reload keeps the day");
eq(hist2.progress.xp, hist.progress.xp, "reload keeps xp");

console.log("\nintegration: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
