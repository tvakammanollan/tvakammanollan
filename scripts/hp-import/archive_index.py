"""
Bygger ett register över varje provhäfte som någonsin legat på studera.nu.

studera.nu har lagt om sin filstruktur tre gånger sedan 2011:

    2011–2013  /download/18.<episerver-id>/provpass2vejelf12b.pdf
    2013–2016  /globalassets/hogskoleprovet/hp-2015-10-24/provpass1verb.pdf
    2016–      /globalassets/05-hogskoleprovet/hp-2025-04-05/provpass-2-verb-utan-elf.pdf

Filerna från de äldre strukturerna finns kvar i Internet Archive, och de
arkiverades ofta samma år som provet gavs — alltså innan UHR bytte ut häftet
mot versionen utan engelsk läsförståelse. Det är den enda vägen till ELF för
de äldre proven, och till proven före 2013 som inte ens står på dagens
provlista.

    python3 scripts/hp-import/archive_index.py

Skriver .hp-cache/archive-pdfs.json: {adress: tidsstämpel}.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

CACHE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".hp-cache"))
CDX = "http://web.archive.org/cdx/search/cdx"
UA = "tvakommanollan-import/1.0 (+https://tvakommanollan.se; kontakt via sajten)"

# Värdar som har eller har haft provmaterialet. acc.studera.nu är UHR:s
# acceptanstestmiljö, som råkat bli crawlad och ibland har filer kvar som
# städats bort från produktion.
HOSTS = ["studera.nu", "acc.studera.nu", "hsv.se"]

# Filnamnen har hetat allt möjligt. Vi hämtar brett och sorterar sedan.
PATTERNS = ["provpass", "verb", "elf", "facit", "kvant", "hogskoleprov"]


def get(url: str, timeout: int = 300, tries: int = 3) -> str:
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read().decode("utf-8", "replace")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError):
            time.sleep(5 * (attempt + 1))
    return ""


def query(host: str, pattern: str) -> dict[str, str]:
    """Alla arkiverade PDF-adresser på en värd vars adress innehåller pattern."""
    url = (
        f"{CDX}?url={host}&matchType=domain"
        f"&filter=original:.*{pattern}.*"
        "&filter=statuscode:200"
        "&collapse=urlkey&fl=original,timestamp&limit=20000"
    )
    out: dict[str, str] = {}
    for line in get(url).splitlines():
        parts = line.split()
        if len(parts) != 2:
            continue
        address, stamp = parts
        if ".pdf" not in address.lower():
            continue
        # Städa bort spårningsparametrar och trasiga citat ur gamla uppsatser.
        address = address.split("?")[0].split("!")[0]
        if not address.lower().endswith(".pdf"):
            continue
        # Behåll den äldsta kopian: den är gjord närmast provdagen, och det är
        # den som kan ha ELF kvar.
        if address not in out or stamp < out[address]:
            out[address] = stamp
    return out


def main() -> int:
    found: dict[str, str] = {}
    for host in HOSTS:
        for pattern in PATTERNS:
            before = len(found)
            for address, stamp in query(host, pattern).items():
                if address not in found or stamp < found[address]:
                    found[address] = stamp
            print(f"  {host:<16} {pattern:<14} +{len(found) - before:<5} (totalt {len(found)})")
            time.sleep(1)

    os.makedirs(CACHE, exist_ok=True)
    with open(os.path.join(CACHE, "archive-pdfs.json"), "w", encoding="utf-8") as f:
        json.dump(found, f, ensure_ascii=False, indent=0, sort_keys=True)
    print(f"\n{len(found)} arkiverade PDF-adresser sparade.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
