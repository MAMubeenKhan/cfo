"""Generates the deliberately unconvincing 'evidence photos' for the seed cases.

Every image is drawn from scratch (no third-party imagery): a simple scene, then soft focus,
compression, grain and a camera timestamp. Deterministic: same output every run.
Usage: python scripts/make_evidence_photos.py
"""
import io
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 640, 427
OUT_W, OUT_H = 960, 640
OUT = os.path.join(os.path.dirname(__file__), '..', 'seed', 'images')
FONT_PATHS = ['C:/Windows/Fonts/cour.ttf', 'C:/Windows/Fonts/consola.ttf']


def rng(seed):
    return np.random.default_rng(seed)


def grad(top, bottom, horizon=1.0):
    t = np.clip(np.linspace(0, 1, H) / horizon, 0, 1)[:, None, None]
    col = np.array(top)[None, None, :] * (1 - t) + np.array(bottom)[None, None, :] * t
    return np.broadcast_to(col, (H, W, 3)).copy()


def to_img(arr):
    return Image.fromarray((np.clip(arr, 0, 1) * 255).astype('uint8'))


def to_arr(img):
    return np.asarray(img).astype('float32') / 255.0


def glow(arr, points, radius, color, strength=1.0, core=2):
    """Additive soft light at each (x, y)."""
    layer = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(layer)
    for x, y in points:
        d.ellipse([x - core, y - core, x + core, y + core], fill=255)
    layer = layer.filter(ImageFilter.GaussianBlur(radius))
    m = np.asarray(layer).astype('float32')[:, :, None] / 255.0
    return arr + m * np.array(color)[None, None, :] * strength * (3.0 if radius > 6 else 2.0)


def ridge(arr, y0, amp, seed, color, freq=0.02):
    r = rng(seed)
    xs = np.arange(W)
    ph = r.uniform(0, 6.28, 3)
    y = y0 + amp * (np.sin(xs * freq + ph[0]) + 0.5 * np.sin(xs * freq * 2.3 + ph[1]) + 0.25 * np.sin(xs * freq * 5.1 + ph[2]))
    mask = (np.arange(H)[:, None] > y[None, :])
    out = arr.copy()
    out[mask] = np.array(color)
    return out


def stars(arr, seed, n=140, ymax=0.7):
    r = rng(seed)
    for _ in range(n):
        x, y = int(r.uniform(0, W)), int(r.uniform(0, H * ymax))
        arr[y, x] = np.clip(arr[y, x] + r.uniform(0.2, 0.7), 0, 1)
    return arr


def draw(arr):
    img = to_img(arr)
    return img, ImageDraw.Draw(img)


def finish(img, seed, stamp=None, blur=1.1, grain=0.07, vignette=0.55, tint=(1.0, 0.98, 0.93), quality=42, day=False):
    """Soft focus, vignette, tint, grain, low-quality compression, timestamp."""
    r = rng(seed)
    img = img.filter(ImageFilter.GaussianBlur(blur))
    a = to_arr(img)
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    a *= (1 - vignette * np.clip(d - 0.35, 0, 1) ** 1.5)[:, :, None]
    a *= np.array(tint)[None, None, :]
    a += r.normal(0, grain, (H, W, 1)) + r.normal(0, grain * 0.4, (H, W, 3))
    img = to_img(a)
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=quality)
    buf.seek(0)
    img = Image.open(buf).convert('RGB').resize((OUT_W, OUT_H), Image.BICUBIC)
    if stamp:
        d = ImageDraw.Draw(img)
        font = None
        for p in FONT_PATHS:
            if os.path.exists(p):
                font = ImageFont.truetype(p, 26)
                break
        font = font or ImageFont.load_default()
        d.text((OUT_W - 372, OUT_H - 52), stamp, font=font, fill=(255, 150, 40))
    return img


# ---------------------------------------------------------------- scenes


def c01_print():
    a = grad((0.40, 0.33, 0.24), (0.26, 0.21, 0.15))
    r = rng(1)
    a += r.normal(0, 0.05, (H, W, 1))
    img = to_img(a)
    # a bare footprint drawn on its own layer, then rotated: long sole, narrower heel, five toes
    lay = Image.new('RGBA', (300, 420), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    dark, rim = (52, 40, 29, 255), (128, 108, 82, 255)
    for grow, colr in ((6, rim), (0, dark)):
        d.ellipse([70 - grow, 110 - grow, 230 + grow, 300 + grow], fill=colr)        # ball and arch
        d.ellipse([92 - grow, 250 - grow, 208 + grow, 400 + grow], fill=colr)        # heel
        toes = [(84, 60, 40), (128, 36, 34), (168, 44, 30), (202, 64, 26), (228, 92, 22)]
        for (tx, ty, tr) in toes:
            d.ellipse([tx - tr - grow, ty - tr - grow, tx + tr + grow, ty + tr + grow], fill=colr)
    lay = lay.rotate(24, expand=True, resample=Image.BICUBIC)
    img.paste(lay, (250, -6), lay)
    d = ImageDraw.Draw(img)
    # scale ruler
    d.rectangle([60, 366, 380, 388], fill=(215, 200, 150))
    for i in range(0, 17):
        x = 60 + i * 20
        d.line([x, 366, x, 366 + (14 if i % 5 == 0 else 8)], fill=(40, 30, 20), width=2)
    return img

def c05_animal():
    a = grad((0.55, 0.42, 0.38), (0.30, 0.27, 0.20))
    a = glow(a, [(540, 80)], 40, (1.0, 0.7, 0.4), 0.5, core=14)
    img, d = draw(a)
    d.rectangle([0, 300, W, H], fill=(70, 62, 40))
    d.rectangle([30, 190, 180, 310], fill=(88, 70, 50))
    d.polygon([(20, 195), (105, 140), (190, 195)], fill=(66, 52, 40))
    # lean hairless canine: narrow body, long thin legs, pointed snout, spiny ridge, low tail
    col = (140, 134, 128)
    d.polygon([(290, 262), (400, 250), (440, 268), (418, 300), (300, 304)], fill=col)      # body
    d.polygon([(430, 250), (478, 262), (508, 290), (472, 292), (436, 286)], fill=col)      # head + snout
    d.polygon([(446, 252), (452, 226), (462, 254)], fill=col)                              # ear
    for x0, x1 in ((304, 324), (340, 358), (384, 402), (414, 430)):
        d.polygon([(x0, 296), (x1, 296), (x1 - 4, 372), (x0 + 2, 372)], fill=col)          # legs
    d.polygon([(292, 268), (240, 300), (250, 306), (298, 284)], fill=col)                  # tail
    for x in range(300, 412, 10):
        d.polygon([(x, 262 - (x - 300) // 20), (x + 5, 246 - (x - 300) // 20), (x + 10, 262 - (x - 300) // 20)], fill=(100, 96, 92))
    d.ellipse([482, 268, 490, 274], fill=(30, 26, 26))
    return img

def c06_wake():
    a = grad((0.72, 0.76, 0.78), (0.42, 0.50, 0.54), 0.55)
    img, d = draw(a)
    d.rectangle([0, 190, W, H], fill=(84, 100, 108))
    for y in range(196, H, 9):
        d.line([0, y, W, y + 1], fill=(96, 112, 120), width=1)
    d.polygon([(0, 190), (90, 158), (200, 178), (330, 150), (470, 176), (640, 160), (640, 192), (0, 192)], fill=(74, 82, 82))
    # small dark shape with a raised section and a wake
    d.ellipse([396, 262, 452, 276], fill=(30, 36, 38))
    d.ellipse([436, 246, 446, 268], fill=(30, 36, 38))
    d.polygon([(396, 268), (300, 292), (330, 296)], fill=(112, 128, 134))
    d.polygon([(452, 270), (560, 294), (520, 298)], fill=(112, 128, 134))
    return img


def c08_figure():
    a = grad((0.03, 0.04, 0.09), (0.10, 0.10, 0.12))
    a = stars(a, 8, 60, 0.3)
    img, d = draw(a)
    d.rectangle([0, 340, W, H], fill=(58, 58, 62))
    d.rectangle([150, 120, 500, 340], fill=(112, 116, 104))      # lit store wall behind the figure
    d.rectangle([60, 90, 580, 130], fill=(222, 232, 212))       # canopy
    d.rectangle([90, 130, 104, 340], fill=(70, 70, 76))
    d.rectangle([536, 130, 550, 340], fill=(70, 70, 76))
    d.rectangle([420, 250, 470, 340], fill=(190, 40, 40))       # pump
    d.rectangle([430, 262, 460, 282], fill=(210, 236, 210))
    # costumed figure against the lit wall: body, horns, wings, waving arm
    ink = (26, 22, 24)
    d.ellipse([296, 176, 350, 232], fill=ink)
    d.rectangle([300, 228, 346, 332], fill=ink)
    d.polygon([(300, 184), (288, 148), (312, 178)], fill=ink)
    d.polygon([(346, 184), (358, 148), (334, 178)], fill=ink)
    d.polygon([(300, 240), (214, 190), (226, 306)], fill=(36, 30, 34))
    d.polygon([(346, 240), (432, 190), (420, 306)], fill=(36, 30, 34))
    d.line([346, 246, 392, 200], fill=ink, width=10)
    d.line([306, 246, 292, 312], fill=ink, width=9)
    d.line([324, 332, 324, 236], fill=(140, 140, 148), width=1)   # the zip
    d.ellipse([310, 190, 318, 198], fill=(230, 230, 200))
    d.ellipse([328, 190, 336, 198], fill=(230, 230, 200))
    a2 = glow(to_arr(img), [(320, 108), (200, 112), (470, 112)], 34, (1.0, 0.95, 0.8), 0.5, core=10)
    return to_img(a2)

def c09_triangle():
    a = grad((0.03, 0.04, 0.09), (0.10, 0.11, 0.16))
    a = stars(a, 9, 900, 0.95)
    a = np.clip(a * 1.0, 0, 1)
    img, d = draw(a)
    d.polygon([(320, 96), (130, 262), (510, 262)], fill=(2, 2, 4))          # no stars inside the shape
    a2 = to_arr(img)
    a2 = glow(a2, [(320, 102), (140, 258), (500, 258)], 14, (0.95, 0.97, 1.0), 1.0, core=5)
    img = to_img(a2)
    d = ImageDraw.Draw(img)
    d.polygon([(0, 352), (W, 352), (W, 312), (0, 334)], fill=(14, 14, 16))   # bonnet
    d.rectangle([0, 352, W, H], fill=(10, 10, 12))
    d.rectangle([0, 0, 22, H], fill=(6, 6, 8))                                # windscreen pillars
    d.rectangle([W - 22, 0, W, H], fill=(6, 6, 8))
    return img

def c10_capsule():
    a = grad((0.42, 0.34, 0.42), (0.86, 0.52, 0.32), 0.7)
    a = ridge(a, 300, 26, 10, (0.10, 0.08, 0.09), 0.014)
    img, d = draw(a)
    d.rounded_rectangle([408, 122, 468, 142], radius=10, fill=(238, 238, 232))
    a2 = glow(to_arr(img), [(438, 132)], 8, (1.0, 1.0, 0.95), 0.25, core=8)
    return to_img(a2)


def c11_lights():
    a = grad((0.01, 0.02, 0.06), (0.05, 0.06, 0.12))
    a = stars(a, 11, 220, 0.9)
    pts = []
    for i in range(30):
        t = i / 29
        pts.append((60 + t * 520, 300 - math.sin(t * 3.14) * 150 + (t * 20)))
    a = glow(a, pts, 5, (1.0, 1.0, 1.0), 0.8, core=3)
    img, d = draw(a)
    d.polygon([(0, 400), (140, 372), (260, 392), (400, 366), (640, 396), (640, H), (0, H)], fill=(6, 5, 6))
    return img


def c12_disc():
    a = grad((0.30, 0.52, 0.86), (0.72, 0.82, 0.92), 0.8)
    r = rng(12)
    img, d = draw(a)
    d.polygon([(0, 300), (120, 262), (180, 262), (250, 300), (330, 300), (330, H), (0, H)], fill=(120, 84, 62))
    d.rectangle([94, 262, 190, 268], fill=(150, 108, 80))
    d.polygon([(330, 320), (470, 290), (640, 320), (640, H), (330, H)], fill=(100, 70, 52))
    d.ellipse([292, 108, 372, 130], fill=(200, 205, 212))
    d.ellipse([314, 98, 350, 118], fill=(186, 192, 200))
    d.ellipse([318, 112, 346, 118], fill=(250, 250, 250))
    return img


def c14_orbs():
    a = grad((0.01, 0.015, 0.04), (0.07, 0.05, 0.05))
    a = stars(a, 14, 150, 0.6)
    a = ridge(a, 300, 30, 14, (0.015, 0.012, 0.015), 0.012)
    pts = [(250, 170), (312, 148), (366, 182), (420, 156), (470, 196)]
    a = glow(a, pts, 9, (1.0, 0.62, 0.18), 0.9, core=6)
    return to_img(a)


def c18_figure():
    a = grad((0.015, 0.015, 0.03), (0.04, 0.04, 0.05))
    img, d = draw(a)
    d.polygon([(250, 172), (400, 172), (640, H), (0, H)], fill=(66, 64, 60))    # road in headlights
    d.line([322, 176, 322, 420], fill=(170, 150, 70), width=3)
    d.polygon([(400, 172), (640, 60), (640, H), (640, 172)], fill=(46, 44, 40))  # lit verge on the right
    a2 = glow(to_arr(img), [(230, 320), (440, 320), (520, 250)], 70, (1.0, 0.95, 0.75), 0.75, core=30)
    img = to_img(a2)
    d = ImageDraw.Draw(img)
    ink = (14, 14, 16)
    d.polygon([(508, 104), (486, 138), (530, 138)], fill=ink)                    # triangular head
    d.rectangle([503, 138, 513, 292], fill=ink)                                  # thin body
    d.line([503, 166, 470, 240], fill=ink, width=4)
    d.line([513, 166, 546, 240], fill=ink, width=4)
    d.line([505, 292, 494, 346], fill=ink, width=5)
    d.line([511, 292, 524, 346], fill=ink, width=5)
    d.ellipse([498, 118, 504, 124], fill=(200, 60, 40))
    d.ellipse([511, 118, 517, 124], fill=(200, 60, 40))
    return img

def c19_light():
    a = grad((0.02, 0.03, 0.07), (0.07, 0.07, 0.11))
    a = stars(a, 19, 300, 0.75)
    a = glow(a, [(320, 92)], 30, (0.95, 0.98, 1.0), 1.4, core=14)
    img, d = draw(a)
    d.rectangle([0, 322, W, H], fill=(18, 16, 16))
    for x in range(0, W, 26):
        d.line([x, 250, x, 336], fill=(44, 42, 42), width=2)
    for y in (262, 290, 318):
        d.line([0, y, W, y], fill=(52, 50, 50), width=2)
    d.ellipse([408, 232, 428, 252], fill=(150, 150, 154))                         # small figure at the fence
    d.rectangle([412, 250, 424, 314], fill=(150, 150, 154))
    a2 = glow(to_arr(img), [(320, 92)], 8, (1.0, 1.0, 1.0), 0.9, core=6)
    return to_img(a2)

def c23_window():
    a = grad((0.42, 0.24, 0.20), (0.34, 0.20, 0.18))
    r = rng(23)
    img, d = draw(a)
    for row in range(0, H, 18):
        d.line([0, row, W, row], fill=(60, 34, 30), width=1)
        off = 0 if (row // 18) % 2 == 0 else 24
        for x in range(off, W, 48):
            d.line([x, row, x, row + 18], fill=(60, 34, 30), width=1)
    d.rectangle([196, 40, 444, 380], fill=(30, 26, 28))  # frame
    d.rectangle([208, 52, 432, 368], fill=(84, 96, 108))  # glass
    d.line([320, 52, 320, 368], fill=(30, 26, 28), width=6)
    d.line([208, 210, 432, 210], fill=(30, 26, 28), width=6)
    # reflection of the street: pale figure, lamp post, sky
    d.rectangle([208, 300, 432, 368], fill=(58, 64, 70))
    d.ellipse([340, 118, 372, 150], fill=(196, 200, 206))
    d.polygon([(332, 152), (380, 152), (388, 262), (324, 262)], fill=(180, 186, 194))
    d.rectangle([236, 82, 244, 300], fill=(50, 50, 56))
    return img


def c28_lodge():
    a = grad((0.03, 0.04, 0.06), (0.09, 0.09, 0.10))
    img, d = draw(a)
    d.rectangle([120, 70, 520, 340], fill=(34, 30, 30))
    d.rectangle([270, 200, 370, 340], fill=(14, 12, 12))  # door
    d.rectangle([150, 120, 210, 190], fill=(66, 58, 40))
    d.rectangle([430, 120, 490, 190], fill=(66, 58, 40))
    d.polygon([(110, 72), (320, 30), (530, 72)], fill=(24, 22, 22))
    d.rectangle([0, 340, W, H], fill=(20, 22, 26))
    a2 = to_arr(img)
    a2 = glow(a2, [(320, 210), (180, 155), (460, 155)], 22, (1.0, 0.72, 0.30), 0.9, core=9)
    a2[340:, :, :] += glow(np.zeros((H, W, 3)), [(320, 372)], 30, (1.0, 0.7, 0.3), 0.25, core=14)[340:, :, :]
    img = to_img(a2)
    d = ImageDraw.Draw(img)
    r = rng(28)
    for _ in range(260):  # rain streaks
        x, y = int(r.uniform(0, W)), int(r.uniform(0, H))
        d.line([x, y, x - 3, y + 16], fill=(120, 130, 140), width=1)
    return img


def c29_circle():
    a = grad((0.20, 0.22, 0.28), (0.10, 0.12, 0.09), 0.5)
    r = rng(29)
    img, d = draw(a)
    for x in range(0, W, 22):  # tree line
        h = int(r.uniform(130, 210))
        d.polygon([(x, 250), (x + 11, 250 - h), (x + 22, 250)], fill=(10, 16, 12))
    d.rectangle([0, 250, W, H], fill=(38, 42, 30))
    pts = []
    for i in range(30):
        ang = i / 30 * 6.283
        x, y = 320 + math.cos(ang) * 150, 320 + math.sin(ang) * 46
        pts.append((x, y))
        d.rectangle([x - 3, y - 4, x + 3, y + 4], fill=(230, 226, 210))
    d.line([170, 320, 470, 320], fill=(236, 236, 230), width=4)  # salt
    a2 = glow(to_arr(img), pts, 7, (1.0, 0.66, 0.24), 0.85, core=3)
    return to_img(a2)


def c30_ledger():
    a = grad((0.66, 0.58, 0.44), (0.54, 0.46, 0.34))
    r = rng(30)
    a += r.normal(0, 0.03, (H, W, 1))
    img, d = draw(a)
    for page, x0 in enumerate((30, 340)):
        d.rectangle([x0, 24, x0 + 270, 402], fill=(226, 214, 186))
        for i in range(17):
            y = 60 + i * 20
            d.line([x0 + 16, y, x0 + 254, y], fill=(190, 176, 150), width=1)
            # consistent 'hand' squiggle
            px = x0 + 22
            while px < x0 + 246:
                seg = int(r.uniform(14, 40))
                d.line([px, y - 6, px + seg, y - 3 + int(r.uniform(-4, 4))], fill=(40, 34, 60), width=2)
                px += seg + 8
        d.text((x0 + 90, 34), 'NINTH MERIDIAN', fill=(60, 30, 30))
    d.line([322, 24, 322, 402], fill=(120, 100, 80), width=3)
    return img


SCENES = {
    'c01-print': (c01_print, 'OCT 15 2023', {'day': True, 'blur': 0.9, 'tint': (1.0, 0.97, 0.9)}),
    'c05-animal': (c05_animal, 'MAR 11 2021  17:04', {'blur': 1.6}),
    'c06-wake': (c06_wake, None, {'blur': 1.4, 'tint': (0.95, 0.99, 1.0)}),
    'c08-figure': (c08_figure, 'OCT 31 2020  01:58', {'blur': 1.0}),
    'c09-triangle': (c09_triangle, None, {'blur': 1.3, 'grain': 0.09}),
    'c10-capsule': (c10_capsule, None, {'blur': 1.5}),
    'c11-lights': (c11_lights, 'JAN 08 2026  19:12', {'blur': 0.9}),
    'c12-disc': (c12_disc, None, {'blur': 1.5, 'tint': (1.0, 1.0, 0.96)}),
    'c14-orbs': (c14_orbs, 'SEP 21 2023  21:20', {'blur': 1.2, 'grain': 0.09}),
    'c18-figure': (c18_figure, None, {'blur': 1.2, 'grain': 0.09}),
    'c19-light': (c19_light, None, {'blur': 1.3, 'grain': 0.09}),
    'c23-window': (c23_window, 'DEC 19 2021  15:02', {'blur': 1.0}),
    'c28-lodge': (c28_lodge, None, {'blur': 1.3, 'grain': 0.08}),
    'c29-circle': (c29_circle, 'JUN 20 2025  20:41', {'blur': 1.3}),
    'c30-ledger': (c30_ledger, None, {'blur': 1.0, 'grain': 0.05, 'vignette': 0.4}),
}


def main():
    os.makedirs(OUT, exist_ok=True)
    thumbs = []
    for i, (name, (fn, stamp, kw)) in enumerate(SCENES.items()):
        img = finish(fn(), seed=100 + i, stamp=stamp, **kw)
        path = os.path.join(OUT, name + '.png')
        img.save(path, optimize=True)
        thumbs.append((name, img.resize((320, 213))))
        print('wrote', name, os.path.getsize(path) // 1024, 'KB')
    # contact sheet for eyeballing (not used by the app)
    cols, rows = 5, 3
    sheet = Image.new('RGB', (cols * 324, rows * 232), (24, 24, 24))
    d = ImageDraw.Draw(sheet)
    for i, (name, t) in enumerate(thumbs):
        x, y = (i % cols) * 324 + 2, (i // cols) * 232 + 2
        sheet.paste(t, (x, y))
        d.text((x + 4, y + 216), name, fill=(220, 220, 220))
    sheet.save(os.path.join(OUT, '_contact-sheet.png'))
    print('contact sheet: seed/images/_contact-sheet.png')


if __name__ == '__main__':
    sys.exit(main())
