"""
Hämtar UHR:s riktiga normeringstabeller och skriver dem till
`src/data/prov/normering.json`.

    python3 scripts/hp-import/normering.py
    python3 scripts/hp-import/normering.py --offline   # bygg om ur cachen

VARFÖR DEN HÄR FINNS
Appen räknade tidigare all normering med EN handskriven approximationstabell
för hela provet. Den var densamma för vårprovet 2012 och höstprovet 2025 —
alltså "senaste provet som referens" oavsett vilket prov man faktiskt skrivit.
Men UHR normerar varje prov för sig, och gränserna rör sig rejält: 50 rätt av
80 på den verbala delen var 1.0 hösten 2025 och kan vara 1.1 eller 0.9 ett
annat provtillfälle. Det är skillnaden mellan en gissning och ett besked.

VAD UHR PUBLICERAR
En PDF per provdel och provtillfälle, under
`/globalassets/05-hogskoleprovet/normeringstabeller/...`. Bara det allra
senaste provet har dem länkade från sin provsida — resten ligger kvar
avlänkade på servern, precis som ELF-originalen (se `fetch_elf.py`). Därför
letas de på tre håll: provsidorna, Internet Archives register över vad som
någonsin legat under `normeringstabeller/`, och gissade namn i de fem former
UHR har använt sedan 2011.

Vilket provtillfälle en tabell hör till läses ur PDF:ens EGEN rubrik
("Verbal del högskoleprovet 2025-10-19") och aldrig ur filnamnet. Koden i
filnamnet (`25b`) är tvetydig de terminer som hade två prov, och ett häfte på
fel prov är precis den sortens fel som inte syns förrän någon räknar sin poäng.

Tabellen är rader av formen

    0 - 20    0.0    2024    3.6    3.6
    21 - 22   0.1    1129    2.0    5.6

alltså: intervall av antal rätta svar (av 80), normerad poäng, och tre
kolumner statistik som vi inte bryr oss om. Skalan går i steg om 0.1 —
halvstegen (1.95 och liknande) uppstår först när provets två delar snittas.

VAD SOM SKRIVS
`src/data/prov/normering.json`:

    {
      "2025ht": {
        "date": "2025-10-19",
        "verbal": [[0, 20, 0.0], [21, 22, 0.1], ...],
        "kvant":  [[0, 19, 0.0], ...]
      }
    }

Saknas ett provtillfälle i filen faller `src/lib/normering.ts` tillbaka på
approximationen och UI:t säger att det är en uppskattning. Det är avsiktligt:
de äldsta proven har inga tabeller kvar på UHR:s server.

Beroenden: PyMuPDF (`pip install pymupdf`). Samma som resten av pipelinen.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

import fitz  # PyMuPDF

BASE = "https://www.studera.nu"
INDEX_URL = f"{BASE}/hogskoleprov/om/forbereda/tidigare/"
LATEST_URL = f"{BASE}/hogskoleprov/resultat/resultat/senaste/"

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CACHE = os.path.join(ROOT, ".hp-cache", "normering")
OUT = os.path.join(ROOT, "src", "data", "prov", "normering.json")
INDEX_JSON = os.path.join(ROOT, "src", "data", "prov", "index.json")

UA = "tvakommanollan-import/1.0 (+https://tvakommanollan.se; kontakt via sajten)"

# Adresser som inte fanns. Sparas därför att gissningslistan är ~1 500 poster
# lång och nästan alla är bommar: utan den här filen tar varje omkörning en
# halvtimme av rena 404:or, och parserändringar blir opraktiska att prova.
MISSES = os.path.join(CACHE, "saknas.json")

# Raden i tabellen. Sista intervallet skrivs ibland som "76 - 80" och ibland
# som bara "80", därav den valfria andra halvan.
ROW = re.compile(r"^\s*(\d{1,3})\s*(?:[-–]\s*(\d{1,3}))?\s*$")
SCORE = re.compile(r"^\s*([0-2](?:[.,]\d)?)\s*$")


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def download(url: str, path: str) -> bool:
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = get(url)
    with open(path, "wb") as f:
        f.write(data)
    time.sleep(0.4)  # var snäll mot UHR:s server
    return True


def _rows_streaming(lines: list[str]) -> list[list[float]]:
    """
    Radvis layout: intervall, poäng, tre statistikkolumner, nästa intervall…

    Poängen prövas FÖRE intervallet så snart ett intervall väntar på sitt
    värde. Utan den ordningen slukas en poäng som skrivs utan decimal ("0"
    i stället för "0.0") av intervallmönstret, raden tappas, och tabellen
    börjar på fel antal rätt — det hände höstprovet 2016.
    """
    out: list[list[float]] = []
    pending: tuple[int, int] | None = None
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if pending is not None:
            s = SCORE.match(line)
            if s:
                out.append([pending[0], pending[1], float(s.group(1).replace(",", "."))])
                pending = None
                continue
        m = ROW.match(line)
        if m:
            lo = int(m.group(1))
            hi = int(m.group(2)) if m.group(2) else lo
            if pending is None and 0 <= lo <= 80 and hi <= 80:
                pending = (lo, hi)
            continue
        # Vad som helst annat bryter en påbörjad rad — annars kan ett intervall
        # från en sidfot para ihop sig med nästa sidas första poäng.
        pending = None
    return out


def _rows_columnar(lines: list[str]) -> list[list[float]]:
    """
    Kolumnvis layout: ALLA intervall först, sedan alla poäng, sedan statistiken.

    Höstprovet 2018 är satt så, och en radvis läsning ger då en enda rad
    (sista intervallet + första poängen). Här samlas i stället intervallen och
    poängen var för sig och paras ihop i ordning — vilket bara godtas om de är
    exakt lika många.
    """
    intervals: list[tuple[int, int]] = []
    scores: list[float] = []
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        m = ROW.match(line)
        if m and m.group(2):  # kräver bindestreck: ett ensamt tal är statistik
            lo, hi = int(m.group(1)), int(m.group(2))
            if 0 <= lo <= hi <= 80 and not scores:
                intervals.append((lo, hi))
            continue
        s = SCORE.match(line)
        if s and intervals and len(scores) < len(intervals):
            scores.append(float(s.group(1).replace(",", ".")))
    if not intervals or len(scores) != len(intervals):
        return []
    return [[lo, hi, sc] for (lo, hi), sc in zip(intervals, scores)]


def parse_table(path: str) -> list[list[float]]:
    """
    PDF → [[min_rätt, max_rätt, poäng], ...].

    Texten kommer ut i läsordning, och layouten har ändrats flera gånger sedan
    2011. Två strategier prövas, i tur och ordning, och den som ger en tabell
    som håller vinner. Att matcha på FORM och inte på position är avsiktligt:
    "intervall följt av poäng" har varit sant hela tiden, till skillnad från
    var på sidan kolumnerna råkar ligga.
    """
    doc = fitz.open(path)
    lines: list[str] = []
    for page in doc:
        lines.extend(page.get_text().splitlines())
    doc.close()

    for strategi in (_rows_streaming, _rows_columnar):
        table = strategi(lines)
        if table and valid(table) is None:
            return table
    # Ingen höll — returnera den radvisa, så `valid` kan rapportera VARFÖR.
    return _rows_streaming(lines)


def valid(table: list[list[float]]) -> str | None:
    """
    Returnerar felet, eller None om tabellen håller.

    Antalet uppgifter i en provdel är INTE alltid 80. Vårprovet 2012 hade 76 i
    den verbala delen — provformatet ändrades när ELF infördes — och en
    hårdkodad 80:a förkastade därför en fullt giltig tabell. Kravet är i
    stället att tabellen är sammanhängande från 0 och slutar på ett rimligt
    tal; hur stort det talet är läses sedan ur tabellen själv.
    """
    if len(table) < 10:
        return f"bara {len(table)} rader"
    if table[0][0] != 0:
        return f"börjar på {table[0][0]} rätt, inte 0"
    if not (40 <= table[-1][1] <= 80):
        return f"slutar på {table[-1][1]} rätt, utanför 40–80"
    scores = [row[2] for row in table]
    if scores != sorted(scores):
        return "poängen är inte stigande"
    if scores[0] != 0.0 or scores[-1] != 2.0:
        return f"poängspannet är {scores[0]}–{scores[-1]}, inte 0.0–2.0"
    for prev, cur in zip(table, table[1:]):
        if cur[0] != prev[1] + 1:
            return f"lucka mellan {prev[1]} och {cur[0]} rätt"
    return None


def exam_pages() -> list[str]:
    """Alla provsidor på UHR:s lista, plus sidan för det allra senaste provet."""
    pages = [LATEST_URL]
    index_html = get(INDEX_URL).decode("utf-8", "replace")
    for href in re.findall(r'href="([^"]+)"', index_html):
        if "/hogskoleprov/fpn/" not in href:
            continue
        url = href if href.startswith("http") else BASE + href
        if url not in pages:
            pages.append(url)
    return pages


NORM_ROOT = f"{BASE}/globalassets/05-hogskoleprovet/normeringstabeller"

MONTHS = {
    1: "januari", 2: "februari", 3: "mars", 4: "april", 5: "maj", 6: "juni",
    7: "juli", 8: "augusti", 9: "september", 10: "oktober", 11: "november",
    12: "december",
}


def is_part(url: str) -> str | None:
    """
    'verbal' / 'kvant' / None.

    `_helaprovet.pdf` sorteras bort med flit: den tabellen översätter den
    SAMMANLAGDA råpoängen till en totalpoäng, och så räknas inte ett
    provresultat. Delarna normeras var för sig och snittas — se
    `normeringFromParts` i src/lib/normering.ts.
    """
    low = url.lower().rsplit("/", 1)[-1]
    if "hela" in low:
        return None
    if "verb" in low:
        return "verbal"
    if "kvant" in low:
        return "kvant"
    return None


def norm_links(page_html: str) -> list[str]:
    """Normeringstabeller länkade från en provsida."""
    out = []
    for href in re.findall(r'href="([^"]+\.pdf)"', page_html):
        if "norm" not in href.lower():
            continue
        url = href if href.startswith("http") else BASE + href
        if is_part(url):
            out.append(url.split("?")[0])
    return out


def archive_links() -> list[str]:
    """
    Internet Archives register över allt som legat under `normeringstabeller/`.

    Samma trick som `archive_index.py`: UHR länkar bort gamla filer men raderar
    dem sällan, och arkivet minns adresserna även när ingen sida pekar dit.
    Vi hämtar bara ADRESSERNA här — själva filen laddas från UHR när den finns
    kvar, annars från arkivet.
    """
    url = (
        "https://web.archive.org/cdx/search/cdx?"
        f"url=studera.nu/globalassets/05-hogskoleprovet/normeringstabeller/*"
        "&fl=original&collapse=urlkey&limit=2000"
    )
    try:
        body = get(url).decode("utf-8", "replace")
    except Exception as e:  # arkivet är ofta segt eller nere — det är inte ett fel
        print(f"  (Internet Archive svarade inte: {e})")
        return []
    out = []
    for line in body.splitlines():
        line = line.strip().split("?")[0]
        if line.endswith(".pdf") and is_part(line):
            out.append(line)
    return sorted(set(out))


def guessed_links(dates: list[str]) -> list[str]:
    """
    Gissade adresser, i de mappformer UHR faktiskt använt sedan 2011.

    Provkoden är årtalets två sista siffror plus 'a' för vårprov och 'b' för
    höstprov. Terminer med två prov har fått suffix ('22a1'), så båda formerna
    provas. Ingen gissning godtas utan att PDF:en själv säger vilket prov den
    hör till, så ett fel namn kan bara ge en 404 — aldrig fel data.
    """
    out = []
    for date in dates:
        y, m, d = int(date[:4]), int(date[5:7]), int(date[8:10])
        season = "vt" if m <= 6 else "ht"
        code = f"{y % 100:02d}{'a' if season == 'vt' else 'b'}"
        folders = [
            f"normering-{season}{y}-{d}-{MONTHS[m]}",
            f"normering-{season}-{y}-{d}-{MONTHS[m]}",
            f"normering-{season}-{y}",
            f"normering-{season}{y}",
            "",  # de äldsta ligger direkt i normeringstabeller/
        ]
        names = []
        for c in (code, f"{code}1", f"{code}2"):
            names += [f"norm{c}_verb.pdf", f"norm{c}_kvant.pdf",
                      f"norm-{c}_verb.pdf", f"norm-{c}_kvant.pdf",
                      f"norm_{c}_verb.pdf", f"norm_{c}_kvant.pdf"]
        for folder in folders:
            prefix = f"{NORM_ROOT}/{folder}" if folder else NORM_ROOT
            out += [f"{prefix}/{n}" for n in names]
    return out


PDF_DATE = re.compile(r"(20\d{2})[-\s]?(\d{2})[-\s]?(\d{2})")


def pdf_exam_date(path: str) -> str | None:
    """
    Provdatumet ur PDF:ens egen rubrik: "Verbal del högskoleprovet 2025-10-19".

    Läses ur de första raderna, inte ur hela dokumentet — tabellen är full av
    tal och ett av dem kan råka se ut som ett datum.
    """
    doc = fitz.open(path)
    head = "\n".join(doc[0].get_text().splitlines()[:20])
    doc.close()
    m = PDF_DATE.search(head)
    if not m:
        return None
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"


_misses: set[str] = set()


def load_misses() -> None:
    try:
        with open(MISSES, encoding="utf-8") as f:
            _misses.update(json.load(f))
    except Exception:
        pass


def save_misses() -> None:
    os.makedirs(CACHE, exist_ok=True)
    with open(MISSES, "w", encoding="utf-8") as f:
        json.dump(sorted(_misses), f, ensure_ascii=False, indent=1)


def try_download(url: str, path: str, offline: bool = False) -> bool:
    """Hämtar från UHR, annars från Internet Archive. False = finns inte."""
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return True
    if offline or url in _misses:
        return False
    for candidate in (url, f"https://web.archive.org/web/2020id_/{url}"):
        try:
            data = get(candidate)
        except Exception:
            continue
        if not data.startswith(b"%PDF"):
            continue
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
        time.sleep(0.4)  # var snäll mot servrarna
        return True
    _misses.add(url)
    return False


# Provdatumet på ett häfte är inte alltid det som står i provlistan. Samma
# lista som `DATE_ALIASES` i build.py finns här av samma skäl: vårprovet 2016
# står i UHR:s katalog som 2016-04-04 (en måndag) medan provet skrevs den 9:e,
# vilket är det datum normeringstabellen bär.
DATE_ALIASES = {
    "2016-04-09": "2016-04-04",
}


def main() -> int:
    # --offline bygger om filen ur det som redan ligger i cachen. Ingen
    # nätverkstrafik alls, går på sekunder, och är vägen att prova en ändring
    # i parsern utan att belasta UHR:s server igen.
    offline = "--offline" in sys.argv
    load_misses()

    with open(INDEX_JSON, encoding="utf-8") as f:
        exams = json.load(f)["exams"]
    by_date = {e["date"]: e["term"] for e in exams}
    for pdf_datum, listans_datum in DATE_ALIASES.items():
        if listans_datum in by_date:
            by_date[pdf_datum] = by_date[listans_datum]
    dates = sorted(by_date)

    kandidater: list[str] = []
    if offline:
        # Allt som redan ligger i cachen, oavsett var adressen kom ifrån.
        for mapp, _dirs, filer in os.walk(CACHE):
            for namn in filer:
                if namn.endswith(".pdf"):
                    kandidater.append(f"{NORM_ROOT}/{os.path.basename(mapp)}/{namn}")
        print(f"Offline: {len(kandidater)} tabeller i cachen\n")
    else:
        print(f"Hämtar provsidor från {INDEX_URL}")
        for page_url in exam_pages():
            try:
                page = get(page_url).decode("utf-8", "replace")
            except urllib.error.HTTPError as e:
                print(f"  {page_url}: {e}")
                continue
            kandidater += norm_links(page)
        print(f"  {len(kandidater)} länkade tabeller")

        arkiv = archive_links()
        print(f"  {len(arkiv)} adresser ur Internet Archives register")

        gissade = guessed_links(dates)
        kandidater = list(dict.fromkeys(kandidater + arkiv + gissade))
        print(f"  {len(kandidater)} adresser att prova ({len(_misses)} kända bommar hoppas över)\n")

    result: dict[str, dict] = {}
    misslyckade: list[str] = []
    saknas: set[str] = set()

    for url in kandidater:
        part = is_part(url)
        if not part:
            continue
        namn = url.rsplit("/", 1)[-1]
        mapp = url.rsplit("/", 2)[-2] if url.count("/") > 6 else "rot"
        path = os.path.join(CACHE, mapp, namn)
        if not try_download(url, path, offline):
            saknas.add(url)
            continue

        date = pdf_exam_date(path)
        term = by_date.get(date or "")
        if not term:
            # Tabellen finns men hör till ett provtillfälle vi inte har häften
            # för, eller så gick datumet inte att läsa. Ingen gissning görs.
            misslyckade.append(f"{namn}: provdatum {date or '?'} matchar inget prov i arkivet")
            continue

        table = parse_table(path)
        problem = valid(table)
        if problem:
            # En tabell som inte håller skrivs inte ut. Hellre approximationen
            # — som säger att den är en uppskattning — än en officiell siffra
            # som är fel.
            misslyckade.append(f"{term} {part}: {problem}")
            continue

        entry = result.setdefault(term, {"date": date})
        if part not in entry:
            entry[part] = table
            print(f"  {term:<8} {date}  {part:<7} {len(table)} rader  ({namn})")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(dict(sorted(result.items())), f, ensure_ascii=False, indent=1)
        f.write("\n")

    save_misses()

    hela = sorted(t for t, e in result.items() if "verbal" in e and "kvant" in e)
    print(f"\n{len(result)} provtillfällen, varav {len(hela)} med båda delarna → {OUT}")
    utan = [e["term"] for e in exams if e["term"] not in hela]
    if utan:
        print(f"\nUtan officiell normering ({len(utan)}), faller tillbaka på approximationen:")
        print("  " + ", ".join(sorted(utan)))
    if misslyckade:
        print("\nEj använda:")
        for rad in sorted(set(misslyckade)):
            print(f"  {rad}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
