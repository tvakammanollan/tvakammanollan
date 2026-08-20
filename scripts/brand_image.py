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

# Paletten från src/styles.css (Lunden-temat, alltid ljust).
PAPER = (251, 246, 236)  # --navy   "underlaget"
INK = (46, 30, 20)  # --cream  "texten"
APPLE = (174, 47, 38)  # --amber  handling
BARK = (122, 82, 54)  # --teal   struktur
LEAF = (47, 107, 60)  # --success framsteg

SS = 2  # supersampling — ritas i 2x och skalas ned, annars fransar texten

# Typsnitten ligger inte alltid i public/fonts (borttagna i revert 98d852a,
# återställda 2026-08-19), men finns kvar i historiken.
FONT_COMMIT = "189d203"
FONT_CACHE = ROOT / ".og-cache"
FONTS = {
    "serif": "YoungSerif-Regular.ttf",
    "sans": "InstrumentSans-Regular.ttf",
    "sans_bold": "InstrumentSans-Bold.ttf",
}


def font_path(name: str) -> Path:
    """Typsnittsfilen ur public/fonts, annars ur git-historiken."""
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
    return ImageFont.truetype(str(font_path(FONTS[kind])), size * SS)


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
