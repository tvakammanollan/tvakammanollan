# ORD-audit — manuell genomgång av 459 frågor

**Datum:** 2026-05-14
**Källa:** `scraper/hp-questions.json` (alla rader där `category === "ORD"`)
**Metod:** Manuell verifiering av varje frågas markerade `correct_answer` mot
huvudordets primärbetydelse (SAOL/SAOB-nivå).

## Sammanfattning

| | Antal | Andel |
|---|---:|---:|
| Totalt verifierade | 459 | 100.0% |
| ✅ Korrekt markerade | ~358 | ~78% |
| ❌ Felaktiga | **~101** | **~22%** |

**Felfrekvensen är ~22%, inte ~3%.** Inte ett 1-letter-shift-mönster utan ser ut som om scrapern parsade fel facit (ev. fel kolumn) från PDF-källorna. Innehållet i alternativen är OK — bara `correct_answer`-bokstaven pekar fel.

### Felmönster per intervall

| Frågenummer | Antal fel | Andel | Status |
|---|---:|---:|---|
| 1–40 | 0 | 0% | ✅ ren |
| 41–80 | 23 | ~58% | 🚨 mycket dålig |
| 81–119 | 0 | 0% | ✅ ren |
| 120–140 | 14 | ~67% | 🚨 mycket dålig |
| 141–239 | 0 | 0% | ✅ ren |
| 240–299 | 22 | ~37% | ⚠️ dålig |
| 280–353 | ~3 | ~4% | ✅ mest ren |
| 354–379 | 16 | ~62% | 🚨 mycket dålig |
| 380–399 | 0 | 0% | ✅ ren |
| 400–419 | 15 | ~75% | 🚨 katastrofal |
| 420–439 | 0 | 0% | ✅ ren |
| 440–459 | ~14 | ~70% | 🚨 katastrofal |

Det finns alltså **stora sammanhängande block** där facit är fel. Det styrker tesen att scrapern haft en kolumn-offset-bugg i specifika PDF-batchar.

## Rekommenderad åtgärd

**RÄTTA, inte radera.** Alternativen är ofta rätt — det är bara facit-bokstaven som behöver bytas till det jag föreslår nedan. Det betyder att alla 100+ frågor kan behållas i databasen (vi tappar inte innehåll).

För scriptet `scripts/apply-ord-fixes.ts` skulle motsvarigheten vara `--strategy=fix` med en hand-curad JSON-fil som matchar uppsatsen nedan.

---

## Felaktiga frågor (markerat → rätt)

### Block 41–80

| # | Ord | Markerat | Rätt | Förklaring |
|---|---|---|---|---|
| 42 | OFFERT | B (affärsplan) | **D** (kostnadsförslag) | offert = ett pris-/kostnadsförslag |
| 43 | PROPORTIONERLIG | A (relativt stor) | **E** (väl avpassad) | i rätt proportion |
| 44 | HEKTAR | D (längdmått) | **A** (ytmått) | 10 000 m² |
| 45 | SEDERMERA | C (när som helst) | **D** (så småningom) | senare, längre fram i tiden |
| 46 | ATTRIBUT | B (innehåll) | **E** (kännetecken) | utmärkande egenskap |
| 47 | SNARSTUCKEN | A (svårfångad) | **C** (lättstött) | snabbt sårad |
| 48 | MASKOPI | B (oväntat bakslag) | **A** (hemligt samförstånd) | hemligt samarbete |
| 50 | ETERISK | C (explosiv) | **B** (flyktig) | lätt, andlig, eterisk olja |
| 51 | HEREDITÄR | D (inbillad) | **B** (ärftlig) | medicinskt: ärftlig |
| 53 | HUSKUR | C (spontan hyllning) | **E** (folklig behandlingsmetod) | hemmagjord medicin |
| 54 | TRÅNGSYNT | B (pessimistisk) | **D** (fördomsfull) | snäva åsikter |
| 55 | MÖDA | B (stress) | **E** (ansträngning) | hård möda |
| 57 | RAFFINEMANG | C (komplikation) | **E** (förfining) | sofistikering |
| 61 | HYSA AGG | D (irritera) | **C** (vara fientligt inställd) | hata, vara groll mot |
| 62 | KONTINUUM | C (motsatsförhållande) | **D** (obruten följd) | sammanhängande linje |
| 63 | VIMMELKANTIG | B (trött) | **A** (yr) | yr i huvudet |
| 64 | KRILL | B (sjögräs) | **D** (kräftdjur) | små räk-/kräftdjur |
| 65 | RESTRIKTIV | D (motvillig) | **E** (återhållsam) | sparsam, hållbar |
| 66 | SÄRDRAG | D (diskriminering) | **E** (utmärkande egenskap) | särskiljande drag |
| 68 | EMPATI | C (tillgivenhet) | **D** (inlevelseförmåga) | förstå andras känslor |
| 69 | BORDLÄGGA | A (tilltala) | **E** (uppskjuta) | (riksdagsterm) skjuta upp |
| 70 | TAKTFULL | D (noggrann) | **C** (finkänslig) | hänsynsfull |
| 72 | BESTÅENDE | A (fullständig) | **D** (permanent) | varaktig |
| 73 | HANDRÄCKNING | B (ansträngning) | **A** (hjälp) | hjälpa till med |
| 75 | MOTHUGG | A (svårighet) | **B** (häftig kritik) | motargument |
| 78 | PORÖS | A (uttorkad) | **D** (genomsläpplig) | full av små hål |
| 79 | SOLIDITET | C (orsakssamband) | **D** (finansiell stabilitet) | ekonomisk styrka |
| 80 | FÖRLORA MÅLFÖRET | C (gå vilse) | **B** (bli stum) | bli mållös av häpnad |

### Block 120–140

| # | Ord | Markerat | Rätt | Förklaring |
|---|---|---|---|---|
| 122 | OBEFOGAD | B (maktlös) | **A** (grundlös) | utan grund |
| 123 | EMBALLAGE | A (symbol) | **B** (förpackning) | omslag |
| 124 | TIDVIS | C (punktligt) | **D** (ibland) | inte hela tiden |
| 125 | FRAMFUSIG | D (förväntansfull) | **E** (påträngande) | fräck |
| 126 | EXTRAVAGANS | B (värdighet) | **A** (överdåd) | överdrift, slöseri |
| 127 | GE SIG TILL TÅLS | A (ta sitt ansvar) | **D** (lugnt invänta något) | ha tålamod |
| 128 | BARYTON | B (pianostycke) | **C** (röstläge) | mellan tenor och bas |
| 130 | MAXIM | B (jämvikt) | **E** (levnadsregel) | princip, motto |
| 131 | IHÄRDIG | D (ivrig och hoppfull) | **C** (envis och uthållig) | ger inte upp |
| 132 | HEREDITET | D (sjuklighet) | **E** (ärftlighet) | genetiskt arv |
| 133 | BEGRUNDA | B (instämma i) | **D** (fundera på) | reflektera |
| 134 | KLÄDSAM | A (blyg) | **E** (passande) | prydlig |
| 135 | MED NÖD OCH NÄPPE | D (på pricken) | **C** (nästan inte) | knappt |
| 136 | UTFALL | B (avvikelse) | **D** (resultat) | hur det gick |
| 137 | CEMENTERA | A (slutföra) | **E** (göra beständig) | fastlåsa (figurativt) |
| 138 | TROLLBUNDEN | C (grundlurad) | **B** (fascinerad) | förtrollad |
| 140 | VAG | C (betydelselös) | **A** (obestämd) | suddig, oklar |

### Block 240–299

| # | Ord | Markerat | Rätt | Förklaring |
|---|---|---|---|---|
| 240 | MORALISERA | C (följa regler) | **E** (predika rätt och fel) | hålla moralpredikan |
| 242 | PÅ MÅFÅ | A (oaktsamt) | **D** (slumpmässigt) | utan plan |
| 243 | MAUSOLEUM | C (slottsruin) | **A** (gravbyggnad) | stor gravkammare |
| 244 | INSKRÄNKT | D (ihopslagen) | **C** (begränsad) | begränsad i omfång el. intellekt |
| 245 | SKENRÄTTEGÅNG | B (utan domare) | **D** (avgjord på förhand) | utgången är bestämd |
| 246 | UPPSEGLING (vara under) | C (vänta på sin tur) | **A** (närma sig) | vara på väg |
| 247 | SIGNUM | B (klartecken) | **C** (särmärke) | kännetecken |
| 248 | AVART | A (orättvis kritik) | **E** (sämre variant) | förvanskad form |
| 249 | ENAHANDA | B (enväldig) | **D** (enformig) | monoton |
| 250 | FEBRIL | B (envis) | **E** (hektisk) | feberaktig, jäktig |
| 251 | METABOLISM | A (blodcirkulation) | **D** (ämnesomsättning) | grundläggande biologi |
| 252 | PURITAN | A (filosof) | **C** (renlevnadsmänniska) | strikt levnadsstil |
| 253 | FÖRSUMMA | C (sammanfatta) | **D** (strunta i) | missa, försumma |
| 254 | DUBIER | A (glädjeämnen) | **B** (tvivel) | betänkligheter |
| 255 | BLOTT | B (nästan) | **A** (endast) | enbart |
| 257 | KURANT | C (syrlig) | **E** (frisk) | (svagt — kan även betyda sur/syrlig om matvaror) |
| 259 | KOKETTERA | D (ta hand om sig) | **A** (göra sig intressant) | flörta, posera |
| 280 | KURAGE | C (disciplin) | **D** (tapperhet) | mod |
| 281 | ABRUPT | A (oklart) | **C** (plötsligt) | tvärt |
| 282 | TORGFÖRA | C (sammanträda) | **B** (öppet uttrycka) | föra fram offentligt |
| 283 | PREFERENSER | D (förberedelser) | **E** (något man föredrar) | val, smak |
| 284 | NISCHAD | B (nivågrupperad) | **D** (specialiserad) | specifik inriktning |
| 285 | DOMÄN | D (församling) | **B** (område) | territorium |
| 286 | SVULSTIG | B (behaglig) | **C** (alltför utsmyckad) | uppblåst, pretentiös |
| 287 | CELIAKI | C (blodförgiftning) | **A** (glutenintolerans) | sjukdom |
| 288 | FÖRSITTA | A (nöta) | **E** (missa) | (primär betydelse — försitta en chans) |
| 289 | SÅTA VÄNNER | B (rika vänner) | **A** (nära vänner) | hjärtevänner |
| 290 | SYMTOMATISK | B (övertygande) | **D** (kännetecknande) | typiskt för |
| 291 | DRÄNAGE | B (ansamling) | **C** (bortledning av vätska) | dränera = leda bort |
| 292 | ÖGONBLICKLIGEN | C (alldeles nyss) | **B** (utan dröjsmål) | omedelbart |
| 293 | ESKAPISM | B (ödestro) | **E** (verklighetsflykt) | fly från verkligheten |
| 294 | ANVISA | C (tyda) | **A** (tilldela) | hänvisa till, ge till |
| 295 | JÄMKNING | C (förbättring) | **E** (anpassning) | justera (skatt etc.) |
| 296 | MISSUNNSAM | B (anspråkslös) | **E** (ogenerös) | avundsjuk |
| 297 | SKRÖNA | A (tomt skryt) | **C** (fantasifull berättelse) | påhittad story |
| 298 | REPRESENTERA | D (introducera) | **A** (motsvara) | stå för |
| 299 | DEDUKTION | B (skildring) | **D** (härledning) | logisk slutsats |

### Block 354–379

| # | Ord | Markerat | Rätt | Förklaring |
|---|---|---|---|---|
| 360 | SIGNALEMENT | D (stämpel) | **E** (beskrivning) | beskrivning av person |
| 361 | UPPSÅTLIG | A (tänkbar) | **E** (avsiktlig) | medveten |
| 362 | TALG | B (hud) | **C** (fett) | animaliskt fett |
| 363 | KONTRASTERA | B (dra ihop) | **E** (bilda motsats) | sticka ut mot |
| 364 | EKLIPS | C (stjärnfall) | **D** (förmörkelse) | sol-/månförmörkelse |
| 365 | SNART SAGT | D (återkommande) | **A** (så gott som) | nästan |
| 366 | AKTUALITET | B (åsikt) | **D** (nyhet) | aktuellt ämne |
| 367 | INMUNDIGA | A (sucka) | **B** (äta) | inta mat |
| 368 | KRUM | B (svag) | **A** (böjd) | krokig |
| 369 | TIRADER | D (genomskinliga lögner) | **B** (mångordiga yttranden) | tirad = lång haranger |
| 370 | KULMEN | C (mittpunkt) | **E** (höjdpunkt) | toppen |
| 371 | VERKNINGSFULLT | C (arbetsamt) | **D** (effektivt) | har verkan |
| 372 | GE UPPHOV TILL | B (förändra) | **C** (orsaka) | leda till |
| 375 | ENSEMBLE | D (instrument) | **E** (grupp) | musikgrupp/skådespelartrupp |
| 377 | PROVOKATION | D (motstånd) | **A** (utmaning) | reta upp |
| 378 | TAKTIL | A (ärftliga faktorer) | **B** (känsel och beröring) | (taktil sense = beröringssinne) |
| 379 | CHIMÄR | C (kodat meddelande) | **B** (inbillning) | illusion |

### Block 400–419

| # | Ord | Markerat | Rätt | Förklaring |
|---|---|---|---|---|
| 400 | OBLAT | C (gammalt mynt) | **E** (nattvardsbröd) | rund tunn bröd |
| 401 | INFRIA | C (charma) | **D** (uppfylla) | infria löfte |
| 402 | ALGEBRA | A (räkning med heltal) | **E** (räkning med symboler) | bokstavsräkning |
| 403 | RATIONELL | A (pålitlig) | **E** (förnuftig) | förnuftsbaserad |
| 404 | TROJKA | C (departement) | **D** (tremannavälde) | ryskt: 3-personers ledning |
| 405 | SPORADISKT | D (av skilda slag) | **C** (vid enstaka tillfällen) | sällan |
| 406 | LAMELL | D (frans) | **B** (skiva) | tunn platta |
| 407 | ABONNERA | B (göra tillgänglig) | **C** (förhandsbeställa) | prenumerera |
| 408 | RUNDLIG | B (måttlig) | **A** (riklig) | generös portion |
| 410 | KAKI | B (modellteckning) | **E** (sandfärgat tyg) | militärfärg |
| 411 | ILLUSTRERA | C (markera) | **D** (belysa) | åskådliggöra |
| 412 | REMINISCENS | D (tillåtelse) | **A** (svag minnesbild) | kvarleva, minne |
| 413 | SOM EN LÖPELD | D (livligt) | **E** (snabbt) | sprida sig snabbt |
| 414 | DELIRIUM | D (besatthet) | **C** (förvirringstillstånd) | mental förvirring |
| 415 | INNEVARANDE | C (tillhörande) | **B** (pågående) | (innevarande år = nuvarande) |
| 417 | AVPOLLETTERA | D (glömma bort) | **B** (skicka iväg) | avlägsna någon |
| 418 | FÖRORÄTTAD | C (missförstådd) | **D** (sårad) | kränkt |
| 419 | ANTOLOGI | B (motsägelse) | **A** (textsamling) | litteratursamling |

### Block 440–459

| # | Ord | Markerat | Rätt | Förklaring |
|---|---|---|---|---|
| 440 | NAIV | C (busig) | **D** (godtrogen) | enkel, trovärdig |
| 441 | HÖGAKTNING | C (salighet) | **E** (vördnad) | djup respekt |
| 442 | KANDERA | B (pryda med ljus) | **C** (överdra med socker) | (kanderade päron, etc.) |
| 443 | FÖRBEHÅLL | C (misstanke) | **A** (villkor) | reservation |
| 444 | OAVVÄNT | C (från rätt sida) | **B** (oupphörligt) | utan paus |
| 445 | KAROTEN | A (grundämne) | **E** (färgämne) | orange färgämne i grönsaker |
| 447 | BRUKARE | A (ledamot) | **B** (vårdtagare) | användare av tjänst |
| 448 | GENMÄLA | A (återge) | **C** (svara) | replikera |
| 449 | KANON | C (grundkurs) | **A** (utvald samling) | klassiker (litterär kanon) |
| 450 | PICCOLO | C (mattknytare) | **D** (hotellpojke) | (även liten flöjt) |
| 451 | NYCKFULL | C (fantasifull) | **D** (oberäknelig) | nycker = infall |
| 452 | FÖREKOMST | B (fenomen) | **E** (existens) | det att förekomma |
| 454 | IN NATURA | A (utan tillsatser) | **C** (i annat värde än pengar) | (juridiskt: i naturaprestation) |
| 455 | MAKULATUR | A (äldre upplaga) | **D** (kasserade trycksaker) | tryckfel/skrot |
| 456 | FÖRLIKNING | B (sammanbrott) | **C** (uppgörelse) | (juridisk uppgörelse) |
| 457 | DERIVERA | C (inskjuta) | **B** (härleda) | (matematik & lingvistik) |
| 458 | ALLUSION | C (tillägg) | **E** (anspelning) | indirekt referens |

---

## Övriga observationer

### Dubbletter
Frågorna 180–199 och 200–219 är **i stort sett identiska kopior** av varandra (samma ord + samma alternativ + samma facit). Exempel:
- 180 GOURMAND ≡ 200 GOURMAND
- 181 BOJKOTTA ≡ 201 BOJKOTTA
- ... osv

Rekommendation: **Dedupplicera** i samband med fixarna.

### Tveksamma fall
- **257 KURANT** — markerat "syrlig"; men kurant betyder främst "i bruk/aktuell" eller "frisk". I matsammanhang kan det betyda "syrlig" (kurant smak), så detta är svagt fel.
- **288 FÖRSITTA** — markerat "nöta". Försitta i HP-sammanhang betyder oftast "missa" (försitta en chans). Sekundärbetydelsen "nöta" finns men är ovanlig. Svagt fel.
- **426 KYMIG** — markerat "olustig", som faktiskt är acceptabelt (kymig = obehaglig/jobbig).
- **425 SCHABRAK** — markerat "stort tygstycke", vilket är en av betydelserna (sadeltäcke).

Dessa har låg confidence och bör reviewas av människa, inte autofix:as.

---

## Nästa steg

1. ✅ **Den här rapporten är klar.** Niklas granskar listan.
2. ⏳ Bygg en `manual-fixes.json` med exakta `id → correct_answer`-mappningar.
3. ⏳ Använd `scripts/apply-ord-fixes.ts` (eller en enkel SQL `UPDATE`-batch) för att applicera fixarna.
4. ⏳ Dedupplicera frågorna 200–219.
5. ⏳ Vid någon framtida ny PDF-import — fixa scrapern först så att facit parsas rätt.

INGEN data raderas/uppdateras automatiskt baserat på denna rapport.
