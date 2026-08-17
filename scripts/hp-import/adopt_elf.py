"""
Steg 1f: ta emot provhäften som laddats ner för hand och lägg dem i cachen.

UHR byter en vecka efter provdagen ut provhäftet mot en version utan den
engelska texten, och originalet går bara att få tag på för en del provtillfällen
(se fetch_elf.py och harvest_elf.py). Resten finns hos tredje part, och när
sajtägaren själv hämtar hem dem är det den här vägen de kommer in.

    python3 scripts/hp-import/adopt_elf.py [katalog]        # torrkörning
    python3 scripts/hp-import/adopt_elf.py [katalog] --apply

Skriptet läser provtillfälle och provpass ur häftets egen framsida, så
filnamnen spelar ingen roll — kasta in dem osorterade. Ett häfte tas bara emot
när tre saker stämmer:

  1. `parse_elf` hittar minst åtta uppgifter (samma krav som resten av
     pipelinen använder för att avgöra om ELF finns kvar i en fil),
  2. facit för provpasset täcker uppgift 31–40, och
  3. häftets svenska del är samma text som den avskalade versionen vi redan
     har. Punkt 3 är det som fångar en felmappning: två provtillfällen samma
     termin har olika innehåll men identisk framsidelayout.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import sys
from collections import Counter

import fitz

from elf import parse_elf
from facit import parse_facit

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CACHE = os.path.join(ROOT, ".hp-cache")

DATE_RE = re.compile(r"20\d\d-\d\d-\d\d")
PASS_RE = re.compile(r"Provpass\s*(\d)")

# Provdatum på framsidan som inte motsvarar ett eget provtillfälle.
#
# Vårprovet 2020 ställdes in i mars 2020 och skrevs aldrig. Häftena hade redan
# tryckts, och samma prov användes i stället den 25 oktober samma år — texten är
# ord för ord densamma, bara framsidans datum skiljer. Häften märkta 2020-04-04
# hör alltså till höstprovet 2020.
DATE_ALIASES = {"2020-04-04": "2020ht"}


def cover(path: str) -> tuple[str | None, int | None]:
    """(provdatum, provpass) ur häftets framsida."""
    try:
        text = fitz.open(path)[0].get_text()
    except Exception:
        return None, None
    date = DATE_RE.search(text)
    number = PASS_RE.search(text)
    if not date or not number or "Högskoleprovet" not in text:
        return None, None
    return date.group(0), int(number.group(1))


def same_exam(candidate: str, existing: str) -> bool:
    """
    Är det här samma provpass som det vi redan har?

    Jämför ordmängden sida för sida i den svenska delen. Häftena är samma
    dokument i två exporter, så texten är identisk — men den ena kan ha mjuka
    bindestreck där den andra har riktiga, och blockordningen skiljer sig.
    Därför jämförs ord utan bindestreck, inte råtext.
    """
    a, b = fitz.open(candidate), fitz.open(existing)
    shared = 0
    for i in range(1, b.page_count):
        wa = Counter(w.strip("\xad-") for w in re.findall(r"\S+", a[i].get_text()))
        wb = Counter(w.strip("\xad-") for w in re.findall(r"\S+", b[i].get_text()))
        if not wb:
            continue
        overlap = sum((wa & wb).values()) / sum(wb.values())
        if overlap < 0.9:
            return False
        shared += 1
    return shared >= 3


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    apply = "--apply" in sys.argv
    source = os.path.expanduser(args[0] if args else "~/Downloads")

    sources = json.load(open(os.path.join(CACHE, "sources.json"), encoding="utf-8"))
    term_for = {s["date"]: s["term"] for s in sources} | DATE_ALIASES
    # `date` är hämtat från provlistan och stämmer inte alltid med provdagen —
    # vårprovet 2016 står som 2016-04-04, en måndag, medan provet skrevs den 9:e.
    # Katalognamnet i UHR:s egen URL bär det riktiga datumet, vilket är det som
    # står på häftets framsida.
    for s in sources:
        for p in s["passes"]:
            found = re.search(r"hp-(20\d\d-\d\d-\d\d)", p.get("url", ""))
            if found:
                term_for.setdefault(found.group(1), s["term"])
    file_for = {(s["term"], p["pass"]): p["file"] for s in sources for p in s["passes"]}

    pdfs = sorted(
        os.path.join(source, f) for f in os.listdir(source) if f.lower().endswith(".pdf")
    )
    taken: dict[tuple[str, int], str] = {}
    rows: list[tuple[str, str]] = []
    added = 0

    for path in pdfs:
        date, number = cover(path)
        if not date or not number:
            continue
        name = os.path.basename(path)
        term = term_for.get(date)
        if not term:
            rows.append(("?", f"{date} pass {number}: inget provtillfälle i cachen — {name}"))
            continue

        stripped = file_for.get((term, number))
        if not stripped or not os.path.exists(stripped):
            rows.append(("?", f"{term} pass {number}: inget sådant provpass — {name}"))
            continue
        # 2011–2012 publicerades proven bara som webbsidor. Kommer provhäftet
        # in den här vägen är det en bättre källa än de sidorna: hela passet i
        # stället för de uppgifter arkivet råkar ha facit på. Det läggs då som
        # passets ordinarie PDF, och build.py väljer den framför HTML-passet.
        if not stripped.endswith(".pdf"):
            target = os.path.join(CACHE, term, f"pass{number}-verbal.pdf")
            keys, _ = parse_facit(os.path.join(CACHE, term, "facit.pdf"))
            answers = len(keys.get(number, {}))
            parsed = parse_elf(path)
            found = len(parsed["questions"]) if parsed else 0
            if answers < 40:
                rows.append(("–", f"{term} pass {number}: facit täcker {answers}/40 — {name}"))
            elif os.path.exists(target):
                rows.append((" ", f"{term} pass {number}: fanns redan"))
            else:
                if apply:
                    # Häftet är både passets PDF och dess ELF-källa. Utan
                    # kopian med -full läser build.py passet med parse_verbal,
                    # som inte förstår ELF:s luckuppslag och lämnar uppgift
                    # 31–35 utan alternativ — då underkänns hela passet.
                    shutil.copy(path, target)
                    shutil.copy(path, target.replace(".pdf", "-full.pdf"))
                added += 1
                rows.append(
                    ("+", f"{term} pass {number}: helt provpass ur häftet, {found} ELF")
                )
            continue

        parsed = parse_elf(path)
        found = len(parsed["questions"]) if parsed else 0
        if found < 8:
            rows.append(("–", f"{term} pass {number}: bara {found} ELF-uppgifter — {name}"))
            continue

        keys, _ = parse_facit(os.path.join(CACHE, term, "facit.pdf"))
        answers = len([n for n in keys.get(number, {}) if 31 <= n <= 40])
        if answers < found:
            rows.append(("–", f"{term} pass {number}: facit täcker {answers} av {found} — {name}"))
            continue

        if not same_exam(path, stripped):
            rows.append(("!", f"{term} pass {number}: texten matchar inte vårt häfte — {name}"))
            continue

        target = stripped.replace(".pdf", "-full.pdf")
        seen = taken.get((term, number))
        if seen:
            rows.append((" ", f"{term} pass {number}: dubblett av {seen}"))
            continue
        taken[(term, number)] = name

        if os.path.exists(target):
            rows.append((" ", f"{term} pass {number}: fanns redan"))
            continue
        if apply:
            shutil.copy(path, target)
        added += 1
        rows.append(("+", f"{term} pass {number}: {found} ELF-uppgifter, facit {answers}/10"))

    for mark, line in sorted(rows, key=lambda r: r[1]):
        print(f" {mark} {line}")

    verb = "lade till" if apply else "kan lägga till"
    print(f"\n{len(pdfs)} filer genomsökta, {verb} {added} provpass.")
    if added and not apply:
        print("Kör om med --apply för att skriva.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
