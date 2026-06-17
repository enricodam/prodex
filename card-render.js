/* PROD-EX Duel - pixel-art card renderer. Builds DOM cards/tokens; draws art on canvas.
   Original art only (no third-party IP). */
(function (root) {
  "use strict";
  var CARDS = (typeof require !== "undefined") ? require("./cards.js").CARDS : root.PRODEX_CARDS.CARDS;

  // identity color per art theme: [frame, dark, light]
  var THEME = {
    spark: ["#e8b53a", "#6e5414", "#ffe9a8"], sentinel: ["#4f8be8", "#1c3360", "#bcd6ff"],
    runner: ["#5bc77f", "#1f5a36", "#bdfacf"], guardian: ["#4f8be8", "#1c3360", "#bcd6ff"],
    worker: ["#e0883a", "#5a3410", "#ffd9a8"], colossus: ["#9b6ff0", "#3a2470", "#e0d0ff"],
    fury: ["#e0566a", "#5a1822", "#ffc2cc"], healer: ["#5bc77f", "#1f5a36", "#bdfacf"],
    shadow: ["#7a6f9a", "#2a2440", "#cfc8e0"],
    tomato: ["#e0566a", "#5a1822", "#ffc2cc"], wave: ["#4f8be8", "#1c3360", "#bcd6ff"],
    clock: ["#4f8be8", "#1c3360", "#bcd6ff"], arrow: ["#e8b53a", "#6e5414", "#ffe9a8"],
    grid: ["#4f8be8", "#1c3360", "#bcd6ff"], leaf: ["#5bc77f", "#1f5a36", "#bdfacf"],
    mug: ["#e0566a", "#5a1822", "#ffc2cc"], refresh: ["#9b6ff0", "#3a2470", "#e0d0ff"],
    boss: ["#e0566a", "#3a0f16", "#ffc2cc"]
  };

  // small icon sprites for spells (16x16). Space = transparent.
  var SPR = {
    tomato: ["                ","      nNn       ","     nNKNn      ","    KKrrrKK     ","   KrrrrrrrK    ","  KrrWrrrrrrK   ","  KrWWrrrrrrK   ","  KrrrrrrrrrK   ","  KrrrrrrrrrK   ","  KRrrrrrrRrK   ","   KRrrrrRrK    ","   KKRRRRRKK    ","    KKKKKKK     ","                ","                ","                "],
    wave: ["                ","                ","  K          K  "," KbK   KK   KbK "," KbbK KssK KbbK ","KbbbBKsssBKbbbK ","KsbbbBsssBbbbsK "," KBbbbBBBbbbBK  ","  KBsbbbbbsBK   ","   KBbbbbbBK    ","    KBbbbBK     ","  K  KBBBK   K  "," KbK   K    KbK "," KbbK     KssK  ","                ","                "],
    clock: ["                ","     KKKKKK     ","   KKbbbbbbKK   ","  KbbWWWWWWbbK  "," KbWWlllllWWbK  "," KbWlWlllWlWbK  "," KbWlllWlllWbK  "," KbWllWKllWlbK  "," KbWllKKWllWbK  "," KbWlllWlllWbK  "," KbWWlllllWWbK  ","  KbbWWWWWWbbK  ","   KKbbbbbbKK   ","     KKKKKK     ","                ","                "],
    arrow: ["                ","                ","      KK        ","   gg KgK       ","  gWWg KgK      ","  gWWg  KgK     ","  gggKKKKKgK    ","  ggKgggggGgK   ","  ggKgggggGgK   ","  gggKKKKKgK    ","  gWWg  KgK     ","  gWWg KgK      ","   gg KgK       ","      KK        ","                ","                "],
    grid: ["                "," KKKKKKKKKKKKK  "," KnnnnnKgggggK  "," KnnWnnKggggGK  "," KnnnnnKgggggK  "," KnnnnnKggGggK  "," KKKKKKKKKKKKK  "," KrrrrrKbbbbbK  "," KrrRrrKbbbWbK  "," KrrrrrKbbbbbK  "," KrRrrrKbbbbbK  "," KrrrrrKbbbbbK  "," KKKKKKKKKKKKK  ","                ","                ","                "],
    leaf: ["                ","         KK     ","        KnNK    ","       KnnNK    ","   KK KnnnNK    ","  KnNKnnnNK     ","  KnnNnnNK  K   ","  KnnnWNK  KnK  ","   KnWWNK KnNK  ","   KnnNK KnnNK  ","    KnNKnnnNK   ","    KNKnnNKK    ","     KNNKK      ","    KmmK        ","    KmK         ","                "],
    mug: ["                ","   s  s  s      ","  s  s  s       ","                ","  KKKKKKKKK     ","  KrrrrrrrK KK  ","  KrWWWWWrKK rK ","  KrWrrrWrK  rK ","  KrWrrrWrK rK  ","  KrWWWWWrKKK   ","  KrrrrrrrK     ","  KRRRRRRRK     ","  KKKKKKKKK     ","                ","                ","                "],
    refresh: ["                ","     KKKKK      ","   KKpppppKK    ","  KpppKKKpppK   ","  KppK   KppK   ","  KpK  K   KK   ","  KpK KpK      W"," KpK  KK      KW","W      KK  KpK  ","Wp      KpK KpK ","   KK  K   KpK  ","   KppK   KppK  ","   KpppKKKpppK  ","    KKpppppKK   ","      KKKKK     ","                "]
  };
  var PAL = { "K": "#0a0814", "W": "#ffffff", "l": "#cfd0e0", "b": "#4f8be8", "B": "#27407e",
    "s": "#cfe0ff", "g": "#f4c95d", "G": "#a9781e", "r": "#e0566a", "R": "#8a2230",
    "n": "#5bc77f", "N": "#1f5a36", "p": "#9b6ff0", "P": "#5b3aa0", "m": "#7a4a2a",
    "o": "#e0883a", "y": "#ffe9a8", "e": "#6f6a90", "c": "#3fb6c8", "d": "#3a3658" };

  // hand-authored 16x16 creature + boss sprites (distinct silhouettes)
  var CSPR = {
    spark: ["       K        ","      KgK       ","      KgK       ","  KK KgGgK KK   ","  KgGgWyWgGgK   ","   KgWyyyWgK    "," KKgWyyyyyWgKK  ","   KgWyyyWgK    ","  KgGgWyWgGgK   ","  KK KgGgK KK   ","      KgK       ","      KgK       ","       K        ","                ","                ","                "],
    sentinel: ["    KKKKKKKK    ","   KbbbbbbbbK   ","   KbWbbbbWbK   ","   KbbbbbbbbK   ","   KbWWWWWWbK   ","   KbbbbbbbbK   ","   KbbWbbWbbK   ","   KbbbbbbbbK   ","    KbbbbbbK    ","    KbbbbbbK    ","     KbbbbK     ","      KbbK      ","       KK       ","                ","                ","                "],
    runner: ["                ","   K        K   ","  KnK      KnK  "," KnnnK    KnnnK ","KnnnnnK  KnnnnnK"," KnnnnnKKnnnnnK ","   KnnnWWnnnK   ","    KnWyyWnK    ","    KnnWWnnK    ","     KnnnnK     ","      KnnK      ","      KmmK      ","      KmK       ","                ","                ","                "],
    guardian: ["      KKKK      ","    KKbbbbKK    ","   KbbbbbbbbK   ","   KbWWWWWWbK   ","   KbWKWWKWbK   ","   KbWWWWWWbK   ","   KbbbbbbbbK   ","   KbsbbbbsbK   ","   KbbbbbbbbK   ","   KbbbbbbbbK   ","   KbbbbbbbbK   ","    KbbbbbbK    ","    KbbbbbbK    ","    KKKKKKKK    ","                ","                "],
    worker: ["                ","     KKKKKK     ","    KooooooK    ","    KoWooWoK    ","    KooooooK    ","    KoKKKKoK    ","   KKooooooKK   ","   KooooooooK   ","   KoKooooKoK   ","   KKoooooKK    ","    Koo  ooK    ","    KoK  KoK    ","    KKK  KKK    ","                ","                ","                "],
    colossus: ["    KKKKKKKK    ","   KppppppppK   ","   KpWppppWpK   ","  KKppppppppKK  ","  KpppppppppK   "," KKpppppppppKK  "," KpKpppppppKpK  "," KpKpppppppKpK  "," KKpppppppppKK  ","  KpppppppppK   ","  KppKKKKKppK   ","  KppK   KppK   ","  KKK    KKK    ","                ","                ","                "],
    fury: ["   K        K   ","   Kr      rK   ","   KrK    KrK   ","    KrrrrrrK    ","   KrWrrrrWrK   ","   KrrrKKrrrK   ","   KrrrrrrrrK   ","   KRrrrrrrRK   ","    KRrrrrRK    ","     KRRRRK     ","      KrrK      ","   o  KrK  o    ","  oyo KrK oyo   ","   o  KKK  o    ","                ","                "],
    healer: ["                ","      KnnK      ","     KnnnnK     ","    KnnWWnnK    ","    KnWWWWnK    ","   KnnWWWWnnK   ","   KnWWWWWWnK   ","  KnnnWWWWnnnK  ","  KnWWWWWWWWnK  ","  KnnnWWWWnnnK  ","   KnnnnnnnnK   ","    KnnnnnnK    ","     KnnnnK     ","      KmmK      ","                ","                "],
    shadow: ["                ","     KKKKK      ","    KeeeeeeK    ","   KeeeeeeeeK   ","   KeWeeeeWeK   ","   KeeeeeeeeK   ","   KeeKKKKeeK   ","   KeeeeeeeeK   ","   KeeeeeeeeK   ","   KeeeeeeeeK   ","   KeKeKeKeKK   ","   KeKeKeKeK    ","    K K K K     ","                ","                ","                "],
    boss: ["  KKKKKKKKKKKK  ","  KllllllllllK  ","  KlRRRRRRRRlK  ","   KlrrrrrrlK   ","    KlrWWrlK    ","     KlrrlK     ","      KllK      ","      KllK      ","     KlWWlK     ","    KlWrrWlK    ","   KlWrrrrWlK   ","   KlrrrrrrlK   ","  KllllllllllK  ","  KKKKKKKKKKKK  ","                ","                "]
  };

  function drawSprite(ctx, sprite, x0, y0, px) {
    for (var i = 0; i < sprite.length; i++) for (var j = 0; j < sprite[i].length; j++) {
      var ch = sprite[i][j]; if (ch === " ") continue; var c = PAL[ch]; if (!c) continue;
      ctx.fillStyle = c; ctx.fillRect(x0 + j * px, y0 + i * px, px, px);
    }
  }

  // procedural pixel scene for a card art window
  function drawArt(canvas, art) {
    var ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    var th = THEME[art] || ["#4f8be8", "#1c3360", "#bcd6ff"];
    // sky gradient + stars (blocky)
    var ps = Math.max(2, Math.floor(W / 32));
    for (var y = 0; y < H; y += ps) {
      var t = y / H;
      ctx.fillStyle = shade(th[1], 0.5 + 0.5 * (1 - t));
      ctx.fillRect(0, y, W, ps);
    }
    var seed = art.length * 7; function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    ctx.fillStyle = "#cfe0ff";
    for (var s = 0; s < 14; s++) ctx.fillRect(Math.floor(rnd() * W / ps) * ps, Math.floor(rnd() * H * 0.5 / ps) * ps, ps, ps);

    var spr = SPR[art] || CSPR[art];
    if (spr) { // sprite, centered big
      var scale = Math.max(1, Math.floor(Math.min(W, H) / 18));
      drawSprite(ctx, spr, Math.floor((W - 16 * scale) / 2), Math.floor((H - 16 * scale) / 2), scale);
      return;
    }
    // creature: a glowing spirit blob with eyes + emblem
    var cx = W / 2, cy = H * 0.58, r = Math.min(W, H) * (art === "colossus" ? 0.38 : 0.3);
    blob(ctx, cx, cy, r, th[0], th[2], ps);
    // eyes
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx - r * 0.4, cy - r * 0.1, ps * 2, ps * 2);
    ctx.fillRect(cx + r * 0.25, cy - r * 0.1, ps * 2, ps * 2);
    ctx.fillStyle = "#101024";
    ctx.fillRect(cx - r * 0.4 + ps, cy - r * 0.1 + ps, ps, ps);
    ctx.fillRect(cx + r * 0.25 + ps, cy - r * 0.1 + ps, ps, ps);
    emblem(ctx, art, cx, cy, r, ps, th);
  }
  function blob(ctx, cx, cy, r, fill, light, ps) {
    for (var y = -r; y <= r; y += ps) for (var x = -r; x <= r; x += ps) {
      var d = (x * x) / (r * r) + (y * y) / (r * r * 0.85);
      if (d <= 1) { ctx.fillStyle = d < 0.4 ? light : fill; ctx.fillRect(Math.round(cx + x), Math.round(cy + y), ps, ps); }
    }
  }
  function emblem(ctx, art, cx, cy, r, ps, th) {
    if (art === "sentinel") { ctx.fillStyle = th[2]; ctx.fillRect(cx - ps * 2, cy + r * 0.2, ps * 4, ps * 4); ctx.fillStyle = th[1]; ctx.fillRect(cx - ps, cy + r * 0.2 + ps, ps * 2, ps * 2); }
    else if (art === "healer") { ctx.fillStyle = "#fff"; ctx.fillRect(cx - ps / 2, cy - r * 0.4, ps, ps * 4); ctx.fillRect(cx - ps * 1.5, cy - r * 0.4 + ps, ps * 4, ps); }
    else if (art === "fury") { ctx.fillStyle = th[2]; for (var k = -2; k <= 2; k++) ctx.fillRect(cx + k * ps * 2, cy - r - ps * 2, ps, ps * 2); }
    else if (art === "runner") { ctx.fillStyle = th[2]; for (var m = 0; m < 3; m++) ctx.fillRect(cx - r - ps * 3 - m * ps * 2, cy - m * ps * 2, ps * 3, ps); }
    else if (art === "guardian") { ctx.strokeStyle = th[2]; ctx.lineWidth = ps; ctx.beginPath(); ctx.arc(cx, cy, r + ps * 2, 0, 6.28); ctx.stroke(); }
    else if (art === "spark") { ctx.fillStyle = "#fff"; ctx.fillRect(cx - ps / 2, cy - r - ps * 3, ps, ps * 3); }
  }
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    f = Math.max(0, Math.min(1.4, f));
    return "rgb(" + Math.min(255, r * f | 0) + "," + Math.min(255, g * f | 0) + "," + Math.min(255, b * f | 0) + ")";
  }

  // build a full hand card element
  function renderCard(cardId, opts) {
    opts = opts || {};
    var def = CARDS[cardId], th = THEME[def.art] || ["#4f8be8", "#1c3360", "#bcd6ff"];
    var el = document.createElement("div");
    el.className = "dcard"; el.style.setProperty("--cf", th[0]); el.style.setProperty("--cd", th[1]);
    var banner = document.createElement("div"); banner.className = "dc-banner";
    banner.innerHTML = '<span class="dc-name">' + def.name + '</span><span class="dc-cost">' + def.cost + '</span>';
    el.appendChild(banner);
    var cv = document.createElement("canvas"); cv.width = 132; cv.height = 84; cv.className = "dc-art";
    el.appendChild(cv); drawArt(cv, def.art);
    var typ = document.createElement("div"); typ.className = "dc-type"; typ.textContent = def.type; el.appendChild(typ);
    var txt = document.createElement("div"); txt.className = "dc-text"; txt.textContent = def.text || ""; el.appendChild(txt);
    if (def.kind === "creature") {
      var pt = document.createElement("div"); pt.className = "dc-pt";
      pt.textContent = (opts.power != null ? opts.power : def.power) + "/" + (opts.tough != null ? opts.tough : def.tough);
      el.appendChild(pt);
    }
    return el;
  }

  // compact board token for a creature instance
  function renderToken(inst, opts) {
    opts = opts || {};
    var def = CARDS[inst.cardId] || { art: inst.art || "shadow", name: inst.name };
    var th = THEME[def.art] || ["#7a6f9a", "#2a2440", "#cfc8e0"];
    var el = document.createElement("div");
    el.className = "dtoken" + (inst.tapped ? " tapped" : "") + (inst.sick ? " sick" : "");
    el.style.setProperty("--cf", th[0]);
    var cv = document.createElement("canvas"); cv.width = 56; cv.height = 44; cv.className = "dt-art";
    el.appendChild(cv); drawArt(cv, def.art);
    var pt = document.createElement("div"); pt.className = "dt-pt";
    var curT = inst.tough - (inst.dmg || 0);
    pt.innerHTML = '<span>' + inst.power + '</span>/<span class="' + (inst.dmg ? "hurt" : "") + '">' + curT + '</span>';
    el.appendChild(pt);
    var nm = document.createElement("div"); nm.className = "dt-nm"; nm.textContent = inst.name; el.appendChild(nm);
    return el;
  }

  var API = { renderCard: renderCard, renderToken: renderToken, drawArt: drawArt, THEME: THEME };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.PRODEX_CARDREND = API;
})(typeof window !== "undefined" ? window : globalThis);
