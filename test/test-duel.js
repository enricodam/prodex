/* Tests for duel-core.js v2 (Appunti mana + boss gauntlet). Run: node test/test-duel.js */
var D = require("../duel-core.js");
var C = require("../cards.js");
var pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error("FAIL: " + m); } }
function eq(a, b, m) { ok(a === b, m + " (got " + a + ", want " + b + ")"); }
function give(st, id) { var h = { uid: "H" + Math.random().toString(36).slice(2, 6), cardId: id }; st.hand.push(h); return h.uid; }

// ---- setup ----
var st = D.newDuel({ seed: 5 });
eq(st.hand.length, 5, "opening hand of 5");
ok(st.hand.every(function (h) { return C.CARDS[h.cardId].kind === "creature"; }), "opening hand is all creatures");
eq(st.vigor, 32, "vigor 32");
eq(st.mana, 0, "no mana before any Pomodoro");
eq(st.enemy.name, "Compito in Classe", "first boss is Compito in Classe");
eq(st.enemy.hp, 18, "first boss hp 18");

// ---- appunto values by duration ----
eq(D.appuntoValue(5), 1, "5min -> 1");
eq(D.appuntoValue(10), 2, "10min -> 2");
eq(D.appuntoValue(15), 4, "15min -> 4");
eq(D.appuntoValue(25), 6, "25min -> 6");

// ---- a Pomodoro creates an Appunto (labeled), refreshes mana, draws ----
D.pomodoro(st, "Revisione paper", 10);
eq(st.appunti.length, 1, "one appunto created");
eq(st.appunti[0].task, "Revisione paper", "appunto carries the task label");
eq(st.mana, 2, "10-min Pomodoro gives 2 mana");
eq(st.turn, 1, "turn 1");
eq(st.hand.length, 6, "drew a card (5 + 1)");

// ---- mana ramps across Pomodoros ----
D.pomodoro(st, "Email", 25);
eq(st.mana, 2 + 6, "appunti ramp: 2 + 6 = 8 mana available");

// ---- play a creature pays mana, summoning sickness ----
st.mana = 5;
var u = give(st, "operaio"); // cost 3
D.playCard(st, u);
eq(st.mana, 2, "operaio cost 3 paid");
ok(st.board[0].sick, "new creature is summoning-sick");
var a0 = D.declareAttack(st, [st.board[0].uid]);
ok(!a0.ok, "sick creature cannot attack");

// ---- slancio attacks at once ----
var st2 = D.newDuel({ seed: 2 }); D.pomodoro(st2, "x", 25); st2.mana = 9;
var f = give(st2, "furia"); D.playCard(st2, f);
var fc = st2.board[st2.board.length - 1];
ok(!fc.sick, "slancio not sick");
var hp = st2.enemy.hp; D.declareAttack(st2, [fc.uid]);
eq(st2.enemy.hp, hp - 4, "furia hits for 4");

// ---- spell damage to face ----
var st3 = D.newDuel({ seed: 3 }); D.pomodoro(st3, "x", 25); st3.mana = 9;
var e0 = st3.enemy.hp; D.playCard(st3, give(st3, "pomodoro"), "ENEMY_FACE");
eq(st3.enemy.hp, e0 - 2, "saetta mentale deals 2");

// ---- gauntlet: defeating a boss advances to the next + reward ----
var st4 = D.newDuel({ seed: 6 }); D.pomodoro(st4, "x", 25); st4.mana = 9; st4.enemy.hp = 3;
D.playCard(st4, give(st4, "flow"), null); // 4 dmg -> boss dies
eq(st4.bossesDefeated, 1, "one boss defeated");
eq(st4.enemy.name, "La Sessione d'Esami", "advanced to next boss");
ok(st4.pendingReward && st4.pendingReward.length === 3, "reward offered after boss");
ok(st4.status === "playing", "run continues after a boss (gauntlet)");
var dn = st4.deck.length; D.takeReward(st4, st4.pendingReward[0]);
eq(st4.deck.length, dn + 1, "reward card added to deck");

// ---- boss scaling beyond the list ----
var b5 = D.bossForIndex(4);
ok(b5.hp > 44, "5th boss scales above the last listed (got " + b5.hp + ")");

// ---- enemy attack hits vigor / lose ----
var st5 = D.newDuel({ seed: 1 }); D.pomodoro(st5, "x", 5); st5.vigor = 3;
D.endTurn(st5);            // intent[0] attack 3
D.assignBlocks(st5, {});  // unblocked
eq(st5.status, "lost", "vigor to 0 -> lost");

// ---- endDay records bosses defeated ----
var st6 = D.newDuel({ seed: 7 }); st6.bossesDefeated = 2; D.endDay(st6);
eq(st6.status, "ended", "endDay -> ended");
eq(D.summary(st6).bossesDefeated, 2, "summary reports bosses defeated");

// ---- caffeina gives mana, custode upkeep gives mana ----
var st7 = D.newDuel({ seed: 8 }); D.pomodoro(st7, "x", 10); st7.mana = 5;
D.playCard(st7, give(st7, "caffeina")); // +2 mana, cost 0
eq(st7.mana, 7, "tonico arcano +2 mana");

console.log("\nduel tests: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
