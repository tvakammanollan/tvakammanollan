# MEK-generatorn: regelverk och byggplan för 2 000 uppgifter

## Context

Tvåkommanollan har 600 riktiga MEK-uppgifter (arkivet) och 398 skrapade rader i
`questions`. Det räcker inte för duellerna (3 MEK per verbal match) eller för
träning utan upprepning. Målet är **2 000 egna MEK-uppgifter** som går att skilja
från UHR:s bara på etiketten. Kostnaden för fel är hög: en uppgift med två rätta
svar, ett påhittat ord eller en faktamiss blir en förlorad match för en riktig
användare och ett skäl att sluta lita på sajten. Därför låses reglerna **innan**
något genereras. Allt nedan bygger på (1) en mätning av alla 600 arkivuppgifter
och (2) UHR:s/Umeå universitets egna dokument.

Beslut från Niklas (2026-10-19):
- **Uppgifterna märks** som Tvåkommanollans egna, både i DB och i UI.
- **Texterna citeras helst ur riktiga källor** (kortare stycken med källa); där
  licensen inte tillåter det skrivs egen prosa ur källans fakta.

---

## Del A. Vad arkivet visar (uppmätt 2026-10-19, alla 600 uppgifter)

Underlag: `src/data/prov/*.json`, `delprov == "MEK"`. 30 provtillfällen
VT2012–VT2026, 60 verbala pass, 10 MEK per pass (uppgift 21–30). MEK infördes
HT2011; det enda tillfälle som saknas är HT2011 (inget facit finns).

### A1. Luckfördelningen (det användaren frågade om specifikt)
| | Antal | Andel | Medel ord | Median ord |
|---|---|---|---|---|
| 1 lucka | 240 | 40 % | 28,0 | 28 |
| 2 luckor | 240 | 40 % | 36,8 | 37 |
| 3 luckor | 120 | 20 % | 46,2 | 45 |

- **56 av 60 pass har exakt 4 + 4 + 2.** De fyra avvikarna är 5+3+2 eller 3+5+2;
  antalet treluckor är **alltid 2**. Analysen är alltså inte en uppskattning, den
  är en regel som UHR följer.
- Treluckorna sitter nästan alltid på **uppgift 23 och 28** (91 av 120).
- För banken gäller därför **800 / 800 / 400**, och varje batch om 100 ska hålla
  40/40/20 (±2).

### A2. Format
- Alltid **4 alternativ** (A–D), facit jämnt fördelat: A 26,0 %, B 24,7 %,
  C 24,5 %, D 24,8 %. Jämnt även per luckantal.
- Flerluckor: orden står i luckornas ordning, avskilda med ` – ` (mellanslag,
  kort tankstreck, mellanslag). Alla 1 440 avskiljare följer det.
- **Varje lucka har 4 olika värden i 1 080 av 1 080 luckor.** Inget alternativ
  delar ett luckord med ett annat. I flerluckor varierar alltid **alla** luckor.
- 87–90 % av luckorna är ett ord; ~10 % är 2–3 ord (fasta uttryck:
  `i kölvattnet av`, `i schack`, `brist på`, `redogörs för`, `sanning med
  modifikation`), max 5 ord.
- Text: 12–77 ord (median 33). Meningar: 1 st 38 %, 2 st 42 %, 3 st 15 %, 4+ 5 %.
- Luckans plats i texten lutar mot slutet (kvintiler: 141 / 214 / 197 / 257 /
  271). Bara 3 av 600 texter börjar med en lucka; 60 slutar med en.
- Facit är det längsta alternativet i 34 % av fallen (slump: 25 %). Det är UHR:s
  egen svaga skevhet; vi får **inte** göra den starkare.

### A3. Innehåll och ledtrådar
- ~27 % har ett egennamn mitt i texten, ~14 % ett årtal/tal, ~6,5 % ett citat
  (”…”). Det skvallrar om autentiska källtexter: nyheter, debatt, recensioner,
  populärvetenskap, avhandlingar, myndighetstexter.
- Explicita sambandsord (antal texter): `men` 88, `utan` 32, `eftersom` 23,
  `därför` 21, `både` 16, `alltså` 15, `det vill säga` 15, `trots` 14, `inte bara`
  11, `snarare` 11, `i stället` 10. Resten bär ledtråden i semantik och
  kollokation (`smittkoppsepidemier som grasserade`).
- 20 % av facitorden finns i vår ORD-bank (221 / 1 080), mot 14 % av
  distraktorerna. MEK-nyckeln är oftast ett **allmänt akademiskt ord**, inte ett
  sällsynt ORD-ord.
- Ämnena spänner över medicin, natur/miljö, samhälle/juridik, kultur/litteratur,
  språk/skola, ekonomi, historia, teknik, psykologi och filosofi. Min
  nyckelordsräkning är för grov för att ge kvoter, därför är en riktig
  annotering steg 0 nedan.

### A4. Distraktortyper (genomläsning av ~45 uppgifter)
1. **Formlockare**: samma prefix eller morfologi som nyckeln.
   `utlämnande / utförande / utlåtande / utnämnande`, `anvisa / anpassa /
   anordna / anknyta`, `oaktade / oskäliga / omistliga / oklanderliga`.
2. **Samma semantiska fält, fel referent**: `pipett / sutur / lansett / kateter`,
   `datortomograf / kroppsskanning / gastroskopi / EKG-undersökning`.
3. **Närsynonym med fel kollokation eller nyans**: `chockerade / frapperade /
   grasserade / frotterade` (bara epidemier *grasserar*).
4. **Fel polaritet**: `accepterades / ignorerades`, `anonymiteten /
   kontinuiteten`.
5. **Fint men irrelevant ord**: `kalamitet`, `sublimitet` (lockar den som väljer
   det svåraste ordet).
6. **Delpassning i flerluckor**: ett alternativ där en lucka passar perfekt och en
   annan inte (UHR:s eget exempel: `accepterades – kreativitet`).

Alla alternativ är **grammatiskt möjliga** på luckans plats: rätt genus efter
`en/ett`, samma numerus, tempus, bestämdhet och samma preposition. Grammatiken
avslöjar aldrig facit.

### A5. Kända skräpfel i arkivtexten
Ligaturfel från PDF-extraktionen (`forsk ning`, `fl ickor`, `arbets platsens`,
`defi nition`) i minst 6 uppgifter, och luckor skrivna som `____` (äldre) eller
`_____` (nyare). Normaliseras innan arkivet används som exempel, annars lär sig
generatorn felen.

## Del B. UHR:s ramar (primärkällor)

- **Officiell instruktion** (studera.nu, anvisningar verbal del): *"Uppgifterna i
  delprovet MEK består av korta textstycken där ett eller flera ord ersatts av en
  lucka markerad med ____. En uppgift kan innehålla en, två eller tre luckor.
  Efter varje textstycke följer fyra svarsförslag. Välj det svarsförslag som
  innehållsligt och språkligt passar bäst in i textstycket som helhet."*
  Rekommenderad tid 8 min per 10 uppgifter (~48 s/uppgift).
- **Vad det mäter** (Umeå universitet, BVM nr 72): *"förståelse av ord och
  begrepp i kontext"*. Infördes HT2011 i stället för 20 ORD-uppgifter, eftersom
  isolerad ordkunskap missgynnar dem som inte har svenska som modersmål och MEK är
  ett mer autentiskt format än analogier (Stage & Ögren, *Ett nytt högskoleprov*).
- **Svårighetsnivå**: medel 10,5–11,7 av 20 (p ≈ 0,55), s ≈ 4,3 åren 2021–22.
  Försöksproven inför 2011 gav p ≈ 0,60–0,64. Starkt samband med ålder (=
  ordförråd), små könsskillnader.
- **Varje uppgift utprövas** i försöksprov innan den används skarpt. Vi kan inte
  göra det i förväg, så vi gör det efteråt med egen speldata (Del F, steg 9).

## Del C. Regelverket

Reglerna gäller varje uppgift. **MÅSTE** är hårda (avvisas automatiskt),
**BÖR** är mål på banknivå.

### C1. Format
1. MÅSTE: 4 alternativ, exakt ett rätt.
2. MÅSTE: luckor skrivs `_____` (5 understreck), med mellanslag före skiljetecken
   som i nyare prov (`ett _____ , av`) eller utan; välj en form och håll den.
3. MÅSTE: flerluckealternativ skrivs `ord1 – ord2 – ord3`, luckornas ordning.
4. MÅSTE: varje lucka har 4 olika värden; i flerluckor varierar alla luckor.
5. MÅSTE: 1 lucka 12–55 ord, 2 luckor 20–65, 3 luckor 28–77. BÖR: medianer nära
   28 / 37 / 45.
6. MÅSTE: 1–5 meningar. BÖR: 1–2 meningar i ~80 %.
7. BÖR: banken 40/40/20; facit A/B/C/D 25 % ±2 per 100; aldrig samma facit 4 i
   rad i en batch.
8. BÖR: facit längst i högst 35 % (mät per luckantal mot arkivet).

### C2. Texten
1. MÅSTE: sakprosa i HP-register: nyhet, debatt, recension, populärvetenskap,
   akademisk text, myndighetstext, kulturhistoria. Ingen skönlitteratur, ingen
   dialog, inget tilltal till läsaren utöver det arkivet har.
2. MÅSTE: texten är sann. Varje faktapåstående finns i källan.
3. MÅSTE: tidlös. Inget "i år", "nyligen", "just nu"; årtal skrivs ut.
4. MÅSTE: uppgiften går att lösa ur **texten och språket**, inte ur
   förkunskaper i ämnet.
5. MÅSTE: neutralt ämnesval. Kontroversiella ämnen är tillåtna (arkivet har
   brott, sexualitet, politik) men texten tar inte partipolitisk ställning och
   stereotypiserar inga grupper.
6. MÅSTE: korrekt svenska enligt Språkrådet: ”citattecken”, kort tankstreck,
   inga engelska em-streck. Sajtens regel om tankstreck gäller förklaringarna
   (som besökare läser som sajtens egen text), inte provtexten som imiterar HP.
7. BÖR: ämnesmix enligt steg 0-annoteringen, inget ämne över 15 % av banken.

### C3. Var ett ord lyfts ut
1. MÅSTE: luckan är ett **innehållsord** (substantiv, verb, adjektiv, adverb)
   eller ett **fast uttryck** (partikelverb, prepositionsfras, idiom, latinsk
   fras). Aldrig ensam preposition, konjunktion, pronomen, artikel, egennamn eller
   siffra.
2. MÅSTE: kontexten **avgör** ordet. Minst en av: definition/apposition (`det vill
   säga ensamlevande`), kontrast (`men`, `utan`, `snarare`), orsak/följd
   (`eftersom`, `därför`), uppräkning/parallellism, kollokation (`epidemier som
   grasserade`), stilregister. Ledtrådstypen sparas per lucka.
3. MÅSTE: texten innehåller inte nyckeln eller en avledning av den någon
   annanstans (nyckel `periodicitet` + `periodiskt` i texten = läcka).
4. MÅSTE: i flerluckor står luckorna minst 3 ord isär och gärna i olika satser.
5. BÖR: luckan i textens senare halva (som arkivet); aldrig först i texten mer än
   undantagsvis.
6. BÖR: nyckelns ordklass och svårighet enligt steg 0-fördelningen. Nyckeln är
   ett ord en stark läsare känner till; svårigheten ligger i att skilja det från
   distraktorerna, inte i att ordet är obskyrt.
7. MÅSTE: samma nyckellemma högst 2 gånger i hela banken, samma distraktorlemma
   högst 4.

### C4. Distraktorerna
1. MÅSTE: samma ordklass, böjning, genus, numerus och valens som nyckeln. Alla
   fyra ska vara grammatiskt möjliga på luckans plats.
2. MÅSTE: ingen distraktor är rätt eller "nästan lika rätt" i sammanhanget. Testet:
   skulle en språkvårdare godta texten med distraktorn? Svaret ska vara nej, med
   ett skäl som går att formulera.
3. MÅSTE: varje ord finns i SAOL/svenska.se i angiven form (inga påhittade ord,
   inga felböjningar). Anglicismer bara om de står i SAOL (arkivet har `backlash`).
4. MÅSTE: minst två olika distraktortyper ur A4 per uppgift.
5. BÖR: banken fördelar typerna ungefär som arkivet (mäts i steg 0).
6. MÅSTE: inget alternativ pekas ut av form ensam: inte det enda latinska, inte det
   enda långa sammansatta, inte det enda med annat register (om inte registret är
   själva ledtråden i texten).

### C5. Flerluckor (2–3)
1. MÅSTE: varje distraktor faller på **minst en** lucka, med ett skäl.
2. MÅSTE: minst hälften av distraktorerna har **minst en lucka som passar** (delpassning,
   A4 typ 6), annars är det tre enluckor i rad.
3. MÅSTE: distraktorerna får inte alla falla på samma lucka; då är de andra
   luckorna dekor och uppgiften en enlucka. (Hypotes ur arkivet, verifieras i
   steg 0.)
4. MÅSTE: luckorna hänger ihop semantiskt (treluckan om tango: `Silhuetten –
   pose – klichéer`), de är inte tre oberoende ordfrågor i samma stycke.

### C6. Svårighet
- `difficulty` 1/2/3 (kolumnen finns, `train.functions.ts` filtrerar på den).
  Startvärde ur blindlösningen (steg 5): andel modellkörningar som löser utan
  tvekan + nyckelns frekvensband. Mål för banken: 30 / 45 / 25.
- Kalibreras om mot riktig speldata (steg 9). Mål: p 0,35–0,80 per uppgift,
  bankmedel ≈ 0,55 som UHR.

### C7. Källor och licens (Niklas beslut: citat i första hand)
Varje uppgift sparar `source_url`, titel, utgivare, datum, licensnivå och om
texten är citerad eller omskriven.

| Nivå | Källor | Får vi | Krav |
|---|---|---|---|
| **A, fri** | Riksdagstryck, SOU, propositioner, lagar, myndighetsbeslut och yttranden (URL 9 §), CC0 | Citera ordagrant, korta och redigera | Källa anges |
| **B, CC BY** | Open access-artiklar och avhandlingar med CC BY (DiVA, tidskrifter), myndigheter som publicerar under CC BY | Citera och bearbeta | Upphovsperson + licens + länk syns i UI |
| **C, CC BY-SA** | Svenska Wikipedia | Citera och bearbeta | Som B, **och** uppgiftstexten blir själv CC BY-SA |
| **D, upphovsrättsskyddad** | Tidningar, populärvetenskapliga magasin, böcker, NE | **Bara fakta**, egen prosa | Ingen följd av 6+ ord gemensam med källan |

- Citaträtten (URL 22 §) bär inte att bygga provuppgifter av skyddad text: den
  kräver att citatet tjänar ett eget verk som kommenterar det. UHR stryker själv
  ELF-texterna ur publicerade häften av upphovsrättsskäl. Därför är nivå D aldrig
  citat. **Låt en jurist bekräfta tabellen innan batch 1 publiceras**; det är den
  enda punkten i planen jag inte kan verifiera själv.
- Licens- och upphovsfält kontrolleras **per dokument**, inte per sajt (en
  myndighet kan ha både fria beslut och skyddade rapporter).
- Registerproblemet: nivå A är byråkratisk prosa medan arkivet är mycket debatt
  och recension. Debatt/recension/kultur kommer därför i praktiken ur nivå D
  (egen prosa) eller B. Kvoten per genre följer steg 0, inte vad som är lättast
  att hämta.
- Ingen uppgift får likna en arkivuppgift: ingen arkivtext som källa, och
  likhetskontroll mot alla 600 (steg 4).

### C8. Förklaringen
Varje uppgift får en `explanation` (kolumnen finns): varför facit passar, med
textens ledtråd utpekad, och en mening per distraktor om varför den faller. Den
skrivs i sajtens stil (inga tankstreck mitt i meningen, se CLAUDE.md). Förklaringen
är också en kontroll: går distraktorns fel inte att formulera är distraktorn inte
fel nog (C4.2).

## Del D. Felkatalog: allt som kan gå fel och vad som fångar det

| Fel | Fångas av |
|---|---|
| Två rätta svar (för nära synonym) | Blindlösning, motpartsprövning, förklaring per distraktor, granskning |
| Inget riktigt rätt svar | Blindlösning (låg enighet) |
| Facit gissbart utan text | Lösning **utan** text: facit får inte väljas oftare än ~35 % |
| Grammatik avslöjar facit | Böjningskontroll + lösning utan text |
| Nyckeln läcker i texten | Lemmakontroll mot texten |
| Påhittat eller felböjt ord | SAOL/svenska.se-uppslag (återanvänd `scripts/scrape-ord-definitions.ts`) |
| Faktafel | Faktakontroll mot sparad källtext |
| Kräver förkunskap | Lösningsmotiveringen ska peka på texten |
| Upphovsrätt | Licensnivå per dokument; 6-gramsöverlapp mot nivå D-källor |
| Dublett mot arkivet, mot de 398 i DB eller inom banken | Embedding-/n-gramlikhet + unika index på `lower(question_text)` |
| Samma ord om och om igen | Lemmakvoter (C3.7) |
| Fel luckfördelning eller facitbalans | Batchrapport mot A1/C1 |
| Dekorativa luckor i flerluckor | C5.3-kontroll i blindlösningen (vilken lucka fäller varje distraktor) |
| Inaktuellt innehåll | Tidsordsfilter + faktakontroll |
| Ligaturfel/arkivskräp i exempel | Normalisering före steg 0 |
| Partisk eller stötande text | Känslighetsgranskning i steg 6 |

## Del E. Pipelinen

Allt bor i `scripts/mek-gen/` och skriver mellanresultat till
`scripts/mek-gen/out/` (gitignorerad cache). Regler som går att testa utan nät
läggs som ren TS i `src/lib/mek-rules.ts` med `mek-rules.test.ts`, samma mönster
som `question-validity.ts`. Läs `claude-api`-skillen innan anropen skrivs.
Regelverket ovan kopieras till `scripts/mek-gen/REGELVERK.md` och är
generatorns systemprompt.

**Steg 0: annotera arkivet.** Normalisera de 600 (A5). En modell annoterar varje
uppgift: ämne, genre, ordklass per lucka, ledtrådstyp, distraktortyp per
alternativ, vilken lucka som fäller varje distraktor, nyckelns frekvensband.
Niklas stickprovar 50. Utdata: `arkiv-annotering.json` + rapport med de
fördelningar som C2.7, C3.6, C4.5 och C5.3 hänvisar till. Kvoterna fylls i
`REGELVERK.md` först här.

**Steg 1: källor.** Ämnes- och genrekvoter → sökning per kvot → spara källtext,
URL, licensnivå. Stycken på 25–80 ord.

**Steg 2: text och lucka.** Nivå A–C: korta och redigera citatet. Nivå D: skriv
om ur fakta. Välj luckor enligt C3, spara ledtrådstypen.

**Steg 3: distraktorer** enligt C4/C5, plus förklaring (C8).

**Steg 4: deterministiska kontroller** (`mek-rules.ts`): format, längder,
distinkta luckor, lemmaläcka, kvoter, SAOL, likhet mot arkivet/DB/banken,
6-gram mot nivå D. Underkänd = tillbaka till steg 2/3, max 2 försök, sedan bort.

**Steg 5: blindlösning.** En annan modell, utan facit, 5 körningar:
(a) med text: facit valt ≥ 5/5, med motivering som pekar på texten;
(b) utan text: facit ≤ 2/5 (annars gissbart på formen);
(c) motpart: "argumentera för att B också är rätt" ska misslyckas;
(d) per distraktor: vilken lucka fäller den (C5).

**Steg 6: fakta och känslighet.** Varje påstående mot källtexten; tidsord;
partiskhet.

**Steg 7: mänsklig granskning.** Hela pilotbatchen, sedan 10 % stickprov per
batch. Varje avvisningsskäl blir en ny regel eller kontroll, inte bara en lagning.

**Steg 8: import.** `scripts/import-mek-generated.ts`, torrkörning som standard,
`--apply` för att skriva. Rad: `category "MEK"`, `subject_type "verbal"`,
`options [{id,text}]` (som `buildOptions` i `import-prov-questions.ts`),
`correct_answer`, `explanation`, `difficulty`, `source` (källhänvisning),
`tags ["tkn-genererad","mek-v1",<ämne>,<licensnivå>]`, `clean_status "ok"`.
`exam_term` lämnas tomt (annars raderas raderna av arkivimporten, se CLAUDE.md).
Importen är idempotent på `lower(question_text)`.

**Steg 9: efter publicering.** När en uppgift fått ≥ 30 svar: räkna p-värde och
diskrimination (rätt bland starka vs svaga spelare, ELO som mått) ur
`match_answers`. p > 0,95, p < 0,15 eller negativ diskrimination → `retired` och
granskning. `question_reports` på en genererad uppgift läses först.

### Batchordning
1. **Pilot 50** (20/20/10) → full granskning → rätta regelverket.
2. **200** → 10 % granskning + steg 9 på de första 50.
3. **10 × 175** till 2 000, med batchrapport mot A1/C1 efter varje.

## Del F. Appen

- **Märkning i UI:** där en MEK-uppgift visas (match, `/train`, resultatsidan)
  visar en rad `tkn-genererad` "Tvåkommanollans egen uppgift" plus källraden.
  Källraden är **krav** för nivå B och C (licensen), inte en finess.
- **Texter som lovar "riktiga" frågor:** `/ova/mek` (`ova.$delprov.tsx`) och
  MEK-guiden säger "riktiga MEK-frågor". De ska stämma: antingen visar de bara
  arkivuppgifter, eller så ändras texten. Sveps igenom vid importen.
- **Duellurvalet:** `selectQuestionsFor` drar 3 MEK slumpvis. BÖR blanda
  arkiv/genererat och luckantal; bestäms när piloten visat kvaliteten.
- **De 398 skrapade MEK-raderna** ingår i dublettkontrollen men rörs inte.
- Ingen migration behövs: alla kolumner finns.

## Verifiering

- `npm run test` med nya `mek-rules.test.ts`: varje MÅSTE-regel har ett test som
  underkänner ett konstruerat fel (dubbelt luckord, läcka, fel längd, fel
  avskiljare) och godkänner tio arkivuppgifter.
- **Arkivet som facit:** kör steg 4 och 5 på 100 riktiga UHR-uppgifter. De ska
  passera nästan alla; underkänns de är kontrollen för sträng, och den kalibreras
  innan något genereras.
- Batchrapport efter varje batch: luckfördelning, facitbalans, längder,
  ämnesmix, distraktortyper, lemmakvoter mot arkivet.
- Importen: torrkörning, sedan `--apply` på piloten, sedan
  `bun run scripts/validate-questions.ts MEK` (0 trasiga), sedan headless Chrome
  enligt CLAUDE.md: en MEK-uppgift i `/train` visar etiketten och källraden.
- Ordningen i CLAUDE.md före varje commit: tsc → eslint (ändrade filer) → test →
  build → SSR-rökprov.

## Öppet

- Juristens svar på tabellen i C7 innan publicering.
- Ämnes-, ordklass- och distraktorkvoterna fylls i efter steg 0.

Källor: [studera.nu, anvisningar verbal del](https://www.studera.nu/globalassets/05-hogskoleprovet/anvisningar-verbal-del-ordinarie-prov-webb.pdf) ·
[Umeå univ. BVM nr 72](https://www.umu.se/globalassets/organisation/fakulteter/samfak/institutionen-for-tillampad-utbildningsvetenskap/hogskoleprovet/publikationer/bvm-nr-72.pdf) ·
[Stage & Ögren, Ett nytt högskoleprov](https://www.diva-portal.org/smash/get/diva2:516561/FULLTEXT02)
