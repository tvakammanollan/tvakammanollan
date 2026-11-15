"""
Lägger till ETT provtillfälle i arkivet utan att bygga om resten.

`build.py` raderar allt i `src/data/prov/` och bygger ur cachen, vilket ger ett
fattigare arkiv än det som ligger i git (se CLAUDE.md). Det här skriptet
använder samma byggfunktioner men rör bara det nya provets filer:

    python3 scripts/hp-import/fetch.py                    # hämtar häften + facit
    python3 scripts/hp-import/add_exam.py 2026ht          # torrkörning
    python3 scripts/hp-import/add_exam.py 2026ht --apply

Torrkörningen bygger till `.hp-cache/_build/<term>/` och skriver ingenting i
`src/` eller `public/`. Med `--apply` kopieras provpassens JSON och bilder in,
`index.json` får den nya posten, och `exempel.json` och gamla-prov-delen av
`public/sitemap.xml` skrivs om ur indexet.

Provet tas bara emot om det har fyra provpass med 40 uppgifter var och facit
på varje. Ett verbalt pass utan ELF (30 uppgifter) stoppar alltså importen:
hämta originalhäftet till `.hp-cache/<term>/passN-verbal-full.pdf` först.
"""

from __future__ import annotations

import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import build as b  # noqa: E402
from facit import parse_facit  # noqa: E402

DATA = b.OUT_DATA
IMG = b.OUT_IMG


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    apply = "--apply" in sys.argv
    if len(args) != 1:
        print(__doc__)
        return 2
    term = args[0]

    with open(os.path.join(b.CACHE, "sources.json"), encoding="utf-8") as f:
        sources = json.load(f)
    with open(os.path.join(DATA, "index.json"), encoding="utf-8") as f:
        index = json.load(f)["exams"]

    if any(e["term"] == term for e in index):
        print(f"{term} finns redan i index.json. Inget gjort.")
        return 1
    exam = next((e for e in sources if e["term"] == term), None)
    if not exam:
        print(f"{term} står inte i sources.json. Kör fetch.py först.")
        return 1

    season = lambda e: e["date"][:4] + ("vt" if int(e["date"][5:7]) <= 6 else "ht")  # noqa: E731
    doubled = sum(1 for e in sources if season(e) == season(exam)) > 1
    exam["label"] = b.label_for(term, exam["date"], doubled)

    stage = os.path.join(b.CACHE, "_build", term)
    if os.path.isdir(stage):
        shutil.rmtree(stage)
    stage_img = os.path.join(stage, "prov-bilder")
    os.makedirs(stage_img)
    # build_pass läser modulens OUT_IMG; bilderna hamnar i mellanlagret.
    b.OUT_IMG = stage_img

    facit, struck_all = parse_facit(exam["facit_file"])
    entry = {"term": term, "date": exam["date"], "label": exam["label"], "passes": []}
    problems: list[str] = []

    for meta in sorted(exam["passes"], key=lambda p: p["pass"]):
        answers = dict(facit.get(meta["pass"], {}))
        struck = set(struck_all.get(meta["pass"], set()))
        data, issues = b.build_pass(exam, meta, answers, struck)
        name = f"{term}-{meta['pass']}"
        n = len(data["questions"])
        if n != 40:
            issues.append(f"{n} uppgifter, ska vara 40")
        if data["missing"]:
            issues.append("delprov saknas: " + ", ".join(data["missing"]))
        if issues:
            problems.append(f"{name}: " + "; ".join(issues[:5]))
        with open(os.path.join(stage, f"{name}.json"), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        entry["passes"].append(
            {
                "pass": data["pass"],
                "kind": data["kind"],
                "minutes": data["minutes"],
                "questions": n,
                "delprov": [s["code"] for s in data["sections"]],
                "missing": data["missing"],
            }
        )
        counts = ", ".join(f"{s['code']} {s['count']}" for s in data["sections"])
        print(f"  {name}: {n} uppgifter ({counts})")

    entry["questions"] = sum(p["questions"] for p in entry["passes"])
    if len(entry["passes"]) != 4:
        problems.append(f"{len(entry['passes'])} provpass, ska vara 4")

    if problems:
        print("\nProvet tas inte emot:")
        for line in problems:
            print("  " + line)
        return 1

    if not apply:
        print(f"\nTORRKÖRNING. Bygget ligger i {stage}. Kör med --apply.")
        return 0

    for p in entry["passes"]:
        name = f"{term}-{p['pass']}.json"
        shutil.copyfile(os.path.join(stage, name), os.path.join(DATA, name))
    if os.path.isdir(os.path.join(stage_img, term)):
        shutil.copytree(
            os.path.join(stage_img, term), os.path.join(IMG, term), dirs_exist_ok=True
        )

    index.append(entry)
    index.sort(key=lambda e: e["date"], reverse=True)
    with open(os.path.join(DATA, "index.json"), "w", encoding="utf-8") as f:
        json.dump({"exams": index}, f, ensure_ascii=False, separators=(",", ":"))

    # exempel.json tar de nyaste uppgifterna per delprov. Ett nytt provs XYZ och
    # KVA är bildutsnitt tills de skrivits om till text, medan de äldre redan
    # är text. Övningssidorna ska inte gå från text till bild för det, så ett
    # delprov behåller sina gamla exempel om de nya har fler bilduppgifter.
    examples = os.path.join(DATA, "exempel.json")
    with open(examples, encoding="utf-8") as f:
        old = json.load(f)
    b.write_examples(index)
    with open(examples, encoding="utf-8") as f:
        new = json.load(f)
    images = lambda items: sum(1 for i in items if i.get("image"))  # noqa: E731
    kept = [k for k in new if k in old and images(new[k]) > images(old[k])]
    if kept:
        for k in kept:
            new[k] = old[k]
        with open(examples, "w", encoding="utf-8") as f:
            json.dump(new, f, ensure_ascii=False, separators=(",", ":"))
        print("  exempel.json: behöll de gamla exemplen för " + ", ".join(sorted(kept)))
    b.write_sitemap(index)
    print(f"\n{term} tillagt: {entry['questions']} uppgifter i {len(entry['passes'])} provpass.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
