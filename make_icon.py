#!/usr/bin/env python3
"""Genera le icone dell'app (PWA / home screen) dall'arte pixel del Drago Anziano."""
import json, os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
data = json.load(open(os.path.join(HERE, "cards_art.json")))
card = data[0]  # Drago Anziano
rows, pal = card["rows"], card["pal"]
H, W = len(rows), len(rows[0])

base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
px = base.load()
for y, r in enumerate(rows):
    for x, ch in enumerate(r):
        if ch == ".":
            continue
        c = pal[ALPHA.index(ch)]
        px[x, y] = (int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16), 255)

def make(size, out):
    ic = Image.new("RGBA", (size, size), (19, 17, 42, 255))  # #13112a
    d = ImageDraw.Draw(ic)
    inner = int(size * 0.72)
    scale = max(1, inner // max(W, H))
    art = base.resize((W * scale, H * scale), Image.NEAREST)
    ic.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    bw = max(2, size // 26)
    d.rectangle([bw // 2, bw // 2, size - 1 - bw // 2, size - 1 - bw // 2], outline=(163, 52, 63, 255), width=bw)
    ic.convert("RGB").save(os.path.join(HERE, out))
    print("written", out)

make(512, "icon-512.png")
make(192, "icon-192.png")
make(180, "apple-touch-icon.png")
make(32, "favicon.png")
