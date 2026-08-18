"""
Steg 1e: hela verbala provpass ur de HTML-provsidor UHR använde 2011–2012.

De åren fanns inget provhäfte att ladda ner — provet publicerades som en
webbsida per delprov. Sidorna finns i Internet Archive, och för ORD, MEK och
LÄS ligger allt innehåll kvar i sidans tabeller.

Den kvantitativa delen går inte att rädda: XYZ, KVA, NOG och DTK sattes som
en GIF per uppgift, och de bilderna arkiverades aldrig — bara sidorna som
länkade dem. Därför importeras bara de verbala provpassen för de här åren.

    python3 scripts/hp-import/html_prov.py

Skriver .hp-cache/<termin>/passN-html.json.
"""

from __future__ import annotations

import html as html_module
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

CACHE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".hp-cache"))
CDX = "http://web.archive.org/cdx/search/cdx"
UA = "hpkampen-import/1.0 (+https://tvakommanollan.se; kontakt via sajten)"

# Provtillfällen som bara finns som HTML-sidor.
EXAMS = {"2011-10-29": "2011ht", "2012-03-31": "2012vt"}

HEADER_RE = re.compile(r"Provpass\s*(\d).*?(\d{4})\s*-\s*(\d{2})\s*-\s*(\d{2})", re.S | re.I)
NUMBER_RE = re.compile(r"^(\d{1,2})\s*\.$")
LETTER_RE = re.compile(r"^([A-E])$")
DELPROV_RE = re.compile(r"\b(ORD|MEK|LÄS|LAS|ELF)\b")


def get(url: str, timeout: int = 120, tries: int = 3) -> str:
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read().decode("utf-8", "replace")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError):
            time.sleep(3 * (attempt + 1))
    return ""


def clean(value: str) -> str:
    return re.sub(r"[\s\xa0]+", " ", html_module.unescape(re.sub(r"<[^>]+>", "", value))).strip()


def tables(raw: str) -> list[list[list[str]]]:
    """Sidans tabeller som rader av cellsträngar."""
    out = []
    for table in re.findall(r"<table[^>]*>(.*?)</table>", raw, re.S | re.I):
        rows = []
        for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", tr_source := table, re.S | re.I):
            cells = [clean(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S | re.I)]
            if any(cells):
                rows.append(cells)
        del tr_source
        if rows:
            out.append(rows)
    return out


def lines(raw: str) -> list[str]:
    body = re.sub(r"<script.*?</script>|<style.*?</style>", "", raw, flags=re.S)
    body = re.sub(r"</t[dh]>|</tr>|<br\s*/?>|</p>|</div>", "\n", body)
    return [x for x in (clean(line) for line in body.split("\n")) if x]


def parse_ord(page: str) -> dict[int, dict]:
    """
    ORD sattes två uppgifter i bredd: första raden är '1. ord 2. ord', och
    raderna under är 'A alt A alt' — ett alternativ för vardera uppgiften.
    """
    questions: dict[int, dict] = {}
    for rows in tables(page):
        head = rows[0]
        starts = [(i, NUMBER_RE.match(c)) for i, c in enumerate(head)]
        starts = [(i, int(m.group(1))) for i, m in starts if m]
        if not starts or len(rows) < 4:
            continue
        for column, (i, nr) in enumerate(starts):
            word = head[i + 1] if i + 1 < len(head) else ""
            alternatives = []
            for row in rows[1:]:
                letters = [k for k, c in enumerate(row) if LETTER_RE.match(c)]
                if column < len(letters):
                    k = letters[column]
                    if k + 1 < len(row) and row[k + 1]:
                        alternatives.append(row[k + 1])
            if word and len(alternatives) >= 4:
                questions[nr] = {"nr": nr, "text": word, "alternatives": alternatives}
    return questions


def parse_numbered(page: str) -> dict[int, dict]:
    """
    MEK och LÄS: en tabell med '<nr>. <frågetext>' följd av en tabell med
    alternativen under varandra.
    """
    questions: dict[int, dict] = {}
    current: int | None = None
    for rows in tables(page):
        head = [c for c in rows[0] if c]
        if head and NUMBER_RE.match(head[0]) and len(head) > 1:
            current = int(NUMBER_RE.match(head[0]).group(1))
            questions[current] = {"nr": current, "text": " ".join(head[1:]), "alternatives": []}
            continue
        if current is None or current not in questions:
            continue
        for row in rows:
            cells = [c for c in row if c]
            if len(cells) >= 2 and LETTER_RE.match(cells[0]):
                expected = "ABCDE"[len(questions[current]["alternatives"])]
                if cells[0] == expected:
                    questions[current]["alternatives"].append(" ".join(cells[1:]))
    return questions


def parse_reading(page: str) -> tuple[dict[int, dict], list[dict]]:
    """
    LÄS: lästexterna och frågorna ligger inte i tabeller utan som löpande
    rader, i den ordning de står på sidan. Varje fråga hör till den text som
    står närmast ovanför.
    """
    questions: dict[int, dict] = {}
    passages: list[dict] = []
    buffer: list[str] = []
    title: str | None = None
    byline: str | None = None
    index: int | None = None
    current: int | None = None

    def flush() -> None:
        nonlocal buffer, title, byline, index
        if buffer:
            entry: dict = {"paras": buffer}
            if title:
                entry["title"] = title
            if byline:
                entry["byline"] = byline
            passages.append(entry)
            index = len(passages) - 1
        buffer, title, byline = [], None, None

    for line in lines(page):
        if re.match(r"^(Provansvarig|Startsida|Sök och|Studera|Om studier|Provpass)", line, re.I):
            continue
        if line.lower().startswith("uppgifter"):
            flush()
            continue
        head = re.match(r"^(\d{1,2})\s*[.)]\s*(.*)$", line)
        if head and 1 <= int(head.group(1)) <= 40:
            current = int(head.group(1))
            questions[current] = {
                "nr": current,
                "text": head.group(2).strip(),
                "alternatives": [],
                "passage": index,
            }
            continue
        alt = re.match(r"^([A-E])\s+(.+)$", line)
        if alt and current is not None and len(line) <= 300:
            expected = "ABCDE"[len(questions[current]["alternatives"])]
            if alt.group(1) == expected:
                questions[current]["alternatives"].append(alt.group(2).strip())
                continue
        if current is not None and not questions[current]["text"]:
            questions[current]["text"] = line
            continue
        if current is not None and questions[current]["alternatives"]:
            current = None
        if len(line) > 150:
            buffer.append(line)
        elif 4 <= len(line) <= 90 and not line.endswith((":", ".")):
            if buffer:
                byline = line
            else:
                flush()
                title = line

    flush()
    return questions, passages


def parse_passages(page: str) -> list[dict]:
    """LÄS-texterna: löptexten ligger utanför tabellerna, före 'Uppgifter'."""
    out: list[dict] = []
    title: str | None = None
    buffer: list[str] = []
    byline: str | None = None

    def flush() -> None:
        nonlocal title, buffer, byline
        if buffer:
            entry: dict = {"paras": buffer}
            if title:
                entry["title"] = title
            if byline:
                entry["byline"] = byline
            out.append(entry)
        title, buffer, byline = None, [], None

    for line in lines(page):
        if re.match(r"^(Uppgifter|Provansvarig|Startsida|Sök och|Studera|Om studier)", line, re.I):
            if line.lower().startswith("uppgifter"):
                flush()
            continue
        if NUMBER_RE.match(line) or LETTER_RE.match(line):
            continue
        if len(line) > 150:
            buffer.append(line)
        elif 4 <= len(line) <= 90 and not line.endswith((":", ".")):
            if buffer:
                byline = line
            else:
                flush()
                title = line
    flush()
    return out


def main() -> int:
    query = (
        f"{CDX}?url=studera.nu&matchType=domain"
        "&filter=original:.*provfragor.*provpass.*&filter=statuscode:200"
        "&collapse=urlkey&fl=original,timestamp&limit=1000"
    )
    pages = [
        (parts[0], parts[1])
        for parts in (line.split() for line in get(query, timeout=300).splitlines())
        if len(parts) == 2 and "?" not in parts[0]
    ]

    collected: dict[tuple[str, int], dict] = {}
    for url, stamp in sorted(pages):
        raw = get(f"https://web.archive.org/web/{stamp}id_/{url}")
        if not raw:
            continue
        header = HEADER_RE.search("\n".join(lines(raw)[:40]))
        if not header:
            continue
        date = f"{header.group(2)}-{header.group(3)}-{header.group(4)}"
        if date not in EXAMS:
            continue
        pass_no = int(header.group(1))
        name = url.rsplit("/", 1)[-1].lower()
        code = "ORD" if "ord" in name else "MEK" if "mek" in name else "LÄS" if "las" in name else None
        if not code:
            continue

        bucket = collected.setdefault(
            (date, pass_no), {"date": date, "pass": pass_no, "questions": {}, "passages": []}
        )
        if code == "ORD":
            found = parse_ord(raw)
        elif code == "LÄS":
            found, texts = parse_reading(raw)
            offset = len(bucket["passages"])
            bucket["passages"] += texts
            for q in found.values():
                if q.get("passage") is None:
                    q.pop("passage", None)
                else:
                    q["passage"] += offset
        else:
            found = parse_numbered(raw)
        complete = {n: q for n, q in found.items() if q["text"] and len(q["alternatives"]) >= 4}
        bucket["questions"].update({str(n): q for n, q in complete.items()})
        print(f"  {date} pass {pass_no} {code}: {len(complete)} uppgifter")

    written = 0
    for (date, pass_no), bucket in sorted(collected.items()):
        if len(bucket["questions"]) < 20:
            continue
        term = EXAMS[date]
        target = os.path.join(CACHE, term, f"pass{pass_no}-html.json")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as f:
            json.dump(bucket, f, ensure_ascii=False, indent=1)
        written += 1
        print(f"✓ {term} pass {pass_no}: {len(bucket['questions'])} uppgifter, {len(bucket['passages'])} texter")

    print(f"\n{written} verbala provpass hämtade ur HTML-sidorna.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
