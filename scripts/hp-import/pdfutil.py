"""Gemensamma PDF-hjälpare för gamla-prov-importen."""

from __future__ import annotations

import re
import unicodedata

import fitz

SOFT_HYPHEN = "­"

# Sidfoten ("– 12 –") och sidhuvudet ("XYZ", "LÄS") ska aldrig hamna i frågetext.
PAGE_NUMBER_RE = re.compile(r"^[–\-—]\s*\d+\s*[–\-—]$")

# Förled som behåller sitt bindestreck även när nästa rad börjar med gemen:
# 'icke-invasiv', 'ex-make'. Utan dem blir de ihopslagna vid radbrytning.
KEEP_HYPHEN = {"icke", "ex", "vice", "s", "e", "u", "o", "b", "pro", "anti"}


def clean_text(s: str, keep_soft_hyphen: bool = True) -> str:
    """
    Normaliserar whitespace och de tecken UHR:s sättning strör omkring sig.

    Mjuka bindestreck lämnas kvar som default — join_lines behöver dem för att
    veta var ett ord har brutits, och plockar bort dem själv efteråt.
    """
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"[    ⁠]", " ", s)
    s = s.replace(" ", " ").replace(" ", " ").replace(" ", " ")
    s = s.replace("ﬁ", "fi").replace("ﬂ", "fl")
    if not keep_soft_hyphen:
        s = s.replace(SOFT_HYPHEN, "")
    s = s.replace("\t", " ")
    s = re.sub(r"[ ]{2,}", " ", s)
    return s.strip()


def english_words() -> set[str]:
    """
    Engelsk ordlista för avstavningsbeslutet i ELF-texterna, se `join_lines`.

    Läses från systemets ordlista och cachas. Saknas den faller `join_lines`
    tillbaka på svenska regler, vilket bara betyder att någon enstaka engelsk
    sammansättning tappar sitt bindestreck — importen fungerar ändå.
    """
    if _ENGLISH.get("words") is None:
        try:
            with open("/usr/share/dict/words", encoding="utf-8", errors="ignore") as f:
                _ENGLISH["words"] = {w.strip().lower() for w in f if w.strip()}
        except OSError:
            _ENGLISH["words"] = set()
    return _ENGLISH["words"]


_ENGLISH: dict[str, set[str] | None] = {"words": None}


# Ändelser som är egna uppslagsord i ordlistan men aldrig efterled i en
# sammansättning. Utan dem klyvs 'focus-ing' och 'research-ers'.
SUFFIXES = {"ing", "ed", "er", "ers", "es", "ly", "ally", "ness", "ment", "led", "ies"}

# Ord som saknas i systemets ordlista (den bygger på en ordbok från 1934) men
# som förekommer i ELF-texterna och skrivs i ett ord.
MODERN = {"internet", "benchmark", "artwork", "artworks", "birthrate", "website",
          "online", "smartphone", "email", "database", "lifespan", "workforce"}


def _is_word(w: str) -> bool:
    """
    Ordet, eller dess oböjda form, i ordlistan.

    Systemets ordlista har bara uppslagsformer, så 'workers', 'discussed' och
    'novelties' saknas — och just de luckorna fick regeln nedan att tro att en
    hopskrivning var ogiltig och behålla ett bindestreck som inte fanns.
    """
    words = english_words()
    if w in words or w in MODERN:
        return True
    if w.endswith("ies") and len(w) > 5 and w[:-3] + "y" in words:
        return True
    for suffix in ("s", "es", "ed", "ing", "ly"):
        if not w.endswith(suffix):
            continue
        stem = w[: -len(suffix)]
        if len(stem) < 3:
            continue
        # 'travelling' → 'travel', 'controlled' → 'control'
        undoubled = stem[:-1] if len(stem) > 3 and stem[-1] == stem[-2] else None
        if stem in words or stem + "e" in words or (undoubled and undoubled in words):
            return True
    return False


def _english_compound(before: str, after: str) -> bool:
    """
    Är 'before-after' ett äkta bindestreck som råkat hamna vid radslut?

    Engelskan sätter samman ord med bindestreck där svenskan skriver ihop dem,
    så radbrytningsregeln nedan slår fel just här: 'present-day' blir
    'presentday' och 'working-class' blir 'workingclass'. Testet är att båda
    leden är egna engelska ord medan hopskrivningen inte är det — då är
    strecket innehåll och inte avstavning. 'ines-capability' klarar sig, för
    'ines' är inget ord; 'stud-ies' likaså, för 'ies' är en ändelse.

    Förledet måste dessutom vara gement. Ett egennamn som brutits mitt itu ser
    annars ut som en sammansättning så fort båda halvorna råkar vara ord:
    'Cam-bridge', 'Face-book', 'Hit-ler'. Sammansättningar som verkligen börjar
    med versal står i praktiken aldrig vid en radbrytning i det här materialet.
    """
    words = english_words()
    if not words or not before[:1].islower():
        return False
    a = before.lower()
    b = re.split(r"[^A-Za-z]", after, 1)[0].lower()
    if len(a) < 3 or len(b) < 3 or b in SUFFIXES or _is_word(a + b):
        return False
    return _is_word(a) and _is_word(b)


def join_lines(lines: list[str], english: bool = False) -> str:
    """
    Slår ihop rader från PDF:en till löpande text.

    Sättningen bryter ord på två sätt: med mjukt bindestreck (\\xad) och med
    riktigt bindestreck. Båda ska bort när nästa rad fortsätter ordet — annars
    får man 'in- vasiv' och 'minut er', vilket är exakt den sortens skräp som
    låg i den gamla datafilen.

    Med `english` gäller dessutom `_english_compound`, som räddar de äkta
    bindestrecken i ELF:s engelska texter. Den lämnas av för svensk text: där
    är 'hand-lag' avstavning, men båda leden är engelska ord och regeln skulle
    behålla ett streck som inte finns.
    """
    out = ""
    glue_next = False  # föregående rad slutade mitt i ett ord
    for i, raw in enumerate(lines):
        line = raw.strip()
        if not line:
            continue
        glue_here, glue_next = glue_next, False
        if line.endswith(SOFT_HYPHEN):
            line, glue_next = line[:-1].rstrip(), True
        elif line.endswith("-"):
            nxt = next((x.strip() for x in lines[i + 1 :] if x.strip()), "")
            # 'in-vasiv' → 'invasiv', men 'Nord-syd' behåller sitt streck.
            # Sättningen skiljer inte på avstavning och riktigt bindestreck, så
            # versal efter strecket + en handfull förled får avgöra.
            last_word = re.split(r"[\s(]", line[:-1])[-1]
            if nxt[:1].islower() and not line.endswith(" -"):
                if last_word.lower() in KEEP_HYPHEN or (
                    english and _english_compound(last_word, nxt)
                ):
                    glue_next = True  # 'icke-' + 'invasivt' → 'icke-invasivt'
                else:
                    line, glue_next = line[:-1], True
        if not out:
            out = line
        elif glue_here:
            out += line
        else:
            out += " " + line
    return clean_text(out, keep_soft_hyphen=False)


class Block:
    """En textblock ur PDF:en med koordinater och radtext."""

    __slots__ = ("bbox", "lines", "sizes", "fonts", "line_x", "english")

    def __init__(self, bbox, lines, sizes, fonts, line_x=None):
        self.bbox = bbox
        self.lines = lines
        self.sizes = sizes
        self.fonts = fonts
        # Vänsterkanten per rad — indraget markerar nytt stycke.
        self.line_x = line_x or []
        # Sätts av elf.py för blocken i den engelska delen, se join_lines.
        self.english = False

    @property
    def x0(self) -> float:
        return self.bbox[0]

    @property
    def y0(self) -> float:
        return self.bbox[1]

    @property
    def y1(self) -> float:
        return self.bbox[3]

    @property
    def text(self) -> str:
        return join_lines(self.lines, english=self.english)

    def paragraphs(self, indent: float = 3.0) -> list[str]:
        """
        Blockets text uppdelad i stycken.

        Provhäftena markerar nytt stycke med indrag, inte med blankrad, och
        ett block är ofta en hel spalt. Utan den här uppdelningen kommer en
        lästext ut som en enda vägg på flera tusen tecken.
        """
        if len(self.line_x) != len(self.lines):
            return [self.text]
        left = min((x for x, line in zip(self.line_x, self.lines) if line.strip()), default=0.0)
        groups: list[list[str]] = []
        blank = False
        for x, line in zip(self.line_x, self.lines):
            if not line.strip():
                blank = True  # några texter skiljer stycken med blankrad
                continue
            if not groups or blank or x > left + indent:
                groups.append([line])
            else:
                groups[-1].append(line)
            blank = False
        return [t for t in (join_lines(g, english=self.english) for g in groups) if t]

    @property
    def bold(self) -> bool:
        return any("bold" in f.lower() for f in self.fonts)

    @property
    def max_size(self) -> float:
        return max(self.sizes) if self.sizes else 0.0

    def __repr__(self) -> str:  # pragma: no cover - felsökning
        bb = [round(v) for v in self.bbox]
        return f"Block({bb}, {self.text[:60]!r})"


def line_text(line: dict) -> str:
    """
    Texten på en rad, med mellanslag återinsatta.

    En del årgångar sätter varje ord som en egen textkörning utan
    mellanslagstecken och låter positioneringen sköta ordmellanrummen. Ren
    sammanslagning ger då 'sambandmedattalltfler…'. Vi sätter tillbaka ett
    mellanslag där körningarna står isär.
    """
    parts: list[str] = []
    prev_x1: float | None = None
    for s in line["spans"]:
        text = s["text"]
        if (
            prev_x1 is not None
            and s["bbox"][0] - prev_x1 > 1.0
            and text[:1] not in (" ", "")
            and parts
            and not parts[-1].endswith(" ")
        ):
            parts.append(" ")
        parts.append(text)
        prev_x1 = s["bbox"][2]
    out = "".join(parts)

    # Ett par årgångar sätter ut mjuka bindestreck i stället för mellanslag i
    # marginaljusterade rader ('samband\xadmed\xadatt\xadallt\xadfler'). De känns igen
    # på att raden saknar riktiga mellanslag helt — en rad med vanlig avstavning
    # har alltid några.
    if out.count(SOFT_HYPHEN) >= 2 and " " not in out.strip():
        out = out.replace(SOFT_HYPHEN, " ")
    return out


def blocks(page: "fitz.Page", clip: "fitz.Rect | None" = None) -> list[Block]:
    """
    Textblock utan sidnummer/tomma block.

    Med clip extraheras bara en del av sidan. Det behövs för uppslag där
    sättningen låtit ett textblock spänna över spaltrännan, så att två
    uppgifter hamnar i samma block.
    """
    out: list[Block] = []
    for b in page.get_text("dict", clip=clip)["blocks"]:
        if b.get("type") != 0:
            continue
        lines, sizes, fonts, line_x = [], [], [], []
        for line in b["lines"]:
            txt = line_text(line)
            lines.append(clean_text(txt) if txt.strip() else "")
            line_x.append(line["bbox"][0])
            for s in line["spans"]:
                sizes.append(s["size"])
                fonts.append(s["font"])
        joined = " ".join(x for x in lines if x).strip()
        if not joined or PAGE_NUMBER_RE.match(joined):
            continue
        out.append(Block(tuple(b["bbox"]), lines, sizes, fonts, line_x))
    return out


def column_sorted(bs: list[Block], page_width: float, gutter: float = 0.5) -> list[Block]:
    """
    Sorterar block i läsordning för ett tvåspaltigt uppslag: vänsterspalten
    uppifrån och ner, sedan högerspalten. PDF:ens egen blockordning är i
    praktiken slumpmässig (ORD-sidan kommer som 2, 1, 4, 3 …).
    """
    mid = page_width * gutter
    return sorted(bs, key=lambda b: (0 if b.x0 < mid else 1, round(b.y0, 1), b.x0))


def content_rect(page: "fitz.Page") -> "fitz.Rect":
    """Sidytan utan sidfot, för bildutsnitt."""
    r = page.rect
    return fitz.Rect(r.x0 + 40, r.y0 + 30, r.x1 - 30, r.y1 - 55)


def upright_page(doc: "fitz.Document", pno: int) -> tuple["fitz.Page", "fitz.Document | None"]:
    """
    DTK-uppslagen är satta på tvären i ett stående häfte — man vrider provhäftet
    ett kvarts varv för att läsa dem. Texten kommer då ut liggande ur PDF:en och
    både uppgiftsnummer och bildutsnitt hamnar fel.

    Returnerar en upprätt version av sidan (en ny endsidig PDF som visar den
    roterade sidan) plus dokumentet den lever i, som anroparen måste hålla kvar
    så länge sidan används.
    """
    page = doc[pno]
    dirs: dict[tuple[int, int], int] = {}
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            key = (round(line["dir"][0]), round(line["dir"][1]))
            dirs[key] = dirs.get(key, 0) + 1
    if not dirs or max(dirs, key=dirs.get) == (1, 0):
        return page, None

    # PyMuPDF ger alltid textkoordinater i sidans oroterade rum, även när sidan
    # har /Rotate satt. Vi nollar därför sidans egen rotation på en kopia innan
    # råinnehållet vrids ett kvarts varv — annars adderas de två rotationerna
    # och sidan hamnar tillbaka på tvären (2016–2015 års DTK-uppslag).
    src = fitz.open()
    src.insert_pdf(doc, from_page=pno, to_page=pno)
    src[0].set_rotation(0)
    box = src[0].rect

    tmp = fitz.open()
    new = tmp.new_page(width=box.height, height=box.width)
    new.show_pdf_page(new.rect, src, 0, rotate=270)
    return new, tmp


def drawings_in(page: "fitz.Page", rect: "fitz.Rect", min_area: float = 12.0) -> int:
    """
    Antal vektorobjekt inuti rect. Används för att avgöra om en uppgift
    innehåller figur/formelstreck och därför måste renderas som bild i stället
    för text. Streck tunnare än min_area (understrykningar, ramar) räknas inte.
    """
    page_area = page.rect.width * page.rect.height
    n = 0
    for d in page.get_drawings():
        r = fitz.Rect(d["rect"])
        if r.is_empty or not r.intersects(rect):
            continue
        area = r.width * r.height
        if area < min_area:
            continue
        # Ignorera sidbreda linjaler (sidhuvudets streck) och den heltäckande
        # ram varje provsida ritas med.
        if r.width > page.rect.width * 0.85 and r.height < 3:
            continue
        if area > page_area * 0.8:
            continue
        n += 1
    return n
