/* DOM smoke test (v2): three-phase flow via jsdom. Asserts wiring + no throws. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = ["game-core.js", "progression.js", "history.js", "game-ui.js"]
  .map(f => fs.readFileSync(path.join(root, f), "utf8"));

const body = html.match(/<body>([\s\S]*?)<\/body>/i)[1]
  .replace(/<script src="[^"]*"><\/script>/g, "");

const STUBS = `
  HTMLCanvasElement.prototype.getContext = function(){ return { clearRect(){}, fillRect(){}, set fillStyle(v){}, get fillStyle(){return '#000'} }; };
  window.AudioContext = function(){ return { currentTime:0,
    createOscillator(){ return { frequency:{setValueAtTime(){}}, connect(){}, start(){}, stop(){} }; },
    createGain(){ return { gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}, connect(){} }; }, destination:{} }; };
  window.confirm = function(){ return true; };
  window.URL.createObjectURL = function(){ return 'blob:x'; };
  window.URL.revokeObjectURL = function(){};
`;

const full = "<!DOCTYPE html><html><head></head><body>" + body +
  "<script>" + STUBS + "<\/script>" +
  files.map(c => "<script>" + c + "<\/script>").join("") +
  "</body></html>";

const dom = new JSDOM(full, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.com/" });
const { window } = dom, document = window.document;

let pass = 0, fail = 0, jsErrors = [];
window.addEventListener("error", e => jsErrors.push(e.error ? e.error.message : e.message));
function ok(c, m) { if (c) pass++; else { fail++; console.error("FAIL: " + m); } }

function waitLoad() { return new Promise(res => { if (document.readyState === "complete") return res(); window.addEventListener("load", () => setTimeout(res, 0)); }); }

(async function () {
  await waitLoad();
  ok(!!window.PRODEX && !!window.PRODEX_PROG && !!window.PRODEX_HIST, "all modules attached");

  document.getElementById("startBtn").click();
  ok(document.getElementById("phasePlan").classList.contains("on"), "plan phase shown after start");

  // add two trials
  document.getElementById("taskText").value = "Revisione bozza";
  document.querySelector('.tBtn[data-t="1"]').click();
  document.getElementById("taskText").value = "Slide seminario";
  document.querySelector('.tBtn[data-t="2"]').click();
  ok(document.querySelectorAll("#planList .trow").length === 2, "two trials planned");
  ok(!document.getElementById("startDayBtn").disabled, "start-day enabled with trials");

  // start the day -> focus phase
  document.getElementById("startDayBtn").click();
  ok(document.getElementById("phaseFocus").classList.contains("on"), "focus phase shown");
  ok(document.querySelectorAll("#lands .land").length === 3, "3 focus lands");
  ok(document.querySelectorAll("#hand .card").length === 6, "6 action cards");
  ok(document.querySelectorAll("#enemies .enemy").length === 2, "2 trials on board");

  // add a Trial mid-day (during focus phase)
  document.getElementById("focusTaskText").value = "Email urgente arrivata";
  document.querySelector('.ftBtn[data-t="1"]').click();
  ok(document.querySelectorAll("#enemies .enemy").length === 3, "trial added mid-day during focus");

  // tap a land -> focus changes
  const f0 = document.getElementById("focusN").textContent;
  document.querySelectorAll("#lands .land")[0].click();
  ok(document.getElementById("focusN").textContent !== f0, "tapping land changes focus");

  // damage card before pomodoro: blocked, no throw
  document.querySelectorAll("#hand .card")[0].click();
  ok(true, "damage card pre-pomodoro did not throw");

  // close the day -> review
  document.getElementById("endDayBtn").click();
  ok(document.getElementById("phaseReview").classList.contains("on"), "review phase shown");
  ok(document.getElementById("revBanner").textContent.length > 0, "review banner rendered");

  // save -> history gets a day, progression persisted
  document.getElementById("saveDayBtn").click();
  const stored = JSON.parse(window.localStorage.getItem("prodex_history_v2"));
  ok(stored && stored.days.length === 1, "one day saved to history");
  ok(stored.progress.xp >= 0, "progress persisted");
  ok(!document.getElementById("newDayBtn").classList.contains("hidden"), "new-day button shown after save");

  // open history phase
  document.getElementById("histBtn").click();
  ok(document.getElementById("phaseHistory").classList.contains("on"), "history phase shown");
  ok(document.querySelectorAll("#daylist .dayrow").length === 1, "history lists the saved day");
  ok(document.querySelectorAll("#heat .cell").length === 28, "heatmap has 28 cells");

  // export buttons should not throw
  document.getElementById("expCsv").click();
  document.getElementById("expJson").click();
  ok(true, "export buttons did not throw");

  // new day resets to plan
  document.getElementById("backBtn").click();
  document.getElementById("newDayBtn") && document.getElementById("newDayBtn").click && document.getElementById("newDayBtn").click();

  if (jsErrors.length) { fail += jsErrors.length; jsErrors.forEach(e => console.error("JS ERROR: " + e)); }
  console.log("\nDOM smoke v2: " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
