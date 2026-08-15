"""
Steg 1 av gamla-prov-importen: hitta och ladda ner alla provhäften + facit
från UHR:s officiella arkiv på studera.nu.

    python3 scripts/hp-import/fetch.py

Skriver till .hp-cache/ (gitignorerad). Hoppar över filer som redan finns,
så scriptet kan köras om när UHR lagt upp ett nytt provtillfälle.

UHR publicerar de verbala provpassen "utan ELF" — den engelska texten plockas
bort en vecka efter provdagen av upphovsrättsskäl. Därför saknas ELF i allt
som importeras härifrån, och det är inget fel i parsern.
"""

from __future__ import annotations

import html
import json
import os
import re
import sys
import time
import urllib.request

BASE = "https://www.studera.nu"
INDEX_URL = f"{BASE}/hogskoleprov/om/forbereda/tidigare/"
# Senaste provet ligger på en egen sida i stället för under /fpn/.
LATEST_URL = f"{BASE}/hogskoleprov/resultat/resultat/senaste/"

CACHE = os.path.join(os.path.dirname(__file__), "..", "..", ".hp-cache")
CACHE = os.path.abspath(CACHE)

MONTHS = {
    "januari": 1, "februari": 2, "mars": 3, "april": 4, "maj": 5, "juni": 6,
    "juli": 7, "augusti": 8, "september": 9, "oktober": 10, "november": 11,
    "december": 12,
}

UA = "hpkampen-import/1.0 (+https://hpkampen.se; kontakt via sajten)"


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def download(url: str, path: str) -> bool:
    """Laddar ner om filen inte finns. Returnerar True om något hämtades."""
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = get(url)
    with open(path, "wb") as f:
        f.write(data)
    time.sleep(0.4)  # var snäll mot UHR:s server
    return True


def parse_date(label: str) -> str | None:
    """'Högskoleprovet 5 april 2025' → '2025-04-05'."""
    m = re.search(r"(\d{1,2})\s+([a-zåäö]+)\s+(\d{4})", label.lower())
    if not m or m.group(2) not in MONTHS:
        return None
    return f"{m.group(3)}-{MONTHS[m.group(2)]:02d}-{int(m.group(1)):02d}"


def term_id(date: str, same_season: list[str]) -> str:
    """
    '2025-04-05' → '2025vt'. Vissa år (2021, 2022) hade två vårprov; då blir
    det '2022vta' (första) och '2022vtb' (andra), vilket matchar regexen i
    src/types/gamla-prov.ts.
    """
    year, month = date[:4], int(date[5:7])
    season = "vt" if month <= 6 else "ht"
    siblings = sorted(d for d in same_season if d[:4] == year and (int(d[5:7]) <= 6) == (month <= 6))
    if len(siblings) == 1:
        return f"{year}{season}"
    return f"{year}{season}{'ab'[siblings.index(date)]}"


def classify(pdf_url: str) -> tuple[str, int] | None:
    """
    Filnamnen har bytt form ett antal gånger sedan 2013. Returnerar
    ('verbal'|'kvant', provpassnummer) eller None för allt annat
    (källförteckning, svarshäfte, anvisningar, normeringstabeller).
    """
    name = pdf_url.rsplit("/", 1)[-1].lower()
    if "kallhanv" in name or "kallor" in name or "kallforteckning" in name:
        return None
    if "svarshafte" in name or "anvisningar" in name or "exempel" in name:
        return None
    if name.startswith("norm") or "normering" in pdf_url.lower():
        return None

    # Bara version 1 när ett prov gavs i flera versioner (2018vt hade åtta).
    if re.search(r"version[-_ ]?([2-9])", name):
        return None

    kind = None
    if "verb" in name:
        kind = "verbal"
    elif "kvant" in name:
        kind = "kvant"
    if kind is None:
        return None

    # '...del-3_kvantitativ...', 'provpass-3-kvant', 'provpass3kvant',
    # '211024-provpass-2-verb...', 'provpass-1-2-kvant' (2019ht: pass 1 version 2)
    m = re.search(r"(?:provpass|del)[-_ ]?(\d)", name)
    if not m:
        return None
    return kind, int(m.group(1))


def main() -> int:
    print(f"Hämtar provindex från {INDEX_URL}")
    index_html = get(INDEX_URL).decode("utf-8", "replace")

    exams: list[dict] = []
    seen: set[str] = set()
    for href, text in re.findall(r'href="([^"]+)"[^>]*>(.*?)</a>', index_html, re.S):
        label = html.unescape(re.sub(r"<[^>]+>", "", text)).strip()
        if not label.startswith("Högskoleprovet "):
            continue
        date = parse_date(label)
        if not date:
            continue  # t.ex. "Högskoleprovet för dig med synskada"
        url = href if href.startswith("http") else BASE + href
        if url in seen:
            continue
        seen.add(url)
        exams.append({"date": date, "page": url})

    all_dates = [e["date"] for e in exams]
    for e in exams:
        e["term"] = term_id(e["date"], all_dates)
    exams.sort(key=lambda e: e["date"], reverse=True)
    print(f"  {len(exams)} provtillfällen ({exams[-1]['date']} – {exams[0]['date']})")

    for e in exams:
        page = get(e["page"]).decode("utf-8", "replace")
        pdfs = sorted(set(re.findall(r'href="([^"]+\.pdf)"', page)))
        e["passes"] = []
        e["facit"] = None
        taken: set[int] = set()
        for p in pdfs:
            url = p if p.startswith("http") else BASE + p
            name = url.rsplit("/", 1)[-1].lower()
            # HT25 döpte facit till 'hp-25b.pdf' — matcha på ordet 'facit' eller
            # på formen hp-<år><a|b>.pdf.
            is_facit = "facit" in name or re.fullmatch(r"hp-\d{2}[ab]\.pdf", name)
            # 'facit_elf_exempelprov.pdf' ligger på flera provsidor och är inte
            # provets facit — den sorterar dessutom före det riktiga.
            if "exempel" in url.lower():
                is_facit = False
            if is_facit and e["facit"] is None and not re.search(r"version-[2-9]", name):
                e["facit"] = url
                continue
            hit = classify(url)
            # Vissa år ligger samma provpass uppe i flera versioner
            # (2019ht, 2018vt) — vi importerar version 1.
            if hit and hit[1] not in taken:
                taken.add(hit[1])
                e["passes"].append({"kind": hit[0], "pass": hit[1], "url": url})
        e["passes"].sort(key=lambda p: p["pass"])

        got = 0
        for p in e["passes"]:
            p["file"] = os.path.join(CACHE, e["term"], f"pass{p['pass']}-{p['kind']}.pdf")
            got += download(p["url"], p["file"])
        if e["facit"]:
            e["facit_file"] = os.path.join(CACHE, e["term"], "facit.pdf")
            got += download(e["facit"], e["facit_file"])

        flag = "" if len(e["passes"]) == 4 and e["facit"] else "  ⚠"
        print(
            f"  {e['term']:<8} {e['date']}  {len(e['passes'])} provpass"
            f"  facit={'ja' if e['facit'] else 'NEJ'}  (+{got} nya){flag}"
        )

    os.makedirs(CACHE, exist_ok=True)
    with open(os.path.join(CACHE, "sources.json"), "w", encoding="utf-8") as f:
        json.dump(exams, f, ensure_ascii=False, indent=1)
    print(f"\nKlart. Källförteckning: {os.path.join(CACHE, 'sources.json')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
