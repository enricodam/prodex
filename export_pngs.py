#!/usr/bin/env python3
"""PROD-EX v2.0 — esporta ogni carta (da cards_art.json) come PNG stampabile
ad alta risoluzione + un foglio A4 3x3 (PNG e PDF). Cornici, nomi, gemme e
testo disegnati con Pillow; l'arte pixel viene scalata nearest-neighbor."""
import json, os, re
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
CARDS = json.load(open(os.path.join(HERE, "cards_art.json")))
OUTDIR = os.path.join(HERE, "cards_png")
os.makedirs(OUTDIR, exist_ok=True)

PIX = os.path.join(HERE, "fonts", "PixelifySans.ttf")
PS2 = os.path.join(HERE, "fonts", "PressStart2P.ttf")

FACT = {
 "fuoco":  dict(bg=(163,52,63),  lt=(207,102,113), dk=(94,27,34),  gem=(232,116,59)),
 "natura": dict(bg=(62,125,78),  lt=(111,184,127), dk=(31,74,42),  gem=(108,191,82)),
 "ordine": dict(bg=(191,146,44), lt=(230,196,106), dk=(122,94,22), gem=(232,176,74)),
 "arcano": dict(bg=(107,79,158), lt=(155,130,201), dk=(60,44,102), gem=(160,111,214)),
}
PARCH = (240, 226, 189)
PARCH2 = (244, 236, 216)
INK = (44, 28, 12)
SKY = (22, 20, 46)
BLACK = (11, 10, 28)

W, H = 750, 1050
FM = 14          # outer black border thickness
PD = 26          # inner padding inside frame

def pix(size, wght=400):
    f = ImageFont.truetype(PIX, size)
    try:
        f.set_variation_by_axes([wght])
    except Exception:
        pass
    return f

def ps2(size):
    return ImageFont.truetype(PS2, size)

def fit_pix(text, max_w, start, wght=700, lo=14):
    s = start
    while s > lo:
        f = pix(s, wght)
        if f.getlength(text) <= max_w:
            return f
        s -= 1
    return pix(lo, wght)

def wrap(text, font, max_w):
    out = []
    for para in text.split("\n"):
        words, line = para.split(), ""
        for w in words:
            t = (line + " " + w).strip()
            if font.getlength(t) <= max_w:
                line = t
            else:
                if line:
                    out.append(line)
                line = w
        out.append(line)
    return out

def art_image(card):
    rows, pal = card["rows"], card["pal"]
    h, w = len(rows), len(rows[0])
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = im.load()
    for y in range(h):
        r = rows[y]
        for x in range(w):
            c = r[x]
            if c == ".":
                continue
            hexc = pal[ALPHA.index(c)]
            px[x, y] = (int(hexc[1:3], 16), int(hexc[3:5], 16), int(hexc[5:7], 16), 255)
    return im

def plate(d, box, fill=PARCH, r=10, ow=4):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=BLACK, width=ow)

def gem(d, cx, cy, rad, fill, text, font, tcol):
    d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=fill, outline=BLACK, width=5)
    d.ellipse([cx - rad + 4, cy - rad + 4, cx + rad - 4, cy + rad - 4],
              outline=tuple(min(255, v + 60) for v in fill), width=3)
    tb = d.textbbox((0, 0), text, font=font)
    d.text((cx - (tb[2] - tb[0]) / 2 - tb[0], cy - (tb[3] - tb[1]) / 2 - tb[1]), text, font=font, fill=tcol)

def draw_card(card):
    fc = FACT[card["f"]]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, W - 1, H - 1], radius=30, fill=BLACK)
    fb = [FM, FM, W - 1 - FM, H - 1 - FM]
    d.rounded_rectangle(fb, radius=22, fill=fc["bg"])
    d.rounded_rectangle(fb, radius=22, outline=fc["dk"], width=4)
    d.rounded_rectangle([fb[0] + 4, fb[1] + 4, fb[2] - 4, fb[3] - 4], radius=18, outline=fc["lt"], width=3)

    x0, x1 = FM + PD, W - FM - PD
    y = FM + PD

    # header: name plate + cost gem
    gd = 76
    hh = 78
    plate(d, [x0, y, x1 - gd + 8, y + hh], fill=PARCH, r=10)
    nm = card["n"]
    nf = fit_pix(nm, (x1 - gd + 8) - x0 - 28, 40, wght=700)
    nb = d.textbbox((0, 0), nm, font=nf)
    d.text((x0 + 16, y + hh / 2 - (nb[3] - nb[1]) / 2 - nb[1]), nm, font=nf, fill=(58, 31, 16))
    gem(d, x1 - gd / 2, y + hh / 2, gd / 2, fc["gem"], str(card["cost"]), ps2(26), (26, 16, 5))
    y += hh + 14

    # art window (fixed height; square art centered, sky letterbox on sides)
    ARTH = 560
    aw = x1 - x0
    win = [x0, y, x1, y + ARTH]
    d.rounded_rectangle(win, radius=6, fill=SKY, outline=BLACK, width=5)
    side = ARTH - 18
    art = art_image(card).resize((side, side), Image.NEAREST)
    img.paste(art, (x0 + (aw - side) // 2, y + 9), art)
    y += ARTH + 14

    # type line
    th = 50
    plate(d, [x0, y, x1, y + th], fill=PARCH, r=8)
    tf = pix(24, 600)
    d.text((x0 + 14, y + th / 2 - 16), card["type"], font=tf, fill=(58, 31, 16))
    rar = card.get("rarity", "Comune")
    rb = d.textbbox((0, 0), rar, font=tf)
    d.text((x1 - 14 - (rb[2] - rb[0]), y + th / 2 - 16), rar, font=tf, fill=fc["dk"])
    y += th + 14

    # text box
    is_spell = card.get("spell")
    box_bottom = H - FM - PD
    plate(d, [x0, y, x1, box_bottom], fill=PARCH2, r=10)
    tx0, tx1 = x0 + 20, x1 - 20
    rules = re.sub(r"<[^>]+>", "", card["rules"])
    limit = box_bottom - 56
    rf = pix(28, 500)
    ty = y + 18
    for ln in wrap(rules, rf, tx1 - tx0):
        if ty > limit:
            break
        d.text((tx0, ty), ln, font=rf, fill=INK)
        ty += 34
    flav = card.get("fl", "")
    if flav and ty < limit - 24:
        ty += 8
        d.line([(tx0 + 10, ty), (tx1 - 10, ty)], fill=(150, 125, 88), width=2)
        ty += 12
        ff = pix(23, 400)
        for ln in wrap(flav, ff, tx1 - tx0):
            if ty > limit:
                break
            d.text((tx0, ty), ln, font=ff, fill=(95, 70, 44))
            ty += 28

    # gems / spell badge overlapping textbox bottom
    if is_spell:
        bw, bh = 168, 40
        bx = (x0 + x1) / 2
        d.rounded_rectangle([bx - bw / 2, box_bottom - bh / 2, bx + bw / 2, box_bottom + bh / 2],
                            radius=18, fill=(26, 24, 56), outline=BLACK, width=4)
        bf = pix(22, 600)
        t = "MAGIA"
        col = (205, 190, 240)
        tb = d.textbbox((0, 0), t, font=bf)
        tw = tb[2] - tb[0]
        d.text((bx - tw / 2 - tb[0], box_bottom - (tb[3] - tb[1]) / 2 - tb[1]), t, font=bf, fill=col)
        for dx in (-tw / 2 - 16, tw / 2 + 16):
            cx = bx + dx
            d.polygon([(cx, box_bottom - 6), (cx + 6, box_bottom), (cx, box_bottom + 6), (cx - 6, box_bottom)], fill=col)
    else:
        gem(d, x0 + 36, box_bottom, 36, (232, 116, 59), str(card["atk"]), ps2(24), (58, 21, 5))
        gem(d, x1 - 36, box_bottom, 36, (179, 50, 47), str(card["hp"]), ps2(24), (255, 233, 194))
    return img

def main():
    cards_img = []
    for i, c in enumerate(CARDS, 1):
        im = draw_card(c)
        fn = "%02d_%s.png" % (i, c["n"].replace(" ", "_").replace("'", ""))
        im.save(os.path.join(OUTDIR, fn))
        cards_img.append(im)
        print("saved", fn)
    # fogli A4 3x3, 300 dpi (2480x3508), paginati + PDF multipagina
    AW, AH = 2480, 3508
    cols, rows = 3, 3
    per = cols * rows
    gx, gy = 40, 40
    cw = (AW - gx * (cols + 1)) // cols
    ch = int(cw * H / W)
    oy = (AH - (ch * rows + gy * (rows - 1))) // 2
    pages = []
    for p in range(0, len(cards_img), per):
        sheet = Image.new("RGB", (AW, AH), (255, 255, 255))
        for j, im in enumerate(cards_img[p:p + per]):
            r, cc = divmod(j, cols)
            x = gx + cc * (cw + gx)
            yy = oy + r * (ch + gy)
            rim = im.resize((cw, ch), Image.LANCZOS)
            sheet.paste(rim, (x, yy), rim)
        pages.append(sheet)
        sheet.save(os.path.join(HERE, "PROD-EX_carte_v2_A4_p%d.png" % len(pages)))
    if pages:
        pages[0].save(os.path.join(HERE, "PROD-EX_carte_v2_A4.pdf"), "PDF",
                      resolution=300, save_all=True, append_images=pages[1:])
    print("fogli A4:", len(pages), "(PNG per pagina + PDF multipagina)")

if __name__ == "__main__":
    main()
