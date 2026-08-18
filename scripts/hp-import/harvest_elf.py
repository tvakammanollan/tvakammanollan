"""
Steg 1c: hämtar hem varje arkiverat verbalt provhäfte och behåller dem som
fortfarande har ELF kvar.

Skillnaden mot fetch_elf.py är att inget gissas. archive_index.py har redan
listat varje provhäfte som legat på studera.nu genom åren; här laddas de ner
och identifieras ur sitt eget innehåll — framsidan säger både provdatum och
provpassnummer, vilket är mer pålitligt än filnamnet (som har hetat allt från
`provpass2vejelf12b.pdf` till `hogskoleprovet-2018-10-21-del-3_verbal-del.pdf`).

    python3 scripts/hp-import/archive_index.py   # bygg registret först
    python3 scripts/hp-import/harvest_elf.py

Sparar .hp-cache/<termin>/passN-verbal-full.pdf för de häften som har ELF, och
.hp-cache/elf-harvest.json med vad som hittades var.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import fitz  # noqa: E402

from elf import parse_elf  # noqa: E402

CACHE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".hp-cache"))
UA = "hpkampen-import/1.0 (+https://tvakommanollan.se; kontakt via sajten)"

DATE_RE = re.compile(r"\b(20\d{2})-(\d{2})-(\d{2})\b")
PASS_RE = re.compile(r"Provpass\s*(\d)", re.I)
# Äldre häften daterar sig i filnamnet i stället: 12b = höstprovet 2012.
CODE_RE = re.compile(r"\b(\d{2})([ab])\b")


def get(url: str, timeout: int = 240, tries: int = 2) -> bytes | None:
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError):
            time.sleep(3 * (attempt + 1))
    return None


def identify(data: bytes) -> tuple[str | None, int | None]:
    """(provdatum, provpass) enligt häftets egen framsida."""
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception:
        return None, None
    text = "\n".join(doc[i].get_text() for i in range(min(2, len(doc))))
    date = DATE_RE.search(text)
    number = PASS_RE.search(text)
    return (
        "-".join(date.groups()) if date else None,
        int(number.group(1)) if number else None,
    )


def main() -> int:
    with open(os.path.join(CACHE, "archive-pdfs.json"), encoding="utf-8") as f:
        archive = json.load(f)
    with open(os.path.join(CACHE, "sources.json"), encoding="utf-8") as f:
        sources = json.load(f)
    by_date = {e["date"]: e["term"] for e in sources}

    candidates = sorted(
        u
        for u in archive
        if re.search(r"verb|elf", u, re.I) and not re.search(r"anvisning|exempel|norm", u, re.I)
    )
    print(f"{len(candidates)} verbala häften i arkivet\n")

    harvest: dict[str, dict] = {}
    unknown: list[str] = []

    for url in candidates:
        stamp = archive[url]
        data = get(f"https://web.archive.org/web/{stamp}id_/{url}")
        if not data or data[:4] != b"%PDF":
            data = get(url)  # några ligger kvar live
        if not data or data[:4] != b"%PDF":
            continue

        parsed = parse_elf(data)
        if not parsed or len(parsed["questions"]) < 8:
            continue

        date, pass_no = identify(data)
        if not date or not pass_no:
            unknown.append(url)
            continue

        term = by_date.get(date)
        key = f"{term or date} pass {pass_no}"
        if term:
            target = os.path.join(CACHE, term, f"pass{pass_no}-verbal-full.pdf")
            if os.path.exists(target) and os.path.getsize(target) >= len(data):
                continue
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "wb") as f:
                f.write(data)
        else:
            # Ett provtillfälle vi inte importerar än (2011–2013).
            target = os.path.join(CACHE, "_okanda", f"{date}-pass{pass_no}-verbal.pdf")
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "wb") as f:
                f.write(data)

        harvest[key] = {"url": url, "date": date, "pass": pass_no, "file": target}
        print(f"  ✓ {key:<24} {len(parsed['questions'])} ELF-uppgifter  {url.rsplit('/', 1)[-1]}")

    with open(os.path.join(CACHE, "elf-harvest.json"), "w", encoding="utf-8") as f:
        json.dump(harvest, f, ensure_ascii=False, indent=1)

    print(f"\n{len(harvest)} häften med ELF.")
    if unknown:
        print(f"{len(unknown)} kunde inte dateras: " + ", ".join(u.rsplit('/', 1)[-1] for u in unknown[:8]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
