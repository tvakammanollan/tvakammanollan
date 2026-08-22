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
    # Uteslutna: 1 (triangel), 20 (triangel). 10 hoppas också över — själva
    # källbilden (10.webp) är avskuren överst och visar bara en del av
    # täljaren, så uttrycket går inte att läsa av tillförlitligt.
    "2013vt-4": {
        2: {"text": "Medelvärdet av tre på varandra följande heltal är 947. Vad är summan av "
                     "det minsta och det största talet?",
            "alternatives": ["1 884", "1 886", "1 894", "1 896"]},
        3: {"text": "På fyra dagar sålde en affär varor för $x$, $y$, $w$ respektive $z$ "
                     "kronor.\n\nOm $x > y > w > z$, vilket av svarsförslagen kan då vara korrekt?",
            "alternatives": ["$y = x + z$", "$x = y + w$", "$w = y + z$", "$z = x + y$"]},
        4: {"text": "Vad är $b$ då $\\frac{x}{y} = \\frac{5a}{3b}$?",
            "alternatives": ["$\\frac{5ax}{y}$", "$\\frac{5ax}{3y}$", "$\\frac{5ay}{x}$", "$\\frac{5ay}{3x}$"]},
        5: {"text": "Bestäm koordinaterna för mittpunkten på sträckan som har $(-3,-2)$ och "
                     "$(7,4)$ som ändpunkter.",
            "alternatives": ["$(2, 1)$", "$(2, 3)$", "$(5, 1)$", "$(5, 3)$"]},
        6: {"text": "Vilket av följande tal ligger närmast 1?",
            "alternatives": ["$\\frac{4}{5}$", "$\\frac{5}{4}$", "$\\frac{7}{9}$", "$\\frac{9}{7}$"]},
        7: {"text": "Vad är $t$, om $(t-1)^t = 81$?", "alternatives": ["3", "4", "6", "9"]},
        8: {"text": "Ett tal i följden 55, 150, 435, 1 290, … bildas genom att föregående tal "
                     "multipliceras med heltalet $x$ och den erhållna produkten subtraheras med "
                     "heltalet $y$. Vad är summan av $x$ och $y$?", "alternatives": ["12", "15", "18", "21"]},
        9: {"text": "Vad gäller för $x$ om $x > x^2$?",
            "alternatives": ["$x < -1$", "$-1 < x < 0$", "$0 < x < 1$", "$x > 1$"]},
        11: {"text": "$x > 0$\n\nVad är $x$ om $x^2 = 0,5$?",
             "alternatives": ["0,25", "0,75", "$\\sqrt{2}$", "$\\frac{1}{\\sqrt{2}}$"]},
        12: {"text": "En mindre kvadrat med sidan $x$ cm är inritad i en större kvadrat. Sidan i "
                      "den större kvadraten är $y$ cm längre än sidan i den mindre. Hur stor är "
                      "skillnaden mellan kvadraternas areor?",
             "alternatives": ["$(2xy + x^2)$ cm$^2$", "$(2xy + y^2)$ cm$^2$",
                               "$(y^2 - 2xy)$ cm$^2$", "$(y^2 - x^2)$ cm$^2$"]},
        13: {"text": "$x = -2$\nKvantitet I: $x \\cdot x$\nKvantitet II: $x + x$", "alternatives": STD_KVA},
        14: {"text": "Anna är idag 4 år äldre än Bea var för 2 år sedan.\nKvantitet I: Annas "
                      "ålder för 2 år sedan\nKvantitet II: Beas ålder idag", "alternatives": STD_KVA},
        15: {"text": "$a < b$\nKvantitet I: $a^2 - b^2$\nKvantitet II: $(a+b)(a-b)$",
             "alternatives": STD_KVA},
        16: {"text": "I triangeln ABC har sidorna AB och BC båda längden 7 cm. Höjden från "
                      "basen AC är 4 cm.\nKvantitet I: Längden av sidan AC\nKvantitet II: 12 cm",
             "alternatives": STD_KVA},
        17: {"text": "$\\frac{1}{y} < 0$\nKvantitet I: $0$\nKvantitet II: $y$", "alternatives": STD_KVA},
        18: {"text": "Funktionen $f$ ges av $f(x) = 3x + 1$\nKvantitet I: $f(a) - f(a+1)$\n"
                      "Kvantitet II: $3$", "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: Medelvärdet av $(3x + 4y + z + 38)$ och $(x + y + z + 94)$\n"
                      "Kvantitet II: Medelvärdet av $(4x + 2z + 94)$ och $(5y + 51)$",
             "alternatives": STD_KVA},
        21: {"text": "$a > 0$, $b > 0$ och $c < 0$\n$a = b + c$\nKvantitet I: $a$\n"
                      "Kvantitet II: $b$", "alternatives": STD_KVA},
        22: {"text": "$n \\geq 0$\n$m \\geq 0$\n$n$ och $m$ är heltal.\nKvantitet I: $(n+1)^m$\n"
                      "Kvantitet II: $m^{(n+1)}$", "alternatives": STD_KVA},
        23: {"text": "Vattendjupet i en brunn är 480 cm. Hur djup är hela brunnen?\n\n"
                      "(1) En niondel av brunnens hela djup är ovanför vattenytan.\n"
                      "(2) Förhållandet mellan vattendjupet och den del av brunnen som är "
                      "ovanför vattenytan är 8:1.", "alternatives": STD_NOG},
        24: {"text": "En skola köper in en kartong äpplen och en kartong päron, sammanlagt "
                      "tvåhundra frukter, som skolbarnen ska äta till mellanmål. Tyvärr visar "
                      "det sig att en del av frukterna är ruttna. Hur många frukter är ruttna?"
                      "\n\n(1) 1/6 av päronen och 1/8 av äpplena är ruttna.\n(2) Femton procent "
                      "av frukterna är ruttna.", "alternatives": STD_NOG},
        25: {"text": "Arne, Karin, Muhammed och Elisabeth spelar kort. De sitter vid varsin sida "
                      "av ett kvadratiskt bord. Vem av dem vinner?\n\n(1) Karin sitter till "
                      "höger om vinnaren och mittemot Elisabeth. Muhammed sitter mellan Karin "
                      "och Elisabeth.\n(2) Arne sitter mittemot Muhammed. Vinnaren sitter till "
                      "höger om Elisabeth.", "alternatives": STD_NOG},
        26: {"text": "Från hemmet till skolan kan Olov ta antingen gångvägen eller en hälften så "
                      "lång genväg. Hur lång är genvägen?\n\n(1) Genvägen är 410 meter kortare "
                      "än gångvägen.\n(2) Om Olov tar genvägen till skolan och gångvägen hem "
                      "från skolan har han gått sammanlagt 1 230 meter.", "alternatives": STD_NOG},
        27: {"text": "Några vänner ska köpa en present tillsammans. Hur mycket kostar "
                      "presenten?\n\n(1) Om var och en bidrar med 140 kr så fattas det 40 kr.\n"
                      "(2) Om var och en bidrar med 160 kr så blir det 60 kr över.",
             "alternatives": STD_NOG},
        28: {"text": "Leila odlar enbart morötter, rädisor och palsternackor i sitt "
                      "trädgårdsland. Hur många rädisor har Leila i sitt trädgårdsland?\n\n"
                      "(1) Antalet rädisor är lika med summan av antalet morötter och "
                      "palsternackor.\n(2) Det finns dubbelt så många palsternackor som "
                      "morötter i trädgårdslandet. Om man avlägsnar 100 rädisor så finns det "
                      "lika många rädisor som morötter i trädgårdslandet.", "alternatives": STD_NOG},
    },
    # Uteslutna: 9 (fyra koordinatgrafer SOM svarsalternativ — kan inte
    # textas), 14 (rätvinklig triangel). NOG (23-28) hade redan ren text i
    # det här passet, alltså inget att göra där.
    "2026vt-3": {
        1: {"text": "Vilket svarsalternativ motsvarar uttrycket $(x+3)(x-5)$?",
            "alternatives": ["$x^2 - 15$", "$x^2 - 2$", "$x^2 - 2x - 15$", "$x^2 - 2x - 8$"]},
        2: {"text": "$f(x) = \\frac{1}{5}x + \\frac{3}{5}$\n\nVilket svarsalternativ är lika "
                     "med $f\\left(\\frac{5}{3}\\right)$?",
            "alternatives": ["$\\frac{3}{15}$", "$\\frac{1}{2}$", "$\\frac{14}{15}$", "1"]},
        3: {"text": "Hur många trubbiga vinklar kan en triangel som mest ha?",
            "alternatives": ["0", "1", "2", "3"]},
        4: {"text": "Varje månad sparar Nils 1/5 av sin lön. Resten av lönen spenderar han. "
                     "Vad är kvoten mellan det Nils sparar och det han spenderar under en månad?",
            "alternatives": ["1/6", "1/5", "1/4", "1/3"]},
        5: {"text": "$\\frac{8}{15} \\cdot x = \\frac{2}{3}$\n\nVilket värde har $x$?",
            "alternatives": ["$\\frac{45}{16}$", "$\\frac{5}{4}$", "$\\frac{16}{45}$", "$\\frac{4}{5}$"]},
        6: {"text": "I en låda finns det tjugo bollar. Dessa är numrerade med heltalen 1–20. "
                     "Siri plockar två bollar ur lådan utan att lägga tillbaka dem. Den ena "
                     "bollen har nummer 11 och den andra bollen har nummer 18. Siri plockar "
                     "slumpmässigt en tredje boll ur lådan. Hur stor är sannolikheten att "
                     "numret på den tredje bollen är större än 11 och mindre än 18?",
            "alternatives": ["$\\frac{1}{3}$", "$\\frac{2}{5}$", "$\\frac{4}{9}$", "$\\frac{3}{10}$"]},
        7: {"text": "Vad är tiotalssiffran i $44 \\cdot 625$?", "alternatives": ["0", "2", "4", "8"]},
        8: {"text": "$2^3 \\cdot 8^2 = 2^x$\n\nVilket värde har $x$?", "alternatives": ["6", "9", "15", "18"]},
        10: {"text": "Vad är 150 % av 50 % av 60?", "alternatives": ["45", "60", "75", "90"]},
        11: {"text": "En cylinder har volymen 16 cm$^3$ och höjden 1 cm. Vilket svarsalternativ "
                      "ligger närmast cylinderns radie?",
             "alternatives": ["2 cm", "4 cm", "5 cm", "$\\sqrt{5}$ cm"]},
        12: {"text": "Vilket svarsalternativ motsvarar $\\frac{2\\sqrt{3}}{3\\sqrt{2}}$?",
             "alternatives": ["1", "$\\frac{\\sqrt{3}}{6}$", "$\\sqrt{\\frac{2}{3}}$", "$\\sqrt{\\frac{3}{2}}$"]},
        13: {"text": "$x > 4$\nKvantitet I: $\\frac{1}{x}$\nKvantitet II: $\\frac{1}{4}$",
             "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: Ett femsiffrigt tal som skrivs med endast sexor och sjuor\n"
                      "Kvantitet II: Ett femsiffrigt tal som skrivs med endast sexor och åttor",
             "alternatives": STD_KVA},
        16: {"text": "$x^2 = 4$\nKvantitet I: $(-2)^{x+2}$\nKvantitet II: $(-2)^{x+3}$",
             "alternatives": STD_KVA},
        17: {"text": "$x > 0$\n$y > 0$\nKvantitet I: Medelvärdet av $x$ och $y$\nKvantitet II: "
                      "Medelvärdet av $2x$ och $\\frac{y}{2}$", "alternatives": STD_KVA},
        18: {"text": "Kvantitet I: Summan av fyra olika ensiffriga jämna positiva heltal\n"
                      "Kvantitet II: Summan av tre olika ensiffriga udda positiva heltal",
             "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: $\\frac{1}{3} - \\frac{1}{2}$\nKvantitet II: "
                      "$\\frac{1}{2} \\cdot \\left(-\\frac{1}{3}\\right)$", "alternatives": STD_KVA},
        20: {"text": "Kvantitet I: Omkretsen av en cirkel med radien 5 cm\nKvantitet II: "
                      "Omkretsen av en rektangel med sidlängderna 5,5 cm och 10 cm",
             "alternatives": STD_KVA},
        21: {"text": "$-1 < x < 0 < y < 1$\nKvantitet I: $\\frac{x}{y}$\nKvantitet II: $\\frac{y}{x}$",
             "alternatives": STD_KVA},
        22: {"text": "För funktionen $f(x) = kx + m$ gäller att $m > 0$ och att $f(a) = 0$ för "
                      "något $a > 0$.\nKvantitet I: $k$\nKvantitet II: $0$", "alternatives": STD_KVA},
    },
    # Uteslutna: 4 (graf i figuren), 6 (parallella linjer/vinklar), 10
    # (kvadrat med triangel), 15 (avståndslinje A-B-C-D), 18 (triangel).
    # NOG (23-28) hade redan ren text i det här passet.
    "2026vt-5": {
        1: {"text": "$3(x-4) = 5(x+2)$\n\nVad är $x$?", "alternatives": ["–11", "–3", "1", "3"]},
        2: {"text": "Melvin löste ekvationen $-6(x-2) = 4x+4$ felaktigt. Han genomförde "
                     "uträkningen i följande fyra steg:\n\n$-6(x-2) = 4x+4$\n"
                     "Steg 1 → $-6x-12 = 4x+4$\nSteg 2 → $-6x = 4x+16$\nSteg 3 → $-10x = 16$\n"
                     "Steg 4 → $x = -1{,}6$\n\nI vilket steg uppstod felet?",
            "alternatives": ["Steg 1", "Steg 2", "Steg 3", "Steg 4"]},
        3: {"text": "Vad är medelvärdet av $\\frac{1}{2}$ och $\\frac{5}{7}$?",
            "alternatives": ["$\\frac{15}{28}$", "$\\frac{4}{7}$", "$\\frac{17}{28}$", "$\\frac{9}{14}$"]},
        5: {"text": "Vad är $\\frac{\\frac{1}{4}+\\frac{1}{5}}{\\frac{1}{6}}$?",
            "alternatives": ["$\\frac{1}{27}$", "$\\frac{2}{3}$", "$\\frac{3}{2}$", "$\\frac{27}{10}$"]},
        7: {"text": "Vad är $0,08 \\cdot 0,03$?", "alternatives": ["0,00024", "0,0024", "0,024", "0,24"]},
        8: {"text": "Vilket svarsalternativ motsvarar uttrycket $-28xyz + 20xy$?",
            "alternatives": ["$-8z$", "$-2xy(14z+10)$", "$4xy(5-7z)$", "$20xy(1-8z)$"]},
        9: {"text": "En funktion $f$ ges av $f(x) = kx + m$, där $m = 7$ och $f(10) = 3$. "
                     "Vad är $f(20)$?", "alternatives": ["–43", "–1", "6", "15"]},
        11: {"text": "Vilket svarsalternativ är lika med $3(4 \\cdot 3^4 - 3^4)$?",
             "alternatives": ["12", "$3^5$", "$4 \\cdot 3^5$", "$3^6$"]},
        12: {"text": "För vilket svarsalternativ gäller med säkerhet att $a^2b - ab^2 > 0$?",
             "alternatives": ["$a < 0, b > 0$", "$a > 0, b < 0$", "$a < 0, b < 0$", "$a > 0, b > 0$"]},
        13: {"text": "Två vanliga sexsidiga tärningar kastas slumpmässigt en gång.\n"
                      "Kvantitet I: Sannolikheten att summan av det tärningarna visar är 3, om "
                      "den ena tärningen visar en tvåa\nKvantitet II: Sannolikheten att summan "
                      "av det tärningarna visar är 7, om den ena tärningen visar en tvåa",
             "alternatives": STD_KVA},
        14: {"text": "Kvantitet I: $\\frac{1}{3} \\cdot \\sqrt{27}$\nKvantitet II: $3$",
             "alternatives": STD_KVA},
        16: {"text": "För de positiva talen $x$ och $y$ gäller att 150 procent av $x$ är lika "
                      "med 50 procent av $y$.\nKvantitet I: $3x$\nKvantitet II: $y$",
             "alternatives": STD_KVA},
        17: {"text": "$y < 0$\nKvantitet I: $-2y$\nKvantitet II: $-(2y)$", "alternatives": STD_KVA},
        19: {"text": "$L_1$, $L_2$ och $L_3$ är räta linjer.\n$L_1$: $y = 2x + 1$\n"
                      "$L_2$: $y = -x + 4$\n$L_3$: $y = x$\n\nKvantitet I: $x$-koordinaten för "
                      "skärningspunkten mellan $L_1$ och $L_3$\nKvantitet II: $x$-koordinaten "
                      "för skärningspunkten mellan $L_2$ och $L_3$", "alternatives": STD_KVA},
        20: {"text": "$x$ är ett heltal större än 1.\nKvantitet I: $\\frac{x}{\\frac{1}{x+1}}$\n"
                      "Kvantitet II: $\\frac{x+1}{x}$", "alternatives": STD_KVA},
        21: {"text": "Den rätvinkliga triangeln T har sidlängderna 3 cm, 4 cm och 5 cm. T har "
                      "lika stor area som kvadraten K.\nKvantitet I: Omkretsen av T\n"
                      "Kvantitet II: Omkretsen av K", "alternatives": STD_KVA},
        22: {"text": "$y \\neq 0$\n$\\frac{x+3y}{y} = 2$\nKvantitet I: $x$\nKvantitet II: $y$",
             "alternatives": STD_KVA},
    },
    # Uteslutna: 2 (parallella linjer), 5 (rektangel/triangel), 21
    # (rätvinklig triangel). Fråga 8:s tomma koordinatsystem är bara ett
    # räknehjälpmedel utan egen information — texten står redan kvar.
    "2025ht-1": {
        1: {"text": "$x + \\frac{1}{4} = \\frac{1}{8}$\n\nVilket värde har $x$?",
            "alternatives": ["$-\\frac{3}{8}$", "$-\\frac{1}{8}$", "$\\frac{1}{4}$", "$\\frac{1}{2}$"]},
        3: {"text": "Vilket svarsalternativ motsvarar uttrycket $(3x+y)(x-y)$?",
            "alternatives": ["$3x^2 - 2xy - y^2$", "$3x^2 + xy - y^2$", "$3x^2 - y^2$", "$3x^2 + 2xy - y^2$"]},
        4: {"text": "$f(x) = 4x + 1$\n$g(x) = 2 \\cdot f(x) - 1$\n\nVad är $g(3)$?",
            "alternatives": ["5", "13", "24", "25"]},
        6: {"text": "Vad är 45 % av $\\frac{2}{9}$?",
            "alternatives": ["$\\frac{1}{9}$", "$\\frac{1}{10}$", "$\\frac{1}{11}$", "$\\frac{1}{12}$"]},
        7: {"text": "Hur lång tid tar det att färdas 18 km med hastigheten 20 m/s?",
            "alternatives": ["15 minuter", "18 minuter", "36 minuter", "54 minuter"]},
        8: {"text": "För linjen L med ekvationen $y = kx + m$ gäller att $k$ är negativt. "
                     "Linjen L skär $y$-axeln i punkten $(0, -4)$. Tillsammans med $x$-axeln "
                     "och $y$-axeln avgränsar L en triangel med arean 2 areaenheter. Vilket "
                     "svarsalternativ anger skärningspunkten mellan linjen L och $x$-axeln?",
            "alternatives": ["$\\left(-\\frac{1}{2}, 0\\right)$", "$(-1, 0)$", "$(-2, 0)$", "$(-4, 0)$"]},
        9: {"text": "$a \\neq 0$\n$b \\neq 0$\n\nVilket svarsalternativ motsvarar uttrycket "
                     "$\\frac{b}{a} + \\frac{1}{b}$?",
            "alternatives": ["$\\frac{b+1}{ab}$", "$\\frac{b+1}{a+b}$", "$\\frac{1}{a}$", "$\\frac{b^2+a}{ab}$"]},
        10: {"text": "Vilket av följande svarsalternativ är närmast värdet av "
                      "$\\sqrt{\\frac{44 \\cdot 4100}{200}}$?", "alternatives": ["10", "20", "30", "40"]},
        11: {"text": "Vera bildar ett tvåsiffrigt tal $x$ genom att göra två slumpmässiga kast "
                      "med en vanlig sexsidig tärning. Resultatet av det första kastet blir "
                      "tiotalssiffran i $x$, och resultatet av det andra kastet blir "
                      "entalssiffran i $x$. Hur stor är sannolikheten att $x$ är större än 40?",
             "alternatives": ["$\\frac{1}{4}$", "$\\frac{1}{3}$", "$\\frac{1}{2}$", "$\\frac{2}{3}$"]},
        12: {"text": "Vad är $2 \\cdot 3^{-1} + 3 \\cdot 3^{-2}$?",
             "alternatives": ["$5 \\cdot 3^{-1}$", "$\\frac{11}{54}$", "$5 \\cdot 3^{-3}$", "1"]},
        13: {"text": "Kvantitet I: 25 procent av $\\sqrt{16}$\nKvantitet II: $\\sqrt{4}$",
             "alternatives": STD_KVA},
        14: {"text": "$f(x) = -\\frac{x}{2} + 5$\n$g(x) = \\frac{x}{2} - 1$\n\nKvantitet I: "
                      "$f(-2)$\nKvantitet II: $g(14)$", "alternatives": STD_KVA},
        16: {"text": "$2 = \\frac{194}{x}$\n$3 = 100 - y$\n\nKvantitet I: $x$\nKvantitet II: $y$",
             "alternatives": STD_KVA},
        17: {"text": "$y > 0$\nKvantitet I: $x - y$\nKvantitet II: $3x - 2y$", "alternatives": STD_KVA},
        18: {"text": "Kvantitet I: $\\frac{1}{2} + \\frac{2}{5} + \\frac{3}{7}$\nKvantitet II: "
                      "$\\frac{93}{71}$", "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: Kvoten mellan omkretsen av en cirkel och cirkelns diameter\n"
                      "Kvantitet II: $2\\sqrt{2}$", "alternatives": STD_KVA},
        20: {"text": "$x > 0$\n$y < 0$\nKvantitet I: $x^3y^4$\nKvantitet II: $x^4y^3$",
             "alternatives": STD_KVA},
        22: {"text": "Produkten av tre primtal är 42.\nKvantitet I: Medianen av de tre "
                      "primtalen\nKvantitet II: 3", "alternatives": STD_KVA},
        25: {"text": "Vilket värde har $x + y$?\n\n(1) $\\frac{x+y}{2} + 3 = 10$\n(2) $y = 6x$",
             "alternatives": STD_NOG},
    },
    # Uteslutna: 5 (rektangel PQ), 8 (grafer f/g/h), 10 (figur av sträckor
    # och cirkelbågar), 16 (linjer L1/L2 i diagram), 18 (rektangel med
    # trianglar), 25 (linjer med vinklar u/v/w).
    "2025ht-4": {
        1: {"text": "En vara kostar 250 kronor. Hur mycket kostar varan om priset höjs med "
                     "12 procent?", "alternatives": ["262 kronor", "268 kronor", "274 kronor", "280 kronor"]},
        2: {"text": "Vad är medelvärdet av de fem minsta heltalen som är större än 10?",
            "alternatives": ["12", "12,5", "13", "13,5"]},
        3: {"text": "$\\frac{x}{8} = \\frac{1}{3}$\n\nVilket värde har $x$?",
            "alternatives": ["$\\frac{1}{24}$", "$\\frac{3}{8}$", "$\\frac{8}{3}$", "24"]},
        4: {"text": "$f(x) = 7x^2 - 7$\n\nFör vilket av följande värden på $x$ gäller att "
                     "$f(x) = 7$?", "alternatives": ["1", "$\\sqrt{2}$", "2", "$\\sqrt{7}$"]},
        6: {"text": "$3x \\cdot \\sqrt{2} = \\sqrt{72}$\n\nVad är $x$?", "alternatives": ["2", "4", "6", "12"]},
        7: {"text": "I början av ett experiment består en population av $n$ bakterier. Efter "
                     "en vecka har populationen fördubblats. Populationen fortsätter sedan att "
                     "fördubblas varje vecka. Hur många bakterier finns det i populationen "
                     "efter tio veckor?",
            "alternatives": ["$2 \\cdot n^{10}$", "$2 \\cdot 10^n$", "$n \\cdot 2^{10}$", "$n \\cdot 10^2$"]},
        9: {"text": "Vad är $\\frac{\\frac{2}{7}}{\\frac{4}{9} - \\frac{3}{7}}$?",
            "alternatives": ["$\\frac{1}{7}$", "$\\frac{4}{7}$", "14", "18"]},
        11: {"text": "Vilket svarsalternativ är lika med $(2{,}5 \\cdot 10^{-11}) \\cdot (4 \\cdot 10^{-18})$?",
             "alternatives": ["$10^{-28}$", "$10^{28}$", "$10^{-30}$", "$10^{30}$"]},
        12: {"text": "$xy \\neq -1$\n\nVilket svarsalternativ motsvarar uttrycket "
                      "$\\frac{x^2y^2+xy}{xy+1}$?", "alternatives": ["$xy$", "$xy+1$", "$x^2y^2$", "$x^2y^2+1$"]},
        13: {"text": "Erik, Johanna och Mikael fyller år på samma dag. När Erik var 14 år var "
                      "Johanna 7 år. När Johanna var 10 år var Mikael 15 år.\nKvantitet I: "
                      "Eriks ålder när Mikael var 18 år\nKvantitet II: 20 år", "alternatives": STD_KVA},
        14: {"text": "$0 < a < 1$\nKvantitet I: $\\frac{1}{a}$\nKvantitet II: $a$",
             "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: $\\frac{5}{4} - \\frac{4}{5}$\nKvantitet II: "
                      "$\\frac{4}{3} - \\frac{3}{4}$", "alternatives": STD_KVA},
        17: {"text": "$0 < x < y < 1$\nKvantitet I: $xy$\nKvantitet II: $y$", "alternatives": STD_KVA},
        19: {"text": "$x > 0$\n$y = 5x + 3$\n$z = 2y - 10x$\nKvantitet I: $x$\nKvantitet II: $z$",
             "alternatives": STD_KVA},
        20: {"text": "Kvantitet I: Medianen av tio tal med medelvärdet 0\nKvantitet II: "
                      "Medianen av tio tal med medelvärdet 100", "alternatives": STD_KVA},
        21: {"text": "Förhållandet mellan vinklarna i en triangel är 1:2:4.\nKvantitet I: "
                      "Triangelns största vinkel\nKvantitet II: $90°$", "alternatives": STD_KVA},
        22: {"text": "Kvantitet I: $\\left(1+\\frac{1}{2}\\right)\\left(1-\\frac{1}{3}\\right)"
                      "\\left(1+\\frac{1}{4}\\right)\\left(1-\\frac{1}{5}\\right)$\n"
                      "Kvantitet II: $1$", "alternatives": STD_KVA},
    },
    # Uteslutna: 9 (fyra grafer SOM svarsalternativ), 12 (cirklar i
    # triangel), 17 (två figurer, triangel + kvadrat), 21 (triangel med
    # parallell sträcka DE).
    "2025vt-3": {
        1: {"text": "$4x + 16 = 6x - 8$\n\nVad är $x$?", "alternatives": ["–12", "–4", "4", "12"]},
        2: {"text": "Ett rätblock är 2 meter långt, 2 decimeter brett och 2 millimeter högt. "
                     "Hur stor är volymen av rätblocket?",
            "alternatives": ["8 cm$^3$", "80 cm$^3$", "800 cm$^3$", "8 000 cm$^3$"]},
        3: {"text": "$3^{2x} = 27$\n\nVad är $x$?",
            "alternatives": ["$\\frac{2}{3}$", "$\\frac{3}{2}$", "2", "3"]},
        4: {"text": "Arne är 7 år äldre än Bertil. Tillsammans är Arne och Bertil 33 år. Arnes "
                     "ålder är $x$ år och Bertils ålder är $y$ år. Vad är produkten $xy$?",
            "alternatives": ["228", "231", "260", "266"]},
        5: {"text": "Vad är $\\frac{\\frac{6}{25}}{\\frac{36}{5}}$?",
            "alternatives": ["$\\frac{1}{30}$", "$\\frac{5}{6}$", "$\\frac{125}{216}$", "$\\frac{216}{125}$"]},
        6: {"text": "$x$ är ett heltal. Vilket svarsalternativ är ett möjligt värde på $x(x+1)$?",
            "alternatives": ["37", "42", "54", "81"]},
        7: {"text": "$a \\neq 0$\n\nFör vilket svarsalternativ gäller med säkerhet att $f(a) = a$?",
            "alternatives": ["$f(x) = \\frac{x}{a} + a$", "$f(x) = 2x - a$", "$f(x) = ax$",
                              "$f(x) = -ax + a^3$"]},
        8: {"text": "Vad är $\\frac{2{,}1 \\cdot 10^6}{3 \\cdot 10^4}$?",
            "alternatives": ["7", "70", "700", "7 000"]},
        10: {"text": "$b \\neq 0$\n\nVilket svarsalternativ är lika med uttrycket "
                      "$\\frac{a+b}{b} + \\frac{b-a}{b}$?",
             "alternatives": ["0", "1", "2", "$\\frac{2a}{b}$"]},
        11: {"text": "Mätserien 3, 5, 6, 6, 8 utökas med ett slumpmässigt valt ensiffrigt "
                      "positivt heltal. Hur stor är sannolikheten att mätseriens median blir "
                      "större?", "alternatives": ["0", "$\\frac{1}{3}$", "$\\frac{1}{2}$", "1"]},
        13: {"text": "Kvantitet I: 4 procent av 40\nKvantitet II: 5 procent av 35",
             "alternatives": STD_KVA},
        14: {"text": "$x > y$\n$y < z$\nKvantitet I: $x$\nKvantitet II: $z$", "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: Riktningskoefficienten för den räta linje som går genom "
                      "punkterna $(0,0)$ och $(-1,-3)$\nKvantitet II: Riktningskoefficienten "
                      "för den räta linje som går genom punkterna $(0,0)$ och $(1,3)$",
             "alternatives": STD_KVA},
        16: {"text": "$x - y = \\frac{1}{3}$\n$x = -\\frac{1}{3}$\nKvantitet I: $y$\n"
                      "Kvantitet II: $2x$", "alternatives": STD_KVA},
        18: {"text": "$x \\neq 0$\nKvantitet I: $\\frac{y}{x^2}$\nKvantitet II: $\\frac{y^2}{x}$",
             "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: Medelvärdet av $\\frac{5}{7}$, $\\frac{5}{2}$ och "
                      "$\\frac{5}{6}$\nKvantitet II: $1$", "alternatives": STD_KVA},
        20: {"text": "Adam och David tog varsin cykeltur. Adam cyklade 45 km med "
                      "medelhastigheten 27 km/h. David cyklade 40 km med medelhastigheten "
                      "25 km/h.\nKvantitet I: Den tid som Adams cykeltur tog\nKvantitet II: "
                      "Den tid som Davids cykeltur tog", "alternatives": STD_KVA},
        22: {"text": "$x$ och $y$ är positiva heltal. När $x$ divideras med $y$ blir kvoten 1 "
                      "och resten 1.\nKvantitet I: $x$\nKvantitet II: $y$", "alternatives": STD_KVA},
    },
    # Uteslutna: 4 (tre linjer med vinklar), 6 (fyra grafer SOM
    # svarsalternativ), 18 (fyrhörning ABCD), 21 (rektangel med halvcirkel),
    # 25 (triangel med vinklar u/v/w).
    "2024ht-1": {
        1: {"text": "$12x - 54 = 6x + 18$\n\nVad är $x$?", "alternatives": ["–6", "–2", "4", "12"]},
        2: {"text": "$\\sqrt{3}\\,x = 6$\n\nVilket värde har $x$?",
            "alternatives": ["$\\sqrt{2}$", "$3\\sqrt{2}$", "$2\\sqrt{3}$", "4"]},
        3: {"text": "$x > 0$\n\nHur många procent av $x$ är $\\frac{x}{15} + \\frac{x}{30}$?",
            "alternatives": ["4,5", "10", "15", "22,5"]},
        5: {"text": "Vilket svarsalternativ är korrekt?",
            "alternatives": ["$\\frac{3}{4} < \\frac{7}{8} < \\frac{25}{32}$",
                              "$\\frac{3}{4} < \\frac{13}{16} < \\frac{25}{32}$",
                              "$\\frac{3}{4} < \\frac{7}{8} < \\frac{13}{16}$",
                              "$\\frac{3}{4} < \\frac{25}{32} < \\frac{13}{16}$"]},
        7: {"text": "En kvadrat har sidan $s$ cm och diagonalen $d$ cm. Om $2s^2 + d^2 = 64$, "
                     "vilket värde har då $s$?", "alternatives": ["2", "4", "8", "16"]},
        8: {"text": "Vilket svarsalternativ motsvarar $\\frac{3(x+y) - 5(y-x)}{2}$?",
            "alternatives": ["$x - 2y$", "$4x - 4y$", "$4x - y$", "$8x - 2y$"]},
        9: {"text": "$x - y = 7$\n\nVilket av svarsalternativen är med säkerhet korrekt?",
            "alternatives": ["Om $x$ är negativt, så är $y$ negativt.",
                              "Om $x$ är positivt, så är $y$ positivt.",
                              "Om $y$ är negativt, så är $x$ positivt.",
                              "Om $y$ är positivt, så är $x$ negativt."]},
        10: {"text": "Punkten $(a, 2a)$ ligger på linjen som ges av ekvationen $y = 3x - 60$. "
                      "Vilket värde har $a$?", "alternatives": ["12", "15", "30", "60"]},
        11: {"text": "Ritva har sex bollar som hon fördelar slumpmässigt i tre tomma lådor. "
                      "Hur stor är sannolikheten att exakt en låda innehåller ett udda antal "
                      "bollar när Ritva är klar?",
             "alternatives": ["0", "$\\frac{1}{3}$", "$\\frac{2}{3}$", "1"]},
        12: {"text": "Vilken av följande produkter är lika med $8^x$, för något heltal $x$?",
             "alternatives": ["$16 \\cdot 16$", "$16 \\cdot 32$", "$32 \\cdot 32$", "$32 \\cdot 64$"]},
        13: {"text": "Kvantitet I: $\\sqrt{5} + 1$\nKvantitet II: $\\sqrt{6}$", "alternatives": STD_KVA},
        14: {"text": "$\\frac{x}{4} + \\frac{1}{2} = \\frac{5}{8}$\nKvantitet I: $x$\n"
                      "Kvantitet II: $2$", "alternatives": STD_KVA},
        15: {"text": "$0 < x < y$\nKvantitet I: $x + 2y$\nKvantitet II: $2x + y$",
             "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: $\\left(\\frac{3}{5} - \\frac{4}{7}\\right) \\cdot 32$\n"
                      "Kvantitet II: $1$", "alternatives": STD_KVA},
        17: {"text": "Kalle har $x$ kulor och Pelle har $y$ kulor. Olle har inga kulor. Kalle "
                      "ger hälften av sina kulor till Olle. Pelle ger också hälften av sina "
                      "kulor till Olle.\nKvantitet I: Det sammanlagda antalet kulor som Olle "
                      "får av Kalle och Pelle\nKvantitet II: Medelvärdet av antalet kulor som "
                      "Kalle och Pelle hade innan de gav kulor till Olle", "alternatives": STD_KVA},
        19: {"text": "Linjen L ges av ekvationen $y = -\\frac{x}{2} + 4$.\nKvantitet I: "
                      "$x$-koordinaten för den punkt där L skär $x$-axeln\nKvantitet II: "
                      "$y$-koordinaten för den punkt där L skär $y$-axeln", "alternatives": STD_KVA},
        20: {"text": "En mätserie består av sex positiva heltal. De fyra största mätvärdena är "
                      "större än 12. De fyra minsta mätvärdena är mindre än 15.\nKvantitet I: "
                      "Mätseriens median\nKvantitet II: $13{,}5$", "alternatives": STD_KVA},
        22: {"text": "$\\frac{x}{y} = -1$\nKvantitet I: $x - y$\nKvantitet II: $0$",
             "alternatives": STD_KVA},
    },
    # Uteslutna: 5 (avståndsdiagram P/Q/R/S/T), 11 (geometrisk figur med
    # trianglar), 19 (figur med vinklar x/y/120°/100°). Fråga 6:s tomma
    # koordinatsystem är bara ett räknehjälpmedel.
    "2024ht-4": {
        1: {"text": "Medelvärdet av de fem talen 1, 2, 5, 7 och $x$ är 7. Vad är $x$?",
            "alternatives": ["13", "14", "18", "20"]},
        2: {"text": "Elsa samlar på klistermärken. Hon börjar med 10 klistermärken och utökar "
                     "sin samling med tre klistermärken varje dag. $K$ är antalet "
                     "klistermärken som Elsa har, och $t$ är antalet dagar som gått sedan hon "
                     "började samla. Vilket svarsalternativ anger $K$ som en funktion av $t$?",
            "alternatives": ["$K(t) = 3t + 10$", "$K(t) = 3(t + 10)$", "$K(t) = 10t + 3$", "$K(t) = 10(t + 3)$"]},
        3: {"text": "Vilket värde har uttrycket $\\frac{\\frac{2}{x}}{\\frac{1}{x} + "
                     "\\frac{x}{x-1}}$ om $x = 2$?",
            "alternatives": ["–2", "$\\frac{2}{5}$", "1", "$\\frac{5}{2}$"]},
        4: {"text": "$a + 2b = b$\n\nVilket svarsalternativ motsvarar $a - b$?",
            "alternatives": ["0", "$-b$", "$-2b$", "$-3b$"]},
        6: {"text": "Vilket av svarsalternativen är en punkt som ligger mellan de båda "
                     "linjerna $y = x + 2$ och $y = x - 2$?",
            "alternatives": ["$(3, -3)$", "$(3, 0)$", "$(0, -3)$", "$(3, 3)$"]},
        7: {"text": "En kvadrat har lika stor area som en cirkel med radien 2 cm. Vilken "
                     "sidlängd har kvadraten?",
            "alternatives": ["$\\sqrt{2\\pi}$ cm", "$2\\sqrt{\\pi}$ cm", "$\\pi\\sqrt{2}$ cm", "$2\\pi$ cm"]},
        8: {"text": "Vilket av svarsalternativen är lika med uttrycket "
                     "$xy + x(b-y) + y(a-x) + (a-x)(b-y)$?",
            "alternatives": ["$ab$", "$xy + ay + bx$", "$ab + xy$", "$ab + bx + ay - 2xy$"]},
        9: {"text": "Vilket svarsalternativ är lika med uttrycket $10 \\cdot \\frac{3-x}{15} + "
                     "\\frac{5x}{3}$?", "alternatives": ["$2 - x$", "$2 + x$", "$2 + 8x$", "$\\frac{10+8x}{5}$"]},
        10: {"text": "Vilket svarsalternativ är lika med $(2\\sqrt{3} + 3\\sqrt{3})(4\\sqrt{3} - \\sqrt{3})$?",
             "alternatives": ["15", "$15\\sqrt{3}$", "45", "135"]},
        12: {"text": "Vilket svarsalternativ är lika med 20 procent av $10^{10}$?",
             "alternatives": ["$2^{10}$", "$2 \\cdot 10^9$", "$10^2$", "$20^9$"]},
        13: {"text": "Kvantitet I: $\\frac{1}{2} - \\frac{1}{3}$\nKvantitet II: "
                      "$\\frac{2}{3} - \\frac{1}{2}$", "alternatives": STD_KVA},
        14: {"text": "Kvantitet I: Höjden i en triangel med basen 5 cm och arean 20 cm$^2$\n"
                      "Kvantitet II: Höjden i en rektangel med basen 2 cm och arean 17 cm$^2$",
             "alternatives": STD_KVA},
        15: {"text": "$x + 2{,}8 = 5x - 6$\nKvantitet I: $x$\nKvantitet II: $2$", "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: 125 % av 4\nKvantitet II: 80 % av 6", "alternatives": STD_KVA},
        17: {"text": "$f(x) = x^2 + 2x - 2$\nKvantitet I: $f(-2)$\nKvantitet II: $f(0)$",
             "alternatives": STD_KVA},
        18: {"text": "$\\left(47^{\\frac{x}{2}}\\right)^{\\frac{2}{3}} = 47^{\\frac{y}{3}}$\n"
                      "Kvantitet I: $x$\nKvantitet II: $y$", "alternatives": STD_KVA},
        20: {"text": "$a \\neq b$\nKvantitet I: $\\frac{(a-b)^2}{a-b}$\nKvantitet II: "
                      "$\\frac{(b-a)^2}{-(a-b)}$", "alternatives": STD_KVA},
        21: {"text": "Karin kör bil med en hastighet som ligger mellan 80 km/h och 100 km/h.\n"
                      "Kvantitet I: Den tid det tar för Karin att köra 120 km\nKvantitet II: "
                      "85 minuter", "alternatives": STD_KVA},
        22: {"text": "Medelvärdet av $x$ och $y$ är lika med 1. Medelvärdet av $x$ och 4 är "
                      "lika med $y$.\nKvantitet I: $x$\nKvantitet II: $0$", "alternatives": STD_KVA},
    },
    # Uteslutna: 1 (triangel+kvadrat), 3 (fyra grafer SOM svarsalternativ),
    # 6 (triangel med vinklar), 7 (koordinatsystem med punkter P/Q/R/S),
    # 17 (regelbunden femhörning).
    "2024vt-2": {
        2: {"text": "$x$ och $y$ uppfyller sambandet $2x + 3xy - 4y = 10$. Vilket värde har "
                     "$x$ om $y = -2$?", "alternatives": ["–18", "$-\\frac{9}{2}$", "–2", "$-\\frac{1}{2}$"]},
        4: {"text": "60 % av $x$ är 39. Vad är $x$?", "alternatives": ["60", "65", "72", "78"]},
        5: {"text": "Vilket svarsalternativ motsvarar $a(b+c) - b(a+c) + c(b-a)$?",
            "alternatives": ["0", "$ab - bc - ac$", "$2(ab+ac+bc)$", "$2c + bc - a$"]},
        8: {"text": "En stängd låda med innermåtten 50 cm × 54 cm × 72 cm innehåller klossar "
                     "med måtten 5 cm × 6 cm × 9 cm. Hur många klossar kan det som mest finnas "
                     "i lådan?", "alternatives": ["270", "500", "650", "720"]},
        9: {"text": "$xy \\neq 0$\n\nVilket svarsalternativ motsvarar "
                     "$\\frac{2xy(3xy+15y)}{6xy^2}$?", "alternatives": ["$x+5$", "$3x+15$", "$x+15y$", "$\\frac{2x^2y+5}{2xy}$"]},
        10: {"text": "För heltalen $x$, $y$ och $z$ gäller att $xyz = 12$ och att $0 < x < y < z$. "
                      "Vilket är det största möjliga värdet på $z - x$?", "alternatives": ["1", "3", "5", "6"]},
        11: {"text": "Laila har sex enfärgade kulor och tre lådor: A, B och C. I låda A finns "
                      "det två röda och en vit kula. I låda B finns det en röd och två vita "
                      "kulor. Låda C är tom. Laila plockar slumpmässigt en kula ur låda A och "
                      "en kula ur låda B och lägger dem i låda C. Hur stor är sannolikheten "
                      "att alla tre lådorna innehåller en röd och en vit kula?",
             "alternatives": ["$\\frac{1}{3}$", "$\\frac{2}{3}$", "$\\frac{1}{9}$", "$\\frac{4}{9}$"]},
        12: {"text": "Vilket svarsalternativ är lika med $2(2^5 + 2^5)$?",
             "alternatives": ["$2^6$", "$2^7$", "$2^{11}$", "$2^{12}$"]},
        13: {"text": "$x - 5 = y + 5$\n$y = 0$\nKvantitet I: $x$\nKvantitet II: $0$",
             "alternatives": STD_KVA},
        14: {"text": "J är det nionde jämna talet efter 15 och U är det sjunde udda talet "
                      "efter 18.\nKvantitet I: $J - U$\nKvantitet II: $0$", "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: Medelvärdet av $\\frac{1}{10}$ och $\\frac{1}{5}$\n"
                      "Kvantitet II: $\\frac{1}{7}$", "alternatives": STD_KVA},
        16: {"text": "$a \\leq -1$\n$b < 0$\nKvantitet I: $\\frac{a}{b}$\nKvantitet II: $1$",
             "alternatives": STD_KVA},
        18: {"text": "Kvantitet I: 50 procent av ett tal större än 1000\nKvantitet II: 75 "
                      "procent av ett tal mindre än 800", "alternatives": STD_KVA},
        19: {"text": "$\\frac{3}{2} + \\frac{x}{3} = 1$\nKvantitet I: $x$\nKvantitet II: "
                      "$-\\frac{1}{6}$", "alternatives": STD_KVA},
        20: {"text": "Linjen $L_1$ går genom punkterna $(-1, 3)$ och $(1, 2)$. Linjen $L_2$ är "
                      "vinkelrät mot $L_1$ och går genom origo.\nKvantitet I: "
                      "Riktningskoefficienten för $L_1$\nKvantitet II: Riktningskoefficienten "
                      "för $L_2$", "alternatives": STD_KVA},
        21: {"text": "Den rätvinkliga triangeln T har sidlängderna 3 cm, 4 cm och 5 cm. T har "
                      "samma omkrets som kvadraten K.\nKvantitet I: Arean av T\nKvantitet II: "
                      "Arean av K", "alternatives": STD_KVA},
        22: {"text": "Kvantitet I: $(x^4+1)(x^3-x)$\nKvantitet II: $(x^5+x)(x^2-1)$",
             "alternatives": STD_KVA},
    },
    # Uteslutna: 2 (linje i diagram), 8 (kvadrat med cirkel), 14 (sexhörning
    # med skuggad triangel), 20 (kvadrat mellan parallella linjer), 24
    # (triangel med vinklar u/v/w). NOG 23/25/26/27 hade redan ren text.
    "2024vt-5": {
        1: {"text": "$4x + 13 = 8x - 31$\n\nVad är $x$?", "alternatives": ["–4,5", "1,5", "4,5", "11"]},
        3: {"text": "Vad är $\\frac{1}{3} - \\left(\\frac{1}{2} + \\frac{1}{6}\\right)$?",
            "alternatives": ["$-\\frac{2}{3}$", "$-\\frac{1}{3}$", "0", "$\\frac{1}{3}$"]},
        4: {"text": "Medelvärdet av 17, 21 och 44 är lika med medelvärdet av 63, 73 och $x$. "
                     "Vilket värde har $x$?", "alternatives": ["–54", "–27", "0", "71"]},
        5: {"text": "Vägen mellan Julias hem och Annas hem är 12 km lång. De startar hemifrån "
                     "samtidigt för att mötas längs vägen. Julia springer med konstant "
                     "hastighet och det tar henne 12 minuter att springa 2 km. Anna går med "
                     "konstant hastighet och det tar henne 24 minuter att gå 2 km. Hur lång "
                     "tid tar det innan de möts?",
            "alternatives": ["36 minuter", "42 minuter", "48 minuter", "72 minuter"]},
        6: {"text": "Vilket av svarsalternativen är lika med 7?",
            "alternatives": ["$\\sqrt{29} + \\sqrt{20}$", "$7^1 - 7^0$", "$\\frac{14}{7} + \\frac{49}{14}$",
                              "$\\left(\\frac{7}{\\sqrt{7}}\\right)^2$"]},
        7: {"text": "Vilket svarsalternativ är lika med 18 procent av $\\frac{2}{5}$?",
            "alternatives": ["$\\frac{1}{45}$", "$\\frac{4}{45}$", "$\\frac{9}{125}$", "$\\frac{9}{250}$"]},
        9: {"text": "Vilket svarsalternativ är en ekvation för en linje som går genom "
                     "punkten $(3, 1)$?",
            "alternatives": ["$y = -x + 4$", "$y = x + 2$", "$y = 2x + 1$", "$y = 3x + 1$"]},
        10: {"text": "$a$, $b$ och $c$ är positiva tal sådana att $\\frac{a}{b} = \\frac{b}{c}$ "
                      "och $c = 2a$. Vad är $b$ uttryckt i $a$?",
             "alternatives": ["$b = a\\sqrt{2}$", "$b = \\frac{a}{\\sqrt{2}}$", "$b = 2\\sqrt{a}$", "$b = \\frac{\\sqrt{a}}{2}$"]},
        11: {"text": "$x \\cdot 10^4 - 2x \\cdot 10^3 = 3{,}2 \\cdot 10^4$\n\nVilket värde har $x$?",
             "alternatives": ["4", "4,8", "5,6", "6,4"]},
        12: {"text": "Kvadraterna $K_1$ och $K_2$ överlappar varandra så att 25 procent av "
                      "arean av $K_1$ täcks av 20 procent av arean av $K_2$. Kvadraten $K_1$ "
                      "har sidlängden 2 cm. Vilken sidlängd har $K_2$?",
             "alternatives": ["1,6 cm", "$\\sqrt{3}$ cm", "$\\sqrt{5}$ cm", "2,5 cm"]},
        13: {"text": "$3x > y$\nKvantitet I: $x$\nKvantitet II: $y$", "alternatives": STD_KVA},
        15: {"text": "$2(x-4) = \\frac{1}{2}$\nKvantitet I: $x$\nKvantitet II: $5$",
             "alternatives": STD_KVA},
        16: {"text": "$f(x) = 4x + 8$\n$g(x) = 2x + 4$\n$a > 0$\nKvantitet I: $f(a)$\n"
                      "Kvantitet II: $g(2a)$", "alternatives": STD_KVA},
        17: {"text": "En mätserie består av tio heltal mellan 1 och 50. Mätseriens median är "
                      "25.\nKvantitet I: Mätseriens median om det största och det minsta "
                      "mätvärdet tas bort\nKvantitet II: 25", "alternatives": STD_KVA},
        18: {"text": "Kvantitet I: $4 \\cdot 10^{-2}$\nKvantitet II: $\\frac{1}{400}$",
             "alternatives": STD_KVA},
        19: {"text": "$-1 < x < 0$\n$0 < y < 1$\nKvantitet I: $\\frac{y}{x}$\nKvantitet II: "
                      "$\\frac{x}{y}$", "alternatives": STD_KVA},
        21: {"text": "$x < 0$\nKvantitet I: $(x+4)(x-2)$\nKvantitet II: $(x-4)(x+2)$",
             "alternatives": STD_KVA},
        22: {"text": "Priset på en vara stiger med 20 % per år.\nKvantitet I: Den tid det tar "
                      "tills priset har fördubblats\nKvantitet II: 5 år", "alternatives": STD_KVA},
        28: {"text": "Vilket av talen $x$, $y$, $z$ och $w$ är störst?\n\n(1) $x + y = w$\n"
                      "(2) $\\frac{x+y}{2} = z$", "alternatives": STD_NOG},
    },
    # Uteslutna: 8 (fyra grafer SOM svarsalternativ), 28 (linje med
    # punktordning A/B/M/C — ordningen syns bara i figuren).
    "2023ht-2": {
        1: {"text": "Vad är $\\frac{2}{3} + \\frac{4}{7} - \\frac{5}{21}$?",
            "alternatives": ["$-\\frac{1}{11}$", "$\\frac{1}{7}$", "1", "3"]},
        2: {"text": "Hur stor är den största vinkeln i en triangel där förhållandet mellan "
                     "vinklarna är 1:2:6?", "alternatives": ["60°", "90°", "120°", "135°"]},
        3: {"text": "$x^3 + bx - 4 = 0$\n\nOm $x = -2$, vad är då $b$?", "alternatives": ["–6", "–2", "0", "2"]},
        4: {"text": "$f(x) = \\frac{3x}{4} - \\frac{1}{2}$\n\nFör vilket värde på $x$ gäller "
                     "att $f(x) = 0$?", "alternatives": ["$\\frac{3}{8}$", "$\\frac{2}{3}$", "$\\frac{3}{2}$", "$\\frac{8}{3}$"]},
        5: {"text": "$x + \\frac{3}{5} = \\frac{5}{8}$\n\nVad är $x$?",
            "alternatives": ["$\\frac{2}{3}$", "$\\frac{3}{8}$", "$\\frac{2}{13}$", "$\\frac{1}{40}$"]},
        6: {"text": "Medelvärdet av $x$ och $y$ är lika med 16. Medelvärdet av 20 och $z$ är "
                     "lika med 30. Vad är $x + y + z$?", "alternatives": ["42", "56", "62", "72"]},
        7: {"text": "Vilket svarsalternativ motsvarar uttrycket $-5x(7-3y)$?",
            "alternatives": ["$-35x - 3y$", "$-(35x-15)y$", "$(15y-35)x$", "$15x(y+7)$"]},
        9: {"text": "10 % av $x$ är lika med 8 % av $y$. Om $x$ är lika med 20, vad är då $y$?",
            "alternatives": ["16", "18", "22", "25"]},
        10: {"text": "En rektangel har lika stor area som en kvadrat. Kvadratens sidlängd är "
                      "$s$. Rektangelns korta sida är $0{,}7s$. Vilket svarsalternativ anger "
                      "ett uttryck som är lika med rektangelns långa sida?",
             "alternatives": ["$s + 0{,}3$", "$s + 0{,}7s$", "$\\frac{s}{0{,}7}$", "$1{,}3s$"]},
        11: {"text": "$p$ är ett primtal sådant att $4 < p < 10$. $m$ är ett positivt heltal "
                      "sådant att $m < p$. Vilket svarsalternativ är med säkerhet korrekt?",
             "alternatives": ["$\\frac{p}{m}$ är ett heltal", "$\\frac{36m}{p}$ är ett heltal",
                               "$\\frac{m}{p}$ är ett heltal", "$\\frac{35m}{p}$ är ett heltal"]},
        12: {"text": "Annica, Bianca och Cecilia är systrar. Vid tidpunkten T var systrarnas "
                      "genomsnittliga ålder 24 år. Tre år efter T var Biancas och Cecilias "
                      "genomsnittliga ålder 25 år. Hur gammal var Annica tre år efter T?",
             "alternatives": ["25 år", "27 år", "29 år", "31 år"]},
        13: {"text": "$x \\neq 0$\nKvantitet I: $(2x)^2$\nKvantitet II: $2x^2$", "alternatives": STD_KVA},
        14: {"text": "$f(x) = x^2 - 3x + 2$\nKvantitet I: $f(-1)$\nKvantitet II: $f(3)$",
             "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: $\\frac{5^5}{5^3}$\nKvantitet II: $\\frac{5^{28}}{5^{26}}$",
             "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: Arean av en rektangel med sidorna $6x$ cm respektive "
                      "$0{,}5x$ cm\nKvantitet II: Arean av en cirkel med radien $x$ cm",
             "alternatives": STD_KVA},
        17: {"text": "Kvantitet I: $3\\sqrt{6}$\nKvantitet II: $6\\sqrt{3}$", "alternatives": STD_KVA},
        18: {"text": "$x^2 = 25$\n$y = x - 2$\nKvantitet I: $y$\nKvantitet II: $\\sqrt{16}$",
             "alternatives": STD_KVA},
        19: {"text": "För 6 år sedan var Elsas ålder en tredjedel av vad den är idag.\n"
                      "Kvantitet I: Elsas ålder om 6 år\nKvantitet II: 18 år", "alternatives": STD_KVA},
        20: {"text": "$\\frac{x}{y} = -1$\nKvantitet I: $x + y$\nKvantitet II: $0$",
             "alternatives": STD_KVA},
        21: {"text": "Produkten av två positiva heltal är 12.\nKvantitet I: Medelvärdet av de "
                      "två talen\nKvantitet II: 4", "alternatives": STD_KVA},
        22: {"text": "Triangeln ABC är likbent.\nKvantitet I: Summan av vinkeln A och vinkeln B\n"
                      "Kvantitet II: $90°$", "alternatives": STD_KVA},
    },
    # Uteslutna: 2 (parallella linjer), 8 (rätvinkliga trianglar), 16
    # (vinklar x/y i figur). Fråga 11:s tomma koordinatsystem är bara ett
    # räknehjälpmedel.
    "2023ht-4": {
        1: {"text": "Vilket svarsalternativ motsvarar uttrycket $\\frac{2(x+4)}{2} + 8$?",
            "alternatives": ["$x + 10$", "$x + 12$", "$x + 16$", "$2x + 10$"]},
        3: {"text": "$3(x-4) = 2(x+2)$\n\nVad är $x$?", "alternatives": ["–8", "–2", "6", "16"]},
        4: {"text": "Medelvärdet av fyra på varandra följande heltal är 4,5. Vad är medianen?",
            "alternatives": ["4", "4,5", "5", "5,5"]},
        5: {"text": "Linjerna $y = kx + 3$ och $y = 2x - 1$ skär varandra när $x = 1$. Vilket "
                     "värde har $k$?", "alternatives": ["–2", "–1", "1", "2"]},
        6: {"text": "En bil körde 1 000 meter på 50 sekunder. Vilken medelhastighet hade bilen?",
            "alternatives": ["70 km/h", "72 km/h", "74 km/h", "76 km/h"]},
        7: {"text": "Vilket svarsalternativ är lika med $\\frac{1}{\\frac{2}{5} - \\frac{5}{6}}$?",
            "alternatives": ["$-\\frac{30}{13}$", "$-\\frac{11}{3}$", "$\\frac{1}{3}$", "$\\frac{13}{10}$"]},
        9: {"text": "$x - y = 0$\n\nVilket svarsalternativ är med säkerhet lika med $xy$?",
            "alternatives": ["0", "1", "$x$", "$y^2$"]},
        10: {"text": "$n$ är ett heltal sådant att $x^n < 0$ då $x$ är ett negativt tal. "
                      "Vilket svarsalternativ är med säkerhet korrekt?",
             "alternatives": ["$n$ är ett negativt tal.", "$n$ är ett positivt tal.",
                               "$n$ är ett udda tal.", "$n$ är ett jämnt tal."]},
        11: {"text": "En myra förflyttar sig i ett koordinatsystem. Myran startar i origo. Den "
                      "rör sig först 5 längdenheter i $x$-axelns positiva riktning och därefter "
                      "6 längdenheter i $y$-axelns positiva riktning. Slutligen rör sig myran "
                      "3 längdenheter i $x$-axelns positiva riktning. Hur långt från origo "
                      "ligger myrans slutpunkt?",
             "alternatives": ["8 längdenheter", "10 längdenheter", "12 längdenheter", "14 längdenheter"]},
        12: {"text": "Vilket svarsalternativ är lika med $\\sqrt{12} + \\sqrt{48}$?",
             "alternatives": ["10", "11", "$6\\sqrt{3}$", "$\\sqrt{60}$"]},
        13: {"text": "$x > 0$\nKvantitet I: $\\sqrt{x} \\cdot \\sqrt{x}$\nKvantitet II: $x$",
             "alternatives": STD_KVA},
        14: {"text": "Två vanliga sexsidiga tärningar kastas slumpmässigt en gång.\nKvantitet "
                      "I: Sannolikheten att få en fyra och en femma\nKvantitet II: "
                      "Sannolikheten att få summan 3", "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: $\\frac{5}{13} - \\frac{4}{15}$\nKvantitet II: "
                      "$\\frac{4}{15} - \\frac{5}{13}$", "alternatives": STD_KVA},
        17: {"text": "$x > 0$\n$y > 0$\n$z > 0$\n$x^2 + y^2 = z^2$\nKvantitet I: $y$\n"
                      "Kvantitet II: $z$", "alternatives": STD_KVA},
        18: {"text": "Det ordinarie priset på en vara är 20 % lägre i butik A än i butik B.\n"
                      "Kvantitet I: Priset på varan i butik A om de sänker priset med 5 %\n"
                      "Kvantitet II: Priset på varan i butik B om de sänker priset med 25 %",
             "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: Arean av en cirkel med radien 5 cm\nKvantitet II: 75 cm$^2$",
             "alternatives": STD_KVA},
        20: {"text": "$z > 1$\n$xy = z$\nKvantitet I: $x$\nKvantitet II: $\\frac{z}{y}$",
             "alternatives": STD_KVA},
        21: {"text": "Linjen $L_1$ går genom punkterna $(2, 1)$ och $(-3, 7)$. Linjen $L_2$ är "
                      "vinkelrät mot $L_1$.\nKvantitet I: Riktningskoefficienten för linjen "
                      "$L_1$\nKvantitet II: Riktningskoefficienten för linjen $L_2$",
             "alternatives": STD_KVA},
        22: {"text": "Kvantitet I: $2 \\cdot 10^x$\nKvantitet II: $(2 \\cdot 10)^x$",
             "alternatives": STD_KVA},
    },
    # Uteslutna: 2 (triangel med vinklar), 11 (fyra grafer SOM
    # svarsalternativ). Fråga 15:s tomma koordinatsystem är bara ett
    # räknehjälpmedel — hörnens koordinater står redan i texten.
    "2023vt-2": {
        1: {"text": "Vilket svarsalternativ motsvarar uttrycket $(3x-2x)(y-z)$?",
            "alternatives": ["$x + y - z$", "$3x - 2xy - z$", "$xy - xz$", "$3xy + 2xz$"]},
        3: {"text": "$\\frac{4x}{7} = \\frac{1}{14}$\n\nVilket värde har $x$?",
            "alternatives": ["$\\frac{1}{8}$", "$\\frac{1}{7}$", "$\\frac{1}{4}$", "$\\frac{1}{2}$"]},
        4: {"text": "För $f(x) = kx + m$ gäller att $f(4) - f(2) = 6$. Vilket värde har $k$?",
            "alternatives": ["$\\frac{3}{2}$", "2", "3", "4"]},
        5: {"text": "Albert har tio tomma lådor som är numrerade med heltalen 1–10. Först "
                     "lägger Albert en kula i varje låda vars nummer är jämnt delbart med 1. "
                     "Sedan lägger han två kulor i varje låda vars nummer är jämnt delbart "
                     "med 2, och så vidare ända upp till 10. Albert lägger alltså $k$ stycken "
                     "kulor i varje låda vars nummer är jämnt delbart med $k$ för varje heltal "
                     "$k$ från 1 till 10. Hur många kulor ligger det i lådan som har nummer 8 "
                     "när Albert är klar?", "alternatives": ["7", "9", "11", "15"]},
        6: {"text": "$x + y = 10$\n\nMedelvärdet av $y$ och 0 är lika med 5. Vilket värde har $x$?",
            "alternatives": ["–5", "0", "5", "10"]},
        7: {"text": "Ett lekland har ett bollhav med 21 000 enfärgade bollar i två olika "
                     "färger: gul och röd. På tre gula bollar går det sju röda bollar. Hur "
                     "många gula bollar finns det i bollhavet?",
            "alternatives": ["6 300", "7 000", "7 300", "9 000"]},
        8: {"text": "Vilket av svarsalternativen är närmast $2\\sqrt{22}$?",
            "alternatives": ["7", "9", "11", "22"]},
        9: {"text": "Vad är differensen mellan $(x+2)^2$ och $x^2$?",
            "alternatives": ["2", "4", "$2x+4$", "$4x+4$"]},
        10: {"text": "Areorna av kvadraterna $K_1$ och $K_2$ förhåller sig som 1:4. Arean av "
                      "$K_1$ är 9 cm$^2$. Vilken sidlängd har $K_2$?",
             "alternatives": ["3 cm", "6 cm", "9 cm", "12 cm"]},
        12: {"text": "Vilket svarsalternativ motsvarar uttrycket $\\frac{1}{x} + \\frac{1}{y} + \\frac{1}{z}$?",
             "alternatives": ["$\\frac{3}{x+y+z}$", "$\\frac{xy+xz+yz}{x+y+z}$",
                               "$\\frac{x+y+z}{xyz}$", "$\\frac{xy+xz+yz}{xyz}$"]},
        13: {"text": "$x < 0$\nKvantitet I: $x^3 + y^2$\nKvantitet II: $x^2 + z^3$",
             "alternatives": STD_KVA},
        14: {"text": "De två bilarna A och B kör 50 km vardera. För bil A räcker en liter "
                      "bensin till att köra 20 km, och för bil B räcker en liter bensin till "
                      "att köra 25 km.\nKvantitet I: Mängden bensin som bil A förbrukar\n"
                      "Kvantitet II: Mängden bensin som bil B förbrukar", "alternatives": STD_KVA},
        15: {"text": "Hörnen i fyrhörningen ABCD har koordinaterna:\n$A = (1, 1)$\n"
                      "$B = (1, 5)$\n$C = (-2, 1)$\n$D = (-2, -3)$\n\nKvantitet I: Arean av "
                      "fyrhörningen ABCD\nKvantitet II: 20 areaenheter", "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: $\\frac{1}{3} + \\frac{1}{12}$\nKvantitet II: "
                      "$\\frac{1}{4} + \\frac{1}{6}$", "alternatives": STD_KVA},
        17: {"text": "$\\frac{1}{x} + \\frac{1}{x} + \\frac{1}{x} = 15$\nKvantitet I: $x$\n"
                      "Kvantitet II: $\\frac{1}{5}$", "alternatives": STD_KVA},
        18: {"text": "I en parallellogram gäller att en av vinklarna är $11x$ och en annan av "
                      "vinklarna är $4x$.\nKvantitet I: $x$\nKvantitet II: $15°$",
             "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: $\\frac{10^3}{10^2}$\nKvantitet II: $\\frac{10^{-2}}{10^{-3}}$",
             "alternatives": STD_KVA},
        20: {"text": "Medelvärdet av de tre talen $x$, $y$ och $z$ är lika med $x$.\n"
                      "Kvantitet I: $2x$\nKvantitet II: $y + z$", "alternatives": STD_KVA},
        21: {"text": "I triangeln ABC är sidan AB dubbelt så lång som sidan BC.\nKvantitet I: "
                      "Längden av sidan AC\nKvantitet II: Längden av sidan AB", "alternatives": STD_KVA},
        22: {"text": "$0 < a < 1$\nKvantitet I: $a^{-1}$\nKvantitet II: $1$", "alternatives": STD_KVA},
    },
    # Uteslutna: 4 (regelbunden femhörning), 7 (rätvinklig triangel), 22
    # (två rätvinkliga trianglar). Fråga 2:s tabell är ren text.
    "2023vt-4": {
        1: {"text": "$5(x-4) = 2(8+x)$\n\nVad är $x$?", "alternatives": ["$\\frac{4}{3}$", "5", "$\\frac{36}{7}$", "12"]},
        2: {"text": "Sixten har en påse med enfärgade kulor i fem olika färger: blå, grön, "
                     "röd, svart och vit. Antalet kulor av varje färg visas i tabellen:\n\n"
                     "blå: 50\ngrön: 63\nröd: 36\nsvart: 56\nvit: 45\n\nEn av färgerna "
                     "förekommer på exakt 18 % av kulorna, vilken?",
            "alternatives": ["grön", "röd", "svart", "vit"]},
        3: {"text": "Vilket svarsalternativ motsvarar uttrycket $x^2 - 6x + 5$?",
            "alternatives": ["$(x-2)(x-3)$", "$(x-1)(x-5)$", "$(x+3)(x-2)$", "$(x+5)(x-1)$"]},
        5: {"text": "Vad är $\\left(\\frac{1}{2}+\\frac{2}{5}\\right)\\left(\\frac{1}{2}-\\frac{2}{5}\\right)$?",
            "alternatives": ["$\\frac{1}{7}$", "$\\frac{1}{10}$", "$\\frac{3}{100}$", "$\\frac{9}{100}$"]},
        6: {"text": "$xy + k = k$\n$y \\neq 0$\n\nVilket svarsalternativ är med säkerhet korrekt?",
            "alternatives": ["$x > y$", "$x = 0$", "$x - y = 0$", "$xy = -1$"]},
        8: {"text": "Vilket svarsalternativ är en ekvation för en linje som går genom "
                     "punkten $(5, 13)$?",
            "alternatives": ["$y = -5x + 12$", "$y = -3x + 25$", "$y = 3x - 2$", "$y = 5x - 13$"]},
        9: {"text": "För de tre positiva heltalen $x$, $y$ och $z$ gäller att $x < y < z$. "
                     "Medelvärdet av talen är 7 och medianen är 9. Vilket är det största "
                     "möjliga värdet på $x$?", "alternatives": ["1", "2", "3", "4"]},
        10: {"text": "Eva har en tunna som är fylld till en femtedel med vatten. Eva vattnar "
                      "sin trädgård och fyller sin vattenkanna från tunnan. Vattenkannan "
                      "rymmer 5 liter och då Eva vattnar använder hon tre fulla kannor. När "
                      "Eva har vattnat klart är tunnan fylld till en åttondel. Vilken volym "
                      "har tunnan?", "alternatives": ["45 liter", "120 liter", "200 liter", "225 liter"]},
        11: {"text": "$f(x) = \\frac{x}{5} - 1$\n$g(x) = 5 \\cdot f(x) + 4$\n\nVad är $g(2)$?",
             "alternatives": ["1", "3", "5", "14"]},
        12: {"text": "Vilket svarsalternativ är lika med $2^2(5+7)^2$?",
             "alternatives": ["$24^2$", "$10^2 + 14^2$", "$24^4$", "$10^4 + 14^4$"]},
        13: {"text": "$f(x) = 83 - 9x$\nKvantitet I: Värdet av $x$ då $f(x)$ är lika med noll\n"
                      "Kvantitet II: $9{,}5$", "alternatives": STD_KVA},
        14: {"text": "Kvantitet I: $\\frac{1}{2} \\cdot \\frac{3}{4}$\nKvantitet II: "
                      "$\\frac{\\frac{1}{2}}{\\frac{3}{4}}$", "alternatives": STD_KVA},
        15: {"text": "Hampus har sju mynt. Vart och ett av mynten är antingen en femkrona "
                      "eller en tiokrona. Hampus vill köpa en leksak som kostar 105 kronor. "
                      "För att kunna köpa leksaken lånar han mellanskillnaden av sin mamma.\n"
                      "Kvantitet I: Beloppet som Hampus lånar av sin mamma\nKvantitet II: "
                      "60 kronor", "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: $\\frac{3x-1}{4}$\nKvantitet II: $0{,}75x - 0{,}25$",
             "alternatives": STD_KVA},
        17: {"text": "En vanlig sexsidig tärning kastas slumpmässigt fem gånger.\nKvantitet I: "
                      "Medianen av de fem utfallen\nKvantitet II: Det näst största värdet av "
                      "de fem utfallen", "alternatives": STD_KVA},
        18: {"text": "$x > 4$\nKvantitet I: $\\sqrt{x}$\nKvantitet II: $\\frac{x}{2}$",
             "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: 75 % av arean av en cirkel med radien 4 cm\nKvantitet II: "
                      "Arean av en cirkel med radien 3 cm", "alternatives": STD_KVA},
        20: {"text": "$2^{x-1} = 32$\nKvantitet I: $x$\nKvantitet II: $5 \\cdot x^0$",
             "alternatives": STD_KVA},
        21: {"text": "$x$ är 75 procent av 80.\n8 är $y$ procent av 12.\nKvantitet I: $x$\n"
                      "Kvantitet II: $y$", "alternatives": STD_KVA},
    },
    # Uteslutna: 4 (fyra grafer SOM svarsalternativ), 7 (likformiga
    # trianglar), 10 (cirklar i rektangel), 17 (parallella linjer).
    "2022ht-1": {
        1: {"text": "Vilket svarsalternativ motsvarar uttrycket $(4-3)(x+2y)$?",
            "alternatives": ["$1 + x + 2y$", "$4 - 3x + 2y$", "$x + 2y$", "$4x - 6y$"]},
        2: {"text": "Vad är $3^3 - 2^3$?", "alternatives": ["1", "3", "6", "19"]},
        3: {"text": "$0{,}4x + 0{,}2 = 0{,}6x + 1{,}8$\n\nVilket värde har $x$?",
            "alternatives": ["–10", "–8", "1,6", "2"]},
        5: {"text": "I burk A finns det 50 enfärgade kulor: 10 svarta och 40 vita. I burk B "
                     "finns det 90 kulor. Sannolikheten är 2/3 att en slumpmässigt plockad "
                     "kula ur burk B är svart. Kulorna i burk A och burk B hälls över i en "
                     "tom påse. Vad är sannolikheten att en slumpmässigt plockad kula ur "
                     "påsen är svart?", "alternatives": ["$\\frac{2}{7}$", "$\\frac{1}{2}$", "$\\frac{7}{10}$", "$\\frac{5}{7}$"]},
        6: {"text": "$f(x) = 5(x^3+x) - 10(x^2+1)$\n\nVilket svarsalternativ är lika med $f(2)$?",
            "alternatives": ["0", "3", "20", "100"]},
        8: {"text": "Albert står i en kö. Antalet personer som står före honom i kön är tre "
                     "gånger så stort som antalet personer som står efter honom i kön. Vilket "
                     "svarsalternativ kan vara det totala antalet personer i kön?",
            "alternatives": ["26", "27", "28", "29"]},
        9: {"text": "Vilket svarsalternativ motsvarar uttrycket $(x+7)^2 - (x-7)^2$?",
            "alternatives": ["$28x$", "$49x$", "$x^2$", "$x^2 - 7x + 49$"]},
        11: {"text": "$\\frac{1}{x} = -\\frac{2}{3}$\n\nVad är $x^3$?",
             "alternatives": ["$-\\frac{27}{8}$", "$-\\frac{8}{27}$", "$\\frac{8}{27}$", "$\\frac{27}{8}$"]},
        12: {"text": "$x = \\frac{\\pi}{\\sqrt{2}}$\n\nI vilket intervall ligger $x$?",
             "alternatives": ["$x < 1$", "$1 \\leq x < 1{,}5$", "$1{,}5 \\leq x < 2$", "$x \\geq 2$"]},
        13: {"text": "$\\frac{8}{10} = \\frac{x}{16}$\nKvantitet I: $x$\nKvantitet II: $10$",
             "alternatives": STD_KVA},
        14: {"text": "Almas ålder är hälften av Ellas och Lenas sammanlagda ålder.\n"
                      "Kvantitet I: Almas ålder\nKvantitet II: Ellas ålder", "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: 30 procent av 40\nKvantitet II: 40 procent av 30",
             "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: Medelvärdet av mätserien 1, 3, 7\nKvantitet II: "
                      "Medelvärdet av mätserien 1, 1, 3, 7, 7", "alternatives": STD_KVA},
        18: {"text": "$x \\neq 0$\n$x^2 = -5x$\nKvantitet I: $x$\nKvantitet II: $0$",
             "alternatives": STD_KVA},
        19: {"text": "Arean av en rektangel är 50 cm$^2$. Rektangelns bredd är 5 cm.\n"
                      "Kvantitet I: Längden av rektangelns diagonal\nKvantitet II: 11 cm",
             "alternatives": STD_KVA},
        20: {"text": "Kvantitet I: $\\frac{3^2}{7^2}$\nKvantitet II: $\\frac{7^{-2}}{3^{-2}}$",
             "alternatives": STD_KVA},
        21: {"text": "Linjen L går genom punkten $(-10, -1)$ och har positiv lutning.\n"
                      "Kvantitet I: $y$-koordinaten för den punkt där L skär $y$-axeln\n"
                      "Kvantitet II: $0$", "alternatives": STD_KVA},
        22: {"text": "$y \\neq 0$\n$\\frac{2x}{3y} = 7$\nKvantitet I: $y$\nKvantitet II: "
                      "$\\frac{2}{21}x$", "alternatives": STD_KVA},
    },
    # Uteslutna: 6 (trianglar med vinklar), 17 (linjer i diagram). NOG 24
    # hade redan ren text.
    "2022ht-4": {
        1: {"text": "Vilket svarsalternativ är lika med $\\frac{1}{3} + \\frac{3}{4} + \\frac{5}{12}$?",
            "alternatives": ["$\\frac{9}{4}$", "$\\frac{9}{6}$", "$\\frac{9}{12}$", "$\\frac{9}{19}$"]},
        2: {"text": "$L_1$: $y = 2x - 4$\n$L_2$: $y = x - 1$\n\nLinjerna $L_1$ och $L_2$ skär "
                     "varandra i punkten P. Vilka koordinater har punkten P?",
            "alternatives": ["$(-4, -1)$", "$(1, 0)$", "$(2, -4)$", "$(3, 2)$"]},
        3: {"text": "$\\frac{45x}{7} = 5x + 10$\n\nVad är $x$?",
            "alternatives": ["$\\frac{7}{8}$", "$\\frac{7}{4}$", "5", "7"]},
        4: {"text": "Vad är 7 procent av 15?", "alternatives": ["1", "1,05", "1,1", "1,15"]},
        5: {"text": "Vad är differensen mellan medianen och medelvärdet av de sex talen "
                     "$-1$, 1, 2, 4, 5 och 7?", "alternatives": ["0", "1", "2", "3"]},
        7: {"text": "Vilket svarsalternativ är en funktion som uppfyller att $f(1) > f(0)$?",
            "alternatives": ["$f(x) = 2$", "$f(x) = x - 2$", "$f(x) = x^2 - 2x + 1$", "$f(x) = -2x + 2$"]},
        8: {"text": "Vilket svarsalternativ motsvarar uttrycket $(a+b)(c+d)(e+f)$?",
            "alternatives": ["$ac + ad + bc + bd + e + f$", "$ac + ad + bc + bd + ae + af + be + bf$",
                              "$ace + bdf$", "$ace + acf + ade + adf + bce + bcf + bde + bdf$"]},
        9: {"text": "Arean av en cirkel är 27 cm$^2$. Vilket av svarsalternativen är det "
                     "bästa närmevärdet för cirkelns diameter?",
            "alternatives": ["1,5 cm", "4,5 cm", "6 cm", "9 cm"]},
        10: {"text": "Vilket värde har $x$ om $\\frac{1}{3} - x = \\frac{1}{2} - \\frac{1}{3}$?",
             "alternatives": ["$-\\frac{1}{2}$", "$-\\frac{1}{6}$", "$\\frac{1}{6}$", "$\\frac{1}{2}$"]},
        11: {"text": "För en viss sorts garn gäller att ett nystan med 130 meter garn väger "
                      "50 gram. Emma använder 430 gram av garnet för att sticka en tröja. "
                      "Vilket svarsalternativ är ett uttryck för att beräkna hur många meter "
                      "garn Emma använder till tröjan?",
             "alternatives": ["$\\frac{50}{130} \\cdot 430$", "$\\frac{50}{430} \\cdot 130$",
                               "$\\frac{130}{50} \\cdot 430$", "$\\frac{430}{130} \\cdot 50$"]},
        12: {"text": "Vilket svarsalternativ motsvarar $4 \\cdot 2^x$?",
             "alternatives": ["$2^{x+2}$", "$2^{2x}$", "$4^{x-1}$", "$8^x$"]},
        13: {"text": "$2(x+3) = 3(x+4)$\nKvantitet I: $x$\nKvantitet II: $0$", "alternatives": STD_KVA},
        14: {"text": "Två vanliga sexsidiga tärningar kastas slumpmässigt en gång.\nKvantitet "
                      "I: Sannolikheten att summan av det tärningarna visar är 10\nKvantitet "
                      "II: Sannolikheten att summan av det tärningarna visar är 4", "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: $\\frac{5}{6} + \\frac{5}{6}$\nKvantitet II: "
                      "$\\frac{5}{6} \\cdot \\frac{5}{6}$", "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: Arean av en triangel med basen $b$ och höjden $h_1$\n"
                      "Kvantitet II: Arean av en triangel med basen $b-1$ och höjden $h_2$",
             "alternatives": STD_KVA},
        18: {"text": "Kvantitet I: En fjärdedel av arean av en cirkel med radien 1 cm\n"
                      "Kvantitet II: Tre fjärdedelar av arean av en kvadrat med sidan 1 cm",
             "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: $\\sqrt{7} + \\sqrt{3}$\nKvantitet II: $\\sqrt{10}$",
             "alternatives": STD_KVA},
        20: {"text": "$x$ och $y$ är positiva heltal sådana att $xy = 36$.\nKvantitet I: "
                      "$x + y$\nKvantitet II: $18$", "alternatives": STD_KVA},
        21: {"text": "Kvantitet I: Antalet minuter som det tar att färdas 40 km med "
                      "hastigheten 100 km/h\nKvantitet II: Antalet minuter som det tar att "
                      "färdas 40 km med hastigheten 40 m/s", "alternatives": STD_KVA},
        22: {"text": "$x > 2$\n$\\frac{125}{\\sqrt{x-2}} = 25$\nKvantitet I: $x - 2$\n"
                      "Kvantitet II: $25$", "alternatives": STD_KVA},
        24: {"text": "Är $x < 0$?\n\n(1) $4x = -8$\n(2) $x^5 < 0$", "alternatives": STD_NOG},
    },
    # Uteslutna: 5 (fyrhörning med sned sida), 13 (rektangel+triangel),
    # 14 (två räta linjer i koordinatsystem), 18 (kvadrat ABCD).
    "2022vta-3": {
        1: {"text": "Vad är $4(6(7-2)+5)$?", "alternatives": ["125", "140", "165", "171"]},
        2: {"text": "$f(x) = \\frac{2x+7}{3x+c}$\n\nVilket värde har konstanten $c$ om "
                     "$f(2) = 1$?", "alternatives": ["$\\frac{3}{2}$", "5", "6", "21"]},
        3: {"text": "Vilket svarsalternativ är lika med $\\frac{1}{4} + \\frac{2}{16} + "
                     "\\frac{3}{32}$?",
            "alternatives": ["$\\frac{6}{32}$", "$\\frac{11}{32}$", "$\\frac{15}{32}$",
                              "$\\frac{6}{52}$"]},
        4: {"text": "Vilket av svarsalternativen motsvarar $(3x-3y)(y-x)$?",
            "alternatives": ["$2x-2y$", "$2x-3y^2$", "$3(x^2-y^2)$", "$6xy-3x^2-3y^2$"]},
        6: {"text": "Talet $2^{25}$ är jämnt delbart med ett av svarsalternativen. Vilket?",
            "alternatives": ["16", "24", "25", "50"]},
        7: {"text": "Grafen till funktionen $f$ är en rät linje. Dessutom gäller att "
                     "$f(2)=4$ och $f(3)=1$. Vilket svarsalternativ anger $f(x)$?",
            "alternatives": ["$f(x)=3x+7$", "$f(x)=3x+10$", "$f(x)=-3x+7$", "$f(x)=-3x+10$"]},
        8: {"text": "$\\frac{x}{3}+\\frac{x}{4}=x-2$\n\nVad är $x$?",
            "alternatives": ["$\\frac{14}{5}$", "$\\frac{24}{10}$", "$\\frac{19}{4}$",
                              "$\\frac{24}{5}$"]},
        9: {"text": "Stina har två olika rabattkuponger som gäller i en viss butik. Den "
                     "första kupongen ger 10 % rabatt. Den andra kupongen ger 8 % rabatt "
                     "och sedan ett ytterligare avdrag på 40 kr. Vid vilket ordinarie pris "
                     "ger de två olika kupongerna samma rabatterade pris?",
            "alternatives": ["400 kr", "500 kr", "2 000 kr", "4 000 kr"]},
        10: {"text": "$10^{2x}=36$\n\nVad är $10^{-2x}$?",
             "alternatives": ["$-\\frac{1}{36}$", "$\\frac{1}{36}$", "$\\frac{1}{6}$",
                               "$\\frac{100}{36}$"]},
        11: {"text": "I en låda finns det endast enfärgade röda och svarta kulor. Kalle "
                      "plockar slumpmässigt kulor ur lådan, en i taget, och lägger tillbaka "
                      "dem efter varje plockad kula. Sannolikheten att få två svarta kulor "
                      "efter varandra är då 16/49. Vad är sannolikheten att Kalle plockar "
                      "en röd kula?", "alternatives": ["3/7", "25/49", "5/7", "40/49"]},
        12: {"text": "En cirkelskiva med radien 24 cm delas först i fyra lika stora bitar. "
                      "Varje bit delas därefter i tre lika stora bitar, vilka i sin tur "
                      "slutligen delas i två lika stora bitar. Vad är arean av en av "
                      "bitarna efter den sista delningen?",
             "alternatives": ["$12\\pi$ cm²", "$24\\pi$ cm²", "$48\\pi$ cm²", "$64\\pi$ cm²"]},
        15: {"text": "Kvantitet I: $\\frac{24}{6}$\nKvantitet II: $\\frac{3}{12} \\cdot 16$",
             "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: Medelvärdet av mätserien 1, 1, 5, 5\nKvantitet II: "
                      "Hälften av medelvärdet av mätserien 2, 4, 8, 10",
             "alternatives": STD_KVA},
        17: {"text": "Kvantitet I: $\\left(\\frac{2}{\\sqrt{3}}\\right)^2$\nKvantitet II: "
                      "$\\sqrt{\\frac{16}{\\pi^2}}$", "alternatives": STD_KVA},
        19: {"text": "Anna, Beda och Clara har tillsammans 66 karameller. Beda har 19 "
                      "karameller och Clara har mer än en tredjedel av karamellerna.\n"
                      "Kvantitet I: Antalet karameller som Anna har\nKvantitet II: 24",
             "alternatives": STD_KVA},
        20: {"text": "$x \\neq 0$\nKvantitet I: $\\frac{x^2}{2x} - \\frac{2x}{4}$\n"
                      "Kvantitet II: $\\frac{2x}{x} - \\frac{x}{2x}$",
             "alternatives": STD_KVA},
        21: {"text": "$x \\geq 0$\nKvantitet I: $\\sqrt{x}$\nKvantitet II: $\\frac{x}{2}$",
             "alternatives": STD_KVA},
        22: {"text": "Peter reser i 2 timmar med hastigheten 5 m/s. Mattias reser i 3 "
                      "timmar med hastigheten 12 km/h.\nKvantitet I: Sträckan som Peter "
                      "reser\nKvantitet II: Sträckan som Mattias reser",
             "alternatives": STD_KVA},
    },
    # Uteslutna: 2 (triangel med vinklar), 22 (rektangel R).
    "2022vta-5": {
        1: {"text": "$x - 7 = 3(x+1)$\n\nVilket värde har $x$?",
            "alternatives": ["–5", "–4", "2", "$\\frac{5}{2}$"]},
        3: {"text": "Vad är medelvärdet av $8^2$ och $4^2$?",
            "alternatives": ["$2 \\cdot 4^2$", "$6^2$", "$2^3 \\cdot 5$", "$2^2 \\cdot 12$"]},
        4: {"text": "$f(x) = 3x - 1$\n$g(x) = -2f(x) + 4$\n\nVilket svarsalternativ är "
                     "lika med $g(1)$?", "alternatives": ["0", "2", "4", "6"]},
        5: {"text": "Vad är $\\frac{\\frac{2}{5} - \\frac{1}{4}}{\\frac{1}{3} + \\frac{1}{6}}$?",
            "alternatives": ["$\\frac{2}{9}$", "$\\frac{3}{10}$", "$\\frac{9}{2}$",
                              "$\\frac{10}{3}$"]},
        6: {"text": "Vilket svarsalternativ är lika med ett heltal?",
            "alternatives": ["$51\\sqrt{51}$", "$\\sqrt{51}(\\sqrt{51}+51)$",
                              "$\\sqrt{51}+\\sqrt{51}$", "$(\\sqrt{51}+\\sqrt{51})^2$"]},
        7: {"text": "$f(x) = a \\cdot 3^x$\nOm $a$ väljs så att $f(1) = 3$, vilket värde "
                     "har då $f(0)$?", "alternatives": ["0", "$\\frac{1}{3}$", "1", "3"]},
        8: {"text": "$xyz \\neq 0$\n\nVilket svarsalternativ motsvarar "
                     "$\\frac{x^4y^2z^3}{(x^2yz^2)^2}$?",
            "alternatives": ["$\\frac{1}{yz}$", "1", "$\\frac{1}{y}$", "$\\frac{1}{z}$"]},
        9: {"text": "60 % av $x$ är lika med 40 % av $y$. Hur många procent av $x$ är $y$?",
            "alternatives": ["20 %", "66 %", "100 %", "150 %"]},
        10: {"text": "Arean av en kvadrat är $100$ cm². Vilket svarsalternativ är "
                      "närmast längden av kvadratens diagonal?",
             "alternatives": ["10 cm", "12 cm", "14 cm", "16 cm"]},
        11: {"text": "$z = x + y = 5$\n\nVad är $\\sqrt{xz+yz}$?",
             "alternatives": ["$\\sqrt{5}$", "5", "$5\\sqrt{5}$", "25"]},
        12: {"text": "Summan av de 30 första udda positiva heltalen är $u$. Summan av de "
                      "30 första jämna positiva heltalen är $j$. Vad är $u - j$?",
             "alternatives": ["–30", "–1", "0", "30"]},
        13: {"text": "Kvantitet I: $\\frac{707}{70}$\nKvantitet II: $\\frac{808}{80}$",
             "alternatives": STD_KVA},
        14: {"text": "De fyra punkterna A, B, C och D är placerade i samma "
                      "koordinatsystem.\n$A = (0,0)$\n$B = (4,3)$\n$C = (8,0)$\n"
                      "$D = (8,1)$\n\nKvantitet I: Den sammanlagda längden av sträckorna "
                      "AB och BC\nKvantitet II: Längden av sträckan AD",
             "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: Volymen av en cylinder med höjden 5 cm och radien 2 cm\n"
                      "Kvantitet II: Volymen av en cylinder med höjden 2 cm och radien 5 cm",
             "alternatives": STD_KVA},
        16: {"text": "$\\frac{x}{3} - \\frac{1}{5} = \\frac{1}{3} + \\frac{1}{5}$\n\n"
                      "Kvantitet I: $x$\nKvantitet II: 2", "alternatives": STD_KVA},
        17: {"text": "$3 < p < 5$\nKvantitet I: $p^3$\nKvantitet II: $42p$",
             "alternatives": STD_KVA},
        18: {"text": "En påse innehåller endast 9 enfärgade kulor: 5 röda och 4 blå. "
                      "Albin plockar slumpmässigt två kulor ur påsen. Han plockar dem en "
                      "och en utan att lägga tillbaka dem.\nKvantitet I: Sannolikheten att "
                      "Albin först plockar en röd kula och sedan en blå kula\nKvantitet II: "
                      "Sannolikheten att Albin först plockar en röd kula och sedan "
                      "ytterligare en röd kula", "alternatives": STD_KVA},
        19: {"text": "$36^{\\frac{1}{3}} = 6^{2x}$\n\nKvantitet I: $x$\nKvantitet II: "
                      "$\\frac{2}{5}$", "alternatives": STD_KVA},
        20: {"text": "Summan av fem på varandra följande heltal är 15.\nKvantitet I: "
                      "Skillnaden mellan det största och det minsta talet\nKvantitet II: 5",
             "alternatives": STD_KVA},
        21: {"text": "$n$ är ett heltal sådant att $-10 \\leq n \\leq 10$.\nKvantitet I: "
                      "$10^n$\nKvantitet II: $n^{10}$", "alternatives": STD_KVA},
    },
    # Uteslutna: 2 (linje inritad i koordinatsystem), 4 (cirkel+triangel),
    # 14 (fyra korsande linjer med vinklar), 18 (sexhörning ABCDEF).
    "2022vtb-1": {
        1: {"text": "$5(3-x) = (4+x) \\cdot 2$\n\nVilket värde har $x$?",
            "alternatives": ["0", "1", "$\\frac{7}{2}$", "$\\frac{11}{3}$"]},
        3: {"text": "Vad är $\\frac{4}{9} \\cdot \\frac{1}{3} - \\frac{1}{3} + \\frac{4}{9}$?",
            "alternatives": ["$\\frac{4}{9}$", "$\\frac{7}{27}$", "$\\frac{7}{33}$",
                              "$\\frac{16}{81}$"]},
        5: {"text": "I vilket av följande intervall ligger $x$ om $x = \\sqrt{\\sqrt{4}}$?",
            "alternatives": ["$1{,}2 < x \\leq 1{,}6$", "$1{,}6 < x \\leq 2{,}0$",
                              "$2{,}0 < x \\leq 4{,}0$", "$4{,}0 < x \\leq 6{,}0$"]},
        6: {"text": "Vad är medelvärdet av $\\frac{1}{3}$ och $\\frac{1}{5}$?",
            "alternatives": ["$\\frac{1}{8}$", "$\\frac{10}{75}$", "$\\frac{1}{4}$",
                              "$\\frac{4}{15}$"]},
        7: {"text": "En kvadrat har lika stor area som en rektangel med basen $x$ cm och "
                     "höjden $3x/4$ cm. Vilket svarsalternativ motsvarar kvadratens "
                     "sidlängd?",
            "alternatives": ["$\\sqrt{\\frac{3}{2}}x$ cm", "$\\frac{3x}{2}$ cm",
                              "$\\frac{\\sqrt{3}x}{2}$ cm", "$\\frac{9x}{16}$ cm"]},
        8: {"text": "$xy^2 = 18$\n$xy = 3$\n\nVad är $x$?",
            "alternatives": ["$\\frac{1}{2}$", "$\\frac{3}{2}$", "2", "$\\sqrt{6}$"]},
        9: {"text": "Vilket svarsalternativ är lika med $5 \\cdot 5^0 \\cdot 5^{-2} + 5$?",
            "alternatives": ["5", "5,2", "6", "10"]},
        10: {"text": "$x \\neq 0$\n\nVilket svarsalternativ motsvarar uttrycket "
                      "$\\frac{\\frac{x-3}{x}}{\\frac{1}{x}} + 3$?",
             "alternatives": ["0", "1", "$x$", "$\\frac{x}{x^2}$"]},
        11: {"text": "Ekvationen för linjen L kan skrivas $y = \\frac{2}{3}x + \\frac{4}{3}$. "
                      "Linjen L går genom punkten (1, 2). Vilket svarsalternativ anger en "
                      "punkt på L?",
             "alternatives": ["(–2, 0)", "(0, 1)", "(2, 3)", "(3, 3)"]},
        12: {"text": "Det tar 11 sekunder för Oscar att springa $y$ meter. Hur många "
                      "sekunder tar det för honom att springa $x$ meter med samma "
                      "medelhastighet?",
             "alternatives": ["$\\frac{x}{11y}$", "$\\frac{y}{11x}$", "$\\frac{11x}{y}$",
                               "$\\frac{11y}{x}$"]},
        13: {"text": "Kvantitet I: 4 % av 200\nKvantitet II: En fjärdedel av 20",
             "alternatives": STD_KVA},
        15: {"text": "$f(x) = 10 - 3x$\nKvantitet I: $f(2) - f(5)$\nKvantitet II: "
                      "$f(0) - f(4)$", "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: $\\frac{1}{5} + \\frac{1}{10} + \\frac{1}{15}$\n"
                      "Kvantitet II: $\\frac{1}{3}$", "alternatives": STD_KVA},
        17: {"text": "$\\frac{x}{16} = \\frac{3}{12x}$\n\nKvantitet I: $x$\nKvantitet II: 4",
             "alternatives": STD_KVA},
        19: {"text": "$x < 0$\n$y < 1$\nKvantitet I: $x^2$\nKvantitet II: $x^2y$",
             "alternatives": STD_KVA},
        20: {"text": "En burk innehåller endast enfärgade röda och svarta kulor. Antalet "
                      "svarta kulor är fem gånger så stort som antalet röda kulor.\n"
                      "Kvantitet I: Sannolikheten att en slumpmässigt vald kula ur burken "
                      "är röd\nKvantitet II: 1/5", "alternatives": STD_KVA},
        21: {"text": "$x$ och $y$ är heltal sådana att\n$16 < x < 25$\n$16 < y < 25$\n"
                      "$x$ är inte jämnt delbart med vare sig 3 eller 5.\n$y$ är jämnt "
                      "delbart med 2.\nKvantitet I: Antalet olika tal som $x$ kan vara\n"
                      "Kvantitet II: Antalet olika tal som $y$ kan vara",
             "alternatives": STD_KVA},
        22: {"text": "$\\sqrt{5} \\cdot \\sqrt{9} = 45^x$\n\nKvantitet I: $x$\nKvantitet II: 0,5",
             "alternatives": STD_KVA},
    },
    # Uteslutna: 4 (fyra grafer SOM svarsalternativ), 6 (triangel med vinklar),
    # 11 (kvadrater+kvartscirklar), 21 (två räta linjer i koordinatsystem).
    "2022vtb-4": {
        1: {"text": "Vad är $(1{,}7 \\cdot 10^5) \\cdot (3{,}3 \\cdot 10^3)$?",
            "alternatives": ["$3{,}21 \\cdot 10^8$", "$5{,}61 \\cdot 10^8$",
                              "$3{,}21 \\cdot 10^{15}$", "$5{,}61 \\cdot 10^{15}$"]},
        2: {"text": "Medelvärdet av $x$ och $y$ är 3. Medelvärdet av $y$ och 1 är 5. "
                     "Vilket värde har $x$?", "alternatives": ["–5", "–3", "0", "15"]},
        3: {"text": "$x > 1$\n\nVilket svarsalternativ motsvarar $(x^7)^{y+2}$?",
            "alternatives": ["$x^{y+9}$", "$x^{7y+2}$", "$x^{7y+14}$", "$x^{y+49}$"]},
        5: {"text": "$a \\neq 0$, $b \\neq 0$, $x \\neq 0$, $y \\neq 0$\n\nVilket "
                     "svarsalternativ är med säkerhet lika med $b$ om $\\frac{6x}{y} = "
                     "\\frac{3a}{2b}$?",
            "alternatives": ["$\\frac{y}{2}$", "$\\frac{ay}{4x}$", "$\\frac{4ay}{x}$",
                              "$\\frac{9ay}{x}$"]},
        7: {"text": "$x \\neq 0$\n$y \\neq 0$\n$\\frac{x^2}{y} + 2 = 2 - (-x)$\n\nVilket "
                     "svarsalternativ är med säkerhet korrekt?",
            "alternatives": ["$x+y=2$", "$x<y$", "$x=y$", "$x>y$"]},
        8: {"text": "Kalle är pappa till tre pojkar och en flicka. Idag är pojkarnas "
                     "sammanlagda ålder lika med flickans ålder. Vad är differensen "
                     "mellan pojkarnas sammanlagda ålder och flickans ålder om tre år?",
            "alternatives": ["0 år", "3 år", "6 år", "9 år"]},
        9: {"text": "Hur många procent är 14,4 av 36?", "alternatives": ["35", "40", "45", "50"]},
        10: {"text": "Punkten $(a, a)$ ligger på linjen $y = \\frac{1}{2}x + 2$. Vilket "
                      "värde har $a$?", "alternatives": ["0", "$\\frac{1}{2}$", "2", "4"]},
        12: {"text": "$xy = 1$\n\nVilket värde har uttrycket $(x+y)^2 - (x-y)^2$?",
             "alternatives": ["0", "1", "2", "4"]},
        13: {"text": "Kvantitet I: 80 000 cm\nKvantitet II: 8 km", "alternatives": STD_KVA},
        14: {"text": "Kvantitet I: $\\frac{1}{5} - \\frac{5}{20}$\nKvantitet II: 0",
             "alternatives": STD_KVA},
        15: {"text": "En mätserie består av de fem positiva heltalen 4, 2, $a$, 7 och 3.\n"
                      "Kvantitet I: Mätseriens median\nKvantitet II: 3", "alternatives": STD_KVA},
        16: {"text": "$-7(3-2x) = 21$\n\nKvantitet I: $x$\nKvantitet II: 3",
             "alternatives": STD_KVA},
        17: {"text": "Kvantitet I: Längden av den tredje sidan i en triangel där summan "
                      "av de två andra sidorna är 17 cm\nKvantitet II: 15 cm",
             "alternatives": STD_KVA},
        18: {"text": "$x + \\frac{1}{2} = y + \\frac{3}{5}$\n\nKvantitet I: $x$\nKvantitet II: $y$",
             "alternatives": STD_KVA},
        19: {"text": "$x < y$\nKvantitet I: $x + y$\nKvantitet II: $x - y$",
             "alternatives": STD_KVA},
        20: {"text": "Fyra cirklar har radierna 5 cm, 10 cm, 15 cm respektive 20 cm.\n"
                      "Kvantitet I: Den sammanlagda arean av den största och den minsta "
                      "cirkeln\nKvantitet II: Den sammanlagda arean av de två "
                      "mellanstora cirklarna", "alternatives": STD_KVA},
        22: {"text": "Kvantitet I: Summan av primtalsfaktorerna i heltalet 21\nKvantitet "
                      "II: Summan av primtalsfaktorerna i heltalet 30", "alternatives": STD_KVA},
    },
    # Uteslutna: 5 (fyra linjer med vinklar), 7 (graf med parabel+linje),
    # 10 (rektangel av kvadrater), 12 (rektangel i koordinatsystem).
    # NOG 24 och 27 har egna figurer och rörs inte; 23/25/26/28 hade redan text.
    "2021ht-1": {
        1: {"text": "Vilket värde har $x$ om $\\frac{1}{2}+\\frac{1}{3}+x=1$?",
            "alternatives": ["$\\frac{1}{6}$", "$\\frac{1}{5}$", "$\\frac{1}{4}$",
                              "$\\frac{1}{3}$"]},
        2: {"text": "En blombukett består av endast vita och röda rosor. Antalet röda "
                     "rosor är tre gånger så stort som antalet vita rosor. Vilket "
                     "svarsalternativ kan motsvara antalet rosor i blombuketten?",
            "alternatives": ["25", "26", "27", "28"]},
        3: {"text": "Vad är $5+3 \\cdot 5-4+8 \\cdot 2$?", "alternatives": ["0", "16", "32", "88"]},
        4: {"text": "Vilket svarsalternativ motsvarar ekvationen $y=4x-5$?",
            "alternatives": ["$x=y+\\frac{5}{4}$", "$x=\\frac{y}{4}+5$",
                              "$x=\\frac{5-y}{4}$", "$x=\\frac{y+5}{4}$"]},
        6: {"text": "Vilket svarsalternativ är lika med $3x(2-5y)$?",
            "alternatives": ["$6x-5y$", "$(6x-15)y$", "$-5x(2+3y)$", "$-(15y-6)x$"]},
        8: {"text": "I en påse finns det 28 enfärgade kulor: 10 röda, 7 vita och 11 "
                     "svarta. Om man drar en kula slumpmässigt, hur stor är då "
                     "sannolikheten att den inte är vit?",
            "alternatives": ["$\\frac{1}{3}$", "$\\frac{1}{4}$", "$\\frac{2}{3}$",
                              "$\\frac{3}{4}$"]},
        9: {"text": "Vilket svarsalternativ är lika med $\\frac{0{,}36}{3 \\cdot 0{,}024}$?",
            "alternatives": ["0,05", "0,5", "5", "50"]},
        11: {"text": "$5x^2+3x=0$\n\nVilket av svarsalternativen är ett möjligt värde på $x$?",
             "alternatives": ["$-\\frac{3}{5}$", "$\\sqrt{\\frac{3}{5}}$", "$-\\frac{5}{3}$",
                               "$\\sqrt{\\frac{5}{3}}$"]},
        13: {"text": "Medelvärdet av de tre talen $x$, $y$ och $z$ är 12. Summan av $y$ "
                      "och $z$ är 30.\nKvantitet I: $x$\nKvantitet II: 9",
             "alternatives": STD_KVA},
        14: {"text": "Kvantitet I: $1+\\frac{1}{4}$\nKvantitet II: $\\frac{10}{8}$",
             "alternatives": STD_KVA},
        15: {"text": "$x > 0$\n$y < 0$\n$z > 0$\n$w < 0$\nKvantitet I: $x^2+y^2$\n"
                      "Kvantitet II: $z^2+w^2$", "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: Arean av en rektangel med sidorna 12 cm och 25 cm\n"
                      "Kvantitet II: Arean av en rätvinklig triangel med kateterna 8 cm "
                      "och 64 cm", "alternatives": STD_KVA},
        17: {"text": "$2(2x+4) = 2x+4$\n\nKvantitet I: $x$\nKvantitet II: 0",
             "alternatives": STD_KVA},
        18: {"text": "$f(x) = x^2-2x-3$\n\nKvantitet I: $f(3)$\nKvantitet II: $f(-1)$",
             "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: 70 procent av 105\nKvantitet II: 73", "alternatives": STD_KVA},
        20: {"text": "$F(n)$ definieras som summan av alla positiva heltal mindre än $n$.\n"
                      "$G(n)$ definieras som summan av alla jämna positiva heltal mindre "
                      "än $n$.\nKvantitet I: $F(5)$\nKvantitet II: $\\frac{G(11)}{2}$",
             "alternatives": STD_KVA},
        21: {"text": "Kvantitet I: Kvoten mellan en cirkels omkrets och dess diameter\n"
                      "Kvantitet II: Kvoten mellan en kvadrats omkrets och dess sidlängd",
             "alternatives": STD_KVA},
        22: {"text": "$x > 1$\nKvantitet I: $x^{7+\\frac{2}{3}}$\nKvantitet II: "
                      "$(x^{23})^{\\frac{1}{3}}$", "alternatives": STD_KVA},
    },
    # Uteslutna: 3 (fyrhörning med rätvinklar), 7 (fyra grafer SOM
    # svarsalternativ), 14 (cirkel med vinkel v), 19 (parallella linjer L1/L2).
    "2021ht-4": {
        1: {"text": "$2x+9=x-7$\n\nVilket värde har $x$?",
            "alternatives": ["–16", "$-\\frac{2}{3}$", "$\\frac{2}{3}$", "16"]},
        2: {"text": "Vad är $\\frac{1}{8}+\\frac{3}{4}+\\frac{1}{2}$?",
            "alternatives": ["$\\frac{13}{12}$", "$\\frac{9}{8}$", "$\\frac{11}{8}$",
                              "$\\frac{5}{14}$"]},
        4: {"text": "Grafen till funktionen $f$ är en rät linje som går genom origo, "
                     "och $f(8) = -6$. Vilket svarsalternativ anger $f(x)$?",
            "alternatives": ["$f(x)=8x-6$", "$f(x)=-6x+8$", "$f(x)=-\\frac{4}{3}x$",
                              "$f(x)=-\\frac{3}{4}x$"]},
        5: {"text": "Vilket är det ursprungliga priset på en vara om en rabatt på 8 "
                     "procent gör varan 640 kronor billigare?",
            "alternatives": ["5 120 kronor", "7 360 kronor", "7 680 kronor", "8 000 kronor"]},
        6: {"text": "Ida målar ett plank med konstant hastighet. Efter 4,5 timmar har "
                     "hon målat 3/7 av planket. Hur lång tid tar det för Ida att måla "
                     "resten av planket?",
            "alternatives": ["5 timmar", "5,5 timmar", "6 timmar", "6,5 timmar"]},
        8: {"text": "$x=-3$\n$y=-2$\n$z=-1$\n\nVilket svarsalternativ har det minsta värdet?",
            "alternatives": ["$x^2yz^2$", "$x^2y^2z$", "$xy^2z^2$", "$xy^3z$"]},
        9: {"text": "Vilket svarsalternativ är med säkerhet lika med medelvärdet av de "
                     "fem talen 14, 11, 13, $x$ och 22?",
            "alternatives": ["$\\frac{15+x}{2}$", "$\\frac{60}{5}+x$", "$60+x$",
                              "$12+\\frac{x}{5}$"]},
        10: {"text": "För vilket värde på $x$ gäller att två tredjedelar av $x$ är lika "
                      "med $\\frac{4}{7}$?",
             "alternatives": ["$x=\\frac{2}{3} \\cdot \\frac{4}{7}$",
                               "$x=\\frac{2}{3} \\cdot \\frac{7}{4}$",
                               "$x=\\frac{3}{2} \\cdot \\frac{4}{7}$",
                               "$x=\\frac{3}{2} \\cdot \\frac{7}{4}$"]},
        11: {"text": "En cylinder har volymen 63 liter och diametern 4 dm. Vilket "
                      "svarsalternativ är närmast cylinderns höjd?",
             "alternatives": ["4 dm", "5 dm", "10 dm", "16 dm"]},
        12: {"text": "$8 \\cdot 2^m = 4^0$\n\nVad är $m$?",
             "alternatives": ["–3", "–2", "–1", "0"]},
        13: {"text": "$3\\left(\\frac{2}{x} - \\frac{1}{6}\\right) = \\frac{3}{2}$\n\n"
                      "Kvantitet I: $x$\nKvantitet II: $\\frac{1}{3}$", "alternatives": STD_KVA},
        15: {"text": "En grupp med enbart kvinnor och män består av totalt 100 personer. "
                      "Var och en av personerna är antingen högerhänt eller vänsterhänt. "
                      "75 % av kvinnorna är högerhänta. 12 kvinnor är vänsterhänta.\n"
                      "Kvantitet I: Antalet kvinnor i gruppen\nKvantitet II: Antalet män "
                      "i gruppen", "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: $\\sqrt{23}$\nKvantitet II: $\\sqrt{9}+\\sqrt{5}$",
             "alternatives": STD_KVA},
        17: {"text": "$y > 0$\n$\\frac{x}{y} = 5$\n\nKvantitet I: $y$\nKvantitet II: 20 "
                      "procent av $x$", "alternatives": STD_KVA},
        18: {"text": "Linjen $L_1$ har ekvationen $y = 3x - 1$\nLinjen $L_2$ har "
                      "ekvationen $y = 5x + 3$\n\nKvantitet I: $x$-koordinaten för "
                      "skärningspunkten mellan $L_1$ och $L_2$\nKvantitet II: 0",
             "alternatives": STD_KVA},
        20: {"text": "$x$ och $y$ är två på varandra följande positiva heltal sådana att "
                      "$y^2 - x^2 = 9$.\nKvantitet I: $y$\nKvantitet II: 6",
             "alternatives": STD_KVA},
        21: {"text": "I Minnas smyckeskrin finns det halsband, armband och ringar. "
                      "Armbanden är dubbelt så många som ringarna. Halsbanden är 3 fler "
                      "än ringarna och 2 färre än armbanden.\nKvantitet I: Antalet "
                      "halsband i Minnas smyckeskrin\nKvantitet II: 8",
             "alternatives": STD_KVA},
        22: {"text": "En mätserie består av tio mätvärden. Vart och ett av mätvärdena är "
                      "ett heltal mellan 1 och 50. Mätseriens median är 25.\nKvantitet I: "
                      "Mätseriens median om det största mätvärdet tas bort\nKvantitet II: 25",
             "alternatives": STD_KVA},
    },
    # Uteslutna: 4 (femhörning), 7 (kvadrat med vinklar), 10 (fyra grafer SOM
    # svarsalternativ). NOG 27/28 har egna figurer och rörs inte.
    "2021vta-3": {
        1: {"text": "$2(x-6) = 4(2-x)$\n\nVilket värde har $x$?",
            "alternatives": ["2", "$\\frac{10}{3}$", "$\\frac{14}{3}$", "5"]},
        2: {"text": "$f(x) = 3x^2 - 12$\n\nVilket svarsalternativ anger ett $x$-värde för "
                     "vilket $f(x) = 0$?", "alternatives": ["0", "2", "4", "12"]},
        3: {"text": "Vad är 20 procent av $\\frac{1}{5}$?",
            "alternatives": ["$\\frac{5}{20}$", "$\\frac{1}{20}$", "$\\frac{1}{25}$",
                              "$\\frac{1}{100}$"]},
        5: {"text": "Vad är medianen av alla heltal från och med 1 till och med 10?",
            "alternatives": ["4,5", "5", "5,5", "6"]},
        6: {"text": "$2^x \\cdot 4^y = 16$\n\nVad är $x+2y$?", "alternatives": ["2", "4", "6", "8"]},
        8: {"text": "Vad är $\\frac{\\frac{3}{4}+\\frac{4}{3}}{\\frac{12}{5}}$?",
            "alternatives": ["5", "$\\frac{5}{12}$", "$\\frac{49}{60}$", "$\\frac{125}{144}$"]},
        9: {"text": "Vilket svarsalternativ motsvarar uttrycket $(a+b)(a^2-ab+b^2)$?",
            "alternatives": ["$a^2-2ab+b^2$", "$a^3+2a^2b+2ab^2+b^3$", "$a^3+2ab^2+b^3$",
                              "$a^3+b^3$"]},
        11: {"text": "$x$ och $y$ är positiva tal. Om $x$ var 25 % större och $y$ var 25 "
                      "% mindre så skulle talen vara lika stora. Hur förhåller sig $x$ "
                      "till $y$?",
             "alternatives": ["$x=\\frac{y}{2}$", "$x=\\frac{3y}{5}$", "$x=\\frac{2y}{3}$",
                               "$x=\\frac{4y}{5}$"]},
        12: {"text": "$x$ är ett heltal större än 0. Vilket är det minsta värde som $x$ "
                      "kan ha för att $75x$ ska vara kvadraten på ett heltal?",
             "alternatives": ["3", "5", "25", "75"]},
        13: {"text": "$f(x) = -4x+2$\n\nKvantitet I: $f\\left(-\\frac{1}{2}\\right)$\n"
                      "Kvantitet II: 0", "alternatives": STD_KVA},
        14: {"text": "$x > 0$\nKvantitet I: $(\\sqrt{x})^{\\sqrt{9}+1}$\nKvantitet II: "
                      "$(\\sqrt{x})^4$", "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: $0{,}97^{97}$\nKvantitet II: $1{,}07^7$",
             "alternatives": STD_KVA},
        16: {"text": "I triangeln T är alla vinklar olika stora.\nKvantitet I: Den minsta "
                      "vinkeln i triangeln T\nKvantitet II: 75°", "alternatives": STD_KVA},
        17: {"text": "I en burk finns det 190 kulor som är numrerade med heltalen 1, 2, "
                      "3, …, 189, 190. En kula plockas slumpmässigt ur burken.\n"
                      "Kvantitet I: Sannolikheten att numret på kulan är ett tvåsiffrigt "
                      "heltal\nKvantitet II: 50 %", "alternatives": STD_KVA},
        18: {"text": "Linjen A går genom punkterna (1, 2) och (2, 3). Linjen B är "
                      "vinkelrät mot linjen A.\nKvantitet I: Riktningskoefficienten för "
                      "linjen A\nKvantitet II: Riktningskoefficienten för linjen B",
             "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: 159 liter\nKvantitet II: 15 900 cm³", "alternatives": STD_KVA},
        20: {"text": "Kvantitet I: Produkten av ett tresiffrigt positivt heltal och ett "
                      "tvåsiffrigt positivt heltal\nKvantitet II: Ett fyrsiffrigt "
                      "positivt heltal", "alternatives": STD_KVA},
        21: {"text": "Arean av en cirkel är $\\pi^3$ cm².\nKvantitet I: Cirkelns radie\n"
                      "Kvantitet II: $\\pi$ cm", "alternatives": STD_KVA},
        22: {"text": "$x > 0$\n$y > 0$\n$\\sqrt{\\frac{x}{y}} = \\frac{x}{y}$\n\n"
                      "Kvantitet I: 2\nKvantitet II: $\\frac{2y}{x}$", "alternatives": STD_KVA},
    },
    # Uteslutna: 2 (triangel med vinklar), 12 (fyrhörning med rätvinklar),
    # 16 (linje inritad i koordinatsystem), 18 (två rätvinkliga trianglar),
    # 21 (triangel med vinklar). NOG 25 har egen figur och rörs inte.
    "2021vta-5": {
        1: {"text": "Vilket svarsalternativ är lika med uttrycket $a(a+a)$?",
            "alternatives": ["$3a$", "$a^2+a$", "$2a^2$", "$a^3$"]},
        3: {"text": "Två butiker säljer äpplen. I butik A kostar äpplena 5 kr/st. I "
                     "butik B är styckepriset 20 procent lägre än i butik A. Hur många "
                     "fler äpplen kan man köpa för 100 kr i butik B jämfört med i "
                     "butik A?", "alternatives": ["4", "5", "10", "20"]},
        4: {"text": "Antag att $2(p+150) = 400$. Vilket värde har uttrycket $4p-200$?",
            "alternatives": ["0", "300", "900", "1 200"]},
        5: {"text": "$P = (-1, 0)$\n$M = (3, 3)$\nM är mittpunkten på sträckan PQ. "
                     "Vilka koordinater har punkten Q?",
            "alternatives": ["(–5, –3)", "(1, 1,5)", "(5, 6)", "(7, 6)"]},
        6: {"text": "Vilket svarsalternativ är störst?",
            "alternatives": ["$\\sqrt{50}$", "$2\\sqrt{25}$", "$5\\sqrt{10}$", "$10\\sqrt{5}$"]},
        7: {"text": "Vilket värde har $x$ om $\\frac{1}{x+1} + \\frac{1}{x+1} = 3$?",
            "alternatives": ["$-\\frac{2}{3}$", "$-\\frac{1}{3}$", "$\\frac{1}{3}$", "$\\frac{2}{3}$"]},
        8: {"text": "Vad är $3 \\cdot 10^5 + 3 \\cdot 10^5$?",
            "alternatives": ["$6 \\cdot 10^5$", "$3 \\cdot 10^6$", "$3 \\cdot 10^{10}$",
                              "$6 \\cdot 10^{10}$"]},
        9: {"text": "Vad är medelvärdet av de tre talen $\\frac{1}{2}$, $\\frac{1}{4}$ "
                     "och $\\frac{1}{8}$?",
            "alternatives": ["$\\frac{1}{4}$", "$\\frac{3}{8}$", "$\\frac{1}{14}$",
                              "$\\frac{7}{24}$"]},
        10: {"text": "$f(x) = 8x+1$\n\nVad är ett möjligt värde på $f(x)$ om $x$ är ett "
                      "heltal?", "alternatives": ["–31", "–17", "15", "32"]},
        11: {"text": "Vilket svarsalternativ ligger närmast $\\frac{254}{13}$?",
             "alternatives": ["18", "19", "20", "21"]},
        13: {"text": "$a+8=b+4$\n\nKvantitet I: $a$\nKvantitet II: $b$", "alternatives": STD_KVA},
        14: {"text": "Charlie har 8 eller 9 lådor med kritor. Varje låda innehåller 5, "
                      "6 eller 7 kritor.\nKvantitet I: Antalet kritor som Charlie har\n"
                      "Kvantitet II: 58", "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: $\\frac{4-3{,}14}{3}$\nKvantitet II: $\\frac{1}{4}$",
             "alternatives": STD_KVA},
        17: {"text": "Oscar går $x$ km på $y/3$ timmar.\nPeter går $6x$ km på $2y$ timmar.\n"
                      "Kvantitet I: Oscars medelhastighet\nKvantitet II: Peters "
                      "medelhastighet", "alternatives": STD_KVA},
        19: {"text": "Medelvärdet av de fyra talen 10, 15, 25 och $x$ är 12.\nKvantitet I: "
                      "$x$\nKvantitet II: 0", "alternatives": STD_KVA},
        20: {"text": "$f(x) = 2x+\\frac{1}{5}$\n$g(x) = \\frac{1}{2}x+5$\n\nKvantitet I: "
                      "$x$-värdet för den punkt där grafen till $f$ skär $x$-axeln\n"
                      "Kvantitet II: $x$-värdet för den punkt där grafen till $g$ skär "
                      "$x$-axeln", "alternatives": STD_KVA},
        22: {"text": "$x$ och $y$ är positiva tal.\n$\\frac{1}{x} - \\frac{1}{y} = 1$\n\n"
                      "Kvantitet I: $x$\nKvantitet II: $y$", "alternatives": STD_KVA},
    },
    # Uteslutna: 2 (fyra grafer SOM svarsalternativ), 5 (triangel med
    # vinklar), 16 (rektangel+triangel), 21 (femhörning+triangel).
    # NOG 26 har egen figur och rörs inte.
    "2021vtb-2": {
        1: {"text": "Vilket värde har $x$ om $\\frac{x}{3}+\\frac{1}{4}=\\frac{11}{12}$?",
            "alternatives": ["2", "$\\frac{5}{2}$", "$\\frac{9}{4}$", "11"]},
        3: {"text": "Vilket heltal är närmast $\\sqrt{65}+\\sqrt{35}$?",
            "alternatives": ["10", "12", "14", "16"]},
        4: {"text": "Vilket svarsalternativ motsvarar $\\frac{\\frac{3}{5}}{2-\\frac{11}{10}}$?",
            "alternatives": ["$-\\frac{2}{3}$", "$-\\frac{3}{50}$", "$\\frac{27}{50}$", "$\\frac{2}{3}$"]},
        6: {"text": "Vilket svarsalternativ motsvarar $x^2+x-12$?",
            "alternatives": ["$(x-3)(x-4)$", "$(x-3)(x+4)$", "$(x+3)(x-4)$", "$(x+3)(x+4)$"]},
        7: {"text": "$x > 0$\n\nVad är $(x^2)^{\\frac{5}{7}}$?",
            "alternatives": ["$x^{\\frac{5}{14}}$", "$x^{\\frac{10}{7}}$", "$x^{\\frac{10}{14}}$",
                              "$x^{\\frac{25}{49}}$"]},
        8: {"text": "Vilket är det största primtalet som är mindre än 100?",
            "alternatives": ["91", "93", "97", "99"]},
        9: {"text": "Linjerna som ges av $y=-2x+2$ och $y=2x+4$ skär varandra i en "
                     "punkt. Vilken $x$-koordinat har punkten?",
            "alternatives": ["–2", "–1", "$-\\frac{1}{2}$", "0"]},
        10: {"text": "Det finns två kvadrater, en gul och en röd. Sidan i den gula "
                      "kvadraten är 6 cm längre än sidan i den röda kvadraten. Den gula "
                      "kvadratens area är 48 cm² större än den röda kvadratens area. "
                      "Hur stor area har den röda kvadraten?",
             "alternatives": ["1 cm²", "16 cm²", "25 cm²", "36 cm²"]},
        11: {"text": "Medelvikten av fyra lådor är 5,5 kg och medianvikten är 5 kg. Vad "
                      "är den lägsta möjliga vikten för den tyngsta lådan?",
             "alternatives": ["5,5 kg", "6 kg", "6,5 kg", "7 kg"]},
        12: {"text": "En bil kör med hastigheten $x$ m/s. Vilket svarsalternativ "
                      "motsvarar denna hastighet uttryckt i km/h?",
             "alternatives": ["$\\frac{x}{6}$", "$9x$", "$\\frac{18x}{5}$", "$36x$"]},
        13: {"text": "$x > -7$\n$y > 7$\n\nKvantitet I: $x$\nKvantitet II: $y$",
             "alternatives": STD_KVA},
        14: {"text": "Kvantitet I: 1 m³\nKvantitet II: 999 dm³", "alternatives": STD_KVA},
        15: {"text": "På en arbetsplats finns det 80 anställda, varav 60 arbetar i "
                      "verkstaden och 20 arbetar på kontoret. 30 av de anställda cyklar "
                      "till arbetet.\nKvantitet I: Antalet anställda som både arbetar i "
                      "verkstaden och cyklar till arbetet\nKvantitet II: 20",
             "alternatives": STD_KVA},
        17: {"text": "$x > 0$\nKvantitet I: En fjärdedel av en femtedel av $x$\n"
                      "Kvantitet II: En femtedel av en fjärdedel av $x$", "alternatives": STD_KVA},
        18: {"text": "$f(x) = 3 \\cdot 2^x$\n\nKvantitet I: $4 \\cdot f(2)$\nKvantitet II: $f(4)$",
             "alternatives": STD_KVA},
        19: {"text": "$x > 0$\nKvantitet I: $\\frac{1}{x+1} - \\frac{1}{x}$\nKvantitet II: "
                      "$\\frac{1}{x} - \\frac{1}{x+1}$", "alternatives": STD_KVA},
        20: {"text": "Kvantitet I: Sannolikheten att slumpmässigt plocka upp en blå "
                      "kula ur en påse som endast innehåller enfärgade kulor: 5 blå och "
                      "15 vita\nKvantitet II: Sannolikheten att slumpmässigt plocka upp "
                      "en röd kula ur en påse som endast innehåller enfärgade kulor: 4 "
                      "röda och 14 vita", "alternatives": STD_KVA},
        22: {"text": "$x^2y^3 > 0$\n$xy < 0$\n\nKvantitet I: $x$\nKvantitet II: $y$",
             "alternatives": STD_KVA},
    },
    # Uteslutna: 10 (två kvadrater+triangel). NOG 26/27 har egna figurer och
    # rörs inte. 12 och 20 har en inritad linje, men ekvationen/punkterna
    # står redan fullt ut i texten så bilden ger ingen extra information.
    "2021vtb-5": {
        1: {"text": "$4(x-2) = -2(x+4)$\n\nVad är $x$?", "alternatives": ["0", "1", "2", "8"]},
        2: {"text": "Talen 13, 14, 26 och $x$ har medelvärdet 16. Vilket värde har $x$?",
            "alternatives": ["11", "13", "16", "17"]},
        3: {"text": "Vad är $\\frac{1}{3}\\left(\\frac{1}{2}+\\frac{1}{6}\\right)$?",
            "alternatives": ["$\\frac{1}{6}$", "$\\frac{2}{6}$", "$\\frac{1}{9}$", "$\\frac{2}{9}$"]},
        4: {"text": "$f(x) = 4x-4$\n$g(x) = -3f(x)-12$\n\nVilket värde har $g(2)$?",
            "alternatives": ["–24", "–18", "–12", "0"]},
        5: {"text": "40 % av $x$ är 54. Vilket värde har $x$?",
            "alternatives": ["90", "125", "135", "216"]},
        6: {"text": "$x$, $y$, $z$ och $w$ är fyra på varandra följande heltal sådana "
                     "att $x<y<z<w$. Vad är $(z+w)-(x+y)$?",
            "alternatives": ["–4", "–2", "2", "4"]},
        7: {"text": "$a \\neq 0$\n\nVilket svarsalternativ motsvarar uttrycket "
                     "$\\frac{a^5 \\cdot a^{-3}}{a^{-8} \\cdot a^2}$?",
            "alternatives": ["$a^{-4}$", "$a^{-2}$", "$a^4$", "$a^8$"]},
        8: {"text": "$\\frac{4}{x} = \\frac{5}{6}$\n\nVad är $x$?",
            "alternatives": ["$\\frac{4 \\cdot 6}{5}$", "$\\frac{4 \\cdot 5}{6}$",
                              "$\\frac{6}{4 \\cdot 5}$", "$\\frac{5}{4 \\cdot 6}$"]},
        9: {"text": "Innermåtten för en cylinderformad marmeladburk är sådana att "
                     "höjden är 5 cm och radien är 2 cm. Vilket är det minsta antalet "
                     "sådana burkar som behövs för att rymma 0,6 liter marmelad?",
            "alternatives": ["5", "10", "15", "20"]},
        11: {"text": "Vad är $\\sqrt{36 \\cdot 10^{36}}$?",
             "alternatives": ["$18 \\cdot 10^{18}$", "$6 \\cdot 10^{18}$",
                               "$18 \\cdot 10^6$", "$6 \\cdot 10^6$"]},
        12: {"text": "Linjen L: $y = \\frac{1}{2}x$ delar koordinatsystemet i en övre "
                      "och en undre halva. Vilket svarsalternativ anger en punkt som "
                      "ligger i den undre halvan?",
             "alternatives": ["(–23, 23)", "(23, 0)", "(–23, 0)", "(0, 23)"]},
        13: {"text": "Kvantitet I: 25 promille av 40 000\nKvantitet II: 1 600",
             "alternatives": STD_KVA},
        14: {"text": "En påse innehåller endast enfärgade kulor: röda och blå. Fyra "
                      "kulor ska slumpmässigt plockas ur påsen, utan återläggning. "
                      "Oavsett vilka fyra kulor som plockas ur påsen, så är minst en av "
                      "de plockade kulorna röd.\nKvantitet I: Antalet kulor i påsen\n"
                      "Kvantitet II: 5", "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: Två gånger arean av en kvadrat med sidan $x$\n"
                      "Kvantitet II: Tre fjärdedelar av arean av en cirkel med radien $x$",
             "alternatives": STD_KVA},
        16: {"text": "$2y-4x=3$\n\nKvantitet I: $y$\nKvantitet II: $1{,}5+2x$",
             "alternatives": STD_KVA},
        17: {"text": "Medelvärdet av två tal är 35. Ett av talen är $x$.\nKvantitet I: "
                      "$x$\nKvantitet II: $70-x$", "alternatives": STD_KVA},
        18: {"text": "Kvantitet I: $\\frac{3}{8} \\cdot \\frac{6}{11}$\nKvantitet II: "
                      "$\\frac{\\frac{3}{8}}{\\frac{11}{6}}$", "alternatives": STD_KVA},
        19: {"text": "$x$ är ett jämnt positivt heltal.\nKvantitet I: $(-7)^x$\n"
                      "Kvantitet II: $(-7)^{x+1}$", "alternatives": STD_KVA},
        20: {"text": "Linjen L går genom origo och punkten $(-3, 3)$. Punkten "
                      "$(x_1, y_1)$ ligger också på linjen L.\nKvantitet I: $x_1+y_1$\n"
                      "Kvantitet II: 0", "alternatives": STD_KVA},
        21: {"text": "Vinklarna i en triangel förhåller sig som 1:5:9.\nKvantitet I: "
                      "Triangelns minsta vinkel\nKvantitet II: 15°", "alternatives": STD_KVA},
        22: {"text": "Kvantitet I: Den positiva lösningen till ekvationen $(x-3)(x+2)=0$\n"
                      "Kvantitet II: Den positiva lösningen till ekvationen $(x+3)(x-2)=0$",
             "alternatives": STD_KVA},
    },
    # Uteslutna: 3 (parallella linjer med vinklar), 7 (linje inritad i
    # koordinatsystem UTAN given ekvation), 15 (fyrhörning ABCE), 21 (punkter
    # (a,b)/(c,d) vars kvadrant bara syns i figuren).
    "2020ht-3": {
        1: {"text": "Vilket värde har $x$ om $5x+66=\\frac{y}{2}$ och $y=12x$?",
            "alternatives": ["6", "33", "66", "$\\frac{132}{7}$"]},
        2: {"text": "6 likadana maskiner kan sammanlagt producera 150 enheter per "
                     "minut. Hur många enheter kan 10 sådana maskiner producera på 4 "
                     "minuter?", "alternatives": ["360", "1 000", "6 000", "36 000"]},
        4: {"text": "$f(x) = 3x+1$\n\nVilket svarsalternativ motsvarar $f\\left(\\frac{1}{3}\\right)$?",
            "alternatives": ["$\\frac{1}{3}$", "$\\frac{2}{3}$", "$\\frac{4}{3}$", "$\\frac{6}{3}$"]},
        5: {"text": "$a \\neq 0$\n\nVilket svarsalternativ motsvarar med säkerhet "
                     "$\\frac{a-b}{a} + \\frac{b}{a}$?",
            "alternatives": ["$\\frac{1}{2}$", "1", "$b$", "$a$"]},
        6: {"text": "En triangel med basen 4 cm har lika stor area som en kvadrat med "
                     "sidan 6 cm. Hur stor är triangelns höjd?",
            "alternatives": ["3 cm", "6 cm", "9 cm", "18 cm"]},
        8: {"text": "Medelvärdet av $x$ och $6x$ är lika med $y$. Vad är $x$?",
            "alternatives": ["$\\frac{7y}{2}$", "$\\frac{2y}{7}$", "$\\frac{xy}{7}$",
                              "$\\frac{6x}{7y}$"]},
        9: {"text": "$x > 0$\n\nHur många procent av $x$ är $\\frac{3x}{30}+\\frac{4x}{40}$?",
            "alternatives": ["7", "10", "20", "24"]},
        10: {"text": "Vad är $(2^4+1)(2^2+1)(2^2-1)$?",
             "alternatives": ["$2^8-1$", "$2^8+1$", "$2^{16}-1$", "$2^{16}+1$"]},
        11: {"text": "$x < 0$\n\nVilket värde har $x$ om $(x-7)^2 = 144$?",
             "alternatives": ["–19", "–12", "–7", "–5"]},
        12: {"text": "Vad är $1^{-1}+1^0+1^1$?", "alternatives": ["0", "1", "2", "3"]},
        13: {"text": "Kvantitet I: $\\frac{3}{7}+\\frac{5}{8}$\nKvantitet II: 1",
             "alternatives": STD_KVA},
        14: {"text": "Tre vanliga sexsidiga tärningar kastas slumpmässigt en gång.\n"
                      "Kvantitet I: Sannolikheten att få tre femmor\nKvantitet II: "
                      "Sannolikheten att summan av det tärningarna visar är 15",
             "alternatives": STD_KVA},
        16: {"text": "$-7(x+3)=21$\n\nKvantitet I: $x$\nKvantitet II: 0", "alternatives": STD_KVA},
        17: {"text": "3 teskedar motsvarar 1 matsked.\n5 kryddmått motsvarar 1 tesked.\n"
                      "Kvantitet I: 8 kryddmått och 1 matsked\nKvantitet II: 2 teskedar "
                      "och 10 kryddmått", "alternatives": STD_KVA},
        18: {"text": "$x < y < z$\nKvantitet I: $\\frac{x+z}{2}$\nKvantitet II: "
                      "$\\frac{x+y+z}{3}$", "alternatives": STD_KVA},
        19: {"text": "Omkretsen av en cirkel är $25\\pi$ cm.\nKvantitet I: Cirkelns "
                      "radie\nKvantitet II: 10 cm", "alternatives": STD_KVA},
        20: {"text": "Kvantitet I: $27^{\\frac{1}{3}}$\nKvantitet II: 9", "alternatives": STD_KVA},
        22: {"text": "$x > 0$\nKvantitet I: $\\frac{x}{2}$\nKvantitet II: $\\left(\\frac{x}{4}\\right)^2$",
             "alternatives": STD_KVA},
    },
    # Uteslutna: 2 (parabel inritad i koordinatsystem). NOG 24/25/27/28 har
    # egna figurer och rörs inte.
    "2020ht-5": {
        1: {"text": "Vilket svarsalternativ motsvarar uttrycket $3(2x+5)+2(7-3x)$?",
            "alternatives": ["29", "$17-x$", "$3x+19$", "$12x+29$"]},
        3: {"text": "Arean av en cirkel är 27 cm². Vilket av svarsalternativen är det "
                     "bästa närmevärdet för längden av cirkelns radie?",
            "alternatives": ["1,5 cm", "3 cm", "6 cm", "9 cm"]},
        4: {"text": "Om $a$ % av $x$ är $y$, hur mycket är $2a$ % av $0{,}5x$?",
            "alternatives": ["$0{,}5y$", "$y$", "$2y$", "$4y$"]},
        5: {"text": "En mätserie består av 5 mätvärden. Vilket av svarsalternativen är "
                     "med säkerhet korrekt?",
            "alternatives": ["Om mätseriens medelvärde är ett heltal, så är alla "
                              "mätvärdena heltal.",
                              "Om mätseriens median är ett heltal, så är alla "
                              "mätvärdena heltal.",
                              "Om alla mätvärdena är heltal, så är mätseriens "
                              "medelvärde ett heltal.",
                              "Om alla mätvärdena är heltal, så är mätseriens median "
                              "ett heltal."]},
        6: {"text": "$a$ och $b$ är positiva tal. Vilket svarsalternativ är lösningen "
                     "till ekvationen $ax+bx=1$?",
            "alternatives": ["$x=1-(a+b)$", "$x=\\frac{1}{ab}$", "$x=a+b$",
                              "$x=\\frac{1}{a+b}$"]},
        7: {"text": "Jaana gör ett halsband med enfärgade pärlor i sju olika färger. "
                     "Hon använder lika många pärlor av varje färg. Vilket "
                     "svarsalternativ är ett möjligt antal pärlor i det färdiga "
                     "halsbandet?", "alternatives": ["241", "245", "247", "249"]},
        8: {"text": "Vilket svarsalternativ är störst?",
            "alternatives": ["$\\frac{10^2 \\cdot 10^{-5}}{10^{-3}}$",
                              "$\\frac{10^{-3} \\cdot 10^{-5}}{10^2}$",
                              "$\\frac{10^2 \\cdot 10^{-3}}{10^{-5}}$",
                              "$\\frac{10^{-5}}{10^2 \\cdot 10^{-3}}$"]},
        9: {"text": "Arean av en kvadrat med sidlängden 10 cm är dubbelt så stor som "
                     "arean av en kvadrat med sidlängden $x$ cm. Vilket värde har $x$?",
            "alternatives": ["$\\sqrt{10}$", "$\\sqrt{20}$", "$\\sqrt{25}$", "$\\sqrt{50}$"]},
        10: {"text": "Vad är $\\frac{7}{20} - \\frac{3}{2} \\cdot \\frac{1}{5}$?",
             "alternatives": ["$-\\frac{23}{100}$", "$\\frac{1}{20}$", "$\\frac{3}{10}$",
                               "$\\frac{4}{10}$"]},
        11: {"text": "$f(x) = \\frac{x}{4} - \\frac{3}{2}$\n\nVilka koordinater har den "
                      "punkt där grafen till $f(x)$ skär $x$-axeln?",
             "alternatives": ["$(0, -\\frac{3}{2})$", "(0, 6)", "$(-\\frac{3}{2}, 0)$", "(6, 0)"]},
        12: {"text": "Vilket svarsalternativ är ett möjligt värde på $a$ om $a^{-2}=16$?",
             "alternatives": ["–4", "$\\frac{1}{256}$", "$\\frac{1}{4}$", "256"]},
        13: {"text": "$x$, $y$ och $z$ är positiva tal.\n$x$ procent av $y$ är lika med "
                      "73.\n$x$ procent av $z$ är lika med 37.\nKvantitet I: $y$\n"
                      "Kvantitet II: $z$", "alternatives": STD_KVA},
        14: {"text": "T är en triangel.\nKvantitet I: Omkretsen av T dividerad med 3\n"
                      "Kvantitet II: Medelvärdet av sidlängderna för T", "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: $\\frac{\\frac{1}{6}}{\\frac{6}{1}}$\nKvantitet II: "
                      "$\\frac{\\frac{6}{1}}{\\frac{1}{6}}$", "alternatives": STD_KVA},
        16: {"text": "Albin är dubbelt så gammal som Edvin och Levi är tillsammans.\n"
                      "Kvantitet I: Albins ålder\nKvantitet II: Tre gånger Edvins ålder",
             "alternatives": STD_KVA},
        17: {"text": "$x > 1$\n$x^{y+1}=1$\n\nKvantitet I: $y$\nKvantitet II: 0",
             "alternatives": STD_KVA},
        18: {"text": "Kvadraterna $K_1$ och $K_2$ överlappar varandra så att 25 procent "
                      "av arean av $K_1$ täcks av $K_2$, medan 20 procent av arean av "
                      "$K_2$ täcks av $K_1$.\nKvantitet I: Arean av $K_1$\nKvantitet II: "
                      "Arean av $K_2$", "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: $3{,}13(\\pi+3{,}15)$\nKvantitet II: $3{,}15(3{,}13+\\pi)$",
             "alternatives": STD_KVA},
        20: {"text": "$x \\neq 0$\n$y \\neq 0$\n$x+y=0$\n\nKvantitet I: $x^2+y^2$\n"
                      "Kvantitet II: $x^2+y^2+2xy$", "alternatives": STD_KVA},
        21: {"text": "Grafen till funktionen $f$ är en rät linje genom origo.\n$a > 0$\n\n"
                      "Kvantitet I: $f(a)$\nKvantitet II: $f(-a)$", "alternatives": STD_KVA},
        22: {"text": "En mätserie består av värdena $-5$, $x$, $y$, 3. Seriens "
                      "medelvärde är $-1$.\nKvantitet I: $x+y$\nKvantitet II: $-1$",
             "alternatives": STD_KVA},
    },
    # Uteslutna: 3 (femhörning vars hörn bara syns i figuren), 6 (triangel
    # med vinklar), 8 (fyra grafer SOM svarsalternativ). NOG 24-28 har egna
    # figurer och rörs inte.
    "2019ht-1": {
        1: {"text": "Vilket av svarsalternativen motsvarar $5{,}3 \\cdot 10^3 - "
                     "4{,}7 \\cdot 10^2$?",
            "alternatives": ["$4{,}83 \\cdot 10^3$", "$6{,}0 \\cdot 10^2$",
                              "$4{,}83 \\cdot 10^2$", "$6{,}0 \\cdot 10^1$"]},
        2: {"text": "40 % av $x$ är ett heltal. Vilket av svarsalternativen är ett "
                     "möjligt värde på $x$?", "alternatives": ["3", "4", "5", "6"]},
        4: {"text": "Vilket svarsalternativ är jämnt delbart med 5?",
            "alternatives": ["$157+158$", "$3^5$", "$\\frac{185}{5}$", "$5^0+5^1+5^2$"]},
        5: {"text": "Vilket värde har $x$ om $5(x-1) = 2(x+2)$?",
            "alternatives": ["$-\\frac{1}{7}$", "$\\frac{1}{7}$", "1", "3"]},
        7: {"text": "För de positiva talen $A$, $b$ och $h$ gäller sambandet "
                     "$A=\\frac{bh}{2}$. Vad är $h$?",
            "alternatives": ["$h=2Ab$", "$h=\\frac{2A}{b}$", "$h=\\frac{Ab}{2}$",
                              "$h=\\frac{b}{2A}$"]},
        9: {"text": "Cirkeln A har radien 3 cm, och dess area är $\\frac{1}{4}$ av "
                     "arean av cirkeln B. Hur stor radie har cirkeln B?",
            "alternatives": ["4 cm", "6 cm", "9 cm", "12 cm"]},
        10: {"text": "Alma har skrivit 93 olika heltal på ett papper. 60 av dessa "
                      "heltal är udda. Alma stryker slumpmässigt tal på pappret. Hur "
                      "många tal måste hon stryka för att vara säker på att ha strukit "
                      "minst hälften av de jämna talen?", "alternatives": ["17", "47", "63", "77"]},
        11: {"text": "$x$ och $y$ är positiva tal. Vilket svarsalternativ motsvarar "
                      "$\\sqrt{32xy^2}$?",
             "alternatives": ["$2y\\sqrt{8xy}$", "$4y\\sqrt{2x}$", "$6y\\sqrt{x}$", "$8y\\sqrt{x}$"]},
        12: {"text": "Medelvärdet av $x$, $y$ och $z$ är 15. Medelvärdet av $y$, $z$ "
                      "och 14 är 17. Vilket värde har $x$?",
             "alternatives": ["6", "8", "10", "12"]},
        13: {"text": "Kvantitet I: $5{,}7 \\cdot 10^0$\nKvantitet II: 5,7", "alternatives": STD_KVA},
        14: {"text": "Kvantitet I: $\\frac{1}{2}+\\frac{1}{3}+\\frac{1}{4}$\nKvantitet II: "
                      "$1+\\frac{1}{13}$", "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: Den största vinkeln i en triangel med sidlängderna "
                      "3 cm, 4 cm och 5 cm\nKvantitet II: Den största vinkeln i en "
                      "triangel med sidlängderna 5 cm, 5 cm och 5 cm", "alternatives": STD_KVA},
        16: {"text": "Kvantitet I: $4(a+1)-4(a-1)$\nKvantitet II: $4(a-1)+4(1-a)$",
             "alternatives": STD_KVA},
        17: {"text": "Kvantitet I: Volymen av en cirkulär kon där basytans radie är 3 "
                      "cm och höjden är 4 cm\nKvantitet II: Volymen av en cirkulär kon "
                      "där basytans radie är 4 cm och höjden är 3 cm", "alternatives": STD_KVA},
        18: {"text": "$x$ är ett heltal sådant att $1 \\leq x \\leq 100\\,000$.\n"
                      "Kvantitet I: Sannolikheten att $4^x$ är ett jämnt tal\n"
                      "Kvantitet II: 0,5", "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: $\\sqrt{27}+\\sqrt{23}$\nKvantitet II: $\\sqrt{50}$",
             "alternatives": STD_KVA},
        20: {"text": "Linjen A går genom punkterna (1, 1) och (5, 3). Linjen B är "
                      "vinkelrät mot linjen A.\nKvantitet I: $y$-koordinaten för den "
                      "punkt på linjen A där $x=0$\nKvantitet II: $y$-koordinaten för "
                      "den punkt på linjen B där $x=0$", "alternatives": STD_KVA},
        21: {"text": "$x$ är 75 % av $y$.\nKvantitet I: $\\frac{y}{2}$\nKvantitet II: "
                      "$\\frac{2x}{3}$", "alternatives": STD_KVA},
        22: {"text": "2 pennor, 1 linjal och 5 suddgummin kostar lika mycket som 10 "
                      "suddgummin. 4 pennor och 2 linjaler kostar lika mycket som 10 "
                      "suddgummin.\nKvantitet I: Kostnaden för 2 pennor\nKvantitet II: "
                      "Kostnaden för 1 linjal", "alternatives": STD_KVA},
    },
    # Uteslutna: 2 (linje inritad i koordinatsystem UTAN given ekvation),
    # 15 (triangel ABC vars existens bara syns i figuren). NOG 28 har egen
    # figur och rörs inte.
    "2019ht-4": {
        1: {"text": "Vilket svarsalternativ motsvarar 8 500 000 mm?",
            "alternatives": ["$8{,}5 \\cdot 10^3$ cm", "$8{,}5 \\cdot 10^5$ dm", "8,5 km", "8,5 mil"]},
        3: {"text": "$x$ och $y$ är positiva tal sådana att $\\frac{x}{y}=z$. Vilket av "
                     "följande svarsalternativ är med säkerhet korrekt?",
            "alternatives": ["Om $x$ är mindre än $y$ så är $z$ mindre än 0.",
                              "Om $x$ är lika med $y$ så är $z$ lika med $x$.",
                              "Om $x$ inte är lika med $y$ så är $z$ mindre än 1.",
                              "Om $x$ är större än $y$ så är $z$ större än 1."]},
        4: {"text": "Emils och Stures sammanlagda ålder är 31 år. Sture är 3 år äldre "
                     "än Emil. Om Emil är $x$ år gammal, vilket svarsalternativ "
                     "motsvarar då en ekvation för att räkna ut hans ålder?",
            "alternatives": ["$\\frac{31-x}{2}=3$", "$2x=31$", "$x+x+3=31$", "$x+3=31$"]},
        5: {"text": "Vilket värde har $x$ om $7^{(7+\\frac{x}{3})}=49$?",
            "alternatives": ["–15", "–7", "7", "15"]},
        6: {"text": "I en klass är 65 % av eleverna längre än Ida, och 32 % av "
                     "eleverna är längre än Albert. Ungefär hur stor andel av eleverna "
                     "är längre än Ida men kortare än Albert?",
            "alternatives": ["$\\frac{1}{4}$", "$\\frac{1}{3}$", "$\\frac{1}{2}$", "$\\frac{2}{3}$"]},
        7: {"text": "På en parkeringsplats finns det fyra bilar med fyra hjul vardera "
                     "och två motorcyklar med två hjul vardera. Hur stor är "
                     "sannolikheten att ett slumpmässigt valt hjul på parkeringsplatsen "
                     "tillhör en motorcykel?",
            "alternatives": ["$\\frac{1}{5}$", "$\\frac{1}{4}$", "$\\frac{1}{3}$", "$\\frac{1}{2}$"]},
        8: {"text": "Vilket svarsalternativ motsvarar en punkt på linjen $y=3x-5$?",
            "alternatives": ["(–2, –10)", "(0, 3)", "(3, 5)", "(5, 10)"]},
        9: {"text": "Förhållandet mellan den långa och den korta sidan på ett "
                     "A4-papper är $\\sqrt{2}:1$. Vilket är förhållandet mellan den "
                     "långa sidan och diagonalen på ett A4-papper?",
            "alternatives": ["$1:\\sqrt{3}$", "$2:3$", "$\\sqrt{2}:2$", "$\\sqrt{2}:\\sqrt{3}$"]},
        10: {"text": "$10^3 \\square 100 = x$\n$x \\square 10^{-1} = y$\n"
                      "$y \\square 0{,}0001 = z$\n\nVad är det största värde som $z$ "
                      "kan få om rutorna i ekvationerna var för sig ersätts med "
                      "antingen multiplikation eller division?",
             "alternatives": ["$10^0$", "$10^5$", "$10^{10}$", "$10^{15}$"]},
        11: {"text": "Vad är $\\frac{\\frac{1}{2}+3}{4+\\frac{1}{5}}$?",
             "alternatives": ["$\\frac{3}{5}$", "$\\frac{2}{3}$", "$\\frac{4}{5}$", "$\\frac{5}{6}$"]},
        12: {"text": "Omkretsen av en rektangel är 360 m, och längden av en av "
                      "sidorna är $x$ m. Hur stor är arean av rektangeln?",
             "alternatives": ["$x^2$ m²", "$90x$ m²", "$(90x+x^2)$ m²", "$(180x-x^2)$ m²"]},
        13: {"text": "$\\frac{4}{x}-\\frac{1}{2}=2$\n\nKvantitet I: $x$\nKvantitet II: 1",
             "alternatives": STD_KVA},
        14: {"text": "En varas ordinarie pris är 500 kr.\nKupong A ger 100 kr rabatt.\n"
                      "Kupong B ger 20 % rabatt.\nKvantitet I: Den totala rabatten om "
                      "kupong A används först och därefter, på det rabatterade priset, "
                      "kupong B\nKvantitet II: Den totala rabatten om kupong B används "
                      "först och därefter, på det rabatterade priset, kupong A",
             "alternatives": STD_KVA},
        16: {"text": "$x < -1$\n\nKvantitet I: $1-x$\nKvantitet II: $x-1$", "alternatives": STD_KVA},
        17: {"text": "$x > 0$\n$\\sqrt{x} = x$\n\nKvantitet I: $x$\nKvantitet II: 1",
             "alternatives": STD_KVA},
        18: {"text": "$f(x) = -3x+5$\n\nKvantitet I: $\\frac{f(1)}{f(-1)}$\n"
                      "Kvantitet II: $\\frac{f(-1)}{f(1)}$", "alternatives": STD_KVA},
        19: {"text": "Kvantitet I: $3^3+3^3+3^3$\nKvantitet II: $3^4$", "alternatives": STD_KVA},
        20: {"text": "Kalle cyklar med hastigheten 22 km/h.\nBosse cyklar med "
                      "hastigheten 18 km/h.\nKvantitet I: Den tid det tar för Kalle att "
                      "cykla 60 km\nKvantitet II: Den tid det tar för Bosse att cykla "
                      "54 km", "alternatives": STD_KVA},
        21: {"text": "Kvantitet I: Omkretsen av en regelbunden åttahörning med "
                      "sidlängden $x$ cm\nKvantitet II: Omkretsen av en rätvinklig "
                      "triangel där den längsta sidan är $5x$ cm", "alternatives": STD_KVA},
        22: {"text": "$x$, $y$ och $z$ är tre tal sådana att $x<y<z$.\nMedianen av $x$ "
                      "och $y$ är 2.\nMedianen av $y$ och $z$ är 9.\nKvantitet I: $y$\n"
                      "Kvantitet II: 6", "alternatives": STD_KVA},
    },
    # Uteslutna: 4 (fyrhörning ABCD+triangel AFD), 8 (triangel med vinklar),
    # 11 (fyra grafer SOM svarsalternativ), 18 (triangel med skuggad yta).
    # NOG 28 har egen figur och rörs inte.
    "2019vt-2": {
        1: {"text": "$x$ och $y$ är udda tal. Vilket svarsalternativ är ett udda tal?",
            "alternatives": ["$xy$", "$2x+y+1$", "$x+y$", "$2xy+2$"]},
        2: {"text": "Johanna löste ekvationen $5(x-12)=3(x+5)+5$ felaktigt. Hon "
                     "genomförde uträkningen i följande steg:\n\n"
                     "$5(x-12)=3(x+5)+5$\n\n"
                     "Steg 1 → $5(x-12)=3x+20$\n\n"
                     "Steg 2 → $5x-60=3x+20$\n\n"
                     "Steg 3 → $2x=40$\n\n"
                     "Steg 4 → $x=20$\n\n"
                     "I vilket steg uppstod felet?",
            "alternatives": ["Steg 1", "Steg 2", "Steg 3", "Steg 4"]},
        3: {"text": "Vilket svarsalternativ motsvarar 15 procent av 70?",
            "alternatives": ["$\\frac{70}{15 \\cdot 100}$", "$\\frac{70 \\cdot 100}{15}$",
                              "$\\frac{15 \\cdot 100}{70}$", "$\\frac{15 \\cdot 70}{100}$"]},
        5: {"text": "Vad är $3-\\frac{2}{x}$ om $x=\\frac{1}{4}$?",
            "alternatives": ["–5", "2,5", "3,5", "11"]},
        6: {"text": "$f(x) = \\frac{3}{2}x+m$\n$f\\left(\\frac{2}{3}\\right)=0$\n\n"
                     "Vad är $m$?", "alternatives": ["–1", "0", "1", "2"]},
        7: {"text": "Claras och Alicias sammanlagda längd är 3,20 m. Alicias och "
                     "Bedas sammanlagda längd är 3,30 m. Den sammanlagda längden för "
                     "alla tre är 4,80 m. Hur lång är Alicia?",
            "alternatives": ["1,60 m", "1,65 m", "1,70 m", "1,75 m"]},
        9: {"text": "För $x$, $y$ och $z$ gäller sambandet $3x-4y+2z=14$. Vilket av "
                     "svarsalternativen motsvarar detta samband?",
            "alternatives": ["$x=\\frac{14}{3}+4y-2z$", "$x=-\\frac{14}{3}-4y+2z$",
                              "$x=\\frac{1}{3}(14+4y-2z)$", "$x=-\\frac{1}{3}(14-4y+2z)$"]},
        10: {"text": "$x$ och $y$ är heltal sådana att $\\frac{1}{2}+\\frac{1}{3}=\\frac{x}{y}$. "
                      "Vad är ett möjligt värde för $xy$?",
             "alternatives": ["10", "12", "18", "30"]},
        12: {"text": "Vilket av svarsalternativen är lika med $2^4 \\cdot 3^4$?",
             "alternatives": ["$6^4$", "$6^8$", "$6^{12}$", "$6^{16}$"]},
        13: {"text": "Peter använder 50 % av sin månadspeng till att köpa godis. "
                      "Stefan använder 30 % av sin månadspeng till att köpa godis. Den "
                      "ena av dem köper godis för 35 kr mer än den andra.\nKvantitet I: "
                      "Summan som Peter köper godis för\nKvantitet II: Summan som "
                      "Stefan köper godis för", "alternatives": STD_KVA},
        14: {"text": "$a$ är ett positivt heltal.\n$b$ är ett heltal.\nKvantitet I: $a$\n"
                      "Kvantitet II: $ab$", "alternatives": STD_KVA},
        15: {"text": "$f(x) = x^2-2x-3$\n\nKvantitet I: $f(0)$\nKvantitet II: $f(2)$",
             "alternatives": STD_KVA},
        16: {"text": "För en viss parallellogram gäller att vinkeln i ett av hörnen är "
                      "57°.\nKvantitet I: Vinkeln i ett av de andra hörnen i "
                      "parallellogrammen\nKvantitet II: 124°", "alternatives": STD_KVA},
        17: {"text": "Kvantitet I: $99 \\cdot 101$\nKvantitet II: $98 \\cdot 102$",
             "alternatives": STD_KVA},
        19: {"text": "Medelvärdet av åtta på varandra följande heltal är 16,5.\n"
                      "Kvantitet I: Hälften av det största av de åtta heltalen\n"
                      "Kvantitet II: Det minsta av de åtta heltalen", "alternatives": STD_KVA},
        20: {"text": "$a > 0$\n$b > 0$\nKvantitet I: $(a+b)(a^2+b^2)$\nKvantitet II: "
                      "$a^3+ab(a+b)+b^3$", "alternatives": STD_KVA},
        21: {"text": "$x > 0$\n$x^2=\\frac{1}{4}$\n\nKvantitet I: $\\left(\\frac{1}{4}\\right)^2$\n"
                      "Kvantitet II: $x$", "alternatives": STD_KVA},
        22: {"text": "$s$ är summan av alla heltal $x$ sådana att $0<x<6$.\n$p$ är "
                      "produkten av alla primtal $y$ sådana att $2<y<7$.\nKvantitet I: "
                      "$s$\nKvantitet II: $p$", "alternatives": STD_KVA},
    },
    # Uteslutna: 3 (linje inritad i koordinatsystem UTAN given ekvation),
    # 7 (parallella linjer med vinklar), 9 (cirkel inskriven i triangel),
    # 16 (triangel med vinklar), 19 (rektangel med halvcirklar).
    # NOG 28 har egen figur och rörs inte.
    "2019vt-5": {
        1: {"text": "Vilket värde har $x$ om $\\frac{4x}{9}+\\frac{2}{3}=\\frac{8}{9}$?",
            "alternatives": ["$\\frac{1}{3}$", "$\\frac{1}{2}$", "$\\frac{2}{3}$", "1"]},
        2: {"text": "I en påse finns det 1 röd, 2 gröna, 3 blå, 4 vita och 5 svarta "
                     "kulor. Om man drar en kula slumpmässigt, vad är då "
                     "sannolikheten att den är antingen röd eller vit?",
            "alternatives": ["$\\frac{1}{15}$", "$\\frac{1}{5}$", "$\\frac{4}{15}$", "$\\frac{1}{3}$"]},
        4: {"text": "Vilket av svarsalternativen motsvarar uttrycket $(2a-3b)(3a+2b)$?",
            "alternatives": ["$5a^2-2ab-5b^2$", "$6a^2-18ab+6b^2$", "$6a^2-5ab-6b^2$",
                              "$6a^2-6b^2$"]},
        5: {"text": "$\\frac{1}{3}-\\frac{2}{9}+\\frac{5}{27}-\\frac{7}{81}$\n\nVilket "
                     "värde har uttrycket?",
            "alternatives": ["$\\frac{1}{3}$", "$\\frac{17}{81}$", "$\\frac{1}{20}$", "$-\\frac{3}{81}$"]},
        6: {"text": "En cirkel är placerad i ett koordinatsystem. AB är cirkelns "
                     "diameter. Cirkelns medelpunkt har koordinaterna (–2, 1) och A "
                     "har koordinaterna (–4, –2). Vad är koordinaterna för B?",
            "alternatives": ["(4, 0)", "(0, 4)", "(4, 2)", "(2, 4)"]},
        8: {"text": "$3x^2+8x+7 = x(2x+6)+x^2+12$\n\nVad är $x$?",
            "alternatives": ["1,5", "2", "2,5", "3"]},
        10: {"text": "$x$ och $y$ är positiva tvåsiffriga heltal med samma siffror, "
                      "men de två talen har siffrorna i omvänd ordning. Vilket tal är "
                      "$x+y$ med säkerhet jämnt delbart med?",
             "alternatives": ["2", "3", "5", "11"]},
        11: {"text": "Vilket av svarsalternativen är inte ett möjligt värde på $x$ om "
                      "$x^3+x^2-2x=0$?", "alternatives": ["0", "1", "–1", "–2"]},
        12: {"text": "Vad är $\\frac{(\\sqrt{3})^{(\\sqrt{3}) \\cdot (\\sqrt{3})}}{\\sqrt{3}}$?",
             "alternatives": ["$\\frac{1}{\\sqrt{3}}$", "1", "$\\sqrt{3}$", "3"]},
        13: {"text": "$-6(5-x)=-30$\n\nKvantitet I: $x$\nKvantitet II: 0", "alternatives": STD_KVA},
        14: {"text": "Kvantitet I: $\\sqrt{14}+\\sqrt{36}$\nKvantitet II: 10",
             "alternatives": STD_KVA},
        15: {"text": "Kvantitet I: Avståndet mellan punkterna (1, 2) och (2, 4)\n"
                      "Kvantitet II: Avståndet mellan punkterna (1, 2) och (2, –4)",
             "alternatives": STD_KVA},
        17: {"text": "Mätserie $x$: 15, 13, 20\nMätserie $y$: 30, 15, 11, 13\n"
                      "Kvantitet I: Medianen i mätserie $x$\nKvantitet II: Medianen i "
                      "mätserie $y$", "alternatives": STD_KVA},
        18: {"text": "$x = 4^n$, där $n$ är ett positivt heltal.\nKvantitet I: "
                      "Entalssiffran i talet $x$\nKvantitet II: 4", "alternatives": STD_KVA},
        20: {"text": "$x > y$\n$y < 0$\n\nKvantitet I: $x^2$\nKvantitet II: $y^2$",
             "alternatives": STD_KVA},
        21: {"text": "Det tar 30 minuter för 14 likadana pumpar att tillsammans fylla "
                      "en tank med 7 m³ vatten.\nKvantitet I: Den tid det tar för 42 "
                      "likadana pumpar att tillsammans fylla en tank med 63 m³ vatten\n"
                      "Kvantitet II: 1,5 timmar", "alternatives": STD_KVA},
        22: {"text": "$x > 0$\nKvantitet I: $\\sqrt{x}+\\sqrt{x}$\nKvantitet II: $\\sqrt{2x}$",
             "alternatives": STD_KVA},
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
