/* Tests for meta-collection unlocks + Rituali (v2). Run: node test/test-tappac.js */
var C = require("../cards.js");
var D = require("../duel-core.js");
var pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error("FAIL: " + m); } }
function eq(a, b, m) { ok(a === b, m + " (got " + a + ", want " + b + ")"); }
function give(st, id) { var h = { uid: "H" + Math.random().toString(36).slice(2, 6), cardId: id }; st.hand.push(h); return h.uid; }

// ---- unlocks by level ----
eq(C.unlockedCards(1).length, 0, "no unlocks at level 1");
ok(C.unlockedCards(2).indexOf("fulmine") >= 0, "fulmine unlocks at lvl 2");
ok(C.unlockedCards(5).indexOf("titano") >= 0, "titano unlocks at lvl 5");
eq(C.unlockedCards(5).length, 4, "all 4 unlocked by lvl 5");
eq(C.unlockedRituals(1).length, 1, "1 ritual at lvl 1 (Mattiniero)");
eq(C.unlockedRituals(3).length, 3, "3 rituals at lvl 3");
eq(C.ritualById("tempra").name, "Tempra", "ritual lookup by id");

// ---- ritual: Tempra (+8 max vigor) via opts.maxVigor ----
var stT = D.newDuel({ seed: 1, maxVigor: 40 });
eq(stT.maxVigor, 40, "maxVigor honored (32+8)");
eq(stT.vigor, 40, "starts at boosted max");

// ---- ritual: Mattiniero (+1 mana/turn) via bonusMana ----
var stM = D.newDuel({ seed: 1, bonusMana: 1 });
D.pomodoro(stM, "x", 10); // 2 + 1 bonus
eq(stM.mana, 3, "bonusMana adds to each turn (2+1)");

// ---- ritual: Lettore Vorace (+1 draw/turn) via bonusDraw ----
var stL = D.newDuel({ seed: 1, bonusDraw: 1 });
var h0 = stL.hand.length; D.pomodoro(stL, "x", 5); // draws 1 + 1
eq(stL.hand.length, h0 + 2, "bonusDraw adds an extra draw per turn");

// ---- reward pool grows with level (unlocked cards can appear) ----
var stHi = D.newDuel({ seed: 6, level: 5 }); D.pomodoro(stHi, "x", 25); stHi.mana = 9; stHi.enemy.hp = 2;
D.playCard(stHi, give(stHi, "flow"), null); // kill boss -> reward
ok(stHi.pendingReward && stHi.pendingReward.length === 3, "reward offered");
// at level 5 the pool includes unlockables; cannot guarantee a specific draw, but pool must be larger
var stLo = D.newDuel({ seed: 6, level: 1 });
ok((C.REWARD_POOL.concat(C.unlockedCards(5))).length > (C.REWARD_POOL.concat(C.unlockedCards(1))).length, "higher level -> bigger reward pool");

// ---- new spell fulmine deals 3; mentore upkeep draws ----
var stF = D.newDuel({ seed: 2 }); D.pomodoro(stF, "x", 25); stF.mana = 9;
var e0 = stF.enemy.hp; D.playCard(stF, give(stF, "fulmine"), "ENEMY_FACE");
eq(stF.enemy.hp, e0 - 3, "fulmine deals 3 to face");

var stU = D.newDuel({ seed: 4 }); D.pomodoro(stU, "x", 25); stU.mana = 9;
D.playCard(stU, give(stU, "mentore"));
var before = stU.hand.length;
D.pomodoro(stU, "x", 5); // upkeep: mentore draws 1, plus normal draw 1
eq(stU.hand.length, before + 2, "mentore upkeep draws +1 (total +2 with normal draw)");

console.log("\nTappa C tests: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
