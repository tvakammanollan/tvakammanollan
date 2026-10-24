/**
 * Frågorna och svaren till de åtta delprovsguidernas FAQ-block.
 *
 * Antal uppgifter per provpass följer DELPROV i preliminart-facit.ts
 * (provformatet sedan 2011): ORD, LÄS, MEK, ELF och KVA 10, XYZ och DTK 12,
 * NOG 6. Ett provpass är 40 uppgifter på 55 minuter, och varje prov har två
 * räknade provpass av varje slag. Fem svarsalternativ finns bara i ORD och
 * NOG. Ändras något av det: ändra här, inte i guiden.
 */
import type { GuideFaqItem } from "@/lib/guider-meta";

const TID =
  "Delprovet har ingen egen tid. Ett provpass är 40 uppgifter på 55 minuter, och du fördelar tiden själv mellan passets fyra delprov.";

export const GUIDE_FAQ: Record<string, GuideFaqItem[]> = {
  ord: [
    {
      q: "Hur många ORD-uppgifter är det på högskoleprovet?",
      a: "10 per verbalt provpass. Två verbala provpass räknas, så det blir 20 ORD-uppgifter per prov.",
    },
    {
      q: "Hur lång tid har man på ORD?",
      a: `${TID} ORD går snabbast av de verbala delproven, eftersom du antingen kan ordet eller inte.`,
    },
    {
      q: "Hur många svarsalternativ har ORD?",
      a: "Fem, A till E. ORD och NOG är de enda delproven med fem alternativ.",
    },
    {
      q: "Vilka ord har kommit på tidigare prov?",
      a: "Alla ORD-uppgifter från de 30 proven sedan 2012 finns samlade på sidan Orden på högskoleprovet, ett prov per sida. Varje ord som förekommit finns också i ordlistan med betydelse.",
    },
  ],
  mek: [
    {
      q: "Hur många MEK-uppgifter är det på högskoleprovet?",
      a: "10 per verbalt provpass, alltså 20 per prov.",
    },
    { q: "Hur lång tid har man på MEK?", a: TID },
    {
      q: "Hur många svarsalternativ har MEK?",
      a: "Fyra, A till D. Varje alternativ fyller alla luckor i texten på en gång, så ett alternativ är bara rätt om varje ord i det passar.",
    },
    {
      q: "Vad är det viktigaste att leta efter i en MEK-text?",
      a: "Sambandsorden: men, därför, trots, alltså. De avgör om luckan ska fortsätta resonemanget eller vända det, och de stryker ofta två alternativ direkt.",
    },
  ],
  las: [
    {
      q: "Hur många LÄS-uppgifter är det på högskoleprovet?",
      a: "10 per verbalt provpass, alltså 20 per prov. Uppgifterna hör till flera texter av olika längd.",
    },
    {
      q: "Hur lång tid har man på LÄS?",
      a: `${TID} LÄS tar oftast längst tid av de verbala delproven.`,
    },
    { q: "Hur många svarsalternativ har LÄS?", a: "Fyra, A till D." },
    {
      q: "Ska man läsa hela texten innan man tittar på frågorna?",
      a: "Det fungerar olika för olika personer. Ett vanligt upplägg är att skumma frågorna först, läsa texten en gång i lugnt tempo och sedan gå tillbaka till rätt stycke för varje fråga.",
    },
  ],
  elf: [
    {
      q: "Hur många ELF-uppgifter är det på högskoleprovet?",
      a: "10 per verbalt provpass, alltså 20 per prov.",
    },
    { q: "Hur lång tid har man på ELF?", a: TID },
    { q: "Hur många svarsalternativ har ELF?", a: "Fyra, A till D." },
    {
      q: "Var hittar man gamla ELF-uppgifter?",
      a: "UHR tar bort ELF-texterna ur de häften som läggs ut efter provet, av upphovsrättsskäl. I arkivet här finns ELF med i alla 60 verbala provpass sedan 2012.",
    },
  ],
  xyz: [
    {
      q: "Hur många XYZ-uppgifter är det på högskoleprovet?",
      a: "12 per kvantitativt provpass, alltså 24 per prov. XYZ och DTK är de största delproven på den kvantitativa delen.",
    },
    { q: "Hur lång tid har man på XYZ?", a: TID },
    { q: "Hur många svarsalternativ har XYZ?", a: "Fyra, A till D." },
    {
      q: "Får man använda miniräknare eller formelsamling?",
      a: "Nej. Allt räknas för hand, så det lönar sig att kunna de vanligaste formlerna utantill. De finns samlade på sidan Formler för högskoleprovet.",
    },
  ],
  kva: [
    {
      q: "Hur många KVA-uppgifter är det på högskoleprovet?",
      a: "10 per kvantitativt provpass, alltså 20 per prov.",
    },
    { q: "Hur lång tid har man på KVA?", a: TID },
    {
      q: "Vilka är svarsalternativen i KVA?",
      a: "Alltid samma fyra: I är större än II, II är större än I, I är lika med II, och informationen är otillräcklig.",
    },
    {
      q: "När är svaret att informationen är otillräcklig?",
      a: "När du kan hitta två tillåtna exempel som ger olika svar, till exempel ett där kvantiteterna är lika och ett där I är större. Om båda kvantiteterna är bestämda tal kan svaret aldrig vara det alternativet.",
    },
  ],
  nog: [
    {
      q: "Hur många NOG-uppgifter är det på högskoleprovet?",
      a: "6 per kvantitativt provpass, alltså 12 per prov. NOG är det minsta delprovet.",
    },
    { q: "Hur lång tid har man på NOG?", a: TID },
    {
      q: "Vilka är svarsalternativen i NOG?",
      a: "Alltid samma fem: tillräckligt i (1) men inte i (2), i (2) men inte i (1), i (1) och (2) tillsammans, i (1) och (2) var för sig, eller inte ens med båda.",
    },
    {
      q: "Måste man räkna ut svaret i NOG?",
      a: "Nej. Frågan är bara om informationen räcker. Så fort du ser att ett påstående ger ett entydigt svar kan du gå vidare utan att räkna klart.",
    },
  ],
  dtk: [
    {
      q: "Hur många DTK-uppgifter är det på högskoleprovet?",
      a: "12 per kvantitativt provpass, alltså 24 per prov.",
    },
    { q: "Hur lång tid har man på DTK?", a: TID },
    { q: "Hur många svarsalternativ har DTK?", a: "Fyra, A till D." },
    {
      q: "Behöver man räkna exakt i DTK?",
      a: "Sällan. Alternativen ligger oftast så långt ifrån varandra att en avrundad uppskattning räcker. Läs axlarna och enheterna först, det är där de flesta fel görs.",
    },
  ],
};
