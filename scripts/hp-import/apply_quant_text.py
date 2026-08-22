#!/usr/bin/env python3
"""
Skriver om XYZ/KVA/NOG-uppgifter i src/data/prov/ från bildutsnitt till text.

DTK rörs aldrig — dess uppgifter kräver ett diagram att läsa ur. XYZ/KVA/NOG
lagrades som bildutsnitt för att UHR:s PDF:er inte går att extrahera matematik
ur maskinellt (se kvant.py) — men en människa (eller en multimodal modell) kan
läsa bilden och skriva av den korrekt, vilket den här filen gör: varje uppgift
nedan är avskriven för hand ur sin faktiska bild och kontrollräknad mot
provets eget facit (`answer`) innan den skrevs in här.

VARFÖR INTE EN LLM SOM GISSAR UR PDF-TEXTEN: `clean-math-questions` (Supabase
edge function, borttagen) gjorde precis det och hittade på fel matematik —
"31x" blev "$\\frac{31x}{27}$" utan att någon läste bilden. Skräptexten
("$ 1 2 1 3 1 +") räcker inte för att rekonstruera vad som stod på sidan; bara
bilden vet det. Varje uppgift här är därför transkriberad ur sin bild, inte
gissad ur `text`-fältets PDF-extraktion.

En del XYZ/KVA-uppgifter har en egen figur (geometri, diagram) som hör till
själva frågan, inte bara alternativen — de skiljer sig från DTK, vars bild
delas av flera uppgifter i samma pass. Håll bilden (`keep_image=True`), skriv
bara om alternativen: de fyra/fem är nästan alltid ren text redan
("I är större än II" osv.) och kräver ingen bild.

Kör: python3 scripts/hp-import/apply_quant_text.py [--apply]
Utan --apply: visar vad som skulle ändras. Med --apply: skriver filerna.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "src" / "data" / "prov"

STD_KVA = ["I är större än II", "II är större än I", "I är lika med II", "informationen är otillräcklig"]
STD_NOG = [
    "i (1) men ej i (2)",
    "i (2) men ej i (1)",
    "i (1) tillsammans med (2)",
    "i (1) och (2) var för sig",
    "ej genom de båda påståendena",
]

# term-pass -> { nr: {"text": str|None, "alternatives": [str], "keep_image": bool} }
# text=None betyder "rör inte stam-texten" (frågan har en egen figur som stannar
# kvar som bild) — bara alternativen skrivs om.
PATCH: dict[str, dict[int, dict]] = {
    "2013ht-3": {
        1: {"text": "Vad är $1 + \\frac{1}{2} \\cdot \\frac{1}{3}$?",
            "alternatives": ["$\\frac{3}{6}$", "$\\frac{7}{6}$", "$\\frac{6}{5}$", "$\\frac{7}{5}$"]},
        2: {"text": "Maria kan köra 350 km på 19 liter bensin. Vilket samband visar hur många liter "
                     "bensin ($L$) Marias bil förbrukar på 1 710 km?",
            "alternatives": ["$\\frac{19}{350} = \\frac{L}{1710}$", "$\\frac{19}{L} = \\frac{1710}{350}$",
                              "$\\frac{L}{350} = \\frac{1710}{19}$", "$\\frac{19}{350} = \\frac{1710}{L}$"]},
        3: {"text": "$a$, $b$ och $c$ är tre positiva heltal så att $a \\cdot b = 22$ och "
                     "$b \\cdot c = 26$. Vilket svarsalternativ är ett möjligt värde för $a + b + c$?",
            "alternatives": ["22", "24", "26", "48"]},
        4: {"text": "Vad gäller för $x$ och $y$ om 6 procent av $x$ är lika med 5 procent av $y$, "
                     "där både $x$ och $y$ är större än noll?",
            "alternatives": ["$x > y$", "$x < y$", "$x = y$", "$5x = 6y$"]},
        5: {"text": "Vad är $x$ om $\\frac{x \\cdot 3 \\cdot 9}{100 \\cdot 12} = 81$?",
            "alternatives": ["1 200", "2 700", "3 600", "97 200"]},
        6: {"text": None, "keep_image": True,
            "alternatives": ["$(25\\pi - 25)$ cm$^2$", "$(25\\pi - 50)$ cm$^2$",
                              "$(50\\pi - 50)$ cm$^2$", "$(50\\pi - 100)$ cm$^2$"]},
        7: {"text": "Hur många primtal finns det mellan 40 och 50?",
            "alternatives": ["2", "3", "4", "5"]},
        8: {"text": "En låda i form av ett rätblock har volymen 12 dm$^3$. Vilken volym får lådan "
                     "om längden av alla kanter halveras?",
            "alternatives": ["1,5 dm$^3$", "2 dm$^3$", "3 dm$^3$", "6 dm$^3$"]},
        9: {"text": "Vad är medelvärdet av $\\frac{7}{8}$ och $-\\frac{3}{4}$?",
            "alternatives": ["$\\frac{1}{16}$", "$\\frac{1}{8}$", "$\\frac{1}{4}$", "$\\frac{1}{2}$"]},
        10: {"text": "Vad är $\\frac{1-x}{xy}$ om $xy \\neq 0$?",
             "alternatives": ["$\\frac{1}{x} - \\frac{1}{xy}$", "$\\frac{1}{y} - \\frac{1}{xy}$",
                               "$\\frac{1}{xy} - \\frac{1}{x}$", "$\\frac{1}{xy} - \\frac{1}{y}$"]},
        11: {"text": "I en låda finns det 3 gånger så många äpplen som päron och 9 gånger så många "
                      "päron som bananer. Om $x$ är antalet äpplen, vilket uttryck motsvarar då det "
                      "totala antalet frukter i lådan?",
             "alternatives": ["$13x$", "$31x$", "$\\frac{13}{3}x$", "$\\frac{37}{27}x$"]},
        12: {"text": "En undersökning på en arbetsplats visade att 47 % av de anställda kunde tyska "
                      "och 43 % kunde franska, medan 40 % varken kunde tyska eller franska. Hur stor "
                      "andel av de anställda kunde både tyska och franska?",
             "alternatives": ["10 %", "20 %", "30 %", "50 %"]},
        13: {"text": "Kvantitet I: $69 \\cdot 116$\nKvantitet II: $68 \\cdot 117$", "alternatives": STD_KVA},
        14: {"text": "$x$ procent av $y$ är lika med $z$ procent av $w$.\n"
                      "Kvantitet I: $x \\cdot w$\nKvantitet II: $y \\cdot z$", "alternatives": STD_KVA},
        15: {"text": None, "keep_image": True, "alternatives": STD_KVA},
        16: {"text": "$x = -y$\nKvantitet I: $x$\nKvantitet II: $y$", "alternatives": STD_KVA},
        17: {"text": None, "keep_image": True, "alternatives": STD_KVA},
        18: {"text": "Kvantitet I: $(-10)^{11}$\nKvantitet II: $(-11)^{10}$", "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: Längsta sidan i en rektangel med omkretsen 36 cm\n"
                      "Kvantitet II: Omkretsen av en kvadrat med sidan 3 cm", "alternatives": STD_KVA},
        20: {"text": "Summan av $n$ positiva tal är lika med summan av $m$ positiva tal.\n"
                      "Kvantitet I: $n$\nKvantitet II: $m$", "alternatives": STD_KVA},
        21: {"text": "$a$, $b$, $c$, $d$ och $e$ är fem på varandra följande heltal sådana att "
                      "$a < b < c < d < e$ och $a = -2d$.\nKvantitet I: $b$\nKvantitet II: $0$",
             "alternatives": STD_KVA},
        22: {"text": "$x(1 - x) > 0$\nKvantitet I: $x$\nKvantitet II: $x^2$", "alternatives": STD_KVA},
        23: {"text": "På en buss finns det 8 män och 14 kvinnor. Hur många av personerna på bussen "
                      "har hatt?\n\n(1) En fjärdedel av männen har hatt.\n(2) Om en man med hatt "
                      "kliver av bussen så innebär det att fyra gånger så många kvinnor som män på "
                      "bussen har hatt.", "alternatives": STD_NOG},
        24: {"text": "I en ladugård finns enbart grisar, höns och får. Hur många djur finns i "
                      "ladugården?\n\n(1) Det finns fem får i ladugården och 1/8 av djuren i "
                      "ladugården är grisar.\n(2) 25 procent av djuren i ladugården är höns.",
             "alternatives": STD_NOG},
        25: {"text": None, "keep_image": True, "alternatives": STD_NOG},
        26: {"text": "Anna och Karin fyller båda år den 4 juli. Hur gammal var Karin den 4 juli "
                      "2001?\n\n(1) Den 4 juli 2007 var Karin 24 år yngre än Anna.\n(2) Den 4 juli "
                      "2014 kommer Anna att vara dubbelt så gammal som Karin.", "alternatives": STD_NOG},
        27: {"text": "En röd och en grön bil startade från samma punkt och körde i motsatta "
                      "riktningar under 2 timmar. De hade då tillsammans kört 234 km. Vilken var "
                      "respektive bils medelhastighet?\n\n(1) Medelhastigheten för den röda bilen "
                      "var 27 km/h högre än för den gröna bilen.\n(2) Den röda bilens medelhastighet "
                      "var 60 procent högre än den gröna bilens.", "alternatives": STD_NOG},
        28: {"text": "På en marknad står tre marknadsstånd på rad som säljer var sin produkt. "
                      "Produkterna är tröjor, strumpor och byxor. En av dessa produkter är enbart "
                      "svart, en är enbart vit och en är enbart blå. Det mittersta marknadsståndet "
                      "säljer tröjor. Vilken färg har strumporna som säljs?\n\n(1) Tröjorna är inte "
                      "vita.\n(2) Byxorna är blå och finns bredvid de svarta produkterna.",
             "alternatives": STD_NOG},
    },
    # Uppgifter med en egen figur (geometri, sträckor, illustration) hoppas
    # över helt i den här omgången — bara ren text konverteras. Uteslutna
    # här: 10 (rätvinklig triangel), 15 (cirklar), 20 (femhörning), 23
    # (illustration av fyra stugor), 27 (triangel med delade vinklar).
    "2012ht-1": {
        1: {"text": "Då det positiva heltalet $x$ divideras med 8 erhålls resten 2. Vad blir "
                     "resten då $(x + 9)$ divideras med 8?", "alternatives": ["1", "2", "3", "4"]},
        2: {"text": "I en grupp på 30 personer är förhållandet mellan antalet män och antalet "
                     "kvinnor 3:2. Hur många i gruppen är kvinnor?",
            "alternatives": ["6", "10", "12", "15"]},
        3: {"text": "Om $x = 3$, vad är då $x^3(x^3 - x^2)$?",
            "alternatives": ["27", "81", "486", "18 954"]},
        4: {"text": "Lös ut $b$ ur formeln $a(b-1) = c$",
            "alternatives": ["$b = \\frac{c}{a} + 1$", "$b = \\frac{c}{a} - 1$",
                              "$b = \\frac{c+1}{a}$", "$b = \\frac{c-1}{a}$"]},
        5: {"text": "Vilken funktion visar volymen $L$ vid tiden $t$?\n\n"
                     "$t$ (timmar): 0, 1, 2, 3\n$L$ (liter): 19, 13, 7, 1",
            "alternatives": ["$L = 6t + 19$", "$L = 6t - 19$", "$L = -6t + 19$", "$L = -6t - 19$"]},
        6: {"text": "Vad blir $\\frac{1}{2} + \\frac{\\frac{2}{3}}{\\frac{3}{4}} - "
                     "\\left(\\frac{4}{5} \\cdot \\frac{5}{6}\\right)$?",
            "alternatives": ["$\\frac{1}{3}$", "$\\frac{13}{18}$", "$\\frac{3}{4}$", "$\\frac{23}{24}$"]},
        7: {"text": "Kuben $K_1$ har volymen $x$ cm$^3$. Sidan i kuben $K_2$ är tre gånger så "
                     "lång som sidan i kuben $K_1$. Hur många kuber $K_1$ motsvarar volymen av "
                     "kuben $K_2$?", "alternatives": ["9", "12", "24", "27"]},
        8: {"text": "Vad är medelvärdet av $\\frac{3}{8}$ och 0,065?",
            "alternatives": ["0,18", "0,22", "0,36", "0,44"]},
        9: {"text": "Vad är $x$ om $\\frac{1}{x} = \\frac{1}{2} + \\frac{1}{3}$?",
            "alternatives": ["$\\frac{5}{6}$", "$\\frac{6}{5}$", "5", "6"]},
        11: {"text": "Vilket svarsförslag är minst?",
             "alternatives": ["$\\frac{1}{12} - \\frac{1}{11}$", "$\\frac{1}{11} - \\frac{1}{12}$",
                               "$\\frac{\\frac{1}{12}}{\\frac{1}{11}}$", "$\\frac{1}{12} \\cdot \\frac{1}{11}$"]},
        12: {"text": "Om $a = 2/b$ och $b = 3/c$, hur många $a$ motsvarar då $6c$?",
             "alternatives": ["6", "9", "12", "18"]},
        13: {"text": "$x < y$\nKvantitet I: $4 - x$\nKvantitet II: $4 - y$", "alternatives": STD_KVA},
        14: {"text": "$x$, $y$ och $z$ är tre på varandra följande heltal och $xyz = 0$\n"
                      "Kvantitet I: $0$\nKvantitet II: $z$", "alternatives": STD_KVA},
        16: {"text": "Ett 10 meter långt snöre delas i fyra bitar; tre lika långa och en kortare "
                      "bit.\nKvantitet I: Längden på en av de tre bitar som är lika långa\n"
                      "Kvantitet II: 3 meter", "alternatives": STD_KVA},
        17: {"text": "$a = 2b$\n$b = 3c$\nKvantitet I: $a + b + c$\nKvantitet II: $10c$",
             "alternatives": STD_KVA},
        18: {"text": "$x$ är 80 % av 60\n35 är 70 % av $y$\nKvantitet I: $x$\nKvantitet II: $y$",
             "alternatives": STD_KVA},
        19: {"text": "Funktionen $g$ ges av $g(x) = 4 - x^2$\nKvantitet I: $g(4)$\n"
                      "Kvantitet II: $g(-4)$", "alternatives": STD_KVA},
        21: {"text": "$m = \\frac{3x}{4}$\n$n = \\frac{4x}{3}$\nKvantitet I: $x^2$\n"
                      "Kvantitet II: $mn$", "alternatives": STD_KVA},
        22: {"text": "Fem olika positiva heltal har medelvärdet 12 och medianen 15.\n"
                      "Kvantitet I: Största möjliga värdet på det största av talen\n"
                      "Kvantitet II: 27", "alternatives": STD_KVA},
        24: {"text": "Per har en konstant månadsutgift för godis. Han har som mål att minska den "
                      "till hälften. Hur många månader tar det innan han har lyckats?\n\n"
                      "(1) Pers utgift för godis minskar med 10 procent per månad.\n"
                      "(2) När Per har halverat månadsutgiften för godis har den minskat med 200 kr.",
             "alternatives": STD_NOG},
        25: {"text": "I en hiss som startar från bottenvåningen är medelåldern på personerna i "
                      "hissen 30 år. Vid nästa stopp, på första våningen, kliver en person ur "
                      "hissen och en person kliver på. Vad är medelåldern på personerna i hissen "
                      "när den lämnar första våningen?\n\n(1) Den som kliver på hissen vid första "
                      "våningen är 10 år äldre än den som kliver ur.\n(2) Det är fem personer i "
                      "hissen när den startar från bottenvåningen.", "alternatives": STD_NOG},
        26: {"text": "Kusinerna Arvid, Elin och Moa har en sammanlagd ålder på 30 år. Hur gammal "
                      "är Elin?\n\n(1) Moa, som är yngst av de tre, är 6 år gammal.\n"
                      "(2) Arvid är dubbelt så gammal som en av sina kusiner.", "alternatives": STD_NOG},
        28: {"text": "I en fågeldamm finns det änder och svanar. Vad är kvoten mellan antalet "
                      "änder och antalet svanar?\n\n(1) Svanarna är 50 färre än hälften av "
                      "antalet änder.\n(2) Antalet svanar är $\\frac{3}{11}$ av antalet änder.",
             "alternatives": STD_NOG},
    },
    # Uteslutna (egen figur): 4 (triangel), 6 (fyrhörning), 14 (vinklar),
    # 17 (cirkelbågar).
    "2013ht-5": {
        1: {"text": "Vad är $\\frac{2}{3}$ av $\\frac{3}{4}$?",
            "alternatives": ["$\\frac{1}{2}$", "$\\frac{3}{7}$", "$\\frac{5}{7}$", "$\\frac{5}{12}$"]},
        2: {"text": "$a \\neq 0$\n$b \\neq 0$\nVad är $x$ om $\\frac{b}{a+x} = \\frac{b}{2x}$?",
            "alternatives": ["$\\frac{ab}{2}$", "$ab$", "$\\frac{a}{3}$", "$a$"]},
        3: {"text": "Vad är korrekt?",
            "alternatives": ["En positiv täljare och en negativ nämnare ger en negativ kvot.",
                              "En negativ täljare och en positiv nämnare ger en positiv kvot.",
                              "Produkten av ett negativt och ett positivt tal är positiv.",
                              "Produkten av två negativa tal är negativ."]},
        5: {"text": "En partikel färdas $1 \\cdot 10^{10}$ cm per sekund under $4 \\cdot 10^{-8}$ "
                     "sekunder. Hur många cm har partikeln färdats?",
            "alternatives": ["$4 \\cdot 10^{18}$ cm", "$4 \\cdot 10^{2}$ cm",
                              "$4 \\cdot 10^{-18}$ cm", "$4 \\cdot 10^{-80}$ cm"]},
        7: {"text": "Vad måste gälla för $b$ om $a + b > a - 2b$?",
            "alternatives": ["$b > 0$", "$b < 0$", "$b > a$", "$b < a$"]},
        8: {"text": "Vad blir $(3x^3y^2z)^4$?",
            "alternatives": ["$12x^7y^6z^5$", "$12x^{12}y^8z^4$", "$81x^7y^6z^5$", "$81x^{12}y^8z^4$"]},
        9: {"text": "Linjerna $y = -x + 7$ och $y = \\frac{2}{3}x - \\frac{4}{3}$ skär varandra i "
                     "punkten $P = (x_1, y_1)$.\n\nVad gäller för koordinaterna i punkten $P$?",
            "alternatives": ["$x_1 > 0; y_1 > 0$", "$x_1 > 0; y_1 < 0$",
                              "$x_1 < 0; y_1 > 0$", "$x_1 < 0; y_1 < 0$"]},
        10: {"text": "Kalle läser en sida på $m$ minuter. Hur många sidor läser han på 7 minuter?",
             "alternatives": ["$7m$", "$7 + m$", "$\\frac{7}{m}$", "$\\frac{m}{7}$"]},
        11: {"text": "Vad är $x$ om $\\frac{x}{5} - \\frac{x}{10} + \\frac{x}{15} - \\frac{x}{20} "
                      "= 1 - \\frac{1}{2} + \\frac{1}{3} - \\frac{1}{4}$?",
             "alternatives": ["–5", "–1/5", "1/5", "5"]},
        12: {"text": "En elev ska väljas slumpmässigt ur klassen. Sannolikheten att en pojke "
                      "väljs är 2/3 av sannolikheten att en flicka väljs. Vad är kvoten mellan "
                      "antalet pojkar och det totala antalet elever i klassen?",
             "alternatives": ["$\\frac{1}{3}$", "$\\frac{2}{5}$", "$\\frac{2}{3}$", "$\\frac{3}{5}$"]},
        13: {"text": "$x > 0$\nKvantitet I: $-\\frac{7}{4}x$\nKvantitet II: $-\\frac{3}{2}x$",
             "alternatives": STD_KVA},
        15: {"text": "$x > 0$\nKvantitet I: $\\frac{1}{x} + x$\nKvantitet II: $2$",
             "alternatives": STD_KVA},
        16: {"text": "$b = a + 1$\nKvantitet I: $ab - 2a^2$\nKvantitet II: $a(b - 2a)$",
             "alternatives": STD_KVA},
        18: {"text": "$b > 1$\n$x > 0$\nKvantitet I: $\\frac{x^b}{b}$\nKvantitet II: "
                      "$\\left(\\frac{x}{b}\\right)^b$", "alternatives": STD_KVA},
        19: {"text": "$x$, $y$, $z$, $w$ är fyra på varandra följande heltal så att "
                      "$w > z > y > x$.\nKvantitet I: Medelvärdet av $x$ och $w$\n"
                      "Kvantitet II: Medelvärdet av $y$ och $z$", "alternatives": STD_KVA},
        20: {"text": "Ett cykelhjul rullar längs en rät linje utan att glida och på 3 varv "
                      "rullar hjulet sträckan 18 meter.\nKvantitet I: Hjulets diameter\n"
                      "Kvantitet II: 2 meter", "alternatives": STD_KVA},
        21: {"text": "Kvantitet I: $x(y+z) + x^2 + yz$\nKvantitet II: $(x+z)(y+x)$",
             "alternatives": STD_KVA},
        22: {"text": "I ett koordinatsystem utgör punkterna $(-1, a)$, $(2, 2)$ och $(2, 4)$ "
                      "hörnen i en rätvinklig triangel.\nKvantitet I: $a$\nKvantitet II: $2$",
             "alternatives": STD_KVA},
        23: {"text": "En cykelhandlare har fem enfärgade cyklar till salu. Det finns både herr- "
                      "och damcyklar. Färgen på cyklarna är svart, blå, röd eller grön, och två "
                      "av cyklarna har samma färg. Vilken färg har dessa två cyklar?\n\n"
                      "(1) Herrcyklarna finns i tre färger.\n(2) Den ena av de båda damcyklarna "
                      "är röd medan den andra har en annan färg. Det finns ingen svart eller "
                      "grön damcykel.", "alternatives": STD_NOG},
        24: {"text": "Ett museum köpte ett antal nya skulpturer vid ett visst tillfälle. Köpet "
                      "resulterade i att det totala värdet av museets samtliga skulpturer ökade "
                      "med 25 procent. Hur många nya skulpturer köptes in?\n\n(1) Före köpet var "
                      "museets 40 skulpturer värda 12 miljoner kronor.\n(2) Efter köpet var det "
                      "genomsnittliga värdet 300 000 kronor per skulptur.", "alternatives": STD_NOG},
        25: {"text": "24-karats guld innehåller 99,6 viktprocent rent guld. Antag att resterande "
                      "0,4 procent är koppar, zink och nickel. Hur många gram koppar innehåller "
                      "en 24-karats guldtacka som väger 1 kg?\n\n(1) Vikthalten nickel i "
                      "24-karats guld är 500 ppm (parts per million).\n(2) Guldtackan innehåller "
                      "1 gram zink.", "alternatives": STD_NOG},
        26: {"text": "Karolina kastar en diskus tre gånger. Hennes första och tredje kast är "
                      "lika långa. Hur långt är hennes tredje kast?\n\n(1) Hennes andra kast är "
                      "en tredjedel av de två övriga kastens sammanlagda längd.\n(2) Hennes "
                      "första kast är 33 meter plus en tredjedel av det tredje kastets längd.",
             "alternatives": STD_NOG},
        27: {"text": "I en ask finns enbart röda, gröna och blå pärlor. Maria tar upp en pärla "
                      "slumpmässigt. Hur stor är sannolikheten att denna pärla är röd?\n\n"
                      "(1) Sannolikheten att ta upp en blå eller en röd pärla är 0,7.\n"
                      "(2) Sannolikheten att ta upp en grön eller röd pärla är 0,9.",
             "alternatives": STD_NOG},
        28: {"text": "A och B planterar sammanlagt 120 träd. Om A och B arbetar samtidigt utan "
                      "rast tar planteringen 6 timmar. A och B planterar alltid med sina egna "
                      "konstanta hastigheter. Hur lång tid skulle det ta för B att ensam plantera "
                      "de 120 träden?\n\n(1) A planterar 3 träd på samma tid som B planterar 2 "
                      "träd.\n(2) Det skulle ta 10 timmar för A att ensam plantera de 120 träden.",
             "alternatives": STD_NOG},
    },
    # Uteslutna (egen figur): 2 (sträcka med punkter), 3 (parallelltrapets),
    # 19 (parallella linjer med trianglar).
    "2013vt-2": {
        1: {"text": "Vad är $5 + 4 \\cdot 3 - 20/10$?", "alternatives": ["–0,3", "0,7", "15", "25"]},
        4: {"text": "Kurvan $y = x^2 + x - 6$ skär $x$-axeln i två punkter. Vilka $x$-värden "
                     "har dessa punkter?",
            "alternatives": ["$x = 3$ och $x = 2$", "$x = 3$ och $x = -2$",
                              "$x = -3$ och $x = 2$", "$x = -3$ och $x = -2$"]},
        5: {"text": "Vid beräkning av $\\left(\\frac{4}{5} - \\frac{3}{4}\\right) + "
                     "\\left(\\frac{2}{3} + \\frac{1}{2}\\right)$ erhålls ett bråk av positiva "
                     "heltal. Vilken är den minsta nämnare som bråket kan ha?",
            "alternatives": ["6", "20", "60", "72"]},
        6: {"text": "$\\frac{x(y-z)}{y(x+y+z)} = \\frac{1}{3}$\n\nOm $x = 4$ och $y = 3$, vad "
                     "är då $z$?", "alternatives": ["1", "2", "3", "4"]},
        7: {"text": "Om Lotta var 28 år för $x$ år sedan, hur gammal var hon för 12 år sedan?",
            "alternatives": ["$(16 + x)$ år", "$(16 - x)$ år", "$(40 + x)$ år", "$(40 - x)$ år"]},
        8: {"text": "Vad är $(3x-1)2x - x(3x-2)$?",
            "alternatives": ["$3x^2$", "$3x^2 - 4x$", "$9x^2$", "$9x^2 - 4x$"]},
        9: {"text": "$a$, $b$ och $c$ är tre på varandra följande heltal så att $a < b < c$.\n\n"
                     "Vad är $\\frac{(a-b)}{(b-c)} \\cdot (a-c)$?", "alternatives": ["–2", "–1", "1", "2"]},
        10: {"text": "$x \\neq 0$\n\nVad är $\\frac{x^n}{y^n}$ om $x - y = 0$ och $n$ är jämnt "
                      "delbart med 2?", "alternatives": ["–1", "0", "1", "2"]},
        11: {"text": "40 personer deltar i ett prov med 6 frågor.\n\nAntal poäng: 0, 1, 2, 3, 4, "
                      "5, 6\nAntal personer: 5, 12, 3, 10, 4, 4, 2\n\nVad är medianpoängen?",
             "alternatives": ["2", "2,5", "3", "4"]},
        12: {"text": "Arean av en cirkel är 16 cm$^2$ större än arean av en kvadrat med sidan "
                      "3 cm. Vad är cirkelns radie?",
             "alternatives": ["$\\frac{5}{\\pi}$ cm", "$\\frac{5}{\\sqrt{\\pi}}$ cm",
                               "$\\frac{\\sqrt{5}}{\\pi}$ cm", "$\\sqrt{\\frac{5}{\\pi}}$ cm"]},
        13: {"text": "Kvantitet I: $15 \\cdot 36 + 15 \\cdot 64$\nKvantitet II: 1 501",
             "alternatives": STD_KVA},
        14: {"text": "Kvantitet I: Diagonalen i rektangeln ABCD\nKvantitet II: Halva omkretsen "
                      "i rektangeln ABCD", "alternatives": STD_KVA},
        15: {"text": "I en låda finns endast blå, röda och gula bollar. 1/3 av bollarna är blå "
                      "och 1/6 av bollarna är röda. En boll dras slumpmässigt.\nKvantitet I: "
                      "Sannolikheten att den dragna bollen är gul\nKvantitet II: Sannolikheten "
                      "att den dragna bollen är blå eller röd", "alternatives": STD_KVA},
        16: {"text": "$8x + 4 = 10$\nKvantitet I: $4x + 2$\nKvantitet II: $8 - \\frac{10}{4}$",
             "alternatives": STD_KVA},
        17: {"text": "$a < b$\nKvantitet I: Avståndet mellan origo $(0,0)$ och $(a,b)$\n"
                      "Kvantitet II: Avståndet mellan origo $(0,0)$ och $(b,a)$", "alternatives": STD_KVA},
        18: {"text": "$x > 0$\nKvantitet I: $\\frac{x^{-2}}{2}$\nKvantitet II: "
                      "$\\left(\\frac{x}{2}\\right)^{-2}$", "alternatives": STD_KVA},
        20: {"text": "$k$, $m$ och $n$ är heltal. $0 < k < m < n$.\nKvantitet I: $\\frac{m}{n}$\n"
                      "Kvantitet II: $\\frac{k}{m}$", "alternatives": STD_KVA},
        21: {"text": "$x > 0$\nKvantitet I: $x^{\\frac{1}{4}}$\nKvantitet II: $\\sqrt{\\sqrt{x}}$",
             "alternatives": STD_KVA},
        22: {"text": "$x$ och $y$ är positiva heltal.\n$5x + 10y = 270\\,580$\nKvantitet I: "
                      "Största möjliga värdet på $x$\nKvantitet II: Största möjliga värdet på $y$",
             "alternatives": STD_KVA},
        23: {"text": "Vid en förskoleavdelning för barn i åldrarna 1-3 år finns 12 barn. Vilken "
                      "är medelåldern bland flickorna på avdelningen?\n\n(1) Medelåldern på "
                      "barnen som går på avdelningen är två år.\n(2) Två tredjedelar av barnen "
                      "på avdelningen är flickor.", "alternatives": STD_NOG},
        24: {"text": "Arvid, Benjamin och Clara startar samtidigt från startplatsen. De går med "
                      "konstanta hastigheter runt en bana som är 400 meter lång. Efter hur lång "
                      "tid passerar de samtidigt startplatsen första gången?\n\n(1) Clara går "
                      "dubbelt så fort som Arvid, och medelvärdet av Arvids och Claras "
                      "hastigheter är lika med Benjamins hastighet.\n(2) Arvids hastighet är "
                      "2 km/h, Benjamins är 3 km/h och Claras är 4 km/h.", "alternatives": STD_NOG},
        25: {"text": "På en cykelparkering finns enbart herrcyklar, damcyklar och barncyklar. "
                      "Hur många barncyklar finns det på parkeringen?\n\n(1) Det finns totalt "
                      "210 cyklar på parkeringen och av dem är 4/7 herrcyklar och 48 är "
                      "damcyklar.\n(2) Det finns 48 damcyklar och 120 herrcyklar. 20 procent av "
                      "det totala antalet cyklar på parkeringen är barncyklar.", "alternatives": STD_NOG},
        26: {"text": "Isabella, Anna, Katja, Olga och Fatima bor i samma tvåvåningshus. Olga bor "
                      "inte på samma våning som Katja och Fatima. Isabella bor på den övre "
                      "våningen. På vilken våning bor respektive kvinna?\n\n(1) Det bor minst "
                      "två kvinnor på varje våning.\n(2) Anna bor på en annan våning än Isabella "
                      "och Katja.", "alternatives": STD_NOG},
        27: {"text": "En spelkula kastas slumpmässigt och landar på ett cirkulärt plant bord. På "
                      "bordet finns en triangelformad duk vars hörn tangerar bordets kanter. Vad "
                      "är sannolikheten att spelkulan landar utanför duken?\n\n(1) Bordets radie "
                      "är 20 cm och dukens area är 400 cm$^2$.\n(2) Dukens hypotenusa har samma "
                      "längd som bordets diameter.", "alternatives": STD_NOG},
        28: {"text": "En vinterlördag åker Gunilla skridskor på en frusen sjö. Hur tjock är isen "
                      "på sjön den lördagen?\n\n(1) Isen är 25 procent tjockare den lördagen än "
                      "den var en vecka tidigare.\n(2) Under vintern blir isen 1 cm tjockare "
                      "varje vecka.", "alternatives": STD_NOG},
    },
}


def apply_patch(dry_run: bool) -> None:
    for key, questions in PATCH.items():
        path = DATA_DIR / f"{key}.json"
        if not path.exists():
            print(f"SAKNAS: {path}")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        qs = data["questions"] if isinstance(data, dict) else data
        by_nr = {q["nr"]: q for q in qs if q.get("delprov") in ("XYZ", "KVA", "NOG")}
        changed = 0
        for nr, patch in questions.items():
            q = by_nr.get(nr)
            if q is None:
                print(f"  {key} #{nr}: hittas inte, hoppar över")
                continue
            keep_image = patch.get("keep_image", False)
            if patch["text"] is not None:
                q["text"] = patch["text"]
            q["alternatives"] = patch["alternatives"]
            if keep_image:
                # Behåll stam-bilden (egen figur), men släpp per-bokstav-crops:
                # alternativen är nu text, och utan alla bokstäver i `crops`
                # faller stammen tillbaka på hela (zoombara) bilden i stället
                # för ett hårt beskuret stam-utsnitt — se ProvQuestionCard.
                if isinstance(q.get("crops"), dict):
                    q["crops"] = {"stem": q["crops"]["stem"]} if "stem" in q["crops"] else None
                    if q["crops"] is None:
                        del q["crops"]
            else:
                q.pop("image", None)
                q.pop("crops", None)
                q.pop("imageAspect", None)
            changed += 1
        print(f"{key}: {changed} uppgifter {'skulle uppdateras' if dry_run else 'uppdaterade'}")
        if not dry_run:
            # Kompakt, utan mellanslag — samma format build.py skriver, så
            # diffen visar bara de fält som faktiskt ändrades.
            path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


if __name__ == "__main__":
    apply_patch(dry_run="--apply" not in sys.argv)
