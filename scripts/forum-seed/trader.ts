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
};

const FYLL_PA =
  "Svaret ligger nedanför. Fyll gärna på med egna erfarenheter eller rätta om något är fel.";

export const SEED_THREADS: SeedThread[] = [
  /* ── Allmänt ─────────────────────────────────────────────────── */
  {
    category: "allmant",
    title: "Hur är högskoleprovet uppbyggt?",
    question: `Hur många delar har högskoleprovet, hur lång tid tar det och vilka delprov ingår? ${FYLL_PA}`,
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
    question: `Hur går det till när antalet rätt blir en poäng mellan 0,0 och 2,0? ${FYLL_PA}`,
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
    question: `Vad räknas som ett bra resultat, och vad krävs för de populäraste utbildningarna? ${FYLL_PA}`,
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
    question: `Måste man skriva om provet efter några år, och vilket resultat räknas om man skrivit flera gånger? ${FYLL_PA}`,
    answer: `Resultatet gäller i **åtta år**. Har du skrivit flera gånger används **ditt bästa giltiga resultat** automatiskt när du söker, så du riskerar ingenting på att skriva igen.

Det finns ingen gräns för hur många gånger du får skriva provet och ingen åldersgräns. Många skriver det flera gånger och höjer sig rejält mellan tillfällena, eftersom provet går att träna på: uppgiftstyperna är desamma från gång till gång.`,
  },
  {
    category: "allmant",
    title: "Hur stor del av platserna går till högskoleprovet?",
    question: `Hur fungerar urvalet, och hur många platser fördelas på högskoleprovet jämfört med betyg? ${FYLL_PA}`,
    answer: `Till de flesta utbildningar fördelas **minst en tredjedel av platserna på betyg och minst en tredjedel på högskoleprovet**. Resten bestämmer lärosätet, och ofta hamnar även de i någon av de två grupperna.

Du hamnar automatiskt i alla urvalsgrupper du är behörig till och konkurrerar i den där du står starkast. Ett bra provresultat kan alltså aldrig skada en ansökan med bra betyg, det ger bara en chans till.

En del utbildningar använder egna urval, till exempel arbetsprov eller intervjuer. Kolla alltid utbildningens egen sida.`,
  },
  {
    category: "allmant",
    title: "Kan man plugga till högskoleprovet eller är det ett begåvningstest?",
    question: `Det sägs ibland att man inte kan plugga till högskoleprovet. Stämmer det? ${FYLL_PA}`,
    answer: `Nej, det stämmer inte. Provet mäter förmågor som går att träna, och uppgiftstyperna är exakt desamma varje termin.

Det som ger mest effekt:
- **ORD** går att plugga rakt av. Samma ord återkommer, och ett större ordförråd ger direkt fler rätt. Börja i [ordlistan](https://tvakommanollan.se/ordlista).
- **KVA och NOG** handlar mycket om att känna igen uppgiftstypen och undvika vanliga fällor.
- **XYZ** bygger på grundskolans och gymnasiets matte. Att repetera bråk, procent, ekvationer och geometri lönar sig.
- **Tidspress** tränas bort genom att skriva hela provpass på tid.

Det bästa sättet att se var du står är att skriva ett [gammalt prov](https://tvakommanollan.se/gamla-prov) på riktig tid och räkna poängen efteråt.`,
  },
  {
    category: "allmant",
    title: "Ska man gissa på högskoleprovet?",
    question: `Blir det minuspoäng för fel svar, och ska man gissa när man inte vet? ${FYLL_PA}`,
    answer: `Ja, **gissa alltid**. Fel svar ger inget avdrag, så en tom ruta är en garanterad nolla medan en gissning har 20–25 % chans att bli rätt.

Gör det till en vana: när det är fem minuter kvar på passet fyller du i alla uppgifter du inte hunnit med. Kan du stryka ett eller två alternativ först ökar chansen ordentligt. På KVA kan du till exempel ofta utesluta D direkt om båda storheterna går att räkna ut.`,
  },

  /* ── Kvantitativ del ─────────────────────────────────────────── */
  {
    category: "kvantitativ",
    title: "Hur löser man NOG-uppgifter?",
    question: `NOG-uppgifterna med påstående (1) och (2) känns förvirrande. Hur ska man tänka? ${FYLL_PA}`,
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
    question: `KVA tar för lång tid för mig. Finns det knep för kvantitativa jämförelser? ${FYLL_PA}`,
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
    question: `Vilka mattekunskaper krävs för XYZ på högskoleprovet? ${FYLL_PA}`,
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
    question: `DTK-uppgifterna tar lång tid. Hur blir man snabbare på att läsa diagram och tabeller? ${FYLL_PA}`,
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
    question: `Jag hinner aldrig alla 40 uppgifter på 55 minuter i kvant. Hur ska man fördela tiden? ${FYLL_PA}`,
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
    question: `Hur räknar man procent snabbt utan miniräknare, och vad är skillnaden mellan procent och procentenheter? ${FYLL_PA}`,
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
    question: `Vilka potenslagar behöver man kunna till XYZ och KVA? ${FYLL_PA}`,
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
    question: `Vilka geometriformler återkommer på XYZ och NOG? ${FYLL_PA}`,
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
    question: `Vilka fällor är vanligast på kvantitativa jämförelser? ${FYLL_PA}`,
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
    question: `Det kommer ofta uppgifter om medelvärde. Finns det snabba sätt att räkna? ${FYLL_PA}`,
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
    question: `Vilket är det bästa sättet att plugga ord inför ORD-delen? ${FYLL_PA}`,
    answer: `ORD är det delprov där plugg ger snabbast resultat, eftersom många ord återkommer mellan proven.

- **Plugga på ord som faktiskt kommit på provet.** Vi har samlat över 8 700 ord ur gamla prov med förklaringar i [ordlistan](https://tvakommanollan.se/ordlista).
- **Repetera med mellanrum.** Ett ord du kan i dag har du glömt om två veckor om du inte ser det igen. [Ordövningen](https://tvakommanollan.se/ord) tar tillbaka ord du svarat fel på.
- **Lär dig ordstammar och förled.** *Anti-*, *pro-*, *-logi*, *poly-* och liknande hjälper dig gissa ord du aldrig sett.
- **Plugga lite varje dag** hellre än mycket en gång i veckan. 15 minuter om dagen räcker långt.

När du skriver: läs alternativen och leta efter det som kan **ersätta** ordet i en mening. Mer i [ORD-guiden](https://tvakommanollan.se/guider/ord).`,
  },
  {
    category: "verbal",
    title: "Hur löser man MEK-uppgifter på högskoleprovet?",
    question: `Hur ska man tänka på meningskomplettering? Jag fastnar ofta mellan två alternativ. ${FYLL_PA}`,
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
    question: `LÄS tar för lång tid och jag är osäker på svaren. Hur tränar man läsförståelse? ${FYLL_PA}`,
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
    question: `Hur ska man förbereda sig för ELF? Min engelska är okej men jag tappar poäng. ${FYLL_PA}`,
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
    question: `Hur ska man fördela tiden på det verbala passet? Jag brukar inte hinna med ELF. ${FYLL_PA}`,
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
    question: `Vilka förled och ordstammar är bra att kunna för att gissa ord man inte känner igen? ${FYLL_PA}`,
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
    question: `På ORD känns det ofta som att två alternativ passar. Hur väljer man rätt? ${FYLL_PA}`,
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
    question: `När skrivs nästa högskoleprov, när kan man anmäla sig och vad kostar det? ${FYLL_PA}`,
    answer: `Nästa prov är **vårprovet lördagen den 10 april 2027**. Anmälan är öppen **7–14 januari 2027** på hogskoleprov.nu. Provavgiften är **550 kronor**.

Tänk på att anmälningsperioden bara är en dryg vecka, ett par månader före provet. Missar du den går det inte att anmäla sig i efterhand.

Vårprovet skrivs alltid på en lördag i april och höstprovet på en söndag i oktober. Alla datum finns på [provdatumsidan](https://tvakommanollan.se/hogskoleprovet-datum).`,
  },
  {
    category: "provdagen",
    title: "Vad ska man ta med till högskoleprovet?",
    question: `Vad behöver man ha med sig på provdagen, och vad är inte tillåtet? ${FYLL_PA}`,
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
    question: `Hur lång tid efter provet kommer facit, normering och det riktiga resultatet? ${FYLL_PA}`,
    answer: `Ordningen är densamma varje termin:

1. **Facit** publiceras kort efter provdagen. Då kan du räkna antal rätt själv.
2. **Normeringstabellen** kommer några veckor senare. Först då går antal rätt att omvandla till en poäng.
3. **Resultatet** syns sedan på ditt konto hos hogskoleprov.nu.

Medan du väntar kan du jämföra med tidigare terminers normeringar. Vi lägger upp facit och en uppskattad trolig normering på [facitsidan](https://tvakommanollan.se/hogskoleprovet-facit) efter varje prov. Uppskattningen är vår egen och inte provarrangörens besked.`,
  },
  {
    category: "provdagen",
    title: "Hur många rätt krävs för 2,0 på högskoleprovet?",
    question: `Hur många rätt behöver man ha på verbal och kvant för att få högsta poäng? ${FYLL_PA}`,
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
    question: `Ett av de fem passen räknas inte. Går det att lista ut vilket? ${FYLL_PA}`,
    answer: `Nej, inte under provdagen. Utprövningspasset ser ut precis som de andra och kan vara antingen verbalt eller kvantitativt. Därför ska du göra ditt bästa på alla fem.

Efter provet framgår det när facit publiceras: de pass som räknas har facit, utprövningspasset har det inte. Har du skrivit tre verbala pass var ett av dem utprövning, och samma sak gäller om du hade tre kvantitativa.

Ett tips är att inte låta ett pass som gick dåligt påverka resten av dagen. Det kan mycket väl vara det som inte räknas.`,
  },
  {
    category: "provdagen",
    title: "Hur fungerar normeringen av högskoleprovet?",
    question: `Varför ger samma antal rätt olika poäng olika år? ${FYLL_PA}`,
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
    question: `Hur många veckor innan ska man börja plugga, och hur mycket per dag? ${FYLL_PA}`,
    answer: `Det beror på var du startar och var du vill landa, men en riktlinje som fungerar för många:

- **2–3 månader** med 30–60 minuter om dagen räcker långt för de flesta.
- **Sista månaden** bör innehålla flera hela prov på tid.
- **Sista veckan** är för repetition och vila, inte för nytt stoff.

Börja med att skriva ett [gammalt prov](https://tvakommanollan.se/gamla-prov) på riktig tid. Då ser du direkt vilka delprov som drar ner dig, och kan lägga tiden där den gör mest nytta. Ofta är det ORD och KVA som ger flest poäng per pluggtimme.`,
  },
  {
    category: "plugg",
    title: "Hur lägger man upp ett studieschema för högskoleprovet?",
    question: `Hur ska en vanlig pluggvecka se ut inför högskoleprovet? ${FYLL_PA}`,
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
    question: `Jag ligger runt 1,0. Vad ska jag fokusera på för att nå 1,5? ${FYLL_PA}`,
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
    question: `Räcker det att göra gamla prov, eller behöver man annat material också? ${FYLL_PA}`,
    answer: `Gamla prov är det **närmaste du kommer det riktiga provet**: samma uppgiftstyper, samma svårighet och samma tidspress. De är oumbärliga, men det finns två fällor:

- **Att bara göra prov utan att gå igenom felen.** Det är i genomgången du lär dig.
- **Att göra slut på proven för tidigt.** Spara några av de senaste till sista månaden, så att du har ett ärligt mått på var du står.

Komplettera gärna med riktad träning på det som drar ner dig, till exempel ORD i [ordövningen](https://tvakommanollan.se/ord) eller MEK i [MEK-övningen](https://tvakommanollan.se/mek-ovning).

Alla prov från 2012 och framåt, med facit och poängräkning, finns i [gamla prov](https://tvakommanollan.se/gamla-prov).`,
  },
  {
    category: "plugg",
    title: "Hur håller man motivationen uppe när man pluggar till högskoleprovet?",
    question: `Det är svårt att hålla igång i flera månader. Hur gör ni för att orka? ${FYLL_PA}`,
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
    question: `Ska man plugga dagen innan provet eller vila? ${FYLL_PA}`,
    answer: `**Vila.** Det du inte kan dagen innan lär du dig inte heller på en kväll, men du kan bli trött av att försöka.

- Gå lätt igenom de ord och formler du redan kan, högst en halvtimme.
- Packa legitimation, kallelse, pennor, mat och vatten kvällen innan.
- Kolla hur du tar dig till provlokalen och hur lång tid det tar.
- Sov ordentligt. Provet är en lång dag.

På provdagen: ät frukost, var på plats i god tid, och glöm ett pass så fort det är slut. Ett pass som kändes dåligt kan vara utprövningspasset.`,
  },
];
