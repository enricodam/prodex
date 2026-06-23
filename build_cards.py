#!/usr/bin/env python3
"""PROD-EX v2.0 — converte carte_sheet.png (sprite generati su sfondo magenta)
in carte pixel-art come PALETTE + GRIGLIA DI INDICI (solo codice, nessuna
immagine importata). Genera la gallery HTML pronta da aprire."""
import json, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SHEET = os.path.join(HERE, "..", "carte_sheet.png")
OUT_HTML = os.path.join(HERE, "PROD-EX_carte_v2_gallery.html")
TMP_HTML = "/tmp/prodex_preview/index.html"

TW, TH = 44, 44          # canvas griglia per ogni carta
KCOLORS = 26             # colori max per sprite (quantizzazione)
ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

# meta carte, in ordine di lettura del foglio (sx->dx, alto->basso)
META1 = [
 dict(n="Drago Anziano", f="fuoco", type="Creatura — Drago", cost=5, atk=6, hp=7,
      rarity="Rara", rules="<b>Volo.</b> Quando attacca, infligge 2 danni a tutte le creature nemiche.",
      fl="«L’ultimo fuoco prima dell’alba.»"),
 dict(n="Goblin esploratore", f="natura", type="Creatura — Goblin", cost=1, atk=2, hp=1,
      rarity="Comune", rules="<b>Impeto.</b> Può attaccare subito.", fl="«Corre prima di pensare.»"),
 dict(n="Sentinella di pietra", f="ordine", type="Creatura — Golem", cost=2, atk=0, hp=5,
      rarity="Rara", rules="<b>Provocazione.</b> I nemici devono attaccare lei.", fl="«Non passerai.»"),
 dict(n="Dardo infuocato", f="fuoco", type="Magia", cost=3, spell=True,
      rarity="Comune", rules="Infliggi <b>4 danni</b> a un bersaglio.", fl="«Tre parole e una scintilla.»"),
 dict(n="Pozione della furia", f="fuoco", type="Magia", cost=1, spell=True,
      rarity="Comune", rules="Una creatura ottiene <b>+3/+0</b> questo turno.", fl="«Berla brucia. Vincere, di più.»"),
 dict(n="Visione arcana", f="arcano", type="Magia", cost=2, spell=True,
      rarity="Comune", rules="Pesca <b>due carte</b>.", fl="«Il futuro, per un istante.»"),
 dict(n="Richiamo del branco", f="natura", type="Magia", cost=3, spell=True,
      rarity="Comune", rules="Evoca <b>due Lupi 2/2</b>.", fl="«Il bosco risponde.»"),
 dict(n="Bando", f="ordine", type="Magia", cost=4, spell=True,
      rarity="Rara", rules="<b>Distruggi</b> una creatura nemica.", fl="«Sparisci dalla mia vista.»"),
 dict(n="Luce risanatrice", f="ordine", type="Magia", cost=2, spell=True,
      rarity="Comune", rules="Ripristina <b>6 punti vita</b>.", fl="«L’alba cura ogni ferita.»"),
]

META2 = [
 dict(n="Arciere elfico", f="natura", type="Creatura — Elfo", cost=2, atk=3, hp=2,
      rarity="Comune", rules="<b>All’arrivo:</b> infliggi 1 danno a una creatura.", fl="«Una freccia, una verità.»"),
 dict(n="Cavaliere d’acciaio", f="ordine", type="Creatura — Cavaliere", cost=3, atk=3, hp=4,
      rarity="Comune", rules="<b>Provocazione.</b>", fl="«Lo scudo non arretra.»"),
 dict(n="Apprendista mago", f="arcano", type="Creatura — Mago", cost=2, atk=2, hp=3,
      rarity="Comune", rules="Quando lanci una magia, ottiene <b>+1/+1</b>.", fl="«Ogni incantesimo, una lezione.»"),
 dict(n="Elementale di fuoco", f="fuoco", type="Creatura — Elementale", cost=4, atk=5, hp=4,
      rarity="Rara", rules="<b>All’arrivo:</b> infliggi 2 danni a una creatura.", fl="«Nato dalla forgia del mondo.»"),
 dict(n="Troll delle caverne", f="natura", type="Creatura — Troll", cost=5, atk=6, hp=5,
      rarity="Rara", rules="<b>Schianto.</b>", fl="«La montagna cammina.»"),
 dict(n="Spettro", f="arcano", type="Creatura — Spirito", cost=3, atk=4, hp=2,
      rarity="Comune", rules="<b>Furtività.</b>", fl="«Lo vedi solo quando è tardi.»"),
 dict(n="Fiammata", f="fuoco", type="Magia", cost=3, spell=True,
      rarity="Comune", rules="Infliggi <b>2 danni</b> a tutte le creature nemiche.", fl="«Il campo diventa cenere.»"),
 dict(n="Benedizione del sole", f="ordine", type="Magia", cost=1, spell=True,
      rarity="Comune", rules="Una creatura ottiene <b>+2/+2</b>.", fl="«La luce sceglie i suoi campioni.»"),
 dict(n="Folgore arcana", f="arcano", type="Magia", cost=4, spell=True,
      rarity="Rara", rules="Infliggi <b>5 danni</b> a un bersaglio.", fl="«Il cielo si spezza.»"),
]

# (file_foglio, meta). I fogli mancanti vengono semplicemente saltati.
SHEETS = [
    (os.path.join(HERE, "sources", "carte_sheet.png"), META1),
    (os.path.join(HERE, "sources", "carte_sheet_version2.png"), META2),
]

# rarita' su 4 tier: (etichetta, tier 1..4). Forgia a tier nel gioco.
RAR = {
 "Drago Anziano": ("Leggendaria", 4), "Troll delle caverne": ("Leggendaria", 4), "Folgore arcana": ("Leggendaria", 4),
 "Sentinella di pietra": ("Epica", 3), "Bando": ("Epica", 3), "Elementale di fuoco": ("Epica", 3),
 "Spettro": ("Epica", 3), "Fiammata": ("Epica", 3),
 "Dardo infuocato": ("Rara", 2), "Visione arcana": ("Rara", 2), "Richiamo del branco": ("Rara", 2),
 "Arciere elfico": ("Rara", 2), "Cavaliere d’acciaio": ("Rara", 2),
 "Goblin esploratore": ("Comune", 1), "Pozione della furia": ("Comune", 1), "Luce risanatrice": ("Comune", 1),
 "Apprendista mago": ("Comune", 1), "Benedizione del sole": ("Comune", 1),
}

def find_bands(profile, n=3):
    thr = profile.max() * 0.5
    mask = profile > thr
    runs, s = [], None
    for i, v in enumerate(mask):
        if v and s is None: s = i
        elif not v and s is not None: runs.append((s, i)); s = None
    if s is not None: runs.append((s, len(mask)))
    runs.sort(key=lambda r: r[1] - r[0], reverse=True)
    runs = sorted(runs[:n])
    return runs

def magenta_mask(rgb):
    """True where pixel is magenta/pink chroma (also catches anti-alias halo)."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (r > 150) & (b > 150) & (g < np.minimum(r, b) - 45)

def border_ring(cell):
    h, w = cell.shape[:2]
    fw = max(4, int(min(h, w) * 0.05))
    return np.concatenate([
        cell[:fw, :, :3].reshape(-1, 3), cell[-fw:, :, :3].reshape(-1, 3),
        cell[:, :fw, :3].reshape(-1, 3), cell[:, -fw:, :3].reshape(-1, 3)]).astype(np.float32)

def make_alpha(cell):
    rgb = cell[:, :, :3].astype(np.float32)
    ring = border_ring(cell)
    if magenta_mask(ring).mean() > 0.35:
        # standard magenta-keyed cell: target the chroma directly (robust to
        # sprites that touch the cell border)
        bg = magenta_mask(rgb)
    else:
        # fallback (e.g. gradient background): key the dominant border colors
        q = (ring // 28 * 28).astype(np.int32)
        keys, counts = np.unique(q, axis=0, return_counts=True)
        refs = keys[np.argsort(-counts)[:5]].astype(np.float32)
        flat = rgb.reshape(-1, 3)
        d = np.full(flat.shape[0], 1e9, np.float32)
        for r in refs:
            d = np.minimum(d, np.sqrt(((flat - r) ** 2).sum(1)))
        bg = (d < 55).reshape(rgb.shape[:2])
    return np.where(bg, 0, 255).astype(np.uint8)

def process_cell(cell):
    a = make_alpha(cell)
    ys, xs = np.where(a > 0)
    if len(xs) == 0:
        return None
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    m = max(2, int(0.02 * max(y1 - y0, x1 - x0)))
    y0 = max(0, y0 - m); x0 = max(0, x0 - m)
    y1 = min(cell.shape[0], y1 + m); x1 = min(cell.shape[1], x1 + m)
    rgb = cell[y0:y1, x0:x1, :3]
    al = a[y0:y1, x0:x1]
    rgba = np.dstack([rgb, al])
    im = Image.fromarray(rgba)
    bw, bh = im.size
    scale = min(TW / bw, TH / bh)
    nw, nh = max(1, round(bw * scale)), max(1, round(bh * scale))
    im = im.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (TW, TH), (0, 0, 0, 0))
    canvas.paste(im, ((TW - nw) // 2, (TH - nh) // 2), im)
    arr = np.array(canvas)
    opaque = arr[:, :, 3] >= 128
    ys, xs = np.where(opaque)
    oc = arr[opaque][:, :3]
    qimg = Image.fromarray(oc.reshape(-1, 1, 3)).quantize(colors=KCOLORS, method=Image.MEDIANCUT)
    qidx = np.array(qimg).reshape(-1)
    pal_raw = qimg.getpalette()
    used = np.unique(qidx)
    remap = {int(o): i for i, o in enumerate(used)}
    pal = ["#%02x%02x%02x" % (pal_raw[3 * o], pal_raw[3 * o + 1], pal_raw[3 * o + 2]) for o in used]
    grid = [["."] * TW for _ in range(TH)]
    for n in range(len(ys)):
        grid[ys[n]][xs[n]] = ALPHA[remap[int(qidx[n])]]
    rows = ["".join(r) for r in grid]
    return dict(pal=pal, rows=rows)

def process_sheet(path, meta, start_idx):
    rgb = np.array(Image.open(path).convert("RGB"))
    rgba = np.array(Image.open(path).convert("RGBA"))
    white = (rgb[:, :, 0] > 230) & (rgb[:, :, 1] > 230) & (rgb[:, :, 2] > 230)
    content = ~white
    cols = find_bands(content.sum(0).astype(np.float32), 3)
    rows_b = find_bands(content.sum(1).astype(np.float32), 3)
    out, k = [], 0
    for (ry0, ry1) in rows_b:
        for (cx0, cx1) in cols:
            if k >= len(meta):
                break
            d = process_cell(rgba[ry0:ry1, cx0:cx1])
            d.update(meta[k])
            if meta[k]["n"] in RAR:
                d["rarity"], d["tier"] = RAR[meta[k]["n"]]
            out.append(d)
            print("  card %2d %-24s pal=%d" % (start_idx + k + 1, meta[k]["n"], len(d["pal"])))
            k += 1
    return out

def main():
    cards = []
    for path, meta in SHEETS:
        if not os.path.exists(path):
            print("skip (manca):", os.path.basename(path))
            continue
        print("foglio:", os.path.basename(path))
        cards += process_sheet(path, meta, len(cards))
    print("totale carte:", len(cards))
    with open(os.path.join(HERE, "cards_art.json"), "w") as f:
        json.dump(cards, f, ensure_ascii=False)
    js = "window.PRODEX_CARDS=" + json.dumps(cards, ensure_ascii=False) + ";"
    for p in [os.path.join(HERE, "cards_data.js"), "/tmp/prodex_preview/cards_data.js"]:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, "w").write(js)
        except Exception as e:
            print("warn cards_data.js:", e)
    html = build_html(cards)
    with open(OUT_HTML, "w") as f:
        f.write(html)
    os.makedirs(os.path.dirname(TMP_HTML), exist_ok=True)
    with open(TMP_HTML, "w") as f:
        f.write(html)
    print("written:", OUT_HTML)

def build_html(cards):
    data = json.dumps(cards, ensure_ascii=False)
    return TEMPLATE.replace("/*DATA*/", data).replace("/*ALPHA*/", ALPHA)

TEMPLATE = r"""<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PROD-EX v2.0 — Set carte fantasy</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pixelify+Sans:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0e0c20;font-family:'Pixelify Sans',sans-serif;padding:24px;color:#cdbef0}
h1{font-size:20px;font-weight:700;color:#ead7a3;margin-bottom:4px}
.sub{font-size:13px;color:#8a83b8;margin-bottom:20px}
.pf{font-family:'Pixelify Sans',sans-serif}.arc{font-family:'Press Start 2P',monospace}
#gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:18px;max-width:1160px}
.card{background:#0b0a1c;padding:4px;border-radius:7px;box-shadow:4px 4px 0 rgba(0,0,0,.3)}
.frame{border-radius:4px;padding:6px;display:flex;flex-direction:column;gap:5px;border:3px solid}
.hdr{display:flex;gap:5px;align-items:center}
.plate{background:#ead7a3;border:2px solid #0b0a1c;border-radius:3px;flex:1;box-shadow:inset 1px 1px 0 #fff3d4}
.nm{font-weight:700;font-size:15px;color:#3a1f10;padding:3px 7px;line-height:1.05;letter-spacing:.3px}
.cost{width:28px;height:28px;flex:0 0 auto;border:2px solid #0b0a1c;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#1a1005;font-size:11px;box-shadow:inset 2px 2px 0 rgba(255,255,255,.45),inset -2px -2px 0 rgba(0,0,0,.3)}
.art{border:3px solid #0b0a1c;background:#16142e;border-radius:2px;overflow:hidden;line-height:0}
.art canvas{width:100%;height:auto;display:block;image-rendering:pixelated}
.tl{display:flex;align-items:center;justify-content:space-between;background:#ead7a3;border:2px solid #0b0a1c;border-radius:3px;padding:2px 7px}
.tl .pf{font-size:11px;color:#3a1f10;font-weight:600}
.box{background:#f0e2bd;border:2px solid #0b0a1c;border-radius:3px;padding:5px 8px;min-height:50px}
.box .pf{font-size:12px;color:#2c1c0c;line-height:1.22}
.fl{font-size:11px;color:#6b4a28;font-style:italic;display:block;margin-top:3px}
.gems{display:flex;justify-content:space-between;margin-top:-17px;padding:0 2px;position:relative;z-index:2}
.gem{width:32px;height:32px;border:3px solid #0b0a1c;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px}
.atkg{background:#e8743b;color:#3a1505;box-shadow:inset 2px 2px 0 #ffc07a,inset -2px -2px 0 #a83f12}
.hpg{background:#b3322f;color:#ffe9c2;box-shadow:inset 2px 2px 0 #e06b5a,inset -2px -2px 0 #6e1a18}
.spellbadge{margin-top:-14px;align-self:center;background:#1a1838;border:2px solid #0b0a1c;border-radius:10px;padding:2px 9px;position:relative;z-index:2}
.spellbadge .pf{font-size:10px;color:#cdbef0;font-weight:600}
</style></head><body>
<h1>PROD-EX v2.0 — Set carte fantasy</h1>
<div class="sub">9 carte · arte generata convertita in pixel-in-codice (palette + indici) · 44×44</div>
<div id="gal"></div>
<script>
var ALPHA="/*ALPHA*/";
var CARDS=/*DATA*/;
var FACT={
 fuoco:{bg:'#a3343f',lt:'#cf6671',dk:'#5e1b22',gem:'#e8743b'},
 natura:{bg:'#3e7d4e',lt:'#6fb87f',dk:'#1f4a2a',gem:'#6cbf52'},
 ordine:{bg:'#bf922c',lt:'#e6c46a',dk:'#7a5e16',gem:'#e8b04a'},
 arcano:{bg:'#6b4f9e',lt:'#9b82c9',dk:'#3c2c66',gem:'#a06fd6'}
};
function render(card){
 var rows=card.rows,pal=card.pal,H=rows.length,W=rows[0].length;
 var cv=document.createElement('canvas');cv.width=W;cv.height=H;var ctx=cv.getContext('2d');
 for(var y=0;y<H;y++){var r=rows[y];for(var x=0;x<W;x++){var c=r[x];if(c==='.')continue;ctx.fillStyle=pal[ALPHA.indexOf(c)];ctx.fillRect(x,y,1,1);}}
 return cv;
}
var gal=document.getElementById('gal');
CARDS.forEach(function(c){
 var fc=FACT[c.f];
 var card=document.createElement('div');card.className='card';
 var fr=document.createElement('div');fr.className='frame';
 fr.style.background=fc.bg;fr.style.borderColor=fc.lt+' '+fc.dk+' '+fc.dk+' '+fc.lt;
 var hdr=document.createElement('div');hdr.className='hdr';
 hdr.innerHTML='<div class="plate"><div class="nm pf">'+c.n+'</div></div>';
 var cost=document.createElement('div');cost.className='cost arc';cost.style.background=fc.gem;cost.textContent=c.cost;
 hdr.appendChild(cost);fr.appendChild(hdr);
 var art=document.createElement('div');art.className='art';art.appendChild(render(c));fr.appendChild(art);
 var tl=document.createElement('div');tl.className='tl';
 tl.innerHTML='<span class="pf">'+c.type+'</span><span class="pf" style="color:'+fc.dk+'">'+c.rarity+'</span>';
 fr.appendChild(tl);
 var box=document.createElement('div');box.className='box';
 box.innerHTML='<span class="pf">'+c.rules+'</span><span class="fl pf">'+c.fl+'</span>';
 fr.appendChild(box);
 if(c.spell){
  var sb=document.createElement('div');sb.className='spellbadge';sb.innerHTML='<span class="pf">✦ MAGIA ✦</span>';fr.appendChild(sb);
 }else{
  var gems=document.createElement('div');gems.className='gems';
  gems.innerHTML='<div class="gem atkg arc">'+c.atk+'</div><div class="gem hpg arc">'+c.hp+'</div>';
  fr.appendChild(gems);
 }
 card.appendChild(fr);gal.appendChild(card);
});
</script></body></html>"""

if __name__ == "__main__":
    main()
