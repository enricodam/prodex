/* DOM smoke test for Duel v2 (Appunti + gauntlet) via jsdom. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "duel.html"), "utf8");
const files = ["cards.js", "duel-core.js", "card-render.js", "progression.js", "history.js", "duel-ui.js"]
  .map(f => fs.readFileSync(path.join(root, f), "utf8"));
const body = html.match(/<body>([\s\S]*?)<\/body>/i)[1].replace(/<script src="[^"]*"><\/script>/g, "");
const STUBS = `
  HTMLCanvasElement.prototype.getContext = function(){ return {
    clearRect(){}, fillRect(){}, strokeRect(){}, beginPath(){}, arc(){}, stroke(){}, moveTo(){}, lineTo(){}, fill(){}, ellipse(){},
    set fillStyle(v){}, get fillStyle(){return '#000'}, set strokeStyle(v){}, get strokeStyle(){return '#000'}, set lineWidth(v){}, get lineWidth(){return 1} }; };
  window.AudioContext = function(){ return { currentTime:0, createOscillator(){return{frequency:{setValueAtTime(){}},connect(){},start(){},stop(){}};}, createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}, destination:{} }; };
  window.confirm = function(){ return true; }; window.scrollTo = function(){};
`;
const full = "<!DOCTYPE html><html><head></head><body>" + body + "<script>" + STUBS + "<\/script>" + files.map(c => "<script>" + c + "<\/script>").join("") + "</body></html>";
const dom = new JSDOM(full, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.com/" });
const { window } = dom, document = window.document;
let pass = 0, fail = 0, errs = [];
window.addEventListener("error", e => errs.push(e.error ? e.error.message : e.message));
function ok(c, m) { if (c) pass++; else { fail++; console.error("FAIL: " + m); } }
function waitLoad() { return new Promise(r => { if (document.readyState === "complete") return r(); window.addEventListener("load", () => setTimeout(r, 0)); }); }

(async function () {
  await waitLoad();
  try { window.localStorage.clear(); } catch (e) {}
  ok(window.PRODEX_DUEL && window.PRODEX_CARDS && window.__duelTest, "modules + test hook loaded");
  ok(document.querySelectorAll("#ritualBox .ritBtn").length >= 1, "ritual picker rendered on intro");

  document.getElementById("beginBtn").click();
  ok(!document.getElementById("battle").classList.contains("hidden"), "battle shown after begin");
  ok(document.querySelectorAll("#hand .dcard").length === 5, "opening hand of 5");
  ok(/Compito in Classe/.test(document.getElementById("bossName").textContent), "first boss shown");
  ok(document.getElementById("manaN").textContent === "0", "no mana before a Pomodoro");

  // start a Pomodoro (timer) via a duration button -> clock visible, run row shown
  document.querySelector('.durBtn[data-d="25"]').click();
  ok(document.getElementById("clock").style.display !== "none", "clock visible after starting a Pomodoro");
  document.getElementById("pPause").click();
  ok(true, "pause did not throw");

  // force-complete the Pomodoro via test hook
  window.__duelTest.forcePomodoro(25);
  ok(parseInt(document.getElementById("manaN").textContent, 10) >= 6, "Appunti give mana after a 25-min Pomodoro");
  ok(window.__duelTest.mode() === "play", "play mode after Pomodoro");
  ok(document.querySelectorAll("#appunti .appunto").length === 1, "one Appunto card shown");

  // play a creature card from hand
  const card = document.querySelector("#hand .dcard");
  if (card) card.click();
  ok(true, "playing a card did not throw");

  // attack + end turn (block) must not throw
  document.getElementById("bossArt").click();
  document.getElementById("attackBtn").click();
  document.getElementById("endBtn").click();
  if (!document.getElementById("confirmBlockBtn").classList.contains("hidden")) document.getElementById("confirmBlockBtn").click();
  ok(true, "attack + end turn + block did not throw");

  // close the day -> overlay + history record
  // (re-begin a fresh game first if previous ended)
  if (window.__duelTest.state() && window.__duelTest.state().status === "playing") {
    document.getElementById("endDayBtn").click();
  }
  ok(!document.getElementById("overlay").classList.contains("hidden"), "end-of-day overlay shown");
  const hist = window.localStorage.getItem("prodex_history_v2");
  ok(hist && JSON.parse(hist).days.length >= 1, "duel result recorded to shared history");

  if (errs.length) { fail += errs.length; errs.forEach(e => console.error("JS ERROR: " + e)); }
  console.log("\nduel v2 smoke: " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
