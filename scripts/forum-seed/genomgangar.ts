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

  /* ── Vårprovet 2023, provpass 2 och 4 ────────────────────────── */
  {
    term: "2023vt",
    pass: 2,
    nr: 1,
    svar: "C",
    losning: String.raw`Förenkla den första parentesen: $3x - 2x = x$. Då är uttrycket $x(y - z) = xy - xz$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 3,
    svar: "A",
    losning: String.raw`Multiplicera båda leden med 7: $4x = \frac{7}{14} = \frac{1}{2}$, alltså $x = \frac{1}{8}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 4,
    svar: "C",
    losning: String.raw`$f(4) - f(2) = (4k + m) - (2k + m) = 2k$. Då är $2k = 6$ och $k = 3$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 5,
    svar: "D",
    losning: String.raw`Låda 8 får $k$ kulor för varje $k$ som delar 8, alltså 1, 2, 4 och 8.

$1 + 2 + 4 + 8 = 15$. **Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 6,
    svar: "B",
    losning: String.raw`Medelvärdet av $y$ och 0 är 5, så $y = 10$. Då är $x = 10 - 10 = 0$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 7,
    svar: "A",
    losning: String.raw`Tre gula på sju röda betyder att 3 av 10 bollar är gula.

$\frac{3}{10} \cdot 21\,000 = 6\,300$. **Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 8,
    svar: "B",
    losning: String.raw`$2\sqrt{22} = \sqrt{88}$, som ligger mellan $\sqrt{81} = 9$ och $\sqrt{100} = 10$, närmare 9.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 9,
    svar: "D",
    losning: String.raw`$(x + 2)^2 - x^2 = x^2 + 4x + 4 - x^2 = 4x + 4$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 10,
    svar: "B",
    losning: String.raw`Areorna förhåller sig som 1:4, så $K_2$ har arean $4 \cdot 9 = 36$ cm² och sidan 6 cm.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 12,
    svar: "D",
    losning: String.raw`Gemensam nämnare är $xyz$: $\frac{yz}{xyz} + \frac{xz}{xyz} + \frac{xy}{xyz}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 13,
    svar: "D",
    losning: String.raw`$y$ och $z$ har inga villkor alls, så båda kvantiteterna kan göras hur stora eller små som helst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 14,
    svar: "A",
    losning: String.raw`Bil A behöver $\frac{50}{20} = 2{,}5$ liter, bil B $\frac{50}{25} = 2$ liter.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 15,
    svar: "B",
    losning: String.raw`Rita punkterna. AB och CD är båda lodräta och 4 långa, och avståndet mellan dem är 3. Det är en parallellogram med arean $4 \cdot 3 = 12$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 16,
    svar: "C",
    losning: String.raw`$\frac{1}{3} + \frac{1}{12} = \frac{5}{12}$ och $\frac{1}{4} + \frac{1}{6} = \frac{5}{12}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 17,
    svar: "C",
    losning: String.raw`$\frac{3}{x} = 15$ ger $x = \frac{3}{15} = \frac{1}{5}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 18,
    svar: "B",
    losning: String.raw`I en parallellogram är motstående vinklar lika och närliggande vinklar har summan 180°. $11x$ och $4x$ kan inte vara lika, så de är närliggande: $15x = 180°$ och $x = 12°$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 19,
    svar: "C",
    losning: String.raw`$\frac{10^3}{10^2} = 10$ och $\frac{10^{-2}}{10^{-3}} = 10^{-2 - (-3)} = 10$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 20,
    svar: "C",
    losning: String.raw`Medelvärdet är $x$, så $x + y + z = 3x$ och $y + z = 2x$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 21,
    svar: "D",
    losning: String.raw`Kalla BC $= 1$ och AB $= 2$. Triangelolikheten ger att AC ligger mellan 1 och 3. AC kan alltså vara både kortare och längre än AB.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 22,
    svar: "A",
    losning: String.raw`$a^{-1} = \frac{1}{a}$, och när $0 < a < 1$ är $\frac{1}{a} > 1$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 23,
    svar: "C",
    losning: String.raw`(1) ger en kedja i ordningen matematik, kemi, fysik, engelska, men inte var den ligger.

(2) ger biologiboken på plats 5 och engelskaboken mellan fysik och biologi.

Tillsammans ligger kedjan på 1–4, med engelskan närmast biologin: matematik, kemi, fysik, engelska, biologi. Matematikboken har nummer 1.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: $x + y = 1$ ger $x + z = 17$. Med $y = -4$ blir $x = 5$ och $z = 12$.

Var för sig saknas alltid en okänd. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 25,
    svar: "E",
    losning: String.raw`(1): 15 oljemålningar och 30 litografier. Totalen $45 + a$ ska vara delbar med 5, så antalet akvareller är en multipel av 5.

(2): Fler än 15 och färre än 30 akvareller.

Tillsammans: 20 eller 25. **Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 26,
    svar: "C",
    losning: String.raw`(2): 24 stjärnor, varav 10 stora och 14 små.

(1): Lika många hjärtan som stjärnor ger 24 hjärtan och 48 pepparkakor, varav 24 stora.

Tillsammans: stora hjärtan är $24 - 10 = 14$, alltså små hjärtan $24 - 14 = 10$. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 27,
    svar: "A",
    losning: String.raw`(1): Maria sitter mitt emot Ove, så Nils grannar är Maria och Ove. Den som sitter till höger om Nils har glasögon, och det är inte Ove. Alltså är det Maria. Räcker.

(2): Vi vet att Petra och Nils inte har glasögon, men det kan vara Maria eller Ove. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2023vt",
    pass: 2,
    nr: 28,
    svar: "D",
    losning: String.raw`Tank B ökade med 20 procent när 50 liter kom till, så B hade 250 liter från början och 300 efteråt.

(1): A hade $450 - 250 = 200$ liter. Räcker.

(2): Efteråt hade A 150 liter, alltså 200 från början. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 1,
    svar: "D",
    losning: String.raw`$5x - 20 = 16 + 2x$ ger $3x = 36$ och $x = 12$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 2,
    svar: "D",
    losning: String.raw`Totalt finns $50 + 63 + 36 + 56 + 45 = 250$ kulor. 18 procent av 250 är 45, och det är de vita.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 3,
    svar: "B",
    losning: String.raw`Leta efter två tal med produkten 5 och summan $-6$: $-1$ och $-5$.

$(x - 1)(x - 5)$. **Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 5,
    svar: "D",
    losning: String.raw`Konjugatregeln: $\left(\frac{1}{2}\right)^2 - \left(\frac{2}{5}\right)^2 = \frac{1}{4} - \frac{4}{25} = \frac{25 - 16}{100} = \frac{9}{100}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 6,
    svar: "B",
    losning: String.raw`$xy + k = k$ ger $xy = 0$. Eftersom $y 
eq 0$ måste $x = 0$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 8,
    svar: "C",
    losning: String.raw`Sätt in $x = 5$ och se vilken som ger 13. C: $3 \cdot 5 - 2 = 13$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 9,
    svar: "B",
    losning: String.raw`Medelvärdet 7 ger summan 21, och medianen är $y = 9$. Då är $x + z = 12$.

$z > 9$, alltså minst 10, så $x$ är högst 2. **Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 10,
    svar: "C",
    losning: String.raw`Kalla volymen $V$. Eva tog $3 \cdot 5 = 15$ liter, och tunnan gick från en femtedel till en åttondel:

$\frac{V}{5} - \frac{V}{8} = 15$, alltså $\frac{3V}{40} = 15$ och $V = 200$ liter.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 11,
    svar: "A",
    losning: String.raw`$f(2) = \frac{2}{5} - 1 = -\frac{3}{5}$. Då är $g(2) = 5 \cdot \left(-\frac{3}{5}\right) + 4 = -3 + 4 = 1$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 12,
    svar: "A",
    losning: String.raw`$2^2 \cdot 12^2 = (2 \cdot 12)^2 = 24^2$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 13,
    svar: "B",
    losning: String.raw`$83 - 9x = 0$ ger $x = \frac{83}{9} \approx 9{,}2$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 14,
    svar: "B",
    losning: String.raw`I: $\frac{1}{2} \cdot \frac{3}{4} = \frac{3}{8}$. II: $\frac{1}{2} \cdot \frac{4}{3} = \frac{2}{3}$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 15,
    svar: "D",
    losning: String.raw`Sju mynt på 5 eller 10 kr blir mellan 35 och 70 kr. Hampus lånar då mellan 35 och 70 kr.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 16,
    svar: "C",
    losning: String.raw`$\frac{3x - 1}{4} = \frac{3x}{4} - \frac{1}{4} = 0{,}75x - 0{,}25$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 17,
    svar: "D",
    losning: String.raw`Medianen av fem värden är det tredje största, så det näst största är alltid minst lika stort.

Utfallen 1, 2, 3, 3, 3 ger lika. Utfallen 1, 2, 3, 5, 6 ger II störst. **Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 18,
    svar: "B",
    losning: String.raw`Vid $x = 4$ är båda 2, och därefter växer $\frac{x}{2}$ snabbare än $\sqrt{x}$. Exempel: $x = 16$ ger 4 mot 8.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 19,
    svar: "A",
    losning: String.raw`I: $0{,}75 \cdot 16\pi = 12\pi$. II: $9\pi$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 20,
    svar: "A",
    losning: String.raw`$32 = 2^5$, så $x - 1 = 5$ och $x = 6$. Kvantitet II är $5 \cdot 1 = 5$.

**Svar: A.** Allt utom noll upphöjt till 0 är 1. Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 21,
    svar: "B",
    losning: String.raw`$x = 0{,}75 \cdot 80 = 60$. $y = \frac{8}{12} \cdot 100 \approx 66{,}7$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 23,
    svar: "E",
    losning: String.raw`(2) säger att vuxna i vattnet plus vuxna på land är lika med barn på land plus vuxna på land. Det betyder att vuxna i vattnet är lika många som barn på land, alltså exakt samma sak som (1).

Inget säger hur många barn som är i vattnet. **Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 24,
    svar: "C",
    losning: String.raw`(1): Zebran står längst till höger, men vi vet inte ordningen på de andra.

(2): Giraffen står längst till vänster, men vi vet inte ordningen på de andra.

Tillsammans: giraff, antilop, zebra. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 25,
    svar: "C",
    losning: String.raw`(1) ger 29, 34, 39, 44, 49, 54 eller 59. (2) ger 27, 36, 45 eller 54.

Tillsammans bara 54. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 26,
    svar: "B",
    losning: String.raw`(2): C är tom och den lilla skatten är inte i B. Då är den lilla i A och den stora i B. Räcker.

(1): B är inte tom och den stora är inte i A. Den stora kan vara i B eller C. Räcker inte.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 27,
    svar: "B",
    losning: String.raw`(2): $n - 3 = \frac{n}{2}$ ger $n = 6$. Räcker.

(1) ger bara ett förhållande, till exempel 3 eller 6 syskon. Räcker inte.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2023vt",
    pass: 4,
    nr: 28,
    svar: "D",
    losning: String.raw`(1): $\frac{a + 5 + b + 9}{2} = 10{,}5$ ger $a + b = 7$, så medelvärdet är 3,5. Räcker.

(2): $\frac{a + b - 1 + 3}{3} = 3$ ger $a + b = 7$. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },

  /* ── Höstprovet 2022, provpass 1 och 4 ────────────────────────── */
  {
    term: "2022ht",
    pass: 1,
    nr: 1,
    svar: "C",
    losning: String.raw`$4 - 3 = 1$, och $1 \cdot (x + 2y) = x + 2y$.

**Svar: C.** Räkna alltid det som går att räkna först. Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 2,
    svar: "D",
    losning: String.raw`$3^3 = 27$ och $2^3 = 8$. $27 - 8 = 19$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 3,
    svar: "B",
    losning: String.raw`Samla $x$: $0{,}2 - 1{,}8 = 0{,}6x - 0{,}4x$, alltså $-1{,}6 = 0{,}2x$ och $x = -8$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 5,
    svar: "B",
    losning: String.raw`Burk A har 10 svarta. Burk B har $\frac{2}{3} \cdot 90 = 60$ svarta. Totalt 70 svarta av 140 kulor.

$\frac{70}{140} = \frac{1}{2}$. **Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 6,
    svar: "A",
    losning: String.raw`$f(2) = 5(8 + 2) - 10(4 + 1) = 50 - 50 = 0$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 8,
    svar: "D",
    losning: String.raw`Om $a$ personer står efter Albert står $3a$ före honom. Totalt $3a + a + 1 = 4a + 1$, alltså ett tal som ger resten 1 vid division med 4.

Av alternativen är det bara 29 ($a = 7$). **Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 9,
    svar: "A",
    losning: String.raw`Kvadreringsreglerna: $(x^2 + 14x + 49) - (x^2 - 14x + 49) = 28x$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 11,
    svar: "A",
    losning: String.raw`$x = -\frac{3}{2}$, så $x^3 = -\frac{27}{8}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 12,
    svar: "D",
    losning: String.raw`$\sqrt{2} \approx 1{,}41$ och $\pi \approx 3{,}14$. $\frac{3{,}14}{1{,}41} \approx 2{,}2$.

**Svar: D.** Det räcker att se att $2 \cdot 1{,}41 = 2{,}82 < 3{,}14$. Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 13,
    svar: "A",
    losning: String.raw`$x = 16 \cdot \frac{8}{10} = 12{,}8$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 14,
    svar: "D",
    losning: String.raw`Alma är medelvärdet av Ella och Lena. Är Ella äldst är Ella äldre än Alma; är Ella yngst är hon yngre. Är de lika gamla blir alla tre lika.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 15,
    svar: "C",
    losning: String.raw`$0{,}3 \cdot 40 = 12$ och $0{,}4 \cdot 30 = 12$.

**Svar: C.** $a$ procent av $b$ är alltid lika med $b$ procent av $a$. Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 16,
    svar: "B",
    losning: String.raw`I: $\frac{11}{3} \approx 3{,}67$. II: $\frac{19}{5} = 3{,}8$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 18,
    svar: "B",
    losning: String.raw`$x^2 + 5x = 0$ ger $x(x + 5) = 0$. Eftersom $x 
eq 0$ är $x = -5$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 19,
    svar: "A",
    losning: String.raw`Längden är $\frac{50}{5} = 10$ cm. Diagonalen är $\sqrt{10^2 + 5^2} = \sqrt{125}$, och $11^2 = 121 < 125$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 20,
    svar: "C",
    losning: String.raw`$\frac{7^{-2}}{3^{-2}} = \frac{3^2}{7^2}$, eftersom negativa exponenter byter plats på täljare och nämnare.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 21,
    svar: "D",
    losning: String.raw`Linjen skär $y$-axeln i $-1 + 10k$, där $k > 0$.

Med $k = 0{,}05$ blir det $-0{,}5$, med $k = 1$ blir det 9. **Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 22,
    svar: "C",
    losning: String.raw`$\frac{2x}{3y} = 7$ ger $2x = 21y$, alltså $y = \frac{2x}{21}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 24,
    svar: "B",
    losning: String.raw`(2): 18 svarta och $\frac{2}{3} \cdot 18 = 12$ röda. Skillnaden är 6. Räcker.

(1) ger bara totalen. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 25,
    svar: "E",
    losning: String.raw`Tillsammans går flera fördelningar. Andersson på tredje, Cedergren och Dahlman på andra, Berg på första stämmer. Dahlman på tredje, Andersson och Berg på andra, Cedergren på första stämmer också.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 26,
    svar: "C",
    losning: String.raw`(1): Jan börjar 10.25 och är klar 11.05, och då är Frida också klar.

(2): När Jan börjar har Frida vikt 10.

Tillsammans viker Frida sina sista 40 servetter på 40 minuter, alltså en per minut. De första 10 tog 10 minuter, så hon började 10.15. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 27,
    svar: "E",
    losning: String.raw`Tillsammans: $y = 2x$ är ett heltal. Men $x = 1{,}5$ ger $y = 3$, och $x = 2$ ger $y = 4$. $x$ kan vara både heltal och inte.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2022ht",
    pass: 1,
    nr: 28,
    svar: "B",
    losning: String.raw`(2): C står mellan A och B, och B mellan C och E. Det ger kedjan A, C, B, E i någon riktning, och D i en ände. Varken D eller E får stå längst till höger, så ordningen blir D, E, B, C, A. Räcker.

(1): D först och A sist, med B mellan C och E. Både D, C, B, E, A och D, E, B, C, A går. Räcker inte.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 1,
    svar: "B",
    losning: String.raw`Nämnaren 12: $\frac{4}{12} + \frac{9}{12} + \frac{5}{12} = \frac{18}{12} = \frac{9}{6}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 2,
    svar: "D",
    losning: String.raw`Sätt lika: $2x - 4 = x - 1$ ger $x = 3$ och $y = 2$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 3,
    svar: "D",
    losning: String.raw`Multiplicera med 7: $45x = 35x + 70$, alltså $x = 7$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 4,
    svar: "B",
    losning: String.raw`$0{,}07 \cdot 15 = 1{,}05$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 5,
    svar: "A",
    losning: String.raw`Medianen av sex tal är medelvärdet av det tredje och fjärde: $\frac{2 + 4}{2} = 3$. Medelvärdet är $\frac{18}{6} = 3$.

Skillnaden är 0. **Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 7,
    svar: "B",
    losning: String.raw`Pröva: B ger $f(1) = -1$ och $f(0) = -2$, och $-1 > -2$.

**Svar: B.** A ger lika, C ger $0 < 1$ och D ger $0 < 2$. Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 8,
    svar: "D",
    losning: String.raw`Varje term tar en bokstav ur varje parentes, så det blir $2 \cdot 2 \cdot 2 = 8$ termer med tre bokstäver vardera.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 9,
    svar: "C",
    losning: String.raw`$\pi r^2 = 27$ ger $r^2 \approx \frac{27}{3{,}14} \approx 8{,}6$, så $r \approx 2{,}9$ och diametern blir knappt 6 cm.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 10,
    svar: "C",
    losning: String.raw`$\frac{1}{2} - \frac{1}{3} = \frac{1}{6}$. Då är $\frac{1}{3} - x = \frac{1}{6}$ och $x = \frac{1}{6}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 11,
    svar: "C",
    losning: String.raw`Ett gram garn är $\frac{130}{50}$ meter. 430 gram är $\frac{130}{50} \cdot 430$ meter.

**Svar: C.** Kontrollera enheterna: meter per gram gånger gram ger meter. Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 12,
    svar: "A",
    losning: String.raw`$4 = 2^2$, så $4 \cdot 2^x = 2^2 \cdot 2^x = 2^{x + 2}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 13,
    svar: "B",
    losning: String.raw`$2x + 6 = 3x + 12$ ger $x = -6$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 14,
    svar: "C",
    losning: String.raw`Summan 10: (4, 6), (5, 5) och (6, 4). Summan 4: (1, 3), (2, 2) och (3, 1). Tre utfall var.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 15,
    svar: "A",
    losning: String.raw`I: $\frac{10}{6} > 1$. II: ett tal mindre än 1 gånger sig självt blir mindre än 1.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 16,
    svar: "D",
    losning: String.raw`Höjderna $h_1$ och $h_2$ kan vara vad som helst, så areorna går inte att jämföra.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 18,
    svar: "A",
    losning: String.raw`I: $\frac{\pi}{4} \approx 0{,}785$ cm². II: $0{,}75$ cm².

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 19,
    svar: "A",
    losning: String.raw`$\sqrt{7} + \sqrt{3} \approx 2{,}65 + 1{,}73 = 4{,}38$. $\sqrt{10} \approx 3{,}16$.

**Svar: A.** Allmänt gäller $\sqrt{a} + \sqrt{b} > \sqrt{a + b}$ för positiva tal. Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 20,
    svar: "D",
    losning: String.raw`Paren med produkten 36: 1 och 36 (summa 37), 2 och 18 (20), 3 och 12 (15), 4 och 9 (13), 6 och 6 (12).

Summan kan vara större och mindre än 18. **Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 21,
    svar: "A",
    losning: String.raw`I: 40 km i 100 km/h tar 0,4 h, alltså 24 minuter.

II: 40 m/s är 144 km/h, och 40 km tar då ungefär 17 minuter.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 22,
    svar: "C",
    losning: String.raw`$\sqrt{x - 2} = \frac{125}{25} = 5$, så $x - 2 = 25$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: omkretsen 20 ger att två sidor är $20 - 2 \cdot 7 = 6$ cm tillsammans, alltså 3 cm. Arean är $7 \cdot 3 = 21$ cm².

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 24,
    svar: "D",
    losning: String.raw`(1): $x = -2$. Ja. Räcker.

(2): En udda potens är negativ bara om talet är negativt. Ja. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 25,
    svar: "C",
    losning: String.raw`Tillsammans: 1A, 1B och 2A har $103 - 24 = 79$ barn. Från (1) är $(1A + 1B) + (1A + 2A) = 51 + 53 = 104$, vilket är de tre klasserna plus 1A en gång till.

$1A = 104 - 79 = 25$. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 26,
    svar: "B",
    losning: String.raw`(1) säger samma sak som frågetexten (80 procent är $\frac{4}{5}$). Räcker inte.

(2): Glas A rymmer $2 \cdot 6 = 12$ cl, så B rymmer $\frac{12}{0{,}8} = 15$ cl. Räcker.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 27,
    svar: "A",
    losning: String.raw`(1): Kalla skoköpet $s$. Böcker $\frac{s}{5}$ och kläder $\frac{2s}{5}$. Totalt $\frac{8s}{5} = 1\,600$, alltså $s = 1\,000$ kr. Räcker.

(2) är bara en olikhet. **Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2022ht",
    pass: 4,
    nr: 28,
    svar: "E",
    losning: String.raw`Tillsammans: Emma är 173 och alltså i mitten. Om Marie är kortast påverkas inte medianen av att hon blir 5 cm kortare. Om Marie är längst, till exempel 180 cm, gör det inte det heller.

Marie kan vara både längst och kortast. **Svar: E.** Mer i ${NOG}.`,
  },

  /* ── Vårprovet 2022 (maj), provpass 1 och 4 ──────────────────── */
  {
    term: "2022vtb",
    pass: 1,
    nr: 1,
    svar: "B",
    losning: String.raw`$15 - 5x = 8 + 2x$ ger $7 = 7x$ och $x = 1$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 3,
    svar: "B",
    losning: String.raw`Multiplicera först: $\frac{4}{27}$. Skriv allt i tjugosjundelar: $\frac{4}{27} - \frac{9}{27} + \frac{12}{27} = \frac{7}{27}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 5,
    svar: "A",
    losning: String.raw`$\sqrt{4} = 2$, och $\sqrt{2} \approx 1{,}41$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 6,
    svar: "D",
    losning: String.raw`$\frac{1}{3} + \frac{1}{5} = \frac{8}{15}$. Hälften av det är $\frac{4}{15}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 7,
    svar: "C",
    losning: String.raw`Rektangelns area är $x \cdot \frac{3x}{4} = \frac{3x^2}{4}$. Kvadratens sida är roten ur det: $\frac{\sqrt{3}\,x}{2}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 8,
    svar: "A",
    losning: String.raw`Dela den första ekvationen med den andra: $\frac{xy^2}{xy} = y = 6$. Då är $x = \frac{3}{6} = \frac{1}{2}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 9,
    svar: "B",
    losning: String.raw`$5^0 = 1$ och $5^{-2} = \frac{1}{25}$. $5 \cdot \frac{1}{25} = 0{,}2$, plus 5 blir 5,2.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 10,
    svar: "C",
    losning: String.raw`Att dela med $\frac{1}{x}$ är att multiplicera med $x$: $\frac{x - 3}{x} \cdot x = x - 3$. Plus 3 blir $x$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 11,
    svar: "A",
    losning: String.raw`Sätt in $x = -2$: $\frac{2}{3} \cdot (-2) + \frac{4}{3} = 0$. Det stämmer.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 12,
    svar: "C",
    losning: String.raw`Hastigheten är $\frac{y}{11}$ meter per sekund. Tiden för $x$ meter är $x \div \frac{y}{11} = \frac{11x}{y}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 13,
    svar: "A",
    losning: String.raw`4 % av 200 är 8. En fjärdedel av 20 är 5.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 15,
    svar: "B",
    losning: String.raw`För en linje är $f(a) - f(b) = -3(a - b)$.

I: $-3(2 - 5) = 9$. II: $-3(0 - 4) = 12$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 16,
    svar: "A",
    losning: String.raw`Nämnaren 30: $\frac{6}{30} + \frac{3}{30} + \frac{2}{30} = \frac{11}{30}$, och $\frac{1}{3} = \frac{10}{30}$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 17,
    svar: "B",
    losning: String.raw`Korsmultiplicera: $12x^2 = 48$, alltså $x^2 = 4$ och $x = 2$ eller $x = -2$. Båda är mindre än 4.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 19,
    svar: "A",
    losning: String.raw`$x^2 > 0$ eftersom $x 
eq 0$. När $y < 1$ är $x^2 y < x^2$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 20,
    svar: "B",
    losning: String.raw`Fem svarta per röd betyder att 1 av 6 kulor är röd. $\frac{1}{6} < \frac{1}{5}$.

**Svar: B.** Fällan är att läsa fem gånger fler som en femtedel. Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 21,
    svar: "C",
    losning: String.raw`$x$: av 17–24 faller 18, 20, 21 och 24 bort (delbara med 3 eller 5). Kvar: 17, 19, 22, 23. Fyra tal.

$y$: 18, 20, 22, 24. Fyra tal.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 22,
    svar: "C",
    losning: String.raw`$\sqrt{5} \cdot \sqrt{9} = \sqrt{45} = 45^{0{,}5}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 23,
    svar: "D",
    losning: String.raw`(1): 10 vita och 5 röda. Skillnaden 5. Räcker.

(2): 5 röda och 10 vita. Skillnaden 5. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 24,
    svar: "D",
    losning: String.raw`(1): Fanny är inte först, och Polly är före Betty. Då är Polly först. Räcker.

(2): Polly är före både Betty och Fanny. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 25,
    svar: "C",
    losning: String.raw`Tillsammans: från 17.00 till 18.10 är 70 minuter, och det är två tredjedelar av arbetet. Hela arbetet tar 105 minuter och är klart 18.45.

Var för sig saknas antingen starten eller takten. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 26,
    svar: "A",
    losning: String.raw`(1): Medelvärdet av $3x$ och $3y$ är tre gånger medelvärdet av $x$ och $y$, alltså är det 49. Ja, mindre än 50. Räcker.

(2): Medelvärdet är större än 25, men det kan vara både över och under 50. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 27,
    svar: "C",
    losning: String.raw`Tillsammans: 40 % stjärna betyder 60 % kryss. Av kryssen är 20 % gröna, så $60 - 20 = 40$ % är röda med kryss.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2022vtb",
    pass: 1,
    nr: 28,
    svar: "B",
    losning: String.raw`(2): Båda tjänar över 25 000, och Annas lön ligger närmare 25 000. Då är Annas lön lägre, och Bertil tjänar mest. Räcker.

(1): Närmare 30 000 kan vara över eller under 30 000. Räcker inte.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 1,
    svar: "B",
    losning: String.raw`$1{,}7 \cdot 3{,}3 = 5{,}61$ och $10^5 \cdot 10^3 = 10^8$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 2,
    svar: "B",
    losning: String.raw`Medelvärdet av $y$ och 1 är 5, så $y = 9$. Då är $x = 6 - 9 = -3$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 3,
    svar: "C",
    losning: String.raw`Potens av potens: multiplicera exponenterna. $7(y + 2) = 7y + 14$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 5,
    svar: "B",
    losning: String.raw`Korsmultiplicera: $12xb = 3ay$, alltså $b = \frac{3ay}{12x} = \frac{ay}{4x}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 7,
    svar: "C",
    losning: String.raw`$2 - (-x) = 2 + x$, så $\frac{x^2}{y} = x$. Dela med $x$: $\frac{x}{y} = 1$, alltså $x = y$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 8,
    svar: "C",
    losning: String.raw`Om tre år har var och en av de tre pojkarna blivit 3 år äldre, alltså har deras summa ökat med 9. Flickan har ökat med 3.

Skillnaden blir 6 år. **Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 9,
    svar: "B",
    losning: String.raw`$\frac{14{,}4}{36} = 0{,}4$, alltså 40 procent.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 10,
    svar: "D",
    losning: String.raw`$a = \frac{a}{2} + 2$ ger $\frac{a}{2} = 2$ och $a = 4$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 12,
    svar: "D",
    losning: String.raw`$(x + y)^2 - (x - y)^2 = 4xy = 4$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 13,
    svar: "B",
    losning: String.raw`80 000 cm är 800 m. 8 km är 8 000 m.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 14,
    svar: "B",
    losning: String.raw`$\frac{5}{20} = \frac{1}{4}$, så I $= \frac{1}{5} - \frac{1}{4} = -\frac{1}{20}$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 15,
    svar: "D",
    losning: String.raw`Utan $a$ är talen 2, 3, 4 och 7. Med $a = 1$ blir medianen 3, med $a = 5$ blir den 4.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 16,
    svar: "C",
    losning: String.raw`$-21 + 14x = 21$ ger $14x = 42$ och $x = 3$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 17,
    svar: "D",
    losning: String.raw`Den tredje sidan måste vara kortare än 17 cm men kan vara allt från nästan 0 upp till nästan 17. Den kan vara både kortare och längre än 15.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 18,
    svar: "A",
    losning: String.raw`$x = y + \frac{3}{5} - \frac{1}{2} = y + \frac{1}{10}$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 19,
    svar: "D",
    losning: String.raw`I minus II är $2y$, och tecknet på $y$ är okänt.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 20,
    svar: "A",
    losning: String.raw`Jämför $r^2$: I $= 25 + 400 = 425$, II $= 100 + 225 = 325$ (gånger $\pi$).

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 22,
    svar: "C",
    losning: String.raw`$21 = 3 \cdot 7$ ger summan 10. $30 = 2 \cdot 3 \cdot 5$ ger summan 10.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 23,
    svar: "E",
    losning: String.raw`Både Alma och Elsa är längre än Freja, men det säger inget om hur de förhåller sig till varandra.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: en tredjedel av pennorna är röda, så två tredjedelar, 20 stycken, är svarta. Totalt 30.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 25,
    svar: "D",
    losning: String.raw`(1): Bara 56 är delbart med 7 mellan 50 och 60. Räcker.

(2): Bara 56 är delbart med 8 mellan 50 och 60. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 26,
    svar: "A",
    losning: String.raw`(1): Choklad och jordgubb är $\frac{7}{8}$ av kulorna, alltså är 140 kulor $\frac{7}{8}$ av totalen. Totalt 160. Räcker.

(2) säger bara hur mycket choklad som sålts. **Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 27,
    svar: "C",
    losning: String.raw`Tillsammans: $xy > xz$ betyder $x(y - z) > 0$. Från (1) är $y < z$, så $y - z < 0$. Då måste $x < 0$.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2022vtb",
    pass: 4,
    nr: 28,
    svar: "B",
    losning: String.raw`(2): Är kvadratens sida $s$ är diagonalen $s\sqrt{2}$, och cirkelns radie $\frac{s\sqrt{2}}{2}$. Cirkelns area blir $\pi \cdot \frac{s^2}{2} \approx 1{,}57s^2$, större än $s^2$. Räcker.

(1): Med radien 1 är cirkeln 3,14. Sidan 1,1 ger en kvadrat på 1,21, sidan 2 ger 4. Räcker inte.

**Svar: B.** Mer i ${NOG}.`,
  },

  /* ── Vårprovet 2022 (mars), provpass 3 och 5 ─────────────────── */
  {
    term: "2022vta",
    pass: 3,
    nr: 1,
    svar: "B",
    losning: String.raw`Inifrån och ut: $7 - 2 = 5$, $6 \cdot 5 + 5 = 35$, $4 \cdot 35 = 140$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 2,
    svar: "B",
    losning: String.raw`$f(2) = \frac{4 + 7}{6 + c} = 1$, så $6 + c = 11$ och $c = 5$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 3,
    svar: "C",
    losning: String.raw`Skriv allt i trettiotvåondelar: $\frac{8}{32} + \frac{4}{32} + \frac{3}{32} = \frac{15}{32}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 4,
    svar: "D",
    losning: String.raw`$(3x - 3y)(y - x) = -3(x - y)^2 = -3x^2 + 6xy - 3y^2$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 6,
    svar: "A",
    losning: String.raw`$2^{25}$ har bara tvåor som primtalsfaktorer. Bara 16 $= 2^4$ saknar andra faktorer.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 7,
    svar: "D",
    losning: String.raw`Lutningen är $\frac{1 - 4}{3 - 2} = -3$. Med $f(2) = 4$: $4 = -6 + m$, alltså $m = 10$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 8,
    svar: "D",
    losning: String.raw`Multiplicera med 12: $4x + 3x = 12x - 24$, alltså $5x = 24$ och $x = \frac{24}{5}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 9,
    svar: "C",
    losning: String.raw`Kalla priset $p$. Lika pris: $0{,}90p = 0{,}92p - 40$, alltså $0{,}02p = 40$ och $p = 2\,000$ kr.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 10,
    svar: "B",
    losning: String.raw`$10^{-2x} = \frac{1}{10^{2x}} = \frac{1}{36}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 11,
    svar: "A",
    losning: String.raw`Med återläggning är sannolikheten för två svarta $p^2 = \frac{16}{49}$, så $p = \frac{4}{7}$. Röd är då $\frac{3}{7}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 12,
    svar: "B",
    losning: String.raw`Skivan delas i $4 \cdot 3 \cdot 2 = 24$ lika bitar. Hela arean är $\pi \cdot 24^2 = 576\pi$, och en bit är $\frac{576\pi}{24} = 24\pi$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 15,
    svar: "C",
    losning: String.raw`$\frac{24}{6} = 4$ och $\frac{3}{12} \cdot 16 = 4$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 16,
    svar: "C",
    losning: String.raw`I: $\frac{12}{4} = 3$. II: medelvärdet $\frac{24}{4} = 6$, hälften är 3.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 17,
    svar: "A",
    losning: String.raw`I: $\frac{4}{3} \approx 1{,}33$. II: $\frac{4}{\pi} \approx 1{,}27$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 19,
    svar: "D",
    losning: String.raw`Anna har $66 - 19 - C = 47 - C$, där Clara har minst 23. Clara 23 ger Anna 24, Clara 30 ger Anna 17.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 20,
    svar: "B",
    losning: String.raw`I: $\frac{x}{2} - \frac{x}{2} = 0$. II: $2 - \frac{1}{2} = 1{,}5$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 21,
    svar: "D",
    losning: String.raw`$x = 1$ ger I $= 1$ och II $= 0{,}5$. $x = 16$ ger I $= 4$ och II $= 8$.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 22,
    svar: "C",
    losning: String.raw`Peter: 5 m/s är 18 km/h, och 2 timmar ger 36 km. Mattias: $12 \cdot 3 = 36$ km.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: Daniel hoppar inte från 5 meter, och Gabriel hoppar lägre än Mikael och alltså inte heller från 5 meter. Kvar blir Mikael.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 24,
    svar: "A",
    losning: String.raw`(1): $m + 16 = 2(176 - m)$ ger $3m = 336$ och $m = 112$. Räcker.

(2): $x$ är okänt. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 25,
    svar: "D",
    losning: String.raw`(1): En tredjedel tar 2 timmar, hela 6 timmar. Räcker.

(2): I normal takt skulle två tredjedelar ta 4 timmar, hela 6 timmar. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 26,
    svar: "B",
    losning: String.raw`(2): $0{,}8 \cdot 1{,}25 = 1$. Priset är tillbaka där det började, så ändringen är 0 procent. Räcker.

(1) säger bara vad priset var. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 27,
    svar: "E",
    losning: String.raw`Vi vet inte hur många block som är A4 och hur många som är A5, så andelarna går inte att göra om till antal.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2022vta",
    pass: 3,
    nr: 28,
    svar: "C",
    losning: String.raw`(1): $x - y > x + y$ ger $-y > y$, alltså $y < 0$.

Tillsammans med $x > 0$ (2) är $x > 0 > y$.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 1,
    svar: "A",
    losning: String.raw`$x - 7 = 3x + 3$ ger $-2x = 10$ och $x = -5$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 3,
    svar: "C",
    losning: String.raw`$\frac{64 + 16}{2} = 40 = 2^3 \cdot 5$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 4,
    svar: "A",
    losning: String.raw`$f(1) = 2$, så $g(1) = -2 \cdot 2 + 4 = 0$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 5,
    svar: "B",
    losning: String.raw`Täljaren: $\frac{8}{20} - \frac{5}{20} = \frac{3}{20}$. Nämnaren: $\frac{2}{6} + \frac{1}{6} = \frac{1}{2}$.

$\frac{3}{20} \div \frac{1}{2} = \frac{3}{10}$. **Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 6,
    svar: "D",
    losning: String.raw`$(\sqrt{51} + \sqrt{51})^2 = (2\sqrt{51})^2 = 4 \cdot 51 = 204$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 7,
    svar: "C",
    losning: String.raw`$f(1) = 3a = 3$ ger $a = 1$. Då är $f(0) = 1 \cdot 3^0 = 1$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 8,
    svar: "D",
    losning: String.raw`Nämnaren är $x^4 y^2 z^4$. Allt förkortas utom en $z$ i nämnaren.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 9,
    svar: "D",
    losning: String.raw`$0{,}6x = 0{,}4y$ ger $y = 1{,}5x$, alltså 150 procent av $x$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 10,
    svar: "C",
    losning: String.raw`Sidan är 10 cm och diagonalen $10\sqrt{2} \approx 14{,}1$ cm.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 11,
    svar: "B",
    losning: String.raw`$xz + yz = z(x + y) = 5 \cdot 5 = 25$, och $\sqrt{25} = 5$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 12,
    svar: "A",
    losning: String.raw`Para ihop: $1 - 2$, $3 - 4$, och så vidare. Varje par ger $-1$, och det finns 30 par.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 13,
    svar: "C",
    losning: String.raw`$\frac{707}{70} = 10{,}1$ och $\frac{808}{80} = 10{,}1$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 14,
    svar: "A",
    losning: String.raw`AB och BC är båda $\sqrt{4^2 + 3^2} = 5$, alltså 10 tillsammans. AD är $\sqrt{8^2 + 1^2} = \sqrt{65} \approx 8{,}1$.

**Svar: A.** En omväg är alltid längre än den raka vägen. Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 15,
    svar: "B",
    losning: String.raw`I: $\pi \cdot 4 \cdot 5 = 20\pi$. II: $\pi \cdot 25 \cdot 2 = 50\pi$.

**Svar: B.** Radien räknas i kvadrat, så den väger tyngst. Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 16,
    svar: "A",
    losning: String.raw`$\frac{x}{3} = \frac{1}{3} + \frac{2}{5} = \frac{11}{15}$, så $x = \frac{11}{5} = 2{,}2$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 17,
    svar: "B",
    losning: String.raw`Dela båda med $p > 0$: jämför $p^2$ med 42. $p^2 < 25$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 18,
    svar: "C",
    losning: String.raw`I: $\frac{5}{9} \cdot \frac{4}{8}$. II: $\frac{5}{9} \cdot \frac{4}{8}$. Efter en röd är det 4 röda och 4 blå kvar.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 19,
    svar: "B",
    losning: String.raw`$36^{\frac{1}{3}} = 6^{\frac{2}{3}}$, så $2x = \frac{2}{3}$ och $x = \frac{1}{3}$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 20,
    svar: "B",
    losning: String.raw`Talen är 1, 2, 3, 4 och 5. Skillnaden är 4.

**Svar: B.** Fem tal i följd skiljer alltid 4. Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 21,
    svar: "D",
    losning: String.raw`$n = 10$ ger lika, $n = 2$ ger $100$ mot $1\,024$, och $n = 0$ ger 1 mot 0.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 23,
    svar: "D",
    losning: String.raw`(1): $2 = \frac{n + 2}{12}$ ger $n = 22$. Räcker.

(2): $2 = \frac{n}{11}$ ger $n = 22$. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: vinnaren fick 56 % och förloraren 44 %, alltså skiljer det 12 procentenheter. Det är 1 200 röster, så totalt 10 000.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 25,
    svar: "E",
    losning: String.raw`Tillsammans: Sebastian är 5, Julia 10 och Benjamin 12. Alexandra är yngre än Benjamin men kan vara både äldre och yngre än Sebastian.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 26,
    svar: "B",
    losning: String.raw`(2): Summan måste vara densamma för alla par, och det går bara om den är 5: nyckel 1 i lås 4, 2 i 3, 3 i 2 och 4 i 1. Räcker.

(1) tillåter många kombinationer. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2022vta",
    pass: 5,
    nr: 28,
    svar: "B",
    losning: String.raw`(2): Efter Bo står nu 36 personer. Av 100 står då $100 - 1 - 36 = 63$ före honom. Räcker.

(1) kräver att vi vet hur många som stod före honom från början. **Svar: B.** Mer i ${NOG}.`,
  },

  /* ── Höstprovet 2021, provpass 1 och 4 ────────────────────────── */
  {
    term: "2021ht",
    pass: 1,
    nr: 1,
    svar: "A",
    losning: String.raw`$\frac{1}{2} + \frac{1}{3} = \frac{5}{6}$, så $x = \frac{1}{6}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 2,
    svar: "D",
    losning: String.raw`Med $v$ vita rosor finns $3v$ röda, alltså $4v$ totalt. Bara 28 är delbart med 4.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 3,
    svar: "C",
    losning: String.raw`Multiplikation först: $5 + 15 - 4 + 16 = 32$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 4,
    svar: "D",
    losning: String.raw`$y + 5 = 4x$, alltså $x = \frac{y + 5}{4}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 6,
    svar: "D",
    losning: String.raw`$3x(2 - 5y) = 6x - 15xy = -(15y - 6)x$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 8,
    svar: "D",
    losning: String.raw`21 av 28 kulor är inte vita. $\frac{21}{28} = \frac{3}{4}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 9,
    svar: "C",
    losning: String.raw`Nämnaren är $0{,}072$. $\frac{0{,}36}{0{,}072} = \frac{360}{72} = 5$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 11,
    svar: "A",
    losning: String.raw`$x(5x + 3) = 0$ ger $x = 0$ eller $x = -\frac{3}{5}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 13,
    svar: "B",
    losning: String.raw`Summan är 36, så $x = 36 - 30 = 6$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 14,
    svar: "C",
    losning: String.raw`$1 + \frac{1}{4} = 1{,}25$ och $\frac{10}{8} = 1{,}25$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 15,
    svar: "D",
    losning: String.raw`Tecknen spelar ingen roll i kvadraten, och storlekarna är okända. $x = 1$, $y = -1$ ger I $= 2$; $z = 3$, $w = -3$ ger II $= 18$. Eller tvärtom.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 16,
    svar: "A",
    losning: String.raw`I: $12 \cdot 25 = 300$ cm². II: $\frac{8 \cdot 64}{2} = 256$ cm².

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 17,
    svar: "B",
    losning: String.raw`$4x + 8 = 2x + 4$ ger $x = -2$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 18,
    svar: "C",
    losning: String.raw`$f(3) = 9 - 6 - 3 = 0$ och $f(-1) = 1 + 2 - 3 = 0$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 19,
    svar: "A",
    losning: String.raw`$0{,}7 \cdot 105 = 73{,}5$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 20,
    svar: "B",
    losning: String.raw`$F(5) = 1 + 2 + 3 + 4 = 10$. $G(11) = 2 + 4 + 6 + 8 + 10 = 30$, och hälften är 15.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 21,
    svar: "B",
    losning: String.raw`Omkretsen genom diametern är $\pi \approx 3{,}14$. Kvadratens omkrets genom sidan är 4.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 22,
    svar: "C",
    losning: String.raw`I: $x^{7 + \frac{2}{3}} = x^{\frac{23}{3}}$. II: $(x^{23})^{\frac{1}{3}} = x^{\frac{23}{3}}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 23,
    svar: "C",
    losning: String.raw`(1) ger förhållandet $\frac{t}{2} = \frac{b}{3}$, alltså 2 tuschpennor på 3 blyertspennor. (2) ger totalen.

Tillsammans: 2 av 5 pennor är tusch, alltså 6. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 25,
    svar: "C",
    losning: String.raw`Tillsammans: Berit har längre väg (2) men kommer fram först (1). Då springer hon fortare.

Var för sig saknas antingen sträckorna eller tiderna. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 26,
    svar: "B",
    losning: String.raw`(2): 100 gula är hälften av de svarta, så det finns 200 svarta. Räcker.

(1) ger bara summan av svarta och gula. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2021ht",
    pass: 1,
    nr: 28,
    svar: "E",
    losning: String.raw`Tillsammans: $y = -100$ och $x = 50$ uppfyller båda, men $x$ är inte mindre än 25. $y = 0$ och $x = 10$ uppfyller också båda, och då är det.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 1,
    svar: "A",
    losning: String.raw`$2x - x = -7 - 9$, alltså $x = -16$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 2,
    svar: "C",
    losning: String.raw`Åttondelar: $\frac{1}{8} + \frac{6}{8} + \frac{4}{8} = \frac{11}{8}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 4,
    svar: "D",
    losning: String.raw`Genom origo betyder $f(x) = kx$. $8k = -6$ ger $k = -\frac{3}{4}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 5,
    svar: "D",
    losning: String.raw`8 procent av priset är 640 kr, så priset är $\frac{640}{0{,}08} = 8\,000$ kr.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 6,
    svar: "C",
    losning: String.raw`$\frac{3}{7}$ tar 4,5 timmar, alltså tar $\frac{1}{7}$ 1,5 timmar. Resten, $\frac{4}{7}$, tar 6 timmar.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 8,
    svar: "B",
    losning: String.raw`Räkna alla: A $= 9 \cdot (-2) \cdot 1 = -18$, B $= 9 \cdot 4 \cdot (-1) = -36$, C $= -3 \cdot 4 \cdot 1 = -12$, D $= -3 \cdot (-8) \cdot (-1) = -24$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 9,
    svar: "D",
    losning: String.raw`$14 + 11 + 13 + 22 = 60$. Medelvärdet är $\frac{60 + x}{5} = 12 + \frac{x}{5}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 10,
    svar: "C",
    losning: String.raw`$\frac{2}{3}x = \frac{4}{7}$ ger $x = \frac{3}{2} \cdot \frac{4}{7}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 11,
    svar: "B",
    losning: String.raw`63 liter är 63 dm³, och radien är 2 dm. $\pi \cdot 4 \cdot h = 63$ ger $h \approx \frac{63}{12{,}6} = 5$ dm.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 12,
    svar: "A",
    losning: String.raw`$4^0 = 1$ och $8 = 2^3$. Då är $2^{3 + m} = 1 = 2^0$, alltså $m = -3$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 13,
    svar: "A",
    losning: String.raw`Dela med 3: $\frac{2}{x} - \frac{1}{6} = \frac{1}{2}$, alltså $\frac{2}{x} = \frac{2}{3}$ och $x = 3$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 15,
    svar: "B",
    losning: String.raw`12 vänsterhänta kvinnor är 25 procent av kvinnorna, så det finns 48 kvinnor och 52 män.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 16,
    svar: "B",
    losning: String.raw`$\sqrt{23} < \sqrt{25} = 5$. $\sqrt{9} + \sqrt{5} = 3 + \sqrt{5} > 3 + 2 = 5$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 17,
    svar: "C",
    losning: String.raw`$x = 5y$, så 20 procent av $x$ är $y$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 18,
    svar: "B",
    losning: String.raw`$3x - 1 = 5x + 3$ ger $x = -2$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 20,
    svar: "B",
    losning: String.raw`$y^2 - x^2 = (y - x)(y + x)$. Talen följer på varandra, så $y - x = 1$ och $y + x = 9$. Då är $y = 5$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 21,
    svar: "C",
    losning: String.raw`Kalla ringarna $r$. Armband $2r$, halsband $r + 3 = 2r - 2$, alltså $r = 5$ och 8 halsband.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 22,
    svar: "D",
    losning: String.raw`Med tio värden är medianen medelvärdet av det femte och sjätte. Tas det största bort blir medianen det femte värdet.

Är femte och sjätte båda 25 blir det 25. Är de 24 och 26 blir det 24. **Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: $x + z = 166$ och $y + w = 182$, totalt 348. Medelvärdet är 87.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 24,
    svar: "A",
    losning: String.raw`(1): Från botten: vit, röd, svart. Den svarta är överst. Räcker.

(2): Vit och svart är i var sin ände, men vilken är överst? Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 25,
    svar: "E",
    losning: String.raw`Tillsammans vet vi att Robin hittade 33 kottar och att de två hittade 59 tallkottar, men inte hur tallkottarna fördelade sig.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 26,
    svar: "B",
    losning: String.raw`(2): Röd är bättre än gul, gul bättre än svart och svart bättre än vit. Röd studsar bäst. Räcker.

(1): Både gul och röd kan vara bäst. Räcker inte.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2021ht",
    pass: 4,
    nr: 27,
    svar: "D",
    losning: String.raw`(1): $3n + 2$ jämnt ger $3n$ jämnt, alltså $n$ jämnt. Räcker.

(2): $n^2 + 3$ udda ger $n^2$ jämnt, alltså $n$ jämnt. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },

  /* ── Vårprovet 2021 (maj), provpass 2 och 5 ─────────────────────────────────────── */
  {
    term: "2021vtb",
    pass: 2,
    nr: 1,
    svar: "A",
    losning: String.raw`$\frac{x}{3} = \frac{11}{12} - \frac{3}{12} = \frac{8}{12} = \frac{2}{3}$, så $x = 2$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 3,
    svar: "C",
    losning: String.raw`$\sqrt{65}$ är strax över 8 och $\sqrt{35}$ strax under 6. Summan är ungefär 14.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 4,
    svar: "D",
    losning: String.raw`Nämnaren: $2 - 1{,}1 = 0{,}9$. $\frac{0{,}6}{0{,}9} = \frac{2}{3}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 6,
    svar: "B",
    losning: String.raw`Två tal med produkten $-12$ och summan 1: $-3$ och 4.

$(x - 3)(x + 4)$. **Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 7,
    svar: "B",
    losning: String.raw`Multiplicera exponenterna: $2 \cdot \frac{5}{7} = \frac{10}{7}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 8,
    svar: "C",
    losning: String.raw`$99 = 9 \cdot 11$, $93 = 3 \cdot 31$ och $91 = 7 \cdot 13$. 97 är ett primtal.

**Svar: C.** 91 är den klassiska fällan. Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 9,
    svar: "C",
    losning: String.raw`$-2x + 2 = 2x + 4$ ger $-4x = 2$ och $x = -\frac{1}{2}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 10,
    svar: "A",
    losning: String.raw`Kalla den röda sidan $s$. $(s + 6)^2 - s^2 = 12s + 36 = 48$, alltså $s = 1$ och arean 1 cm².

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 11,
    svar: "D",
    losning: String.raw`Summan är 22, och medianen 5 betyder att de två mittersta väger 10 tillsammans. De två andra väger då 12.

Den lättaste kan väga högst 5 (den får inte vara tyngre än de mittersta), så den tyngsta väger minst 7.

**Svar: D.** Exempel: 5, 5, 5 och 7 kg. Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 12,
    svar: "C",
    losning: String.raw`1 m/s är 3,6 km/h, och $3{,}6 = \frac{18}{5}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 13,
    svar: "D",
    losning: String.raw`$x$ kan vara både större och mindre än $y$: $x = 0$, $y = 8$ eller $x = 100$, $y = 8$.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 14,
    svar: "A",
    losning: String.raw`1 m³ är 1 000 dm³.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 15,
    svar: "D",
    losning: String.raw`Av de 30 cyklisterna kan högst 20 jobba på kontoret, så minst 10 och högst 30 jobbar i verkstaden.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 17,
    svar: "C",
    losning: String.raw`Båda är $\frac{x}{20}$. Ordningen spelar ingen roll vid multiplikation.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 18,
    svar: "C",
    losning: String.raw`$f(2) = 3 \cdot 4 = 12$, så I $= 48$. $f(4) = 3 \cdot 16 = 48$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 19,
    svar: "B",
    losning: String.raw`$\frac{1}{x + 1} < \frac{1}{x}$, så I är negativ och II samma tal fast positivt.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 20,
    svar: "A",
    losning: String.raw`I: $\frac{5}{20} = 0{,}25$. II: $\frac{4}{18} \approx 0{,}22$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 22,
    svar: "B",
    losning: String.raw`$x^2 > 0$, så $x^2 y^3 > 0$ ger $y^3 > 0$ och $y > 0$. Då ger $xy < 0$ att $x < 0$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 23,
    svar: "C",
    losning: String.raw`(1) ger Felix $= A - 13$ och Oskar $= A - 8$, men inte $A$. (2) ger summan $3 \cdot 181 = 543$.

Tillsammans: $3A - 21 = 543$, alltså $A = 188$ cm. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 24,
    svar: "D",
    losning: String.raw`(1): $0{,}04x = 60$ ger $x = 1\,500$. Räcker.

(2): $3x - 500 = 4\,000$ ger $x = 1\,500$. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 25,
    svar: "A",
    losning: String.raw`(1): Kemiboken på plats 2 har matematik och fysik på var sin sida, alltså på 1 och 3. Matematik är inte på 3, så den är på 1. Räcker.

(2) säger inget om matematikboken. **Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 27,
    svar: "E",
    losning: String.raw`Båda påståendena säger att Sophie bor överst. Ingen av dem säger om Ella eller Ylva bor i mitten.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2021vtb",
    pass: 2,
    nr: 28,
    svar: "D",
    losning: String.raw`(1): Bert springer 1,5 gånger så fort, så sträckorna delas 1,5:1. Bert springer $\frac{1{,}5}{2{,}5} \cdot 3 = 1{,}8$ km. Räcker.

(2): Anton springer $8 \cdot \frac{9}{60} = 1{,}2$ km, så Bert springer 1,8 km. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 1,
    svar: "A",
    losning: String.raw`$4x - 8 = -2x - 8$ ger $6x = 0$ och $x = 0$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 2,
    svar: "A",
    losning: String.raw`Summan är $4 \cdot 16 = 64$, och $13 + 14 + 26 = 53$. $x = 11$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 3,
    svar: "D",
    losning: String.raw`$\frac{1}{2} + \frac{1}{6} = \frac{2}{3}$, och $\frac{1}{3} \cdot \frac{2}{3} = \frac{2}{9}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 4,
    svar: "A",
    losning: String.raw`$f(2) = 4$, så $g(2) = -12 - 12 = -24$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 5,
    svar: "C",
    losning: String.raw`$0{,}4x = 54$ ger $x = 135$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 6,
    svar: "D",
    losning: String.raw`Skriv talen som $x$, $x + 1$, $x + 2$ och $x + 3$. $(2x + 5) - (2x + 1) = 4$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 7,
    svar: "D",
    losning: String.raw`Täljaren: $a^{5 - 3} = a^2$. Nämnaren: $a^{-8 + 2} = a^{-6}$. $\frac{a^2}{a^{-6}} = a^8$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 8,
    svar: "A",
    losning: String.raw`Korsmultiplicera: $5x = 4 \cdot 6$, alltså $x = \frac{4 \cdot 6}{5}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 9,
    svar: "B",
    losning: String.raw`En burk rymmer $\pi \cdot 2^2 \cdot 5 = 20\pi \approx 63$ cm³. 0,6 liter är 600 cm³, och $\frac{600}{63} \approx 9{,}5$. Det behövs 10 burkar.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 11,
    svar: "B",
    losning: String.raw`$\sqrt{36} = 6$ och $\sqrt{10^{36}} = 10^{18}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 12,
    svar: "B",
    losning: String.raw`En punkt ligger under linjen om $y < \frac{x}{2}$. För (23, 0): $0 < 11{,}5$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 13,
    svar: "B",
    losning: String.raw`25 promille är 2,5 procent. $0{,}025 \cdot 40\,000 = 1\,000$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 14,
    svar: "D",
    losning: String.raw`Villkoret säger bara att det finns högst tre blå kulor. Påsen kan innehålla 4 kulor eller 100.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 15,
    svar: "B",
    losning: String.raw`I: $2x^2$. II: $\frac{3}{4}\pi x^2 \approx 2{,}36x^2$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 16,
    svar: "C",
    losning: String.raw`$2y = 3 + 4x$, alltså $y = 1{,}5 + 2x$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 17,
    svar: "D",
    losning: String.raw`Det andra talet är $70 - x$. Vilket av dem som är störst går inte att säga.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 18,
    svar: "C",
    losning: String.raw`Att dela med $\frac{11}{6}$ är att multiplicera med $\frac{6}{11}$. Båda är $\frac{18}{88}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 19,
    svar: "A",
    losning: String.raw`$x$ är jämnt, så $(-7)^x > 0$ och $(-7)^{x + 1} < 0$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 20,
    svar: "C",
    losning: String.raw`Linjen genom origo och $(-3, 3)$ är $y = -x$. Alla punkter på den har $x + y = 0$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 21,
    svar: "B",
    losning: String.raw`$1 + 5 + 9 = 15$ delar på 180°, alltså 12° per del. Den minsta vinkeln är 12°.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 22,
    svar: "A",
    losning: String.raw`I: $x = 3$. II: $x = 2$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: Cilla är fladdermus och Allan spöke. Varulven är Allan eller Billy, alltså Billy. Då blir Dolly zombie.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 24,
    svar: "E",
    losning: String.raw`Tillsammans vet vi att det finns dubbelt så många vita som svarta knappar och att 15 vita har fyra hål. Men vi vet inte hur många vita som har två hål.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 25,
    svar: "C",
    losning: String.raw`Tillsammans: om hälften av de vita blev gula skulle $0{,}86 \cdot 50 = 43$ vara gula. Det är 7 fler än nu, alltså är hälften av de vita 7. Det finns 14 vita och 36 gula.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2021vtb",
    pass: 5,
    nr: 28,
    svar: "A",
    losning: String.raw`(1): Fyra ettor utan två i följd bland sju siffror måste stå på plats 1, 3, 5 och 7. Talet är 1 212 121. Räcker.

(2): Varje tvåa följs av en etta, men den fjärde ettan kan stå på flera ställen, till exempel 1 212 121 eller 2 112 121. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },

  /* ── Vårprovet 2021 (mars), provpass 3 och 5 ─────────────────────────────────────── */
  {
    term: "2021vta",
    pass: 3,
    nr: 1,
    svar: "B",
    losning: String.raw`$2x - 12 = 8 - 4x$ ger $6x = 20$ och $x = \frac{10}{3}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 2,
    svar: "B",
    losning: String.raw`$3x^2 = 12$ ger $x^2 = 4$, alltså $x = 2$ eller $-2$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 3,
    svar: "C",
    losning: String.raw`20 procent är en femtedel. En femtedel av en femtedel är $\frac{1}{25}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 5,
    svar: "C",
    losning: String.raw`Tio tal: medianen är medelvärdet av det femte och sjätte, $\frac{5 + 6}{2} = 5{,}5$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 6,
    svar: "B",
    losning: String.raw`$4^y = 2^{2y}$, så $2^{x + 2y} = 16 = 2^4$ och $x + 2y = 4$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 8,
    svar: "D",
    losning: String.raw`Täljaren: $\frac{9}{12} + \frac{16}{12} = \frac{25}{12}$. Dela med $\frac{12}{5}$: $\frac{25}{12} \cdot \frac{5}{12} = \frac{125}{144}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 9,
    svar: "D",
    losning: String.raw`Multiplicera ut: $a^3 - a^2b + ab^2 + a^2b - ab^2 + b^3 = a^3 + b^3$.

**Svar: D.** Det är formeln för summan av två kuber. Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 11,
    svar: "B",
    losning: String.raw`$1{,}25x = 0{,}75y$ ger $x = \frac{0{,}75}{1{,}25}y = \frac{3}{5}y$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 12,
    svar: "A",
    losning: String.raw`$75 = 3 \cdot 5^2$. För att få en jämn kvadrat behövs en trea till, alltså $x = 3$ och $75 \cdot 3 = 225 = 15^2$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 13,
    svar: "A",
    losning: String.raw`$f\left(-\frac{1}{2}\right) = 2 + 2 = 4$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 14,
    svar: "C",
    losning: String.raw`$\sqrt{9} + 1 = 4$, så båda är $(\sqrt{x})^4$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 15,
    svar: "B",
    losning: String.raw`Ett tal under 1 upphöjt till ett positivt tal blir mindre än 1, och ett tal över 1 blir större än 1.

**Svar: B.** Inget behöver räknas ut. Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 16,
    svar: "B",
    losning: String.raw`Vinklarna summerar till 180°, så den minsta är högst 60°, och eftersom alla är olika är den mindre än 60°.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 17,
    svar: "B",
    losning: String.raw`Tvåsiffriga är 10–99, alltså 90 av 190. $\frac{90}{190} < \frac{1}{2}$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 18,
    svar: "A",
    losning: String.raw`Linje A har $k = 1$. Vinkelrät mot den är $k = -1$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 19,
    svar: "A",
    losning: String.raw`1 liter är 1 000 cm³, så 159 liter är 159 000 cm³.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 20,
    svar: "D",
    losning: String.raw`Produkten kan vara $100 \cdot 10 = 1\,000$ eller $999 \cdot 99 = 98\,901$. Kvantitet II kan vara vilket fyrsiffrigt tal som helst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 21,
    svar: "C",
    losning: String.raw`$\pi r^2 = \pi^3$ ger $r^2 = \pi^2$ och $r = \pi$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 22,
    svar: "C",
    losning: String.raw`Kalla $t = \frac{x}{y} > 0$. $\sqrt{t} = t$ ger $t = 1$, alltså $x = y$ och $\frac{2y}{x} = 2$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 23,
    svar: "E",
    losning: String.raw`Tillsammans vet vi att Emma kör en femtedel på 2 minuter och halva sträckan på 5, men aldrig hur fort eller hur långt.

**Svar: E.** Allt i uppgiften är andelar och tider. Utan en sträcka eller en hastighet går längden inte att få fram. Mer i ${NOG}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 24,
    svar: "D",
    losning: String.raw`(1): $28 \cdot 9 = 252$. Räcker.

(2): 56 är 25 procent av det som är kvar, alltså är 224 kvar och 252 från början. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 25,
    svar: "C",
    losning: String.raw`Tillsammans: 70 procent av 1,5 liter är 1,05 liter, alltså 10,5 dl socker som väger $10{,}5 \cdot 90 = 945$ g. Burken väger $1\,250 - 945 = 305$ g.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2021vta",
    pass: 3,
    nr: 26,
    svar: "C",
    losning: String.raw`(1): 12 av de 24 mörka är inte släta, så 12 mörka är släta. Inget om ljusa.

(2): Lika många ljusa som mörka är släta, men inget antal.

Tillsammans: $12 + 12 = 24$ släta stenar. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 1,
    svar: "C",
    losning: String.raw`$a + a = 2a$, och $a \cdot 2a = 2a^2$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 3,
    svar: "B",
    losning: String.raw`I A får man $\frac{100}{5} = 20$ äpplen. I B kostar de 4 kr, och man får 25. Fem fler.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 4,
    svar: "A",
    losning: String.raw`$p + 150 = 200$ ger $p = 50$. $4 \cdot 50 - 200 = 0$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 5,
    svar: "D",
    losning: String.raw`Från P till M är det $+4$ i $x$ och $+3$ i $y$. Lika långt till går man till $(7, 6)$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 6,
    svar: "D",
    losning: String.raw`Skriv alla som en rot: $\sqrt{50}$, $\sqrt{100}$, $\sqrt{250}$ och $\sqrt{500}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 7,
    svar: "B",
    losning: String.raw`$\frac{2}{x + 1} = 3$ ger $x + 1 = \frac{2}{3}$ och $x = -\frac{1}{3}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 8,
    svar: "A",
    losning: String.raw`Tre av något plus tre av samma sak är sex av det: $6 \cdot 10^5$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 9,
    svar: "D",
    losning: String.raw`Åttondelar: $\frac{4 + 2 + 1}{8} = \frac{7}{8}$. Dela med 3: $\frac{7}{24}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 10,
    svar: "A",
    losning: String.raw`$f(x) - 1$ måste vara delbart med 8. $-31 - 1 = -32 = 8 \cdot (-4)$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 11,
    svar: "C",
    losning: String.raw`$13 \cdot 20 = 260$, och 254 ligger närmare 260 än $13 \cdot 19 = 247$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 13,
    svar: "B",
    losning: String.raw`$a = b - 4$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 14,
    svar: "D",
    losning: String.raw`Charlie har mellan $8 \cdot 5 = 40$ och $9 \cdot 7 = 63$ kritor.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 15,
    svar: "A",
    losning: String.raw`$\frac{0{,}86}{3} \approx 0{,}29$, större än 0,25.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 17,
    svar: "C",
    losning: String.raw`Oscar: $\frac{x}{y/3} = \frac{3x}{y}$. Peter: $\frac{6x}{2y} = \frac{3x}{y}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 19,
    svar: "B",
    losning: String.raw`Summan är 48, och $10 + 15 + 25 = 50$. $x = -2$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 20,
    svar: "A",
    losning: String.raw`$f$: $2x + \frac{1}{5} = 0$ ger $x = -\frac{1}{10}$. $g$: $\frac{x}{2} + 5 = 0$ ger $x = -10$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 22,
    svar: "B",
    losning: String.raw`$\frac{1}{x} = 1 + \frac{1}{y} > \frac{1}{y}$. För positiva tal betyder större invers mindre tal, så $x < y$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: Carl står trea. Dinah står mellan Bea och Carl, och det går bara med Bea först och Dinah tvåa. Alf står sist, och han har gul mössa.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: $F = 3M$ och $F + 9 = 2(M + 9)$. Det ger $M = 9$ och $F = 27$, en skillnad på 18 år.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 26,
    svar: "E",
    losning: String.raw`Tillsammans: Carolina är inte med i höjd, längd eller tresteg, så hon tävlar i stavhopp. Då är Daniella i tresteg. Men om Anton eller Bengt hoppar höjd går inte att avgöra.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 27,
    svar: "D",
    losning: String.raw`(1): $k + \frac{k}{2} + (k - 2) = 23$ ger $2{,}5k = 25$ och $k = 10$. Räcker.

(2): Gafflar och skedar är 13, så knivarna är 10. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2021vta",
    pass: 5,
    nr: 28,
    svar: "B",
    losning: String.raw`(2): Med talet 20 tre gånger av fem måste det mittersta talet vara 20. Räcker.

(1) säger bara vad ytterpunkterna är. **Svar: B.** Mer i ${NOG}.`,
  },

  /* ── Höstprovet 2020, provpass 3 och 5 ─────────────────────────────────────── */
  {
    term: "2020ht",
    pass: 3,
    nr: 1,
    svar: "C",
    losning: String.raw`Sätt in $y = 12x$: $5x + 66 = 6x$, alltså $x = 66$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 2,
    svar: "B",
    losning: String.raw`En maskin gör $\frac{150}{6} = 25$ enheter per minut. Tio maskiner gör 250 per minut, och på fyra minuter 1 000.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 4,
    svar: "D",
    losning: String.raw`$f\left(\frac{1}{3}\right) = 1 + 1 = 2 = \frac{6}{3}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 5,
    svar: "B",
    losning: String.raw`Samma nämnare: $\frac{a - b + b}{a} = \frac{a}{a} = 1$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 6,
    svar: "D",
    losning: String.raw`Kvadratens area är 36 cm². $\frac{4h}{2} = 36$ ger $h = 18$ cm.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 8,
    svar: "B",
    losning: String.raw`$\frac{x + 6x}{2} = y$ ger $7x = 2y$ och $x = \frac{2y}{7}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 9,
    svar: "C",
    losning: String.raw`Förkorta: $\frac{3x}{30} = \frac{x}{10}$ och $\frac{4x}{40} = \frac{x}{10}$. Summan är $\frac{x}{5}$, alltså 20 procent.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 10,
    svar: "A",
    losning: String.raw`Konjugatregeln två gånger: $(2^2 + 1)(2^2 - 1) = 2^4 - 1$, och $(2^4 + 1)(2^4 - 1) = 2^8 - 1$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 11,
    svar: "D",
    losning: String.raw`$x - 7 = 12$ eller $x - 7 = -12$, alltså $x = 19$ eller $x = -5$. Bara $-5$ är negativt.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 12,
    svar: "D",
    losning: String.raw`Ett upphöjt till vad som helst är 1. $1 + 1 + 1 = 3$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 13,
    svar: "A",
    losning: String.raw`$\frac{3}{7} + \frac{5}{8} = \frac{24 + 35}{56} = \frac{59}{56} > 1$.

**Svar: A.** Snabbare: $\frac{5}{8} > \frac{4}{7}$, så summan är större än $\frac{3}{7} + \frac{4}{7} = 1$. Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 14,
    svar: "B",
    losning: String.raw`Tre femmor är ett av 216 utfall. Summan 15 nås också med till exempel 6, 6, 3 och 6, 5, 4 i olika ordningar, alltså fler utfall.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 16,
    svar: "B",
    losning: String.raw`Dela med $-7$: $x + 3 = -3$, alltså $x = -6$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 17,
    svar: "A",
    losning: String.raw`Räkna allt i kryddmått: 1 tesked = 5 och 1 matsked = 15.

I: $8 + 15 = 23$. II: $10 + 10 = 20$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 18,
    svar: "D",
    losning: String.raw`Multiplicera båda med 6: jämför $3x + 3z$ med $2x + 2y + 2z$, alltså $x + z$ med $2y$.

$x = 1$, $y = 2$, $z = 3$ ger lika. $x = 1$, $y = 2$, $z = 10$ ger I störst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 19,
    svar: "A",
    losning: String.raw`$2\pi r = 25\pi$ ger $r = 12{,}5$ cm.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 20,
    svar: "B",
    losning: String.raw`$27^{\frac{1}{3}} = \sqrt[3]{27} = 3$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 22,
    svar: "D",
    losning: String.raw`$x = 8$ ger 4 mot 4. $x = 4$ ger 2 mot 1. $x = 16$ ger 8 mot 16.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: Cecilia > Alvar > Benjamin > Dessi > Elina. Cecilia är äldst.

Var för sig vet vi inget om de andra två. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: ek + alm = 50 % och ek + lönn = 70 %. Lägger man ihop blir det alla träd plus ekarna en gång till: $120 - 100 = 20$ procent ekar.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 25,
    svar: "E",
    losning: String.raw`Medianen är det fjärde talet. Ingen av uppgifterna säger något om det, bara om de tre minsta och de tre största.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 26,
    svar: "C",
    losning: String.raw`Tillsammans: Lisa har sett 25 och Thea 30, och 25 har båda sett. Minst en av dem har sett $25 + 30 - 25 = 30$ filmer. Ingen av dem har sett 10.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 27,
    svar: "D",
    losning: String.raw`(1): Viktor är tillbaka var 72:a sekund och Tomas var 90:e. Första gemensamma gången är efter 360 sekunder, då Viktor simmat 10 längder, alltså 250 m. Räcker.

(2): Viktor hinner 5 vändor medan Tomas hinner 4. De är tillbaka samtidigt första gången efter Viktors femte vända, 250 m. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2020ht",
    pass: 3,
    nr: 28,
    svar: "E",
    losning: String.raw`Tillsammans: $n$ kan vara $390$ och $m$ kan vara $780$, eller $n = 1\,170$ och $m = 780$. Båda stämmer med villkoren, men ger olika svar.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 1,
    svar: "A",
    losning: String.raw`$6x + 15 + 14 - 6x = 29$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 3,
    svar: "B",
    losning: String.raw`$r^2 = \frac{27}{\pi} \approx 8{,}6$, så $r \approx 2{,}9$ cm.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 4,
    svar: "B",
    losning: String.raw`Dubbla procenten och halva talet tar ut varandra: $2a$ % av $0{,}5x$ är $a$ % av $x$, alltså $y$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 5,
    svar: "D",
    losning: String.raw`Med fem värden är medianen ett av värdena själv. Är alla heltal är medianen alltså ett heltal.

**Svar: D.** Mot C: 1, 1, 1, 1 och 2 ger medelvärdet 1,2. Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 6,
    svar: "D",
    losning: String.raw`$x(a + b) = 1$ ger $x = \frac{1}{a + b}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 7,
    svar: "B",
    losning: String.raw`Antalet måste vara delbart med 7. $245 = 7 \cdot 35$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 8,
    svar: "C",
    losning: String.raw`Räkna exponenterna: A $= 10^0$, B $= 10^{-10}$, C $= 10^{4}$, D $= 10^{-4}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 9,
    svar: "D",
    losning: String.raw`$2x^2 = 100$ ger $x^2 = 50$ och $x = \sqrt{50}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 10,
    svar: "B",
    losning: String.raw`$\frac{3}{2} \cdot \frac{1}{5} = \frac{3}{10} = \frac{6}{20}$. $\frac{7}{20} - \frac{6}{20} = \frac{1}{20}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 11,
    svar: "D",
    losning: String.raw`$\frac{x}{4} = \frac{3}{2}$ ger $x = 6$. Punkten är $(6, 0)$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 12,
    svar: "C",
    losning: String.raw`$\frac{1}{a^2} = 16$ ger $a^2 = \frac{1}{16}$ och $a = \pm\frac{1}{4}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 13,
    svar: "A",
    losning: String.raw`Samma procentsats ger 73 av $y$ och 37 av $z$. Då måste $y$ vara störst.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 14,
    svar: "C",
    losning: String.raw`Omkretsen är summan av de tre sidorna, så omkretsen genom 3 är medelvärdet av dem.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 15,
    svar: "B",
    losning: String.raw`I: $\frac{1}{6} \cdot \frac{1}{6} = \frac{1}{36}$. II: $6 \cdot 6 = 36$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 16,
    svar: "D",
    losning: String.raw`$A = 2E + 2L$ jämfört med $3E$. Det beror på om $2L$ är större än $E$, och det vet vi inte.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 17,
    svar: "B",
    losning: String.raw`Ett tal större än 1 blir 1 bara med exponenten 0. $y + 1 = 0$ ger $y = -1$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 18,
    svar: "B",
    losning: String.raw`Överlappet är detsamma: $0{,}25 K_1 = 0{,}2 K_2$, alltså $K_1 = 0{,}8 K_2$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 19,
    svar: "B",
    losning: String.raw`Multiplicera ut. Båda innehåller $3{,}13 \cdot 3{,}15$. Kvar blir $3{,}13\pi$ mot $3{,}15\pi$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 20,
    svar: "A",
    losning: String.raw`II är $(x + y)^2 = 0$. I är summan av två positiva kvadrater.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 21,
    svar: "D",
    losning: String.raw`$f(x) = kx$. Är $k > 0$ är I störst, är $k < 0$ är II störst, och $k = 0$ ger lika.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 22,
    svar: "B",
    losning: String.raw`Summan är $4 \cdot (-1) = -4$. $-5 + 3 = -2$, så $x + y = -2$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 23,
    svar: "C",
    losning: String.raw`(2): Huvudet väger 5 kg. (1): Benen väger sju gånger huvudet.

Tillsammans: $5 + 20 + 35 = 60$ kg. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2020ht",
    pass: 5,
    nr: 26,
    svar: "A",
    losning: String.raw`(1): Röd och vit är inte överst. Blå ligger under grå, så den är inte heller överst. Grå ligger överst. Räcker.

(2) säger bara något om den nedersta. Röd och vit ligger då i mitten, men om blå eller grå ligger överst går inte att avgöra. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },

  /* ── Höstprovet 2019, provpass 1 och 4 ─────────────────────────────────────── */
  {
    term: "2019ht",
    pass: 1,
    nr: 1,
    svar: "A",
    losning: String.raw`Skriv som vanliga tal: $5\,300 - 470 = 4\,830 = 4{,}83 \cdot 10^3$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 2,
    svar: "C",
    losning: String.raw`40 procent är $\frac{2}{5}$. Bara 5 ger ett heltal: $\frac{2}{5} \cdot 5 = 2$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 4,
    svar: "A",
    losning: String.raw`$157 + 158 = 315$, som slutar på 5. De andra ger 243, 37 och 31.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 5,
    svar: "D",
    losning: String.raw`$5x - 5 = 2x + 4$ ger $3x = 9$ och $x = 3$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 7,
    svar: "B",
    losning: String.raw`Multiplicera med 2 och dela med $b$: $h = \frac{2A}{b}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 9,
    svar: "B",
    losning: String.raw`Fyra gånger så stor area betyder dubbelt så stor radie. $2 \cdot 3 = 6$ cm.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 10,
    svar: "D",
    losning: String.raw`Det finns $93 - 60 = 33$ jämna tal, och hälften av dem är minst 17. I värsta fall stryker hon alla 60 udda först. $60 + 17 = 77$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 11,
    svar: "B",
    losning: String.raw`$\sqrt{32xy^2} = \sqrt{16} \cdot \sqrt{y^2} \cdot \sqrt{2x} = 4y\sqrt{2x}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 12,
    svar: "B",
    losning: String.raw`$x + y + z = 45$ och $y + z + 14 = 51$, så $y + z = 37$ och $x = 8$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 13,
    svar: "C",
    losning: String.raw`$10^0 = 1$, så I är 5,7.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 14,
    svar: "A",
    losning: String.raw`I: $\frac{6 + 4 + 3}{12} = \frac{13}{12} = 1 + \frac{1}{12}$. Och $\frac{1}{12} > \frac{1}{13}$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 15,
    svar: "A",
    losning: String.raw`3, 4, 5 är en rätvinklig triangel, så största vinkeln är 90°. En liksidig triangel har bara 60°.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 16,
    svar: "A",
    losning: String.raw`I: $4a + 4 - 4a + 4 = 8$. II: $4a - 4 + 4 - 4a = 0$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 17,
    svar: "B",
    losning: String.raw`Volymen är $\frac{\pi r^2 h}{3}$. Jämför $r^2 h$: $9 \cdot 4 = 36$ mot $16 \cdot 3 = 48$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 18,
    svar: "A",
    losning: String.raw`$4^x$ är alltid jämnt när $x \geq 1$, så sannolikheten är 1.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 19,
    svar: "A",
    losning: String.raw`Kvadrera båda: I blir $27 + 23 + 2\sqrt{27 \cdot 23} = 50 + $ något positivt. II blir 50.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 20,
    svar: "D",
    losning: String.raw`Linje A har lutningen $\frac{1}{2}$ och skär $y$-axeln i $\frac{1}{2}$. Linje B har lutningen $-2$, men vi vet inte var den ligger, så dess skärning med $y$-axeln kan vara vad som helst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 21,
    svar: "C",
    losning: String.raw`$x = \frac{3y}{4}$, så $\frac{2x}{3} = \frac{y}{2}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 22,
    svar: "D",
    losning: String.raw`Första villkoret ger $2p + L = 5s$. Andra ger $4p + 2L = 10s$, alltså samma sak. Vi kan inte skilja på pennor och linjaler.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 1,
    nr: 23,
    svar: "C",
    losning: String.raw`(1): Vit ligger på plats 3. Paren grön och röd samt blå och svart fyller platserna 1 och 2 respektive 4 och 5, men vi vet inte hur.

(2): Svart på 5 och grön före röd. Många möjligheter.

Tillsammans: blå ligger på 4, så grön och röd ligger på 1 och 2. Grön först, alltså röd på 2. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 1,
    svar: "C",
    losning: String.raw`$8\,500\,000$ mm $= 8\,500$ m $= 8{,}5$ km.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 3,
    svar: "D",
    losning: String.raw`Om täljaren är större än nämnaren är kvoten större än 1.

**Svar: D.** A är fel eftersom $z$ alltid är positivt, och B gäller bara när $x = 1$. Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 4,
    svar: "C",
    losning: String.raw`Sture är $x + 3$ år. Summan är $x + x + 3 = 31$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 5,
    svar: "A",
    losning: String.raw`$49 = 7^2$, så $7 + \frac{x}{3} = 2$ och $x = -15$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 6,
    svar: "B",
    losning: String.raw`65 % är längre än Ida och 32 % längre än Albert. Mellan dem finns ungefär $65 - 32 = 33$ procent.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 7,
    svar: "A",
    losning: String.raw`Hjulen är $16 + 4 = 20$, varav 4 på motorcyklar. $\frac{4}{20} = \frac{1}{5}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 8,
    svar: "D",
    losning: String.raw`$x = 5$ ger $y = 15 - 5 = 10$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 9,
    svar: "D",
    losning: String.raw`Med sidorna $\sqrt{2}$ och 1 blir diagonalen $\sqrt{2 + 1} = \sqrt{3}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 10,
    svar: "C",
    losning: String.raw`Multiplicera först: $x = 10^5$. Dela sedan med de små talen: $y = 10^6$ och $z = 10^{10}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 11,
    svar: "D",
    losning: String.raw`$\frac{\frac{7}{2}}{\frac{21}{5}} = \frac{7}{2} \cdot \frac{5}{21} = \frac{5}{6}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 12,
    svar: "D",
    losning: String.raw`Två sidor är tillsammans 180 m, så den andra är $180 - x$. Arean är $x(180 - x)$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 13,
    svar: "A",
    losning: String.raw`$\frac{4}{x} = \frac{5}{2}$ ger $x = 1{,}6$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 14,
    svar: "B",
    losning: String.raw`I: 400 kr, sedan 320 kr. Rabatt 180 kr. II: 400 kr, sedan 300 kr. Rabatt 200 kr.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 16,
    svar: "A",
    losning: String.raw`$x < -1$ gör $1 - x$ större än 2 och $x - 1$ mindre än $-2$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 17,
    svar: "C",
    losning: String.raw`$\sqrt{x} = x$ med $x > 0$ ger $x = 1$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 18,
    svar: "B",
    losning: String.raw`$f(1) = 2$ och $f(-1) = 8$. I är $\frac{1}{4}$ och II är 4.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 19,
    svar: "C",
    losning: String.raw`$3 \cdot 3^3 = 3^4$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 20,
    svar: "B",
    losning: String.raw`Kalle: $\frac{60}{22} < 3$ timmar. Bosse: $\frac{54}{18} = 3$ timmar.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 21,
    svar: "B",
    losning: String.raw`I: $8x$. II: de två kortare sidorna är tillsammans längre än $5x$, så omkretsen är större än $10x$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 22,
    svar: "D",
    losning: String.raw`Medianen av två tal är deras medelvärde: $x + y = 4$ och $y + z = 18$. $y = 3$ ($x = 1$, $z = 15$) och $y = 8$ ($x = -4$, $z = 10$) fungerar båda.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: kvar är $0{,}8 \cdot 0{,}75 = 0{,}6$ av vattnet, och det är 42 liter. $\frac{42}{0{,}6} = 70$ liter.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: 20 stora, varav 10 vita. Lika många vita är små, så det finns 20 vita och 80 rosa. Sannolikheten är 0,8.

Var för sig saknas antingen antalen eller fördelningen. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 25,
    svar: "E",
    losning: String.raw`Summan är 150. Både 3, 30, 30, 30, 57 (median 30) och 3, 4, 5, 30, 108 (median 5) uppfyller allt.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 26,
    svar: "A",
    losning: String.raw`(1): Marie före Harald före Anna, och Marie inte först. Då är David först: David, Marie, Harald, Anna. Räcker.

(2): Både David, Harald, Marie, Anna och Harald, David, Anna, Marie fungerar. Räcker inte.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2019ht",
    pass: 4,
    nr: 27,
    svar: "D",
    losning: String.raw`(1): Kvoten 4 till 1 ger $\frac{4}{5}$ katter. (2): 80 % katter. Var och en räcker.

**Svar: D.** Mer i ${NOG}.`,
  },

  /* ── Vårprovet 2019, provpass 2 och 5 ─────────────────────────────────────── */
  {
    term: "2019vt",
    pass: 2,
    nr: 1,
    svar: "A",
    losning: String.raw`Udda gånger udda är udda. Summan av två udda tal är jämn, och B och D är också jämna.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 2,
    svar: "C",
    losning: String.raw`Steg 1 och 2 stämmer. I steg 3 blir det $2x = 80$, inte 40.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 3,
    svar: "D",
    losning: String.raw`15 procent av 70 är $\frac{15}{100} \cdot 70$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 5,
    svar: "A",
    losning: String.raw`$\frac{2}{\frac{1}{4}} = 8$, och $3 - 8 = -5$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 6,
    svar: "A",
    losning: String.raw`$\frac{3}{2} \cdot \frac{2}{3} + m = 0$ ger $1 + m = 0$ och $m = -1$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 7,
    svar: "C",
    losning: String.raw`Lägg ihop de två paren: $3{,}20 + 3{,}30 = 6{,}50$. Det är alla tre plus Alicia en gång till. $6{,}50 - 4{,}80 = 1{,}70$ m.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 9,
    svar: "C",
    losning: String.raw`$3x = 14 + 4y - 2z$, alltså $x = \frac{1}{3}(14 + 4y - 2z)$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 10,
    svar: "D",
    losning: String.raw`$\frac{1}{2} + \frac{1}{3} = \frac{5}{6}$. Med $x = 5$ och $y = 6$ blir $xy = 30$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 12,
    svar: "A",
    losning: String.raw`Samma exponent: $2^4 \cdot 3^4 = (2 \cdot 3)^4 = 6^4$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 13,
    svar: "D",
    losning: String.raw`Vi vet inte hur stora månadspengarna är, så vem som köper för mest kan gå åt båda hållen.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 14,
    svar: "D",
    losning: String.raw`$b = 0$ gör II till 0, och $b = 2$ gör II dubbelt så stor som I.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 15,
    svar: "C",
    losning: String.raw`$f(0) = -3$ och $f(2) = 4 - 4 - 3 = -3$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 16,
    svar: "B",
    losning: String.raw`I en parallellogram är de andra vinklarna 57° eller $180° - 57° = 123°$. Båda är mindre än 124°.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 17,
    svar: "A",
    losning: String.raw`Konjugatregeln: I är $100^2 - 1$ och II är $100^2 - 4$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 19,
    svar: "B",
    losning: String.raw`Talen är 13 till 20. Hälften av 20 är 10, och det minsta är 13.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 20,
    svar: "C",
    losning: String.raw`Multiplicera ut I: $a^3 + ab^2 + a^2 b + b^3 = a^3 + ab(a + b) + b^3$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 21,
    svar: "B",
    losning: String.raw`$x = \frac{1}{2}$. I är $\frac{1}{16}$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 22,
    svar: "C",
    losning: String.raw`$s = 1 + 2 + 3 + 4 + 5 = 15$. Primtalen är 3 och 5, så $p = 15$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 23,
    svar: "C",
    losning: String.raw`(1) ger 55 röda och 50 gröna, men inget om de blå. (2) säger att blå och gröna är lika många som röda.

Tillsammans: $55 + 55 = 110$ klossar. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: $H + H + (H - 2) = 16$ ger $H = 6$ och Sam är 4 år.

Var för sig finns flera möjligheter. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 25,
    svar: "B",
    losning: String.raw`(2): röda är tre fjärdedelar. Räcker.

(1) säger bara vad som fanns kvar, inte hur många som åts. Räcker inte.

**Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 26,
    svar: "E",
    losning: String.raw`Även tillsammans saknas Karins väg till skolan. Samma hastighet hjälper inte om vi inte vet hur långt hon har.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2019vt",
    pass: 2,
    nr: 27,
    svar: "A",
    losning: String.raw`(1): $x$ delar 64 och är större än 15, alltså 16, 32 eller 64. Bara 16 ger resten 15 för 63 och 1 för 65. Räcker.

(2) ger oändligt många möjligheter.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 1,
    svar: "B",
    losning: String.raw`$\frac{4x}{9} = \frac{8}{9} - \frac{6}{9} = \frac{2}{9}$, alltså $x = \frac{1}{2}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 2,
    svar: "D",
    losning: String.raw`Röda och vita är $1 + 4 = 5$ av 15 kulor. $\frac{5}{15} = \frac{1}{3}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 4,
    svar: "C",
    losning: String.raw`$6a^2 + 4ab - 9ab - 6b^2 = 6a^2 - 5ab - 6b^2$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 5,
    svar: "B",
    losning: String.raw`Allt i åttioettondelar: $\frac{27 - 18 + 15 - 7}{81} = \frac{17}{81}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 6,
    svar: "B",
    losning: String.raw`Medelpunkten ligger mitt emellan A och B. Från A till medelpunkten är steget $(+2, +3)$, och samma steg till ger $B = (0, 4)$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 8,
    svar: "C",
    losning: String.raw`Högerledet är $3x^2 + 6x + 12$. Ta bort $3x^2$ på båda sidor: $8x + 7 = 6x + 12$ ger $x = 2{,}5$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 10,
    svar: "D",
    losning: String.raw`$(10a + b) + (10b + a) = 11(a + b)$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 11,
    svar: "C",
    losning: String.raw`$x(x^2 + x - 2) = x(x + 2)(x - 1)$. Lösningarna är 0, 1 och $-2$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 12,
    svar: "D",
    losning: String.raw`$\sqrt{3} \cdot \sqrt{3} = 3$, så täljaren är $(\sqrt{3})^3$. Dela med $\sqrt{3}$: $(\sqrt{3})^2 = 3$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 13,
    svar: "C",
    losning: String.raw`$5 - x = 5$ ger $x = 0$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 14,
    svar: "B",
    losning: String.raw`$\sqrt{14} < 4$, så I är mindre än $4 + 6 = 10$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 15,
    svar: "B",
    losning: String.raw`I: $\sqrt{1^2 + 2^2} = \sqrt{5}$. II: $\sqrt{1^2 + 6^2} = \sqrt{37}$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 17,
    svar: "A",
    losning: String.raw`Sortera. $x$: 13, 15, 20 ger median 15. $y$: 11, 13, 15, 30 ger median 14.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 18,
    svar: "D",
    losning: String.raw`Entalssiffran växlar: $4, 16, 64, 256$ slutar på 4, 6, 4, 6.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 20,
    svar: "D",
    losning: String.raw`$y = -1$: $x = 5$ gör I störst, $x = 0$ gör II störst och $x = 1$ ger lika.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 21,
    svar: "C",
    losning: String.raw`En pump fyller $\frac{7}{14 \cdot 0{,}5} = 1$ m³ per timme. 42 pumpar fyller 42 m³ per timme, och $\frac{63}{42} = 1{,}5$ timmar.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 22,
    svar: "A",
    losning: String.raw`I är $2\sqrt{x}$ och II är $\sqrt{2} \cdot \sqrt{x}$, och $2 > \sqrt{2}$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 23,
    svar: "D",
    losning: String.raw`(1): De 42 kulorna är 28 % av slutantalet. $\frac{42}{0{,}28} = 150$. Räcker.

(2): $\frac{42}{\frac{7}{25}} = 150$. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 24,
    svar: "C",
    losning: String.raw`Summan är 57. Tillsammans: det tredje talet är $57 - 14 - 27 = 16$, så medianen är 16.

Var för sig: 14, 14, 29 och 14, 20, 23 ger olika medianer. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 25,
    svar: "C",
    losning: String.raw`(1): 4 trasiga röda, men inget om de blå.

Tillsammans: efter att en röd plockats bort finns 3 trasiga röda, alltså 9 trasiga blå. $4 + 9 = 13$.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 26,
    svar: "E",
    losning: String.raw`Tillsammans vet vi att både Frida och Johan är yngre än Anna och David. Vem av Frida och Johan som är yngst framgår inte.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2019vt",
    pass: 5,
    nr: 27,
    svar: "B",
    losning: String.raw`(2): Den tredje färgen har 5 kulor. I värsta fall tar han alla 7 röda och 5 av den tredje färgen först, sedan en till: 13. Räcker.

(1): 5 svarta, men de andra 10 kan delas 5 och 5 eller 9 och 1, vilket ger olika svar.

**Svar: B.** Mer i ${NOG}.`,
  },

  /* ── Höstprovet 2018, provpass 2 och 4 ─────────────────────────────────────── */
  {
    term: "2018ht",
    pass: 2,
    nr: 1,
    svar: "C",
    losning: String.raw`Summan måste stå inom parentes innan den multipliceras: $14 \cdot (46 + 35)$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 2,
    svar: "B",
    losning: String.raw`0,2 % är 0,002. $0{,}002 \cdot 50 = 0{,}1$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 4,
    svar: "C",
    losning: String.raw`Multiplicera ut: $xy + x = xy + y$, alltså $x = y$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 5,
    svar: "D",
    losning: String.raw`$x^2$ växer från $0^2 = 0$ till $3^2 = 9$ på intervallet.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 7,
    svar: "C",
    losning: String.raw`$\frac{16}{9}x = \frac{4}{3}$ ger $x = \frac{4}{3} \cdot \frac{9}{16} = \frac{3}{4}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 9,
    svar: "A",
    losning: String.raw`Av två på varandra följande heltal är ett jämnt och ett udda. Summan är alltid udda.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 10,
    svar: "B",
    losning: String.raw`Räkna i dm: $2 \cdot 0{,}5 \cdot 30 = 30$ dm³.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 11,
    svar: "A",
    losning: String.raw`Dra bort $2x$ och lägg till 8: $x < 12$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 12,
    svar: "D",
    losning: String.raw`$\frac{\sqrt{72}}{\sqrt{8}} = \sqrt{9} = 3$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 13,
    svar: "A",
    losning: String.raw`$x^5 = x \cdot x^4$, och $x > 1$ gör den större.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 15,
    svar: "A",
    losning: String.raw`Allt i tjugoåttondelar: $\frac{1 + 2 + 4 + 7 + 14}{28} = 1$, som är större än $\frac{55}{56}$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 16,
    svar: "B",
    losning: String.raw`$x - 1 = 6$ ger $x = 7$. $y - x = 3$ ger $y = 10$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 18,
    svar: "B",
    losning: String.raw`Medianen av tre tal är det mittersta. Alltså $y = 7$ och $z = 13$, och medianen av dem är 10.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 19,
    svar: "A",
    losning: String.raw`I är $\frac{\sqrt{5}}{3}$, och $\sqrt{5} > 2$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 20,
    svar: "C",
    losning: String.raw`Dubbla procenten och halva talet: $42 \cdot 1\,241 = 21 \cdot 2\,482$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 21,
    svar: "B",
    losning: String.raw`$f(-a) - f(a) = -4a - 4a = -8a$, som är negativt.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 22,
    svar: "A",
    losning: String.raw`I: $11 + F$. II: $F + 8$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 23,
    svar: "B",
    losning: String.raw`(2): Den bruna är 6 cm, skillnaden 9 cm. Räcker.

(1) ger bara summan. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 24,
    svar: "B",
    losning: String.raw`(2): $3x + 78 = 39$ ger $x = -13$. Räcker.

(1) har två okända. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 25,
    svar: "D",
    losning: String.raw`(1): Styckpriset är 59,90 kr, och 16 stycken kostar $16 \cdot 59{,}90 \cdot 0{,}92$. Räcker.

(2): 8 % av tio stycken är 47,92 kr, så tio kostar 599 kr ordinarie. Samma styckpris. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 26,
    svar: "A",
    losning: String.raw`(1): Hingsten står i en ände bredvid stoet, så stoet är brunt och fölet vitt. Räcker.

(2): Stoet kan vara svart eller brunt, och fölets färg går inte att avgöra.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 27,
    svar: "A",
    losning: String.raw`(1): 20 procent vinstlotter. Räcker.

(2) säger inget om andelen. **Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2018ht",
    pass: 2,
    nr: 28,
    svar: "E",
    losning: String.raw`Vi vet inte hur många som har både pakethållare och fotbroms, så summan går inte att räkna ut.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 1,
    svar: "B",
    losning: String.raw`Lägg ihop exponenterna: $2 + 1 + 4 = 7$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 3,
    svar: "A",
    losning: String.raw`$b + c$ är större än $a$, så kvoten är större än 1. De andra har mindre täljare än nämnare.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 5,
    svar: "A",
    losning: String.raw`$\frac{4}{9} \cdot \frac{3}{8} = \frac{12}{72} = \frac{1}{6}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 6,
    svar: "B",
    losning: String.raw`Summan är $6 \cdot 11 = 66$. De kända talen ger 60, så $x + y = 6$ och medelvärdet 3.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 7,
    svar: "C",
    losning: String.raw`Förkorta med 20: $120:140 = 6:7$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 8,
    svar: "C",
    losning: String.raw`$x - y - x - y = -2y$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 9,
    svar: "B",
    losning: String.raw`Talen är 31, 32 och 33. $31 \cdot 33 = 32^2 - 1 = 1\,023$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 10,
    svar: "D",
    losning: String.raw`$3(a + 1) + m - (3a + m) = 3$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 11,
    svar: "D",
    losning: String.raw`Täljaren: $12 \cdot 10^{15} - 4 \cdot 10^{15} = 8 \cdot 10^{15}$. Dela: $4 \cdot 10^2$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 13,
    svar: "B",
    losning: String.raw`$12\,167 = 23^3$, så $7x = 3$. 13 000 är större, så $7y > 3$ och $y > x$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 14,
    svar: "D",
    losning: String.raw`Talen kan vara $1, \ldots$ och $-1, \ldots$ som tar ut varandra, eller ha större positiva tal. Medelvärdet kan bli vad som helst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 15,
    svar: "A",
    losning: String.raw`I: $\pi$ cm. II: 3 cm.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 16,
    svar: "B",
    losning: String.raw`$y = x + 1$, så II är $2x + 1$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 17,
    svar: "C",
    losning: String.raw`$0{,}00541$ km $= 5{,}41$ m $= 5\,410$ mm.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 18,
    svar: "D",
    losning: String.raw`$3x = 20y$. För att $x$ ska bli ett heltal måste $y$ vara delbart med 3. $y = 3$ ger $x = 20$ och $y = 6$ ger $x = 40$.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 19,
    svar: "A",
    losning: String.raw`Linjen lutar nedåt (lutning $-3$), så $y$ minskar när $x$ ökar.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 21,
    svar: "C",
    losning: String.raw`I: $\frac{8 + 1}{24} = \frac{3}{8}$. II: $\frac{2 + 1}{8} = \frac{3}{8}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 22,
    svar: "B",
    losning: String.raw`I: $\frac{160}{15} \approx 10{,}7$ minuter. II: $\frac{133{,}3}{10} \approx 13{,}3$ minuter.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 23,
    svar: "E",
    losning: String.raw`Tillsammans finns ändå tre möjligheter, till exempel gem i den vita asken (häftstift blå, nålar röda) eller gem i den röda asken (häftstift blå, nålar vita).

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 24,
    svar: "C",
    losning: String.raw`(2): 250 sjömän. (1): 7 av dem sjösjuka.

Tillsammans: $\frac{7}{250}$. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 25,
    svar: "A",
    losning: String.raw`(1): $x = \pm 3$, och $x < 0$ ger $x = -3$. Räcker.

(2) innehåller den okända $b$. **Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 26,
    svar: "B",
    losning: String.raw`(2): Av talen 567, 576, 657, 675, 756 och 765 är bara 765 större än 758. Räcker.

(1): 756 och 765 är kvar. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 27,
    svar: "E",
    losning: String.raw`Utan att veta hur många som är röda och blå kan vi inte väga ihop andelarna.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2018ht",
    pass: 4,
    nr: 28,
    svar: "D",
    losning: String.raw`(1): En likbent rätvinklig triangel har vinklarna 45°, 45° och 90°. Räcker.

(2): 90° och 45° ger att den tredje också är 45°. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },

  /* ── Vårprovet 2018, provpass 1 och 4 ─────────────────────────────────────── */
  {
    term: "2018vt",
    pass: 1,
    nr: 1,
    svar: "D",
    losning: String.raw`Förkorta del för del: $\frac{12}{4} = 3$ och $\frac{b^3}{b^2} = b$. Kvar blir $\frac{3a^2 b}{c}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 2,
    svar: "B",
    losning: String.raw`Som decimaltal: $0{,}4 < 0{,}5 < 0{,}75$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 3,
    svar: "C",
    losning: String.raw`$g(x) = x^4$ och $h(x) = x^2 \cdot x^4 = x^6$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 4,
    svar: "D",
    losning: String.raw`$\pi \approx 3{,}1416$ och $\frac{22}{7} \approx 3{,}1429$. De andra är 4, 3 och 3,5.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 5,
    svar: "D",
    losning: String.raw`Gemensam nämnare 30: $\frac{6x - 10x - 15x}{30} = -\frac{19x}{30}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 6,
    svar: "A",
    losning: String.raw`$-1 + 4 = 3$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 7,
    svar: "C",
    losning: String.raw`Fyra delar plus en del, så antalet måste vara delbart med 5. Bara 245 är det.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 9,
    svar: "C",
    losning: String.raw`$9x - 13 = 2$ ger $9x = 15$ och $x = \frac{5}{3}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 10,
    svar: "A",
    losning: String.raw`På varandra följande heltal ligger symmetriskt kring mitten, så medelvärdet är lika med medianen.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 12,
    svar: "B",
    losning: String.raw`Skriv $a = b - 1$ och $c = b + 1$: $3(b - 1)^2 + (b + 1)^2 = 4b^2 - 4b + 4 = 4(b^2 - b + 1)$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 13,
    svar: "B",
    losning: String.raw`Sidan är 15 cm. AD är en diagonal i femhörningen och är längre än sidan.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 14,
    svar: "B",
    losning: String.raw`I: $\frac{49}{81} \approx 0{,}605$. II: $0{,}625$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 15,
    svar: "B",
    losning: String.raw`$f(0) = 20$ och $f(-1) = 25$. I är 0,8 och II är 1,25.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 16,
    svar: "A",
    losning: String.raw`Multiplicera ut: $y - xy$ mot $x - xy$. Eftersom $y > x$ är I störst.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 17,
    svar: "C",
    losning: String.raw`$a^b = 16$ ger $a = 2, b = 4$ eller $a = 4, b = 2$. I båda fallen är $b^a = 16$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 18,
    svar: "A",
    losning: String.raw`$0 - (-3) = 3$ är positivt, $0 - 3 = -3$ är negativt.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 20,
    svar: "B",
    losning: String.raw`$2x = 12y$ ger $x = 6y$, så I är 0.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 21,
    svar: "A",
    losning: String.raw`Om $n = m + 1$ skiljer $m - 1$ och $n + 1$ sig med 3. Alltså är $n = m - 1$, och då blir $m - 1$ och $n + 1$ lika med $n$ och $m$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 22,
    svar: "D",
    losning: String.raw`Jämförelsen blir $x$ mot $z$. $x$ är högst 4 och $z$ minst 4, så det kan bli lika eller II störst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 23,
    svar: "E",
    losning: String.raw`Tillsammans finns två lösningar. Hampus naturkunskap ger Rickard engelska, Moa fysik och Lena samhällskunskap. Lena naturkunskap ger Moa samhällskunskap, Rickard fysik och Hampus engelska.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 24,
    svar: "B",
    losning: String.raw`(2): Kvar är $0{,}5 \cdot 0{,}8 = 0{,}4$ av tyget, alltså 8 m. Hela rullen är 20 m. Räcker.

(1) ger bara andelar. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 25,
    svar: "C",
    losning: String.raw`Tillsammans: de närmar sig 2,5 km på en tiondels timme, alltså 25 km/h tillsammans. Helena cyklar $25 - 15 = 10$ km/h.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 26,
    svar: "C",
    losning: String.raw`260 svarade morgontidningen. Tillsammans: 80 män svarade kvällstidningen och 130 män morgontidningen. $80 + 130 = 210$.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 27,
    svar: "A",
    losning: String.raw`(1): Antalet plus 4 är delbart med 8, och lägger man till 8 till blir det fortfarande delbart. Räcker.

(2) säger inget om antalet plus 12. **Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2018vt",
    pass: 1,
    nr: 28,
    svar: "D",
    losning: String.raw`(1): $a = b$ ger $k = 1$. (2): $a^2 = b^2$ och positiva tal ger $a = b$. Båda räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 1,
    svar: "B",
    losning: String.raw`$2{,}5 - 1{,}6 = 0{,}9$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 2,
    svar: "B",
    losning: String.raw`Summan är $5 \cdot 16 = 80$. De kända talen ger 62, så $a = 18$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 3,
    svar: "A",
    losning: String.raw`$(2\sqrt{7})^2 = 4 \cdot 7 = 28$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 5,
    svar: "D",
    losning: String.raw`$-6\left(\frac{r}{3} - s\right) = -2r + 6s = 2(-r + 3s)$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 6,
    svar: "C",
    losning: String.raw`$y = 0$ ger $x_1 = -2$, och $x = 0$ ger $y_1 = 10$. Summan är 8.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 7,
    svar: "C",
    losning: String.raw`$\frac{3}{2} \cdot \frac{x}{6} = \frac{x}{4} = 2$ ger $x = 8$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 9,
    svar: "B",
    losning: String.raw`$n$ personer ger $\frac{n(n - 1)}{2}$ handskakningar. $\frac{6 \cdot 5}{2} = 15$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 11,
    svar: "D",
    losning: String.raw`$\frac{k + p}{k} = 1 + \frac{p}{k}$, så $r = \frac{p}{k}$ och $k = \frac{p}{r}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 12,
    svar: "A",
    losning: String.raw`$5^{-2} = \frac{1}{25}$ och $(-2)^{-1} = -\frac{1}{2}$. $\frac{1}{25} + \frac{1}{2} = \frac{27}{50}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 13,
    svar: "D",
    losning: String.raw`Summan är 180°, men $w$ kan vara både större och mindre än 90°.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 14,
    svar: "A",
    losning: String.raw`$36 < 3x < 69$ ger $12 < x < 23$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 15,
    svar: "A",
    losning: String.raw`Byxorna: $0{,}25 \cdot 299 \approx 75$ kr. Tröjan: $0{,}3 \cdot 199 \approx 60$ kr.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 16,
    svar: "B",
    losning: String.raw`$x$ är negativt. Udda exponent ger negativt, jämn ger positivt.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 17,
    svar: "B",
    losning: String.raw`Blå är $1 - \frac{4}{10} - \frac{3}{10} = \frac{3}{10}$, röd $\frac{4}{10}$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 19,
    svar: "A",
    losning: String.raw`I: $\pi x^2$. II: $\frac{3x \cdot 2x}{2} = 3x^2$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 20,
    svar: "C",
    losning: String.raw`I: $\frac{10 - 9}{6} = \frac{1}{6}$. II: $\frac{6 + 1}{42} = \frac{1}{6}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 21,
    svar: "B",
    losning: String.raw`$\frac{7}{8} = 87{,}5$ %.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 22,
    svar: "C",
    losning: String.raw`$\sqrt{5} \cdot \sqrt{9} = \sqrt{45} = 45^{0{,}5}$, så $x = 0{,}5$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 23,
    svar: "B",
    losning: String.raw`(2): Ett varv är 800 m. Den snabbare tar in $\frac{800}{9}$ m per minut, och ett helt varv tar då 9 minuter. Räcker.

(1) säger inget om den snabbare. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 24,
    svar: "C",
    losning: String.raw`(1): 24 kopparspikar och 16 dyckertar. (2): De 40 är hälften.

Tillsammans: 80 spikar. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 25,
    svar: "D",
    losning: String.raw`(1): $y = 540$. (2): $y = \frac{27}{0{,}05} = 540$. Båda räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 26,
    svar: "E",
    losning: String.raw`Vi vet inte hur de 14 långärmade fördelas mellan färgglada och svarta, så totalen går inte att räkna ut.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 27,
    svar: "B",
    losning: String.raw`(2): Röd är inte i mitten och har blå under sig, så röd ligger överst. Räcker.

(1): Både blå, grön, röd och röd, blå, grön (uppifrån) fungerar. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2018vt",
    pass: 4,
    nr: 28,
    svar: "C",
    losning: String.raw`(1) ger 42, 72 eller 78. (2) ger 28, 32, 56 eller 72.

Tillsammans: 72. **Svar: C.** Mer i ${NOG}.`,
  },

  /* ── Höstprovet 2017, provpass 3 och 5 ─────────────────────────────────────── */
  {
    term: "2017ht",
    pass: 3,
    nr: 1,
    svar: "C",
    losning: String.raw`$y$ måste vara större än $x$ och högst 9, så $x$ kan vara 1 till 8.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 2,
    svar: "A",
    losning: String.raw`$\frac{1}{2} = \frac{3}{6}$. Medelvärdet är $\frac{1}{2} \cdot \frac{4}{6} = \frac{1}{3}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 3,
    svar: "C",
    losning: String.raw`På 18 minuter gör Kalle 50 och Jakob 25 drinkar, alltså 75 tillsammans.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 4,
    svar: "B",
    losning: String.raw`Sidorna är 5 cm och 8 cm. $\frac{5 \cdot 8}{2} = 20$ cm².

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 5,
    svar: "B",
    losning: String.raw`Multiplicera exponenterna: $3 \cdot 2 = 6$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 6,
    svar: "D",
    losning: String.raw`$84 = 12x$ ger $x = 7$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 7,
    svar: "A",
    losning: String.raw`1 m³ är 1 000 liter. $470 \cdot 1\,000 = 470\,000 = 4{,}7 \cdot 10^5$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 8,
    svar: "D",
    losning: String.raw`Linjer som aldrig skär varandra är parallella och har samma lutning, $k = 2$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 9,
    svar: "A",
    losning: String.raw`$\frac{\frac{2}{3}}{\frac{10}{3}} = \frac{2}{10} = \frac{1}{5}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 10,
    svar: "B",
    losning: String.raw`Subtrahera kvadreringsreglerna: $(a + b)^2 - (a - b)^2 = 4ab = 25 - 121 = -96$, alltså $ab = -24$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 11,
    svar: "D",
    losning: String.raw`Konjugatregeln: $\frac{x^2}{16} - \frac{1}{4} = \frac{1}{4}\left(\frac{x^2}{4} - 1\right)$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 13,
    svar: "B",
    losning: String.raw`I: $24 - 15 = 9$. II: $4 \cdot 1 \cdot 3 = 12$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 14,
    svar: "B",
    losning: String.raw`$\frac{4}{20} = \frac{1}{5}$, som är mindre än $\frac{1}{4}$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 15,
    svar: "B",
    losning: String.raw`$\pi \cdot 3^2 \cdot 3 = 27\pi$ cm³.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 16,
    svar: "C",
    losning: String.raw`$x + 3$ är positivt, så roten ur kvadraten är talet självt.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 17,
    svar: "A",
    losning: String.raw`I: $2\sqrt{2} + 3\sqrt{3} \approx 2{,}83 + 5{,}20 = 8{,}03$. II: $5\sqrt{2} \approx 7{,}07$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 18,
    svar: "D",
    losning: String.raw`Villkoret ger bara $x - y < 93$. $x$ kan vara både större och mindre än $y$.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 20,
    svar: "C",
    losning: String.raw`$J = R + 5$ och $J - 3 = 2(R - 3)$. Det ger $R + 2 = 2R - 6$ och $R = 8$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 21,
    svar: "D",
    losning: String.raw`$x = y = 1$ ger lika, $x = 1$ och $y = -1$ ger I störst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 22,
    svar: "A",
    losning: String.raw`$x = -\frac{2}{3}$ och $z = -\frac{3}{2}$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 23,
    svar: "D",
    losning: String.raw`Hushållsosten kostar $\frac{19{,}52}{0{,}488} = 40$ kr/kg.

(1): Prästosten kostar 89 kr/kg. Räcker. (2): Samma sak direkt. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: intervallen är 3, 0,5 och 2,5 timmar, alltså 6, 1 och 5 halvtimmar. Minsta gemensamma multipel är 30 halvtimmar, 15 timmar. Nästa gång 09.00.

Var för sig saknas ett intervall. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 25,
    svar: "B",
    losning: String.raw`(2): Höjden 6 cm och basen 8 cm. Efter ökningen 11 och 13, kvoten $\frac{11}{13}$. Räcker.

(1) gäller alltid och säger inget nytt. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 26,
    svar: "C",
    losning: String.raw`(1) ger 15, 24, 33, 42, 51 och 60. Tillsammans: bara 42 är delbart med 7.

(2) ensam ger många tal. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 27,
    svar: "B",
    losning: String.raw`(2): B och E väger var för sig mer än A, D och F tillsammans, och de väger i sin tur mer än C. B och E är tyngst. Räcker.

(1) säger inget om B, C och E. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2017ht",
    pass: 3,
    nr: 28,
    svar: "E",
    losning: String.raw`Möjliga tripplar är 1, 2, 3 och 1, 2, 4 och 1, 3, 4 och 2, 3, 4.

Tillsammans uppfyller både 1, 2, 3 och 2, 3, 4 villkoren, med olika medelvärden.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 1,
    svar: "A",
    losning: String.raw`$\frac{48}{0{,}75} = 64$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 3,
    svar: "C",
    losning: String.raw`$3 \cdot 4 - 3 + 4 = 13$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 4,
    svar: "B",
    losning: String.raw`Tjugondelar: $\frac{15 + 10 + 24}{20} = \frac{49}{20}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 5,
    svar: "A",
    losning: String.raw`Triangelolikheten: en sida är kortare än summan och längre än skillnaden av de andra två.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 6,
    svar: "A",
    losning: String.raw`Summan av tre på varandra följande heltal är tre gånger det mittersta, alltså delbar med 3. $45 = 14 + 15 + 16$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 7,
    svar: "C",
    losning: String.raw`$350(1 + 2 + 4 + 8) = 350 \cdot 15 = 5\,250$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 8,
    svar: "C",
    losning: String.raw`$\frac{x_1}{y_1} = \frac{2x_2}{2y_2} = \frac{x_2}{y_2}$, så kvoten är 1.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 9,
    svar: "B",
    losning: String.raw`50 i basen åtta är $5 \cdot 8 + 0 = 40$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 10,
    svar: "B",
    losning: String.raw`$\frac{1}{9} = 3^{-2}$. $-3x + 4 = -2$ ger $x = 2$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 11,
    svar: "D",
    losning: String.raw`$g(2) = 2$ och $h(2) = -3$. $2 - (-3) = 5$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 12,
    svar: "C",
    losning: String.raw`Summan är 65. Gör de andra så små som möjligt: 1, 2, 15 och 16. Kvar blir $65 - 34 = 31$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 13,
    svar: "C",
    losning: String.raw`$x - y = y - x$ ger $2x = 2y$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 14,
    svar: "B",
    losning: String.raw`Medelvärdet är $\frac{38}{10} = 3{,}8$. Medianen är $\frac{4 + 4}{2} = 4$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 15,
    svar: "C",
    losning: String.raw`II: $3 \cdot 2\pi \cdot \frac{R}{3} = 2\pi R$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 16,
    svar: "D",
    losning: String.raw`$f(1) - f(0) = k$, och $k$ kan ha vilket tecken som helst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 17,
    svar: "A",
    losning: String.raw`I: $\frac{15}{16} = 1 - \frac{1}{16}$. II: $1 - \frac{1}{15}$. Mindre bit fattas i I.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 18,
    svar: "D",
    losning: String.raw`$x = y = 1$ ger lika, $x = 1$ och $y = 2$ gör II störst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 19,
    svar: "B",
    losning: String.raw`Röda är minst 21, gröna 17. Blå är högst $60 - 21 - 17 = 22$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 20,
    svar: "B",
    losning: String.raw`$y = -x$, så I blir 0 och II blir $2x^2 > 0$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 21,
    svar: "A",
    losning: String.raw`$4{,}25^2 \approx 18{,}06 > 17$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: AB = $24 - 7 = 17$ och CD = $20 - 7 = 13$. AD = $17 + 7 + 13 = 37$.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 24,
    svar: "E",
    losning: String.raw`Vi vet aldrig hur mycket som fanns i hinken från början, så det som gick åt går inte att räkna ut.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 25,
    svar: "A",
    losning: String.raw`(1): 57 % av 800 är små, 456 gem. Räcker.

(2) säger inget om fördelningen mellan kartongerna. **Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 26,
    svar: "C",
    losning: String.raw`Tillsammans: Bea kör $\frac{3}{4}$ av Annas hastighet och behöver en tredjedel mer tid. Den extra tredjedelen är 30 minuter, så Anna tog 1,5 timmar. $\frac{30}{1{,}5} = 20$ km/h.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 27,
    svar: "D",
    losning: String.raw`(1): $x - y - z$ och $x + y + z$ skiljer sig med $2y + 2z$, så de har samma paritet. Summan är udda. Räcker.

(2): Alla tre är udda, och summan av tre udda tal är udda. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2017ht",
    pass: 5,
    nr: 28,
    svar: "E",
    losning: String.raw`Tillsammans: alla fyra summerar till 22, så $b + c = a + d = 11$. Både $a = 2, b = 4, c = 7, d = 9$ och $a = 3, b = 5, c = 6, d = 8$ fungerar.

**Svar: E.** Mer i ${NOG}.`,
  },

  /* ── Vårprovet 2017, provpass 1 och 4 ─────────────────────────────────────── */
  {
    term: "2017vt",
    pass: 1,
    nr: 1,
    svar: "C",
    losning: String.raw`$\frac{5{,}1}{1{,}7} = 3$ och $10^{8 - 4} = 10^4$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 2,
    svar: "A",
    losning: String.raw`Totalt $13{,}5 + 46{,}5 + 120 = 180$ kcal. $\frac{13{,}5}{180} = 0{,}075$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 4,
    svar: "D",
    losning: String.raw`$8x = 36$ ger $x = 4{,}5$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 5,
    svar: "B",
    losning: String.raw`Konjugatregeln: $(a + 1)(a - 1) = a^2 - 1$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 7,
    svar: "B",
    losning: String.raw`$2x - 4y - x^2 - 3xy + 3xy - 3y^2$. De två $xy$-termerna tar ut varandra: $-x^2 - 3y^2 + 2x - 4y$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 8,
    svar: "C",
    losning: String.raw`$0{,}5^2 = 0{,}25$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 9,
    svar: "A",
    losning: String.raw`Både lutningen $k$ och skärningen $m$ multipliceras med ett tal mellan 0 och 1. Båda krymper.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 10,
    svar: "B",
    losning: String.raw`Primtalen är 29 och 31. Medelvärdet är 30.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 11,
    svar: "B",
    losning: String.raw`$\frac{5}{6} \cdot \frac{5}{6} = \frac{25}{36}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 12,
    svar: "D",
    losning: String.raw`Vänsterledet är $x^{m + n}$ och högerledet $x^{mn}$. $2 + 2 = 2 \cdot 2$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 13,
    svar: "C",
    losning: String.raw`Mia: $\frac{x}{\frac{y}{2}} = \frac{2x}{y}$. Pia: $\frac{2x}{y}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 14,
    svar: "A",
    losning: String.raw`II blir $x^2 + 2x + 1 + x^2 - 2x + 1 = 2x^2 + 2$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 15,
    svar: "D",
    losning: String.raw`Arean är $\frac{4x \cdot 3x}{2} = 6x^2$, men $x$ är okänt.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 16,
    svar: "B",
    losning: String.raw`Kvadrera: I blir $49 \cdot 35 = 1\,715$ och II $36 \cdot 50 = 1\,800$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 17,
    svar: "A",
    losning: String.raw`Talen är 1 och 10 (medel 5,5) eller 2 och 5 (medel 3,5). Båda är större än $3{,}33$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 18,
    svar: "A",
    losning: String.raw`$2x - 3 = 2y$ ger $x - y = 1{,}5$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 19,
    svar: "B",
    losning: String.raw`$47^2 = 50^2 - 2 \cdot 50 \cdot 3 + 9 = 2\,209$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 20,
    svar: "C",
    losning: String.raw`$f(10) = 1\,000 - 1\,000 = 0$ och $f(0) = 0$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 21,
    svar: "B",
    losning: String.raw`$h = 3d$ och omkretsen är $\pi d$, som är större.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 22,
    svar: "C",
    losning: String.raw`$1 + x = -0{,}1$ ger $x = -1{,}1$. $y + 1 = -0{,}1$ ger $y = -1{,}1$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 23,
    svar: "D",
    losning: String.raw`(1): 3 minuter är en fjärdedel av tiden, alltså 12 minuter. (2): 3 minuter är 25 procent, samma sak. Båda räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: den tredje dyraste kostar 135 kr, så de två dyraste kostar $490 - 135 = 355$ kr.

Var för sig saknas antingen summan eller mittpriset. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 25,
    svar: "D",
    losning: String.raw`(1): 11 champinjoner, alltså 19 kantareller. (2): 19 kantareller direkt. Båda räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 26,
    svar: "A",
    losning: String.raw`(1): 45°, 45° och 90°. Räcker.

(2): Till exempel 45°, 60° och 75° fungerar också. **Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 27,
    svar: "A",
    losning: String.raw`(1): Av 36 plagg är 16 tröjor, alltså 20 skjortor. Räcker.

(2) säger inget om Jonas skjortor. **Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2017vt",
    pass: 1,
    nr: 28,
    svar: "E",
    losning: String.raw`(1) ger 934 och 394. (2) ger 394, 934 och 349.

Tillsammans finns både 394 och 934 kvar. **Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 1,
    svar: "B",
    losning: String.raw`$\frac{x}{3} + \frac{5x}{3} = 2x = 8$ ger $x = 4$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 3,
    svar: "C",
    losning: String.raw`Summan är 75. De kända talen ger 58, så $x = 17$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 4,
    svar: "B",
    losning: String.raw`Största värdet är $12 + 3 = 15$, som inte är primtal. 13 går med $x = 6$ och $y = 1$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 5,
    svar: "C",
    losning: String.raw`B och C har samma $y$, så BC är en vågrät bas med längden 5. Höjden till A är $2 - (-4) = 6$. $\frac{5 \cdot 6}{2} = 15$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 6,
    svar: "C",
    losning: String.raw`$(3a)^2 = 9a^2 = 63$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 7,
    svar: "B",
    losning: String.raw`A och B tar ut varandra: $7\,040 - 4\,080 = 2\,960$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 8,
    svar: "A",
    losning: String.raw`$\frac{\sqrt{3}}{3} = \frac{\sqrt{3}}{\sqrt{3} \cdot \sqrt{3}} = \frac{1}{\sqrt{3}}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 9,
    svar: "D",
    losning: String.raw`Multiplicera $zw > xy$ med $-1$: $-zw < -xy$. Det är D.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 10,
    svar: "B",
    losning: String.raw`$f(1) = 10$ och $f(0) = 2$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 11,
    svar: "D",
    losning: String.raw`$\frac{1}{2(x + 1)} - \frac{1}{3(x + 1)} = \frac{3 - 2}{6(x + 1)} = \frac{1}{6x + 6}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 12,
    svar: "B",
    losning: String.raw`Kvadratens diagonal är 10 cm, så arean är $\frac{10^2}{2} = 50$ cm². Cirkeln har $25\pi$. $\frac{50}{25\pi} = \frac{2}{\pi}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 13,
    svar: "A",
    losning: String.raw`II: $\frac{390}{195} = 2$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 15,
    svar: "B",
    losning: String.raw`6 är delbart med 3 (en av fem). 39 är delbart med 3 och 13 (två av fem).

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 16,
    svar: "C",
    losning: String.raw`I: $4^2 = 16$. II: $(2x)^2 = 4x^2 = 16$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 17,
    svar: "C",
    losning: String.raw`I: $\frac{6}{15}$. II: $\frac{5 + 1}{15} = \frac{6}{15}$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 18,
    svar: "B",
    losning: String.raw`Funktionen har negativ lutning, så större $x$ ger mindre värde.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 20,
    svar: "D",
    losning: String.raw`26 bläckpennor och 19 trasiga. Minst $26 + 19 - 39 = 6$ trasiga bläckpennor, men det kan vara fler.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 21,
    svar: "D",
    losning: String.raw`Ett av talen är 0. Tripplarna $-2, -1, 0$ och $-1, 0, 1$ och $0, 1, 2$ ger $z = 0$, 1 eller 2.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 22,
    svar: "A",
    losning: String.raw`Att multiplicera med $z$ behåller olikhetens riktning bara om $z > 0$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: $3(h + k) = 63$ ger $h + k = 21$. Med $h = \frac{k}{2}$ blir $k = 14$.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 24,
    svar: "E",
    losning: String.raw`Båda påståendena säger samma sak, och ingen tid anges för någon av dem.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 25,
    svar: "C",
    losning: String.raw`Tillsammans: $3k, 5k, 7k$ med $7k - 3k = 28$ ger $k = 7$. Summan är $15k = 105$.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 26,
    svar: "C",
    losning: String.raw`Tillsammans: talgoxe och bofink sitter ihop. På plats 1 och 2 tvingas domherre och gråsparv bredvid varandra, och på 3 och 4 hamnar bofinken längst till höger. Kvar blir domherre, talgoxe, bofink, gråsparv.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 27,
    svar: "B",
    losning: String.raw`(2): 12 flickor och 12 godkända, kvoten är 1. Räcker.

(1) ger inga antal godkända. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2017vt",
    pass: 4,
    nr: 28,
    svar: "D",
    losning: String.raw`(1): Ett udda antal negativa tal ger negativ produkt. Räcker.

(2): Att stryka två tal med positiv produkt ändrar inte tecknet. Räcker.

**Svar: D.** Mer i ${NOG}.`,
  },

  /* ── Höstprovet 2016, provpass 3 och 5 ─────────────────────────────────────── */
  {
    term: "2016ht",
    pass: 3,
    nr: 1,
    svar: "A",
    losning: String.raw`Bryt ut $xy$: $xy(3y + 2x)$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 2,
    svar: "C",
    losning: String.raw`Vinklarna i en fyrhörning är 360° tillsammans. $360 - 210 = 150$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 3,
    svar: "A",
    losning: String.raw`För $x = 0$ ligger linjerna på $y = 3$ och $y = -3$. Origo ligger mellan.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 4,
    svar: "D",
    losning: String.raw`Bryt ut 11: $11(x - y) = 42$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 5,
    svar: "C",
    losning: String.raw`A hinner en tredjedel på två timmar. B målar en fjärdedel per timme, och två tredjedelar tar $\frac{2}{3} \cdot 4 = \frac{8}{3}$ timmar, 160 minuter.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 6,
    svar: "B",
    losning: String.raw`$\frac{5}{10} + \frac{1}{10} = \frac{6}{10} = \frac{3}{5}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 7,
    svar: "A",
    losning: String.raw`$5x = \frac{1}{4} - 4 = -\frac{15}{4}$ ger $x = -\frac{3}{4}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 8,
    svar: "D",
    losning: String.raw`Från början är summan 180 år, efteråt $8 \cdot 10 = 80$. De två som gick är 100 år tillsammans, alltså är den andra 20.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 9,
    svar: "B",
    losning: String.raw`$6 - 25 - 1 = -20$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 11,
    svar: "C",
    losning: String.raw`$4 \cdot 2 = 8$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 13,
    svar: "A",
    losning: String.raw`$-7x - 7 = -8x$ ger $x = 7$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 14,
    svar: "A",
    losning: String.raw`II: $\frac{81}{9} \cdot 4 = 36$. I är 144.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 16,
    svar: "D",
    losning: String.raw`$x + y + z = w$ och $y + z + w = x$. Lägg ihop: $y + z = 0$. Det kan vara $0$ och $0$ eller $1$ och $-1$.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 17,
    svar: "C",
    losning: String.raw`I: $72 - 28 = 44$. II: $11 \cdot 4 = 44$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 18,
    svar: "B",
    losning: String.raw`Parentesen är mindre än 2, så I är mindre än 4.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 19,
    svar: "C",
    losning: String.raw`$x = y$, så båda blir $\frac{3x}{3x} = 1$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 20,
    svar: "D",
    losning: String.raw`Både rektangeln och triangeln kan göras hur långsmala som helst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 21,
    svar: "A",
    losning: String.raw`$2x - 10 = -\frac{x}{3} + 11$ ger $\frac{7x}{3} = 21$, $a = 9$ och $b = 8$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 22,
    svar: "C",
    losning: String.raw`I: $2 \cdot 25 + 1 \cdot 5 = 55$. II: $32 + 16 + 4 + 2 + 1 = 55$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: röd står mellan grön och vit, och blå står direkt till vänster om vit. Enda ordningen är blå, vit, röd, grön. Ellas cykel är grön.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 24,
    svar: "E",
    losning: String.raw`Inget påstående ger något antal elever, bara skillnader.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 25,
    svar: "C",
    losning: String.raw`Tillsammans: $y = 20$ ger $xy < 20$ och $y = -20$ ger $xy < 0$. Svaret är ja.

Var för sig saknas den andra variabeln. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 26,
    svar: "C",
    losning: String.raw`Tillsammans: sidorna förhåller sig som 3 till 4 och diagonalen är 10, så sidorna är 6 och 8. Arean 48 cm².

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 27,
    svar: "D",
    losning: String.raw`(1): $x = 4$. (2): $x^2 = 4x$ och $x > 0$ ger $x = 4$. Båda räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2016ht",
    pass: 3,
    nr: 28,
    svar: "B",
    losning: String.raw`(2): Får och get delar uppslag. Ligger de på det bakre uppslaget kan katten inte ha två djur bakom sig. Alltså ligger de på första uppslaget, och katten på sidan efter med räv och älg bakom. Räcker.

(1) lämnar flera möjligheter. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 1,
    svar: "D",
    losning: String.raw`$13 + 24 = x$, alltså 37.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 3,
    svar: "B",
    losning: String.raw`$18 \cdot 35 = 630$ kulor. $\frac{630}{30} = 21$ burkar, alltså 3 till.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 4,
    svar: "C",
    losning: String.raw`Dela varje term med $7x$: $x + 13$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 5,
    svar: "A",
    losning: String.raw`$4 \cdot 10^6 \cdot 2{,}5 \cdot 10^{-6} = 10$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 7,
    svar: "A",
    losning: String.raw`Negativt delat med positivt är negativt.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 8,
    svar: "C",
    losning: String.raw`$\frac{1}{x} + \frac{1}{y} = \frac{x + y}{xy}$. Konjugatregeln ger $\frac{x^2 - y^2}{xy}$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 10,
    svar: "B",
    losning: String.raw`$-\frac{1}{4} + \frac{1}{4} + 1 - 9 = -8$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 11,
    svar: "C",
    losning: String.raw`$\frac{8 + 2x}{4} = \frac{y}{2}$ ger $8 + 2x = 2y$ och $x = y - 4$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 12,
    svar: "A",
    losning: String.raw`$f(-5) = \frac{1}{9}$, $f(-2) = -\frac{1}{3}$, $f(0) = -1$ och $f(3) = -7$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 13,
    svar: "B",
    losning: String.raw`$x = \pm 4$ och $y = \sqrt{25} = 5$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 15,
    svar: "B",
    losning: String.raw`I: 1,08. II: 1,09.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 16,
    svar: "B",
    losning: String.raw`$f(-1) = 0{,}75$, $f(0) = 3$, $f(1) = 12$. I är 2,25 och II är 9.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 17,
    svar: "A",
    losning: String.raw`I: 64. II: $\frac{36\pi}{2} = 18\pi \approx 56{,}5$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 18,
    svar: "B",
    losning: String.raw`$\frac{1}{x + 1} < \frac{1}{x}$ för positiva $x$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 19,
    svar: "D",
    losning: String.raw`1, 2, 3 ger lika. 1, 2, 9 gör medelvärdet störst. 1, 8, 9 gör medianen störst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 20,
    svar: "D",
    losning: String.raw`$2x^2 = 8y$ ger $x = \pm 2\sqrt{y}$. $y = 1$ och $x = 2$ ger lika, och $x = -2$ gör II störst.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 21,
    svar: "C",
    losning: String.raw`I: $n \cdot 2\pi r = 2\pi \cdot nr = 2\pi R$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 22,
    svar: "B",
    losning: String.raw`Pojkar $p$ och flickor $f$: $p - 1 = f$ och $p = 2(f - 1)$. Det ger $f = 3$ och $p = 4$. I är 8 och II är 9.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: näst minsta är röd och största grön. Minsta är blå.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: Eva och Torsten har $\frac{6}{3} = 2$ gemensamma sorter. $6 + 4 - 2 = 8$.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 25,
    svar: "D",
    losning: String.raw`(1): De 9 bilderna är en elftedel av antalet efter gåvan, alltså 99. (2): Före gåvan 90, efter 99. Båda räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 26,
    svar: "A",
    losning: String.raw`(1): $x + x = 2x$. Räcker.

(2) säger inget om $y$. **Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 27,
    svar: "A",
    losning: String.raw`Triangeln har basen AD = 4 cm och höjden CD, var E än ligger.

(1): CD = 9,5 cm och arean 19 cm². Räcker. (2) ger ingen höjd.

**Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2016ht",
    pass: 5,
    nr: 28,
    svar: "D",
    losning: String.raw`Det finns 56 röda bollar.

(1): A har 21 röda, så B har 35. (2): A har 28 bollar, varav 21 röda, så B har 35. Båda räcker.

**Svar: D.** Mer i ${NOG}.`,
  },

  /* ── Vårprovet 2016, provpass 3 ─────────────────────────────────────── */
  {
    term: "2016vt",
    pass: 3,
    nr: 1,
    svar: "A",
    losning: String.raw`Gruppera: $a(x + y) + b(x + y) = (a + b)(x + y)$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 2,
    svar: "C",
    losning: String.raw`Två pojkar per flicka betyder att antalet elever är delbart med 3. 25 är det inte.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 4,
    svar: "B",
    losning: String.raw`$(1\,000 + 2)^3 = 10^9 + 3 \cdot 10^6 \cdot 2 + 3 \cdot 1\,000 \cdot 4 + 8 = 1\,006\,012\,008$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 5,
    svar: "C",
    losning: String.raw`$x^2$ tar ut varandra: $2x - 5 = -x + 1$ ger $x = 2$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 6,
    svar: "B",
    losning: String.raw`$6 \cdot 4 = 24$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 7,
    svar: "D",
    losning: String.raw`$-2x + 10 - 3x + 30 = 0$ ger $5x = 40$ och $x = 8$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 9,
    svar: "D",
    losning: String.raw`$\frac{1}{3} - \frac{3}{4} = \frac{4 - 9}{12} = -\frac{5}{12}$. Inverterat: $-\frac{12}{5}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 10,
    svar: "D",
    losning: String.raw`Multiplicera med $y > 1$ gör $x$ större, multiplicera med $x < 1$ gör $y$ mindre. Alltså $x < xy < y$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 11,
    svar: "B",
    losning: String.raw`M är mittpunkt på AB, så CM delar triangeln i två lika stora delar. $2 \cdot 5 = 10$ cm².

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 12,
    svar: "A",
    losning: String.raw`Subtrahera: $2y = b - a$. Då är $x - y = a - 2y = 2a - b$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 13,
    svar: "C",
    losning: String.raw`ADE har basen AD och höjden lika med kvadratens sida, alltså halva kvadraten. Resten är den andra halvan.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 14,
    svar: "B",
    losning: String.raw`I: $\frac{7}{6} \approx 1{,}17$. II: $1{,}2$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 15,
    svar: "B",
    losning: String.raw`Konjugatregeln: I är $(a + b)^2 - 4$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 16,
    svar: "A",
    losning: String.raw`I: 378 minuter. II: $120 \cdot 3{,}1416 \approx 377$ minuter.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 17,
    svar: "D",
    losning: String.raw`De andra två har summan 25. Det kan vara 9 och 16 (lika) eller 12 och 13 (II störst).

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 18,
    svar: "B",
    losning: String.raw`II: $\frac{3}{\sqrt{3}} + 2 = \sqrt{3} + 2 \approx 3{,}73$. I: $2\sqrt{3} \approx 3{,}46$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 19,
    svar: "B",
    losning: String.raw`I: $x = -0{,}5$. II: $y = 1$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 20,
    svar: "D",
    losning: String.raw`$y = 13$ ger $x = 24$, och negativa $y$ ger negativa $x$.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 21,
    svar: "A",
    losning: String.raw`I: $\frac{16\pi}{2} = 8\pi \approx 25{,}1$ cm². II: 24 cm².

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 22,
    svar: "C",
    losning: String.raw`$(x^y)^{\frac{1}{y}} = x^1$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 23,
    svar: "A",
    losning: String.raw`(1): Ordinarie priser $\frac{595}{0{,}35} = 1\,700$ kr och $\frac{945}{0{,}45} = 2\,100$ kr. Räcker.

(2) ger bara skillnaden efter rabatt. **Svar: A.** Mer i ${NOG}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 24,
    svar: "C",
    losning: String.raw`(1) ger 3 och 6 eller 4 och 5. (2) ger 2 och 6 eller 3 och 5.

Tillsammans fungerar bara 4 och 5 med 2 och 6. Tredje asken har 1 och 3. **Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 25,
    svar: "C",
    losning: String.raw`(1): fler än 15. (2): färre än 17. Tillsammans: 16.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 26,
    svar: "E",
    losning: String.raw`Vi har en tidsskillnad och en hastighetsskillnad men ingen faktisk hastighet. Flera sträckor passar.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 27,
    svar: "B",
    losning: String.raw`(2): $x$ är 1 250 procent av $y$. Räcker.

(1) saknar värdet på $y$. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2016vt",
    pass: 3,
    nr: 28,
    svar: "D",
    losning: String.raw`(1): $L + 22 = 4(L - 2)$ ger $L = 10$. (2): $L + 38 = 2(L + 14)$ ger $L = 10$. Båda räcker.

**Svar: D.** Mer i ${NOG}.`,
  },

  /* ── Höstprovet 2013, provpass 3 och 5 ─────────────────────────────────────── */
  {
    term: "2013ht",
    pass: 3,
    nr: 1,
    svar: "B",
    losning: String.raw`Multiplikation först: $1 + \frac{1}{6} = \frac{7}{6}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 2,
    svar: "A",
    losning: String.raw`Bensin per kilometer är densamma: $\frac{19}{350} = \frac{L}{1\,710}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 3,
    svar: "C",
    losning: String.raw`$b$ delar både 22 och 26, så $b = 1$ eller $b = 2$. $b = 2$ ger $11 + 2 + 13 = 26$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 4,
    svar: "B",
    losning: String.raw`$0{,}06x = 0{,}05y$. Den större procentsatsen måste tas av det mindre talet.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 5,
    svar: "C",
    losning: String.raw`$x = \frac{81 \cdot 1\,200}{27} = 3 \cdot 1\,200 = 3\,600$.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 7,
    svar: "B",
    losning: String.raw`41, 43 och 47.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 8,
    svar: "A",
    losning: String.raw`Halverade kanter ger en åttondel av volymen. $\frac{12}{8} = 1{,}5$ dm³.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 9,
    svar: "A",
    losning: String.raw`$\frac{7}{8} - \frac{6}{8} = \frac{1}{8}$, och hälften är $\frac{1}{16}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 10,
    svar: "D",
    losning: String.raw`Dela upp: $\frac{1}{xy} - \frac{x}{xy} = \frac{1}{xy} - \frac{1}{y}$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 11,
    svar: "D",
    losning: String.raw`Päron $\frac{x}{3}$ och bananer $\frac{x}{27}$. Summan är $\frac{27 + 9 + 1}{27}x = \frac{37}{27}x$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 12,
    svar: "C",
    losning: String.raw`60 procent kan minst ett språk. $47 + 43 - 60 = 30$ procent kan båda.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 13,
    svar: "A",
    losning: String.raw`Skriv om: I är $69 \cdot 117 - 69$ och II är $69 \cdot 117 - 117$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 14,
    svar: "D",
    losning: String.raw`Villkoret ger $xy = zw$. Jämförelsen gäller $xw$ och $yz$, som inte följer av det.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 16,
    svar: "D",
    losning: String.raw`$x = 1$ ger I störst, $x = -1$ ger II störst och $x = 0$ ger lika.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 18,
    svar: "B",
    losning: String.raw`Udda exponent på ett negativt tal ger negativt, jämn ger positivt.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 19,
    svar: "D",
    losning: String.raw`Längsta sidan ligger mellan 9 och 18 cm. II är 12 cm.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 20,
    svar: "D",
    losning: String.raw`Samma summa kan delas i olika många tal: 6 som $1 + 5$ eller $1 + 2 + 3$.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 21,
    svar: "B",
    losning: String.raw`$a = d - 3 = -2d$ ger $d = 1$, så talen är $-2, -1, 0, 1, 2$ och $b = -1$.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 22,
    svar: "A",
    losning: String.raw`Olikheten gäller när $0 < x < 1$, och där är $x^2 < x$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 23,
    svar: "C",
    losning: String.raw`Tillsammans: 2 män har hatt. När en går av återstår 1, så 4 kvinnor har hatt. Totalt 6.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: får utgör $1 - \frac{1}{8} - \frac{1}{4} = \frac{5}{8}$, och det är 5 djur. Totalt 8 djur.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 26,
    svar: "C",
    losning: String.raw`Tillsammans: Anna är 24 år äldre och 2014 dubbelt så gammal. Karin var 24 år 2014 och 11 år 2001.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 27,
    svar: "D",
    losning: String.raw`Tillsammans körde de 117 km/h. (1): $2g + 27 = 117$ ger $g = 45$. (2): $2{,}6g = 117$ ger $g = 45$. Båda räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
  {
    term: "2013ht",
    pass: 3,
    nr: 28,
    svar: "B",
    losning: String.raw`(2): Byxorna står i en ände och har bara tröjorna bredvid sig. Tröjorna är svarta, alltså är strumporna vita. Räcker.

(1) lämnar flera möjligheter. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 1,
    svar: "A",
    losning: String.raw`$\frac{2}{3} \cdot \frac{3}{4} = \frac{1}{2}$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 2,
    svar: "D",
    losning: String.raw`Samma täljare ger samma nämnare: $a + x = 2x$, alltså $x = a$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 3,
    svar: "A",
    losning: String.raw`Olika tecken ger negativ kvot.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 5,
    svar: "B",
    losning: String.raw`$10^{10} \cdot 4 \cdot 10^{-8} = 4 \cdot 10^2$ cm.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 7,
    svar: "A",
    losning: String.raw`Dra bort $a$ och lägg till $2b$: $3b > 0$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 8,
    svar: "D",
    losning: String.raw`$3^4 = 81$, och alla exponenter multipliceras med 4.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 9,
    svar: "A",
    losning: String.raw`Multiplicera med 3: $-3x + 21 = 2x - 4$ ger $x = 5$ och $y = 2$.

**Svar: A.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 10,
    svar: "C",
    losning: String.raw`En sida per $m$ minuter ger $\frac{7}{m}$ sidor på 7 minuter.

**Svar: C.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 11,
    svar: "D",
    losning: String.raw`Vänsterledet är $\frac{x}{5}$ gånger högerledet, så $\frac{x}{5} = 1$.

**Svar: D.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 12,
    svar: "B",
    losning: String.raw`Pojkar och flickor förhåller sig som 2 till 3. Pojkarna är $\frac{2}{5}$.

**Svar: B.** Mer i ${XYZ}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 13,
    svar: "B",
    losning: String.raw`$\frac{7}{4} > \frac{3}{2}$, så I är mer negativt.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 15,
    svar: "D",
    losning: String.raw`$x = 1$ ger 2, alla andra positiva $x$ ger mer.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 16,
    svar: "C",
    losning: String.raw`Multiplicera ut II: $ab - 2a^2$.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 18,
    svar: "A",
    losning: String.raw`II är $\frac{x^b}{b^b}$, och $b^b > b$ när $b > 1$.

**Svar: A.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 19,
    svar: "C",
    losning: String.raw`Båda medelvärdena ligger mitt i talföljden.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 20,
    svar: "B",
    losning: String.raw`Omkretsen är 6 m, så diametern är $\frac{6}{\pi} \approx 1{,}9$ m.

**Svar: B.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 21,
    svar: "C",
    losning: String.raw`Multiplicera ut II: $xy + x^2 + yz + xz$, samma som I.

**Svar: C.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 22,
    svar: "D",
    losning: String.raw`Den räta vinkeln kan ligga i $(2, 2)$ med $a = 2$ eller i $(2, 4)$ med $a = 4$.

**Svar: D.** Mer i ${KVA}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 23,
    svar: "E",
    losning: String.raw`Tillsammans: damcyklarna är röd och blå, och de tre herrcyklarna har olika färger. Både svart, grön, röd och svart, grön, blå fungerar.

**Svar: E.** Mer i ${NOG}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 24,
    svar: "C",
    losning: String.raw`Tillsammans: värdet ökar till 15 miljoner, och 300 000 kr per skulptur ger 50 skulpturer. 10 nya.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 25,
    svar: "C",
    losning: String.raw`0,4 procent av 1 kg är 4 g. Tillsammans: nickel 0,5 g och zink 1 g ger koppar 2,5 g.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 26,
    svar: "B",
    losning: String.raw`(2): Första och tredje kastet är lika, så $T = 33 + \frac{T}{3}$ ger $T = 49{,}5$ m. Räcker.

(1) ger bara förhållanden. **Svar: B.** Mer i ${NOG}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 27,
    svar: "C",
    losning: String.raw`Tillsammans: gröna har 0,3 och blå 0,1. Röda har 0,6.

**Svar: C.** Mer i ${NOG}.`,
  },
  {
    term: "2013ht",
    pass: 5,
    nr: 28,
    svar: "D",
    losning: String.raw`Tillsammans planterar de 20 träd per timme.

(1): B tar $\frac{2}{5}$, alltså 8 per timme och 15 timmar. (2): A planterar 12 per timme, B 8. Båda räcker.

**Svar: D.** Mer i ${NOG}.`,
  },
];
