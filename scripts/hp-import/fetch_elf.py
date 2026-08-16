"""
Steg 1b: letar upp provhäftena i sitt ursprungliga skick, med ELF.

UHR publicerar hela häftet på provdagen och ersätter det en vecka senare med en
version utan engelsk läsförståelse — de filer som ligger länkade heter därför
`...-utan-elf.pdf`. Originalet tas däremot inte bort: det ligger kvar på samma
server under sitt gamla namn, bara avlänkat från sidan. Där det ändå städats
bort finns det oftast kvar i Internet Archive.

Scriptet gissar originalnamnet ur det avskalade namnet, provar varje kandidat
live och sedan i arkivet, och behåller de filer som faktiskt innehåller ett
ELF-avsnitt.

    python3 scripts/hp-import/fetch_elf.py

Sparar till .hp-cache/<termin>/passN-verbal-full.pdf och skriver
.hp-cache/elf-sources.json. build.py plockar upp dem automatiskt.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from elf import parse_elf  # noqa: E402

CACHE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".hp-cache"))
UA = "hpkampen-import/1.0 (+https://hpkampen.se; kontakt via sajten)"
CDX = "http://web.archive.org/cdx/search/cdx"

# Alla stavningar UHR använt för "utan ELF" genom åren.
ELF_MARKER = re.compile(r"[-_]?(?:utan|ej|u)[-_]?elf", re.I)


def get(url: str, timeout: int = 90) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError):
        return None


def has_elf(data: bytes) -> bool:
    """
    Sant bara om ELF-uppgifterna går att läsa ut ur PDF:en.

    Att leta efter rubriken räcker inte: framsidans tabell över delproven
    nämner ELF i varje häfte, även i de avskalade, och de har dessutom kvar
    blankade ELF-sidor med löpande sidhuvud. Vi kör riktiga parsern i stället.
    """
    try:
        parsed = parse_elf(data)
    except Exception:
        return False
    return bool(parsed) and len(parsed["questions"]) >= 8


_PAGE_LINKS: dict[str, list[str]] = {}


def linked_on_provdagen(page: str, date: str) -> list[str]:
    """
    PDF-adresserna som provets egen sida länkade veckan efter provdagen.

    Det är den säkraste källan till originalets filnamn: sidan pekade då på
    hela häftet, innan UHR bytte ut det mot versionen utan ELF. Internet
    Archive har fångat flera av proven inom några dagar.
    """
    if page in _PAGE_LINKS:
        return _PAGE_LINKS[page]
    query = f"{CDX}?url={urllib.parse.quote(page, safe='')}&fl=timestamp&limit=8"
    listing = (get(query, timeout=60) or b"").decode("utf-8", "replace")
    out: list[str] = []
    for stamp in listing.split():
        if not stamp.isdigit() or stamp[:8] < date.replace("-", ""):
            continue
        html = (get(f"https://web.archive.org/web/{stamp}id_/{page}", timeout=120) or b"").decode(
            "utf-8", "replace"
        )
        for href in re.findall(r'href="([^"]+\.pdf)"', html):
            href = href.split("?")[0]
            if href.startswith("/"):
                href = "https://www.studera.nu" + href
            if "verb" in href.lower() and href not in out:
                out.append(href)
        if out:
            break
    _PAGE_LINKS[page] = out
    return out


def candidates(url: str, pass_no: int) -> list[str]:
    """Tänkbara adresser till originalhäftet, i tur och ordning."""
    folder, name = url.rsplit("/", 1)
    stem = name[:-4] if name.lower().endswith(".pdf") else name
    exam_folder = folder.rsplit("/provpass", 1)[0].rsplit("/fragor", 1)[0]

    bases: list[str] = []

    def add(value: str) -> None:
        if value and value not in bases:
            bases.append(value)

    # 1. Samma namn utan "utan elf"-ändelsen, och några stavningsvarianter.
    plain = ELF_MARKER.sub("", stem)
    plain = re.sub(r"(\d{2}[ab])u$", r"\1", plain)  # provpass3verb14auelf → …14a
    add(f"{folder}/{plain}.pdf")
    add(f"{folder}/{plain.replace('verbal', 'verb')}.pdf")
    add(f"{folder}/{plain.replace('verb', 'verbal')}.pdf")
    add(f"{folder}/{plain}-del.pdf")

    # 2. De namnformer UHR använt för orörda häften.
    for pattern in (
        f"provpass-{pass_no}-verb",
        f"provpass-{pass_no}-verbal",
        f"provpass-{pass_no}---verbal-del",
        f"provpass-{pass_no}-verbal-del",
        f"provpass-{pass_no}-verb-del",
        f"provpass{pass_no}verb",
        f"provpass{pass_no}verbal",
        f"provpass-{pass_no}",
    ):
        add(f"{exam_folder}/{pattern}.pdf")
        if exam_folder != folder:
            add(f"{folder}/{pattern}.pdf")

    # 3. 'hogskoleprovet-2018-10-21-del-3_verbal-del-utan-elf' → utan ändelsen.
    m = re.match(r"(.*_verbal-del)", plain)
    if m:
        add(f"{folder}/{m.group(1)}.pdf")
    return bases


_INVENTORY: dict[str, dict[str, str]] = {}


def inventory(folder: str) -> dict[str, str]:
    """
    Arkiverade adresser i en provmapp → {adress: tidsstämpel}.

    En fråga per mapp, inte en per kandidat: Internet Archives CDX-tjänst tar
    flera sekunder per anrop, och kandidaterna är ett femtontal per provpass.
    """
    if folder in _INVENTORY:
        return _INVENTORY[folder]
    query = (
        f"{CDX}?url={urllib.parse.quote(folder, safe='')}/*"
        "&fl=original,timestamp,statuscode&collapse=urlkey&limit=500"
    )
    listing = get(query, timeout=120)
    out: dict[str, str] = {}
    for line in (listing or b"").decode("utf-8", "replace").splitlines():
        parts = line.split()
        if len(parts) >= 3 and parts[2] == "200" and ".pdf" in parts[0].lower():
            out[parts[0].split("?")[0]] = parts[1]
    _INVENTORY[folder] = out
    return out


def wayback(url: str) -> bytes | None:
    """Arkiverad kopia av en exakt adress, om någon finns."""
    folder = url.rsplit("/", 1)[0]
    stamp = inventory(folder).get(url)
    if not stamp:
        return None
    data = get(f"https://web.archive.org/web/{stamp}id_/{url}", timeout=180)
    return data if data and data[:4] == b"%PDF" else None


def main() -> int:
    with open(os.path.join(CACHE, "sources.json"), encoding="utf-8") as f:
        sources = json.load(f)

    found: dict[str, dict] = {}
    missing: list[str] = []

    for exam in sources:
        for p in exam["passes"]:
            if p["kind"] != "verbal":
                continue
            target = os.path.join(CACHE, exam["term"], f"pass{p['pass']}-verbal-full.pdf")
            label = f"{exam['term']} pass {p['pass']}"
            if os.path.exists(target) and os.path.getsize(target) > 0:
                found[label] = {"file": target, "source": "cache"}
                print(f"  {label:<22} redan hämtad")
                continue

            def for_this_pass(u: str) -> bool:
                low = u.lower()
                return (
                    f"-{p['pass']}-" in low
                    or f"{p['pass']}verb" in low
                    or f"del-{p['pass']}" in low
                    or f"del-{p['pass']}_" in low
                )

            urls = [u for u in linked_on_provdagen(exam["page"], exam["date"]) if for_this_pass(u)]
            urls += [u for u in candidates(p["url"], p["pass"]) if u not in urls]
            # Sista utvägen: varje arkiverad verbal PDF i provets mapp, även de
            # med namn vi inte kunnat gissa.
            folder = p["url"].rsplit("/", 1)[0]
            urls += [
                u
                for u in inventory(folder)
                if "verb" in u.lower() and for_this_pass(u) and u not in urls
            ]
            hit = None
            for where, fetch in (("live", get), ("arkiv", wayback)):
                for url in urls:
                    data = fetch(url)
                    if data and data[:4] == b"%PDF" and has_elf(data):
                        hit = (url, where, data)
                        break
                    time.sleep(0.15)
                if hit:
                    break

            if not hit:
                missing.append(label)
                print(f"  {label:<22} ✗ hittades inte")
                continue

            url, where, data = hit
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "wb") as f:
                f.write(data)
            found[label] = {"file": target, "source": url, "via": where}
            print(f"  {label:<22} ✓ {where}: {url.rsplit('/', 1)[-1]}")

    with open(os.path.join(CACHE, "elf-sources.json"), "w", encoding="utf-8") as f:
        json.dump(found, f, ensure_ascii=False, indent=1)

    total = len(found) + len(missing)
    print(f"\nHittade originalhäftet för {len(found)} av {total} verbala provpass.")
    if missing:
        print("Saknas: " + ", ".join(missing))
    return 0


if __name__ == "__main__":
    sys.exit(main())
