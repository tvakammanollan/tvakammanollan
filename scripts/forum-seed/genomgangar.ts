/**
 * Genomgångar av riktiga provuppgifter, en tråd per uppgift (2026-10-21).
 *
 * Uppgiftstexten och facit läses ur `src/data/prov/` när tråden byggs, så
 * att citatet är ordagrant. Här står bara lösningen, skriven för hand och
 * kontrollräknad mot facit. `seed-forum.ts` vägrar publicera en genomgång
 * vars `svar` inte är samma bokstav som arkivets facit.
 */
export type Genomgang = {
  term: string;
  pass: number;
  nr: number;
  /** Bokstaven lösningen kommer fram till. Måste stämma med arkivets facit. */
  svar: string;
  losning: string;
};

const KVA = "[KVA-guiden](https://tvakommanollan.se/guider/kva)";
const NOG = "[NOG-guiden](https://tvakommanollan.se/guider/nog)";
const XYZ = "[XYZ-guiden](https://tvakommanollan.se/guider/xyz)";

export const GENOMGANGAR: Genomgang[] = [
  /* ── Vårprovet 2026, provpass 3 ──────────────────────────────── */
  {
    term: "2026vt",
    pass: 3,
    nr: 6,
    svar: "A",
    losning: String.raw`Två bollar är redan tagna, så det finns **18 bollar kvar** i lådan.

Numren som är större än 11 och mindre än 18 är 12, 13, 14, 15, 16 och 17. Det är **6 nummer**, och ingen av de bollarna är tagen (11 och 18 räknas inte).

Sannolikheten blir $\frac{6}{18} = \frac{1}{3}$.

**Svar: A.** Fällan är att räkna med 20 bollar i nämnaren. Läs alltid efter vad som redan har plockats bort. Mer i ${XYZ}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 7,
    svar: "A",
    losning: String.raw`Räkna inte rakt av. Dela upp 44 så att 625 blir enkelt:

$625 \cdot 4 = 2500$, och $44 = 4 \cdot 11$.

Då är $44 \cdot 625 = 2500 \cdot 11 = 27\,500$.

Tiotalssiffran är **0**. **Svar: A.**

Bra att kunna: $25 \cdot 4 = 100$, $125 \cdot 8 = 1000$ och $625 \cdot 16 = 10\,000$. Ser du 25, 125 eller 625 i en uppgift, leta efter en fyra, åtta eller sexton att para ihop dem med.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 11,
    svar: "D",
    losning: String.raw`Volymen av en cylinder är $V = \pi r^2 h$. Med $V = 16$ och $h = 1$ blir det

$\pi r^2 = 16$, alltså $r^2 = \frac{16}{\pi}$.

Med $\pi \approx 3{,}14$ är $\frac{16}{\pi} \approx 5{,}1$, så $r \approx \sqrt{5{,}1}$.

Det ligger närmast $\sqrt{5}$ cm. **Svar: D.**

Fällan är alternativ B, 4 cm, som är vad man får om man glömmer $\pi$ och drar roten ur 16. Alternativ A, 2 cm, ligger också nära men $\sqrt{5} \approx 2{,}24$ är betydligt närmare. Mer i ${XYZ}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 12,
    svar: "C",
    losning: String.raw`Alla alternativ med rot är skrivna som en enda rot, så skriv om uttrycket på samma form.

$\frac{2\sqrt{3}}{3\sqrt{2}} = \frac{2}{3} \cdot \sqrt{\frac{3}{2}}$

Flytta in $\frac{2}{3}$ under roten genom att kvadrera det:

$\sqrt{\frac{4}{9} \cdot \frac{3}{2}} = \sqrt{\frac{12}{18}} = \sqrt{\frac{2}{3}}$

**Svar: C.** Kontroll: $\frac{2\sqrt{3}}{3\sqrt{2}} \approx \frac{3{,}46}{4{,}24} \approx 0{,}82$, och $\sqrt{0{,}667} \approx 0{,}82$.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 13,
    svar: "B",
    losning: String.raw`När nämnaren blir större blir bråket mindre, så länge allt är positivt.

Eftersom $x > 4$ är $\frac{1}{x} < \frac{1}{4}$.

Kvantitet II är alltså störst. **Svar: B.** Det här är en av de snabba KVA-uppgifterna. Ta poängen och gå vidare. Mer i ${KVA}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 15,
    svar: "D",
    losning: String.raw`Båda kvantiteterna är "ett tal" av ett visst slag, inte ett bestämt tal. Pröva ytterligheterna.

- Kvantitet I ligger mellan 66 666 och 77 777.
- Kvantitet II ligger mellan 66 666 och 88 888.

Väljer man 66 666 i båda är de **lika**. Väljer man 77 777 och 66 666 är **I störst**. Väljer man 66 666 och 88 888 är **II störst**.

**Svar: D.** Så fort en kvantitet beskrivs som "ett tal som …" ska du misstänka D och leta efter två exempel som ger olika svar. Mer i ${KVA}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 16,
    svar: "A",
    losning: String.raw`$x^2 = 4$ betyder att $x = 2$ eller $x = -2$. Pröva båda.

- $x = 2$: I $= (-2)^4 = 16$ och II $= (-2)^5 = -32$. I är störst.
- $x = -2$: I $= (-2)^0 = 1$ och II $= (-2)^1 = -2$. I är störst.

I båda fallen är I störst. **Svar: A.**

Det finns också en snabbare väg: $(-2)^{x+3} = -2 \cdot (-2)^{x+2}$. Exponenten $x + 2$ är jämn (4 eller 0), så kvantitet I är positiv och II är negativ. Mer i ${KVA}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 17,
    svar: "D",
    losning: String.raw`Båda är medelvärden av två tal, så det räcker att jämföra summorna:

I: $x + y$  II: $2x + \frac{y}{2}$

II minus I blir $x - \frac{y}{2}$. Det kan vara både positivt och negativt.

- $x = 1, y = 1$: I $= 2$, II $= 2{,}5$. II störst.
- $x = 1, y = 4$: I $= 5$, II $= 4$. I störst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 18,
    svar: "D",
    losning: String.raw`**Kvantitet I:** De ensiffriga jämna positiva heltalen är 2, 4, 6 och 8. Det finns bara fyra, så alla måste vara med. Summan är alltid **20**.

**Kvantitet II:** De udda är 1, 3, 5, 7 och 9, och tre ska väljas.
- Minsta summan: $1 + 3 + 5 = 9$
- Största summan: $5 + 7 + 9 = 21$

II kan alltså vara både mindre och större än 20. **Svar: D.**

Uppgiften är byggd för att man ska tro att I också varierar. Det gör den inte, och det är just därför II avgör. Mer i ${KVA}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 19,
    svar: "C",
    losning: String.raw`Räkna ut båda.

I: $\frac{1}{3} - \frac{1}{2} = \frac{2}{6} - \frac{3}{6} = -\frac{1}{6}$

II: $\frac{1}{2} \cdot \left(-\frac{1}{3}\right) = -\frac{1}{6}$

De är lika. **Svar: C.** När båda kvantiteterna är fasta tal kan svaret aldrig bli D, så räkna noga och lita på resultatet.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 20,
    svar: "A",
    losning: String.raw`I: Omkretsen av cirkeln är $2\pi r = 10\pi$.

II: Omkretsen av rektangeln är $2 \cdot (5{,}5 + 10) = 31$.

Med $\pi \approx 3{,}14$ är $10\pi \approx 31{,}4$, alltså lite mer än 31. **Svar: A.**

Det här är en uppgift där avrundningen avgör. Räknar du med $\pi \approx 3$ blir det 30 och fel svar. Använd minst två decimaler när marginalerna är små.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 21,
    svar: "D",
    losning: String.raw`$x$ är negativ och $y$ positiv, så både $\frac{x}{y}$ och $\frac{y}{x}$ är negativa. Vilken som är störst beror på storleken.

- $x = -0{,}5$, $y = 0{,}5$: båda blir $-1$. Lika.
- $x = -0{,}5$, $y = 0{,}25$: I $= -2$, II $= -0{,}5$. II störst.
- $x = -0{,}25$, $y = 0{,}5$: I $= -0{,}5$, II $= -2$. I störst.

**Svar: D.** Det räcker egentligen med två exempel som ger olika svar. Mer i ${KVA}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 22,
    svar: "B",
    losning: String.raw`$f(a) = 0$ betyder att $ka + m = 0$, alltså $k = -\frac{m}{a}$.

Både $m$ och $a$ är positiva, så $k$ är **negativ**. Kvantitet II, 0, är störst. **Svar: B.**

Tänk grafiskt: linjen skär y-axeln ovanför origo ($m > 0$) och x-axeln till höger om origo ($a > 0$). En sådan linje måste luta nedåt.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 23,
    svar: "C",
    losning: String.raw`**Pröva (1) ensamt.** Susanne spelar inte trummor, och elbasen spelas av Jenny eller Lina. Då måste Susanne spela gitarr. Men vem av Jenny och Lina som har elbas och vem som har trummor går inte att avgöra.

**Pröva (2) ensamt.** Jenny spelar inte trummor, och gitarren spelas av Susanne eller Lina. Då måste Jenny spela elbas. Men Susanne och Lina går inte att skilja åt.

**Tillsammans:** Susanne gitarr (ur 1), Jenny elbas (ur 2), och då återstår trummor för Lina.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 24,
    svar: "E",
    losning: String.raw`Låt $k$ vara antalet klasskamrater. Klassen har då $k + 1$ elever, eftersom Vilgot själv också går där.

**(1)** $k + 1 + 3 = k + 4$ är delbart med 5. Då kan $k$ vara 1, 6, 11, 16, 21 …

**(2)** $k$ är udda. Det säger ingenting om vilket tal det är.

**Tillsammans:** $k$ kan fortfarande vara 1, 11, 21 och så vidare.

**Svar: E.** Fällan är att glömma att Vilgot inte är sin egen klasskamrat. Det ändrar inte svaret här, men det gör det i liknande uppgifter. Mer i ${NOG}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 25,
    svar: "B",
    losning: String.raw`**(1)** Salladen står längst ned, och mjölken står på samma hylla som ketchupen. Mjölken kan stå på översta eller mellersta hyllan. Inte tillräckligt.

**(2)** Översta hyllan är tom och salladen står under mjölken. Mjölken kan inte stå längst ned, för då finns ingen hylla under den. Den kan inte stå överst, för den hyllan är tom. Alltså står den på **mittenhyllan**.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 26,
    svar: "C",
    losning: String.raw`**(1)** $x$ är delbart med 7 och ligger mellan 20 och 60: 21, 28, 35, 42, 49 eller 56. Inte tillräckligt.

**(2)** $x$ ger rest 4 vid division med 5: 24, 29, 34, 39, 44, 49, 54 eller 59. Inte tillräckligt.

**Tillsammans:** Det enda tal som finns i båda listorna är **49**.

**Svar: C.** I NOG behöver du inte räkna fram 49. Det räcker att se att det finns precis ett tal som uppfyller båda. Mer i ${NOG}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 27,
    svar: "D",
    losning: String.raw`**(1)** Hypotenusan och ena kateten är kända. Med Pythagoras sats får man den andra kateten ($\sqrt{16 - 4} = \sqrt{12}$), och då går arean att räkna ut. Tillräckligt.

**(2)** En vinkel på 60° i en rätvinklig triangel ger en 30-60-90-triangel. Med hypotenusan känd är alla sidor bestämda. Tillräckligt.

Båda räcker var för sig. **Svar: D.**

Kom ihåg: i NOG räcker det att veta att något **går** att räkna ut. Arean ($2\sqrt{3}$ cm²) behöver du aldrig ta fram. Mer i ${NOG}.`,
  },
  {
    term: "2026vt",
    pass: 3,
    nr: 28,
    svar: "B",
    losning: String.raw`**(1)** 20 madrasser är 90 cm och 10 av dem är mjuka. Men om de 15 madrasserna som är 120 cm vet vi ingenting. Inte tillräckligt.

**(2)** De hårda är $10 + 6 = 16$ stycken. Alla madrasser är antingen hårda eller mjuka, så de mjuka är $35 - 16 = 19$. Tillräckligt.

**Svar: B.** Uppgiften lockar en att kombinera (1) och (2), men (2) räcker ensamt. Pröva alltid varje påstående för sig innan du lägger ihop dem. Mer i ${NOG}.`,
  },

  /* ── Höstprovet 2025, provpass 4 ─────────────────────────────── */
  {
    term: "2025ht",
    pass: 4,
    nr: 1,
    svar: "D",
    losning: String.raw`12 % av 250 är $0{,}12 \cdot 250 = 30$.

Det nya priset är $250 + 30 = 280$ kronor. **Svar: D.**

Snabbare: 10 % av 250 är 25 och 2 % är 5. Tillsammans 30. Att dela upp procentsatser i 10 %, 5 % och 1 % är ofta det snabbaste sättet utan miniräknare.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 2,
    svar: "C",
    losning: String.raw`"Större än 10" betyder att 10 inte räknas. De fem minsta heltalen är 11, 12, 13, 14 och 15.

Talen ligger jämnt fördelade, så medelvärdet är talet i mitten: **13**. **Svar: C.**

Fällan är att ta med 10, vilket ger medelvärdet 12 (alternativ A).`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 4,
    svar: "B",
    losning: String.raw`Sätt $f(x) = 7$:

$7x^2 - 7 = 7$
$7x^2 = 14$
$x^2 = 2$
$x = \sqrt{2}$ (eller $-\sqrt{2}$, men det finns inte bland alternativen)

**Svar: B.** Ett tips är att dela med 7 direkt: $x^2 - 1 = 1$. Ju tidigare du förenklar, desto färre räknefel.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 6,
    svar: "A",
    losning: String.raw`Förenkla högerledet: $\sqrt{72} = \sqrt{36 \cdot 2} = 6\sqrt{2}$.

Då blir ekvationen $3x\sqrt{2} = 6\sqrt{2}$, och $\sqrt{2}$ kan strykas på båda sidor:

$3x = 6$, alltså $x = 2$. **Svar: A.**

Knepet är att leta efter den största kvadraten som går jämnt upp i talet under roten: 4, 9, 16, 25, 36, 49 …`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 7,
    svar: "C",
    losning: String.raw`Varje vecka multipliceras antalet med 2.

- Efter 1 vecka: $n \cdot 2$
- Efter 2 veckor: $n \cdot 2 \cdot 2 = n \cdot 2^2$
- Efter 10 veckor: $n \cdot 2^{10}$

**Svar: C.** Det är samma mönster som för all procentuell ökning: startvärdet gånger förändringsfaktorn upphöjt till antalet perioder.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 9,
    svar: "D",
    losning: String.raw`Börja med nämnaren:

$\frac{4}{9} - \frac{3}{7} = \frac{28}{63} - \frac{27}{63} = \frac{1}{63}$

Att dela med $\frac{1}{63}$ är samma sak som att multiplicera med 63:

$\frac{2}{7} \cdot 63 = 2 \cdot 9 = 18$

**Svar: D.** Liten nämnare ger stort svar, så alternativen under 1 kan uteslutas så fort du ser att nämnaren är nära noll.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 11,
    svar: "A",
    losning: String.raw`Multiplicera talen och tiopotenserna var för sig:

$2{,}5 \cdot 4 = 10$ och $10^{-11} \cdot 10^{-18} = 10^{-29}$

Då blir det $10 \cdot 10^{-29} = 10^{-28}$. **Svar: A.**

Fällan är att glömma att $2{,}5 \cdot 4$ blir 10, som flyttar exponenten ett steg. Utan det hamnar man på $10^{-29}$, som inte ens finns bland alternativen.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 12,
    svar: "A",
    losning: String.raw`Bryt ut $xy$ ur täljaren:

$x^2y^2 + xy = xy(xy + 1)$

Då blir uttrycket $\frac{xy(xy + 1)}{xy + 1} = xy$. Villkoret $xy \neq -1$ finns bara för att nämnaren inte ska bli noll.

**Svar: A.** Ser du samma uttryck i nämnaren som går att få fram i täljaren: faktorisera och stryk.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 13,
    svar: "C",
    losning: String.raw`Åldersskillnader ändras aldrig, eftersom alla fyller år samma dag.

- Erik är 7 år äldre än Johanna ($14 - 7$).
- Mikael är 5 år äldre än Johanna ($15 - 10$).

Alltså är Erik 2 år äldre än Mikael. När Mikael är 18 är Erik **20**. **Svar: C.**

Räkna med skillnaderna i stället för att följa åren ett i taget. Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 14,
    svar: "A",
    losning: String.raw`Ett tal mellan 0 och 1 blir större när man tar det inverterade värdet. Med $a = 0{,}5$ är $\frac{1}{a} = 2$.

$\frac{1}{a} > 1 > a$ för alla $a$ i intervallet. **Svar: A.**

Det här är en av de klassiska KVA-reglerna: för tal mellan 0 och 1 gäller $\frac{1}{a} > a > a^2$. Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 15,
    svar: "B",
    losning: String.raw`I: $\frac{5}{4} - \frac{4}{5} = \frac{25 - 16}{20} = \frac{9}{20} = 0{,}45$

II: $\frac{4}{3} - \frac{3}{4} = \frac{16 - 9}{12} = \frac{7}{12} \approx 0{,}58$

**Svar: B.** Ett mönster att känna igen: $\frac{a}{b} - \frac{b}{a} = \frac{a^2 - b^2}{ab}$. Det går snabbare än att leta gemensam nämnare varje gång.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 17,
    svar: "B",
    losning: String.raw`$x$ är mindre än 1, och att multiplicera ett positivt tal med något mindre än 1 gör det mindre. Alltså är $xy < y$.

**Svar: B.** Att $x < y$ spelar ingen roll här. Det står där för att få dig att jämföra fel saker. Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 19,
    svar: "D",
    losning: String.raw`Sätt in $y$ i uttrycket för $z$:

$z = 2(5x + 3) - 10x = 10x + 6 - 10x = 6$

$z$ är alltså alltid 6, men $x$ kan vara vilket positivt tal som helst. $x = 1$ ger II störst, och $x = 10$ ger I störst.

**Svar: D.** Det ser ut som en uppgift som ska räknas fram, men poängen är att $x$ försvinner ur $z$ och därför inte bestäms av något. Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 20,
    svar: "D",
    losning: String.raw`Medelvärdet säger inte mycket om medianen. Två exempel räcker:

- Tio tal med medelvärdet 0 och median 0: fem stycken $-1$ och fem stycken $1$.
- Tio tal med medelvärdet 100 men median $-50$: sex stycken $-50$ och fyra stycken $325$.

Medianen kan alltså bli både större och mindre i den ena gruppen. **Svar: D.**

Kom ihåg: ett enda stort tal kan dra upp medelvärdet utan att röra medianen.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 21,
    svar: "A",
    losning: String.raw`Förhållandet 1:2:4 betyder 7 delar sammanlagt. Vinkelsumman är 180°, så en del är $\frac{180°}{7}$.

Den största vinkeln är $4 \cdot \frac{180°}{7} = \frac{720°}{7} \approx 102{,}9°$.

Det är mer än 90°. **Svar: A.** Du behöver inte räkna exakt: $\frac{4}{7}$ är mer än hälften, och hälften av 180° är 90°.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 22,
    svar: "C",
    losning: String.raw`Skriv om varje parentes som ett bråk:

$\frac{3}{2} \cdot \frac{2}{3} \cdot \frac{5}{4} \cdot \frac{4}{5}$

De två första tar ut varandra, och de två sista gör det också. Produkten är **1**. **Svar: C.**

När en uppgift har en lång kedja av bråk: leta efter par som är varandras inverterade värden.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 23,
    svar: "C",
    losning: String.raw`**(1)** Dylan har marsvinet. Kaninen är Bellas eller Connys. Kvar för Astrid, Bella och Conny är hamster, kanin och undulat, och det går inte att fördela. Inte tillräckligt.

**(2)** Conny har undulaten. Kaninen är Bellas eller Dylans. Det räcker inte heller.

**Tillsammans:** Dylan marsvin, Conny undulat. Kaninen kan då bara vara Bellas, och Astrid får hamstern.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 24,
    svar: "D",
    losning: String.raw`**(1)** 4 bollar är 20 % av samlingen. Då är samlingen $\frac{4}{0{,}2} = 20$ bollar. Tillräckligt.

**(2)** 4 bollar ökade samlingen med 25 %. Före tillskottet var den alltså $\frac{4}{0{,}25} = 16$, och nu är den $16 + 4 = 20$. Tillräckligt.

**Svar: D.** Fällan i (2) är att tro att 25 % gäller den nya samlingen. Procentuell ökning räknas alltid på värdet **före** ökningen. Mer i ${NOG}.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 26,
    svar: "A",
    losning: String.raw`Det finns lika många enkronor som femkronor. Kalla antalet av varje sort $n$. Mynten är då värda $n + 5n = 6n$ kronor.

**(1)** Allt är värt 420 och sedlarna 300, så mynten är värda 120. $6n = 120$ ger $n = 20$, alltså 40 mynt. Tillräckligt.

**(2)** $5n$ plus värdet av femtiolapparna är 200. Det fungerar med $n = 10$ och tre femtiolappar, eller $n = 20$ och två, och så vidare. Inte tillräckligt.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 27,
    svar: "C",
    losning: String.raw`Rita gärna upp fyra grupper: bara katt, katt och hund, bara hund och ingetdera.

**(1)** 10 har katt men inte hund, så 4 har både katt och hund. Men hur många som bara har hund vet vi inte.

**(2)** De med båda är en sjättedel av dem med ingetdera. Utan att veta antalet med båda går det inte att räkna fram.

**Tillsammans:** 4 har båda, så 24 har ingetdera. Kvar blir $45 - 10 - 4 - 24 = 7$ som bara har hund. Med hund totalt: $7 + 4 = 11$.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 28,
    svar: "E",
    losning: String.raw`Var för sig räcker inget av påståendena, så pröva dem tillsammans.

Ur (1) och (2): $y + z = -2y$, alltså $z = -3y$. Dessutom är $x = -2y$.

- Om $y = 1$: $x = -2$, $z = -3$. Då är **y** störst.
- Om $y = -1$: $x = 2$, $z = 3$. Då är **z** störst.

Det beror på om $y$ är positiv eller negativ, och det står ingenstans. **Svar: E.** Mer i ${NOG}.`,
  },
];
