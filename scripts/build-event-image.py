#!/usr/bin/env python3
"""Ritar Event-bilderna för /hogskoleprovet-datum.

Kör: python3 scripts/build-event-image.py

Skriver tre filer i public/, samma motiv i Googles tre önskade bildformat:

    hp-event-16x9.png   1200x675
    hp-event-4x3.png    1200x900
    hp-event-1x1.png    1200x1200

Varför tre: Googles Event-dokumentation ber om flera bildformat och minst
1200 px bredd, och `image` var ett av fyra fält Search Console saknade på
sidan 2026-08-20. Filnamnen står i `HP_EVENT_IMAGES` i src/lib/hp-event.ts —
byter du namn här måste de med.

Motivet är medvetet **datumlöst**. En bild med "18 oktober 2026" tryckt i sig
hade blivit fel dagen efter provet, och Google cachar bilder länge.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

from brand_image import (
    APPLE,
    BARK,
    INK,
    PAPER,
    ROOT,
    SS,
    draw_badge,
    draw_centered,
    fit,
    load,
    measure,
)

W = 1200
SIZES = {
    "16x9": 675,
    "4x3": 900,
    "1x1": 1200,
}

TITLE = "Högskoleprovet"
TAGLINE = "Provdatum, nedräkning och anmälan"
RHYTHM = "Vårprov i april  ·  Höstprov i oktober"
FOOTER = "tvakommanollan.se"

# Textens maxbredd. Bilderna visas ofta små i ett sökresultat; marginalen är
# tilltagen så att titeln inte går ut i kanten när Google beskär i sidled.
TEXT_W = 880


def build(size_key: str, out: Path) -> None:
    h = SIZES[size_key]
    img = Image.new("RGB", (W * SS, h * SS), PAPER)
    d = ImageDraw.Draw(img)

    # Motivet växer med höjden i stället för att simma i mitten av den
    # kvadratiska varianten — men bara till en gräns, annars slår titeln i
    # TEXT_W och `fit` krymper tillbaka den, vilket ser ut som en bugg.
    scale = min(1.0 + (h - min(SIZES.values())) / 675 * 0.45, 1.30)

    def sz(px: int) -> int:
        return round(px * scale)

    f_title = fit(load, "serif", sz(78), TITLE, TEXT_W * SS)
    f_tag = fit(load, "sans", sz(30), TAGLINE, TEXT_W * SS)
    f_rhythm = fit(load, "sans_bold", sz(26), RHYTHM, TEXT_W * SS)
    f_foot = load("sans", sz(20))

    cx = (W // 2) * SS

    BADGE = sz(118)
    GAP_BADGE = sz(38)
    GAP_TITLE = sz(26)
    GAP_TAG = sz(38)
    GAP_RULE = sz(32)
    GAP_RHYTHM = sz(40)

    _, title_h = measure(d, TITLE, f_title)
    _, tag_h = measure(d, TAGLINE, f_tag)
    rhythm_w, rhythm_h = measure(d, RHYTHM, f_rhythm)
    _, foot_h = measure(d, FOOTER, f_foot)

    total = (
        BADGE * SS
        + GAP_BADGE * SS
        + title_h
        + GAP_TITLE * SS
        + tag_h
        + GAP_TAG * SS
        + SS  # linjen
        + GAP_RULE * SS
        + rhythm_h
        + GAP_RHYTHM * SS
        + foot_h
    )
    y = (h * SS - total) // 2

    y = draw_badge(d, cx, y, BADGE) + GAP_BADGE * SS
    y = draw_centered(d, TITLE, f_title, INK, cx, y) + GAP_TITLE * SS
    y = draw_centered(d, TAGLINE, f_tag, BARK, cx, y) + GAP_TAG * SS

    # Linjen är exakt lika bred som raden under den — se build-og-image.py.
    tint = tuple(round(p + (b - p) * 0.22) for p, b in zip(PAPER, BARK))
    d.rectangle([cx - rhythm_w // 2, y, cx + rhythm_w // 2, y + SS - 1], fill=tint)
    y += SS + GAP_RULE * SS

    y = draw_centered(d, RHYTHM, f_rhythm, APPLE, cx, y) + GAP_RHYTHM * SS
    draw_centered(d, FOOTER, f_foot, BARK, cx, y)

    # Band uppe och nere, lika höga. rectangle ritar inklusive slutkoordinaten.
    band = 9 * SS
    d.rectangle([0, 0, W * SS, band - 1], fill=APPLE)
    d.rectangle([0, h * SS - band, W * SS, h * SS - 1], fill=APPLE)

    img = img.resize((W, h), Image.LANCZOS)
    img.save(out, "PNG", optimize=True)
    print(f"skrev {out.name} ({W}x{h}, {out.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--outdir", default="public")
    args = ap.parse_args()
    outdir = ROOT / args.outdir
    for key in SIZES:
        build(key, outdir / f"hp-event-{key}.png")
