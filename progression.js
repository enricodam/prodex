/* PROD-EX progression: XP, levels, planeswalker titles, medals. Pure (no DOM). */
(function (root) {
  "use strict";

  var XP = { perPomodoro: 10, perTrialDiff: 5, perWin: 25, streakBonus: 5, streakCap: 10 };

  // XP needed to REACH level n (n>=1): 50*(n-1)*n -> gaps 100,200,300,...
  function xpForLevel(n) { return 50 * (n - 1) * n; }
  function levelFromXp(xp) {
    var n = 1;
    while (xpForLevel(n + 1) <= xp) n++;
    return n;
  }
  var TITLES = [
    [1, "Apprendista"], [3, "Adepto"], [5, "Evocatore"],
    [7, "Arcanista"], [9, "Maestro del Tempo"], [12, "Planeswalker Leggendario"]
  ];
  function titleForLevel(level) {
    var t = TITLES[0][1];
    for (var i = 0; i < TITLES.length; i++) if (level >= TITLES[i][0]) t = TITLES[i][1];
    return t;
  }
  function levelInfo(xp) {
    var level = levelFromXp(xp);
    var base = xpForLevel(level), next = xpForLevel(level + 1);
    var into = xp - base, span = next - base;
    return { level: level, title: titleForLevel(level), xp: xp,
             xpIntoLevel: into, xpForNext: span, xpToNext: span - into,
             pct: Math.round(into / span * 100) };
  }

  // XP earned for a single day, given the day summary and current streak.
  function dayXp(summary, streak) {
    var xp = (summary.pomodoros || 0) * XP.perPomodoro;
    (summary.trials || []).forEach(function (t) {
      if (t.outcome === "superata") xp += XP.perTrialDiff * (t.difficulty || 1);
    });
    if (summary.result === "vinta") {
      xp += XP.perWin + XP.streakBonus * Math.min(streak || 0, XP.streakCap);
    }
    return xp;
  }

  var MEDALS = [
    { id: "prima_luce",   name: "Prima luce",          desc: "Vinci la tua prima giornata.",
      test: function (c) { return c.totals.winsTotal >= 1; } },
    { id: "serie3",       name: "Serie x3",            desc: "Tre giornate vinte di fila.",
      test: function (c) { return c.totals.recordStreak >= 3; } },
    { id: "serie5",       name: "Serie x5",            desc: "Cinque giornate vinte di fila.",
      test: function (c) { return c.totals.recordStreak >= 5; } },
    { id: "serie10",      name: "Serie x10",           desc: "Dieci giornate vinte di fila.",
      test: function (c) { return c.totals.recordStreak >= 10; } },
    { id: "maratoneta",   name: "Maratoneta",          desc: "Otto Pomodori in una sola giornata.",
      test: function (c) { return c.day.pomodoros >= 8; } },
    { id: "domatore",     name: "Domatore di colossi", desc: "Supera 10 Prove di difficolta' 3.",
      test: function (c) { return c.totals.diff3ClearedTotal >= 10; } },
    { id: "zen",          name: "Zen",                 desc: "Vinci con zero Distrazioni esplose.",
      test: function (c) { return c.day.result === "vinta" && c.day.distractionsExploded === 0; } },
    { id: "centurione",   name: "Centurione",          desc: "100 Pomodori completati in totale.",
      test: function (c) { return c.totals.pomodorosTotal >= 100; } },
    { id: "stratega",     name: "Stratega",            desc: "Vinci usando Time Block 3 volte in un giorno.",
      test: function (c) { return c.day.result === "vinta" && c.day.timeBlocksUsed >= 3; } }
  ];
  function medalById(id) { return MEDALS.find(function (m) { return m.id === id; }); }

  // Returns ids newly unlocked (not already in unlocked array/set).
  function evaluateMedals(ctx, unlocked) {
    var have = {};
    (unlocked || []).forEach(function (id) { have[id] = true; });
    var out = [];
    MEDALS.forEach(function (m) {
      if (!have[m.id] && m.test(ctx)) out.push(m.id);
    });
    return out;
  }

  // Apply one day to a progress object {xp, medals:[]}; totals already include this day.
  function applyDay(progress, summary, totals) {
    progress = progress || { xp: 0, medals: [] };
    var xpGained = dayXp(summary, totals.currentStreak);
    var oldLevel = levelFromXp(progress.xp);
    var newXp = progress.xp + xpGained;
    var newLevel = levelFromXp(newXp);
    var newMedals = evaluateMedals({ totals: totals, day: summary }, progress.medals);
    var medals = (progress.medals || []).concat(newMedals);
    return {
      progress: { xp: newXp, level: newLevel, medals: medals },
      xpGained: xpGained, leveledFrom: oldLevel, leveledTo: newLevel,
      newMedals: newMedals
    };
  }

  var API = {
    XP: XP, xpForLevel: xpForLevel, levelFromXp: levelFromXp, levelInfo: levelInfo,
    titleForLevel: titleForLevel, dayXp: dayXp, MEDALS: MEDALS, medalById: medalById,
    evaluateMedals: evaluateMedals, applyDay: applyDay
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.PRODEX_PROG = API;
})(typeof window !== "undefined" ? window : globalThis);
