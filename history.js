/* PROD-EX history: day records, aggregates, CSV/JSON export, import. Pure + storage shim. */
(function (root) {
  "use strict";
  var KEY = "prodex_history_v2";

  function empty() { return { version: 2, days: [], progress: { xp: 0, level: 1, medals: [] } }; }

  function load(storage) {
    try {
      var raw = storage.getItem(KEY);
      if (!raw) return empty();
      var h = JSON.parse(raw);
      if (!h || !Array.isArray(h.days)) return empty();
      if (!h.progress) h.progress = { xp: 0, level: 1, medals: [] };
      if (!Array.isArray(h.progress.medals)) h.progress.medals = [];
      return h;
    } catch (e) { return empty(); }
  }
  function save(storage, hist) { storage.setItem(KEY, JSON.stringify(hist)); return hist; }

  function streaks(days) {
    var cur = 0, rec = 0, run = 0;
    days.forEach(function (d) {
      if (d.result === "vinta") { run++; if (run > rec) rec = run; }
      else run = 0;
    });
    // current streak = trailing run of wins
    for (var i = days.length - 1; i >= 0; i--) {
      if (days[i].result === "vinta") cur++; else break;
    }
    return { currentStreak: cur, recordStreak: rec };
  }

  function aggregate(days) {
    var t = { daysPlayed: days.length, winsTotal: 0, pomodorosTotal: 0,
              focusMinutesTotal: 0, trialsDoneTotal: 0, diff3ClearedTotal: 0 };
    days.forEach(function (d) {
      if (d.result === "vinta") t.winsTotal++;
      t.pomodorosTotal += d.pomodoros || 0;
      t.focusMinutesTotal += d.focusMinutes || 0;
      t.trialsDoneTotal += d.trialsDone || 0;
      t.diff3ClearedTotal += d.diff3Cleared || 0;
    });
    var s = streaks(days);
    t.currentStreak = s.currentStreak; t.recordStreak = s.recordStreak;
    return t;
  }

  function buildRecord(meta, summary) {
    return {
      date: meta.date, weekday: meta.weekday || "",
      result: summary.result,
      trialsTotal: summary.trialsTotal, trialsDone: summary.trialsDone,
      trialsDelegated: summary.trialsDelegated || 0,
      pomodoros: summary.pomodoros, focusMinutes: Math.round(summary.focusMinutes || 0),
      focusGenerated: summary.focusGenerated, focusSpent: summary.focusSpent,
      distractionsHandled: summary.distractionsHandled,
      distractionsExploded: summary.distractionsExploded,
      timeBlocksUsed: summary.timeBlocksUsed || 0,
      diff3Cleared: summary.diff3Cleared || 0,
      notes: (meta.notes || "").toString().slice(0, 500),
      trials: (summary.trials || []).concat(summary.trialsLeft || []),
      levelEnd: null, xpEnd: null, xpGained: 0
    };
  }

  // Record a day: append, aggregate (incl. today), apply progression. Mutates+returns hist.
  function recordDay(hist, summary, meta, PROG) {
    var rec = buildRecord(meta, summary);
    hist.days.push(rec);
    var totals = aggregate(hist.days);
    var res = PROG.applyDay(hist.progress, summary, totals);
    rec.levelEnd = res.progress.level; rec.xpEnd = res.progress.xp; rec.xpGained = res.xpGained;
    hist.progress = res.progress;
    return { hist: hist, record: rec, totals: totals, delta: res };
  }

  function csvCell(v) {
    var s = (v == null ? "" : String(v));
    if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  var CSV_COLS = ["date", "weekday", "trialsTotal", "trialsDone", "trialsDelegated",
    "pomodoros", "focusMinutes", "distractionsHandled", "distractionsExploded",
    "result", "levelEnd", "xpEnd", "notes"];
  function toCSV(days) {
    var head = CSV_COLS.join(",");
    var rows = days.map(function (d) {
      return CSV_COLS.map(function (k) { return csvCell(d[k]); }).join(",");
    });
    return [head].concat(rows).join("\n");
  }

  function toJSON(hist) { return JSON.stringify(hist, null, 2); }

  function parseImport(text) {
    var h = JSON.parse(text);
    if (!h || !Array.isArray(h.days)) throw new Error("File non valido: manca 'days'.");
    if (!h.progress || typeof h.progress.xp !== "number") h.progress = { xp: 0, level: 1, medals: [] };
    if (!Array.isArray(h.progress.medals)) h.progress.medals = [];
    h.version = 2;
    return h;
  }

  var API = {
    KEY: KEY, empty: empty, load: load, save: save, aggregate: aggregate, streaks: streaks,
    buildRecord: buildRecord, recordDay: recordDay, toCSV: toCSV, toJSON: toJSON,
    parseImport: parseImport, CSV_COLS: CSV_COLS
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.PRODEX_HIST = API;
})(typeof window !== "undefined" ? window : globalThis);
