"""
Parsar ELF-delen (engelsk läsförståelse) ur ett orört provhäfte.

ELF ser inte ut som något annat delprov, och har dessutom bytt form under de
år arkivet spänner över. Tre uppslagstyper förekommer:

* **Korta texter.** Två engelska texter i vänsterspalten med var sin fråga
  mitt emot i högerspalten. Kopplingen text↔fråga är höjdled, inte ordning.
* **Luckuppgifter.** En text där fem uppgiftsnummer står inne i löptexten, och
  en smal spalt rubricerad "Alternatives" med fyra ord per lucka.
* **Lång text.** En text på en egen sida följd av en sida med vanliga frågor.

Häftena hämtas av fetch_elf.py — se den för varför de inte ligger länkade.
"""

from __future__ import annotations

import re

import fitz

from pdfutil import Block, blocks, column_sorted, join_lines

INSTRUCTION = re.compile(r"^(In the following text|Read the text|The text below)", re.I)
HEADING = re.compile(r"^(Questions?|Alternatives|ELF|Engelsk läsförståelse.*)$", re.I)

# Avsnittsrubriken, i de två sättningar UHR har använt: 'Engelsk läsförståelse
# – ELF' (2019–) och 'DELPROV ELF – ENGELSK LÄSFÖRSTÅELSE' (t.o.m. 2018).
# Skiftläget bär informationen och får inte slarvas bort: varje framsida listar
# delproven som 'ELF (engelsk läsförståelse)' med gemener, så en okänslig
# sökning skulle peka ut omslaget som ELF-avsnittets början.
ELF_SECTION = re.compile(r"Engelsk läsförståelse|ENGELSK LÄSFÖRSTÅELSE")
QUESTION_RE = re.compile(r"^(\d{1,2})\s*[.)]\s*(.*)$", re.S)
ALT_RE = re.compile(r"^([A-E])\b\s*(.*)$", re.S)
GAP_ALT_RE = re.compile(r"^([A-E])(?:\s+(.*))?$")
GAP_NUMBER_RE = re.compile(r"\d{1,2}\s*\.")


def _first_elf_page(doc: "fitz.Document") -> int | None:
    for i, page in enumerate(doc):
        text = page.get_text()
        if ELF_SECTION.search(text) and len(text) > 600:
            return i
    return None


def _question_nr(b: Block) -> int | None:
    lines = [x for x in b.lines if x.strip()]
    m = QUESTION_RE.match(lines[0].strip()) if lines else None
    if not m:
        return None
    nr = int(m.group(1))
    return nr if 1 <= nr <= 40 else None


def _question_text(b: Block) -> str:
    lines = [x for x in b.lines if x.strip()]
    m = QUESTION_RE.match(lines[0].strip())
    lines[0] = m.group(2) if m else lines[0]
    return join_lines(lines, english=b.english)


def _looks_like_title(b: Block) -> bool:
    text = b.text
    return bool(text) and len(text) <= 90 and len(b.lines) <= 2 and not text.endswith(".")


def _gap_alternatives(b: Block) -> list[str]:
    """
    ['A', 'activate', 'B', 'relieve', …] → ['activate', 'relieve', …]

    Bokstaven står oftast på egen rad, men sättningen låter den ibland dela rad
    med sitt alternativ ('D prejudice') — och t.o.m. 2018 ligger dessutom
    uppgiftsnumret först i samma block. Bokstäverna måste komma i ordning
    A, B, C … för att räknas: annars klyvs ett alternativ som självt inleds med
    'A ' ('A few individuals …') mitt itu.
    """
    out: list[str] = []
    current: list[str] | None = None
    for raw in b.lines:
        line = raw.strip()
        if not line or GAP_NUMBER_RE.fullmatch(line):
            continue
        m = GAP_ALT_RE.match(line)
        expected = "ABCDE"[min(len(out) + (current is not None), 4)]
        if m and m.group(1) == expected:
            if current is not None:
                out.append(join_lines(current, english=b.english))
            current = [m.group(2)] if m.group(2) else []
        elif current is not None:
            current.append(line)
    if current:
        out.append(join_lines(current, english=b.english))
    return [x for x in out if x]


def _passage(bs: list[Block], width: float) -> dict | None:
    """Bygger en lästext av en grupp block."""
    title = None
    paragraphs: list[str] = []
    for b in column_sorted(bs, width):
        text = b.text
        if not text or HEADING.match(text) or INSTRUCTION.match(text):
            continue
        if title is None and _looks_like_title(b):
            title = re.sub(r"^Alternatives\s+", "", text)
            continue
        paragraphs += b.paragraphs()
    byline = None
    if paragraphs and len(paragraphs[-1]) <= 80 and not paragraphs[-1].endswith((".", "?", "!")):
        byline = paragraphs.pop()
    if not paragraphs:
        return None
    out: dict = {"paras": paragraphs}
    if title:
        out["title"] = title
    if byline:
        out["byline"] = byline
    return out


def _split_texts(bs: list[Block]) -> list[list[Block]]:
    """Delar vänsterspalten i en grupp per text — en rubrik börjar en ny."""
    groups: list[list[Block]] = []
    for b in sorted(bs, key=lambda b: b.y0):
        if HEADING.match(b.text or ""):
            continue
        if _looks_like_title(b) or not groups:
            groups.append([b])
        else:
            groups[-1].append(b)
    return [g for g in groups if g]


def parse_elf(source: str | bytes) -> dict | None:
    """
    → {'questions': {nr: {...}}, 'passages': [...]} eller None.

    Tar en sökväg eller PDF-innehållet direkt; fetch_elf.py använder det senare
    för att avgöra om en nedladdad kandidat faktiskt har ELF kvar.
    """
    doc = fitz.open(source) if isinstance(source, str) else fitz.open(stream=source, filetype="pdf")
    start = _first_elf_page(doc)
    if start is None:
        return None

    questions: dict[int, dict] = {}
    passages: list[dict] = []
    pending: list[Block] = []  # lästext som ännu inte fått sina frågor

    def add_passage(entry: dict | None) -> int | None:
        if not entry:
            return None
        passages.append(entry)
        return len(passages) - 1

    for pno in range(start, len(doc)):
        page = doc[pno]
        bs = blocks(page)
        if not bs:
            continue
        # Allt härifrån är engelsk text, och engelskan bindestrecksförenar ord
        # som svenskan skriver ihop. Se join_lines.
        for b in bs:
            b.english = True
        text = page.get_text()
        # Häftet innehåller ibland två provversioner efter varandra.
        if pno > start and ("ORD – Ordförståelse" in text or "Provpass" in text):
            break

        width = page.rect.width
        mid = width * 0.52
        q_blocks = [b for b in bs if _question_nr(b) is not None]

        # --- luckuppgifter ---
        # Anvisningen är den säkra markören: rubriken "Alternatives" hamnar
        # ibland i samma textblock som textens titel och matchar då inte exakt.
        if any(INSTRUCTION.match(b.text or "") for b in bs) or any(
            (b.text or "").startswith("Alternatives") for b in bs
        ):
            index = add_passage(_passage([b for b in bs if b.x0 < mid], width))
            nr = None
            for b in sorted([b for b in bs if b.x0 >= mid], key=lambda b: b.y0):
                if HEADING.match(b.text or ""):
                    continue
                m = GAP_NUMBER_RE.fullmatch(b.text)
                if m:
                    nr = int(b.text.rstrip(". "))
                    continue
                # T.o.m. 2018 står numret som första rad i alternativblocket i
                # stället för i ett eget block.
                head = next((x.strip() for x in b.lines if x.strip()), "")
                if GAP_NUMBER_RE.fullmatch(head):
                    nr = int(head.rstrip(". "))
                alts = _gap_alternatives(b)
                if nr is not None and len(alts) >= 4:
                    questions[nr] = {
                        "nr": nr,
                        "text": f"Välj det ord eller uttryck som passar bäst i lucka {nr} i texten.",
                        "alternatives": alts,
                        "passage": index,
                        "cloze": True,
                    }
                    nr = None
            continue

        # --- ren lästextsida ---
        if not q_blocks:
            pending += bs
            continue

        # --- korta texter med var sin fråga mitt emot ---
        if all(b.x0 >= mid for b in q_blocks) and any(
            b.x0 < mid and not HEADING.match(b.text or "") for b in bs
        ):
            groups = _split_texts([b for b in bs if b.x0 < mid])
            indexes = [(g[0].y0, g[-1].bbox[3], add_passage(_passage(g, width))) for g in groups]
            _collect(questions, [b for b in bs if b.x0 >= mid], width, indexes)
            continue

        # --- lång text: frågorna hör till det som samlats ihop ---
        split = min(b.y0 for b in q_blocks) - 5
        pending += [b for b in bs if b.y0 < split]
        index = add_passage(_passage(pending, width))
        pending = []
        _collect(questions, [b for b in bs if b.y0 >= split], width, [(0, 1e9, index)])

    for q in questions.values():
        q["alternatives"] = [a for a in q["alternatives"] if a]
    return {"questions": questions, "passages": passages}


def _collect(
    questions: dict[int, dict],
    bs: list[Block],
    width: float,
    ranges: list[tuple[float, float, int | None]],
) -> None:
    """
    Läser frågor ur block och kopplar varje fråga till den lästext den står
    mitt emot. `ranges` är (topp, botten, lästextindex) per text på sidan.
    """

    def passage_for(y: float) -> int | None:
        best, overlap = None, -1.0
        for top, bottom, index in ranges:
            covered = min(bottom, y + 120) - max(top, y)
            if covered > overlap:
                best, overlap = index, covered
        return best

    nr = None
    for b in column_sorted(bs, width):
        q = _question_nr(b)
        if q is not None:
            nr = q
            questions[nr] = {
                "nr": nr,
                "text": _question_text(b),
                "alternatives": [],
                "passage": passage_for(b.y0),
            }
            continue
        if nr is None or nr not in questions:
            continue
        m = ALT_RE.match(b.text or "")
        alts = questions[nr]["alternatives"]
        # Bokstaven måste vara nästa i ordningen. Annars läses en frågerad som
        # inleds med "A" (artikeln) som ett svarsalternativ.
        expected = "ABCDE"[len(alts)] if len(alts) < 5 else None
        if m and m.group(2) and m.group(1) == expected:
            alts.append(join_lines([m.group(2)], english=b.english))
        elif not alts:
            # Fortsättning på frågetexten — frågan bryts ibland över två block.
            questions[nr]["text"] = join_lines(
                [questions[nr]["text"], b.text], english=b.english
            )
