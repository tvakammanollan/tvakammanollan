"""
Läser UHR:s facit-PDF → {provpass: {uppgiftsnr: 'A'..'E'}}.

Formatet har varierat en hel del sedan 2013 och textordningen är interfolierad
mellan kolumnerna, så allt görs geometriskt:

* Kolumnrubrikerna ('Provpass 3') ligger antingen bredvid varandra (fyra
  spalter, vanligast) eller staplade under varandra (2020ht). Båda stöds.
* Svaret står ibland som '12 D' på en rad, ibland som '12' och 'D' på var sin
  rad i olika spalter (2016vt, 2018vt, 2020ht). Lösa bokstäver paras därför
  ihop med närmaste siffra på samma rad.
"""

from __future__ import annotations

import re

import fitz

from pdfutil import clean_text, line_text

# Tiotalssiffran sätts ibland som en egen textrad ('1' + '0 B' = '10 B'), och
# ett par uppgifter har underkänts i efterhand och har två godkända svar
# ('35 C, D'). Båda måste igenom samma regex.
PAIR_RE = re.compile(r"^(\d(?:\s*\d)?)\s*([A-E](?:\s*,\s*[A-E])*)$")
NUM_RE = re.compile(r"^\d(?:\s*\d)?$")
LETTER_RE = re.compile(r"^[A-E](?:\s*,\s*[A-E])*$")
PASS_HEADER_RE = re.compile(r"provpass\s*(\d)", re.I)


def _tokens(page: "fitz.Page") -> list[tuple[str, float, float]]:
    """
    (text, x, y) per rad, där fragment som står tätt intill varandra på samma
    rad slås ihop. Utan hopslagningen tappas varje tvåsiffrig uppgift i de
    facit där tiotalssiffran är en egen textrad (2021vtb provpass 4).
    """
    raw: list[tuple[str, float, float, float]] = []
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            txt = clean_text(line_text(line), keep_soft_hyphen=False)
            if txt:
                raw.append((txt, line["bbox"][0], line["bbox"][2], line["bbox"][1]))

    def fragment(s: str) -> bool:
        # Bara svarsfragment får slås ihop. Utan den spärren klistras
        # 'Provpass 3 (= DYS 2)' ihop med rubriken för provpass 4 bredvid.
        return bool(re.fullmatch(r"[\dA-E,\s]{1,5}", s))

    raw.sort(key=lambda t: (round(t[3] / 3), t[1]))
    out: list[tuple[str, float, float]] = []
    cur: tuple[str, float, float, float] | None = None
    for txt, x0, x1, y in raw:
        gap = x0 - cur[2] if cur else 0
        if cur and abs(y - cur[3]) <= 3 and 0 <= gap < 14 and fragment(cur[0]) and fragment(txt):
            cur = (f"{cur[0]} {txt}", cur[1], x1, cur[3])
        else:
            if cur:
                out.append((cur[0], cur[1], cur[3]))
            cur = (txt, x0, x1, y)
    if cur:
        out.append((cur[0], cur[1], cur[3]))
    return out


def _letters(s: str) -> str:
    """'C, D' → 'CD' — de få uppgifter UHR i efterhand gett två godkända svar."""
    return "".join(sorted(set(re.findall(r"[A-E]", s))))


def _answers(tokens: list[tuple[str, float, float]]) -> list[tuple[int, str, float, float]]:
    """→ [(nr, godkända bokstäver, x, y)]"""
    found: list[tuple[int, str, float, float]] = []
    numbers: list[tuple[int, float, float]] = []
    letters: list[tuple[str, float, float]] = []

    for txt, x, y in tokens:
        m = PAIR_RE.match(txt)
        if m:
            found.append((int(m.group(1).replace(" ", "")), _letters(m.group(2)), x, y))
            continue
        if NUM_RE.match(txt):
            numbers.append((int(txt.replace(" ", "")), x, y))
            continue
        if LETTER_RE.match(txt):
            letters.append((_letters(txt), x, y))

    # Para ihop lösa siffror och bokstäver: samma rad, bokstaven till höger.
    used: set[int] = set()
    for nr, nx, ny in numbers:
        best, bestd = None, 1e9
        for i, (letter, lx, ly) in enumerate(letters):
            if i in used or lx < nx - 2 or lx - nx > 90 or abs(ly - ny) > 7:
                continue
            d = lx - nx
            if d < bestd:
                best, bestd = i, d
        if best is not None:
            used.add(best)
            found.append((nr, letters[best][0], nx, ny))
    return found


def parse_facit(path: str) -> dict[int, dict[int, str]]:
    doc = fitz.open(path)
    result: dict[int, dict[int, str]] = {}

    for page in doc:
        tokens = _tokens(page)

        headers: list[tuple[float, float, int]] = []  # (x, y, provpass)
        for txt, x, y in tokens:
            m = PASS_HEADER_RE.search(txt)
            if m:
                p = int(m.group(1))
                if not any(abs(x - hx) < 20 and abs(y - hy) < 20 for hx, hy, _ in headers):
                    headers.append((x, y, p))
        if not headers:
            continue

        answers = _answers(tokens)
        if not answers:
            continue

        # Rubrikerna kan stå bredvid varandra (fyra spalter), staplade under
        # varandra (2020ht) eller i 2×2 (2018ht, 2019ht, 2023ht). Klustra dem
        # i spalter och välj sedan senaste rubriken ovanför svaret i den spalt
        # svaret tillhör — det täcker alla tre varianterna.
        columns: list[list[tuple[float, float, int]]] = []
        for h in sorted(headers):
            if columns and h[0] - columns[-1][-1][0] < 60:
                columns[-1].append(h)
            else:
                columns.append([h])
        for col in columns:
            col.sort(key=lambda h: h[1])
        centers = [sum(h[0] for h in col) / len(col) for col in columns]

        def which(x: float, y: float) -> int:
            i = min(range(len(centers)), key=lambda j: abs(x - centers[j]))
            col = columns[i]
            current = col[0][2]
            for _, hy, p in col:
                if hy <= y + 2:
                    current = p
            return current

        for nr, letter, x, y in answers:
            result.setdefault(which(x, y), {})[nr] = letter

    return result
