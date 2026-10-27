/**
 * Trådarna som startade forumet (2026-10-20).
 *
 * Skrivna av sajten själv och publicerade från grundarens konto, så att det
 * syns vem som skriver. Inga påhittade användare och inga uppdiktade samtal:
 * varje tråd är en fråga folk faktiskt söker på, och svaret ligger som första
 * svarsinlägg så att andra kan fylla på under.
 *
 * Fakta som ändras (datum, avgift) står i `hp-dates.ts`; ändras de där måste
 * texten här ses över för hand, precis som `llms.txt`.
 */
export type SeedThread = {
  category: "allmant" | "kvantitativ" | "verbal" | "provdagen" | "plugg";
  title: string;
  question: string;
  answer: string;
  /** Terminen ("2026vt") för genomgångar av provuppgifter; gamla prov länkar via den. */
  provTerm?: string;
};

export const SEED_THREADS: SeedThread[] = [
  /* ── Allmänt ─────────────────────────────────────────────────── */
  {
    category: "allmant",
    title: "Hur är högskoleprovet uppbyggt?",
    question: `Hur många delar har högskoleprovet, hur lång tid tar det och vilka delprov ingår?`,
    answer: `Provet består av **fem provpass på 55 minuter** vardera. Fyra av dem räknas, det femte är ett utprövningspass där nya uppgifter testas. Du vet inte vilket pass som är utprövningen, så gör ditt bästa på alla fem.

Passen är antingen verbala eller kvantitativa, och varje pass har 40 uppgifter.

**Verbalt pass (40 uppgifter)**
- ORD, ordförståelse: 10
- LÄS, svensk läsförståelse: 10
- MEK, meningskomplettering: 10
- ELF, engelsk läsförståelse: 10

**Kvantitativt pass (40 uppgifter)**
- XYZ, matematisk problemlösning: 12
- KVA, kvantitativa jämförelser: 10
- NOG, kvantitativa resonemang: 6
- DTK, diagram, tabeller och kartor: 12

Totalt räknas alltså 160 uppgifter: 80 verbala och 80 kvantitativa. Vill du se hur ett riktigt prov ser ut ligger alla prov sedan 2012 i [gamla prov](https://tvakommanollan.se/gamla-prov).`,
  },
  {
    category: "allmant",
    title: "Hur räknas poängen på högskoleprovet ut?",
    question: `Hur går det till när antalet rätt blir en poäng mellan 0,0 och 2,0?`,
    answer: `Först räknas antalet rätt på den verbala delen (max 80) och den kvantitativa delen (max 80) var för sig. Varje del **normeras** sedan till en poäng mellan 0,00 och 2,00 med en tabell som tas fram för just det provtillfället.

Totalpoängen är **medelvärdet av de två delarnas poäng**. 1,90 verbalt och 2,00 kvantitativt ger alltså 1,95.

Några saker som är bra att veta:
- Normeringen bygger på hur alla som skrev provet presterade. Ett svårare prov ger därför ungefär samma poäng för färre rätt.
- Tabellen är inte rak. De sista rätta svaren nära toppen är värda mycket mer än de i mitten.
- Fel svar ger inget avdrag, så lämna aldrig en uppgift tom.

Du kan räkna fram din poäng i [poängräknaren](https://tvakommanollan.se/hogskoleprovet-poangraknare).`,
  },
  {
    category: "allmant",
    title: "Vad är ett bra resultat på högskoleprovet?",
    question: `Vad räknas som ett bra resultat, och vad krävs för de populäraste utbildningarna?`,
    answer: `Det beror helt på vad du ska söka. Ett resultat är bra om det räcker till den utbildning du vill in på.

En grov bild:
- **Runt 1,0** ligger ungefär i mitten av alla som skriver.
- **1,2–1,4** räcker till många utbildningar med konkurrens.
- **1,5–1,7** behövs ofta till juristprogram, psykolog och civilingenjör på de mest sökta orterna.
- **1,8 och uppåt** krävs till läkarprogrammet och några få andra utbildningar i urvalsgrupp HP.

Gränserna flyttar sig varje termin efter hur många som söker och hur bra de har skrivit. Titta därför på antagningspoängen för just ditt program de senaste terminerna. Vi har samlat dem per program under [poäng per utbildning](https://tvakommanollan.se/hogskoleprovet-poang).

Läs gärna [guiden om bra resultat](https://tvakommanollan.se/guider/bra-resultat) också.`,
  },
  {
    category: "allmant",
    title: "Hur länge gäller resultatet från högskoleprovet?",
    question: `Måste man skriva om provet efter några år, och vilket resultat räknas om man skrivit flera gånger?`,
    answer: `Resultatet gäller i **åtta år**. Har du skrivit flera gånger används **ditt bästa giltiga resultat** automatiskt när du söker, så du riskerar ingenting på att skriva igen.

Det finns ingen gräns för hur många gånger du får skriva provet och ingen åldersgräns. Många skriver det flera gånger och höjer sig rejält mellan tillfällena, eftersom provet går att träna på: uppgiftstyperna är desamma från gång till gång.`,
  },
  {
    category: "allmant",
    title: "Hur stor del av platserna går till högskoleprovet?",
    question: `Hur fungerar urvalet, och hur många platser fördelas på högskoleprovet jämfört med betyg?`,
    answer: `Till de flesta utbildningar fördelas **minst en tredjedel av platserna på betyg och minst en tredjedel på högskoleprovet**. Resten bestämmer lärosätet, och ofta hamnar även de i någon av de två grupperna.

Du hamnar automatiskt i alla urvalsgrupper du är behörig till och konkurrerar i den där du står starkast. Ett bra provresultat kan alltså aldrig skada en ansökan med bra betyg, det ger bara en chans till.

En del utbildningar använder egna urval, till exempel arbetsprov eller intervjuer. Kolla alltid utbildningens egen sida.`,
  },
  {
    category: "allmant",
    title: "Kan man plugga till högskoleprovet eller är det ett begåvningstest?",
    question: `Det sägs ibland att man inte kan plugga till högskoleprovet. Stämmer det?`,
    answer: `Nej, det stämmer inte. Provet mäter förmågor som går att träna, och uppgiftstyperna är exakt desamma varje termin.

Det som ger mest effekt:
- **ORD** går att plugga rakt av. Samma ord kommer sällan tillbaka, men provet håller sig till samma sorts ord: lånord, ålderdomliga ord och ord ur sakprosa. Ett större ordförråd av det slaget ger direkt fler rätt. Börja i [ordlistan](https://tvakommanollan.se/ordlista).
- **KVA och NOG** handlar mycket om att känna igen uppgiftstypen och undvika vanliga fällor.
- **XYZ** bygger på grundskolans och gymnasiets matte. Att repetera bråk, procent, ekvationer och geometri lönar sig.
- **Tidspress** tränas bort genom att skriva hela provpass på tid.

Det bästa sättet att se var du står är att skriva ett [gammalt prov](https://tvakommanollan.se/gamla-prov) på riktig tid och räkna poängen efteråt.`,
  },
  {
    category: "allmant",
    title: "Ska man gissa på högskoleprovet?",
    question: `Blir det minuspoäng för fel svar, och ska man gissa när man inte vet?`,
    answer: `Ja, **gissa alltid**. Fel svar ger inget avdrag, så en tom ruta är en garanterad nolla medan en gissning har 20–25 % chans att bli rätt.

Gör det till en vana: när det är fem minuter kvar på passet fyller du i alla uppgifter du inte hunnit med. Kan du stryka ett eller två alternativ först ökar chansen ordentligt. På KVA kan du till exempel ofta utesluta D direkt om båda storheterna går att räkna ut.`,
  },

  /* ── Kvantitativ del ─────────────────────────────────────────── */
  {
    category: "kvantitativ",
    title: "Hur löser man NOG-uppgifter?",
    question: `NOG-uppgifterna med påstående (1) och (2) känns förvirrande. Hur ska man tänka?`,
    answer: `NOG frågar inte efter svaret, bara **om informationen räcker** för att få fram det. Svarsalternativen är alltid desamma:

- **A** i (1) men inte i (2)
- **B** i (2) men inte i (1)
- **C** i (1) tillsammans med (2)
- **D** i (1) och (2) var för sig
- **E** inte genom de båda påståendena

Arbeta i en fast ordning:
1. Läs frågan och bestäm exakt vad som ska tas fram.
2. Pröva (1) **ensamt**. Glöm (2) helt.
3. Pröva (2) **ensamt**. Glöm (1) helt.
4. Räckte ingen av dem, pröva dem tillsammans.

Den vanligaste fällan är att man läst (1) och sedan omedvetet använder det när man prövar (2). Den andra är att räkna klart. Det behövs inte: så fort du ser att det **går** att räkna ut är du färdig.

Mer i [NOG-guiden](https://tvakommanollan.se/guider/nog).`,
  },
  {
    category: "kvantitativ",
    title: "Hur löser man KVA-uppgifter snabbt?",
    question: `KVA tar för lång tid för mig. Finns det knep för kvantitativa jämförelser?`,
    answer: `I KVA ska du jämföra kvantitet I med kvantitet II. Alternativen är:

- **A** I är större än II
- **B** II är större än I
- **C** I är lika med II
- **D** informationen är otillräcklig

Det viktigaste knepet: **du behöver sällan räkna ut något exakt**. Det räcker att veta vilken som är störst.

- Förenkla båda sidor på samma sätt. Dra bort samma term, dela med samma positiva tal.
- Pröva gärna några värden när det finns en variabel. Ger $x = 1$ svaret A men $x = -1$ svaret B är svaret **D**.
- Glöm inte negativa tal, noll och bråk mellan 0 och 1. Det är där de flesta fällor ligger, till exempel att $x^2$ inte alltid är större än $x$.
- Om båda storheterna är fasta tal kan svaret aldrig vara D.

Mer i [KVA-guiden](https://tvakommanollan.se/guider/kva).`,
  },
  {
    category: "kvantitativ",
    title: "Vilken matte behöver man kunna till XYZ?",
    question: `Vilka mattekunskaper krävs för XYZ på högskoleprovet?`,
    answer: `XYZ bygger på matte från grundskolan och gymnasiets första kurs. Det som återkommer mest:

- **Bråk och procent**: förlänga, förkorta, procentuell förändring.
- **Potenser och rötter**: $a^m \\cdot a^n = a^{m+n}$, $\\sqrt{a} = a^{1/2}$, $a^0 = 1$.
- **Ekvationer**: förstagrad, enkla andragradsekvationer, ekvationssystem.
- **Geometri**: area och omkrets av trianglar, rektanglar och cirklar, Pythagoras sats, vinkelsumman i en triangel (180°).
- **Funktioner och grafer**: räta linjens ekvation $y = kx + m$.
- **Medelvärde** och enkla sannolikheter.

Du får ingen miniräknare, så siffrorna är oftast valda för att gå jämnt ut. Får du ett krångligt tal har du troligen räknat fel eller tagit en omväg.

Mer i [XYZ-guiden](https://tvakommanollan.se/guider/xyz).`,
  },
  {
    category: "kvantitativ",
    title: "Tips för DTK: diagram, tabeller och kartor",
    question: `DTK-uppgifterna tar lång tid. Hur blir man snabbare på att läsa diagram och tabeller?`,
    answer: `DTK är mer läsning än räkning. De flesta fel kommer av att man läst av fel rad, fel enhet eller fel år.

- **Läs frågan först**, sedan diagrammet. Då vet du vad du letar efter.
- **Kolla rubrik, axlar och enheter.** Står det tusental eller procent? Är axeln avbruten?
- **Avrunda grovt.** Svarsalternativen ligger ofta långt ifrån varandra, så en överslagsräkning räcker.
- **Se upp med procent av procent.** En ökning från 20 % till 25 % är 5 procentenheter men 25 procent.
- Uppslagen har ofta flera frågor. Spara de svåraste till sist i stället för att fastna.

Mer i [DTK-guiden](https://tvakommanollan.se/guider/dtk).`,
  },
  {
    category: "kvantitativ",
    title: "Hur hinner man klart med det kvantitativa provpasset?",
    question: `Jag hinner aldrig alla 40 uppgifter på 55 minuter i kvant. Hur ska man fördela tiden?`,
    answer: `55 minuter på 40 uppgifter är knappt 1,4 minuter per uppgift. Uppgifterna tar olika lång tid, så en ungefärlig plan hjälper:

- **XYZ** (12): cirka 1 minut var
- **KVA** (10): under 1 minut var
- **NOG** (6): cirka 1 minut var
- **DTK** (12): cirka 1,5 minut var

Regler som hjälper mer än schemat:
1. **Hoppa över** en uppgift du inte ser hur du ska börja på efter 30 sekunder. Markera den och kom tillbaka.
2. Alla uppgifter är värda lika mycket. En svår XYZ ger inte mer än en lätt KVA.
3. Fyll i en gissning på allt som är kvar de sista minuterna.

Det enda som verkligen gör dig snabbare är att skriva hela pass på tid. Testa i [gamla prov](https://tvakommanollan.se/gamla-prov), och läs [guiden om tidspress](https://tvakommanollan.se/guider/tidspress).`,
  },
  {
    category: "kvantitativ",
    title: "Procent på högskoleprovet: förändringsfaktor och procentenheter",
    question: `Hur räknar man procent snabbt utan miniräknare, och vad är skillnaden mellan procent och procentenheter?`,
    answer: `**Förändringsfaktorn** är det snabbaste verktyget:
- En ökning med 20 % betyder att du multiplicerar med 1,20.
- En minskning med 15 % betyder att du multiplicerar med 0,85.
- Två förändringar efter varandra multipliceras: +10 % och sedan −10 % ger $1{,}1 \\cdot 0{,}9 = 0{,}99$, alltså **1 % lägre** än från början och inte samma som innan.

**Procent och procentenheter** är en klassisk fälla. Går en andel från 40 % till 50 % har den ökat med **10 procentenheter** men med **25 procent**, eftersom $10 / 40 = 0{,}25$.

Bra att kunna utantill: $\\frac{1}{8} = 12{,}5\\,\\%$, $\\frac{1}{6} \\approx 16{,}7\\,\\%$, $\\frac{1}{3} \\approx 33{,}3\\,\\%$.`,
  },
  {
    category: "kvantitativ",
    title: "Potenslagar på högskoleprovet: en sammanfattning",
    question: `Vilka potenslagar behöver man kunna till XYZ och KVA?`,
    answer: `De här räcker till nästan alla uppgifter:

- $a^m \\cdot a^n = a^{m+n}$
- $\\frac{a^m}{a^n} = a^{m-n}$
- $(a^m)^n = a^{m \\cdot n}$
- $(ab)^n = a^n b^n$
- $a^0 = 1$ (för $a \\neq 0$)
- $a^{-n} = \\frac{1}{a^n}$
- $a^{1/n} = \\sqrt[n]{a}$

**Exempel:** Vad är $\\frac{2^{10}}{4^3}$?
Skriv om 4 som $2^2$: $4^3 = 2^6$. Då blir det $2^{10-6} = 2^4 = 16$.

Knepet är nästan alltid att skriva om allt i **samma bas** först. Ser du 8, 16 och 32 i samma uppgift: tänk tvåpotenser.`,
  },
  {
    category: "kvantitativ",
    title: "Geometri på högskoleprovet: formler att kunna",
    question: `Vilka geometriformler återkommer på XYZ och NOG?`,
    answer: `Du får inget formelblad, så de här bör sitta:

- **Triangel:** area $= \\frac{b \\cdot h}{2}$, vinkelsumma 180°
- **Rektangel:** area $= b \\cdot h$
- **Cirkel:** area $= \\pi r^2$, omkrets $= 2\\pi r$
- **Pythagoras sats:** $a^2 + b^2 = c^2$ i en rätvinklig triangel
- **Rätblock:** volym $= l \\cdot b \\cdot h$
- **Cylinder:** volym $= \\pi r^2 h$

Bra att känna igen: trianglarna 3-4-5 och 5-12-13 är rätvinkliga. I en liksidig triangel är alla vinklar 60°, och i en likbent triangel är basvinklarna lika stora.

Figurerna på provet är **inte alltid skalenliga**. Lita på det som står i texten, inte på hur bilden ser ut.`,
  },
  {
    category: "kvantitativ",
    title: "Vanliga fällor på KVA",
    question: `Vilka fällor är vanligast på kvantitativa jämförelser?`,
    answer: `De som fäller flest:

1. **Att glömma negativa tal.** Om $x < 0$ är $x^2 > x$, men om $0 < x < 1$ är $x^2 < x$.
2. **Att dela med en variabel** vars tecken du inte vet. Är den negativ vänder olikheten.
3. **Att anta heltal.** Står det inte att $x$ är ett heltal kan det vara 0,5.
4. **Att lita på figuren.** En vinkel som ser rät ut är det inte förrän texten säger det.
5. **Att välja D för tidigt.** Ofta går det att avgöra trots att en variabel saknas, till exempel om den förkortas bort.

En bra vana är att pröva tre värden när en variabel är inblandad: ett negativt tal, noll och ett bråk mellan 0 och 1.`,
  },
  {
    category: "kvantitativ",
    title: "Hur räknar man medelvärde snabbt på högskoleprovet?",
    question: `Det kommer ofta uppgifter om medelvärde. Finns det snabba sätt att räkna?`,
    answer: `Grundformeln: **medelvärde = summa / antal**. Nästan alla uppgifter löses genom att räkna med **summan** i stället för medelvärdet.

**Exempel:** Fem tal har medelvärdet 8. Ett sjätte tal läggs till och medelvärdet blir 9. Vilket är det sjätte talet?

- Summan av de fem: $5 \\cdot 8 = 40$
- Summan av de sex: $6 \\cdot 9 = 54$
- Det sjätte talet: $54 - 40 = 14$

Ett annat knep är att räkna avvikelser från ett gissat medelvärde. För 47, 52 och 51 räknar du från 50: −3, +2, +1, summa 0. Medelvärdet är alltså 50.

Se också upp med **viktade medelvärden**. Två grupper av olika storlek får inte bara snittas.`,
  },

  /* ── Verbal del ──────────────────────────────────────────────── */
  {
    category: "verbal",
    title: "Hur pluggar man ORD till högskoleprovet?",
    question: `Vilket är det bästa sättet att plugga ord inför ORD-delen?`,
    answer: `ORD är det delprov där plugg ger snabbast resultat. Samma ord kommer sällan tillbaka: av de 600 orden på proven 2012–2026 har inget testats två gånger. Men orden är av samma sort varje gång, så ett bredare ordförråd av rätt slag lönar sig direkt.

- **Plugga på ord av provets typ.** [Ordlistan](https://tvakommanollan.se/ordlista) har över 8 700 ord med förklaringar, och [gamla prov](https://tvakommanollan.se/gamla-prov) visar exakt vilka ord som testats.
- **Repetera med mellanrum.** Ett ord du kan i dag har du glömt om två veckor om du inte ser det igen. [Ordövningen](https://tvakommanollan.se/ord) tar tillbaka ord du svarat fel på.
- **Lär dig ordstammar och förled.** *Anti-*, *pro-*, *-logi*, *poly-* och liknande hjälper dig gissa ord du aldrig sett.
- **Plugga lite varje dag** hellre än mycket en gång i veckan. 15 minuter om dagen räcker långt.

När du skriver: läs alternativen och leta efter det som kan **ersätta** ordet i en mening. Mer i [ORD-guiden](https://tvakommanollan.se/guider/ord).`,
  },
  {
    category: "verbal",
    title: "Hur löser man MEK-uppgifter på högskoleprovet?",
    question: `Hur ska man tänka på meningskomplettering? Jag fastnar ofta mellan två alternativ.`,
    answer: `I MEK saknas ett eller flera ord i en text, och du ska välja det alternativ som passar bäst. Det handlar lika mycket om logik som om ordförråd.

1. **Läs hela texten först**, utan alternativen. Försök själv gissa vad som borde stå i luckan.
2. **Leta efter signalord.** *Men*, *trots*, *däremot* och *tvärtom* betyder att luckan ska stå i kontrast till det som kommer före. *Därför*, *alltså* och *dessutom* betyder att den ska hålla med.
3. **Pröva varje alternativ i hela meningen.** När det finns flera luckor ska **alla** ord i alternativet passa.
4. **Stryk alternativ** som bara passar halvvägs.

Står du mellan två alternativ: välj det som passar texten som helhet, inte bara meningen med luckan.

Öva på [MEK-övningen](https://tvakommanollan.se/mek-ovning) och läs [MEK-guiden](https://tvakommanollan.se/guider/mek).`,
  },
  {
    category: "verbal",
    title: "Hur blir man bättre på LÄS, svensk läsförståelse?",
    question: `LÄS tar för lång tid och jag är osäker på svaren. Hur tränar man läsförståelse?`,
    answer: `LÄS har 10 uppgifter per verbalt pass, kopplade till några längre texter. Två saker avgör: tiden och att svara på det som faktiskt står i texten.

- **Svara utifrån texten, inte vad du vet sedan tidigare.** Rätt svar är det texten stöder, även om du själv tycker annorlunda.
- **Läs frågorna först** eller skumma texten först, välj det som fungerar för dig, men gör samma sak varje gång.
- **Leta upp stället i texten** som svaret bygger på. Kan du inte peka på det är du förmodligen ute på tunn is.
- **Akta dig för för starka alternativ.** Ord som *alltid*, *aldrig* och *enbart* är ofta fel om inte texten är lika kategorisk.

Tidsmässigt brukar ungefär 20 minuter av det verbala passet gå till LÄS. Mer i [LÄS-guiden](https://tvakommanollan.se/guider/las).`,
  },
  {
    category: "verbal",
    title: "Tips för ELF, engelsk läsförståelse",
    question: `Hur ska man förbereda sig för ELF? Min engelska är okej men jag tappar poäng.`,
    answer: `ELF har 10 uppgifter per verbalt pass: längre texter, kortare texter och luckuppgifter där ett ord saknas.

- **Läs engelsk sakprosa regelbundet.** Tidningsartiklar och populärvetenskap ligger nära provets texter i stil och svårighet.
- **Luckuppgifterna** löses som MEK: läs hela stycket och leta efter signalord som *however*, *therefore* och *despite*.
- **Svara på det texten säger**, inte det som låter rimligt.
- **Okända ord** går ofta att förstå ur sammanhanget. Fastna inte på dem.

Alla verbala pass i [gamla prov](https://tvakommanollan.se/gamla-prov) har ELF med, så du kan träna på riktiga uppgifter. Mer i [ELF-guiden](https://tvakommanollan.se/guider/elf).`,
  },
  {
    category: "verbal",
    title: "Hur hinner man klart med det verbala provpasset?",
    question: `Hur ska man fördela tiden på det verbala passet? Jag brukar inte hinna med ELF.`,
    answer: `Ordningen i häftet är ORD, LÄS, MEK och ELF. En fördelning som fungerar för många:

- **ORD** (10): 3–4 minuter. Antingen kan du ordet eller inte, så grubbla inte.
- **LÄS** (10): cirka 20 minuter
- **MEK** (10): cirka 10 minuter
- **ELF** (10): cirka 20 minuter

Det vanligaste problemet är att LÄS äter upp tiden och ELF får lida. Två sätt att undvika det:
1. Titta på klockan efter LÄS och håll fast vid planen.
2. Gör gärna ORD och MEK först. Då är de snabba poängen säkrade innan de långa texterna.

Fyll alltid i en gissning på allt du inte hinner. Läs mer i [guiden om tidspress](https://tvakommanollan.se/guider/tidspress).`,
  },
  {
    category: "verbal",
    title: "Förled och ordstammar som hjälper på ORD",
    question: `Vilka förled och ordstammar är bra att kunna för att gissa ord man inte känner igen?`,
    answer: `Många ord på provet är lånord från latin och grekiska. Med ett tjugotal byggstenar kan du ofta lista ut betydelsen:

- **a-, an-**: utan (*apatisk*, *anonym*)
- **anti-**: mot (*antipati*)
- **pro-**: för, framåt (*progressiv*)
- **poly-**: många (*polyglott*)
- **mono-**: en, ensam (*monoton*)
- **pseudo-**: falsk, sken (*pseudonym*)
- **retro-**: bakåt (*retrospektiv*)
- **-logi**: läran om (*etymologi*)
- **-krati**: styre (*teknokrati*)
- **-fil**: som tycker om (*bibliofil*)
- **-fob**: som är rädd för (*xenofob*)
- **bene-**: väl, gott (*benefik*)
- **mal-**: illa (*malplacerad*)

Kombinera med sammanhanget i alternativen så blir gissningarna mycket bättre än slumpen. Slå upp orden i [ordlistan](https://tvakommanollan.se/ordlista).`,
  },
  {
    category: "verbal",
    title: "Varför fastnar jag mellan två alternativ på ORD?",
    question: `På ORD känns det ofta som att två alternativ passar. Hur väljer man rätt?`,
    answer: `Provmakarna lägger medvetet in alternativ som ligger nära i betydelse eller **låter** som ordet. Några knep:

- **Pröva att byta ut ordet** i en tänkt mening. Rätt alternativ ska kunna ersätta det utan att betydelsen ändras.
- **Akta dig för ljudlikhet.** *Eminent* och *imminent* låter lika men betyder olika saker. Alternativet som liknar ordet i stavning är ofta en fälla.
- **Tänk på ordklassen.** Är ordet ett verb ska svaret också fungera som verb.
- **Välj den mest exakta betydelsen.** Ett alternativ som bara delvis stämmer är fel.

Ord du fastnar på hamnar i repetitionen i [ordövningen](https://tvakommanollan.se/ord), så att du ser dem igen tills de sitter.`,
  },

  /* ── Anmälan, provdagen & resultat ───────────────────────────── */
  {
    category: "provdagen",
    title: "När är nästa högskoleprov och när öppnar anmälan?",
    question: `När skrivs nästa högskoleprov, när kan man anmäla sig och vad kostar det?`,
    answer: `Nästa prov är **vårprovet lördagen den 10 april 2027**. Anmälan är öppen **7–14 januari 2027** på hogskoleprov.nu. Provavgiften är **550 kronor**.

Tänk på att anmälningsperioden bara är en dryg vecka, ett par månader före provet. Missar du den går det inte att anmäla sig i efterhand.

Vårprovet skrivs alltid på en lördag i april och höstprovet på en söndag i oktober. Alla datum finns på [provdatumsidan](https://tvakommanollan.se/hogskoleprovet-datum).`,
  },
  {
    category: "provdagen",
    title: "Vad ska man ta med till högskoleprovet?",
    question: `Vad behöver man ha med sig på provdagen, och vad är inte tillåtet?`,
    answer: `Det viktigaste är **giltig legitimation**. Utan den får du inte skriva. Kallelsen säger var och när du ska vara, läs den noga dagen innan.

Bra att ha med:
- Legitimation
- Kallelsen eller informationen om var du skriver
- Pennor och suddgummi
- Klocka utan smarta funktioner, om du vill ha koll på tiden själv
- Mat och vatten för en hel dag. Provet håller på från morgon till eftermiddag med pauser.

Mobiler och smarta klockor får inte användas under provet. Exakt vad som gäller står i reglerna från provets arrangör, så kolla dem inför varje tillfälle. Reglerna kan ändras.`,
  },
  {
    category: "provdagen",
    title: "När kommer facit och resultat efter högskoleprovet?",
    question: `Hur lång tid efter provet kommer facit, normering och det riktiga resultatet?`,
    answer: `Ordningen är densamma varje termin:

1. **Facit** publiceras kort efter provdagen. Då kan du räkna antal rätt själv.
2. **Normeringstabellen** kommer några veckor senare. Först då går antal rätt att omvandla till en poäng.
3. **Resultatet** syns sedan på ditt konto hos hogskoleprov.nu.

Medan du väntar kan du jämföra med tidigare terminers normeringar. Vi lägger upp facit och en uppskattad trolig normering på [facitsidan](https://tvakommanollan.se/hogskoleprovet-facit) efter varje prov. Uppskattningen är vår egen och inte provarrangörens besked.`,
  },
  {
    category: "provdagen",
    title: "Hur många rätt krävs för 2,0 på högskoleprovet?",
    question: `Hur många rätt behöver man ha på verbal och kvant för att få högsta poäng?`,
    answer: `Det varierar mellan provtillfällena, eftersom varje prov normeras för sig. De senaste åren har det ofta krävts **runt 75–78 rätt av 80** på en del för att få 2,0 just där.

Eftersom totalpoängen är medelvärdet av verbal och kvant behöver du 2,0 på **båda** delarna för 2,0 totalt. 2,0 verbalt och 1,9 kvantitativt ger alltså 1,95.

Gränserna för de senaste proven finns i [facit och normering](https://tvakommanollan.se/hogskoleprovet-facit), och du kan räkna på din egen poäng i [poängräknaren](https://tvakommanollan.se/hogskoleprovet-poangraknare).`,
  },
  {
    category: "provdagen",
    title: "Höstprovet 2026: hur gick det?",
    question: `Höstprovet skrevs söndagen den 18 oktober 2026. Hur kändes det? Vilka delar var svåra? Skriv gärna hur det gick för dig. Facit och vår uppskattning av normeringen finns på [facitsidan](https://tvakommanollan.se/hogskoleprovet-facit).`,
    answer: `Några saker som är bra att veta medan ni väntar:

- Räkna antal rätt per del (verbal och kvant, max 80 var) med facit. Kom ihåg att ett av passen var utprövning och inte räknas.
- Normeringen kommer om några veckor. Fram till dess är alla poänggissningar just gissningar, även våra.
- Gick det sämre än du hoppats: resultatet gäller i åtta år och bästa resultatet räknas. Vårprovet skrivs den 10 april 2027, och anmälan är öppen 7–14 januari.

Dela gärna era tankar om provet här nedanför.`,
  },
  {
    category: "provdagen",
    title: "Hur vet man vilket provpass som var utprövningspasset?",
    question: `Ett av de fem passen räknas inte. Går det att lista ut vilket?`,
    answer: `Nej, inte under provdagen. Utprövningspasset ser ut precis som de andra och kan vara antingen verbalt eller kvantitativt. Därför ska du göra ditt bästa på alla fem.

Efter provet framgår det när facit publiceras: de pass som räknas har facit, utprövningspasset har det inte. Har du skrivit tre verbala pass var ett av dem utprövning, och samma sak gäller om du hade tre kvantitativa.

Ett tips är att inte låta ett pass som gick dåligt påverka resten av dagen. Det kan mycket väl vara det som inte räknas.`,
  },
  {
    category: "provdagen",
    title: "Hur fungerar normeringen av högskoleprovet?",
    question: `Varför ger samma antal rätt olika poäng olika år?`,
    answer: `Normeringen finns för att ett resultat ska betyda samma sak oavsett vilket prov du skrev. Är ett prov svårare än vanligt sjunker antalet rätt för alla, och då ger färre rätt samma poäng som tidigare.

Varje del, verbal och kvantitativ, normeras för sig till 0,00–2,00. Totalpoängen är medelvärdet av de två.

Två följder som är bra att känna till:
- Tabellen är inte rak. Toppen är trång, så några få rätt kan skilja 1,8 från 2,0.
- Du kan inte jämföra antal rätt rakt av mellan två provtillfällen. Jämför poängen.

Med normeringstabellerna för tidigare prov kan du räkna fram poängen på ett gammalt prov du skrivit. Det gör sajten åt dig i [gamla prov](https://tvakommanollan.se/gamla-prov).`,
  },

  /* ── Plugg, motivation & studieteknik ────────────────────────── */
  {
    category: "plugg",
    title: "Hur lång tid behöver man plugga inför högskoleprovet?",
    question: `Hur många veckor innan ska man börja plugga, och hur mycket per dag?`,
    answer: `Det beror på var du startar och var du vill landa, men en riktlinje som fungerar för många:

- **2–3 månader** med 30–60 minuter om dagen räcker långt för de flesta.
- **Sista månaden** bör innehålla flera hela prov på tid.
- **Sista veckan** är för repetition och vila, inte för nytt stoff.

Börja med att skriva ett [gammalt prov](https://tvakommanollan.se/gamla-prov) på riktig tid. Då ser du direkt vilka delprov som drar ner dig, och kan lägga tiden där den gör mest nytta. Ofta är det ORD och KVA som ger flest poäng per pluggtimme.`,
  },
  {
    category: "plugg",
    title: "Hur lägger man upp ett studieschema för högskoleprovet?",
    question: `Hur ska en vanlig pluggvecka se ut inför högskoleprovet?`,
    answer: `Ett exempel på en vecka med ungefär 45 minuter om dagen:

- **Måndag:** ORD 15 min + KVA 30 min
- **Tisdag:** ORD 15 min + LÄS 30 min
- **Onsdag:** ORD 15 min + XYZ 30 min
- **Torsdag:** ORD 15 min + MEK och ELF 30 min
- **Fredag:** ORD 15 min + NOG och DTK 30 min
- **Lördag:** ett helt provpass på tid, och genomgång av felen
- **Söndag:** vila

ORD varje dag eftersom ordförrådet byggs upp av repetition. Genomgången av felen är viktigare än själva passet: skriv upp **varför** du svarade fel, inte bara vad som var rätt.

Vill du ha ett upplägg anpassat efter dina resultat finns [studieupplägget](https://tvakommanollan.se/) på startsidan.`,
  },
  {
    category: "plugg",
    title: "Hur höjer man sig från 1,0 till 1,5 på högskoleprovet?",
    question: `Jag ligger runt 1,0. Vad ska jag fokusera på för att nå 1,5?`,
    answer: `Från 1,0 till 1,5 handlar det mest om att plocka de uppgifter du **borde** klara, inte de svåraste.

1. **Gissa på allt.** Lämnar du tomma rutor är det den snabbaste höjningen som finns.
2. **ORD.** Ett par veckor med daglig ordträning ger märkbart fler rätt.
3. **Lär dig svarsalternativen på KVA och NOG** utantill, så att ingen tid går åt till att läsa dem.
4. **Tidsplan.** Många på 1,0-nivå hinner inte klart. Träna på att hoppa över och komma tillbaka.
5. **Gå igenom dina fel** efter varje övningspass. Samma typ av fel brukar återkomma.

Skriv ett helt prov på tid var tredje vecka och följ poängen. Sajten räknar ut den åt dig i [gamla prov](https://tvakommanollan.se/gamla-prov).`,
  },
  {
    category: "plugg",
    title: "Är gamla högskoleprov det bästa sättet att plugga?",
    question: `Räcker det att göra gamla prov, eller behöver man annat material också?`,
    answer: `Gamla prov är det **närmaste du kommer det riktiga provet**: samma uppgiftstyper, samma svårighet och samma tidspress. De är oumbärliga, men det finns två fällor:

- **Att bara göra prov utan att gå igenom felen.** Det är i genomgången du lär dig.
- **Att göra slut på proven för tidigt.** Spara några av de senaste till sista månaden, så att du har ett ärligt mått på var du står.

Komplettera gärna med riktad träning på det som drar ner dig, till exempel ORD i [ordövningen](https://tvakommanollan.se/ord) eller MEK i [MEK-övningen](https://tvakommanollan.se/mek-ovning).

Alla prov från 2012 och framåt, med facit och poängräkning, finns i [gamla prov](https://tvakommanollan.se/gamla-prov).`,
  },
  {
    category: "plugg",
    title: "Hur håller man motivationen uppe när man pluggar till högskoleprovet?",
    question: `Det är svårt att hålla igång i flera månader. Hur gör ni för att orka?`,
    answer: `Några saker som brukar fungera:

- **Korta pass varje dag** slår långa pass ibland. 20 minuter är lättare att komma igång med än två timmar.
- **Mät framstegen.** Att se poängen gå upp på gamla prov är den bästa motivationen som finns.
- **Gör det socialt.** Plugga med en kompis eller kör en [match](https://tvakommanollan.se/matchmaking) mot någon. Det är svårare att skippa när någon annan väntar.
- **Ha ett tydligt mål.** Skriv upp vilken utbildning du siktar på och vilken poäng den krävde senast.
- **Ta lediga dagar.** Vila är en del av planen, inte ett misslyckande.

Hur gör ni? Dela gärna det som fungerar för er.`,
  },
  {
    category: "plugg",
    title: "Vad ska man göra dagen innan högskoleprovet?",
    question: `Ska man plugga dagen innan provet eller vila?`,
    answer: `**Vila.** Det du inte kan dagen innan lär du dig inte heller på en kväll, men du kan bli trött av att försöka.

- Gå lätt igenom de ord och formler du redan kan, högst en halvtimme.
- Packa legitimation, kallelse, pennor, mat och vatten kvällen innan.
- Kolla hur du tar dig till provlokalen och hur lång tid det tar.
- Sov ordentligt. Provet är en lång dag.

På provdagen: ät frukost, var på plats i god tid, och glöm ett pass så fort det är slut. Ett pass som kändes dåligt kan vara utprövningspasset.`,
  },

  /* ── Antagning per program (siffrorna ur hogskoleprovet-poang_.$program.tsx) ── */
  {
    category: "provdagen",
    title: "Vilket HP-resultat krävs för läkarprogrammet?",
    question: `Hur högt behöver man ligga på högskoleprovet för att komma in på läkarprogrammet?`,
    answer: `Läkarprogrammet hör till de svåraste utbildningarna att komma in på via provet. Antagningspoängen i HP-gruppen till hösten 2026 enligt UHR:s statistik:

- Lunds universitet: **1,80**
- Karolinska institutet: **1,75**
- Uppsala universitet: **1,75**
- Göteborgs universitet: **1,70**
- Linköpings universitet: **1,65**
- Örebro universitet: **1,65**

Gränserna flyttar sig något varje termin. Räkna med att behöva ligga på 1,7 eller högre för att ha en bra chans på de flesta orter.

Karolinska antar dessutom en del platser via PIL, ett eget urval med prov och intervjuer. Där är ett starkt provresultat vägen in till nästa steg.

Hela tabellen finns på [poängsidan för läkarprogrammet](https://tvakommanollan.se/hogskoleprovet-poang/lakarprogrammet).`,
  },
  {
    category: "provdagen",
    title: "Vilket HP-resultat krävs för psykologprogrammet?",
    question: `Vad behöver man på högskoleprovet för att komma in på psykologprogrammet?`,
    answer: `Psykologprogrammet ges vid elva lärosäten, och kraven skiljer sig mycket mellan orterna. Antagningspoäng i HP-gruppen till hösten 2026 enligt UHR:

- Lund: **1,70**
- Uppsala: **1,65**
- Göteborg: **1,60**
- Stockholm: **1,55**
- Karolinska institutet och Linköping: **1,50**
- Karlstad, Växjö och Örebro: **1,45**
- Östersund: **1,30**
- Luleå: **1,25**

Är du flexibel med orten kan det alltså skilja nästan en halv poäng. Hela listan finns på [poängsidan för psykologprogrammet](https://tvakommanollan.se/hogskoleprovet-poang/psykologprogrammet).`,
  },
  {
    category: "provdagen",
    title: "Vilket HP-resultat krävs för juristprogrammet?",
    question: `Hur högt måste man ligga på högskoleprovet för juristprogrammet?`,
    answer: `Juristprogrammet är enligt UHR det program som har flest behöriga sökande i landet. Antagningspoäng i HP-gruppen till hösten 2026:

- Lunds universitet: **1,60**
- Uppsala universitet: **1,50**
- Göteborgs universitet: **1,40**
- Stockholms universitet: **1,40**
- Karlstads universitet: **1,25**
- Örebro universitet: **1,25**

Se [poängsidan för juristprogrammet](https://tvakommanollan.se/hogskoleprovet-poang/juristprogrammet) för källor och uppdateringar.`,
  },
  {
    category: "provdagen",
    title: "Vilket HP-resultat krävs för Handelshögskolan i Stockholm?",
    question: `Vad krävs på högskoleprovet för civilekonomprogrammet på Handels?`,
    answer: `Handelshögskolan i Stockholm har en HP-kvot som blivit svårare för varje år. Antagningspoängen enligt skolans egen statistik:

- 2026: **1,95**
- 2025: **1,85**
- 2024: **1,85**
- 2023: **1,80**
- 2022: **1,75**
- 2021: **1,75**

1,95 betyder i praktiken 2,0 på den ena delen och 1,9 på den andra. Sedan 2025 räknar skolan också in meritpoäng i betygsurvalet, men det påverkar inte HP-kravet.

Mer på [poängsidan för Handelshögskolan](https://tvakommanollan.se/hogskoleprovet-poang/civilekonom).`,
  },
  {
    category: "provdagen",
    title: "Vilket HP-resultat krävs för teknisk fysik på KTH och LTH?",
    question: `Hur högt ligger antagningen till teknisk fysik via högskoleprovet?`,
    answer: `Till hösten 2026 låg antagningspoängen i HP-gruppen på **1,80** både på KTH och på Lunds tekniska högskola.

Teknisk fysik är ett av de tyngsta civilingenjörsprogrammen. Det kvantitativa provet är därför extra viktigt att träna på, men kom ihåg att totalpoängen är medelvärdet av båda delarna. Ett svagt verbalt resultat drar ner lika mycket.

Mer på [poängsidan för teknisk fysik](https://tvakommanollan.se/hogskoleprovet-poang/teknisk-fysik).`,
  },
  {
    category: "provdagen",
    title: "Vilket HP-resultat krävs för tandläkarprogrammet?",
    question: `Vad behöver man på högskoleprovet för att komma in på tandläkarprogrammet?`,
    answer: `Tandläkarprogrammet ges vid tre lärosäten, och kraven ligger tätt ihop. Antagningspoäng i HP-gruppen till hösten 2026 enligt UHR:

- Göteborgs universitet: **1,45**
- Karolinska institutet (Huddinge): **1,45**
- Malmö universitet: **1,40**

Mer på [poängsidan för tandläkarprogrammet](https://tvakommanollan.se/hogskoleprovet-poang/tandlakarprogrammet).`,
  },
  {
    category: "provdagen",
    title: "Vilket HP-resultat krävs för sjuksköterskeprogrammet?",
    question: `Hur högt måste man ligga på högskoleprovet för att komma in på sjuksköterskeprogrammet?`,
    answer: `Det skiljer sig väldigt mycket mellan orterna. Några exempel på antagningspoäng i HP-gruppen till hösten 2026 enligt UHR:

- Uppsala universitet, Uppsala: **1,10**
- Umeå universitet, Umeå: **0,85**
- Uppsala universitet, Campus Gotland: **0,65**
- Blekinge tekniska högskola, Karlskrona: **0,50**
- Umeå universitet, decentraliserat i Skellefteå: **0,45**

Är du flexibel med studieort kan du alltså komma in med ett betydligt lägre resultat. Se [poängsidan för sjuksköterskeprogrammet](https://tvakommanollan.se/hogskoleprovet-poang/sjukskoterskeprogrammet).`,
  },

  /* ── Fler allmänna frågor ────────────────────────────────────── */
  {
    category: "allmant",
    title: "Kan man skriva högskoleprovet när man går i gymnasiet?",
    question: `Får man skriva högskoleprovet innan man tagit studenten?`,
    answer: `Ja. Det finns ingen åldersgräns och inget krav på att du ska vara klar med gymnasiet. Många skriver provet första gången i tvåan eller trean.

Resultatet gäller i åtta år, så ett prov du skriver i gymnasiet kan användas när du söker senare. Och eftersom bästa resultatet räknas kostar det ingenting att skriva tidigt. Det enda du riskerar är provavgiften.

Tänk på att du fortfarande måste vara **behörig** till utbildningen du söker. Provet ersätter inte behörigheten, det är bara ett sätt att konkurrera om platserna.`,
  },
  {
    category: "allmant",
    title: "Vilken del av högskoleprovet är lättast att höja sig på?",
    question: `Om man har begränsat med tid, vilken del ger mest poäng per pluggtimme?`,
    answer: `För de flesta är svaret **ORD**. Ordförrådet går att bygga upp på några veckor, och provet testar samma sorts ord varje gång.

Efter det brukar **KVA och NOG** ge mycket. Uppgiftstyperna är snäva, och när du kan fällorna går det snabbt. Se trådarna om [KVA](https://tvakommanollan.se/guider/kva) och [NOG](https://tvakommanollan.se/guider/nog).

**LÄS och ELF** tar längst tid att förbättra, eftersom det handlar om läsvana.

Men det bästa svaret är ditt eget: skriv ett [gammalt prov](https://tvakommanollan.se/gamla-prov) på tid och se vilket delprov som har flest fel. Där finns poängen att hämta.`,
  },
  {
    category: "allmant",
    title: "Hur många ord behöver man kunna till ORD-delen?",
    question: `Finns det ett ungefärligt antal ord man bör kunna inför högskoleprovet?`,
    answer: `Det finns inget fast antal. Varje prov testar 20 ord, och av de 600 orden på proven 2012–2026 har inget testats två gånger. Att plugga in just de gamla orden räcker alltså inte. Det som lönar sig är att bygga upp ett brett ordförråd av samma sort: ordlistan på sajten har över 8 700 sådana ord med förklaringar.

Ett rimligt mål är inte att kunna alla, utan att:
1. Kunna de vanligaste lånorden och förleden (se tråden om förled i verbala delen).
2. Gå igenom några hundra ord ur gamla prov med repetition.
3. Läsa mer sakprosa, så att fler ord känns bekanta.

Börja i [ordlistan](https://tvakommanollan.se/ordlista) eller i [ordövningen](https://tvakommanollan.se/ord).`,
  },
  {
    category: "provdagen",
    title: "Kan man få anpassning på högskoleprovet vid dyslexi eller annan funktionsnedsättning?",
    question: `Finns det möjlighet till förlängd tid eller andra anpassningar på högskoleprovet?`,
    answer: `Ja. Det går att ansöka om anpassat provgenomförande, till exempel vid dyslexi, synnedsättning eller annan funktionsnedsättning. Ansökan görs i samband med anmälan och kräver intyg.

Vilka anpassningar som finns och vad som krävs i ansökan står på hogskoleprov.nu. Läs där i god tid före anmälningsperioden.

Har du själv skrivit med anpassning får du gärna berätta hur det gick till.`,
  },
  {
    category: "plugg",
    title: "Hur går man igenom ett gammalt prov på bästa sätt?",
    question: `Jag har gjort ett gammalt högskoleprov. Hur ska jag gå igenom felen för att lära mig mest?`,
    answer: `Genomgången är viktigare än själva provet. Ett sätt som fungerar:

1. **Rätta och räkna poängen** per delprov. Sajten gör det åt dig i [gamla prov](https://tvakommanollan.se/gamla-prov).
2. **Sortera felen** i tre högar: visste inte hur, slarvfel, och hann inte.
3. **Visste inte hur:** lös uppgiften igen med facit bredvid och skriv upp metoden.
4. **Slarvfel:** skriv upp exakt vad som gick fel, till exempel "läste fel enhet" eller "glömde negativa tal". Det är ofta samma fel om och om igen.
5. **Hann inte:** titta på var tiden tog slut och vilken uppgift som åt den.

Gå igenom samma lista innan nästa prov. De flesta upptäcker att två eller tre feltyper står för nästan alla tappade poäng.`,
  },
  {
    category: "kvantitativ",
    title: "När är svaret D på KVA?",
    question: `Hur vet man när informationen är otillräcklig på kvantitativa jämförelser?`,
    answer: `Svaret är **D** när du kan hitta två tillåtna fall som ger olika svar. Det räcker att visa att det **kan** gå åt båda hållen.

Tecken på att D kan vara rätt:
- En variabel som inte är bestämd, särskilt om den kan vara negativ eller ett bråk.
- En kvantitet beskriven som "ett tal som …" i stället för ett bestämt tal.
- Ett medelvärde eller ett förhållande utan att de enskilda värdena är kända.

Tecken på att D är fel:
- Båda kvantiteterna är fasta tal. Då kan svaret aldrig vara D.
- Variabeln försvinner när du förenklar.

Exempel ur riktiga prov finns i genomgångarna här i kategorin, till exempel uppgifterna från vårprovet 2026. Mer i [KVA-guiden](https://tvakommanollan.se/guider/kva).`,
  },
  {
    category: "kvantitativ",
    title: "Skillnaden mellan C och D på NOG",
    question: `På NOG blandar jag ihop "(1) tillsammans med (2)" och "(1) och (2) var för sig". Hur ska man tänka?`,
    answer: `De betyder nästan motsatta saker:

- **C, (1) tillsammans med (2):** inget av påståendena räcker ensamt, men båda **tillsammans** gör det.
- **D, (1) och (2) var för sig:** **vart och ett** av påståendena räcker ensamt.

Ordningen att pröva i avgör allt. Pröva först (1) ensamt. Pröva sedan (2) ensamt, och glöm (1) under tiden. Räckte båda är det D. Räckte bara den ena är det A eller B. Först om ingen räckte ensam prövar du dem tillsammans, och då blir det C eller E.

Den vanligaste missen är att svara C fast ett av påståendena räckte ensamt, eftersom man läst båda innan man tänkt efter. Mer i [NOG-guiden](https://tvakommanollan.se/guider/nog).`,
  },

  /* ── Matteområden (2026-10-26) ───────────────────────────────── */
  {
    category: "kvantitativ",
    title: "Kvadreringsreglerna och konjugatregeln på högskoleprovet",
    question: `Hur används kvadreringsreglerna och konjugatregeln på XYZ och KVA?`,
    answer: String.raw`Tre regler som dyker upp på nästan varje kvantitativt pass:

- $(a + b)^2 = a^2 + 2ab + b^2$
- $(a - b)^2 = a^2 - 2ab + b^2$
- $(a + b)(a - b) = a^2 - b^2$ (konjugatregeln)

**Var de används:**
- **Förenkling.** $\frac{x^2 - 9}{x - 3} = \frac{(x+3)(x-3)}{x-3} = x + 3$.
- **Huvudräkning.** $51 \cdot 49 = (50 + 1)(50 - 1) = 2500 - 1 = 2499$.
- **Jämförelser på KVA.** $(a + b)^2$ och $a^2 + b^2$ skiljer sig med $2ab$. Är $a$ och $b$ positiva är den första alltid störst.

Den vanligaste missen är att tro att $(a + b)^2 = a^2 + b^2$. Det stämmer bara om $a$ eller $b$ är noll.`,
  },
  {
    category: "kvantitativ",
    title: "Sannolikhet på högskoleprovet: så räknar du",
    question: `Hur löser man sannolikhetsuppgifter på XYZ utan att det blir rörigt?`,
    answer: String.raw`Grundformeln: **sannolikhet = gynnsamma utfall / möjliga utfall**, när alla utfall är lika sannolika.

**Tre fall som täcker det mesta:**

1. **Ett försök.** En vanlig tärning: sannolikheten för en sexa är $\frac{1}{6}$.
2. **Flera oberoende försök, "och".** Multiplicera. Två sexor i rad: $\frac{1}{6} \cdot \frac{1}{6} = \frac{1}{36}$.
3. **Dragning utan återläggning.** Nämnaren minskar för varje dragning. Två röda kulor ur en påse med 3 röda och 2 blå: $\frac{3}{5} \cdot \frac{2}{4} = \frac{3}{10}$.

**Knep: räkna motsatsen.** "Minst en sexa på två kast" är lättare som $1 - $ "ingen sexa": $1 - \frac{5}{6} \cdot \frac{5}{6} = 1 - \frac{25}{36} = \frac{11}{36}$.

Läs alltid efter vad som redan har plockats bort eller är känt. Det är där provet lägger sina fällor. Genomgångarna av riktiga provuppgifter här i kategorin har flera exempel.`,
  },
  {
    category: "kvantitativ",
    title: "Räta linjens ekvation y = kx + m på högskoleprovet",
    question: `Vad behöver man kunna om räta linjer och funktioner till högskoleprovet?`,
    answer: String.raw`I $y = kx + m$ är $k$ lutningen och $m$ där linjen skär y-axeln.

**Det här räcker långt:**
- **Lutningen ur två punkter:** $k = \frac{y_2 - y_1}{x_2 - x_1}$. Linjen genom $(1, 2)$ och $(3, 8)$ har $k = \frac{6}{2} = 3$.
- **Skärning med y-axeln:** sätt $x = 0$, då är $y = m$.
- **Skärning med x-axeln:** sätt $y = 0$ och lös ut $x$.
- **Två linjers skärningspunkt:** sätt uttrycken lika. $2x + 1 = -x + 4$ ger $x = 1$.
- **Parallella linjer** har samma $k$.

**Tecknen säger mycket:** $k < 0$ betyder att linjen lutar nedåt, och $m > 0$ att den skär y-axeln ovanför origo. Många KVA-uppgifter går att lösa med en snabb skiss i stället för uträkning.`,
  },
  {
    category: "kvantitativ",
    title: "Bråkräkning utan miniräknare: snabba metoder",
    question: `Hur räknar man med bråk snabbt på högskoleprovet?`,
    answer: String.raw`**Addition och subtraktion:** gemensam nämnare. $\frac{1}{4} + \frac{1}{6} = \frac{3}{12} + \frac{2}{12} = \frac{5}{12}$.

**Multiplikation:** täljare gånger täljare, nämnare gånger nämnare. Förkorta **innan** du multiplicerar: $\frac{6}{25} \cdot \frac{5}{36} = \frac{1}{5} \cdot \frac{1}{6} = \frac{1}{30}$.

**Division:** multiplicera med det inverterade. $\frac{2}{3} / \frac{4}{9} = \frac{2}{3} \cdot \frac{9}{4} = \frac{3}{2}$.

**Jämföra bråk:** korsmultiplicera. Är $\frac{5}{8}$ större än $\frac{7}{11}$? Jämför $5 \cdot 11 = 55$ med $7 \cdot 8 = 56$. Det andra är större.

**Bra att kunna utantill:**
- $\frac{1}{8} = 0{,}125$
- $\frac{1}{6} \approx 0{,}167$
- $\frac{1}{3} \approx 0{,}333$
- $\frac{3}{8} = 0{,}375$
- $\frac{5}{8} = 0{,}625$

Delar man med ett bråk mindre än 1 blir svaret större. Det räcker ofta för att stryka hälften av alternativen.`,
  },
  {
    category: "kvantitativ",
    title: "Medelvärde och median: skillnaden och fällorna",
    question: `Hur skiljer sig medelvärde och median, och hur dyker de upp på provet?`,
    answer: String.raw`**Medelvärdet** är summan delad med antalet. **Medianen** är det mittersta värdet när talen står i storleksordning. Med ett jämnt antal tal är medianen medelvärdet av de två mittersta.

Exempel: 2, 3, 4, 10, 81.
- Medelvärde: $\frac{100}{5} = 20$
- Median: 4

**Fällorna:**
1. **Osorterade serier.** Sortera alltid innan du letar median.
2. **Ett extremt värde** drar iväg medelvärdet men rör knappt medianen.
3. **Medelvärdet säger inget om medianen.** Tio tal med medelvärdet 0 kan ha nästan vilken median som helst. Svaret på en sådan KVA blir ofta D.
4. **Nytt värde i en serie.** Räkna med summan: har fem tal medelvärdet 8 är summan 40.

Se tråden om medelvärde för fler snabba metoder.`,
  },
  {
    category: "kvantitativ",
    title: "Hastighet, sträcka och tid på högskoleprovet",
    question: `Hur löser man uppgifter med hastighet, sträcka och tid snabbt?`,
    answer: String.raw`Allt bygger på **sträcka = hastighet · tid**.

**Byt enhet först.** 1 m/s är 3,6 km/h. 20 m/s är alltså 72 km/h.

**Medelhastighet är total sträcka delad med total tid**, inte medelvärdet av hastigheterna. Kör du 60 km i 60 km/h och sedan 60 km i 30 km/h tar det 1 + 2 = 3 timmar för 120 km. Medelhastigheten är 40 km/h, inte 45.

**Om farten ändras med en faktor ändras tiden med det inverterade.** Fyra gånger så fort tar en fjärdedel av tiden. Det är en vanlig NOG-genväg.

**Två personer mot varandra:** lägg ihop hastigheterna. 4 km/h och 6 km/h som går mot varandra från 10 km avstånd möts efter 1 timme.`,
  },
  {
    category: "kvantitativ",
    title: "Primtal, delbarhet och rester på högskoleprovet",
    question: `Vad behöver man kunna om primtal och delbarhet till kvanten?`,
    answer: String.raw`**Primtal** är tal större än 1 som bara är delbara med 1 och sig själva: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29 … 2 är det enda jämna primtalet, och 1 är inget primtal.

**Primtalsfaktorisering** löser många uppgifter: $42 = 2 \cdot 3 \cdot 7$ och $72 = 2^3 \cdot 3^2$.

**Delbarhetsregler:**
- med 2: sista siffran är jämn
- med 3: siffersumman är delbar med 3 ($1 + 2 + 6 = 9$, så 126 är delbart med 3)
- med 5: slutar på 0 eller 5
- med 9: siffersumman är delbar med 9

**Rester:** "rest 4 vid division med 5" betyder att talet är 4, 9, 14, 19 … Skriv upp listan och leta efter tal som uppfyller flera villkor samtidigt. Det är så de flesta NOG-uppgifter med grupper och rester löses.`,
  },
  {
    category: "kvantitativ",
    title: "Ekvationssystem på högskoleprovet",
    question: `Hur löser man ekvationssystem snabbt på XYZ och NOG?`,
    answer: String.raw`Två metoder räcker:

**Addition.** $x + y = 33$ och $x - y = 7$. Lägg ihop: $2x = 40$, så $x = 20$ och $y = 13$.

**Insättning.** $y = 2x$ och $x + y = 12$. Sätt in: $3x = 12$, så $x = 4$.

**Ofta behövs inte varje variabel.** Frågar uppgiften efter $x + y$ kan svaret finnas direkt i ett av påståendena. Lös inte ut mer än vad som efterfrågas.

**På NOG:** två oberoende ekvationer med två obekanta räcker normalt. Men se upp när ekvationerna egentligen säger samma sak, som $x + y = 5$ och $2x + 2y = 10$. Då räcker de inte.`,
  },
  {
    category: "kvantitativ",
    title: "Rötter och kvadratrötter utan miniräknare",
    question: `Hur förenklar och uppskattar man rötter på högskoleprovet?`,
    answer: String.raw`**Förenkla genom att bryta ut kvadrater:** $\sqrt{72} = \sqrt{36 \cdot 2} = 6\sqrt{2}$ och $\sqrt{27} = 3\sqrt{3}$.

**Räknelagar:**
- $\sqrt{a} \cdot \sqrt{b} = \sqrt{ab}$
- $\frac{\sqrt{a}}{\sqrt{b}} = \sqrt{\frac{a}{b}}$
- $\sqrt{a + b}$ är **inte** $\sqrt{a} + \sqrt{b}$

**Uppskatta:** $\sqrt{50}$ ligger mellan 7 ($\sqrt{49}$) och 8 ($\sqrt{64}$), nära 7. Kunna kvadraterna upp till $15^2 = 225$ utantill lönar sig.

**Bra att kunna:** $\sqrt{2} \approx 1{,}41$, $\sqrt{3} \approx 1{,}73$, $\sqrt{5} \approx 2{,}24$.

**Rötter i nämnaren:** $\frac{1}{\sqrt{2}} = \frac{\sqrt{2}}{2}$. Svarsalternativen står ofta på den formen.`,
  },
  {
    category: "kvantitativ",
    title: "Enhetsomvandling på högskoleprovet: längd, area och volym",
    question: `Jag tappar poäng på enheter. Vilka omvandlingar ska man kunna?`,
    answer: String.raw`**Längd:** 1 m = 10 dm = 100 cm = 1 000 mm.

**Area: kvadrera faktorn.** 1 m² = 100 dm² = 10 000 cm².

**Volym: kubera faktorn.** 1 m³ = 1 000 dm³ = 1 000 000 cm³.

**Volym och liter:** 1 dm³ = 1 liter, och 1 cm³ = 1 ml.

**Tid och fart:** 1 timme = 3 600 sekunder, och 1 m/s = 3,6 km/h.

**Metoden:** byt till den enhet svaret står i **innan** du räknar. Ett rätblock som är 2 m, 2 dm och 2 mm blir 200 cm, 20 cm och 0,2 cm, och volymen 800 cm³. Att byta enhet i slutet ger fler fel.`,
  },

  /* ── Verbala tekniker (2026-10-26) ───────────────────────────── */
  {
    category: "verbal",
    title: "Signalord på MEK och ELF: men, därför, trots och de andra",
    question: `Vilka signalord ska man leta efter på meningskomplettering och engelska luckuppgifter?`,
    answer: `Signalorden säger om luckan ska hålla med texten eller gå emot den.

**Motsats (luckan går emot det som står före):**
- svenska: *men*, *däremot*, *trots*, *ändå*, *tvärtom*, *emellertid*
- engelska: *but*, *however*, *although*, *despite*, *yet*, *whereas*

**Fortsättning eller förstärkning (luckan håller med):**
- svenska: *dessutom*, *även*, *likaså*, *och*
- engelska: *moreover*, *also*, *furthermore*, *in addition*

**Orsak och följd:**
- svenska: *därför*, *alltså*, *eftersom*, *följaktligen*
- engelska: *therefore*, *thus*, *because*, *consequently*

Ringa in signalordet innan du läser alternativen. Det stryker ofta hälften av dem direkt. Öva på [MEK-övningen](https://tvakommanollan.se/mek-ovning).`,
  },
  {
    category: "verbal",
    title: "Hur läser man snabbare på högskoleprovet utan att missa detaljer?",
    question: `Jag läser för långsamt på LÄS och ELF. Går det att träna upp läshastigheten?`,
    answer: `Ja, men målet är inte att läsa allt snabbare. Det är att läsa **rätt delar** noga.

1. **Läs inledning och avslutning ordentligt.** Där står ofta textens huvudpoäng.
2. **Skumma mitten första gången.** Notera bara vad varje stycke handlar om.
3. **Läs frågan och gå tillbaka** till det stycke som svaret finns i. Läs det noga.
4. **Hoppa inte över ord som *inte*, *bara* och *alltid*.** De vänder på betydelsen.

Läsvana är det som verkligen höjer tempot. 20 minuter sakprosa om dagen, gärna populärvetenskap och längre tidningsartiklar på både svenska och engelska, gör mer än någon teknik.

Läs mer i [LÄS-guiden](https://tvakommanollan.se/guider/las) och [ELF-guiden](https://tvakommanollan.se/guider/elf).`,
  },

  /* ── Allmänt (2026-10-26) ────────────────────────────────────── */
  {
    category: "allmant",
    title: "Är högskoleprovet svårt?",
    question: `Hur svårt är högskoleprovet egentligen, och vad gör det svårt?`,
    answer: `Uppgifterna i sig är sällan svåra. Matten bygger på grundskolan och gymnasiets första kurs, och texterna är vanlig sakprosa. Det som gör provet svårt är tre saker:

1. **Tidspressen.** 40 uppgifter på 55 minuter, fem pass under en dag.
2. **Fällorna.** Svarsalternativen är byggda för att fånga vanliga misstag.
3. **Normeringen.** Poängen jämför dig med alla andra som skrev. För de högsta poängen krävs nästan fullt.

Det goda är att alla tre går att träna. Den som skrivit några gamla prov på tid och gått igenom felen vet vad som väntar och tappar mindre på tid och fällor.

Börja med ett [gammalt prov](https://tvakommanollan.se/gamla-prov) för att se var du står.`,
  },
  {
    category: "allmant",
    title: "Tio tips inför högskoleprovet",
    question: `Vilka är de viktigaste tipsen inför högskoleprovet?`,
    answer: `1. **Gissa på allt.** Fel svar ger inget avdrag.
2. **Lär dig svarsalternativen på KVA och NOG utantill**, så att ingen tid går åt till att läsa dem.
3. **Hoppa över och kom tillbaka.** Fastna aldrig på en uppgift.
4. **Skriv gamla prov på riktig tid**, inte bara uppgifter i lugn och ro.
5. **Gå igenom varje fel** och skriv upp varför det blev fel.
6. **Plugga ORD varje dag** i korta pass.
7. **Lita inte på figurerna** på kvanten. De är inte alltid skalenliga.
8. **Svara utifrån texten** på LÄS och ELF, inte utifrån vad du själv vet.
9. **Glöm ett dåligt pass direkt.** Det kan vara utprövningspasset, som inte räknas.
10. **Sov och ät ordentligt.** Provet är en hel dag.

Varje punkt har en egen tråd här i forumet om du vill läsa mer.`,
  },

  /* ── Kvantitativ, fler ämnen (2026-10-26) ────────────────────── */
  {
    category: "kvantitativ",
    title: "Procentuell ökning följd av minskning: varför blir det inte noll?",
    question: `Priset höjs med 20 % och sänks sedan med 20 %. Varför är det inte tillbaka där det började?`,
    answer: String.raw`Den andra procentsatsen räknas på ett **nytt** belopp. Använd förändringsfaktorer så ser du det direkt:

- Höjning med 20 % ger faktorn $1{,}2$.
- Sänkning med 20 % ger faktorn $0{,}8$.
- Tillsammans: $1{,}2 \cdot 0{,}8 = 0{,}96$, alltså **4 % lägre** än från början.

Samma sak gäller åt andra hållet: för att komma tillbaka efter en sänkning med 20 % måste du höja med 25 %, eftersom $0{,}8 \cdot 1{,}25 = 1$.

**Tumregel:** multiplicera faktorerna, lägg aldrig ihop procentsatserna. Det är den vanligaste fällan på procent i XYZ och KVA. Mer om faktorer i tråden om förändringsfaktor och procentenheter.`,
  },
  {
    category: "kvantitativ",
    title: "Upprepad procentförändring och ränta på ränta",
    question: `Hur räknar man när något ökar med samma procent flera år i rad?`,
    answer: String.raw`Upprepa förändringsfaktorn med en potens. Ökar något med 5 % per år i tre år är den sammanlagda faktorn

$$1{,}05^3 \approx 1{,}16$$

alltså ungefär 16 % mer, inte 15 %. Skillnaden är **räntan på räntan**.

Allmänt: startvärde $\cdot$ faktor$^{\text{antal perioder}}$.

**Utan miniräknare** på provet räcker oftast en uppskattning. Räkna stegvis: 100 kr blir 105, sedan ungefär 110,25, sedan ungefär 115,76. Svarsalternativen ligger sällan så nära att du behöver fler decimaler.

Minskar något med 10 % per år i två år är faktorn $0{,}9^2 = 0{,}81$, alltså **19 % lägre**, inte 20 %.`,
  },
  {
    category: "kvantitativ",
    title: "Andragradsekvationer och pq-formeln på högskoleprovet",
    question: `Hur snabbt löser man x² + px + q = 0 på XYZ?`,
    answer: String.raw`Börja med att pröva om ekvationen går att **faktorisera i huvudet**. Leta efter två tal som har produkten $q$ och summan $-p$.

Exempel: $x^2 - 6x + 8 = 0$. Talen 2 och 4 har produkten 8 och summan 6, så $x = 2$ eller $x = 4$.

Går det inte, använd pq-formeln:

$$x = -\frac{p}{2} \pm \sqrt{\left(\frac{p}{2}\right)^2 - q}$$

Exempel: $x^2 - 6x + 8 = 0$ ger $x = 3 \pm \sqrt{9 - 8} = 3 \pm 1$.

Tänk på:
- Ekvationen måste ha **högerledet 0** och $x^2$ ensamt innan du läser av $p$ och $q$.
- Är uttrycket under rottecknet negativt finns inga reella lösningar.
- Frågar uppgiften efter **summan eller produkten** av lösningarna behöver du inte lösa ekvationen: summan är $-p$ och produkten är $q$.`,
  },
  {
    category: "kvantitativ",
    title: "Förhållanden och proportioner: så delar du upp en mängd",
    question: `Hur räknar man uppgifter där något ska delas i förhållandet 3:5?`,
    answer: `Gör förhållandet till **delar**.

Exempel: 40 kr delas i förhållandet 3:5.
1. Antal delar: 3 + 5 = 8.
2. En del: 40 / 8 = 5 kr.
3. Delarna: 3 × 5 = 15 kr och 5 × 5 = 25 kr.

**Blandningar** fungerar likadant. Blandas saft och vatten 1:4 är en femtedel saft, inte en fjärdedel. Det är en klassisk fälla: förhållandet jämför delarna med varandra, andelen jämför dem med helheten.

**Proportionalitet:** går det åt 6 arbetare i 10 dagar går det åt 12 arbetare i 5 dagar, eftersom arbetsmängden (arbetare gånger dagar) är konstant. Fråga dig alltid om storheterna ökar tillsammans (rakt proportionellt) eller motverkar varandra (omvänt proportionellt).`,
  },
  {
    category: "kvantitativ",
    title: "Cirkelns area och omkrets, och skuggade områden",
    question: `Jag blir osäker på uppgifter med cirklar och skuggade ytor. Vad är det som gäller?`,
    answer: String.raw`**Formler:**
- Area: $A = \pi r^2$
- Omkrets: $O = 2\pi r$
- Diametern är $d = 2r$, och uppgifter ger ofta diametern fast formlerna vill ha radien.

**Skuggade områden** löser du nästan alltid med subtraktion: area av hela figuren minus area av den del som inte är skuggad.

Exempel: en kvadrat med sidan 4 med en inskriven cirkel (radie 2). Det skuggade hörnområdet är $16 - 4\pi$.

**Utan miniräknare:** låt $\pi$ stå kvar i svaret så länge det går. Svarsalternativen anges ofta med $\pi$.

**Cirkelsektorer:** en sektor med medelpunktsvinkeln $v$ har arean $\frac{v}{360} \cdot \pi r^2$ och bågen $\frac{v}{360} \cdot 2\pi r$.`,
  },
  {
    category: "kvantitativ",
    title: "Pythagoras sats och trianglar du bör känna igen",
    question: `Vilka trianglar och sidlängder går det att känna igen direkt på provet?`,
    answer: String.raw`Pythagoras sats: $a^2 + b^2 = c^2$, där $c$ är hypotenusan i en rätvinklig triangel.

**Pythagoreiska trianglar att känna igen** (och alla multiplar av dem):
- 3, 4, 5 (och 6, 8, 10 och 9, 12, 15)
- 5, 12, 13
- 8, 15, 17
- 7, 24, 25

**Specialtrianglar:**
- Halv kvadrat (45°, 45°, 90°): sidorna förhåller sig som $1 : 1 : \sqrt{2}$.
- Halv liksidig triangel (30°, 60°, 90°): sidorna förhåller sig som $1 : \sqrt{3} : 2$.

**Höjden i en liksidig triangel** med sidan $s$ är $\frac{\sqrt{3}}{2}s$, och arean är $\frac{\sqrt{3}}{4}s^2$.

Ser du ett 3-4-5-mönster i en figur slipper du räkna med rötter. Rita ut en höjd i en likbent triangel så får du två rätvinkliga trianglar.`,
  },
  {
    category: "kvantitativ",
    title: "Vinklar: parallella linjer, månghörningar och randvinklar",
    question: `Vilka vinkelregler behöver man kunna?`,
    answer: String.raw`**Grundreglerna:**
- Vinklarna i en triangel summerar till 180°.
- Vinklarna i en fyrhörning summerar till 360°.
- I en $n$-hörning är vinkelsumman $(n-2) \cdot 180°$. Femhörning: 540°. Sexhörning: 720°.
- En regelbunden sexhörning har vinklarna 120°.
- Vinklar på en rät linje summerar till 180° (sidovinklar).
- Topptvinklar (vertikalvinklar) är lika stora.

**Parallella linjer** som skärs av en tredje linje ger lika stora **likbelägna vinklar** och lika stora **växelvinklar**.

**Cirkelns vinklar:**
- Randvinkeln är hälften av medelpunktsvinkeln på samma båge.
- Randvinkeln över en diameter är 90°.

**En likbent triangel** har två lika stora basvinklar. Vet du toppvinkeln $v$ är varje basvinkel $\frac{180° - v}{2}$.

Rita ut alla vinklar du kan räkna fram direkt i figuren. Då dyker den du söker oftast upp av sig själv.`,
  },
  {
    category: "kvantitativ",
    title: "Kombinatorik på högskoleprovet: hur många sätt?",
    question: `Hur räknar man ut på hur många sätt något kan ordnas eller väljas?`,
    answer: String.raw`**Multiplikationsprincipen:** hör valen ihop, multiplicera. 3 tröjor och 4 byxor ger $3 \cdot 4 = 12$ klädsel.

**Ordning spelar roll (permutationer):**
- 5 personer i en rad: $5! = 5 \cdot 4 \cdot 3 \cdot 2 \cdot 1 = 120$.
- Välja och ordna 2 av 5 (t.ex. ordförande och sekreterare): $5 \cdot 4 = 20$.

**Ordning spelar ingen roll (kombinationer):** dela med antalet sätt att ordna de valda.
- Välja 2 av 5: $\frac{5 \cdot 4}{2} = 10$.
- Välja 3 av 6: $\frac{6 \cdot 5 \cdot 4}{3 \cdot 2 \cdot 1} = 20$.

**Fråga dig alltid:** blir det en ny möjlighet om jag byter plats på två av de valda? Ja betyder ordning. Nej betyder kombination.

När talen är små är det ofta snabbast att **rita ett träddiagram** eller räkna upp alla möjligheter systematiskt.`,
  },
  {
    category: "kvantitativ",
    title: "Olikheter och absolutbelopp",
    question: `Vilka fällor finns när man löser olikheter?`,
    answer: String.raw`Olikheter löses som ekvationer med **en viktig undantagsregel**: multiplicerar eller dividerar du med ett **negativt** tal vänds olikhetstecknet.

Exempel: $-2x > 6$ ger $x < -3$.

**Absolutbelopp** betyder avståndet till noll:
- $|x| = 3$ ger $x = 3$ eller $x = -3$.
- $|x| < 3$ ger $-3 < x < 3$.
- $|x| > 3$ ger $x < -3$ eller $x > 3$.

**Vanliga fällor:**
- Att glömma den negativa lösningen.
- Att multiplicera en olikhet med ett uttryck som kan vara negativt (t.ex. $x$ utan att veta tecknet).
- Att anta att $x^2 > x$ alltid gäller. Det stämmer för $x > 1$ och för $x < 0$, men inte för $0 < x < 1$.

På KVA lönar det sig att **pröva några värden** (negativt, noll, mellan 0 och 1, större än 1) innan du bestämmer dig.`,
  },
  {
    category: "kvantitativ",
    title: "Tiopotenser och standardform utan miniräknare",
    question: `Hur räknar man snabbt med stora och små tal som 3 × 10⁴?`,
    answer: String.raw`Standardform är ett tal mellan 1 och 10 gånger en tiopotens, till exempel $3{,}2 \cdot 10^4 = 32\,000$.

**Räkna med tiopotenserna för sig:**
- Multiplikation: $3 \cdot 10^4 \cdot 2 \cdot 10^3 = 6 \cdot 10^7$ (multiplicera talen, addera exponenterna).
- Division: $\frac{8 \cdot 10^6}{4 \cdot 10^2} = 2 \cdot 10^4$ (dividera talen, subtrahera exponenterna).
- Addition: gör först exponenterna lika. $2 \cdot 10^3 + 5 \cdot 10^2 = 2 \cdot 10^3 + 0{,}5 \cdot 10^3 = 2{,}5 \cdot 10^3$.

**Små tal:** negativ exponent flyttar kommat åt vänster. $4 \cdot 10^{-3} = 0{,}004$.

**Prefix som återkommer:** kilo = $10^3$, mega = $10^6$, giga = $10^9$, milli = $10^{-3}$, mikro = $10^{-6}$.

Svarsalternativen skiljer sig ofta bara på exponenten, så räkna den noga och slarva hellre med decimalerna.`,
  },
  {
    category: "kvantitativ",
    title: "Faktorisera och förenkla uttryck på XYZ",
    question: `Hur ser man snabbt hur ett algebraiskt uttryck ska förenklas?`,
    answer: String.raw`Tre knep täcker det mesta:

1. **Bryt ut gemensam faktor.** $6x + 9 = 3(2x + 3)$ och $x^2 - 5x = x(x - 5)$.
2. **Känn igen kvadreringsreglerna och konjugatregeln.** $x^2 - 9 = (x-3)(x+3)$ och $x^2 + 6x + 9 = (x+3)^2$.
3. **Förkorta först, räkna sedan.** I $\frac{x^2 - 4}{x - 2}$ är täljaren $(x-2)(x+2)$, så uttrycket är $x + 2$ (för $x \neq 2$).

Förenkla innan du sätter in tal. Uppgiften är ofta byggd så att uttrycket blir ett enkelt tal efter förkortning.

**Fälla:** du får inte förkorta termer, bara faktorer. I $\frac{x + 4}{4}$ går det inte att stryka 4:orna.

Går det trögt: **sätt in ett enkelt tal** (t.ex. $x = 2$) i både uttrycket och svarsalternativen och se vilket som stämmer.`,
  },
  {
    category: "kvantitativ",
    title: "Pröva svarsalternativen: en genväg på XYZ",
    question: `Är det okej att sätta in svarsalternativen i stället för att räkna? Jag tycker det känns som fusk.`,
    answer: `Det är inte fusk, det är en av de bästa metoderna på provet. Du får poäng för rätt svar, inte för vilken väg du valde.

**När det fungerar bra:**
- Ekvationer där alternativen är enkla tal. Sätt in alternativ C först. Blir det för stort eller litet vet du åt vilket håll du ska gå.
- Textuppgifter där du kan kontrollera varje villkor mot ett föreslaget svar.
- Uppgifter där du kört fast i algebran.

**När det inte lönar sig:** när alternativen är långa uttryck eller rötter som tar längre tid att sätta in än att räkna ut.

**Kombinera med uteslutning.** Ofta räcker en snabb överslagsräkning för att stryka två eller tre alternativ. Ligger svaret nära 50 och bara ett alternativ är i den storleksordningen behöver du inte räkna exakt.

Behåll alltid kollen på tiden: XYZ har 12 uppgifter, och en uppgift som tar mer än två minuter bör du markera och återkomma till.`,
  },
  {
    category: "kvantitativ",
    title: "Hur testar man värden på KVA?",
    question: `Hur vet man vilka tal man ska sätta in när storheterna innehåller en okänd?`,
    answer: String.raw`Innehåller uppgiften en variabel är svaret D (kan inte avgöras) bara korrekt om olika tillåtna värden ger **olika** resultat. Så pröva värden som verkligen skiljer sig åt:

- **Noll och ett.** Många uttryck ändrar karaktär här.
- **Ett negativt tal**, t.ex. $-1$ eller $-2$.
- **Ett tal mellan 0 och 1**, t.ex. $\frac{1}{2}$.
- **Ett tal större än 1**, t.ex. 2 eller 10.

Exempel: jämför $x^2$ med $x$.
- $x = 2$: $4 > 2$.
- $x = 1$: lika.
- $x = \frac{1}{2}$: $\frac{1}{4} < \frac{1}{2}$.

Tre olika utfall betyder D. Så fort **två** värden ger olika förhållande är D rätt. Ger alla värden du provar samma förhållande, titta efter ett argument som visar att det gäller alltid innan du svarar A, B eller C.

Se också uppgiftens villkor: står det att $x$ är ett positivt heltal är negativa tal och bråk inte tillåtna.`,
  },
  {
    category: "kvantitativ",
    title: "DTK: skala, axlar och andra saker som luras",
    question: `Vad ska man titta efter först när man får ett diagram eller en karta?`,
    answer: `Innan du läser av något, kolla följande:

1. **Rubrik och enhet.** Står det tusental, miljoner eller procent? Ett felläst enhetsbyte kostar fler poäng än något annat.
2. **Axlarna.** Börjar y-axeln på noll? Om inte ser skillnaderna större ut än de är. Är skalan ojämn (logaritmisk eller med brott) går det inte att jämföra avstånd med ögat.
3. **Förklaringen (legenden).** Vilken stapel, linje eller färg hör till vad?
4. **Kartskalan.** Skalan 1:50 000 betyder att 1 cm på kartan är 500 m i verkligheten. Mät med en linjal eller markera ett papper.

**Procent mot antal:** frågar uppgiften efter antal men diagrammet visar procent behöver du också totalen. Frågar den efter förändring i procentenheter eller i procent? De är olika saker.

**Läs frågan före diagrammet.** Då vet du vilken siffra du ska leta efter och slipper läsa av allt.

Skriv gärna här vilka DTK-uppgifter du tappat poäng på.`,
  },
  {
    category: "kvantitativ",
    title: "Summan av 1 + 2 + 3 + … och aritmetiska följder",
    question: `Finns det ett snabbt sätt att räkna ut summan av många tal i rad?`,
    answer: String.raw`Ja. Summan av heltalen från 1 till $n$ är

$$1 + 2 + \dots + n = \frac{n(n+1)}{2}$$

Exempel: $1 + 2 + \dots + 100 = \frac{100 \cdot 101}{2} = 5050$.

**Varför det fungerar:** para ihop första och sista, andra och näst sista och så vidare. Varje par har samma summa ($n + 1$) och det finns $\frac{n}{2}$ par.

**Allmän aritmetisk följd** (konstant differens): summan är

$$\text{antal} \cdot \frac{\text{första} + \text{sista}}{2}$$

Exempel: 5, 8, 11, …, 29 har 9 termer (differens 3). Summan är $9 \cdot \frac{5 + 29}{2} = 153$.

**Räkna antal termer:** $\frac{\text{sista} - \text{första}}{\text{differens}} + 1$. Glöm inte "plus 1", det är den vanligaste feltaget (stolpe-och-staket-felet).`,
  },
  {
    category: "kvantitativ",
    title: "Volym och area: cylinder, kon och klot",
    question: `Vilka formler för rymdgeometri behöver man kunna utantill?`,
    answer: String.raw`Provet brukar ge formlerna i uppgiften när de är ovanliga, men dessa är bra att kunna:

- **Rätblock:** $V = a \cdot b \cdot c$, ytan $2(ab + ac + bc)$.
- **Kub med sidan $s$:** $V = s^3$, ytan $6s^2$.
- **Cylinder:** $V = \pi r^2 h$, mantelytan $2\pi r h$.
- **Kon:** $V = \frac{\pi r^2 h}{3}$, alltså en tredjedel av motsvarande cylinder.
- **Klot:** $V = \frac{4\pi r^3}{3}$ och ytan $4\pi r^2$.
- **Pyramid:** $V = \frac{\text{basarea} \cdot h}{3}$.

**Likformighet:** förstoras en figur med längdfaktorn $k$ blir arean $k^2$ gånger större och volymen $k^3$ gånger större. Dubbleras radien på ett klot åttadubblas volymen.

**Enheter:** byt allt till samma enhet först. Se tråden om enhetsomvandling.`,
  },

  /* ── Verbal, fler ämnen (2026-10-26) ─────────────────────────── */
  {
    category: "verbal",
    title: "Vad gör man när man inte kan ordet på ORD?",
    question: `Ibland har jag aldrig sett ordet. Finns det något annat än att gissa blint?`,
    answer: `Ja, du kan oftast förbättra chansen rejält innan du gissar.

1. **Tänk på ordets känsla.** Är det positivt, negativt eller neutralt? Alternativ med fel klang kan strykas.
2. **Leta efter ord i ordet.** *Opportunism* har *opportunity* (möjlighet) i sig. Många svenska lånord är lätta att känna igen på engelska, franska eller tyska.
3. **Använd förled och ändelser.** Se tråden om förled och ordstammar.
4. **Har du hört ordet i en mening?** Försök minnas var. Sammanhanget ger ofta mer än du tror.
5. **Stryk det du är säker på är fel** och gissa bland resten.
6. **Akta dig för det som liknar ordet** i stavning eller ljud. Det är oftare en fälla än rätt svar.

Gissa alltid. Fel svar ger inget avdrag, och efter att ha strukit två alternativ är chansen redan 33 %.

Ord du inte kunde: slå upp dem efteråt i [ordlistan](https://tvakommanollan.se/ordlista) så att du känner igen dem nästa gång.`,
  },
  {
    category: "verbal",
    title: "Vanliga fällor på MEK",
    question: `Vilka misstag gör man oftast på meningskomplettering?`,
    answer: `De vanligaste fällorna:

- **Att välja första alternativet som låter bra.** Läs alla innan du bestämmer dig.
- **Att bara kolla meningen med luckan.** Alternativet ska passa i textens hela resonemang.
- **Att missa en negation.** *Inte*, *knappast* och *utan* kan vända betydelsen.
- **Att glömma sambanden.** Ord hör ihop: man *drar slutsatser*, *fattar beslut* och *lägger fram* ett förslag. Fel verb ger en konstig fras även om ordet i sig är rimligt.
- **Att bortse från ordklassen.** Luckan kräver ibland ett adjektiv och ibland ett verb. Läs meningen högt i huvudet.
- **Att välja ett fint ord.** Det mest högtravande alternativet är sällan rätt. Rätt är det som är mest exakt.

När det finns två luckor: avgör en av dem först och stryk alla alternativ som inte passar. Då återstår ofta bara ett.

Öva med riktiga uppgifter i [MEK-övningen](https://tvakommanollan.se/mek-ovning).`,
  },
  {
    category: "verbal",
    title: "Olika frågetyper på LÄS och hur man angriper dem",
    question: `Är det någon skillnad på hur man ska tänka beroende på vilken fråga som ställs?`,
    answer: `Ja. Frågorna på LÄS brukar vara av några huvudtyper:

**Detaljfrågor** ("Enligt texten…"). Svaret står i texten, ofta nästan ordagrant. Hitta stället och läs noga. Ofta är fel alternativ en förvrängning av en detalj (fel siffra, fel orsak).

**Slutsatsfrågor** ("Vad kan man dra för slutsats…", "Texten antyder…"). Svaret står inte direkt men ska följa av det som står. Välj det som texten stöder, inte det som är sant i allmänhet.

**Huvudtankefrågor** ("Vad handlar texten om?"). Läs inledning och avslutning. Det rätta alternativet är varken för smalt (en detalj) eller för brett (något texten inte tar upp).

**Syftesfrågor** ("Varför nämner författaren…?"). Fråga dig vad stycket gör i texten: ger ett exempel, bemöter en invändning, sammanfattar.

**Ordfrågor i sammanhang** ("Vad betyder ordet X här?"). Läs meningarna runt omkring. Betydelsen är den texten använder, inte den vanligaste.

Gemensamt: **peka ut stället i texten** som styrker ditt svar. Kan du inte det, tveka. Läs mer i [LÄS-guiden](https://tvakommanollan.se/guider/las).`,
  },
  {
    category: "verbal",
    title: "ELF: luckuppgifter och kollokationer",
    question: `På de engelska luckuppgifterna fastnar jag på ordval som låter rätt men inte är det. Hur tänker man?`,
    answer: `Luckuppgifterna prövar både innebörd och **hur engelska ord brukar kombineras**.

1. **Läs hela texten först** för att förstå riktningen. Sedan återvänder du till luckan.
2. **Bestäm ordklass och grammatik** (verb, substantiv, singular eller plural, tempus) innan du tittar på betydelsen. Det stryker ofta ett par alternativ.
3. **Tänk på fasta fraser.** På engelska *makes* man ett beslut, men *does* en studie och *takes* en risk. Alternativ som är rätt ord i fel fras är den typiska fällan.
4. **Kolla signalord** som *however*, *therefore* och *although*. Se tråden om signalord.
5. **Passar det i hela stycket?** Prova att läsa meningen före och efter luckan.

Lägg inte lång tid på en enda lucka. Markera, gå vidare och återvänd.

Träna på riktiga luckuppgifter ur [gamla prov](https://tvakommanollan.se/gamla-prov). Där finns ELF i alla verbala pass.`,
  },
  {
    category: "verbal",
    title: "Hur bygger man ordförråd genom läsning?",
    question: `Jag vill förbättra ORD och LÄS på sikt. Vad ska jag läsa?`,
    answer: `Ordförråd byggs bäst av **mycket läsning av rätt sorts text**, kompletterat med målmedveten ordinlärning.

**Bra läsning:**
- Dagstidningarnas längre artiklar, kultur- och debattsidor
- Populärvetenskap och essäer
- Facklitteratur i ett ämne du redan är nyfiken på
- På engelska: *The Economist*, *The Guardian* och populärvetenskapliga artiklar

**Så gör du läsningen till plugg:**
1. Markera ord du inte kan, men **slå inte upp allt** direkt, så tappar du flytet.
2. Samla orden i en lista och slå upp dem när du är klar.
3. Repetera listan efter en dag, en vecka och en månad.

Läsningen ger dig orden i sitt sammanhang, vilket gör att de fastnar bättre än ur en lista. Listorna ger fart. Gör båda.

Börja gärna med att slå upp dina okända ord i [ordlistan](https://tvakommanollan.se/ordlista) och öva dem i [ordövningen](https://tvakommanollan.se/ord).`,
  },
  {
    category: "verbal",
    title: "Hur lägger man upp ordinlärningen så att orden fastnar?",
    question: `Jag glömmer orden jag pluggat. Hur gör man för att komma ihåg dem?`,
    answer: `Det handlar om **att ta fram** ordet ur minnet, inte om att läsa det om och om igen.

- **Testa dig själv.** Täck över förklaringen och försök minnas den. Det är jobbigare än att läsa men fungerar mycket bättre.
- **Sprid ut repetitionen.** Ett ord du ser dag 1, dag 3, dag 7 och dag 21 sitter bättre än tio repetitioner på en kväll.
- **Koppla ordet till något.** En egen mening, ett minne eller en synonym du redan kan.
- **Plugga få ord i taget.** 10–20 nya ord per dag är mer än nog om du repeterar de gamla.
- **Lär dig synonymerna.** ORD frågar efter ett ord med ungefär samma betydelse, så synonymparet är själva uppgiften.

Spaced repetition gör jobbet åt dig i [ordövningen](https://tvakommanollan.se/ord): ord du svarar fel på kommer tillbaka tidigare, ord du kan kommer tillbaka allt mer sällan.`,
  },

  /* ── Plugg & strategi, fler ämnen (2026-10-26) ───────────────── */
  {
    category: "plugg",
    title: "Så för du en felbok efter varje gammalt prov",
    question: `Jag skriver gamla prov men ser inte att jag blir bättre. Vad gör jag fel?`,
    answer: `Ofta är det genomgången efteråt som saknas. Att skriva fler prov utan att lära sig av felen ger mindre än att skriva färre och analysera dem.

**Gör en felbok.** För varje uppgift du hade fel, eller hade rätt på av en slump, skriv:
1. **Vilken uppgift** (termin, pass, nummer).
2. **Varför blev det fel?** Välj en kategori: kunskapslucka, slarv, tidsbrist, missförstod frågan, gissade.
3. **Vad gör jag nästa gång?** En mening.

Efter tre prov ser du **mönster**. Kanske är 70 % av felen slarv i KVA, eller kunskapsluckor i procent. Då vet du vad du ska träna.

Se också till att lösa om uppgiften du hade fel på efter en vecka, utan att titta på lösningen. Klarar du den då har du lärt dig något.

Alla uppgifter i [gamla prov](https://tvakommanollan.se/gamla-prov) har facit.`,
  },
  {
    category: "plugg",
    title: "Så simulerar du provdagen hemma",
    question: `Hur övar man på att hålla koncentrationen hela dagen?`,
    answer: `Provet är fem pass á 55 minuter på en och samma dag, och uthålligheten är en egen färdighet. Träna den.

**En provsimulering:**
- Välj en dag, helst en lördag eller söndag, och sätt dig på ett lugnt ställe.
- Skriv **minst tre pass i följd** med verklig tid (55 minuter) och korta pauser emellan.
- Telefonen ska vara avstängd och i ett annat rum.
- Ät lunch som du ska äta på provdagen.
- Rätta efteråt och för in felen i din felbok.

**Varför det hjälper:**
- Du märker när koncentrationen sjunker, och vad du kan göra åt det (äta, dricka, andas).
- Du övar på att släppa ett pass som gick dåligt och starta nästa friskt.
- Tidspressen blir en vana i stället för en chock.

Gör simuleringen minst en gång innan provet, och gärna två. Gamla prov finns i [gamla prov](https://tvakommanollan.se/gamla-prov), och de går att skriva i provläge med klocka.`,
  },
  {
    category: "plugg",
    title: "Sista veckan före högskoleprovet: vad är värt att göra?",
    question: `Det är en vecka kvar. Ska jag fortsätta plugga hårt eller ta det lugnt?`,
    answer: `Sista veckan handlar om att **behålla formen och inte lära sig nytt i panik**.

**Gör:**
- Ett eller två gamla prov tidigt i veckan, på tid. Inte dagen innan.
- Gå igenom felboken och de formler du brukar glömma.
- Lite ORD varje dag. Repetition ger mest när tiden är kort.
- Gå igenom det praktiska: kallelse, legitimation, resväg.
- Sov regelbundet. Det gör mer än extra plugg.

**Undvik:**
- Att lära dig helt nya områden. Det du inte kan nu hinner du sällan lära dig, och osäkerheten kostar mer än den ger.
- Att jämföra dig med andra.
- Ett helt prov kvällen före.

Läs också tråden om vad man ska göra dagen före provet, så att den dagen blir lugn.`,
  },
  {
    category: "plugg",
    title: "Pluggschema för fyra veckor före högskoleprovet",
    question: `Jag har fyra veckor kvar. Hur lägger jag upp tiden?`,
    answer: `Ett förslag med cirka 1 timme om dagen på vardagar och 3 timmar på helgen:

**Vecka 1: kartlägg**
- Skriv ett helt gammalt prov (alla verbala och kvantitativa pass som du hinner) för att se var du står.
- Gå igenom resultatet i en felbok.
- Börja med ORD varje dag.

**Vecka 2: laga luckorna**
- Träna på de delprov där du tappade mest poäng.
- Repetera matematiken som du saknar (procent, potenser, geometri).
- Ett pass på tid på helgen.

**Vecka 3: bygg tempo**
- Hela pass på tid, 2–3 stycken per vecka.
- Gå igenom varje felsvar.
- Fortsätt med ORD.

**Vecka 4: håll formen**
- Ett provsimulerat tillfälle tidigt i veckan.
- Repetera felbok och formler.
- Lätt dag före provet.

Anpassa efter din utgångspunkt. Är matten din svaga sida: lägg mer tid där, eftersom kvantitativ poäng ofta går att höja snabbare än verbal.`,
  },
  {
    category: "plugg",
    title: "Hur hanterar man provångest och nervositet?",
    question: `Jag blir så nervös på prov att jag tappar poäng jag borde ha klarat. Tips?`,
    answer: `Nervositet är normalt, och lite av den hjälper faktiskt prestationen. Det som kostar är när den tar över.

**Före provet:**
- **Övning minskar ångest.** Den som skrivit flera gamla prov på tid vet vad som väntar, och det är det som lugnar mest.
- **Sov, ät och rör på dig.** Det låter banalt men påverkar stressnivån tydligt.
- **Ha en rutin** för morgonen så att inget lämnas åt slumpen.

**Under provet:**
- **Andas långsamt** i 30 sekunder om du känner att det snurrar. Låt utandningen vara längre än inandningen.
- **Börja med en uppgift du är säker på.** En tidig rätt ger lugn.
- **Hoppa över och återvänd** i stället för att fastna.
- **Glöm passet som gick dåligt.** Ett av fem pass räknas inte ens.

Känns ångesten överväldigande och ligger utanför vad övning kan lösa: prata med studievägledare eller vårdcentral. Det finns hjälp.`,
  },
  {
    category: "plugg",
    title: "Hur många gånger ska man skriva högskoleprovet?",
    question: `Är det värt att skriva om provet flera gånger?`,
    answer: `Det finns ingen gräns för antal gånger och **det bästa giltiga resultatet** är det som räknas vid ansökan. Du riskerar alltså inget på att skriva igen.

**Bra skäl att skriva om:**
- Du är nära en gräns för utbildningen du vill in på.
- Du har pluggat bättre sedan förra gången eller vet vad som gick snett.
- Du har tid och ork för en ny pluggperiod.

**Tänk på:**
- Anmälningsperioden är kort (en dryg vecka) och avgiften är 550 kr. Se [provdatumsidan](https://tvakommanollan.se/hogskoleprovet-datum).
- Provformatet blir bekant andra gången, vilket i sig kan ge mer rutin på tidspressen.
- Förändra sättet du pluggar på, annars blir det samma resultat.

Börja med att analysera förra provet: vilka delar tappade du mest på, och varför? Lägg tiden där.`,
  },
  {
    category: "plugg",
    title: "Hur pluggar man vid sidan av jobb eller heltidsstudier?",
    question: `Jag jobbar heltid. Hur får jag ihop plugget till högskoleprovet?`,
    answer: `Det går, men det kräver att du planerar små pass och håller fast vid dem.

- **15–30 minuter varje dag** slår 3 timmar en gång i veckan, särskilt för ORD och formler som behöver repeteras.
- **Använd restiden.** Ordövning på mobilen på bussen, ljudböcker eller poddar på engelska på väg till jobbet.
- **Fast tid.** Lägg pluggandet på samma tid varje dag, t.ex. direkt efter middagen. Beslutströtthet blir mindre när det är en rutin.
- **Helgpass för prov.** Ett längre pass på helgen för gamla prov på tid.
- **Prioritera.** Du hinner inte allt. Lägg tiden på det delprov som ger mest poäng per timme för dig, och lär dig inte det du redan kan.

Räkna med 6–10 veckor av jämn plugg om du börjar från noll. Se tråden om hur lång tid man behöver, och [jämförelsen av pluggsätt](https://tvakommanollan.se/plugga-infor-hogskoleprovet).`,
  },

  /* ── Provdagen & resultat, fler ämnen (2026-10-26) ───────────── */
  {
    category: "provdagen",
    title: "Hur går provdagen till?",
    question: `Jag ska skriva för första gången. Hur ser dagen ut?`,
    answer: `Provet består av **fem pass på 55 minuter**, med pauser emellan och en längre rast för lunch. Exakta tider och lokal står i **kallelsen** du får efter anmälan, så läs den noga.

**Så brukar dagen se ut:**
1. Du kommer i god tid, visar legitimation och hänvisas till en plats.
2. Du får instruktioner om reglerna för dagen.
3. Passen skrivs i en bestämd ordning, med pauser och lunch.
4. Du för in dina svar på det sätt instruktionerna anger.

**Praktiska tips:**
- Ta med mat som du vet att du tål, och vatten.
- Klä dig i lager, för temperaturen i lokalen kan vara svår att förutse.
- För över svaren **löpande**, inte alla på slutet. Sista minuten räcker inte till för att föra över 40 svar.
- Använd pauserna till att vila, inte att gå igenom det senaste passet.

Mer om vad som ska med finns i tråden "Vad ska man ta med till högskoleprovet?".`,
  },
  {
    category: "provdagen",
    title: "Hur fördelar man energin över fem pass?",
    question: `Jag orkade inte fokusera på de sista passen förra gången. Hur gör man?`,
    answer: `Fem pass på en dag tär på koncentrationen. Några saker som hjälper:

- **Ät och drick regelbundet.** Ta något litet i varje paus. Ett stort mål mitt på dagen ger trötthet.
- **Rör på dig i pauserna.** Gå en runda och andas frisk luft i stället för att sitta kvar.
- **Prata inte om passen.** Att jämföra svar med andra i pausen ger bara oro, och det går inte att ändra.
- **Sista passet är lika mycket värt som det första.** Räkna inte med att du "redan gjort det viktigaste". Alla räknade pass väger lika.
- **Gör en provsimulering hemma** med minst tre pass i följd, så att uthålligheten är övad.

Sömnen veckan före påverkar mer än de flesta tror. Gå och lägg dig i tid även om du är nervös.`,
  },
  {
    category: "provdagen",
    title: "Hur räknar man ut sitt resultat direkt efter provet?",
    question: `Jag vill veta ungefär vad jag fick utan att vänta på normeringen.`,
    answer: `Du kan göra en uppskattning så snart facit är ute.

1. **Rätta dina svar** mot facit. Räkna antal rätt på verbal respektive kvantitativ del (max 80 var). Kom ihåg att utprövningspasset inte har något facit och inte räknas.
2. **Jämför med tidigare normeringar.** Normeringstabellerna för äldre prov finns på [sajten](https://tvakommanollan.se/hogskoleprovet-poangraknare). Ett prov som kändes svårare ger ofta något lägre krav per poängsteg.
3. **Räkna medelvärdet** av de två delpoängen.

Poängräknaren översätter antal rätt till en ungefärlig poäng. Det är en **uppskattning**: den riktiga normeringen vet du först när provarrangören publicerar tabellen några veckor senare.

Se också vår uppskattning på [facitsidan](https://tvakommanollan.se/hogskoleprovet-facit). Den är vår egen bedömning och inget officiellt besked.`,
  },
  {
    category: "provdagen",
    title: "Vad händer om jag gör fel på svarsbladet?",
    question: `Jag är rädd att fylla i fel ruta på svarsbladet. Hur undviker man det?`,
    answer: `Det är en vanlig oro, och den går att göra mindre.

- **Kontrollera numret** varje gång du för över ett svar. Gör det till en vana att säga "uppgift 14" för dig själv.
- **För över i omgångar** under passet, t.ex. efter var tionde uppgift, så att du inte hamnar efter. Spara inte allt till slutet.
- **Om du hoppar över en uppgift:** hoppa över rutan också, och markera uppgiften i häftet så att du ser det.
- **Gissa i sista stund:** fyll i alla rutor du inte hunnit med. Även där måste raden stämma med uppgiften.
- **Läs instruktionerna** på provdagen om hur svar ska markeras och ändras.

Om du upptäcker att du hamnat en rad fel mitt i passet: ta en minut och rätta det direkt. Det kostar mindre än att hela resten av svarsbladet blir förskjutet.`,
  },

  /* ── Allmänt, fler ämnen (2026-10-26) ────────────────────────── */
  {
    category: "allmant",
    title: "Vad betyder BI, BII och HP i antagningen?",
    question: `Jag ser förkortningar som BI, BII och HP vid antagningen. Vad är skillnaden?`,
    answer: `De är **urvalsgrupper**, alltså olika sätt att rangordna sökande till samma utbildning:

- **BI:** betygsgrupp för dig med gymnasieexamen eller motsvarande. Här räknas ditt meritvärde.
- **BII:** betygsgrupp för dig som kompletterat betyg eller har äldre betyg.
- **HP:** högskoleprovsgruppen. Här räknas ditt resultat på högskoleprovet.

Du hamnar automatiskt i alla grupper du är behörig till och konkurrerar i den där du står starkast. Antagningen räknar fram **en antagningsgräns per grupp**, och du blir antagen om du ligger över gränsen i **någon** av dem.

Därför kan ett bra högskoleprov hjälpa även om betygen är bra. Det kan aldrig skada.

Gränserna för tidigare terminer finns per program på [poäng per utbildning](https://tvakommanollan.se/hogskoleprovet-poang). Exakta regler för fördelningen finns på antagning.se och hos det aktuella lärosätet.`,
  },
  {
    category: "allmant",
    title: "Är verbal och kvantitativ del lika viktiga?",
    question: `Väger den verbala och den kvantitativa delen lika mycket i slutpoängen?`,
    answer: `Ja. Totalpoängen är **medelvärdet av de två delarnas normerade poäng**, så varje del väger exakt hälften. 1,60 verbalt och 1,80 kvantitativt ger 1,70.

Några konsekvenser:
- Det är ofta **lättare att höja sig på den del där man ligger lägst**, eftersom de första extra rätta svaren där ger fler poängsteg per ansträngning.
- Den normerade poängen stiger brantare nära toppen, så de sista rätta svaren på en redan stark del ger mycket, men de är också svårast att få.
- Du kan inte kompensera ett nollresultat på ena delen med ett perfekt på den andra: 0,0 och 2,0 ger bara 1,0.

Fundera på var du kan få flest poäng per timme plugg. För många är det kvant, eftersom matten går att repetera systematiskt. För andra är det ORD, där ordförrådet går att bygga stegvis.

Se också tråden "Vilken del av högskoleprovet är lättast att höja sig på?".`,
  },
  {
    category: "allmant",
    title: "Vilka olika uppgiftstyper finns på högskoleprovet och vad testar de?",
    question: `Kan någon förklara vad varje delprov egentligen mäter?`,
    answer: `Provet har åtta delprov, fyra verbala och fyra kvantitativa.

**Verbalt:**
- **ORD** testar ordförståelse. Du väljer det ord som betyder ungefär detsamma som ett givet ord.
- **LÄS** testar svensk läsförståelse: du läser längre texter och svarar på frågor om innehåll, slutsatser och syfte.
- **MEK** testar meningskomplettering. Du fyller i luckor så att texten blir begriplig och logisk.
- **ELF** testar engelsk läsförståelse, med texter på engelska och luckuppgifter.

**Kvantitativt:**
- **XYZ** är matematisk problemlösning: algebra, geometri, procent och sannolikhet på grundnivå.
- **KVA** testar kvantitativa jämförelser. Du jämför två storheter utan att alltid räkna ut dem.
- **NOG** testar kvantitativa resonemang: räcker informationen för att lösa uppgiften?
- **DTK** testar att läsa diagram, tabeller och kartor.

Gemensamt är att inget kräver förkunskaper utöver gymnasiets första matte och god allmänbildning. Det som skiljer är **vana och tempo**.

Börja gärna med [guiderna](https://tvakommanollan.se/guider) för respektive delprov.`,
  },
  {
    category: "allmant",
    title: "Vem kan skriva högskoleprovet?",
    question: `Måste man vara över en viss ålder eller ha gymnasiebetyg för att få skriva?`,
    answer: `Du behöver **inte** ha gymnasiebetyg för att skriva provet, och det finns ingen övre åldersgräns. Du kan skriva provet flera gånger, och resultatet gäller i åtta år.

Du anmäler dig själv på hogskoleprov.nu under anmälningsperioden och betalar provavgiften (550 kr). Anmälningstider hittar du på [provdatumsidan](https://tvakommanollan.se/hogskoleprovet-datum).

Tänk på att **behörighet till en utbildning** är en annan sak än att få skriva provet. För att komma in via högskoleprovet behöver du ändå vara behörig till utbildningen i övrigt, till exempel ha grundläggande behörighet. Kontrollera kraven för just ditt program hos antagning.se.

Frågor om vem som får skriva i särskilda situationer (t.ex. som yngre elev) bör du ställa direkt till provets arrangör, eftersom reglerna kan ändras.`,
  },
  /* ── Omgång 3: long-tail (2026-10-27) ────────────────────────── */
  {
    category: "kvantitativ",
    title: "Medelhastighet: varför är det inte medelvärdet av farterna?",
    question: `Jag kör 60 km/h dit och 40 km/h tillbaka. Är medelhastigheten inte 50 km/h?`,
    answer: String.raw`Nej, och det är en klassisk fälla. Medelhastighet är **total sträcka delat med total tid**, inte medelvärdet av farterna.

Låt sträckan åt ett håll vara $d$:
- Tiden dit: $\frac{d}{60}$
- Tiden tillbaka: $\frac{d}{40}$
- Total tid: $\frac{d}{60} + \frac{d}{40} = \frac{2d + 3d}{120} = \frac{d}{24}$
- Total sträcka: $2d$

Medelhastigheten blir $2d \div \frac{d}{24} = 48$ km/h.

Den blir lägre än 50 eftersom du tillbringar **längre tid** i den långsamma farten. Sträckans längd tar ut sig, så du behöver inte veta $d$.

Gäller det två lika långa sträckor går det även att skriva som $\frac{2ab}{a+b}$.`,
  },
  {
    category: "kvantitativ",
    title: "Gemensamt arbete: hur lång tid tar det om två arbetar tillsammans?",
    question: `A klarar ett jobb på 6 timmar och B på 3 timmar. Hur lång tid tar det tillsammans?`,
    answer: String.raw`Räkna med **hur stor del av jobbet var och en gör per timme**.

- A: $\frac{1}{6}$ av jobbet per timme
- B: $\frac{1}{3}$ av jobbet per timme
- Tillsammans: $\frac{1}{6} + \frac{1}{3} = \frac{1}{2}$ av jobbet per timme

Hela jobbet tar alltså $1 \div \frac{1}{2} = 2$ timmar.

Samma tänk fungerar för kranar som fyller ett badkar, pumpar som tömmer en tank eller kopieringsmaskiner. Är det en som **tömmer** och en som fyller ska du subtrahera i stället för att addera.

Snabbkoll: svaret måste vara kortare än den snabbaste ensam (här under 3 timmar). Alternativ som är längre är direkt fel.`,
  },
  {
    category: "kvantitativ",
    title: "Moms och procent: hur tar man bort 25 % moms?",
    question: `Priset inklusive 25 % moms är 125 kr. Hur räknar man tillbaka?`,
    answer: String.raw`Momsen läggs på **priset utan moms**, så du kan inte bara dra bort 25 % av 125 kr.

- Pris utan moms $\times 1{,}25$ = pris med moms.
- Därför: pris med moms $\div 1{,}25$ = pris utan moms.

$125 \div 1{,}25 = 100$ kr. Momsen är 25 kr, vilket är **20 %** av priset inklusive moms (och 25 % av priset utan).

Samma princip gäller alla uppgifter som går bakåt från en procentuell ändring: dela med förändringsfaktorn, subtrahera inte procenten.

Exempel: en vara kostar 90 kr efter 10 % rabatt. Originalpriset är $90 \div 0{,}9 = 100$ kr, inte 99.`,
  },
  {
    category: "kvantitativ",
    title: "Procent av procent och flera rabatter i rad",
    question: `Det är 30 % rabatt och sedan ytterligare 10 % på det nedsatta priset. Hur stor är rabatten totalt?`,
    answer: String.raw`Rabatterna **multipliceras**, de adderas inte.

- 30 % rabatt ger faktorn $0{,}7$.
- 10 % rabatt ger faktorn $0{,}9$.
- Tillsammans: $0{,}7 \times 0{,}9 = 0{,}63$

Du betalar 63 % av ursprungspriset, så den totala rabatten är **37 %**, inte 40 %.

**Procent av procent:** 20 % av 50 % är $0{,}2 \times 0{,}5 = 0{,}1$, alltså 10 %. Ett populärt uppgiftsupplägg är "20 % av de 50 % som..." där man ska svara i andel av helheten.

Kontrollera alltid vad procentsatsen räknas **av**: ursprungspriset, det nedsatta priset eller en delgrupp.`,
  },
  {
    category: "kvantitativ",
    title: "Enhetspris: vilket köp är billigast?",
    question: `Hur jämför man snabbt priset på olika förpackningsstorlekar?`,
    answer: `Räkna om båda till **pris per samma enhet**.

Exempel: 500 g kostar 25 kr, och 1,2 kg kostar 54 kr.
- Första: 25 kr / 0,5 kg = 50 kr/kg
- Andra: 54 kr / 1,2 kg = 45 kr/kg

Den större förpackningen är billigare per kilo.

**Genvägar:**
- Byt till jämna tal. Ta 2 kg för att slippa decimaler: första 100 kr, andra ungefär 90 kr.
- Räkna bara så noga som alternativen kräver. Ligger de långt isär räcker en överslagsräkning.
- Glöm inte att enheterna måste vara desamma (g mot kg, liter mot dl).

På KVA är det här en vanlig uppgiftstyp: "Pris per liter för A" mot "Pris per liter för B".`,
  },
  {
    category: "kvantitativ",
    title: "Jämföra bråk snabbt: korsmultiplikation och gemensam nämnare",
    question: `Vilket är störst av 3/7 och 4/9? Finns det ett snabbt sätt?`,
    answer: String.raw`Korsmultiplicera: multiplicera varje täljare med den andra nämnaren.

$\frac{3}{7}$ mot $\frac{4}{9}$: $3 \times 9 = 27$ och $4 \times 7 = 28$. Den sida som får störst tal är störst, alltså $\frac{4}{9}$.

Fler sätt:
- **Jämför med $\frac{1}{2}$:** $\frac{3}{7}$ är mindre än hälften (3 är under 3,5), $\frac{4}{9}$ också (4 är under 4,5). Behövs finare jämförelse.
- **Jämför det som saknas till 1:** $\frac{3}{7}$ saknar $\frac{4}{7}$, $\frac{4}{9}$ saknar $\frac{5}{9}$. Det bråk som saknar minst är störst.
- **Decimalform** om nämnarna är enkla ($\frac{3}{8} = 0{,}375$).

På KVA slipper du ofta räkna exakt: det räcker att se att ett bråk är större än hälften och det andra mindre.`,
  },
  {
    category: "kvantitativ",
    title: "Kvadrater, kuber och tvåpotenser som är bra att kunna utantill",
    question: `Vilka tal ska man kunna utantill för att spara tid?`,
    answer: `Det tar några minuter att lära sig och sparar sekunder på många uppgifter.

**Kvadrater:** $11^2 = 121$, $12^2 = 144$, $13^2 = 169$, $14^2 = 196$, $15^2 = 225$, $16^2 = 256$, $20^2 = 400$, $25^2 = 625$.

**Kuber:** $2^3 = 8$, $3^3 = 27$, $4^3 = 64$, $5^3 = 125$, $10^3 = 1\,000$.

**Tvåpotenser:** 2, 4, 8, 16, 32, 64, 128, 256, 512 och $2^{10} = 1\,024$.

**Primtal under 50:** 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47.

**Bråk och decimaler:** $\frac{1}{8} = 0{,}125$, $\frac{1}{5} = 0{,}2$, $\frac{3}{8} = 0{,}375$.

Rötter och potenser dyker upp i alla fyra kvantdelprov, och kan du dem slipper du bryta ned tal under tidspress.`,
  },
  {
    category: "kvantitativ",
    title: "Överslagsräkning: räkna grovt för att hinna",
    question: `Hur grovt kan man räkna utan att hamna fel?`,
    answer: String.raw`Svarsalternativen är ofta tillräckligt långt ifrån varandra för att en grov uppskattning avgör.

Exempel: $49{,}8 \times 20{,}1 \approx 50 \times 20 = 1\,000$. Räkna inte ut decimalerna om alternativen är 100, 1 000, 10 000 och 99 900.

**Regler:**
1. Avrunda till jämna tal du kan räkna i huvudet.
2. Tänk på **åt vilket håll** du avrundade. Avrundar du uppåt är det riktiga svaret något lägre.
3. Titta på alternativen först. Ligger de nära varandra behöver du räkna noggrannare.

**Vanlig användning:**
- Testa om ett alternativ är rimligt (ett pris, en area, en procent).
- Strykning av alternativ som ligger långt bort.
- Kontroll av svar som du räknat fram.

Vid KVA och DTK sparar överslag mest tid, eftersom du ofta bara ska avgöra vilken storhet som är störst.`,
  },
  {
    category: "kvantitativ",
    title: "Linjära ekvationer med bråk: gångra bort nämnarna",
    question: `Hur löser man x/2 + x/3 = 10 utan att göra fel?`,
    answer: String.raw`Gångra hela ekvationen med **minsta gemensamma nämnare** för att bli av med bråken.

$\frac{x}{2} + \frac{x}{3} = 10$

Minsta gemensamma nämnare är 6. Multiplicera varje term med 6:
$3x + 2x = 60$, så $5x = 60$ och $x = 12$.

Kontroll: $\frac{12}{2} + \frac{12}{3} = 6 + 4 = 10$.

**Fällor:**
- Glöm inte att multiplicera **högerledet** också.
- Multiplicera varje term, inte bara den första.
- Vid parenteser: multiplicera in noga, och beakta minustecken framför.

Kontrollera alltid svaret genom att sätta in det. Det tar tio sekunder och fångar de flesta fel.`,
  },
  {
    category: "kvantitativ",
    title: "Koordinatsystem: avstånd, mittpunkt och räta linjens lutning",
    question: `Vilka formler behöver man för punkter och linjer i ett koordinatsystem?`,
    answer: String.raw`För punkterna $(x_1, y_1)$ och $(x_2, y_2)$:

- **Avstånd:** $\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$. Det är bara Pythagoras sats. Från $(1, 2)$ till $(4, 6)$: $\sqrt{9 + 16} = 5$.
- **Mittpunkt:** $\left(\frac{x_1 + x_2}{2}, \frac{y_1 + y_2}{2}\right)$. Mellan $(1, 2)$ och $(4, 6)$ ligger $(2{,}5;\ 4)$.
- **Lutning:** $k = \frac{y_2 - y_1}{x_2 - x_1}$.

**Linjer:**
- Parallella linjer har samma $k$.
- Vinkelräta linjer har $k_1 \cdot k_2 = -1$, till exempel $k = 2$ och $k = -\frac{1}{2}$.
- Linjen skär y-axeln där $x = 0$, alltså i $m$.
- Linjen skär x-axeln där $y = 0$.

Rita en snabb skiss. Många uppgifter blir självklara när du ser dem.`,
  },
  {
    category: "kvantitativ",
    title: "Sannolikhet utan återläggning: dra flera kulor ur en påse",
    question: `Det finns 5 röda och 3 blå kulor. Hur stor är sannolikheten att två dragna kulor båda är röda?`,
    answer: String.raw`Utan återläggning minskar både antalet kulor och antalet av färgen för varje dragning.

- Första röd: $\frac{5}{8}$
- Andra röd, när en röd tagits bort: $\frac{4}{7}$
- Båda röda: $\frac{5}{8} \times \frac{4}{7} = \frac{20}{56} = \frac{5}{14}$

**Med återläggning** hade andra sannolikheten varit $\frac{5}{8}$ igen och svaret $\frac{25}{64}$. Läs noga om kulan läggs tillbaka.

**Minst en av en sort:** räkna ofta komplementet. "Minst en blå" är $1 - P(\text{ingen blå})$.

**"Eller" och "och":**
- Och (båda händelserna): multiplicera.
- Eller (någon av två som utesluter varandra): addera.

Skriv ut alla möjligheter med ett träddiagram när det är få dragningar. Det är lättare att gå vilse i huvudet.`,
  },
  {
    category: "kvantitativ",
    title: "Exponentiell tillväxt och halveringstid",
    question: `Hur räknar man uppgifter där något halveras eller fördubblas med jämna mellanrum?`,
    answer: String.raw`Räkna **hur många gånger** det halveras eller fördubblas, inte hur lång tid det gått.

**Halveringstid:** 80 g av ett ämne med halveringstiden 3 dagar. Efter 9 dagar har det gått $9 \div 3 = 3$ halveringar:
$80 \to 40 \to 20 \to 10$ g, alltså 10 g.

**Fördubbling:** en bakteriekultur på 1 000 som fördubblas varannan timme. Efter 6 timmar har det gått 3 fördubblingar: $1\,000 \times 2^3 = 8\,000$.

Allmänt: start $\times\, 2^{n}$ vid fördubbling, start $\times\, \left(\frac{1}{2}\right)^{n}$ vid halvering, där $n$ är antal perioder.

Uppskatta med tvåpotenser: $2^{10} \approx 1\,000$, vilket ger snabba överslag för stora tal.

Fällan är att räkna **linjärt**: det halveras inte med lika många gram per dag.`,
  },
  {
    category: "kvantitativ",
    title: "NOG steg för steg med två exempel",
    question: `Kan någon gå igenom ett par NOG-uppgifter och visa hur man resonerar?`,
    answer: `**Exempel 1.** Vad är $x$? (1) $x^2 = 9$. (2) $x > 0$.

- Ensamt (1): $x = 3$ eller $x = -3$. Två möjliga svar, räcker inte.
- Ensamt (2): vet bara att $x$ är positivt. Räcker inte.
- Tillsammans: $x = 3$. Det räcker, svaret är **C**.

**Exempel 2.** Är heltalet $n$ jämnt? (1) $n + 1$ är udda. (2) $n$ är delbart med 3.

- Ensamt (1): om $n + 1$ är udda måste $n$ vara jämnt. Räcker, så (1) räcker.
- Ensamt (2): 3 är udda och 6 är jämnt, båda är delbara med 3. Räcker inte.
- Svaret är **A**.

**Mönstret:**
1. Avgör vad du ska ta reda på.
2. Pröva (1) ensamt, sedan (2) ensamt.
3. Pröva båda tillsammans bara om ingen räckte.
4. Räkna inte klart. Så fort du ser att det går att få ett entydigt svar är du färdig.

Öva fler i [NOG-guiden](https://tvakommanollan.se/guider/nog).`,
  },
  {
    category: "kvantitativ",
    title: "DTK: lutning och förändringstakt i diagram",
    question: `Frågor som "när ökade värdet snabbast" i ett linjediagram, hur avgör man det?`,
    answer: String.raw`Förändringstakten är **lutningen** på linjen:

$$k = \frac{\Delta y}{\Delta x}$$

En linje genom $(0, 2)$ och $(4, 10)$ har lutningen $\frac{10 - 2}{4 - 0} = 2$ enheter per tidsenhet.

**Att tänka på:**
- **Brantast linje betyder snabbast ökning**, men bara om skalan på axlarna är den samma. Kolla enheten.
- **Absolut förändring** (hur många enheter) skiljer sig från **relativ förändring** (hur många procent). Ett litet tal som fördubblas kan öka mer i procent än ett stort tal som växer lite.
- **Fallande linje** betyder att värdet minskar, men kan ha stor lutning åt andra hållet.
- **Plan linje** betyder att inget förändras.

Rita ut två punkter med hjälplinjer mot axlarna om du är osäker. Läs av värdena noga innan du jämför.`,
  },
  {
    category: "verbal",
    title: "Ord för beröm och kritik som ofta förekommer på ORD",
    question: `Finns det ordgrupper man kan lära sig tillsammans för att det går fortare?`,
    answer: `Ja, det går fortare att lära sig ord i grupper med liknande betydelse, och ORD testar ofta ord som hör ihop med varandra.

**Beröm och uppskattning:**
- *eloge*: beröm
- *hylla*: prisa, uttrycka stor uppskattning
- *smickra*: berömma för att vinna fördelar
- *lovorda*: berömma högt

**Kritik och förkastande:**
- *klandra*: kritisera, förebrå
- *förkasta*: avvisa
- *förtala*: sprida osanna, nedsättande uppgifter om någon
- *tadla*: kritisera, anmärka på

Lär dig orden i par: ord och dess motsats. Då blir ett fel alternativ lättare att känna igen.

Fler ord med förklaringar finns i [ordlistan](https://tvakommanollan.se/ordlista).`,
  },
  {
    category: "verbal",
    title: "Ord som betyder mycket eller lite på ORD",
    question: `Vilka ord för mängd och grad är bra att kunna?`,
    answer: `Mängd och grad är ett vanligt tema.

**Mycket eller många:**
- *åtskilliga*: ganska många
- *talrik*: förekommande i stort antal
- *överflödig*: mer än nödvändigt
- *rikligt*: i stor mängd
- *omfattande*: stor i omfång

**Lite eller få:**
- *ringa*: liten, obetydlig
- *knapp*: just tillräcklig, snål
- *sparsam*: som inte använder mycket
- *fåtalig*: få till antalet
- *obetydlig*: av liten vikt

**Fällor:** *ringa* betyder liten, inte dålig. *Knapp* kan syfta på tid ("en knapp timme") och på mängd.

Se på alla alternativen: ORD frågar ofta efter ett ord med nästan samma betydelse, och de andra alternativen är ord av samma sort men med olika grad.

Träna dem i [ordövningen](https://tvakommanollan.se/ord).`,
  },
  {
    category: "verbal",
    title: "Svenska ord som ofta förväxlas på ORD",
    question: `Finns det ordpar där man lätt tar fel? Jag blandar ihop empati och sympati.`,
    answer: `Några som ofta förväxlas:

- **Empati** är förmågan att leva sig in i och förstå en annans känslor. **Sympati** är att tycka om eller känna medkänsla för någon.
- **Ironi** är att säga motsatsen till vad man menar, med antydan. **Sarkasm** är en skarpare, mer sårande ironi.
- **Förmån** är en särskild fördel eller rättighet. **Fördel** är något som är gynnsamt.
- **Effektiv** betyder att något ger resultat. **Effektfull** betyder att det gör intryck.
- **Prestation** är en insats eller ett resultat. **Prestige** är anseende och status.
- **Eventuell** betyder möjlig, och används ofta fel som "slutlig".
- **Aggression** är fientlighet eller angrepp. **Ambition** är strävan efter att nå ett mål.

Skillnaderna är små och provet utnyttjar dem. Läs alla alternativen innan du bestämmer dig, och pröva att byta ut ordet i en mening.`,
  },
  {
    category: "verbal",
    title: "Falska vänner i ELF: engelska ord som liknar svenska men betyder annat",
    question: `Vilka engelska ord luras man oftast av?`,
    answer: `Falska vänner är ord som liknar svenska men har en annan betydelse. Några vanliga:

- *actually*: faktiskt (inte "aktuellt")
- *eventually*: till slut (inte "eventuellt")
- *sensible*: förnuftig (inte "känslig", det är *sensitive*)
- *gift*: gåva (inte "gift" i betydelsen *married*)
- *fabric*: tyg, material (inte "fabrik", det är *factory*)
- *brave*: modig (inte "snäll")
- *bad*: dålig (inte "bad", som är *bath*)
- *chef*: kock, kökschef
- *become*: bli (inte "bekomma", det är *get*)
- *fast*: snabb eller fast (beroende på sammanhang)

Fällan är att tolka ordet utifrån det svenska utseendet. Kontrollera alltid mot sammanhanget i texten: passar betydelsen i meningen?

Samla egna falska vänner i en lista när du läser engelska texter. Ett par per vecka räcker långt.`,
  },
  {
    category: "verbal",
    title: "Ton och attityd på LÄS: ironisk, saklig eller polemisk?",
    question: `Frågorna om textens ton eller författarens inställning, hur avgör man dem?`,
    answer: `Frågor som "Vilken är författarens inställning?" prövar att du läser mellan raderna.

**Ledtrådar:**
- **Värdeladdade ord** (*förfärande*, *lysande*, *tveksam*) visar vad författaren tycker.
- **Tonen**: saklig (neutral, redovisar fakta), polemisk (angriper en åsikt), ironisk (säger motsatsen), reflekterande (funderar), uppmanande (vill få läsaren att agera).
- **Hur motsidan beskrivs**. Förvrängs den eller redovisas den rättvist?
- **Slutet.** Slutklämmen visar ofta riktningen.

**Fällor:**
- Att blanda ihop vad en person i texten tycker med vad författaren tycker.
- Alternativ med för starka ord (*hatar*, *förkastar helt*) när texten är försiktig.
- Att svara utifrån din egen åsikt.

Underlaget för svaret ska gå att peka ut i texten. Kan du inte det, välj ett försiktigare alternativ.

Se också [LÄS-guiden](https://tvakommanollan.se/guider/las).`,
  },
  {
    category: "verbal",
    title: "Hur skiljer man huvudpåstående från exempel i en längre text?",
    question: `Jag får svårt att se vad som är textens poäng och vad som bara är exempel.`,
    answer: `Fråga dig för varje stycke: **säger det här något nytt, eller visar det bara ett fall av något som redan sagts?**

**Tecken på exempel:**
- Inleds med *till exempel*, *exempelvis*, *ta ... som exempel* eller *så var det med ...*.
- Är konkret: namn, siffror, platser.
- Går att stryka utan att resonemanget faller.

**Tecken på huvudpåstående:**
- Är allmänt hållet.
- Står ofta i början eller slutet av ett stycke.
- Följs av belägg eller exempel.
- Signalord som *alltså*, *poängen är*, *det viktigaste*.

**Ett knep:** sammanfatta varje stycke med fem ord medan du läser. Sätter du ihop sammanfattningarna får du textens struktur.

Frågor om textens syfte kräver att du ser skillnaden. Ett exempel är aldrig huvudtanken.`,
  },
  {
    category: "verbal",
    title: "Hur mycket tid ska man lägga på varje delprov i verbalt?",
    question: `Ska man alltid göra delproven i den ordning de står i häftet?`,
    answer: `Nej. Du får göra uppgifterna i den ordning du vill inom ett pass, och det kan vara en fördel att byta.

**Argument för att ta de snabba först:**
- ORD och MEK går fortare per poäng än de långa texterna.
- Du säkrar poäng om tiden skulle ta slut.
- Du får en lugn start.

**Argument för att ta ordningen i häftet:**
- Du slipper hoppa och riskera att hamna på fel rad på svarsbladet.
- Det känns mindre stressigt.

**Tumregel:** välj en ordning som du övat på. Det är sämre att pröva en ny strategi på provdagen.

Tidsfördelning finns i tråden "Hur hinner man klart med det verbala provpasset?". Testa olika ordningar på gamla prov i [gamla prov](https://tvakommanollan.se/gamla-prov) och se vad som ger bäst resultat för dig.`,
  },
  {
    category: "plugg",
    title: "Pluggar man bäst ensam eller i grupp inför högskoleprovet?",
    question: `Jag får inte så mycket gjort ensam. Är en pluggkompis värd det?`,
    answer: `Båda fungerar, men till olika saker.

**Ensam fungerar bäst för:**
- Prov på tid. Du ska ändå sitta ensam på provdagen.
- Ordinlärning och repetition.
- Formler och övningsuppgifter i egen takt.

**I grupp fungerar bäst för:**
- Genomgång efter ett prov. Förklarar du en lösning för någon annan lär du dig den bättre.
- Motivation och ansvar. Det är lättare att dyka upp om någon väntar.
- Att se andra sätt att lösa samma uppgift.

**En blandning är ofta bäst:** skriv provet ensam, gå igenom felen tillsammans.

Har du ingen pluggkompis kan du skriva en lösning i forumet och se om andra löst den annorlunda. Genomgångar av provuppgifter finns under kategorierna för [kvantitativ](https://tvakommanollan.se/forum/kvantitativ) och [verbal](https://tvakommanollan.se/forum/verbal).`,
  },
  {
    category: "plugg",
    title: "Pluggteknik: korta pass med pauser",
    question: `Jag orkar inte sitta i flera timmar. Hur lägger man upp ett pass?`,
    answer: `Koncentrationen sjunker efter en stund, och pauser ger bättre resultat än ett långt pass.

**En enkel modell (ofta kallad pomodoro):**
1. 25 minuters fokuserad plugg, telefonen i ett annat rum.
2. 5 minuters paus. Res dig, drick vatten.
3. Upprepa fyra gånger, ta sedan en längre paus på 15–30 minuter.

**Anpassa efter dig:** prova 40 minuter plugg och 10 minuter paus om 25 känns för kort.

**Variera uppgifterna:** byt mellan ORD, matte och läsning. Hjärnan hinner vila från det du precis gjort.

**Avsluta med att skriva ned vad du kan nu** och vad du ska göra nästa gång. Det gör starten enklare.

Provet är 55 minuter per pass, så träna också på att sitta 55 minuter i sträck vid något tillfälle. Se tråden om att simulera provdagen.`,
  },
  {
    category: "plugg",
    title: "Vilka uppgifter ska man hoppa över på högskoleprovet?",
    question: `Hur avgör man att det är dags att släppa en uppgift och gå vidare?`,
    answer: `Varje uppgift ger samma poäng, så en som tar tre gånger så lång tid tar tid från andra poäng.

**Riktvärde:** ett pass är 40 uppgifter på 55 minuter, alltså ungefär **80 sekunder per uppgift** i snitt. Kvantitativt är det inte jämnt fördelat, men ligger du långt över två minuter på en uppgift är det dags att gå vidare.

**Gör så här:**
1. Markera uppgiften i häftet (en ring eller ett frågetecken).
2. Fyll i en gissning direkt så att rutan inte blir tom.
3. Gå vidare, och återvänd om tid finns.

**Uppgifter att hoppa över först:**
- Långa texter med många steg
- Uppgifter där du inte ens ser hur du ska börja
- Uppgifter som du tidigare tappat tid på

Många förbättrar sitt resultat mer av att bli bra på att släppa än av att kunna mer. Se [guiden om tidspress](https://tvakommanollan.se/guider/tidspress).`,
  },
  {
    category: "plugg",
    title: "Finns det någon bokstav man ska gissa på?",
    question: `Om man inte har en aning, finns det något mönster, som att C är vanligast?`,
    answer: `Nej, det finns inget pålitligt mönster. Rätta svar är utspridda över alternativen, och att gissa på samma bokstav ger ungefär samma chans som slumpen.

**Vad du kan lita på:**
- **Uteslutning.** Stryk det du vet är fel och gissa bland resten.
- **Alternativ som skiljer sig från de andra** är sällan bättre eller sämre, men alternativ som är förvrängningar av texten är oftast fel.
- **Rimlighetskontroll.** På kvant kan en snabb uppskattning ta bort alternativ som ligger för långt bort.

**Vad du inte ska göra:**
- Räkna ut mönster i facit från förra provet.
- Byta svar bara för att du har skrivit samma bokstav flera gånger i rad.

Gissa alltid på det du inte hinner, eftersom fel svar inte ger avdrag. Se tråden om att gissa.`,
  },
  {
    category: "plugg",
    title: "Ska man köpa en bok, en kurs eller bara öva på gamla prov?",
    question: `Det finns så många sätt att plugga. Vad är värt pengarna?`,
    answer: `Det beror på var du står och hur du lär dig.

**Gamla prov** är gratis och är den mest realistiska träningen. Provarrangören publicerar proven efter varje tillfälle, och alla ligger i [gamla prov](https://tvakommanollan.se/gamla-prov) med facit. Börja alltid här.

**Böcker** hjälper om du behöver förklaringar av teorin, särskilt matte. De ger sällan nya uppgifter att öva på som gamla prov inte redan ger.

**Kurser** hjälper de som behöver struktur och en lärare. Kolla vad som ingår och hur många gamla prov som gås igenom.

**Appar och webbtjänster** passar för korta pass, särskilt ordinlärning och repetition.

Vi har skrivit en jämförelse av **kategorierna** (utan att nämna enskilda företag) i [Plugga inför högskoleprovet](https://tvakommanollan.se/plugga-infor-hogskoleprovet), inklusive var vår egen tjänst inte räcker till.

Rekommendation: gör ett prov först, se var du tappar poäng och köp sedan det som hjälper just där.`,
  },
  {
    category: "provdagen",
    title: "Får man använda miniräknare på högskoleprovet?",
    question: `Kan man ha med en miniräknare eller formelsamling?`,
    answer: `Nej, **miniräknare och formelsamling är inte tillåtna** på högskoleprovet. Alla uppgifter är gjorda för att kunna lösas för hand, och räkningarna är medvetet enkla.

Det betyder att du behöver träna på att:
- Räkna i huvudet med bråk och procent.
- Förenkla rötter och potenser i stället för att räkna ut decimaler.
- Överslagsräkna.
- Kunna de formler du behöver (se trådarna om geometri och potenser).

I vissa uppgifter ger provet själv en formel eller ett tabellvärde. Läs uppgiften noga innan du gissar att något saknas.

Reglerna kan ändras. Kontrollera därför informationen från provets arrangör inför varje tillfälle.

Träna utan miniräknare från början, så att det inte blir en överraskning på provdagen.`,
  },
  {
    category: "provdagen",
    title: "Vad händer om jag kommer för sent till högskoleprovet?",
    question: `Kan man släppas in efter att provet har börjat?`,
    answer: `Räkna inte med det. Provet har fasta starttider och oftast släpps man inte in efter att skrivningen har börjat. Kallelsen anger vilken tid du ska vara på plats, som brukar vara en stund före start.

**Så undviker du problem:**
- Kolla vägen och restiden i förväg.
- Ta en tidigare buss eller tåg än du tror att du behöver.
- Ha legitimation och kallelse redo kvällen innan.
- Ta med extra tid för kö och identitetskontroll.

**Om det ändå händer:** kontakta provets arrangör så snabbt som möjligt, helst redan innan, om du inser att du blir försenad. Vi kan inte säga vad som gäller i ditt fall, eftersom det styrs av arrangörens regler.

Missar du provet får du vänta till nästa tillfälle, och du betalar avgiften igen vid ny anmälan. Se [provdatumsidan](https://tvakommanollan.se/hogskoleprovet-datum).`,
  },
  {
    category: "provdagen",
    title: "Publiceras provet och facit efter provdagen?",
    question: `Kan jag få se uppgifterna efter att jag skrivit provet?`,
    answer: `Ja. Provet i sin helhet publiceras av arrangören efter provtillfället, och det finns facit till alla uppgifter som räknas. Utprövningspasset publiceras inte på samma sätt.

Det betyder att du kan:
- Gå igenom dina svar och se hur du låg till.
- Räkna ut ditt antal rätt innan normeringen kommer.
- Använda provet som träning inför nästa gång.

Alla prov sedan 2012 finns i [gamla prov](https://tvakommanollan.se/gamla-prov) med facit och lösningar. Där kan du skriva dem på tid och få poängen räknad.

Vår uppskattning av normeringen efter varje prov hittar du på [facitsidan](https://tvakommanollan.se/hogskoleprovet-facit). Den är vår egen bedömning, inte arrangörens besked.`,
  },
  {
    category: "provdagen",
    title: "Hur ofta skrivs högskoleprovet och hur väljer man termin?",
    question: `Vårprov eller höstprov? Spelar det någon roll för resultatet?`,
    answer: `Provet skrivs två gånger per år: **vårprovet på en lördag i april** och **höstprovet på en söndag i oktober**. Alla datum finns på [provdatumsidan](https://tvakommanollan.se/hogskoleprovet-datum).

Det spelar ingen roll för *själva poängen*. Varje prov normeras för sig, och ett resultat från våren är värt exakt lika mycket som ett från hösten.

**Det som kan spela roll:**
- **Antagningstidpunkt.** Resultat måste finnas senast vid ansökningstidens slut. Räkna baklänges från ansökningsdeadline för den utbildning du vill söka.
- **Din pluggtid.** Välj det tillfälle då du hinner träna.
- **Anmälningsperioden.** Den är bara en dryg vecka, ett par månader före provet.

Resultatet gäller i åtta år, så du kan skriva tidigt och använda det senare.`,
  },
  {
    category: "allmant",
    title: "Vilket HP-resultat krävs för civilingenjörsprogram?",
    question: `Vad behöver man för att komma in på ett civilingenjörsprogram via högskoleprovet?`,
    answer: `Gränserna varierar mycket mellan lärosäten, program och terminer, och vi ger därför inte ett enskilt tal här. Du hittar de faktiska antagningsgränserna per utbildning på [poäng per utbildning](https://tvakommanollan.se/hogskoleprovet-poang).

Några saker som är bra att veta:
- Programmen på de mest sökta lärosätena och de med många sökande har ofta högre gränser än mindre program.
- Många civilingenjörsprogram har **flera urvalsgrupper** (betyg och högskoleprov). Du hamnar i alla du är behörig till.
- Grundläggande behörighet och särskilda behörighetskrav (matte och fysik) måste du uppfylla oavsett provresultat.
- Totalpoängen är medelvärdet av verbal och kvantitativ del, så en stark kvantitativ del kan väga upp en svagare verbal.

Titta på gränserna de senaste tre till fyra terminerna för att få en rimlig bild, eftersom de skiftar med antalet sökande.`,
  },
  {
    category: "allmant",
    title: "Vilket HP-resultat krävs för ekonomprogram?",
    question: `Hur högt behöver man ligga för att komma in på civilekonom eller ekonomprogram?`,
    answer: `Det varierar kraftigt mellan lärosäten. Handelshögskolor och populära orter har höga gränser medan andra program är betydligt lättare att komma in på.

Vi ger inget exakt tal, eftersom gränserna ändras varje termin. Hur de såg ut de senaste terminerna för olika program ser du på [poäng per utbildning](https://tvakommanollan.se/hogskoleprovet-poang). Se också tråden om Handelshögskolan i Stockholm.

**Bra att veta:**
- Många ekonomprogram har särskilda behörighetskrav i matte. Kontrollera dem hos lärosätet.
- Det kan finnas ett separat urval för program med färre sökande, eller för dem med tidigare studier.
- Ett bra provresultat kan hjälpa även när betygen räcker, eftersom du konkurrerar i flera grupper.

Om du ligger precis under en gräns lönar det sig ofta att skriva om. Resultatet gäller i åtta år och det bästa räknas.`,
  },
  {
    category: "allmant",
    title: "Vilket HP-resultat krävs för lärarprogram?",
    question: `Behöver man högt resultat för att bli lärare?`,
    answer: `Lärarprogrammen (förskollärare, grundlärare, ämneslärare) varierar mycket i hur svårt det är att komma in, beroende på lärosäte, inriktning och ort. Många kan nås med måttliga resultat medan vissa platser och ämneskombinationer har högre gränser.

Vi ger inga exakta tal här eftersom gränserna ändras varje termin. Titta på [poäng per utbildning](https://tvakommanollan.se/hogskoleprovet-poang) för de senaste terminerna.

**Bra att veta:**
- Läs programmets **behörighetskrav**. Vissa kräver särskild behörighet eller prov, oavsett poäng.
- Det kan finnas en särskild antagningsgrupp för yrkeserfarenhet eller andra kvalifikationer.
- Du kan söka flera orter och inriktningar samtidigt.

Skriver du provet för att kunna söka flera program är det bra att veta att resultatet gäller i åtta år och att det bästa räknas.`,
  },
  {
    category: "allmant",
    title: "Hur hittar man antagningsgränsen för sin utbildning?",
    question: `Var ser jag vilken poäng som krävdes förra terminen?`,
    answer: `Antagningsgränser (ofta kallade antagningspoäng) publiceras efter varje antagningsomgång. De visar den lägsta poäng som räckte till en plats i varje urvalsgrupp.

**Så hittar du dem:**
1. Gå till antagning.se och sök på utbildningen. Där finns tidigare terminers antagningsstatistik.
2. Titta på **urvalsgruppen HP**. Den visar högskoleprovspoängen som krävdes.
3. Jämför flera terminer. En enskild termin kan avvika.

Vi har samlat poängen för många utbildningar på [poäng per utbildning](https://tvakommanollan.se/hogskoleprovet-poang).

**Tänk på:**
- En antagningsgräns är **historik**, inte ett löfte. Nästa termin kan den bli högre eller lägre.
- Antalet platser och sökande avgör. En termin med få sökande kan ge en låg gräns.
- Har utbildningen urval i flera omgångar kan gränsen skilja mellan omgångarna.

Sikta gärna lite över senaste gränsen så har du marginal.`,
  },
  {
    category: "allmant",
    title: "Räknas högskoleprovet om man redan har högskolestudier?",
    question: `Jag har läst en termin på universitetet. Kan jag fortfarande söka med högskoleprovet?`,
    answer: `Ja. Högskoleprovet är ett urvalsinstrument och kan användas oavsett om du har tidigare studier. Du behöver bara uppfylla behörigheten till utbildningen du söker.

**Poängen räknas på samma sätt** oavsett om du har läst på högskola eller inte. Är dina betyg från gymnasiet inte tillräckligt är högskoleprovet ett sätt att konkurrera i en annan urvalsgrupp.

Om du har högskolepoäng kan det finnas **andra urvalsgrupper** som är aktuella för dig, till exempel för tidigare studieresultat. Det varierar mellan utbildningar, så läs på programmets egen sida.

Resultatet gäller i åtta år, och du kan skriva provet hur många gånger du vill. Se tråden om hur länge resultatet gäller.`,
  },
];
