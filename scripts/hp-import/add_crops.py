"""
Lägger beskärningskoordinater på de kvantitativa uppgifterna i ett redan byggt
arkiv — utan att bygga om det.

`build.py` raderar allt i `src/data/prov/` och bygger från cachen. Det fungerar
bara med en *komplett* cache, och den går inte att återskapa: ELF-häftena från
flera terminer finns inte kvar hos UHR utan har hämtats för hand och matats in
med `adopt_elf.py` (se CLAUDE.md). En full ombyggnad tappar därför ELF ur varje
prov och skriver ett fattigare arkiv än det som ligger i git.

Det här skriptet rör bara två fält, och bara på uppgifter som redan är bilder:

  crops        var stammen och varje svarsalternativ sitter i bilden
  imageAspect  bildens proportion, så kortet kan ge utsnitten rätt höjd

Dessutom flyttas de NOG/DTK-uppgifter vars text visat sig vara sönderskuren av
PDF-extraktionen över till bildläge — samma bedömning som `kvant.py` numera gör
när arkivet byggs från grunden.

    python add_crops.py           # torrkörning, skriver ingenting
    python add_crops.py --apply
"""

from __future__ import annotations

import json
import os
import sys

import fitz

from kvant import (
    _alt_sequence,
    _crops,
    _ink_rect,
    _label_columns,
    _read_question,
    _render,
    _shredded,
)
from pdfutil import content_rect, upright_page
from verbal import parse_cover, section_for

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CACHE = os.path.join(ROOT, ".hp-cache")
DATA = os.path.join(ROOT, "src", "data", "prov")
IMG = os.path.join(ROOT, "public", "prov-bilder")


def parse_pass(pdf: str, image_dir: str, image_url: str) -> dict[int, dict]:
    """
    Samma genomgång som `kvant.parse_kvant`, men returnerar bara det vi behöver
    per uppgift: beskärningar, proportion och om texten är oläslig.
    """
    doc = fitz.open(pdf)
    meta = parse_cover(doc[0])
    sections = meta["sections"]

    out: dict[int, dict] = {}
    expected = 1
    for pno in range(1, len(doc)):
        page, _holder = upright_page(doc, pno)
        columns = _label_columns(page)
        rect = content_rect(page)

        kept: list[list[tuple[int, float, float]]] = []
        for column in columns:
            valid = []
            for nr, x, y in column:
                if expected <= nr <= expected + 2:
                    valid.append((nr, x, y))
                    expected = nr + 1
            if valid:
                kept.append(valid)
        columns = kept
        if not columns:
            continue

        for ci, column in enumerate(columns):
            x0 = max(rect.x0, column[0][1] - 14)
            x1 = columns[ci + 1][0][1] - 14 if ci + 1 < len(columns) else rect.x1
            for i, (nr, _x, y) in enumerate(column):
                code = section_for(nr, sections)
                top = max(rect.y0, y - 12)
                bottom = column[i + 1][2] - 14 if i + 1 < len(column) else rect.y1
                clip = fitz.Rect(x0, top, x1, bottom)

                shot = _ink_rect(page, clip)
                seq = _alt_sequence(page, clip)
                crops = _crops(page, clip, shot, seq)
                read = _read_question(page, clip)
                alts = read["alternatives"]
                shredded = bool(read["text"]) and (
                    _shredded(read["text"]) or any(_shredded(a) for a in alts.values())
                )
                out[nr] = {
                    "delprov": code,
                    "crops": crops,
                    "aspect": round(shot.width / shot.height, 4),
                    "shredded": shredded,
                    "altCount": max(4, len(seq)) if seq else None,
                    "page": page,
                    "shot": shot,
                }
    return out


def main() -> int:
    apply = "--apply" in sys.argv
    files = sorted(f for f in os.listdir(DATA) if f[0].isdigit() and f.endswith(".json"))

    tot_crops = 0
    tot_shred = 0
    changed_files = 0
    missing: list[str] = []

    for name in files:
        path = os.path.join(DATA, name)
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if data.get("kind") != "kvant":
            continue

        term, passno = data["term"], data["pass"]
        pdf = os.path.join(CACHE, term, f"pass{passno}-kvant.pdf")
        if not os.path.exists(pdf):
            missing.append(f"{term}-{passno}")
            continue

        image_dir = os.path.join(IMG, term, f"p{passno}")
        image_url = f"/prov-bilder/{term}/p{passno}"
        try:
            fresh = parse_pass(pdf, image_dir, image_url)
        except Exception as e:  # noqa: BLE001
            print(f"  !! {term}-{passno}: {e}")
            continue

        n_crops = 0
        n_shred = 0
        for q in data["questions"]:
            info = fresh.get(q["nr"])
            if not info:
                continue

            # 1. Sönderskuren text -> bild. Uppgiften finns redan renderad om
            #    build.py hunnit skriva den; annars renderas den här.
            if not q.get("image") and info["shredded"] and q["delprov"] in ("NOG", "DTK"):
                fname = f"{q['nr']}.webp"
                if apply:
                    _render(info["page"], info["shot"], os.path.join(image_dir, fname))
                q.pop("alternatives", None)
                q["image"] = f"{image_url}/{fname}"
                q["altCount"] = info["altCount"] or 5
                n_shred += 1

            # 2. Beskärningar på bilduppgifter.
            if q.get("image") and info["crops"]:
                q["crops"] = info["crops"]
                q["imageAspect"] = info["aspect"]
                n_crops += 1

        if n_crops or n_shred:
            changed_files += 1
            tot_crops += n_crops
            tot_shred += n_shred
            print(f"  {name:16s} crops: {n_crops:3d}   text->bild: {n_shred}")
            if apply:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    print()
    print(f"filer ändrade : {changed_files}")
    print(f"crops satta   : {tot_crops}")
    print(f"text -> bild   : {tot_shred}")
    if missing:
        print(f"PDF saknas    : {', '.join(missing)}")
    if not apply:
        print("\nTORRKÖRNING — inget skrevs. Kör med --apply.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
