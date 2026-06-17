/* Node tests for PROD-EX core engine. Run: node test/test-core.js */
var G = require("../game-core.js");
var pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("FAIL: " + msg); } }
function eq(a, b, msg) { ok(a === b, msg + " (got " + a + ", want " + b + ")"); }

// --- setup ---
var st = G.newGame({ seed: 42, tasks: [
  { text: "Email", toughness: 1 },
  { text: "Slide", toughness: 2 },
  { text: "Paper analysis", toughness: 3 }
]});
G.startDay(st);
eq(st.tasks.length, 3, "3 enemies on board");
eq(st.status, "playing", "status playing");

// --- focus economy ---
eq(st.focus, 0, "focus starts 0");
var r = G.tapLand(st, "deep_work"); ok(r.ok, "tap deep work ok");
eq(st.focus, 3, "deep work gives 3");
r = G.tapLand(st, "deep_work"); ok(!r.ok, "cannot tap twice");
G.tapLand(st, "caffeine"); eq(st.focus, 5, "caffeine +2 -> 5");
var r2 = G.tapLand(st, "caffeine"); ok(!r2.ok, "caffeine once/day blocked while tapped");

// --- damage requires resolve window (real pomodoro) ---
var dmg = G.playCard(st, "pomodoro", st.tasks[0].id);
ok(!dmg.ok, "cannot deal damage before a pomodoro");

// complete a block -> opens window, untaps lands (not caffeine)
G.completeBlock(st, st.tasks[0].id);
ok(st.resolveOpen, "resolve window open after block");
eq(st.lands.find(l => l.id === "deep_work").tapped, false, "deep work untapped on new block");
eq(st.lands.find(l => l.id === "caffeine").tapped, true, "caffeine stays tapped (once/day)");

// re-tap deep work for focus, then kill the toughness-1 task
G.tapLand(st, "deep_work"); // +3 (focus was 5 -> still 5 after spend? none spent yet) => 8
var beforeFocus = st.focus;
var k = G.playCard(st, "pomodoro", st.tasks[0].id);
ok(k.ok, "pomodoro strike ok in window");
eq(st.focus, beforeFocus - 1, "strike costs 1 focus");
eq(st.tasks.length, 2, "toughness-1 task removed");

// flow state kills toughness-3 in one hit (cost 3)
var paper = st.tasks.find(t => t.text === "Paper analysis");
var f = G.playCard(st, "flow", paper.id);
ok(f.ok, "flow ok");
ok(!st.tasks.find(t => t.text === "Paper analysis"), "paper killed by flow");

// delegate removes remaining
var slide = st.tasks[0];
// ensure enough focus
st.focus = 5;
var del = G.playCard(st, "delegate", slide.id);
ok(del.ok, "delegate ok");
eq(st.tasks.length, 0, "board cleared");
eq(st.status, "won", "win when table clean");

// --- distraction adversary + lose path ---
var st2 = G.newGame({ seed: 7, maxComposure: 4, spawnEvery: 1, distractTimer: 1,
  tasks: [{ text: "Big task", toughness: 3 }] });
G.startDay(st2);
// force composure-type distractions by spawning until it triggers; run several blocks ignoring them
var safety = 0;
while (st2.status === "playing" && safety < 30) {
  G.completeBlock(st2, st2.tasks[0].id); // we never resolve distractions -> they bite
  safety++;
}
ok(safety < 30, "loop terminated");
eq(st2.status, "lost", "ignoring distractions long enough -> lost");
ok(st2.composure <= 0, "composure depleted");

// --- time block protection clears a distraction on focused block ---
var st3 = G.newGame({ seed: 3, spawnEvery: 1, distractTimer: 5,
  tasks: [{ text: "Protected", toughness: 2 }] });
G.startDay(st3);
st3.focus = 5;
var p = G.playCard(st3, "time_block", st3.tasks[0].id);
ok(p.ok && st3.tasks[0].enchanted, "time block enchants task");
G.completeBlock(st3, st3.tasks[0].id); // spawns 1 (spawnEvery 1) then protection clears 1
eq(st3.distractions.length, 0, "protected block clears the distraction");

// --- recovery cancels a distraction ---
var st4 = G.newGame({ seed: 9, tasks: [{ text: "X", toughness: 1 }] });
G.startDay(st4);
G.spawnDistraction(st4);
st4.focus = 2;
var nd = st4.distractions.length;
G.playCard(st4, "recovery");
eq(st4.distractions.length, nd - 1, "recovery removes a distraction");

// --- eisenhower recommends lowest toughness ---
var st5 = G.newGame({ seed: 1, tasks: [
  { text: "Hard", toughness: 3 }, { text: "Easy", toughness: 1 } ]});
G.startDay(st5);
st5.focus = 2;
var e = G.playCard(st5, "eisenhower");
ok(e.ok, "eisenhower ok");
var rec = G.findTask(st5, st5.recommended);
eq(rec.text, "Easy", "recommends lowest toughness");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
