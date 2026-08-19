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

from pdfutil import (
    blocks,
    clean_text,
    content_rect,
    drawings_in,
    join_lines,
    line_text,
    upright_page,
)
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
            text = clean_text(line_text(line), keep_soft_hyphen=False)
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


def _ink_rect(page: "fitz.Page", clip: "fitz.Rect", pad: float = 10.0) -> "fitz.Rect":
    """
    Ytan inom clip som faktiskt har innehåll.

    Uppgifterna är satta i en smal spalt mitt på en A4-sida, så ett utsnitt av
    hela spaltbredden blir till hälften tomt papper. Vi beskär till det som är
    ritat eller skrivet i stället.
    """
    ink: fitz.Rect | None = None
    for b in page.get_text("dict", clip=clip)["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            r = fitz.Rect(line["bbox"])
            ink = r if ink is None else ink | r
    page_area = page.rect.width * page.rect.height
    for d in page.get_drawings():
        r = fitz.Rect(d["rect"])
        if not r.intersects(clip) or r.is_empty:
            continue
        if r.width * r.height > page_area * 0.8:
            continue  # sidans ram
        piece = r & clip
        ink = piece if ink is None else ink | piece
    if ink is None or ink.is_empty:
        return clip
    ink = fitz.Rect(ink.x0 - pad, ink.y0 - pad, ink.x1 + pad, ink.y1 + pad)
    return ink & clip


def _render(page: "fitz.Page", rect: "fitz.Rect", path: str) -> None:
    # Bilderna är rena funktioner av provhäftet och ändras aldrig. Att hoppa
    # över dem som redan finns tar bygget från tolv minuter till några sekunder
    # när man bara justerar textparsningen.
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return
    pix = page.get_pixmap(clip=rect, dpi=int(72 * RENDER_SCALE))
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=WEBP_QUALITY, method=6)
    with open(path, "wb") as f:
        f.write(buf.getvalue())


LETTERS = ["A", "B", "C", "D", "E"]


def _alt_lines(page: "fitz.Page", clip: "fitz.Rect") -> list[tuple[str, "fitz.Rect"]]:
    """Rader inom utsnittet som inleds med ett svarsalternativs bokstav."""
    found: list[tuple[str, fitz.Rect]] = []
    for b in page.get_text("dict", clip=clip)["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            text = clean_text(line_text(line), keep_soft_hyphen=False)
            m = re.match(r"^([A-E])\b", text)
            if m and line["bbox"][0] < page.rect.width * 0.55:
                found.append((m.group(1), fitz.Rect(line["bbox"])))
    found.sort(key=lambda t: t[1].y0)
    return found


def _alt_count(page: "fitz.Page", rect: "fitz.Rect") -> int:
    """Räknar svarsalternativ (A, B, C …) inom ett bildutsnitt."""
    letters = {letter for letter, _ in _alt_lines(page, rect)}
    # Ingen kvantitativ uppgift har färre än fyra alternativ. Hittar vi färre
    # står bokstaven inne i en figur (t.ex. fyra cirkeldiagram märkta A–D) och
    # kommer inte med i textlagret.
    return max(4, len(letters))


def _alt_sequence(page: "fitz.Page", clip: "fitz.Rect") -> list[tuple[str, "fitz.Rect"]]:
    """
    Svarsalternativen som A, B, C … uppifrån och ned.

    Alternativen står sist i uppgiften och alltid i bokstavsordning, så följden
    räknas från den *sista* raden som inleds med "A". Utan det kravet plockas ett
    "A" ur uppgiftstexten upp som första alternativ och hela beskärningen
    förskjuts ett steg.
    """
    cands = _alt_lines(page, clip)
    starts = [i for i, (letter, _) in enumerate(cands) if letter == "A"]
    if not starts:
        return []
    seq: list[tuple[str, fitz.Rect]] = []
    for letter, rect in cands[starts[-1] :]:
        if len(seq) < len(LETTERS) and letter == LETTERS[len(seq)]:
            seq.append((letter, rect))
    return seq if len(seq) >= 4 else []


def _text_start(page: "fitz.Page", line: "fitz.Rect", right: float) -> float:
    """
    x-läget där raden börjar *efter* sin inledande etikett.

    Kortet ritar sin egen bokstavsbricka och sitt eget uppgiftsnummer. Ligger de
    kvar i bilden visas de två gånger.

    Sökrutan måste sträckas ut till uppgiftens högerkant: bokstaven är ofta en
    egen textrad i PDF:en — "A" och "−12" sätts som skilda körningar — så radens
    egen bredd rymmer bara bokstaven. Med den som ruta hittas aldrig något andra
    ord, och etiketten blir kvar i utsnittet.
    """
    box = fitz.Rect(line.x0, line.y0, max(right, line.x1), line.y1)
    words = sorted(page.get_text("words", clip=box), key=lambda w: w[0])
    return words[1][0] if len(words) >= 2 else line.x0


def _stem_rect(page: "fitz.Page", clip: "fitz.Rect", first_alt_y: float) -> "fitz.Rect":
    """Uppgiftens stam: allt ovanför första alternativet, utan uppgiftsnumret."""
    region = fitz.Rect(clip.x0, clip.y0, clip.x1, first_alt_y - 2)
    ink = _ink_rect(page, region, pad=4)
    words = page.get_text("words", clip=region)
    if not words:
        return ink
    # Numret hänger ut till vänster om brödtexten, så det är alltid det ord som
    # står längst åt vänster. Att i stället ta det *översta* ordet fungerar inte:
    # en bråktäljare sätts högre än raden, så "1" i 1/3 kom före "16." och såg
    # självt ut som uppgiftsnumret — då uteblev trimningen tyst.
    lead = min(range(len(words)), key=lambda i: (words[i][0], words[i][1]))
    if not re.match(r"^\d{1,2}\.?$", words[lead][4]):
        return ink
    body = [w[0] for i, w in enumerate(words) if i != lead]
    if not body:
        return ink
    left = min(body)
    # Figurer kan gå längre vänster än brödtexten (NOG:s stugor, XYZ:s grafer).
    # De ska inte klippas bort tillsammans med numret.
    page_area = page.rect.width * page.rect.height
    for d in page.get_drawings():
        r = fitz.Rect(d["rect"])
        if r.is_empty or not r.intersects(region):
            continue
        # Sidans ram täcker hela uppslaget och skulle annars dra `left` ut till
        # papperskanten, så att nummertrimningen tyst blev verkningslös.
        if r.width * r.height > page_area * 0.8:
            continue
        if r.width * r.height < 12.0:
            continue
        if r.width > page.rect.width * 0.85 and r.height < 3:
            continue
        left = min(left, (r & region).x0)
    ink.x0 = max(ink.x0, min(left - 4, region.x1))
    return ink


def _norm(inner: "fitz.Rect", outer: "fitz.Rect") -> list[float] | None:
    """Delrektangel uttryckt som andelar 0–1 av den renderade bilden."""
    if outer.width <= 0 or outer.height <= 0:
        return None

    def f(v: float) -> float:
        return round(min(1.0, max(0.0, v)), 4)

    return [
        f((inner.x0 - outer.x0) / outer.width),
        f((inner.y0 - outer.y0) / outer.height),
        f((inner.x1 - outer.x0) / outer.width),
        f((inner.y1 - outer.y0) / outer.height),
    ]


def _crops(
    page: "fitz.Page",
    clip: "fitz.Rect",
    shot: "fitz.Rect",
    seq: list[tuple[str, "fitz.Rect"]],
) -> dict[str, list[float]] | None:
    """
    Var stammen och varje svarsalternativ sitter i bilden, som andelar av den.

    Med de här koordinaterna kan uppgiftskortet visa samma bild i flera rutor —
    stammen överst, ett alternativ i varje knapp — i stället för fyra tomma
    bokstavsknappar under ett utsnitt där alternativen redan står. Koordinater
    i stället för en egen bildfil per alternativ: det blir samma sak i
    gränssnittet, men utan att femdubbla antalet filer i public/.

    Returnerar None så fort något inte går ihop. Ett kort som visar hela
    utsnittet är sämre än ett med riktiga knappar, men mycket bättre än ett med
    felbeskurna.
    """
    if len(seq) < 4:
        return None
    stem = _stem_rect(page, clip, seq[0][1].y0)
    if stem.is_empty or stem.height < 8 or stem.width < 20:
        return None
    box = _norm(stem, shot)
    if box is None:
        return None
    out: dict[str, list[float]] = {"stem": box}
    for i, (letter, rect) in enumerate(seq):
        bottom = seq[i + 1][1].y0 - 2 if i + 1 < len(seq) else shot.y1
        r = fitz.Rect(_text_start(page, rect, clip.x1), rect.y0 - 2, shot.x1, bottom)
        if r.is_empty or r.height < 5 or r.width < 10:
            return None
        box = _norm(r, shot)
        if box is None:
            return None
        out[letter] = box
    return out


_SHRED_SINGLES = re.compile(r"(?:^|\s)[A-Za-z0-9](?:\s+[A-Za-z0-9]){2,}(?:\s|$)")
_SHRED_DOUBLE_OP = re.compile(r"[<>=+#](?:\s+[<>=+#])+")
_SHRED_HANGING = re.compile(r"=-(?:\s|$)|(?:^|\s)[<>=+]\s*(?:\(|$)")


def _shredded(text: str) -> bool:
    """
    Sant när PDF-extraktionen har strimlat matematiken i texten.

    Bråkstreck, exponenter och olikhetstecken sätts som egna textkörningar och
    kommer ut i läsordning i stället för formelordning: 'a b c d < < < .' var en
    gång 'a < b < c < d'. Sådan text går inte att läsa, och uppgiften ska då
    renderas som bildutsnitt precis som XYZ och KVA.

    Mönstren är avstämda mot hela arkivet: de träffar 14 av de 819 NOG/DTK som
    lagras som text, och ingen av de 2 400 verbala uppgifterna.
    """
    return bool(
        _SHRED_SINGLES.search(text)
        or _SHRED_DOUBLE_OP.search(text)
        or _SHRED_HANGING.search(text)
    )


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

    expected = 1
    for pno in range(1, len(doc)):
        page, _holder = upright_page(doc, pno)
        columns = _label_columns(page)
        rect = content_rect(page)

        # Uppgiftsnumren löper 1–40 genom hela häftet. Sifferetiketter i ett
        # diagram (skalstreck, radnummer) bryter mot den följden och sorteras
        # bort här — annars läses diagramsidan som en uppgiftssida.
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
            # Diagramuppslag till DTK — sparas som bild och kopplas till
            # uppgifterna på nästa sida.
            name = f"diagram-{len(figures) + 1}.webp"
            _render(page, _ink_rect(page, rect), os.path.join(image_dir, name))
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
                    and not _shredded(read["text"])
                    and not any(_shredded(a) for a in read["alternatives"].values())
                )
                # XYZ och KVA är formeltunga och renderas alltid som bild.
                # NOG/DTK tas som text när texten är komplett och uppgiften
                # inte har någon egen figur.
                if code in ("NOG", "DTK") and complete and not drawings_in(page, clip):
                    q["text"] = read["text"]
                    q["alternatives"] = read["alternatives"]
                else:
                    name = f"{nr}.webp"
                    shot = _ink_rect(page, clip)
                    _render(page, shot, os.path.join(image_dir, name))
                    q["image"] = f"{image_url}/{name}"
                    seq = _alt_sequence(page, clip)
                    q["altCount"] = max(4, len(seq)) if seq else _alt_count(page, clip)
                    crops = _crops(page, clip, shot, seq)
                    if crops:
                        q["crops"] = crops
                        # Bildens proportion behövs för att kortet ska kunna ge
                        # varje utsnitt rätt höjd innan bilden har laddats.
                        # Renderingen är likformig, så utsnittets proportion är
                        # bildens gånger kvoten mellan andelarna.
                        q["imageAspect"] = round(shot.width / shot.height, 4)
                    if read["text"]:
                        q["text"] = read["text"]  # för sökning och alt-text
                if code == "DTK" and pending_figure is not None:
                    q["figure"] = pending_figure
                questions[nr] = q

    return {"meta": meta, "questions": questions, "figures": figures}
