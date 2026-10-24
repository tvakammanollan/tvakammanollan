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

  /* ── Vårprovet 2026, provpass 5 ──────────────────────────────── */
  {
    term: "2026vt",
    pass: 5,
    nr: 1,
    svar: "A",
    losning: String.raw`Multiplicera in parenteserna:

$3x - 12 = 5x + 10$

Samla $x$ på ena sidan och talen på den andra:

$-12 - 10 = 5x - 3x$
$-22 = 2x$
$x = -11$

**Svar: A.** Kontroll: $3(-15) = -45$ och $5(-9) = -45$. Stämmer. Att sätta in svaret tar fem sekunder och fångar de flesta teckenfel.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 2,
    svar: "A",
    losning: String.raw`Kontrollera steg 1: $-6(x - 2) = -6x + 12$, eftersom minus gånger minus blir plus. Melvin skrev $-12$.

Felet uppstod alltså redan i **steg 1**. **Svar: A.**

Det är det vanligaste räknefelet på hela provet: ett minustecken framför en parentes ska multipliceras med **varje** term inuti. Resten av Melvins steg är korrekta utifrån det felaktiga steg 1, vilket är just det som gör uppgiften lurig.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 3,
    svar: "C",
    losning: String.raw`Medelvärdet är summan delad med antalet:

$\frac{1}{2} + \frac{5}{7} = \frac{7}{14} + \frac{10}{14} = \frac{17}{14}$

Dela med 2: $\frac{17}{28}$. **Svar: C.**

Rimlighetskontroll: medelvärdet måste ligga mellan $\frac{1}{2} = 0{,}5$ och $\frac{5}{7} \approx 0{,}71$. $\frac{17}{28} \approx 0{,}61$ gör det, medan $\frac{15}{28} \approx 0{,}54$ ligger väl nära kanten.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 5,
    svar: "D",
    losning: String.raw`Täljaren först: $\frac{1}{4} + \frac{1}{5} = \frac{5}{20} + \frac{4}{20} = \frac{9}{20}$.

Att dela med $\frac{1}{6}$ är att multiplicera med 6:

$\frac{9}{20} \cdot 6 = \frac{54}{20} = \frac{27}{10}$

**Svar: D.** Delar man med något mindre än 1 blir svaret större än täljaren. Det utesluter A och B direkt.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 7,
    svar: "B",
    losning: String.raw`Räkna utan decimaler först: $8 \cdot 3 = 24$.

Räkna sedan decimalerna: 0,08 har två och 0,03 har två, alltså fyra sammanlagt. Svaret ska ha fyra decimaler: $0{,}0024$.

**Svar: B.** Överslag: 0,08 är knappt en tiondel, så svaret ska vara knappt en tiondel av 0,03, alltså runt 0,003.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 8,
    svar: "C",
    losning: String.raw`Båda termerna innehåller $xy$, och 28 och 20 är båda delbara med 4. Bryt ut $4xy$:

$-28xyz + 20xy = 4xy(-7z + 5) = 4xy(5 - 7z)$

**Svar: C.** Kontrollera alltid genom att multiplicera in igen: $4xy \cdot 5 = 20xy$ och $4xy \cdot (-7z) = -28xyz$.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 9,
    svar: "B",
    losning: String.raw`Ta reda på $k$ med hjälp av $f(10) = 3$:

$10k + 7 = 3$, alltså $k = -0{,}4$.

Då är $f(20) = 20 \cdot (-0{,}4) + 7 = -8 + 7 = -1$.

**Svar: B.** Ett snabbare sätt: från $x = 0$ till $x = 10$ sjunker funktionen från 7 till 3, alltså med 4. Från 10 till 20 sjunker den lika mycket till: $3 - 4 = -1$.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 11,
    svar: "D",
    losning: String.raw`Se $3^4$ som en enhet. $4 \cdot 3^4 - 3^4$ är fyra stycken minus en stycken, alltså $3 \cdot 3^4 = 3^5$.

Sedan multipliceras det med 3 utanför parentesen: $3 \cdot 3^5 = 3^6$.

**Svar: D.** Samma knep som när man räknar "4 äpplen minus 1 äpple". Det sparar dig från att räkna ut $3^4 = 81$ alls.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 12,
    svar: "A",
    losning: String.raw`Faktorisera: $a^2b - ab^2 = ab(a - b)$.

Uttrycket är positivt om $ab$ och $a - b$ har samma tecken. Pröva alternativen:

- **A** $a < 0, b > 0$: $ab < 0$ och $a - b < 0$. Minus gånger minus blir plus. Alltid positivt.
- **B** $a > 0, b < 0$: $ab < 0$ men $a - b > 0$. Alltid negativt.
- **C** och **D**: $ab > 0$, men tecknet på $a - b$ beror på vilket tal som är störst.

**Svar: A.** Ordet "med säkerhet" betyder att svaret ska gälla för alla tal som uppfyller villkoret, inte bara för några.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 13,
    svar: "C",
    losning: String.raw`Om den ena tärningen visar en tvåa avgörs summan helt av den andra tärningen.

- Summan 3 kräver att den andra visar en etta. Sannolikhet $\frac{1}{6}$.
- Summan 7 kräver att den andra visar en femma. Sannolikhet $\frac{1}{6}$.

De är lika. **Svar: C.**

Fällan är att tänka på hur ovanlig summan 3 är med två tärningar i allmänhet. Men villkoret att en tärning redan visar en tvåa ändrar allt.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 14,
    svar: "B",
    losning: String.raw`$\sqrt{27} = \sqrt{9 \cdot 3} = 3\sqrt{3}$, så kvantitet I är $\frac{1}{3} \cdot 3\sqrt{3} = \sqrt{3}$.

$\sqrt{3} \approx 1{,}73$, vilket är mindre än 3. **Svar: B.**

Det går ännu snabbare: $\sqrt{27}$ ligger mellan 5 och 6, och en tredjedel av det är under 2.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 16,
    svar: "C",
    losning: String.raw`Skriv villkoret som en ekvation: $1{,}5x = 0{,}5y$.

Multiplicera båda sidor med 2: $3x = y$.

Kvantiteterna är alltså exakt lika. **Svar: C.**

Det är ett vanligt KVA-mönster: villkoret är ofta precis det som behövs för att jämföra kvantiteterna, bara omskrivet.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 17,
    svar: "C",
    losning: String.raw`$-2y$ och $-(2y)$ är samma sak. Det spelar ingen roll om man först tar $2y$ och sedan byter tecken, eller multiplicerar $y$ med $-2$ direkt.

**Svar: C.** Villkoret $y < 0$ finns där för att man ska börja tänka på tecken och kanske tro att svaret är A. Läs uttrycken noga innan du sätter in tal.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 19,
    svar: "B",
    losning: String.raw`Skärningspunkter hittas genom att sätta y-uttrycken lika.

**$L_1$ och $L_3$:** $2x + 1 = x$, alltså $x = -1$.

**$L_2$ och $L_3$:** $-x + 4 = x$, alltså $x = 2$.

$2 > -1$. **Svar: B.**`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 20,
    svar: "A",
    losning: String.raw`Att dela med $\frac{1}{x+1}$ är att multiplicera med $x + 1$. Kvantitet I är alltså $x(x + 1)$.

- I: för $x = 2$ är det 6, och det växer med $x$.
- II: $\frac{x+1}{x} = 1 + \frac{1}{x}$, som är högst 1,5 när $x \geq 2$.

I är alltid störst. **Svar: A.**`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 21,
    svar: "A",
    losning: String.raw`Triangeln är rätvinklig med kateterna 3 och 4. Arean är $\frac{3 \cdot 4}{2} = 6$ cm², och omkretsen $3 + 4 + 5 = 12$ cm.

Kvadraten har också arean 6, så sidan är $\sqrt{6} \approx 2{,}45$ cm och omkretsen ungefär $4 \cdot 2{,}45 = 9{,}8$ cm.

**Svar: A.** Allmänt gäller att av alla fyrhörningar med en viss area har kvadraten minst omkrets. En triangel med samma area har alltid större omkrets än kvadraten.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 22,
    svar: "D",
    losning: String.raw`Multiplicera båda sidor med $y$:

$x + 3y = 2y$, alltså $x = -y$.

$x$ och $y$ har motsatta tecken. Är $y$ positiv är II störst, och är $y$ negativ är I störst.

**Svar: D.** Villkoret säger bara att $y \neq 0$, inte om $y$ är positiv eller negativ.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 23,
    svar: "C",
    losning: String.raw`**(1)** Den tomma koppen står i mitten. Varmt och kallt kan stå i vilken ordning som helst på sidorna. Inte tillräckligt.

**(2)** Kallt kaffe står längst till höger, och varmt någonstans till vänster om det. Varmt kan stå längst till vänster eller i mitten. Inte tillräckligt.

**Tillsammans:** Tomt i mitten, kallt till höger, och då står varmt till vänster.

**Svar: C.** Formuleringen "någonstans till vänster" är det som gör att (2) inte räcker ensamt.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 24,
    svar: "D",
    losning: String.raw`**(1)** Fem tomtar är 25 % av samlingen. Då har hon $\frac{5}{0{,}25} = 20$ tomtar. Tillräckligt.

**(2)** $\frac{7}{10}$ står i skåpet, så de sex på hyllan är $\frac{3}{10}$. Då är hela samlingen $6 \cdot \frac{10}{3} = 20$. Tillräckligt.

**Svar: D.** Båda räcker var för sig, och de ger dessutom samma svar. Det är inget krav på NOG, men det är en bra kontroll.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 25,
    svar: "C",
    losning: String.raw`**(1)** 400 askar, varav 250 stora och 150 små. 300 med choklad, alltså 100 med lakrits. Men hur lakritsen fördelar sig på stora och små vet vi inte.

**(2)** 100 små askar med choklad, och en fjärdedel innehöll lakrits. Utan totalen går inget att räkna fram.

**Tillsammans:** Det finns 150 små askar och 100 av dem har choklad, så 50 små har lakrits. Lakritsaskarna är 100 totalt, alltså är $100 - 50 = 50$ av dem stora.

**Svar: C.** Rita gärna en fyrfältstabell (stor/liten mot lakrits/choklad). Det gör den här typen av NOG mycket enklare.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 26,
    svar: "A",
    losning: String.raw`**(1)** Priset efter sänkningen var 350 kr, så det ordinarie priset var $350 + 150 = 500$ kr. Sänkningen var $\frac{150}{500} = 30\,\%$. Tillräckligt.

**(2)** Påståendet handlar om ett påhittat pris. Att 150 kr är 25 % av 600 kr stämmer alltid och säger ingenting om varans riktiga pris. Inte tillräckligt.

**Svar: A.** "Om priset hade varit …" är en vanlig fälla. Påståendet är sant men oanvändbart.`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 27,
    svar: "A",
    losning: String.raw`**(1)** Med fyra gånger så hög hastighet tar resan en fjärdedel av tiden. Den tiden är 2 timmar, så den riktiga resan tar 8 timmar. Tillräckligt.

**(2)** Vi vet sträckan och förhållandet mellan hastigheterna, men inte någon av hastigheterna själv. Resan kan ta hur lång tid som helst. Inte tillräckligt.

**Svar: A.**`,
  },
  {
    term: "2026vt",
    pass: 5,
    nr: 28,
    svar: "C",
    losning: String.raw`Serien har sju värden, så medianen är det fjärde i storleksordning. De kända värdena är 1, 11, 19, 27 och 35.

**(1)** För att medianen ska vara 13 måste ett av $x$ och $y$ vara 13 och det andra vara mindre än 13. Då hamnar 1, 11 och det mindre talet under, och 19, 27 och 35 över. Men vilket av $x$ och $y$ som är 13 vet vi inte. Inte tillräckligt.

**(2)** $x < y$ säger ingenting om värdet. Inte tillräckligt.

**Tillsammans:** Det större av de två är 13, och enligt (2) är det $y$. Alltså $y = 13$.

**Svar: C.** Notera att serien inte står i storleksordning. Sortera alltid innan du letar median.`,
  },
  /* ── Höstprovet 2025, provpass 1 ─────────────────────────────── */
  {
    term: "2025ht",
    pass: 1,
    nr: 1,
    svar: "B",
    losning: String.raw`Flytta över $\frac{1}{4}$ och skriv båda bråken med nämnaren 8:

$x = \frac{1}{8} - \frac{1}{4} = \frac{1}{8} - \frac{2}{8} = -\frac{1}{8}$

**Svar: B.** Rimlighetskoll: $\frac{1}{8}$ är mindre än $\frac{1}{4}$, så $x$ måste vara negativt. Det stryker C och D direkt. Mer i ${XYZ}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 3,
    svar: "A",
    losning: String.raw`Multiplicera ut term för term:

$(3x + y)(x - y) = 3x^2 - 3xy + xy - y^2 = 3x^2 - 2xy - y^2$

**Svar: A.** Snabbkoll med siffror: sätt $x = 1$ och $y = 1$. Då är uttrycket $4 \cdot 0 = 0$, och bara A ger $3 - 2 - 1 = 0$. Mer i ${XYZ}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 4,
    svar: "D",
    losning: String.raw`Räkna inifrån och ut. Först $f(3) = 4 \cdot 3 + 1 = 13$.

Sedan $g(3) = 2 \cdot f(3) - 1 = 2 \cdot 13 - 1 = 25$.

**Svar: D.** Fällan är B, 13, som är $f(3)$ och inte $g(3)$. Mer i ${XYZ}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 6,
    svar: "B",
    losning: String.raw`45 % är $0{,}45$, och $0{,}45 \cdot 2 = 0{,}9$. Alltså:

$0{,}45 \cdot \frac{2}{9} = \frac{0{,}9}{9} = 0{,}1 = \frac{1}{10}$

**Svar: B.** Att multiplicera täljaren först och dela sist håller siffrorna små. Mer i ${XYZ}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 7,
    svar: "A",
    losning: String.raw`Byt till samma enheter. 18 km är 18 000 m.

Tid $= \frac{\text{sträcka}}{\text{hastighet}} = \frac{18\,000}{20} = 900$ sekunder.

900 sekunder är 15 minuter. **Svar: A.** Bra att kunna: 20 m/s är 72 km/h, och 18 km i 72 km/h är en kvarts timme. Mer i ${XYZ}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 8,
    svar: "B",
    losning: String.raw`Triangeln har hörn i origo, i $(0, -4)$ och där L skär $x$-axeln, säg i $(a, 0)$.

Höjden längs $y$-axeln är 4, så arean är $\frac{4 \cdot |a|}{2} = 2|a|$. Arean är 2, alltså $|a| = 1$.

Eftersom $k$ är negativt lutar linjen nedåt åt höger. Den går genom $(0, -4)$ och måste därför nå $x$-axeln till **vänster** om origo, alltså $a = -1$.

**Svar: B,** $(-1, 0)$. Rita en snabb skiss. Lutningen avgör tecknet direkt. Mer i ${XYZ}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 9,
    svar: "D",
    losning: String.raw`Gemensam nämnare är $ab$. Förläng båda bråken:

$\frac{b}{a} + \frac{1}{b} = \frac{b \cdot b}{ab} + \frac{a}{ab} = \frac{b^2 + a}{ab}$

**Svar: D.** Kontroll med $a = 1$, $b = 2$: uttrycket blir $2 + \frac{1}{2} = 2{,}5$ och D ger $\frac{4 + 1}{2} = 2{,}5$. Mer i ${XYZ}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 10,
    svar: "C",
    losning: String.raw`Förenkla innan du räknar. $\frac{4100}{200} = 20{,}5$, så

$\frac{44 \cdot 4100}{200} = 44 \cdot 20{,}5 = 902$

$\sqrt{902}$ ligger strax över $\sqrt{900} = 30$.

**Svar: C.** Uppgiften frågar efter närmaste värde. Gör om talet till något som ligger nära en jämn kvadrat. Mer i ${XYZ}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 11,
    svar: "C",
    losning: String.raw`Talet $x$ är större än 40 om tiotalssiffran är 4, 5 eller 6. Med tiotalssiffran 4 blir talet 41–46, och alla de är större än 40, eftersom entalssiffran aldrig kan bli 0.

Tre av tärningens sex utfall ger alltså ett tal över 40:

$P = \frac{3}{6} = \frac{1}{2}$

**Svar: C.** Fällan är att bara räkna 5 och 6 och få $\frac{1}{3}$ (alternativ B). Tärningen har ingen nolla. Mer i ${XYZ}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 12,
    svar: "D",
    losning: String.raw`Skriv om de negativa exponenterna som bråk:

$2 \cdot 3^{-1} + 3 \cdot 3^{-2} = \frac{2}{3} + \frac{3}{9} = \frac{2}{3} + \frac{1}{3} = 1$

**Svar: D.** $3^{-1} = \frac{1}{3}$ och $3^{-2} = \frac{1}{9}$. Mer i ${XYZ}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 13,
    svar: "B",
    losning: String.raw`$\sqrt{16} = 4$, och 25 procent av 4 är 1.

$\sqrt{4} = 2$.

Kvantitet II är större. **Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 14,
    svar: "C",
    losning: String.raw`Sätt in värdena.

- $f(-2) = -\frac{-2}{2} + 5 = 1 + 5 = 6$
- $g(14) = \frac{14}{2} - 1 = 7 - 1 = 6$

De är lika. **Svar: C.** Se upp med minustecknet i $f$: $-\frac{-2}{2}$ är plus ett. Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 16,
    svar: "C",
    losning: String.raw`Lös båda ekvationerna.

- $2 = \frac{194}{x}$ ger $x = 97$.
- $3 = 100 - y$ ger $y = 97$.

**Svar: C.** Båda är exakta tal, så D kan aldrig vara rätt här. Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 17,
    svar: "D",
    losning: String.raw`Ta skillnaden: $(3x - 2y) - (x - y) = 2x - y$.

Vi vet bara att $y > 0$. Om $x$ är stort blir $2x - y$ positivt och II störst. Om $x$ är negativt blir $2x - y$ negativt och I störst.

**Svar: D.** Exempel: $y = 1$, $x = 5$ ger I $= 4$, II $= 13$. Med $x = -5$ blir I $= -6$, II $= -17$. När $x$ saknar villkor är D nästan alltid svaret. Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 18,
    svar: "A",
    losning: String.raw`Räkna med decimaler, det räcker.

- $\frac{1}{2} + \frac{2}{5} + \frac{3}{7} \approx 0{,}5 + 0{,}4 + 0{,}43 = 1{,}33$
- $\frac{93}{71} \approx 1{,}31$ (eftersom $71 \cdot 1{,}3 = 92{,}3$)

Kvantitet I är större. **Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 19,
    svar: "A",
    losning: String.raw`Omkretsen är $\pi d$, så kvoten omkrets genom diameter är $\pi \approx 3{,}14$.

$2\sqrt{2} \approx 2 \cdot 1{,}41 = 2{,}83$.

**Svar: A.** Kvoten är alltid $\pi$, oavsett cirkelns storlek. Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 20,
    svar: "A",
    losning: String.raw`Titta bara på tecknen.

- $x^3 y^4$: $x^3 > 0$ och $y^4 > 0$ (jämn exponent), så I är positiv.
- $x^4 y^3$: $x^4 > 0$ men $y^3 < 0$ (udda exponent), så II är negativ.

Ett positivt tal är alltid större än ett negativt. **Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 22,
    svar: "C",
    losning: String.raw`Primtalsfaktorisera: $42 = 2 \cdot 3 \cdot 7$. Det är det enda sättet att skriva 42 som en produkt av tre primtal.

Medianen av 2, 3 och 7 är 3.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 24,
    svar: "C",
    losning: String.raw`Vi behöver båda simmarnas tider.

(1) ger Sarahs tid: $\frac{100}{1{,}91} \approx 52{,}4$ sekunder. Men vi vet inget om Therese, så (1) räcker inte.

(2) ger Thereses tid, 50,6 sekunder, men inget om Sarah. Räcker inte heller.

Tillsammans: Therese simmade på 50,6 s och Sarah på ungefär 52,4 s, så Therese vann.

**Svar: C.** Du behöver inte räkna exakt. $1{,}91 \cdot 50{,}6 < 100$, så Sarah hade inte hunnit i mål på Thereses tid. Mer i ${NOG}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 25,
    svar: "A",
    losning: String.raw`(1): $\frac{x + y}{2} + 3 = 10$ ger $\frac{x+y}{2} = 7$, alltså $x + y = 14$. Räcker.

(2): $y = 6x$ ger $x + y = 7x$, men $x$ är okänt. Räcker inte.

**Svar: A.** Lägg märke till att (1) ger summan direkt, utan att du behöver veta $x$ och $y$ var för sig. Mer i ${NOG}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 23,
    svar: "E",
    losning: String.raw`(1) säger att 18 paket är mönstrade, alltså är $25 - 18 = 7$ enfärgade. Inget om hårt eller mjukt.

(2) säger att av de enfärgade är 5 hårda och 2 mjuka.

Tillsammans vet vi att 5 enfärgade paket är hårda. Men vi vet inget om hur de 18 mönstrade fördelar sig, så det totala antalet hårda paket går inte att räkna ut.

**Svar: E.** Fråga dig alltid om varje grupp är täckt. Här saknas hela den mönstrade gruppen. Mer i ${NOG}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 26,
    svar: "E",
    losning: String.raw`Tre av fem fick medalj. Pröva om Anki kan sakna medalj när båda påståendena gäller.

Tillsammans vet vi att Ellen inte fick medalj (1). Då ska tre av Anki, Bosse, Cissi och Danne ha medalj.

- Bosse, Cissi och Danne med medalj: minst en av Bosse och Danne har medalj, minst en av Anki och Cissi har medalj, och Ellen saknar medalj. Allt stämmer, och **Anki fick ingen**.
- Anki, Bosse och Cissi med medalj: stämmer också, och **Anki fick medalj**.

Båda fallen går, så frågan kan inte avgöras. **Svar: E.** Ett motexempel åt vardera hållet räcker för att visa E. Mer i ${NOG}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 27,
    svar: "B",
    losning: String.raw`(1) Varken Göran eller Roger är kassör, alltså är Stig kassör. Sekreteraren är Göran eller Roger, och vi vet inte vem. Räcker inte.

(2) Varken Göran eller Stig är ordförande, alltså är Roger ordförande. Stig är kassör. Då blir Göran sekreterare. Räcker.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2025ht",
    pass: 1,
    nr: 28,
    svar: "D",
    losning: String.raw`Kalla antalet i påse B för $b$. Då har påse A $2b$ äpplen och tillsammans $3b$.

(1): $2b - 10 = 3(b - 10)$ ger $2b - 10 = 3b - 30$, alltså $b = 20$. Räcker, totalt 60 äpplen.

(2): $2b - b = 20$ ger $b = 20$. Räcker också.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2025ht",
    pass: 4,
    nr: 3,
    svar: "C",
    losning: String.raw`Multiplicera båda leden med 8:

$x = \frac{8}{3}$

**Svar: C.** Fällan är A, $\frac{1}{24}$, som man får om man delar med 8 i stället för att multiplicera. Mer i ${XYZ}.`,
  },

  /* ── Vårprovet 2025, provpass 3 ──────────────────────────────── */
  {
    term: "2025vt",
    pass: 3,
    nr: 1,
    svar: "D",
    losning: String.raw`Samla $x$ på ena sidan: $16 + 8 = 6x - 4x$, alltså $24 = 2x$ och $x = 12$.

**Svar: D.** Kontroll: $4 \cdot 12 + 16 = 64$ och $6 \cdot 12 - 8 = 64$. Mer i ${XYZ}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 2,
    svar: "C",
    losning: String.raw`Gör om allt till centimeter först.

- 2 m = 200 cm
- 2 dm = 20 cm
- 2 mm = 0,2 cm

Volymen är $200 \cdot 20 \cdot 0{,}2 = 800$ cm³. **Svar: C.** Byt alltid enhet innan du multiplicerar, inte efter. Mer i ${XYZ}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 3,
    svar: "B",
    losning: String.raw`Skriv 27 som en potens av 3: $27 = 3^3$.

Då är $3^{2x} = 3^3$, så $2x = 3$ och $x = \frac{3}{2}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 4,
    svar: "C",
    losning: String.raw`Två ekvationer: $x - y = 7$ och $x + y = 33$.

Addera dem: $2x = 40$, alltså $x = 20$ och $y = 13$.

$xy = 20 \cdot 13 = 260$. **Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 5,
    svar: "A",
    losning: String.raw`Att dela med ett bråk är att multiplicera med det inverterade bråket:

$\frac{6}{25} \cdot \frac{5}{36} = \frac{6 \cdot 5}{25 \cdot 36} = \frac{1}{5 \cdot 6} = \frac{1}{30}$

**Svar: A.** Förkorta innan du multiplicerar: 6 går i 36 och 5 går i 25. Mer i ${XYZ}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 6,
    svar: "B",
    losning: String.raw`$x(x+1)$ är produkten av två heltal i följd. Leta bland alternativen:

- 37 är ett primtal.
- $42 = 6 \cdot 7$. Det fungerar.
- 54 ligger mellan $6 \cdot 7 = 42$ och $7 \cdot 8 = 56$.
- 81 ligger mellan $8 \cdot 9 = 72$ och $9 \cdot 10 = 90$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 7,
    svar: "B",
    losning: String.raw`Sätt in $x = a$ i varje funktion och se vilken som alltid ger $a$.

- A: $\frac{a}{a} + a = 1 + a$. Aldrig $a$.
- B: $2a - a = a$. Alltid.
- C: $a \cdot a = a^2$. Bara om $a = 1$.
- D: $-a^2 + a^3$. Bara för vissa $a$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 8,
    svar: "B",
    losning: String.raw`Dela siffrorna och tiopotenserna var för sig:

$\frac{2{,}1}{3} \cdot \frac{10^6}{10^4} = 0{,}7 \cdot 10^2 = 70$

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 10,
    svar: "C",
    losning: String.raw`Bråken har samma nämnare, så lägg ihop täljarna:

$\frac{(a + b) + (b - a)}{b} = \frac{2b}{b} = 2$

**Svar: C.** $a$ tar ut sig självt. Mer i ${XYZ}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 11,
    svar: "A",
    losning: String.raw`Medianen av 3, 5, 6, 6, 8 är 6. Med sex tal blir medianen medelvärdet av det tredje och fjärde talet.

- Är det nya talet 6 eller större blir mitten 6 och 6. Medianen är kvar på 6.
- Är det nya talet mindre än 6 flyttas en femma eller lägre in i mitten. Medianen blir 5,5 eller lägre.

Medianen kan alltså aldrig bli större. Sannolikheten är 0. **Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 13,
    svar: "B",
    losning: String.raw`- 4 % av 40 är $0{,}04 \cdot 40 = 1{,}6$.
- 5 % av 35 är $0{,}05 \cdot 35 = 1{,}75$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 14,
    svar: "D",
    losning: String.raw`Både $x$ och $z$ är större än $y$, men det säger inget om hur de förhåller sig till varandra.

Med $y = 0$ kan $x = 1$ och $z = 2$ (II störst) eller $x = 2$ och $z = 1$ (I störst).

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 15,
    svar: "C",
    losning: String.raw`Riktningskoefficienten är $\frac{\Delta y}{\Delta x}$.

- I: $\frac{-3 - 0}{-1 - 0} = 3$
- II: $\frac{3 - 0}{1 - 0} = 3$

Punkterna ligger på samma linje, $y = 3x$. **Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 16,
    svar: "C",
    losning: String.raw`Med $x = -\frac{1}{3}$ ger $x - y = \frac{1}{3}$ att $y = -\frac{1}{3} - \frac{1}{3} = -\frac{2}{3}$.

Kvantitet II är $2x = -\frac{2}{3}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 18,
    svar: "D",
    losning: String.raw`$y$ har inga villkor alls. Pröva två fall.

- $x = 1$, $y = 1$: I $= 1$, II $= 1$. Lika.
- $x = 2$, $y = 1$: I $= \frac{1}{4}$, II $= \frac{1}{2}$. II störst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 19,
    svar: "A",
    losning: String.raw`Medelvärdet är större än 1 om summan är större än 3.

$\frac{5}{2} = 2{,}5$ ensamt, och $\frac{5}{7} + \frac{5}{6}$ är ungefär $0{,}71 + 0{,}83 = 1{,}54$. Summan blir cirka 4,05.

**Svar: A.** Jämför summan med 3 i stället för att räkna ut medelvärdet. Det sparar en division. Mer i ${KVA}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 20,
    svar: "A",
    losning: String.raw`Tid är sträcka genom hastighet.

- Adam: $\frac{45}{27} = \frac{5}{3} \approx 1{,}67$ timmar.
- David: $\frac{40}{25} = 1{,}6$ timmar.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 22,
    svar: "A",
    losning: String.raw`Kvot 1 och rest 1 betyder $x = 1 \cdot y + 1 = y + 1$.

Då är $x$ alltid ett större än $y$. **Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 23,
    svar: "D",
    losning: String.raw`(1): Herrcykeln står i mitten. Barncykeln står till vänster om damcykeln, så ordningen är barn, herr, dam. Damcykeln står längst till höger. Räcker.

(2): Barncykeln står längst till vänster, och herrcykeln står till vänster om damcykeln. Ordningen blir barn, herr, dam. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 24,
    svar: "E",
    losning: String.raw`Hastighet är sträcka genom tid, så vi behöver veta något om båda.

(1): Mia går 5 minuter tidigare och kommer fram 10 minuter tidigare, alltså tar Nellies promenad 5 minuter längre. Inget om sträckorna.

(2): Nellie har längre väg. Inget om tiderna.

Tillsammans går Nellie längre **och** längre tid. Det kan ge högre eller lägre hastighet beroende på hur mycket längre vägen är.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 25,
    svar: "C",
    losning: String.raw`(1) ensam: skor före vantar och mössan inte sist. Många ordningar går, till exempel skor, vantar, mössa, jacka och jacka, skor, mössa, vantar.

(2) ensam: jackan först och skor före mössa. Kvar finns jacka, skor, mössa, vantar och jacka, skor, vantar, mössa med flera.

Tillsammans: jackan först. Skorna ska komma före både vantar och mössa, så skorna blir tvåa. Mössan får inte vara sist, så den blir trea och vantarna sist.

**Svar: C.** Ordningen är jacka, skor, mössa, vantar. Mer i ${NOG}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 27,
    svar: "B",
    losning: String.raw`(1): Camilla har $73 - 21 = 52$ böcker, men vi vet inte hur pärmarna fördelar sig mellan hyllorna. Räcker inte.

(2): Om $b$ är böcker och $p$ pärmar i Camillas hylla är $b + p = 65$ och $b - p = 39$. Subtrahera: $2p = 26$, alltså $p = 13$. Räcker.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2025vt",
    pass: 3,
    nr: 28,
    svar: "D",
    losning: String.raw`Kalla antalet akrobater $a$. Då är clownerna $0{,}6a$.

(1): $2 \cdot 0{,}6a = \frac{a}{2} + 7$ ger $1{,}2a - 0{,}5a = 7$, alltså $a = 10$. Räcker.

(2): $a - 0{,}6a = 4$ ger $0{,}4a = 4$, alltså $a = 10$. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },

  /* ── Vårprovet 2025, provpass 5 ──────────────────────────────── */
  {
    term: "2025vt",
    pass: 5,
    nr: 23,
    svar: "C",
    losning: String.raw`Kalla melonskivorna $m$ och vindruvorna $v$.

(1): $v = 2m$, men vi vet inte $m$. (2): $m + v = 57$, men inte fördelningen.

Tillsammans: $3m = 57$ ger $m = 19$ och $v = 38$. Skillnaden är 19.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2025vt",
    pass: 5,
    nr: 24,
    svar: "D",
    losning: String.raw`(1): Alexandra är i köket. Björn är inte i hallen, så han är i vardagsrummet. Kvar för Charlotte är hallen. Räcker.

(2): Björn är i vardagsrummet och Charlotte är inte i köket. Då är hon i hallen. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2025vt",
    pass: 5,
    nr: 25,
    svar: "A",
    losning: String.raw`(1): $0{,}5x - 0{,}3x = 0{,}2x = 22$, alltså $x = 110$. Räcker.

(2): $x$ är delbart med 10 och 11, alltså en multipel av 110. Det kan vara 110, 220, 330 och så vidare. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2025vt",
    pass: 5,
    nr: 26,
    svar: "C",
    losning: String.raw`(1): $\frac{1}{9}$ av 27 barn är 3, som har både senap och ketchup. De är 60 % av senapsbarnen, så 5 barn har senap. Men vi vet inte hur många som har bara ketchup.

(2): 5 har senap och 15 har varken eller. Då har 12 barn minst ett tillbehör, men vi vet inte hur många av senapsbarnen som också har ketchup.

Tillsammans: 3 har båda, så 2 har bara senap. Av de 12 med något tillbehör har då $12 - 2 = 10$ ketchup.

**Svar: C.** Rita gärna ett venndiagram med fyra fält. Mer i ${NOG}.`,
  },
  {
    term: "2025vt",
    pass: 5,
    nr: 28,
    svar: "E",
    losning: String.raw`Serien är $-10, -8, 0, 6, 7$ med median 0 och medelvärde $-1$.

(1): Medianen är kvar på 0 om man tar bort ett tal under 0 och ett över 0. Det ger fyra möjliga par.

(2): Medelvärdet ändras. Det gäller många par.

Tillsammans: pröva de fyra paren.

- Ta bort $-10$ och 6: kvar $-8, 0, 7$, medelvärde $-\frac{1}{3}$. Ändrat.
- Ta bort $-10$ och 7: kvar $-8, 0, 6$, medelvärde $-\frac{2}{3}$. Ändrat.
- Ta bort $-8$ och 7: kvar $-10, 0, 6$, medelvärde $-\frac{4}{3}$. Ändrat.
- Ta bort $-8$ och 6: kvar $-10, 0, 7$, medelvärde $-1$. Oförändrat.

Tre par återstår, så vi vet inte vilka tal som togs bort. **Svar: E.** Mer i ${NOG}.`,
  },

  /* ── Höstprovet 2024, provpass 1 och 4 ──────────────────────── */
  {
    term: "2024ht",
    pass: 1,
    nr: 1,
    svar: "D",
    losning: String.raw`Samla $x$ på ena sidan: $12x - 6x = 18 + 54$, alltså $6x = 72$ och $x = 12$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 2,
    svar: "C",
    losning: String.raw`$x = \frac{6}{\sqrt{3}}$. Förläng med $\sqrt{3}$: $\frac{6\sqrt{3}}{3} = 2\sqrt{3}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 3,
    svar: "B",
    losning: String.raw`Skriv båda bråken med nämnaren 30: $\frac{2x}{30} + \frac{x}{30} = \frac{3x}{30} = \frac{x}{10}$.

En tiondel är 10 procent. **Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 5,
    svar: "D",
    losning: String.raw`Gör om till decimaltal: $\frac{3}{4} = 0{,}75$, $\frac{25}{32} \approx 0{,}78$, $\frac{13}{16} \approx 0{,}81$ och $\frac{7}{8} = 0{,}875$.

Bara D har talen i rätt ordning. **Svar: D.** Alla nämnare är potenser av 2, så du kan också skriva allt som trettiotvåondelar: 24, 25, 26 och 28. Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 7,
    svar: "B",
    losning: String.raw`I en kvadrat är $d^2 = s^2 + s^2 = 2s^2$ (Pythagoras).

Då är $2s^2 + d^2 = 4s^2 = 64$, så $s^2 = 16$ och $s = 4$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 8,
    svar: "C",
    losning: String.raw`Multiplicera ut täljaren: $3x + 3y - 5y + 5x = 8x - 2y$.

Dela med 2: $4x - y$. **Svar: C.** Se upp med tecknet: $-5(y - x)$ blir $-5y + 5x$. Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 9,
    svar: "A",
    losning: String.raw`$x - y = 7$ betyder att $x$ alltid är 7 större än $y$, alltså $y = x - 7$.

Om $x$ är negativt är $y$ ännu mindre, alltså också negativt. **Svar: A.**

De andra faller på motexempel: $x = 3$ ger $y = -4$ (B), $y = -3$ ger $x = 4$ men $y = -10$ ger $x = -3$ (C). Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 10,
    svar: "D",
    losning: String.raw`Sätt in punkten i ekvationen: $2a = 3a - 60$, alltså $a = 60$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 11,
    svar: "A",
    losning: String.raw`Summan av bollarna i lådorna är 6, ett jämnt tal. En summa av tre heltal är jämn bara om antalet udda termer är jämnt, alltså 0 eller 2.

Exakt en låda med udda antal går därför aldrig. Sannolikheten är 0. **Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 12,
    svar: "B",
    losning: String.raw`$8^x = 2^{3x}$, så produkten ska vara 2 upphöjt till en multipel av 3.

- $16 \cdot 16 = 2^8$
- $16 \cdot 32 = 2^9 = 8^3$
- $32 \cdot 32 = 2^{10}$
- $32 \cdot 64 = 2^{11}$

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 13,
    svar: "A",
    losning: String.raw`$\sqrt{5} > 2$, så I är större än 3. $\sqrt{6} < 3$ eftersom $6 < 9$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 14,
    svar: "B",
    losning: String.raw`$\frac{x}{4} = \frac{5}{8} - \frac{4}{8} = \frac{1}{8}$, alltså $x = \frac{1}{2}$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 15,
    svar: "A",
    losning: String.raw`Ta skillnaden: $(x + 2y) - (2x + y) = y - x$. Eftersom $y > x$ är den positiv.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 16,
    svar: "B",
    losning: String.raw`$\frac{3}{5} - \frac{4}{7} = \frac{21 - 20}{35} = \frac{1}{35}$.

Kvantitet I är $\frac{32}{35}$, som är mindre än 1. **Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 17,
    svar: "C",
    losning: String.raw`Olle får $\frac{x}{2} + \frac{y}{2} = \frac{x + y}{2}$ kulor.

Medelvärdet av $x$ och $y$ är också $\frac{x + y}{2}$. **Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 19,
    svar: "A",
    losning: String.raw`Skärning med $x$-axeln: $0 = -\frac{x}{2} + 4$ ger $x = 8$.

Skärning med $y$-axeln: $y = 4$ (konstanttermen).

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 22,
    svar: "D",
    losning: String.raw`$\frac{x}{y} = -1$ betyder $x = -y$, så $x - y = -2y$.

Tecknet beror på $y$: $y = 1$ ger $-2$, $y = -1$ ger $2$. **Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 23,
    svar: "A",
    losning: String.raw`(1): 125 procent av antalet är 100, alltså $1{,}25x = 100$ och $x = 80$. Räcker.

(2): En femtedel är 20 procent. Det gäller för alla samlingar och säger ingenting. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 24,
    svar: "C",
    losning: String.raw`Vi behöver veta hur många vaniljbullar det finns totalt och hur många som inte är i frysen.

(1) ger att 10 vaniljbullar är i skafferiet, men inte hur många det finns totalt. (2) ger att $\frac{1}{4} \cdot 80 = 20$ är vaniljbullar, men inte var de ligger.

Tillsammans: $20 - 10 = 10$ vaniljbullar i frysen. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 26,
    svar: "A",
    losning: String.raw`Gruppens sammanlagda längd är $5 \cdot 172 = 860$ cm.

(1): Flickorna är tillsammans $4 \cdot 170 = 680$ cm, så pojken är $860 - 680 = 180$ cm. Räcker.

(2): Vi vet inte hur lång den längsta flickan är. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 27,
    svar: "B",
    losning: String.raw`(1): Kaffet är i den svarta eller vita, och chokladen inte i den vita. Är kaffet i den svarta har den vita te; är det i den vita har den vita kaffe. Två möjligheter, räcker inte.

(2): Kaffet är inte i den svarta, och den grå har te. Då är kaffet i den vita. Räcker.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2024ht",
    pass: 1,
    nr: 28,
    svar: "E",
    losning: String.raw`(1) ger alla heltal från 51 till 74. (2) ger 8, 16, 32, 40, 56, 64 och så vidare.

Tillsammans återstår 56 och 64. Två möjliga tal, så $x$ går inte att bestämma. **Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 1,
    svar: "D",
    losning: String.raw`Medelvärdet 7 för fem tal betyder att summan är $5 \cdot 7 = 35$.

$1 + 2 + 5 + 7 = 15$, så $x = 35 - 15 = 20$. **Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 2,
    svar: "A",
    losning: String.raw`Elsa startar med 10 och lägger till 3 per dag. Efter $t$ dagar har hon $10 + 3t$.

**Svar: A.** Kontroll: dag 0 ger 10, dag 1 ger 13. Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 3,
    svar: "B",
    losning: String.raw`Sätt in $x = 2$ direkt.

Täljaren: $\frac{2}{2} = 1$. Nämnaren: $\frac{1}{2} + \frac{2}{1} = \frac{5}{2}$.

$1 \div \frac{5}{2} = \frac{2}{5}$. **Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 4,
    svar: "C",
    losning: String.raw`$a + 2b = b$ ger $a = -b$.

Då är $a - b = -b - b = -2b$. **Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 6,
    svar: "D",
    losning: String.raw`En punkt ligger mellan linjerna om $x - 2 < y < x + 2$.

För $(3, 3)$: $1 < 3 < 5$. Stämmer. De andra punkterna faller utanför: $(3, -3)$ och $(3, 0)$ ligger under $y = x - 2$, och $(0, -3)$ ligger under den också.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 7,
    svar: "B",
    losning: String.raw`Cirkelns area är $\pi \cdot 2^2 = 4\pi$. Kvadraten har samma area, så $s^2 = 4\pi$.

$s = \sqrt{4\pi} = 2\sqrt{\pi}$. **Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 8,
    svar: "A",
    losning: String.raw`Multiplicera ut term för term:

$xy + xb - xy + ya - xy + ab - ay - xb + xy$

Allt utom $ab$ tar ut varandra. **Svar: A.** Snabbare: tänk på en rektangel med sidorna $a$ och $b$ delad i fyra delar. Uttrycket är summan av delarnas areor. Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 10,
    svar: "C",
    losning: String.raw`Lägg ihop i varje parentes först: $5\sqrt{3} \cdot 3\sqrt{3}$.

$5 \cdot 3 \cdot \sqrt{3} \cdot \sqrt{3} = 15 \cdot 3 = 45$. **Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 12,
    svar: "B",
    losning: String.raw`20 procent är $0{,}2$, och $0{,}2 \cdot 10^{10} = 2 \cdot 10^9$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 13,
    svar: "C",
    losning: String.raw`$\frac{1}{2} - \frac{1}{3} = \frac{1}{6}$ och $\frac{2}{3} - \frac{1}{2} = \frac{1}{6}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 14,
    svar: "B",
    losning: String.raw`Triangelns höjd: $\frac{5 \cdot h}{2} = 20$ ger $h = 8$ cm.

Rektangelns höjd: $2 \cdot h = 17$ ger $h = 8{,}5$ cm.

**Svar: B.** Glöm inte tvåan i triangelformeln. Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 15,
    svar: "A",
    losning: String.raw`$x + 2{,}8 = 5x - 6$ ger $8{,}8 = 4x$, alltså $x = 2{,}2$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 16,
    svar: "A",
    losning: String.raw`125 % av 4 är 5. 80 % av 6 är 4,8.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 17,
    svar: "C",
    losning: String.raw`$f(-2) = 4 - 4 - 2 = -2$ och $f(0) = -2$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 18,
    svar: "C",
    losning: String.raw`Vänsterledet är $47^{\frac{x}{2} \cdot \frac{2}{3}} = 47^{\frac{x}{3}}$.

Samma bas, så exponenterna är lika: $\frac{x}{3} = \frac{y}{3}$ och $x = y$. **Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 20,
    svar: "D",
    losning: String.raw`Förenkla båda. I: $\frac{(a-b)^2}{a-b} = a - b$. II: $(b-a)^2 = (a-b)^2$, så II $= \frac{(a-b)^2}{-(a-b)} = -(a - b)$.

Om $a > b$ är I störst, om $a < b$ är II störst. **Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 21,
    svar: "D",
    losning: String.raw`Vid 100 km/h tar 120 km $1{,}2$ timmar, alltså 72 minuter. Vid 80 km/h tar det $1{,}5$ timmar, alltså 90 minuter.

85 minuter ligger mellan, så tiden kan vara både kortare och längre. **Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 22,
    svar: "C",
    losning: String.raw`Två ekvationer: $x + y = 2$ och $\frac{x + 4}{2} = y$.

Sätt in $y = 2 - x$: $x + 4 = 4 - 2x$, alltså $3x = 0$ och $x = 0$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 23,
    svar: "D",
    losning: String.raw`(1): Den svarta är mittemellan. Den vita är mindre än den röda, så den vita är minst och den röda störst. Räcker.

(2): Den vita är minst och den svarta mindre än den röda. Den röda är störst. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 24,
    svar: "A",
    losning: String.raw`(1): Mössan, 120 kr, är 150 procent av halsduken, så halsduken kostar $\frac{120}{1{,}5} = 80$ kr. Jackan kostar tio gånger så mycket, 800 kr. Räcker.

(2): En relation mellan tre okända priser. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 25,
    svar: "E",
    losning: String.raw`Vi behöver veta hur romanerna fördelar sig mellan hylla och låda.

Tillsammans vet vi att det finns 1 121 romaner och 1 164 faktaböcker, och att 2 253 står i hyllan och 32 ligger i lådan. Men inget säger hur många av de 32 i lådan som är romaner.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 27,
    svar: "E",
    losning: String.raw`Tre olika udda tal där största minus minsta är 4 måste vara tre udda tal i följd: $n$, $n + 2$ och $n + 4$.

Tillsammans vet vi att både 19 och 21 är med. Då kan talen vara 17, 19, 21 (summa 57) eller 19, 21, 23 (summa 63).

**Svar: E.** Ingen av uppgifterna säger vilket tal som är minst. Mer i ${NOG}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 28,
    svar: "A",
    losning: String.raw`(1): Ringen är i den gröna eller den rosa. Av den rosa och den vita är exakt en tom, så ringen är i en av dem. Det enda som stämmer med båda är den rosa. Räcker.

(2): Ringen är i den gröna eller den rosa (högst en av dem är tom). Mer går inte att säga. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2024ht",
    pass: 4,
    nr: 9,
    svar: "C",
    losning: String.raw`Förkorta det första bråket: $10 \cdot \frac{3 - x}{15} = \frac{2(3 - x)}{3} = 2 - \frac{2x}{3}$.

Lägg till $\frac{5x}{3}$: $2 - \frac{2x}{3} + \frac{5x}{3} = 2 + \frac{3x}{3} = 2 + x$.

**Svar: C.** Kontroll med $x = 3$: uttrycket blir $0 + 5 = 5$, och $2 + 3 = 5$. Mer i ${XYZ}.`,
  },

  /* ── Vårprovet 2024, provpass 2 och 5 ────────────────────────── */
  {
    term: "2024vt",
    pass: 2,
    nr: 2,
    svar: "D",
    losning: String.raw`Sätt in $y = -2$: $2x + 3x(-2) - 4(-2) = 10$, alltså $2x - 6x + 8 = 10$.

Det ger $-4x = 2$ och $x = -\frac{1}{2}$. **Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 4,
    svar: "B",
    losning: String.raw`$0{,}6x = 39$ ger $x = \frac{39}{0{,}6} = 65$.

**Svar: B.** Kontroll: 10 % av 65 är 6,5, och sex gånger det är 39. Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 5,
    svar: "A",
    losning: String.raw`Multiplicera ut: $ab + ac - ab - bc + bc - ac$.

Allt tar ut varandra. **Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 8,
    svar: "D",
    losning: String.raw`Dela varje mått med klossens: $\frac{50}{5} = 10$, $\frac{54}{6} = 9$ och $\frac{72}{9} = 8$. Det går jämnt upp, så lådan fylls helt.

$10 \cdot 9 \cdot 8 = 720$ klossar. **Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 9,
    svar: "A",
    losning: String.raw`Bryt ut $3y$ ur parentesen: $3xy + 15y = 3y(x + 5)$.

Då är täljaren $2xy \cdot 3y(x + 5) = 6xy^2(x + 5)$, och $6xy^2$ förkortas bort.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 10,
    svar: "C",
    losning: String.raw`Lista alla sätt att skriva 12 som tre olika positiva heltal: $1 \cdot 2 \cdot 6$ och $1 \cdot 3 \cdot 4$.

$z - x$ blir 5 respektive 3. Det största är 5. **Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 11,
    svar: "D",
    losning: String.raw`Alla tre lådor får en röd och en vit kula precis när Laila tar en röd ur A och en vit ur B. Då blir A och B kvar med en av varje, och C får en av varje.

$P = \frac{2}{3} \cdot \frac{2}{3} = \frac{4}{9}$. **Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 12,
    svar: "B",
    losning: String.raw`$2^5 + 2^5 = 2 \cdot 2^5 = 2^6$. Gånger 2 till blir det $2^7$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 13,
    svar: "A",
    losning: String.raw`Med $y = 0$ blir $x - 5 = 5$, alltså $x = 10$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 14,
    svar: "A",
    losning: String.raw`Jämna tal efter 15: 16, 18, 20 och så vidare. Det nionde är $16 + 8 \cdot 2 = 32$.

Udda tal efter 18: 19, 21 och så vidare. Det sjunde är $19 + 6 \cdot 2 = 31$.

$J - U = 1$. **Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 15,
    svar: "A",
    losning: String.raw`Medelvärdet av 0,1 och 0,2 är 0,15. $\frac{1}{7} \approx 0{,}143$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 16,
    svar: "D",
    losning: String.raw`Båda är negativa, så kvoten är positiv. Pröva två fall.

- $a = -1$, $b = -1$: I $= 1$. Lika.
- $a = -2$, $b = -1$: I $= 2$. I störst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 18,
    svar: "D",
    losning: String.raw`Kvantitet I är större än 500. Kvantitet II är mindre än 600.

Båda kan alltså ligga mellan 500 och 600, och då går de inte att jämföra. Exempel: I $= 510$ och II $= 590$, eller I $= 590$ och II $= 510$.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 19,
    svar: "B",
    losning: String.raw`$\frac{x}{3} = 1 - \frac{3}{2} = -\frac{1}{2}$, alltså $x = -\frac{3}{2}$.

$-\frac{3}{2}$ är mindre än $-\frac{1}{6}$. **Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 20,
    svar: "B",
    losning: String.raw`$L_1$: $k = \frac{2 - 3}{1 - (-1)} = -\frac{1}{2}$.

Vinkelräta linjer har $k_1 \cdot k_2 = -1$, så $L_2$ har $k = 2$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 21,
    svar: "B",
    losning: String.raw`Triangelns omkrets är 12 cm, så kvadraten har sidan 3 cm och arean 9 cm².

Triangeln är rätvinklig med kateterna 3 och 4, så arean är $\frac{3 \cdot 4}{2} = 6$ cm².

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 22,
    svar: "C",
    losning: String.raw`Bryt ut $x$ ur båda: $x^3 - x = x(x^2 - 1)$ och $x^5 + x = x(x^4 + 1)$.

Då är båda kvantiteterna $x(x^4 + 1)(x^2 - 1)$. **Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 24,
    svar: "C",
    losning: String.raw`(1) ger att de två mindre böckerna har $792 - 348 = 444$ sidor tillsammans, men inte fördelningen.

(2) säger att mittenboken har lika många sidor som medelvärdet, men inget antal.

Tillsammans: medelvärdet är $\frac{792}{3} = 264$, så mittenboken har 264 sidor och den minsta $444 - 264 = 180$.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 25,
    svar: "E",
    losning: String.raw`Tillsammans vet vi att paljetterna är i den svarta asken, och att både pärlorna och limstiften finns i den blå eller den grå asken. Men inget säger vilket som är var.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 26,
    svar: "D",
    losning: String.raw`Rundan är lika lång varje gång, så den långsammaste hastigheten hör ihop med den längsta tiden.

(1): $15 \text{ km/h} \cdot \frac{20}{60} \text{ h} = 5$ km. (Snabbast ger samma: $25 \cdot \frac{12}{60} = 5$.) Räcker.

(2): 75 minuter i 20 km/h är $20 \cdot 1{,}25 = 25$ km för fem rundor, alltså 5 km per runda. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 27,
    svar: "C",
    losning: String.raw`(1) ger 9 stora röda men säger inget om små röda.

(2) ger att 12 monster är stora, varav 9 röda.

Tillsammans: $48 - 12 = 36$ små, varav 13 gröna, alltså 23 små röda. Totalt $23 + 9 = 32$ röda.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2024vt",
    pass: 2,
    nr: 28,
    svar: "B",
    losning: String.raw`(1): Den svarta står på plats 2 eller 3. Står den på 2 blir ordningen röd, svart, grön, vit. Står den på 3 blir den vit, grön, svart, röd. Två möjligheter.

(2): Röd står längst till vänster. Den vita, flyttad till den svartas plats, ska stå mitt emellan röd (plats 1) och grön. Det går bara om den svarta står på 2 och den gröna på 3. Då står den vita på 4.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 1,
    svar: "D",
    losning: String.raw`$13 + 31 = 8x - 4x$, alltså $4x = 44$ och $x = 11$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 3,
    svar: "B",
    losning: String.raw`$\frac{1}{2} + \frac{1}{6} = \frac{3}{6} + \frac{1}{6} = \frac{2}{3}$.

$\frac{1}{3} - \frac{2}{3} = -\frac{1}{3}$. **Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 4,
    svar: "A",
    losning: String.raw`Lika medelvärde för lika många tal betyder lika summa.

$17 + 21 + 44 = 82$, och $63 + 73 + x = 82$ ger $x = -54$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 5,
    svar: "C",
    losning: String.raw`Julia springer 2 km på 12 minuter, alltså 10 km/h. Anna går 2 km på 24 minuter, alltså 5 km/h.

Tillsammans närmar de sig varandra med 15 km/h, och 12 km tar $\frac{12}{15} = 0{,}8$ timmar, alltså 48 minuter.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 6,
    svar: "D",
    losning: String.raw`$\frac{7}{\sqrt{7}} = \sqrt{7}$, och $(\sqrt{7})^2 = 7$.

**Svar: D.** Kolla de andra snabbt: $7 - 1 = 6$ (B) och $2 + 3{,}5 = 5{,}5$ (C). Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 7,
    svar: "C",
    losning: String.raw`$0{,}18 \cdot \frac{2}{5} = 0{,}18 \cdot 0{,}4 = 0{,}072$.

$\frac{9}{125} = 0{,}072$. **Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 9,
    svar: "A",
    losning: String.raw`Sätt in $x = 3$ och se vilken linje som ger $y = 1$.

A: $-3 + 4 = 1$. **Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 10,
    svar: "A",
    losning: String.raw`$\frac{a}{b} = \frac{b}{c}$ ger $b^2 = ac = a \cdot 2a = 2a^2$.

Eftersom $b > 0$ är $b = a\sqrt{2}$. **Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 11,
    svar: "A",
    losning: String.raw`$x \cdot 10\,000 - 2x \cdot 1\,000 = 8\,000x$.

$8\,000x = 32\,000$ ger $x = 4$. **Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 12,
    svar: "C",
    losning: String.raw`$K_1$ har arean 4 cm², och 25 procent av den är 1 cm².

Det är 20 procent av $K_2$, så $K_2$ har arean 5 cm² och sidan $\sqrt{5}$ cm.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 13,
    svar: "D",
    losning: String.raw`Pröva två fall som uppfyller $3x > y$.

- $x = 1$, $y = 0$: I störst.
- $x = 1$, $y = 2$: II störst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 15,
    svar: "B",
    losning: String.raw`$x - 4 = \frac{1}{4}$, alltså $x = 4{,}25$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 16,
    svar: "A",
    losning: String.raw`$f(a) = 4a + 8$ och $g(2a) = 2 \cdot 2a + 4 = 4a + 4$.

I är alltid 4 större. **Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 17,
    svar: "C",
    losning: String.raw`Med tio värden är medianen medelvärdet av det femte och sjätte. Tas det största och minsta bort blir det åtta värden, och medianen blir medelvärdet av samma två värden som förut.

Medianen är fortfarande 25. **Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 18,
    svar: "A",
    losning: String.raw`$4 \cdot 10^{-2} = 0{,}04$ och $\frac{1}{400} = 0{,}0025$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 19,
    svar: "D",
    losning: String.raw`Båda kvantiteterna är negativa. Pröva två fall.

- $x = -0{,}5$, $y = 0{,}5$: båda är $-1$. Lika.
- $x = -0{,}5$, $y = 0{,}25$: I $= -0{,}5$, II $= -2$. I störst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 21,
    svar: "B",
    losning: String.raw`Multiplicera ut: I $= x^2 + 2x - 8$ och II $= x^2 - 2x - 8$.

I minus II är $4x$, som är negativt när $x < 0$. **Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 22,
    svar: "B",
    losning: String.raw`Räkna faktorn år för år: $1{,}2^2 = 1{,}44$, $1{,}2^3 \approx 1{,}73$, $1{,}2^4 \approx 2{,}07$.

Priset har alltså fördubblats på mindre än fyra år. **Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 23,
    svar: "C",
    losning: String.raw`(1) säger att apoteket kommer före biblioteket. (2) säger att cykelhandlaren är i mitten. Var för sig finns flera ordningar.

Tillsammans: apotek, cykelhandlare, bibliotek. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 25,
    svar: "D",
    losning: String.raw`Kalla volymen $V$.

(1): Det som fattas är $\frac{3}{7}V = 1\,200$, alltså $V = 2\,800$ liter. Räcker.

(2): $\frac{4}{7}V - 200 = \frac{1}{2}V$ ger $\frac{1}{14}V = 200$, alltså $V = 2\,800$ liter. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 26,
    svar: "C",
    losning: String.raw`(1): 150 jämna hus, varav 40 procent, alltså 60, längs öst-västliga gator. Inget om udda hus.

(2): En tredjedel av de udda husen ligger öst-västligt, och där finns lika många jämna som udda. Inget antal.

Tillsammans: 60 udda hus öst-västligt är en tredjedel av alla udda, alltså 180.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 27,
    svar: "A",
    losning: String.raw`(1): $a + 100 = 3a$ ger $a = 50$. Räcker.

(2): Ett samband mellan Anna och Berit, där båda är okända. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2024vt",
    pass: 5,
    nr: 28,
    svar: "E",
    losning: String.raw`Tillsammans vet vi att $w = x + y$ och $z = \frac{w}{2}$. Men talen kan vara negativa.

- $x = 1$, $y = 1$: $w = 2$ är störst.
- $x = -1$, $y = -1$: $w = -2$, $z = -1$, och $x = -1$. Då är $z$ och $x$ lika stora och större än $w$.
- $x = 5$, $y = 1$: $w = 6$ är störst.
- $x = 5$, $y = -1$: $w = 4$, men $x = 5$ är störst.

Olika tal kan vara störst. **Svar: E.** Mer i ${NOG}.`,
  },

  /* ── Höstprovet 2023, provpass 2 och 4 ────────────────────────── */
  {
    term: "2023ht",
    pass: 2,
    nr: 1,
    svar: "C",
    losning: String.raw`Gemensam nämnare är 21: $\frac{14}{21} + \frac{12}{21} - \frac{5}{21} = \frac{21}{21} = 1$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 2,
    svar: "C",
    losning: String.raw`Vinklarna är 1, 2 och 6 delar, alltså 9 delar på 180°. En del är 20°.

Den största är $6 \cdot 20° = 120°$. **Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 3,
    svar: "A",
    losning: String.raw`Sätt in $x = -2$: $-8 - 2b - 4 = 0$, alltså $-2b = 12$ och $b = -6$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 4,
    svar: "B",
    losning: String.raw`$\frac{3x}{4} = \frac{1}{2}$ ger $3x = 2$ och $x = \frac{2}{3}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 5,
    svar: "D",
    losning: String.raw`$x = \frac{5}{8} - \frac{3}{5} = \frac{25}{40} - \frac{24}{40} = \frac{1}{40}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 6,
    svar: "D",
    losning: String.raw`Medelvärdet 16 ger $x + y = 32$. Medelvärdet 30 ger $20 + z = 60$, alltså $z = 40$.

$x + y + z = 72$. **Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 7,
    svar: "C",
    losning: String.raw`Multiplicera ut: $-35x + 15xy$. Bryt ut $x$: $x(15y - 35)$.

**Svar: C.** Se upp med tecknet: minus gånger minus ger plus. Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 9,
    svar: "D",
    losning: String.raw`10 % av 20 är 2. Då är $0{,}08y = 2$, alltså $y = 25$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 10,
    svar: "C",
    losning: String.raw`Lika area: $0{,}7s \cdot L = s^2$, alltså $L = \frac{s}{0{,}7}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 11,
    svar: "D",
    losning: String.raw`Primtal mellan 4 och 10 är 5 och 7. Talet 35 är delbart med både 5 och 7, så $\frac{35m}{p}$ är alltid ett heltal.

**Svar: D.** Med $p = 7$ och $m = 1$ faller A, B och C. Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 12,
    svar: "D",
    losning: String.raw`Vid T var summan av åldrarna $3 \cdot 24 = 72$.

Tre år efter T var Bianca och Cecilia tillsammans $2 \cdot 25 = 50$ år, alltså 44 år vid T. Annica var då $72 - 44 = 28$ och tre år senare 31.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 13,
    svar: "A",
    losning: String.raw`$(2x)^2 = 4x^2$, som är större än $2x^2$ när $x 
eq 0$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 14,
    svar: "A",
    losning: String.raw`$f(-1) = 1 + 3 + 2 = 6$ och $f(3) = 9 - 9 + 2 = 2$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 15,
    svar: "C",
    losning: String.raw`$\frac{5^5}{5^3} = 5^2$ och $\frac{5^{28}}{5^{26}} = 5^2$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 16,
    svar: "B",
    losning: String.raw`Rektangeln: $6x \cdot 0{,}5x = 3x^2$. Cirkeln: $\pi x^2$, och $\pi > 3$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 17,
    svar: "B",
    losning: String.raw`Flytta in faktorn under roten: $3\sqrt{6} = \sqrt{54}$ och $6\sqrt{3} = \sqrt{108}$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 18,
    svar: "B",
    losning: String.raw`$x = 5$ eller $x = -5$, så $y = 3$ eller $y = -7$. Båda är mindre än $\sqrt{16} = 4$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 19,
    svar: "B",
    losning: String.raw`Kalla åldern idag $a$: $a - 6 = \frac{a}{3}$ ger $a = 9$.

Om 6 år är Elsa 15. **Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 20,
    svar: "C",
    losning: String.raw`$\frac{x}{y} = -1$ betyder $x = -y$, så $x + y = 0$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 21,
    svar: "D",
    losning: String.raw`Paren med produkten 12: 1 och 12 (medelvärde 6,5), 2 och 6 (4), 3 och 4 (3,5).

Det kan bli större, lika eller mindre. **Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 22,
    svar: "D",
    losning: String.raw`Vi vet inte vilka två vinklar som är lika. Är $A = B = 50°$ blir summan 100°. Är $A = B = 30°$ blir den 60°.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: komedin visas i salong 1 (2). Skräckfilmen visas i 1 eller 3 (1) och i 2 eller 3 (2), alltså i 3. Dramat blir kvar i 2.

Var för sig finns flera möjligheter. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 24,
    svar: "E",
    losning: String.raw`Tillsammans vet vi att minst 43 kulor är röda och att 5 av dem är små. Då är minst 38 stora och röda, men exakt hur många går inte att säga.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 25,
    svar: "C",
    losning: String.raw`(2): Dubbel hastighet halverar tiden, så halva tiden är 7,5 minuter. Resan tog 15 minuter. Men utan hastigheten vet vi inte sträckan.

(1) ger bara hastigheten.

Tillsammans: 15 km/h i en kvart är 3,75 km. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 26,
    svar: "B",
    losning: String.raw`(1) ger bara förhållandet mellan blå och gröna, inte antalen.

(2): Blå är $\frac{3}{7} \cdot 56 = 24$ och gröna $\frac{5}{14} \cdot 56 = 20$. Röda blir $56 - 44 = 12$. Räcker.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2023ht",
    pass: 2,
    nr: 27,
    svar: "E",
    losning: String.raw`Tillsammans: första siffran är dubbelt så stor som den femte, alltså jämn, och den fjärde är dubbelt så stor som den första, alltså högst 4.

- Första siffran 2: talet blir 25 741.
- Första siffran 4: talet blir 43 782.

Två tal går. **Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 1,
    svar: "B",
    losning: String.raw`Förkorta tvåan: $\frac{2(x + 4)}{2} = x + 4$. Plus 8 blir $x + 12$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 3,
    svar: "D",
    losning: String.raw`$3x - 12 = 2x + 4$ ger $x = 16$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 4,
    svar: "B",
    losning: String.raw`Fyra heltal i följd med medelvärdet 4,5 är 3, 4, 5 och 6. Medianen är medelvärdet av 4 och 5, alltså 4,5.

**Svar: B.** För tal i följd är medianen alltid lika med medelvärdet. Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 5,
    svar: "A",
    losning: String.raw`Vid $x = 1$ ger den andra linjen $y = 1$. Då ska $k + 3 = 1$, alltså $k = -2$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 6,
    svar: "B",
    losning: String.raw`$\frac{1\,000}{50} = 20$ m/s. Gånger 3,6 blir det 72 km/h.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 7,
    svar: "A",
    losning: String.raw`Räkna nämnaren först: $\frac{2}{5} - \frac{5}{6} = \frac{12}{30} - \frac{25}{30} = -\frac{13}{30}$.

Ett delat med det är $-\frac{30}{13}$. **Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 9,
    svar: "D",
    losning: String.raw`$x - y = 0$ betyder $x = y$, så $xy = y \cdot y = y^2$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 10,
    svar: "C",
    losning: String.raw`Ett negativt tal upphöjt till en udda exponent är negativt, och till en jämn exponent positivt.

$n$ måste alltså vara udda. Det kan vara både positivt och negativt, till exempel 3 eller $-1$. **Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 11,
    svar: "B",
    losning: String.raw`Myran hamnar i $(5 + 3, 6) = (8, 6)$.

Avståndet till origo är $\sqrt{8^2 + 6^2} = \sqrt{100} = 10$. **Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 12,
    svar: "C",
    losning: String.raw`$\sqrt{12} = 2\sqrt{3}$ och $\sqrt{48} = 4\sqrt{3}$. Summan är $6\sqrt{3}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 13,
    svar: "C",
    losning: String.raw`För $x > 0$ är $\sqrt{x} \cdot \sqrt{x} = x$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 14,
    svar: "C",
    losning: String.raw`En fyra och en femma: (4, 5) eller (5, 4), alltså 2 av 36 utfall.

Summan 3: (1, 2) eller (2, 1), också 2 av 36.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 15,
    svar: "A",
    losning: String.raw`$\frac{5}{13} \approx 0{,}38$ är större än $\frac{4}{15} \approx 0{,}27$. Då är I positiv och II samma tal fast negativt.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 17,
    svar: "B",
    losning: String.raw`$z^2 = x^2 + y^2$ och $x > 0$, så $z^2 > y^2$. Båda är positiva, så $z > y$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 18,
    svar: "A",
    losning: String.raw`Säg att varan kostar 100 kr i B. Då kostar den 80 kr i A.

A sänkt 5 %: $0{,}95 \cdot 80 = 76$ kr. B sänkt 25 %: 75 kr.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 19,
    svar: "A",
    losning: String.raw`$\pi \cdot 5^2 = 25\pi \approx 78{,}5$ cm².

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 20,
    svar: "C",
    losning: String.raw`$xy = z > 1$, så $y 
eq 0$ och $x = \frac{z}{y}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 21,
    svar: "B",
    losning: String.raw`$L_1$: $k = \frac{7 - 1}{-3 - 2} = -\frac{6}{5}$.

$L_2$ är vinkelrät, så $k = \frac{5}{6}$, som är positivt. **Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 22,
    svar: "D",
    losning: String.raw`$x$ har inga villkor. Pröva två fall.

- $x = 1$: båda är 20.
- $x = 2$: I $= 200$, II $= 400$.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 23,
    svar: "E",
    losning: String.raw`20 spelar fotboll och 10 innebandy. Det kan vara samma elever eller olika, så antalet som spelar båda kan vara allt från 0 till 10.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 24,
    svar: "C",
    losning: String.raw`En punkt bestämmer inte en linje, så var för sig räcker inget.

Tillsammans: linjen genom (4, 6) och (6, 4) är $x + y = 10$, och $5 + 5 = 10$. Ja, den går genom (5, 5).

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 25,
    svar: "D",
    losning: String.raw`(1): Allt som är delbart med 100 är delbart med 5. Räcker.

(2): Allt som är delbart med 15 är delbart med 5. Räcker.

**Svar: D.** I en ja/nej-fråga räcker det att svaret blir säkert, inte att talet blir bestämt. Mer i ${NOG}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 26,
    svar: "A",
    losning: String.raw`(1): Alen är högre än björken, och rönnen är inte högst. Då är alen högst. Räcker.

(2): Rönnen är lägst, men vi vet inte om alen eller björken är högst. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 27,
    svar: "C",
    losning: String.raw`Tillsammans: 10 långärmade barntröjor är 25 procent av barntröjorna (1), så det finns 40 barntröjor och 60 vuxentröjor. De är också 20 procent av de långärmade (2), så det finns 50 långärmade.

Kortärmade barntröjor: $40 - 10 = 30$. Kortärmade totalt: 50. Kortärmade vuxentröjor: $50 - 30 = 20$.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2023ht",
    pass: 4,
    nr: 28,
    svar: "B",
    losning: String.raw`(1): Är $y = 7$ blir $x = 14$, men är $x = 7$ blir $y = 3{,}5$. Räcker inte.

(2): $2y + y = 21$ ger $y = 7$. Räcker.

**Svar: B.** Mer i ${NOG}.`,
  },
];
