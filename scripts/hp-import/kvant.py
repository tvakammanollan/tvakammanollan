"""
Parsar ett kvantitativt provpass (XYZ, KVA, NOG, DTK).

Matematiken går inte att extrahera som text: bråkstreck, exponenter och rotur
sätts som separata textkörningar och kommer ut som '3 27 x 2 =' ur PDF:en. XYZ
och KVA renderas därför som skarpa bildutsnitt av uppgiftens yta i häftet —
samma bild eleven ser på provdagen — medan NOG och DTK, som är ren löptext,
läses som text. DTK-uppgifterna hör dessutom ihop med ett diagramuppslag som
sparas som en egen bild.

Uppgifter i NOG/DTK som ändå innehåller figurer faller tillbaka på bildutsnitt.
"""

from __future__ import annotations

import io
import os
import re

import fitz
from PIL import Image

from pdfutil import blocks, clean_text, content_rect, drawings_in, join_lines, upright_page
from verbal import (
    _alt_text,
    _is_alt,
    _is_question,
    _merge_split_labels,
    _question_text,
    parse_cover,
    section_for,
)

# 2x ger läsbar text även på hidpi-skärmar utan att filerna blir tunga.
RENDER_SCALE = 2.0
WEBP_QUALITY = 82

LABEL_RE = re.compile(r"^(\d{1,2})\s*\.")


def _rising(found: list[tuple[int, float, float]]) -> list[tuple[int, float, float]]:
    """
    Längsta stigande följden av uppgiftsnummer. Ett '0.' ur ett tal i en formel
    kan se ut som ett uppgiftsnummer; följdkravet sållar bort det.
    """
    best: list[tuple[int, float, float]] = []
    for i in range(len(found)):
        seq = [found[i]]
        for cand in found[i + 1 :]:
            if cand[0] > seq[-1][0]:
                seq.append(cand)
        if len(seq) > len(best):
            best = seq
    return best


def _label_columns(page: "fitz.Page") -> list[list[tuple[int, float, float]]]:
    """
    Uppgiftsnumren grupperade i spalter → [[(nr, x, y), …], …].

    De stående sidorna har en spalt; DTK:s liggande uppgiftssidor har två, och
    då måste både uppgiftsordningen och bildutsnitten hållas isär per spalt.
    """
    found: list[tuple[int, float, float]] = []
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            if not line["spans"]:
                continue
            text = clean_text("".join(s["text"] for s in line["spans"]), keep_soft_hyphen=False)
            m = LABEL_RE.match(text)
            if not m:
                continue
            nr = int(m.group(1))
            if 1 <= nr <= 40:
                found.append((nr, line["bbox"][0], line["bbox"][1]))
    if not found:
        return []

    # Uppgiftsnumren står alltid i vänsterkanten av sin spalt; allt annat som
    # råkar börja med en siffra ligger indraget och sorteras bort.
    xs = sorted(x for _, x, _ in found)
    left = xs[0]
    found = [f for f in found if f[1] < left + 8 or f[1] > page.rect.width * 0.4]

    columns: list[list[tuple[int, float, float]]] = []
    for f in sorted(found, key=lambda t: (t[1], t[2])):
        if columns and f[1] - columns[-1][0][1] < 100:
            columns[-1].append(f)
        else:
            columns.append([f])
    return [_rising(sorted(col, key=lambda t: t[2])) for col in columns]


def _render(page: "fitz.Page", rect: "fitz.Rect", path: str) -> None:
    pix = page.get_pixmap(clip=rect, dpi=int(72 * RENDER_SCALE))
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=WEBP_QUALITY, method=6)
    with open(path, "wb") as f:
        f.write(buf.getvalue())


def _alt_count(page: "fitz.Page", rect: "fitz.Rect") -> int:
    """Räknar svarsalternativ (A, B, C …) inom ett bildutsnitt."""
    letters = set()
    for b in page.get_text("dict", clip=rect)["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            text = clean_text("".join(s["text"] for s in line["spans"]), keep_soft_hyphen=False)
            m = re.match(r"^([A-E])\b", text)
            if m and line["bbox"][0] < page.rect.width * 0.55:
                letters.add(m.group(1))
    return len(letters) if letters else 4


def _read_question(page: "fitz.Page", clip: "fitz.Rect") -> dict:
    """
    Läser en uppgift som text ur sitt eget utsnitt. Att klippa per uppgift i
    stället för per sida håller isär spalterna på de liggande DTK-sidorna.
    """
    zone = _merge_split_labels(
        sorted(blocks(page, clip), key=lambda b: (round(b.y0, 1), b.x0))
    )
    out = {"text": "", "alternatives": {}}
    for b in zone:
        if _is_question(b) is not None and not out["text"]:
            out["text"] = _question_text(b)
            continue
        letter = _is_alt(b)
        if letter:
            out["alternatives"][letter] = _alt_text(b)
        elif out["text"] and not out["alternatives"]:
            out["text"] = join_lines([out["text"], b.text])
    return out


def parse_kvant(path: str, image_dir: str, image_url: str) -> dict:
    doc = fitz.open(path)
    meta = parse_cover(doc[0])
    sections = meta["sections"]

    questions: dict[int, dict] = {}
    figures: list[dict] = []
    pending_figure: int | None = None  # diagramsida som väntar på sina uppgifter

    for pno in range(1, len(doc)):
        page, _holder = upright_page(doc, pno)
        columns = _label_columns(page)
        rect = content_rect(page)

        if not columns:
            # Diagramuppslag till DTK — sparas som bild och kopplas till
            # uppgifterna på nästa sida.
            name = f"diagram-{len(figures) + 1}.webp"
            _render(page, rect, os.path.join(image_dir, name))
            figures.append({"src": f"{image_url}/{name}", "page": pno})
            pending_figure = len(figures) - 1
            continue

        for ci, column in enumerate(columns):
            x0 = max(rect.x0, column[0][1] - 14)
            x1 = columns[ci + 1][0][1] - 14 if ci + 1 < len(columns) else rect.x1
            for i, (nr, _x, y) in enumerate(column):
                code = section_for(nr, sections)
                top = max(rect.y0, y - 12)
                bottom = column[i + 1][2] - 14 if i + 1 < len(column) else rect.y1
                clip = fitz.Rect(x0, top, x1, bottom)

                q: dict = {"nr": nr, "delprov": code}
                read = _read_question(page, clip)
                complete = (
                    read["text"]
                    and len(read["alternatives"]) >= 4
                    and all(read["alternatives"].values())
                )
                # XYZ och KVA är formeltunga och renderas alltid som bild.
                # NOG/DTK tas som text när texten är komplett och uppgiften
                # inte har någon egen figur.
                if code in ("NOG", "DTK") and complete and not drawings_in(page, clip):
                    q["text"] = read["text"]
                    q["alternatives"] = read["alternatives"]
                else:
                    name = f"{nr}.webp"
                    _render(page, clip, os.path.join(image_dir, name))
                    q["image"] = f"{image_url}/{name}"
                    q["altCount"] = _alt_count(page, clip)
                    if read["text"]:
                        q["text"] = read["text"]  # för sökning och alt-text
                if code == "DTK" and pending_figure is not None:
                    q["figure"] = pending_figure
                questions[nr] = q

    return {"meta": meta, "questions": questions, "figures": figures}
