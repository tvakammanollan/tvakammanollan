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
