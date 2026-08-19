"""
Rensar bort bildreferenser som pekar på filer som inte finns.

Vårprovet 2012:s kvantitativa provpass byggdes en gång på en annan maskin —
`source` i datan är en macOS-sökväg — där `pass{3,5}-kvant.pdf` fanns i cachen.
JSON:en committades, men de renderade bilderna gjorde det aldrig. Resultatet är
57 uppgifter som pekar på `/prov-bilder/2012vt/p{3,5}/*.webp`, filer som inte
finns i git och aldrig har funnits där. I produktion blir de trasiga bilder.

PDF:erna går inte att få tag på igen: 2012 publicerades den kvantitativa delen
bara som webbsidor med en GIF per uppgift, och de bilderna arkiverades aldrig
(Internet Archive har bara årets broschyr). Uppgiftstexten finns däremot kvar —
importen sparar den för sök och alt-text — och är läsbar i 50 av de 57 fallen.

Skriptet tar därför bort `image`, `crops`, `imageAspect` och `altCount` från de
uppgifter vars bildfil saknas, och sätter `figureMissing` så att kortet kan säga
rakt ut att svarsalternativen inte går att visa. Det är sämre än en uppgift, men
ärligare än en trasig bild — och det gäller alla framtida fall, inte bara 2012.

    python fix_missing_images.py           # torrkörning
    python fix_missing_images.py --apply
"""

from __future__ import annotations

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA = os.path.join(ROOT, "src", "data", "prov")
PUBLIC = os.path.join(ROOT, "public")

# Samma bedömning som kvant._shredded — en text som inte går att läsa duger inte
# som ersättning för den saknade bilden.
_SHRED = [
    re.compile(r"(?:^|\s)[A-Za-z0-9](?:\s+[A-Za-z0-9]){2,}(?:\s|$)"),
    re.compile(r"[<>=+#](?:\s+[<>=+#])+"),
    re.compile(r"=-(?:\s|$)|(?:^|\s)[<>=+]\s*(?:\(|$)"),
]


def shredded(text: str) -> bool:
    return any(p.search(text) for p in _SHRED)


def main() -> int:
    apply = "--apply" in sys.argv
    total = 0
    readable = 0
    per_file: dict[str, int] = {}

    for name in sorted(os.listdir(DATA)):
        if not (name[0].isdigit() and name.endswith(".json")):
            continue
        path = os.path.join(DATA, name)
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        hits = 0
        for q in data.get("questions", []):
            img = q.get("image")
            if not img:
                continue
            if os.path.exists(os.path.join(PUBLIC, img.lstrip("/").replace("/", os.sep))):
                continue

            hits += 1
            for key in ("image", "crops", "imageAspect", "altCount"):
                q.pop(key, None)
            text = q.get("text") or ""
            if text and not shredded(text):
                readable += 1
            else:
                q.pop("text", None)
            q["figureMissing"] = True

        if hits:
            per_file[name] = hits
            total += hits
            if apply:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    for name, n in per_file.items():
        print(f"  {name:16s} {n} uppgifter utan bildfil")
    print()
    print(f"totalt        : {total}")
    print(f"med läsbar text: {readable}")
    print(f"utan användbar text: {total - readable}")
    if not apply:
        print("\nTORRKÖRNING - inget skrevs. Kör med --apply.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
