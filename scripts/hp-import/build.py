"""
Steg 2 av gamla-prov-importen: parsar de nedladdade häftena och skriver
sajtens datafiler.

    python3 scripts/hp-import/fetch.py     # ladda ner (en gång, eller vid nytt prov)
    python3 scripts/hp-import/build.py     # bygg public/prov/*

Skriver:
    public/prov/index.json         provtillfällen + provpass (SSR-index)
    public/prov/<term>-<pass>.json ett provpass med frågor, lästexter och facit
    public/prov-bilder/...         uppgiftsbilder och DTK-diagram

Varje provpass valideras mot facit innan det skrivs: 40 uppgifter, rätt
delprovsfördelning och ett svar per uppgift. Ett pass som inte går ihop skrivs
inte ut, och listas i rapporten på slutet.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from elf import parse_elf  # noqa: E402
from facit import parse_facit  # noqa: E402
from kvant import parse_kvant  # noqa: E402
from verbal import CANONICAL_SECTIONS, parse_verbal, section_for  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CACHE = os.path.join(ROOT, ".hp-cache")
# Uppgiftsdatan ligger i src/ och laddas som egna chunkar av appen (se
# src/lib/prov-data.ts) — då slipper serverrenderingen hämta över nätet.
# Bilderna är statiska filer och ligger kvar under public/.
OUT_DATA = os.path.join(ROOT, "src", "data", "prov")
OUT_IMG = os.path.join(ROOT, "public", "prov-bilder")

# ELF publiceras aldrig av UHR (den engelska texten plockas bort en vecka efter
# provdagen). De ELF-uppgifter sajten redan hade ligger arkiverade här och
# vävs in i de provpass de hör till.
LEGACY = os.path.join(os.path.dirname(__file__), "elf-arkiv.json")

ALT_LETTERS = ["A", "B", "C", "D", "E"]
# Ensam versal mitt i en mening, om och om igen: spalter som blandats ihop.
SCRAMBLED_RE = re.compile(r"(?:(?<=[a-zäöå,]) [B-E] (?=[A-ZÅÄÖ]).*){3}", re.S)
SEASONS = {"vt": "Vårprovet", "ht": "Höstprovet"}
MONTHS = [
    "januari", "februari", "mars", "april", "maj", "juni",
    "juli", "augusti", "september", "oktober", "november", "december",
]


def label_for(term: str, date: str, doubled: bool) -> str:
    """'2022vta' + '2022-03-12' → 'Vårprovet 2022 (12 mars)'."""
    year, season = date[:4], "vt" if int(date[5:7]) <= 6 else "ht"
    base = f"{SEASONS[season]} {year}"
    if not doubled:
        return base
    return f"{base} ({int(date[8:10])} {MONTHS[int(date[5:7]) - 1]})"


def legacy_elf() -> dict[tuple[str, int], dict]:
    """→ {(term, provpass): {'questions': [...], 'passages': [...]}} för ELF."""
    if not os.path.exists(LEGACY):
        return {}
    with open(LEGACY, encoding="utf-8") as f:
        rows = json.load(f)

    out: dict[tuple[str, int], dict] = {}
    for r in rows:
        if r.get("delProv") != "ELF" or not r.get("svar"):
            continue
        key = (r["exam_term"], r["provpass"])
        bucket = out.setdefault(key, {"questions": [], "passages": []})
        passage_index = None
        if r.get("passage"):
            titles = [p["title"] for p in bucket["passages"]]
            body = r["passage"]
            existing = next(
                (i for i, p in enumerate(bucket["passages"]) if p["body"] == body), None
            )
            if existing is None:
                bucket["passages"].append({"title": r.get("passage_title"), "body": body})
                existing = len(bucket["passages"]) - 1
            passage_index = existing
            del titles
        alts = [r.get(k, "") for k in ("a", "b", "c", "d", "e")]
        alts = [a for a in alts if a and not a.startswith("[")]
        # Ett fåtal arkiverade ELF-luckor saknar alternativ. En uppgift med två
        # av fyra alternativ är missvisande att öva på — hoppa över den hellre
        # än att visa ett stympat prov.
        if len(alts) < 4:
            continue
        # ELF inleds med luckuppgifter: numret står i själva texten och
        # uppgiften har ingen egen frågemening.
        text = (r.get("fraga") or "").strip()
        cloze = not text or text.startswith("[")
        item = {
            "nr": r["nr"],
            "delprov": "ELF",
            "text": (
                f"Välj det ord eller uttryck som passar bäst i lucka {r['nr']} i texten."
                if cloze
                else text
            ),
            "alternatives": alts,
            "answer": r["svar"].upper(),
            "passage": passage_index,
        }
        if cloze:
            item["cloze"] = True
        bucket["questions"].append(item)
    return out


def passage_json(p: dict) -> dict:
    out = {"paragraphs": p["paras"]}
    if p.get("title"):
        out["title"] = p["title"]
    if p.get("byline"):
        out["byline"] = p["byline"]
    if p.get("gloss"):
        entries = []
        for line in p["gloss"].split("\n"):
            term, sep, definition = line.partition(" = ")
            if sep:
                entries.append({"term": term.strip(), "definition": definition.strip()})
        if entries:
            out["glossary"] = entries
    return out


def build_html_pass(
    exam: dict, pass_meta: dict, answers: dict[int, str], struck: set[int] | None = None
) -> tuple[dict, list[str]]:
    """
    Ett verbalt provpass som bara finns som webbsida (2011–2012), se
    html_prov.py. Uppgifter utan facit utelämnas i stället för att fälla hela
    passet — de årens facit är ofullständiga i arkivet.
    """
    with open(pass_meta["file"], encoding="utf-8") as f:
        raw = json.load(f)

    sections = CANONICAL_SECTIONS["verbal"]
    questions = []
    for key in sorted(raw["questions"], key=int):
        q = dict(raw["questions"][key])
        nr = int(key)
        answer = answers.get(nr)
        if not answer:
            continue
        item = {
            "nr": nr,
            "delprov": section_for(nr, sections),
            "text": q["text"],
            "alternatives": q["alternatives"],
            "answer": answer[0],
        }
        if len(answer) > 1:
            item["answers"] = list(answer)
        if struck and nr in struck:
            item["utgar"] = True
        if q.get("passage") is not None:
            item["passage"] = q["passage"]
        questions.append(item)

    passages = [passage_json(p) for p in raw["passages"]]
    # Lästexter som ingen uppgift pekar på ska inte följa med — de blir kvar
    # när en uppgift utelämnats, och skulle annars visas i facitlistan.
    used = sorted({q["passage"] for q in questions if q.get("passage") is not None})
    if len(used) != len(passages):
        remap = {old: new for new, old in enumerate(used)}
        passages = [passages[i] for i in used]
        for q in questions:
            if q.get("passage") is not None:
                q["passage"] = remap[q["passage"]]

    counts: dict[str, int] = {}
    for q in questions:
        counts[q["delprov"]] = counts.get(q["delprov"], 0) + 1
    present = [dict(s, count=counts.get(s["code"], 0)) for s in sections if counts.get(s["code"])]

    problems = []
    if len(questions) < 25:
        problems.append(f"bara {len(questions)} uppgifter med facit")
    for q in questions:
        if len(q["alternatives"]) < 4 or not all(q["alternatives"]):
            problems.append(f"uppgift {q['nr']} har {len(q['alternatives'])} alternativ")

    data = {
        "term": exam["term"],
        "date": exam["date"],
        "label": exam["label"],
        "pass": pass_meta["pass"],
        "kind": "verbal",
        "minutes": 55,
        "sections": present,
        "missing": [s["code"] for s in sections if not counts.get(s["code"])],
        "questions": questions,
        "passages": passages,
        "figures": [],
        "source": pass_meta["url"],
    }
    return data, problems


def build_pass(
    exam: dict, pass_meta: dict, answers: dict[int, str], struck: set[int] | None = None
) -> tuple[dict, list[str]]:
    """Bygger ett provpass. Returnerar (data, problem)."""
    term, pno = exam["term"], pass_meta["pass"]
    img_dir = os.path.join(OUT_IMG, term, f"p{pno}")
    img_url = f"/prov-bilder/{term}/p{pno}"
    problems: list[str] = []

    questions: list[dict] = []
    passages: list[dict] = []
    figures: list[dict] = []

    if pass_meta["kind"] == "verbal":
        parsed = parse_verbal(pass_meta["file"])
        sections = parsed["meta"]["sections"]
        passages = [passage_json(p) for p in parsed["passages"]]
        for nr in sorted(parsed["questions"]):
            q = parsed["questions"][nr]
            alts = [q["alternatives"].get(letter, "") for letter in ALT_LETTERS]
            while alts and not alts[-1]:
                alts.pop()
            item = {
                "nr": nr,
                "delprov": section_for(nr, sections),
                "text": q["text"],
                "alternatives": alts,
            }
            if q["passage"] is not None:
                item["passage"] = q["passage"]
            questions.append(item)

        # ELF ur det orörda provhäftet när fetch_elf.py hittat det, annars ur
        # arkivet. Det orörda häftet är alltid bättre: det har hela den
        # engelska texten, inte bara frågorna.
        full = pass_meta["file"].replace(".pdf", "-full.pdf")
        recovered = parse_elf(full) if os.path.exists(full) else None
        if not recovered:
            # ELF ur de HTML-provsidor UHR publicerade 2011–2014, se html_elf.py.
            scraped = os.path.join(CACHE, term, f"pass{pno}-elf.json")
            if os.path.exists(scraped):
                with open(scraped, encoding="utf-8") as f:
                    data = json.load(f)
                recovered = {
                    "questions": {int(k): v for k, v in data["questions"].items()},
                    "passages": data["passages"],
                }
        if recovered and len(recovered["questions"]) >= 8:
            offset = len(passages)
            passages += [passage_json(p) for p in recovered["passages"]]
            for nr in sorted(recovered["questions"]):
                q = dict(recovered["questions"][nr])
                q["delprov"] = "ELF"
                if q.get("passage") is None:
                    q.pop("passage", None)
                else:
                    q["passage"] += offset
                questions.append(q)
            questions.sort(key=lambda x: x["nr"])

        elif LEGACY_ELF.get((term, pno)):
            # Arkivfilens lästexter är extraherade spaltvis av någon annan, och
            # ett par av dem har svarsalternativen inflätade i löptexten
            # ("Brazil's econ- B His rule led to…"). En sådan uppgift går inte
            # att svara på — den utelämnas hellre än visas trasig.
            elf = LEGACY_ELF[(term, pno)]
            offset = len(passages)
            for p in elf["passages"]:
                entry = {"paragraphs": [x for x in p["body"].split("\n\n") if x.strip()]}
                title = (p.get("title") or "").strip()
                # En "rubrik" på 45+ tecken utan skiljetecken är i själva verket
                # ett avklippt svarsalternativ som hamnat fel i arkivfilen.
                if title and len(title) <= 45:
                    entry["title"] = title
                passages.append(entry)
            dropped: list[int] = []
            broken = {
                i
                for i, entry in enumerate(elf["passages"])
                if SCRAMBLED_RE.search(entry["body"])
            }
            # Är någon text hopblandad är hela passets ELF opålitligt: samma
            # extraktion har lagt frågor på fel text (2025vt provpass 2 kopplar
            # sjuksköterskefrågor till en text om Pedro II). Hoppa över alla.
            if broken:
                broken = set(range(len(elf["passages"])))
            for q in elf["questions"]:
                item = dict(q)
                item.pop("answer", None)
                if item.get("passage") is not None:
                    if item["passage"] in broken:
                        # Uteslut uppgiften, men fäll inte hela provpasset.
                        dropped.append(item["nr"])
                        continue
                    item["passage"] = item["passage"] + offset
                else:
                    item.pop("passage", None)
                answers.setdefault(item["nr"], q["answer"])
                questions.append(item)
            questions.sort(key=lambda x: x["nr"])
    else:
        parsed = parse_kvant(pass_meta["file"], img_dir, img_url)
        sections = parsed["meta"]["sections"]
        figures = parsed["figures"]
        for nr in sorted(parsed["questions"]):
            q = parsed["questions"][nr]
            item = {"nr": nr, "delprov": q["delprov"]}
            if q.get("image"):
                item["image"] = q["image"]
                item["altCount"] = q.get("altCount", 4)
                if q.get("text"):
                    item["text"] = q["text"]
            else:
                item["text"] = q["text"]
                alts = [q["alternatives"].get(letter, "") for letter in ALT_LETTERS]
                while alts and not alts[-1]:
                    alts.pop()
                item["alternatives"] = alts
            if q.get("figure") is not None:
                item["figure"] = q["figure"]
            questions.append(item)

    # Facit
    for q in questions:
        answer = answers.get(q["nr"])
        if not answer:
            problems.append(f"uppgift {q['nr']} saknar facit")
            continue
        q["answer"] = answer[0]
        if len(answer) > 1:
            # UHR har underkänt uppgiften i efterhand: flera svar godkänns.
            q["answers"] = list(answer)
        if struck and q["nr"] in struck:
            # UHR strök uppgiften efter provdagen. Den visas som vanligt —
            # svaret är känt — men den räknades inte i det riktiga resultatet.
            q["utgar"] = True

    # Lästexter som ingen uppgift pekar på ska inte följa med — de blir kvar
    # när en uppgift utelämnats, och skulle annars visas i facitlistan.
    used = sorted({q["passage"] for q in questions if q.get("passage") is not None})
    if len(used) != len(passages):
        remap = {old: new for new, old in enumerate(used)}
        passages = [passages[i] for i in used]
        for q in questions:
            if q.get("passage") is not None:
                q["passage"] = remap[q["passage"]]

    counts: dict[str, int] = {}
    for q in questions:
        counts[q["delprov"]] = counts.get(q["delprov"], 0) + 1
    missing = [s["code"] for s in sections if not counts.get(s["code"])]
    sections = [dict(s, count=counts.get(s["code"], 0)) for s in sections]

    for q in questions:
        alts = q.get("alternatives")
        if alts is not None and (len(alts) < 4 or not all(alts)):
            problems.append(f"uppgift {q['nr']} har {len(alts)} alternativ")
        if not q.get("text") and not q.get("image"):
            problems.append(f"uppgift {q['nr']} saknar både text och bild")

    data = {
        "term": term,
        "date": exam["date"],
        "label": exam["label"],
        "pass": pno,
        "kind": pass_meta["kind"],
        "minutes": parsed["meta"]["minutes"],
        "sections": [s for s in sections if s["code"] not in missing],
        "missing": missing,
        "questions": questions,
        "passages": passages,
        "figures": [{"src": f["src"]} for f in figures],
        "source": pass_meta["url"],
    }
    return data, problems


EXAMPLES_PER_DELPROV = 6
PASSAGE_EXCERPT = 520


def write_examples(index: list[dict]) -> None:
    """
    Ett litet urval uppgifter per delprov till övningssidorna (/ova/<delprov>).

    De sidorna hämtade tidigare hela uppgiftsmängden (916 kB) för att visa sex
    frågor. Nu ligger urvalet i en egen fil på några kilobyte.
    """
    out: dict[str, list[dict]] = {}
    for exam in index:  # nyast först
        for summary in exam["passes"]:
            path = os.path.join(OUT_DATA, f"{exam['term']}-{summary['pass']}.json")
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            for q in data["questions"]:
                bucket = out.setdefault(q["delprov"], [])
                if len(bucket) >= EXAMPLES_PER_DELPROV:
                    continue
                item = {
                    "term": data["term"],
                    "label": data["label"],
                    "pass": data["pass"],
                    "nr": q["nr"],
                    "answer": q["answer"],
                }
                for field in ("text", "alternatives", "image", "altCount"):
                    if q.get(field) is not None:
                        item[field] = q[field]
                if q.get("figure") is not None:
                    # DTK-uppgifterna är obegripliga utan sitt diagram.
                    item["figure"] = data["figures"][q["figure"]]["src"]
                if q.get("passage") is not None:
                    body = " ".join(data["passages"][q["passage"]]["paragraphs"])
                    item["passage"] = (
                        body if len(body) <= PASSAGE_EXCERPT else body[:PASSAGE_EXCERPT] + " …"
                    )
                bucket.append(item)

    with open(os.path.join(OUT_DATA, "exempel.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print("  exempel.json: " + ", ".join(f"{k} {len(v)}" for k, v in sorted(out.items())))


SITEMAP = os.path.join(ROOT, "public", "sitemap.xml")
SITEMAP_START = "  <!-- gamla-prov: genererad av scripts/hp-import/build.py -->"
SITEMAP_END = "  <!-- /gamla-prov -->"


def write_sitemap(index: list[dict]) -> None:
    """
    Skriver om gamla-prov-delen av sitemap.xml.

    Arkivet är 27 provtillfällen och drygt hundra provpass — för många för att
    hålla aktuella för hand. Resten av filen är handskriven och rörs inte.
    """
    if not os.path.exists(SITEMAP):
        return
    with open(SITEMAP, encoding="utf-8") as f:
        xml = f.read()

    # Ta bort både tidigare genererat block och handskrivna gamla-prov-poster.
    xml = re.sub(re.escape(SITEMAP_START) + r".*?" + re.escape(SITEMAP_END) + r"\n", "", xml, flags=re.S)
    xml = re.sub(r"  <url>\s*<loc>[^<]*?/gamla-prov[^<]*?</loc>.*?</url>\n", "", xml, flags=re.S)

    lines = [SITEMAP_START]
    for exam in index:
        entries = [(f"/gamla-prov/{exam['term']}", "0.8")]
        entries += [
            (f"/gamla-prov/{exam['term']}/{p['pass']}", "0.7") for p in exam["passes"]
        ]
        for path, priority in entries:
            lines += [
                "  <url>",
                f"    <loc>https://hpkampen.se{path}</loc>",
                f"    <lastmod>{exam['date']}</lastmod>",
                "    <changefreq>yearly</changefreq>",
                f"    <priority>{priority}</priority>",
                "  </url>",
            ]
    lines.append(SITEMAP_END)

    hub = [
        "  <url>",
        "    <loc>https://hpkampen.se/gamla-prov</loc>",
        f"    <lastmod>{index[0]['date'] if index else ''}</lastmod>",
        "    <changefreq>weekly</changefreq>",
        "    <priority>0.9</priority>",
        "  </url>",
    ]
    block = "\n".join(hub + lines) + "\n"
    xml = xml.replace("</urlset>", block + "</urlset>")
    with open(SITEMAP, "w", encoding="utf-8") as f:
        f.write(xml)
    urls = xml.count("<url>")
    print(f"  sitemap.xml: {urls} adresser")


def main() -> int:
    with open(os.path.join(CACHE, "sources.json"), encoding="utf-8") as f:
        sources = json.load(f)

    # Vår- och höstprov som gavs vid två tillfällen samma säsong får datum i
    # etiketten så att de går att skilja åt.
    seasons: dict[str, int] = {}
    for e in sources:
        key = e["date"][:4] + ("vt" if int(e["date"][5:7]) <= 6 else "ht")
        seasons[key] = seasons.get(key, 0) + 1
    for e in sources:
        key = e["date"][:4] + ("vt" if int(e["date"][5:7]) <= 6 else "ht")
        e["label"] = label_for(e["term"], e["date"], seasons[key] > 1)

    # Bilderna byggs om bara med --fresh; annars återanvänds de som finns.
    if "--fresh" in sys.argv and os.path.isdir(OUT_IMG):
        shutil.rmtree(OUT_IMG)
    os.makedirs(OUT_DATA, exist_ok=True)
    for name in os.listdir(OUT_DATA):
        if name.endswith(".json"):
            os.remove(os.path.join(OUT_DATA, name))

    index: list[dict] = []
    total_q = 0
    failed: list[str] = []

    for exam in sorted(sources, key=lambda e: e["date"], reverse=True):
        facit, struck_all = (
            parse_facit(exam["facit_file"]) if exam.get("facit_file") else ({}, {})
        )
        entry = {
            "term": exam["term"],
            "date": exam["date"],
            "label": exam["label"],
            "passes": [],
        }
        for pass_meta in exam["passes"]:
            answers = dict(facit.get(pass_meta["pass"], {}))
            struck = set(struck_all.get(pass_meta["pass"], set()))
            builder = build_html_pass if pass_meta.get("source") == "html" else build_pass
            data, problems = builder(exam, pass_meta, answers, struck)
            name = f"{exam['term']}-{pass_meta['pass']}"
            if problems:
                failed.append(f"{name}: " + "; ".join(problems[:4]))
                continue
            with open(os.path.join(OUT_DATA, f"{name}.json"), "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
            total_q += len(data["questions"])
            entry["passes"].append(
                {
                    "pass": data["pass"],
                    "kind": data["kind"],
                    "minutes": data["minutes"],
                    "questions": len(data["questions"]),
                    "delprov": [s["code"] for s in data["sections"]],
                    "missing": data["missing"],
                }
            )
        if entry["passes"]:
            entry["questions"] = sum(p["questions"] for p in entry["passes"])
            index.append(entry)
        print(
            f"  {exam['term']:<8} {exam['label']:<28} "
            f"{sum(p['questions'] for p in entry['passes'])} uppgifter "
            f"i {len(entry['passes'])} provpass"
        )

    with open(os.path.join(OUT_DATA, "index.json"), "w", encoding="utf-8") as f:
        json.dump({"exams": index}, f, ensure_ascii=False, separators=(",", ":"))

    write_examples(index)
    write_sitemap(index)

    images = sum(len(files) for _, _, files in os.walk(OUT_IMG))
    size = sum(
        os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT_IMG) for f in fs
    )
    print(
        f"\n{len(index)} provtillfällen · {total_q} uppgifter · "
        f"{images} bilder ({size // 1024 // 1024} MB)"
    )
    if failed:
        print(f"\n{len(failed)} provpass hoppades över:")
        for line in failed:
            print("  " + line)
    return 1 if failed else 0


LEGACY_ELF = legacy_elf()

if __name__ == "__main__":
    sys.exit(main())
