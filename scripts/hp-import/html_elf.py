"""
Steg 1d: ELF ur de provsidor UHR publicerade som HTML.

Mellan 2011 och 2014 lade UHR inte upp provet som PDF utan som en webbsida per
delprov — och till skillnad från häftena rensades de sidorna aldrig på engelsk
läsförståelse. De ligger kvar i Internet Archive, arkiverade veckorna efter
provdagen.

Sidorna är sättningsmässigt enkla: en tabell med textens rubrik, texten,
ordet "Question", uppgiftsnumret och svarsalternativen A–D under varandra.

    python3 scripts/hp-import/html_elf.py

Skriver .hp-cache/<termin>/passN-elf.json, som build.py väver in.
"""

from __future__ import annotations

import html as html_module
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

CACHE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".hp-cache"))
CDX = "http://web.archive.org/cdx/search/cdx"
UA = "tvakommanollan-import/1.0 (+https://tvakommanollan.se; kontakt via sajten)"

QUESTION_RE = re.compile(r"^(\d{1,2})\s*[.)]\s*(.*)$")
ALT_RE = re.compile(r"^([A-E])[\t ]+(.+)$")
# Rubriken skrevs "PROVPASS 2 Verbal del (ELF) 2012-10-27" ena året och
# "Provpass 3 - Engelsk läsförståelse (ORD) 2014-04-05" nästa — och koden i
# parentesen är ibland fel. Bara passnummer och datum går att lita på.
HEADER_RE = re.compile(
    r"Provpass\s*(\d).*?(\d{4})\s*-\s*(\d{2})\s*-\s*(\d{2})", re.S | re.I
)
NOISE = re.compile(
    r"^(Question|Questions|Alternatives|Provansvarig|Startsida|Sök och jämför|Högskoleprovet|"
    r"Studera|Om studier|Provpass|Skriv ut|Dela|Kontakt)\b",
    re.I,
)


def get(url: str, timeout: int = 120, tries: int = 3) -> str:
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read().decode("utf-8", "replace")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError):
            time.sleep(3 * (attempt + 1))
    return ""


def flatten(raw: str) -> list[str]:
    """HTML → en rad per tabellcell, i dokumentordning."""
    body = re.sub(r"<script.*?</script>|<style.*?</style>", "", raw, flags=re.S)
    body = re.sub(r"</t[dh]>", "\t", body)
    body = re.sub(r"</tr>|<br\s*/?>|</p>|</div>", "\n", body)
    body = html_module.unescape(re.sub(r"<[^>]+>", "", body))
    lines = []
    for line in body.split("\n"):
        line = re.sub(r"[ \t\xa0]+", " ", line).strip()
        if line:
            lines.append(line)
    return lines


def find_pages() -> dict[str, list[tuple[str, str]]]:
    """{provdatum: [(adress, tidsstämpel)]} för varje arkiverad ELF-sida."""
    query = (
        f"{CDX}?url=studera.nu&matchType=domain"
        "&filter=original:.*provfragor.*engelsklasforstaelse.*"
        "&filter=statuscode:200&collapse=urlkey&fl=original,timestamp&limit=500"
    )
    out: dict[str, list[tuple[str, str]]] = {}
    for line in get(query, timeout=300).splitlines():
        parts = line.split()
        if len(parts) != 2 or "?" in parts[0]:
            continue
        out.setdefault("alla", []).append((parts[0], parts[1]))
    return out


def parse(lines: list[str]) -> dict | None:
    """Läser rubrik, texter och uppgifter ur en flattenad ELF-sida."""
    joined = "\n".join(lines)
    header = HEADER_RE.search(joined)
    if not header:
        return None
    pass_no = int(header.group(1))
    date = f"{header.group(2)}-{header.group(3)}-{header.group(4)}"

    questions: dict[int, dict] = {}
    passages: list[dict] = []
    buffer: list[str] = []
    title: str | None = None
    byline: str | None = None
    current: int | None = None
    index: int | None = None

    def flush() -> None:
        """Lägg undan den text som samlats ihop före en fråga."""
        nonlocal buffer, title, byline, index
        paragraphs = [b for b in buffer if len(b) > 120]
        if paragraphs:
            entry: dict = {"paras": paragraphs}
            if title:
                entry["title"] = title
            if byline:
                entry["byline"] = byline
            passages.append(entry)
            index = len(passages) - 1
        buffer = []
        title = None
        byline = None

    for line in lines:
        if NOISE.match(line) and not QUESTION_RE.match(line):
            continue
        q = QUESTION_RE.match(line)
        if q and 20 <= int(q.group(1)) <= 40:
            if current is None:
                flush()
            current = int(q.group(1))
            questions[current] = {
                "nr": current,
                "text": q.group(2).strip(),
                "alternatives": [],
                "passage": index,
            }
            continue
        # En lästextrad som börjar med "A few individuals…" är inget
        # svarsalternativ. Alternativen är korta.
        alt = ALT_RE.match(line) if len(line) <= 200 else None
        if alt and current is not None:
            expected = "ABCDE"[len(questions[current]["alternatives"])]
            if alt.group(1) == expected:
                questions[current]["alternatives"].append(alt.group(2).strip())
                continue
        if current is not None and questions[current]["alternatives"]:
            # Ny text börjar efter att en uppgift avslutats.
            current = None
        if current is not None:
            questions[current]["text"] = f"{questions[current]['text']} {line}".strip()
        elif len(line) > 120:
            buffer.append(line)
        elif 4 <= len(line) <= 90 and not line.endswith((":", ".")):
            # En kort rad före texten är dess rubrik; en kort rad efter är
            # källhänvisningen ("Maya Jaggi, The Guardian Weekly").
            if buffer:
                byline = line
            else:
                title = line

    flush()
    for q in questions.values():
        # Luckuppgifterna har inget eget frågespråk: numret står i texten.
        if not q["text"]:
            q["text"] = (
                f"Välj det ord eller uttryck som passar bäst i lucka {q['nr']} i texten."
            )
            q["cloze"] = True
    complete = {
        nr: q for nr, q in questions.items() if q["text"] and len(q["alternatives"]) >= 4
    }
    if len(complete) < 8:
        return None
    return {"date": date, "pass": pass_no, "questions": complete, "passages": passages}


def main() -> int:
    with open(os.path.join(CACHE, "sources.json"), encoding="utf-8") as f:
        by_date = {e["date"]: e["term"] for e in json.load(f)}

    pages = find_pages().get("alla", [])
    print(f"{len(pages)} arkiverade ELF-sidor\n")

    written = 0
    for url, stamp in sorted(pages):
        raw = get(f"https://web.archive.org/web/{stamp}id_/{url}")
        if not raw:
            continue
        parsed = parse(flatten(raw))
        if not parsed:
            print(f"  ✗ {url.rsplit('/', 1)[-1][:52]}")
            continue
        term = by_date.get(parsed["date"])
        if not term:
            print(f"  – {parsed['date']} pass {parsed['pass']}: provet importeras inte")
            continue
        target = os.path.join(CACHE, term, f"pass{parsed['pass']}-elf.json")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as f:
            json.dump(parsed, f, ensure_ascii=False, indent=1)
        written += 1
        print(
            f"  ✓ {term} pass {parsed['pass']}: {len(parsed['questions'])} uppgifter, "
            f"{len(parsed['passages'])} texter"
        )

    print(f"\n{written} ELF-avsnitt hämtade ur HTML-sidorna.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
