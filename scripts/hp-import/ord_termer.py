"""
Bygger `src/data/prov/ordtermer.json`: för varje ORD-ord i arkivet, vilka
provtillfällen det förekom på. Ordlistans uppslagssidor läser filen och
länkar till /hogskoleprovet-ord/<termin>.

    python3 scripts/hp-import/ord_termer.py

Sluggen räknas exakt som `ordSlug()` i src/lib/ord-slug.ts. Ändras den där
måste den ändras här, annars matchar ingenting och länkarna försvinner tyst.
Kör om skriptet när arkivet fått ett nytt prov.
"""

import json
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
DATA = os.path.join(ROOT, "src", "data", "prov")
SLUG_ALLOWED = re.compile(r"[^a-z0-9åäöéèêëüïîôûçáàâíóúñ'-]")


def ord_slug(word: str) -> str:
    s = word.strip().lower()
    s = re.sub(r"[’´`]", "'", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = SLUG_ALLOWED.sub("", s)
    return re.sub(r"-{2,}", "-", s)


def main() -> None:
    with open(os.path.join(DATA, "index.json"), encoding="utf-8") as f:
        exams = json.load(f)["exams"]  # nyast först
    out: dict[str, list[str]] = {}
    for exam in exams:
        for p in exam["passes"]:
            if p["kind"] != "verbal":
                continue
            with open(os.path.join(DATA, f"{exam['term']}-{p['pass']}.json"), encoding="utf-8") as f:
                for q in json.load(f)["questions"]:
                    if q["delprov"] != "ORD" or not q.get("text"):
                        continue
                    terms = out.setdefault(ord_slug(q["text"]), [])
                    if exam["term"] not in terms:
                        terms.append(exam["term"])
    with open(os.path.join(DATA, "ordtermer.json"), "w", encoding="utf-8") as f:
        json.dump(dict(sorted(out.items())), f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    print(f"{len(out)} ord")


if __name__ == "__main__":
    main()
