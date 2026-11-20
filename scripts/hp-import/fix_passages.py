"""
Lagar lästexterna i ett redan byggt arkiv, utan att bygga om det.

`verbal.parse_verbal` startar en ny lästext vid varje rubrik. När en
LÄS-uppgift bygger på TVÅ texter med var sin rubrik ("Två texter av …",
en dikt och en prosatext) ersatte därför den andra rubriken den första, och
hela den första texten försvann. Frågan "Vilket tema har de båda texterna
gemensamt?" stod sedan under en enda text. Det här skriptet lägger tillbaka
texterna ur originalhäftet, var och en med egen rubrik och källa (`parts`),
och behåller radbrytningarna i dikter (`\\n` i stycket).

Dessutom, i alla provpass:

  - "BLANKSIDA. INGÅR EJ I PROVET." är häftets tomsida och inget stycke.
  - Ett stycke som klipptes av vid spalt- eller sidbrytning ("ett nor-" +
    "malt straff") slås ihop med sin fortsättning.
  - Ord där sättningens ff/fi/fl-ligatur tappades ("straf", "fnns") rättas
    mot häftets egen ordlista, i de provpass där originalet finns i cachen.

Täckningskontrollen sist jämför varje rad i häftets LÄS- och ELF-sidor med
arkivet och listar det som saknas. Den ska bara visa enstaka rader
(instruktionsrubriker och liknande); saknas ett helt stycke är något fel.

    python fix_passages.py           # torrkörning, skriver ingenting
    python fix_passages.py --apply
    python fix_passages.py --check   # bara täckningskontrollen
"""

from __future__ import annotations

import glob
import json
import os
import re
import sys

import fitz

from pdfutil import PAGE_NUMBER_RE, english_words, SOFT_HYPHEN, clean_text, join_lines, line_text

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CACHE = os.path.join(ROOT, ".hp-cache")
DATA = os.path.join(ROOT, "src", "data", "prov")

# Texterna som tappades. `page` är 0-indexerad sida i det fullständiga häftet,
# `start`/`end` den första och sista raden ordagrant. `keep` återanvänder
# arkivets stycken för en del som redan var rätt.
FIXES: list[dict] = [
    {
        "file": "2026ht-2",
        "passage": 0,
        "title": "Höst",
        "parts": [
            {
                "title": "Om hösten",
                "page": 2,
                "start": "Nu är det höst och de gyllene fåglarna",
                "end": "sov och slumra mitt barn, ty solen är borta.",
                "poem": True,
                "byline": "Edith Södergran",
            },
            {
                "title": "Leran",
                "page": 2,
                "start": "Varje höst upprepas samma sak",
                "end": "het och förtroende.",
                "byline": "Margareta Ekarv",
            },
        ],
    },
    {
        "file": "2023vt-3",
        "passage": 2,
        "title": "Två texter av författaren Kerstin Thorvall",
        "parts": [
            {
                "title": "Ångestmaskerad",
                "page": 5,
                "start": "Den som lever sambo med ångesten",
                "end": "Man rår inte för ångest heller. Men det känns så.",
            },
            {"title": "Tacksam?", "keep": True},
        ],
    },
    {
        "file": "2025ht-3",
        "passage": 2,
        "title": "Falska minnen och hjärterop",
        "parts": [
            {
                "title": "Säkerhetslina",
                "page": 5,
                "start": "”Minnet, vårt minne är en förunderlig sak",
                "end": "Minnet är illfundigt.",
                "byline": "Birgitta Lindqvist",
            },
            {
                "title": "Hjärtats rop",
                "page": 6,
                "start": "Om natten kan jag ofta ligga vaken",
                "end": "Till dig blir vägen längre, bit för bit...",
                "poem": True,
                "byline": "Johannes Edfelt",
            },
        ],
    },
]

# Stycken som extraktionen vände ord för ord (texten sattes i ett block med
# omvänd skrivordning). Ersätts med texten ur häftet.
REPLACE: list[dict] = [
    {
        "file": "2023vt-5",
        "passage": 1,
        "from_para": "fläck-",
        "to_para": "– Hårsjukdomar är styvmoderligt behandlade",
        "page": 3,
        "start": "Den vanligaste hårsjukdomen är alopecia areata",
        "end": "hårtillväxt och håravfall, på molekylär nivå.",
    },
]

# Rubriker och källrader som i själva verket är häftets sidhuvud.
JUNK_LABEL = re.compile(r"^(delprov (läs|elf)\b|DELPROV (LÄS|ELF)\b)", re.I)
BLANK = re.compile(r"^BLANKSIDA\b", re.I)
WORD = re.compile(r"[A-Za-zÅÄÖåäöÉéÜü]+")
SENTENCE_END = re.compile(r"[.!?:;…”\"')\]]$")


def full_pdf(term: str, pass_nr: int) -> str | None:
    for name in (f"pass{pass_nr}-verbal-full.pdf", f"pass{pass_nr}-verbal.pdf"):
        p = os.path.join(CACHE, term, name)
        if os.path.exists(p):
            return p
    return None


def page_lines(page: "fitz.Page") -> list[dict]:
    """Sidans rader i läsordning: vänsterspalten uppifrån, sedan högerspalten."""
    mid = page.rect.width / 2
    out = []
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            text = clean_text(line_text(line))
            if not text:
                continue
            if PAGE_NUMBER_RE.match(text):
                continue
            x0, y0, x1, y1 = line["bbox"]
            size = max(sp["size"] for sp in line["spans"])
            out.append({"text": text, "x0": x0, "y0": y0, "y1": y1, "size": size, "col": 0 if x0 < mid else 1})
    out.sort(key=lambda l: (l["col"], round(l["y0"], 1), l["x0"]))
    return out


def _plain(s: str) -> str:
    return s.replace(SOFT_HYPHEN, "").strip()


def slice_lines(pdf: str, page_nr: int, start: str, end: str) -> list[dict]:
    lines = page_lines(fitz.open(pdf)[page_nr])
    texts = [_plain(l["text"]) for l in lines]
    try:
        i = next(k for k, t in enumerate(texts) if t.startswith(start))
        j = next(k for k in range(i, len(texts)) if texts[k].endswith(end) or texts[k] == end)
    except StopIteration:
        raise SystemExit(f"{pdf} s. {page_nr}: hittade inte {start!r} … {end!r}")
    picked = lines[i : j + 1]
    # Rubriker är satta större än brödtexten och kan sortera in mitt bland
    # raderna (dikttiteln ligger en punkt under dikternas första rad).
    sizes = sorted(l["size"] for l in picked)
    body = sizes[len(sizes) // 2]
    return [l for l in picked if l["size"] <= body + 0.6]


def _step(lines: list[dict]) -> float:
    gaps = [b["y0"] - a["y0"] for a, b in zip(lines, lines[1:]) if a["col"] == b["col"] and b["y0"] > a["y0"]]
    return sorted(gaps)[len(gaps) // 2] if gaps else 0


def prose(lines: list[dict]) -> list[str]:
    """Löptext: nytt stycke vid indrag, blankrad eller repliktecken efter avslutad mening."""
    groups: list[list[str]] = []
    step = _step(lines)
    left = {c: min(l["x0"] for l in lines if l["col"] == c) for c in {l["col"] for l in lines}}
    prev = None
    for l in lines:
        t = l["text"]
        indented = l["x0"] > left[l["col"]] + 3
        ended = prev is not None and SENTENCE_END.search(_plain(prev["text"]))
        blank = (
            prev is not None and prev["col"] == l["col"] and l["y0"] - prev["y0"] > step * 1.5
        )
        new = not groups or (ended and (indented or blank or t.startswith("–")))
        if new:
            groups.append([t])
        else:
            groups[-1].append(t)
        prev = l
    return [join_lines(g).strip() for g in groups]


def poem(lines: list[dict]) -> list[str]:
    """Dikt: raderna står kvar, strofer skiljs där radavståndet växer."""
    stanzas: list[list[str]] = [[]]
    step = _step(lines)
    for k, l in enumerate(lines):
        if k and lines[k - 1]["col"] == l["col"] and l["y0"] - lines[k - 1]["y0"] > step * 1.5:
            stanzas.append([])
        stanzas[-1].append(clean_text(l["text"], keep_soft_hyphen=False).strip())
    return ["\n".join(s) for s in stanzas if s]


def merge_broken(paras: list[str], vocab: set[str] | None) -> tuple[list[str], int]:
    """
    Slår ihop stycken som klipptes av vid spalt- eller sidbrytning.

    Ibland klipptes ett ord mitt itu utan bindestreck ('doku' + 'mentation').
    Med häftets ordlista till hands limmas det då ihop utan mellanslag.
    """
    out: list[str] = []
    merged = 0
    for p in paras:
        if out and "\n" not in out[-1] and "\n" not in p and p[:1].islower():
            prev = out[-1]
            if prev.endswith("-") and len(prev) >= 40:
                out[-1] = prev[:-1] + p
                merged += 1
                continue
            if len(prev) >= 120 and not SENTENCE_END.search(prev):
                tail = WORD.findall(prev[-30:])
                head = WORD.findall(p[:30])
                sep = " "
                if vocab and tail and head and prev[-1:].isalpha():
                    a, b = tail[-1].lower(), head[0].lower()
                    if (a + b) in vocab and (a not in vocab or b not in vocab):
                        sep = ""
                out[-1] = prev + sep + p
                merged += 1
                continue
        out.append(p)
    return out, merged


def pdf_vocab(pdf: str) -> set[str]:
    words: set[str] = set()
    for page in fitz.open(pdf):
        text = clean_text(page.get_text(), keep_soft_hyphen=False)
        text = re.sub(r"-\n(?=[a-zåäö])", "", text)
        words.update(w.lower() for w in WORD.findall(text))
    return words


def ligature_fix(text: str, vocab: set[str]) -> tuple[str, int]:
    """'straf' → 'straff', 'fnns' → 'finns': bara när häftet har det lagade ordet."""
    n = 0

    def fix(m: re.Match) -> str:
        nonlocal n
        w = m.group(0)
        if "f" not in w.lower() or w.lower() in vocab:
            return w
        for i, ch in enumerate(w):
            if ch.lower() != "f":
                continue
            for lig in ("f", "i", "l", "fi", "fl"):
                cand = w[: i + 1] + lig + w[i + 1 :]
                if cand.lower() in vocab:
                    n += 1
                    return cand
        return w

    return WORD.sub(fix, text), n


def pdf_text_lines(pdf: str) -> list[str]:
    out = []
    for page in fitz.open(pdf):
        for x in page.get_text().split("\n"):
            x = re.sub(r"^[A-E](\s|\t)+", "", x.strip())
            if x:
                out.append(x)
    return out


def complete_alternative(alt: str, lines: list[str], normed: list[str]) -> str:
    """
    Svarsalternativ som slutar mitt i meningen fick sin sista rad avklippt
    ('… is less likely than'). Fortsättningen är raden efter i häftet, och den
    börjar alltid med gemen.
    """
    if not alt or SENTENCE_END.search(alt) or len(alt) < 25:
        return alt
    tail = norm(alt)
    for i, n in enumerate(normed):
        if len(n) >= 12 and tail.endswith(n):
            rest = []
            for nxt in lines[i + 1 : i + 4]:
                if not nxt[:1].islower():
                    break
                rest.append(nxt)
                if SENTENCE_END.search(_plain(nxt)):
                    break
            if rest and SENTENCE_END.search(_plain(rest[-1])):
                head = re.sub(r"\s*-$", "-", alt.rstrip())
                joined = join_lines([head] + rest, english=True)
                # Brytningen satt ibland som 'con -' / 'under standing'.
                last = WORD.findall(head)[-1]
                first = WORD.findall(rest[0])[0]
                vocab = english_words()
                combined = (last + first).lower()
                if (combined in vocab or combined.rstrip("s") in vocab) and len(combined) >= 7 and not head.endswith("-"):
                    joined = joined.replace(f"{last} {first}", last + first, 1)
                return joined
            return alt
    return alt


def apply_fixes(data: dict, spec: dict, pdf: str) -> None:
    passage = data["passages"][spec["passage"]]
    paragraphs: list[str] = []
    parts: list[dict] = []
    for part in spec["parts"]:
        if part.get("keep"):
            body = [p for p in passage["paragraphs"] if not BLANK.match(p)]
        else:
            lines = slice_lines(pdf, part["page"], part["start"], part["end"])
            lines = [l for l in lines if _plain(l["text"]).lower() != part["title"].lower()]
            body = poem(lines) if part.get("poem") else prose(lines)
        entry = {"start": len(paragraphs), "title": part["title"]}
        if part.get("byline"):
            entry["byline"] = part["byline"]
        parts.append(entry)
        paragraphs += body
    new = {"title": spec["title"], "paragraphs": paragraphs, "parts": parts}
    # Sista delens källa står där passagens källa alltid stått, under texten.
    if parts[-1].get("byline"):
        new["byline"] = parts[-1].pop("byline")
    if passage.get("glossary"):
        new["glossary"] = passage["glossary"]
    data["passages"][spec["passage"]] = new


def apply_replace(data: dict, spec: dict, pdf: str) -> None:
    paras = data["passages"][spec["passage"]]["paragraphs"]
    if spec["from_para"] not in paras:
        return  # redan lagat
    i = paras.index(spec["from_para"])
    j = next(k for k in range(i, len(paras)) if paras[k].startswith(spec["to_para"]))
    body = prose(slice_lines(pdf, spec["page"], spec["start"], spec["end"]))
    paras[i : j + 1] = body


def norm(s: str) -> str:
    return re.sub(r"[^a-zåäöéüæøà]", "", s.lower().replace("ﬁ", "fi").replace("ﬂ", "fl"))


def coverage(data: dict, pdf: str) -> list[tuple[int, str]]:
    corpus = []
    for ps in data["passages"]:
        corpus += [ps.get("title") or "", ps.get("byline") or ""] + ps["paragraphs"]
        corpus += [p.get("title") or "" for p in ps.get("parts") or []]
        corpus += [p.get("byline") or "" for p in ps.get("parts") or []]
        for g in ps.get("glossary") or []:
            corpus += [g["term"], g["definition"]]
    for q in data["questions"]:
        corpus.append(q.get("text") or "")
        corpus += q.get("alternatives") or []
    c = norm(" ".join(corpus))
    missing = []
    for i, page in enumerate(fitz.open(pdf)):
        text = page.get_text()
        if not re.search(r"LÄS|ELF|läsförståelse", text[:120], re.I):
            continue
        for line in text.split("\n"):
            line = re.sub(r"^\s*[A-E][\s\t]+", "", line)
            n = norm(line)
            if len(n) >= 25 and n not in c and "gaps which indicate" not in line:
                missing.append((i, line.strip()))
    return missing


def main() -> None:
    apply = "--apply" in sys.argv
    check_only = "--check" in sys.argv
    fixes = {f["file"]: f for f in FIXES}
    replaces = {r["file"]: r for r in REPLACE}
    total_changed = 0

    for path in sorted(glob.glob(os.path.join(DATA, "*.json"))):
        name = os.path.basename(path)[:-5]
        if name in ("index", "exempel"):
            continue
        with open(path) as fh:
            raw = fh.read()
        data = json.loads(raw)
        if data.get("kind") != "verbal" or not data.get("passages"):
            continue
        pdf = full_pdf(data["term"], data["pass"])
        notes: list[str] = []

        if not check_only:
            if name in fixes and not data["passages"][fixes[name]["passage"]].get("parts"):
                if not pdf:
                    raise SystemExit(f"{name}: häftet saknas i .hp-cache")
                apply_fixes(data, fixes[name], pdf)
                notes.append("texterna återställda")
            if name in replaces and pdf:
                apply_replace(data, replaces[name], pdf)
                notes.append("omvänt stycke ersatt")

            vocab = pdf_vocab(pdf) if pdf else None
            ligs = merges = blanks = 0
            for ps in data["passages"]:
                before = len(ps["paragraphs"])
                ps["paragraphs"] = [p for p in ps["paragraphs"] if not BLANK.match(p)]
                blanks += before - len(ps["paragraphs"])
                if not ps.get("parts"):
                    ps["paragraphs"], m = merge_broken(ps["paragraphs"], vocab)
                    merges += m
                if ps.get("byline") and JUNK_LABEL.match(ps["byline"]):
                    del ps["byline"]
                    notes.append("sidhuvud som källa")
                if ps.get("title") and JUNK_LABEL.match(ps["title"]):
                    # Delprovets rubrik tog textens plats, och textens egen
                    # rubrik hamnade som första stycke.
                    first = ps["paragraphs"][0] if ps["paragraphs"] else ""
                    if first and len(first) <= 80 and not first.endswith("."):
                        ps["title"] = ps["paragraphs"].pop(0)
                    else:
                        del ps["title"]
                    notes.append("sidhuvud som rubrik")
                if vocab:
                    for k, p in enumerate(ps["paragraphs"]):
                        ps["paragraphs"][k], n = ligature_fix(p, vocab)
                        ligs += n
            if pdf:
                plines = pdf_text_lines(pdf)
                pnorm = [norm(x) for x in plines]
                cut = 0
                for q in data["questions"]:
                    if q["nr"] >= 31:
                        alts = q.get("alternatives") or []
                        fixed = [complete_alternative(a, plines, pnorm) for a in alts]
                        cut += sum(1 for a, b in zip(alts, fixed) if a != b)
                        q["alternatives"] = fixed
                if cut:
                    notes.append(f"{cut} avklippta svarsalternativ")
            if vocab:
                for q in data["questions"]:
                    if q.get("text"):
                        q["text"], n = ligature_fix(q["text"], vocab)
                        ligs += n
                    if q.get("alternatives"):
                        alts = []
                        for a in q["alternatives"]:
                            a2, n = ligature_fix(a, vocab)
                            ligs += n
                            alts.append(a2)
                        q["alternatives"] = alts
            if blanks:
                notes.append(f"{blanks} tomsidor")
            if merges:
                notes.append(f"{merges} avklippta stycken")
            if ligs:
                notes.append(f"{ligs} ligaturord")

        out = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        changed = json.loads(out) != json.loads(raw)
        if changed:
            total_changed += 1
            print(f"{name}: {', '.join(notes)}")
            if apply:
                with open(path, "w") as fh:
                    fh.write(out)

        if pdf and (check_only or name in fixes or name in replaces):
            missing = coverage(data, pdf)
            body = [m for m in missing if not re.match(r"^(DELPROV|AND HERE|Two texts)", m[1])]
            if len(body) > 3:
                print(f"  {name}: {len(body)} rader i häftet saknas fortfarande")
                for m in body[:5]:
                    print("    ", m)

    print(f"\n{total_changed} filer {'skrivna' if apply else 'skulle ändras (torrkörning)'}")


if __name__ == "__main__":
    main()
