"""
Parsar ett verbalt provpass (ORD, LÄS, MEK) till frågor + lästexter.

ELF finns aldrig i UHR:s publicerade häften — den engelska texten plockas bort
en vecka efter provdagen av upphovsrättsskäl, och filerna heter därför
'...-utan-elf.pdf'. Ett verbalt pass ger alltså 30 av 40 uppgifter.

Sidlayouten är tvåspaltig och PDF:ens blockordning är opålitlig, så allt sorteras
om geometriskt. På en LÄS-sida ligger dessutom lästexten ovanför uppgifterna i
båda spalterna, vilket gör att ren spaltsortering blandar ihop text och frågor —
därför delas sidan först i en textzon och en uppgiftszon.
"""

from __future__ import annotations

import re

import fitz

from pdfutil import Block, blocks, clean_text, column_sorted, join_lines

QUESTION_RE = re.compile(r"^(\d{1,2})\s*[.)]\s*(.*)$", re.S)
ALT_RE = re.compile(r"^([A-E])\b\s*(.*)$", re.S)

SECTION_HEADINGS = re.compile(
    r"^(ORD|LÄS|MEK|ELF|XYZ|KVA|NOG|DTK)\b.*$|^(Svensk läsförståelse|Engelsk läsförståelse|"
    r"Ordförståelse|Meningskomplettering|Diagram, tabeller och kartor|"
    r"Kvantitativa (jämförelser|resonemang)|Matematisk problemlösning)\b.*$",
    re.I,
)
UPPGIFTER_RE = re.compile(r"^uppgifter\s*$", re.I)


# Provets uppbyggnad har varit densamma i alla häften sedan 2011 och står på
# varje framsida. Tabellen läses ändå ur häftet — men i fyra av 108 provpass
# kommer cellerna i en ordning som inte går att läsa radvis, och då används den
# här uppställningen i stället.
CANONICAL_SECTIONS = {
    "verbal": [
        {"code": "ORD", "count": 10, "first": 1, "last": 10, "minutes": 3},
        {"code": "LÄS", "count": 10, "first": 11, "last": 20, "minutes": 22},
        {"code": "MEK", "count": 10, "first": 21, "last": 30, "minutes": 8},
        {"code": "ELF", "count": 10, "first": 31, "last": 40, "minutes": 22},
    ],
    "kvant": [
        {"code": "XYZ", "count": 12, "first": 1, "last": 12, "minutes": 12},
        {"code": "KVA", "count": 10, "first": 13, "last": 22, "minutes": 10},
        {"code": "NOG", "count": 6, "first": 23, "last": 28, "minutes": 10},
        {"code": "DTK", "count": 12, "first": 29, "last": 40, "minutes": 23},
    ],
}


def parse_cover(page: "fitz.Page") -> dict:
    """Framsidans tabell: delprov, uppgiftsintervall och rekommenderad tid."""
    flat = re.sub(r"\s*\n\s*", " ", page.get_text())
    sections = [
        {"code": code, "count": int(n), "first": int(a), "last": int(b), "minutes": int(m)}
        for code, n, a, b, m in re.findall(
            r"(ORD|LÄS|MEK|ELF|XYZ|KVA|NOG|DTK)\s+(\d+)\s+(\d+)\s*[–-]\s*(\d+)\s+(\d+)\s*min",
            flat,
        )
    ]
    tid = re.search(r"[Pp]rovtiden är (\d+)\s*min", flat)
    total = re.search(r"innehåller (\d+) uppgifter", flat)
    count = int(total.group(1)) if total else 40

    covered = {n for s in sections for n in range(s["first"], s["last"] + 1)}
    if covered != set(range(1, count + 1)):
        kind = "kvant" if re.search(r"Kvantitativ del", flat) else "verbal"
        sections = [dict(s) for s in CANONICAL_SECTIONS[kind]]

    return {
        "sections": sections,
        "minutes": int(tid.group(1)) if tid else 55,
        "total": count,
    }


def section_for(nr: int, sections: list[dict]) -> str | None:
    for s in sections:
        if s["first"] <= nr <= s["last"]:
            return s["code"]
    return None


def _lines(b: Block) -> list[str]:
    """
    Blockets rader utan inledande tomrader (PDF:en har gott om sådana).

    Tiotalssiffran i uppgiftsnumret sätts ibland som en egen rad
    ('3' + '0. I tarmslemhinnan …'), så den fogas ihop igen.
    """
    out = [x for x in b.lines]
    while out and not out[0].strip():
        out.pop(0)
    if len(out) >= 2 and re.fullmatch(r"\d", out[0].strip()) and re.match(r"^\d[.)]", out[1].strip()):
        out = [out[0].strip() + out[1].strip()] + out[2:]
    return out


def _is_question(b: Block) -> int | None:
    lines = _lines(b)
    m = QUESTION_RE.match(lines[0].strip()) if lines else None
    if not m:
        return None
    nr = int(m.group(1))
    return nr if 1 <= nr <= 40 else None


def _is_alt(b: Block) -> str | None:
    lines = _lines(b)
    first = lines[0].strip() if lines else ""
    if re.fullmatch(r"[A-E]", first):
        return first
    m = re.match(r"^([A-E])\s+\S", first)
    return m.group(1) if m else None


def _question_text(b: Block) -> str:
    lines = _lines(b)
    m = QUESTION_RE.match(lines[0].strip())
    lines[0] = m.group(2) if m else lines[0]
    return join_lines(lines)


def _alt_text(b: Block) -> str:
    lines = _lines(b)
    first = lines[0].strip()
    if re.fullmatch(r"[A-E]", first):
        lines = lines[1:]
    else:
        lines[0] = re.sub(r"^[A-E]\s+", "", first)
    return join_lines(lines)


def _merge_split_labels(bs: list[Block]) -> list[Block]:
    """
    Vissa år sätts svarsbokstaven som ett eget textblock och alternativets text
    som ett annat block till höger på samma rad (2023ht, 2021ht). Slår ihop dem
    innan uppgifterna byggs, annars blir alternativen tomma och texten hamnar i
    frågan i stället.
    """
    labels = [i for i, b in enumerate(bs) if _is_alt(b) and not _alt_text(b)]
    if not labels:
        return bs
    used: set[int] = set()
    for i in labels:
        lab = bs[i]
        best, bestx = None, 1e9
        for j, b in enumerate(bs):
            if j == i or j in used or _is_alt(b) or _is_question(b) is not None:
                continue
            if b.x0 <= lab.x0 or abs(b.y0 - lab.y0) > 6 or b.x0 - lab.bbox[2] > 40:
                continue
            if b.x0 < bestx:
                best, bestx = j, b.x0
        if best is not None:
            used.add(best)
            bs[i] = Block(
                lab.bbox,
                _lines(lab) + _lines(bs[best]),
                lab.sizes + bs[best].sizes,
                lab.fonts + bs[best].fonts,
            )
    return [b for j, b in enumerate(bs) if j not in used]


GLOSS_RE = re.compile(r"^[^.!?]{1,60} = ")


def _passage_piece(
    b: Block, page_width: float, page_height: float, body_size: float
) -> tuple[str, str] | None:
    """Klassar ett block i lästextzonen → (typ, text) eller None om det ska bort."""
    text = b.text
    if not text or UPPGIFTER_RE.match(text) or SECTION_HEADINGS.match(text):
        return None
    # Ordförklaringar sätts som 'term = förklaring' i en ruta under texten.
    # De har ibland bara en enda post och är då lika korta och feta som en
    # rubrik — därför testas de först.
    if GLOSS_RE.match(text):
        # Varje post börjar på en ny rad med 'term = '; raderna däremellan är
        # fortsättningen på föregående förklaring.
        entries: list[list[str]] = []
        for raw in b.lines:
            if not raw.strip():
                continue
            if " = " in raw or not entries:
                entries.append([raw])
            else:
                entries[-1].append(raw)
        return "gloss", "\n".join(join_lines(e) for e in entries)
    # Källa/författare: kort, ensam rad, högerställd.
    if (
        len(b.lines) <= 2
        and len(text) <= 100
        and b.x0 > page_width * 0.55
        and not text.endswith((".", ":", "?", "!"))
    ):
        return "byline", text
    # Rubrik: kort, fet eller större än brödtexten — och överst på sidan.
    # Utan höjdkravet startar en fet rad längst ner (t.ex. en ordförklaring)
    # en ny lästext och kopplingen till uppgifterna går förlorad.
    if len(text) <= 90 and b.y0 < page_height * 0.35 and (b.bold or b.max_size > body_size + 0.6):
        return "title", text
    return "body", text


def parse_verbal(path: str) -> dict:
    doc = fitz.open(path)
    meta = parse_cover(doc[0])

    questions: dict[int, dict] = {}
    passages: list[dict] = []
    pending: dict | None = None  # lästext som ännu inte kopplats till frågor
    current: dict | None = None  # senast kopplade lästext
    current_index: int | None = None
    # Bara LÄS och ELF har lästexter. Utan den spärren ärver MEK-uppgifterna
    # den sista LÄS-texten, eftersom de kommer efter den i häftet.
    with_passage = {"LÄS", "ELF"}

    for page in list(doc)[1:]:
        bs = blocks(page)
        if not bs:
            continue
        width = page.rect.width
        sizes = sorted(s for b in bs for s in b.sizes)
        body_size = sizes[len(sizes) // 2] if sizes else 10.0

        q_tops = [b.y0 for b in bs if _is_question(b) is not None]
        split = min(q_tops) - 5 if q_tops else page.rect.height

        text_zone = column_sorted([b for b in bs if b.y0 < split], width)
        task_zone = _merge_split_labels(column_sorted([b for b in bs if b.y0 >= split], width))

        # --- lästextzonen ---
        for b in text_zone:
            piece = _passage_piece(b, width, page.rect.height, body_size)
            if not piece:
                continue
            kind, text = piece
            if kind == "title":
                # Ny rubrik = ny lästext.
                pending = {"title": text, "paras": [], "byline": None, "gloss": None}
                continue
            if pending is None:
                if current is not None and not q_tops:
                    pending = current  # texten fortsätter på nästa sida
                else:
                    pending = {"title": None, "paras": [], "byline": None, "gloss": None}
            if kind == "byline":
                pending["byline"] = text
            elif kind == "gloss":
                pending["gloss"] = text
            else:
                pending["paras"].append(text)

        # --- uppgiftszonen ---
        if q_tops:
            if pending is not None and pending.get("paras"):
                if pending is not current:
                    passages.append(pending)
                    current_index = len(passages) - 1
                current = pending
            pending = None

        # Ett par årgångar har textblock som spänner över spaltrännan, så att
        # två uppgifter hamnar i samma block ('11. … 12. …'). Då ger en
        # spaltvis extraktion ett bättre resultat. Vi bygger uppgifterna på
        # båda sätten och behåller det som ger flest kompletta uppgifter i
        # stället för att gissa layout per årgång.
        two_col = _extract_tasks(page, split, two_columns=True)
        best = max(
            (_build(task_zone, meta, current_index, with_passage), 0),
            (_build(two_col, meta, current_index, with_passage), 1),
            key=lambda pair: (_score(pair[0]), -pair[1]),
        )[0]
        questions.update(best)

    return {"meta": meta, "questions": questions, "passages": passages}


def _extract_tasks(page: "fitz.Page", split: float, two_columns: bool) -> list[Block]:
    width, height = page.rect.width, page.rect.height
    if not two_columns:
        bs = [b for b in blocks(page) if b.y0 >= split]
        return _merge_split_labels(column_sorted(bs, width))
    out: list[Block] = []
    for x0, x1 in ((0.0, width / 2), (width / 2, width)):
        bs = blocks(page, fitz.Rect(x0, split, x1, height))
        out += _merge_split_labels(sorted(bs, key=lambda b: (round(b.y0, 1), b.x0)))
    return out


def _build(
    task_zone: list[Block], meta: dict, passage_index: int | None, with_passage: set[str]
) -> dict[int, dict]:
    out: dict[int, dict] = {}
    nr = None
    for b in task_zone:
        q = _is_question(b)
        if q is not None:
            nr = q
            code = section_for(nr, meta["sections"])
            out[nr] = {
                "nr": nr,
                "text": _question_text(b),
                "alternatives": {},
                "passage": passage_index if code in with_passage else None,
            }
            continue
        letter = _is_alt(b)
        if letter and nr in out:
            out[nr]["alternatives"][letter] = _alt_text(b)
        elif nr in out and not out[nr]["alternatives"]:
            # Fortsättning på frågetexten (men inte löptext efter alternativen).
            out[nr]["text"] = join_lines([out[nr]["text"], b.text])
    return out


def _score(questions: dict[int, dict]) -> int:
    """Hur många uppgifter som blev kompletta — används för att välja layout."""
    return sum(
        1
        for q in questions.values()
        if q["text"] and len(q["alternatives"]) >= 4 and all(q["alternatives"].values())
    )
