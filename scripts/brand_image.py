"""Gemensamma byggstenar för sajtens ritade PNG:er.

Delas av `build-og-image.py` (delningsbilden) och `build-event-image.py`
(Event-bilderna på /hogskoleprovet-datum). Låg tidigare bara i
`build-og-image.py`; att kopiera dem hade betytt två paletter och två
märken som glider isär vid nästa ommålning.

Typsnitten ligger i public/fonts/, med git-historiken som reserv — se
`font_path`.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent

# Paletten från src/styles.css. Podia-systemet sedan 2026-10-26; namnen är
# kvar från Lunden så att kompositionen i de två rit-scripten inte behöver
# röras, men värdena är de nya. Läs APPLE som "märkets fyllning", inte som
# en färg: Podias primära fyllning är bläck på papper, inte rött.
PAPER = (245, 245, 245)  # --navy   Fog, underlaget
INK = (6, 4, 14)  # --cream  Ink, texten
APPLE = (6, 4, 14)  # --amber  Ink, märket och primära ytor
BARK = (69, 38, 35)  # --teal   Graphite, sekundär text
LEAF = (47, 107, 60)  # --success oförändrad, framsteg

# Dekoraccenten. Terracotta är en YTA och klarar varken 3:1 mot Fog eller vit
# text, så den får bära former och fält men aldrig en bokstav i bilderna.
TERRACOTTA = (227, 154, 77)

SS = 2  # supersampling — ritas i 2x och skalas ned, annars fransar texten

# Sedan Podia-bytet är systemet enfamiljs: samma snitt bär allt. Alla tre
# rollerna pekar därför på samma variabla Manrope, med olika vikt.
#
# Filen ligger i scripts/fonts/ och inte i public/fonts/, därför att webben
# bara ska ladda woff2:an — en TTF på 165 kB i public hade serverats till
# ingen nytta. Pillow läser inte woff2, därav TTF:en här.
FONT_COMMIT = "189d203"
FONT_CACHE = ROOT / ".og-cache"
MANROPE = "Manrope[wght].ttf"
FONTS = {
    "serif": (MANROPE, "Bold"),
    "sans": (MANROPE, "Regular"),
    "sans_bold": (MANROPE, "Bold"),
}


def font_path(name: str) -> Path:
    """Typsnittsfilen ur scripts/fonts, annars public/fonts, annars historiken."""
    bundled = ROOT / "scripts" / "fonts" / name
    if bundled.exists():
        return bundled
    live = ROOT / "public" / "fonts" / name
    if live.exists():
        return live
    cached = FONT_CACHE / name
    if not cached.exists():
        FONT_CACHE.mkdir(exist_ok=True)
        try:
            blob = subprocess.run(
                ["git", "show", f"{FONT_COMMIT}:public/fonts/{name}"],
                cwd=ROOT,
                check=True,
                capture_output=True,
            ).stdout
        except subprocess.CalledProcessError:
            sys.exit(f"Hittar inte {name} — varken i public/fonts/ eller i {FONT_COMMIT}.")
        cached.write_bytes(blob)
    return cached


def load(kind: str, size: int) -> ImageFont.FreeTypeFont:
    name, vikt = FONTS[kind]
    font = ImageFont.truetype(str(font_path(name)), size * SS)
    # Variabel font: utan det här ritas allt i Regular och rubrikerna tappar
    # sin tyngd, vilket inte syns som ett fel någonstans — bilden blir bara
    # blekare än sajten.
    try:
        font.set_variation_by_name(vikt)
    except OSError:
        pass
    return font


def fit(loader, kind, size: int, text: str, max_w: int) -> ImageFont.FreeTypeFont:
    """Största gradtal <= size där texten ryms i max_w."""
    probe = Image.new("RGB", (1, 1))
    d = ImageDraw.Draw(probe)
    while size > 8:
        font = loader(kind, size)
        x0, _, x1, _ = d.textbbox((0, 0), text, font=font)
        if x1 - x0 <= max_w:
            return font
        size -= 1
    return loader(kind, size)


def ink_box(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont):
    """Textens faktiska bläckyta, inte fontens radmått.

    Centrering på radmåtten ser skev ut: 'Tvåkommanollan' har ringen över å
    men inget som går under baslinjen, så fontens box har luft i underkant
    som bläcket inte fyller.
    """
    return draw.textbbox((0, 0), text, font=font)


def draw_centered(draw, text, font, fill, cx: int, top: int) -> int:
    """Ritar texten optiskt centrerad kring cx med bläckets överkant på top.

    Returnerar bläckets underkant, så anroparen kan stapla med sanna mellanrum
    i stället för mellanrum som beror på fontens radhöjd.
    """
    x0, y0, x1, y1 = ink_box(draw, text, font)
    draw.text((cx - (x0 + x1) / 2, top - y0), text, font=font, fill=fill)
    return top + (y1 - y0)


def measure(draw, text, font) -> tuple[int, int]:
    x0, y0, x1, y1 = ink_box(draw, text, font)
    return x1 - x0, y1 - y0


def draw_badge(draw: ImageDraw.ImageDraw, cx: int, top: int, size_px: int) -> int:
    """Märket: talet 2,0 i en rundad ruta, samma form som favicon.svg.

    `size_px` är rutans sida i slutliga pixlar (multipliceras med SS här).
    Returnerar rutans underkant i ritkoordinater.
    """
    bs = size_px * SS
    bx = cx - bs // 2
    draw.rounded_rectangle(
        [bx, top, bx + bs, top + bs],
        radius=int(bs * 7 / 32),  # samma förhållande som favicon.svg
        fill=APPLE,
    )
    # "2,0" optiskt centrerat i rutan — inte på fontens box, kommat hänger
    # under baslinjen och drar annars talet uppåt.
    font = load("serif", round(size_px * 52 / 124))
    x0, y0, x1, y1 = ink_box(draw, "2,0", font)
    draw.text(
        (cx - (x0 + x1) / 2, top + bs / 2 - (y0 + y1) / 2),
        "2,0",
        font=font,
        fill=PAPER,
    )
    return top + bs
