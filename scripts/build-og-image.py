#!/usr/bin/env python3
"""Ritar delningsbilden (Open Graph / Twitter card).

Kör: python3 scripts/build-og-image.py          # skriver public/og-image-4.png
     python3 scripts/build-og-image.py --out X  # annat filnamn

Bilden fanns tidigare bara som en PNG utan källa, vilket betydde att varje
ändring var en ommålning för hand — och att domänraden i nederkanten en gång
blev kvar med fel domän. Nu är den här filen källan.

VIKTIGT: byt *filnamn* när motivet ändras, inte bara innehållet. Snapchat,
Facebook, LinkedIn och Slack cachar förhandsbilden på URL:en i månader. Nästa
gång blir det og-image-5.png, och då följer fyra ställen med:
  src/routes/__root.tsx  (og:image + twitter:image)
  src/lib/guider-meta.tsx
  public/manifest.json
  kommentaren i src/lib/page-meta.ts

Kompositionen är centrerad, inte vänsterställd. Skälet är inte smak: WhatsApp,
iMessage och Discord visar ofta en kvadratisk beskärning av 1200x630, och i den
föll den gamla bildens märke och statistikrad utanför kanten. Allt viktigt
ligger därför innanför den centrerade kvadraten (x 285-915).
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

from brand_image import (
    APPLE,
    BARK,
    INK,
    LEAF,
    PAPER,
    ROOT,
    SS,
    draw_badge,
    draw_centered,
    fit,
    ink_box,
    load,
    measure,
)

W, H = 1200, 630
# Den centrerade kvadraten som kvadratiska förhandsvisningar beskär till.
SQUARE_SAFE = 620
FOOTER = "Gratis  ·  inga annonser  ·  tvakommanollan.se"


def build(out: Path) -> None:
    img = Image.new("RGB", (W * SS, H * SS), PAPER)
    d = ImageDraw.Draw(img)

    # Ordmärket skalas ned tills bläcket ryms i den centrerade kvadraten.
    # WhatsApp och iMessage beskär 1200x630 till en kvadrat mitt i bilden
    # (x 285-915); ett ordmärke som är bredare får T och n avhuggna där.
    f_word = fit(load, "serif", 74, "Tvåkommanollan", SQUARE_SAFE * SS)
    f_tag = load("sans", 29)
    f_stat = load("sans_bold", 38)
    f_label = load("sans", 18)
    f_foot = load("sans", 20)

    cx = (W // 2) * SS

    # --- mått på blocket, för att kunna centrera det lodrätt --------------
    BADGE = 124
    GAP_BADGE = 36
    GAP_WORD = 28
    GAP_TAG = 42
    GAP_RULE = 40
    GAP_STATS = 44
    STAT_GAP = 12

    _, word_h = measure(d, "Tvåkommanollan", f_word)
    _, tag_h = measure(d, "Plugga tills det sitter.", f_tag)
    _, foot_h = measure(d, FOOTER, f_foot)

    # Varje kolumn får sin egen bredd och jämna mellanrum, och gruppen centreras
    # på summan. Jämnt fördelade kolumnmitter ser skevt ut i stället: "10 000+"
    # är tre gånger bredare än "8", så radens bläck hamnade 16 px vänster om
    # bildens mitt medan varje kolumn för sig var perfekt centrerad.
    stats = [
        ("10 000+", "ord med facit", LEAF),
        ("30", "gamla prov", INK),
        ("8", "delprov", APPLE),
        ("ELO", "i realtid", BARK),
    ]
    COL_GAP = 78 * SS
    # Mät på de strängar som faktiskt ritas: "gamla prov" har en stapel under
    # baslinjen som "ord med facit" saknar.
    stat_h = max(measure(d, big, f_stat)[1] for big, _, _ in stats)
    label_h = max(measure(d, label, f_label)[1] for _, label, _ in stats)
    widths = [
        max(measure(d, big, f_stat)[0], measure(d, label, f_label)[0])
        for big, label, _ in stats
    ]
    row_w = sum(widths) + COL_GAP * (len(stats) - 1)

    total = (
        BADGE * SS
        + GAP_BADGE * SS
        + word_h
        + GAP_WORD * SS
        + tag_h
        + GAP_TAG * SS
        + SS  # linjen
        + GAP_RULE * SS
        + stat_h
        + STAT_GAP * SS
        + label_h
        + GAP_STATS * SS
        + foot_h
    )
    y = (H * SS - total) // 2

    # --- märket: samma rundade kvadrat som faviconen och navbaren ---------
    y = draw_badge(d, cx, y, BADGE) + GAP_BADGE * SS

    # --- ordmärket --------------------------------------------------------
    y = draw_centered(d, "Tvåkommanollan", f_word, INK, cx, y) + GAP_WORD * SS
    y = draw_centered(d, "Plugga tills det sitter.", f_tag, BARK, cx, y) + GAP_TAG * SS

    # --- avdelare ---------------------------------------------------------
    # Linjen är exakt lika bred som statistikraden nedanför. En linje som är
    # nästan men inte riktigt lika bred som innehållet den avdelar läses som
    # ett slarvfel; antingen ska den följa innehållet eller vara tydligt kort.
    tint = tuple(round(p + (b - p) * 0.22) for p, b in zip(PAPER, BARK))
    d.rectangle([cx - row_w // 2, y, cx + row_w // 2, y + SS - 1], fill=tint)
    y += SS + GAP_RULE * SS

    # --- statistikraden ---------------------------------------------------
    x = cx - row_w // 2
    for (big, label, colour), w in zip(stats, widths):
        col = x + w // 2
        bottom = draw_centered(d, big, f_stat, colour, col, y)
        draw_centered(d, label, f_label, BARK, col, bottom + STAT_GAP * SS)
        x += w + COL_GAP
    y += stat_h + STAT_GAP * SS + label_h + GAP_STATS * SS

    # --- foten ------------------------------------------------------------
    # Domänen står i bildens pixlar. Byts domänen måste den här raden med.
    draw_centered(d, FOOTER, f_foot, BARK, cx, y)

    # --- ramen ------------------------------------------------------------
    # Band uppe och nere, lika höga, så beskärningen till 2:1 (Twitter) tar
    # lika mycket från båda hållen.
    band = 9 * SS
    # rectangle ritar inklusive slutkoordinaten: [0, 0, w, band] blir band + 1
    # rader, och det övre bandet kom ut en pixel tjockare än det undre.
    d.rectangle([0, 0, W * SS, band - 1], fill=APPLE)
    d.rectangle([0, H * SS - band, W * SS, H * SS - 1], fill=APPLE)

    img = img.resize((W, H), Image.LANCZOS)
    img.save(out, "PNG", optimize=True)
    print(f"skrev {out.relative_to(ROOT)} ({out.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public/og-image-4.png")
    args = ap.parse_args()
    build(ROOT / args.out)
