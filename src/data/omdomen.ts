/**
 * Omdömen från riktiga personer med riktiga resultat.
 *
 * Ligger som ren data och inte i vykomponenten därför att `index.tsx`
 * bygger JSON-LD (`aggregateRating` + `review`) av den. Strukturerad data
 * ska inte behöva importera en React-komponent för att komma åt sitt
 * innehåll, och listan får inte kunna ändras på ett ställe utan att
 * betyget följer med.
 *
 * Lägg ALDRIG till ett citat ingen sagt. Ändras listan ändras
 * `aggregateRating` i samma commit, automatiskt, via SNITTBETYG nedan.
 *
 * `betyg` utelämnas när personen gav fem stjärnor. Det är fallet för alla
 * utom Liang, och en explicit femma på varje rad hade bara gjort det
 * lättare att missa den som inte är det.
 */
export interface Omdome {
  citat: string;
  namn: string;
  resultat?: string;
  alder?: string;
  roll?: string;
  betyg?: number;
}

export const OMDOMEN: Omdome[] = [
  {
    citat:
      "Det är ett gott tecken när det känns roligt och engagerande att plugga inför högskoleprovet.",
    namn: "Aron",
    resultat: "2,0",
    alder: "18 år",
  },
  {
    citat: "Tvåkommanollan har allt som behövs för att lyckas på högskoleprovet.",
    namn: "Gustav",
    resultat: "1,9",
    alder: "18 år",
  },
  {
    citat:
      "Tvåkommanollan innehåller verktyg jag hade haft stor nytta av när jag pluggade till högskoleprovet, helt gratis.",
    namn: "Niklas",
    resultat: "1,95",
    roll: "Grundare",
  },
  { citat: "Utmärkt!", namn: "Liang", alder: "19 år", betyg: 4 },
  { citat: "Jättebra!", namn: "Ann" },
  { citat: "Det är skönt att ha allt samlat på ett ställe.", namn: "Theo" },
];

/** Snittet av OMDOMEN, aldrig en siffra någon skrivit för hand. Just nu 4,8. */
export const SNITTBETYG = OMDOMEN.reduce((summa, o) => summa + (o.betyg ?? 5), 0) / OMDOMEN.length;

/**
 * De tre korten på landningssidan (`Omdomen` i `LandingSections.tsx`),
 * med uppgifter Niklas lämnade 2026-11-15. Texten är rättad för stavning
 * och skiljetecken men säger det personerna sa. Arons kort bär en mening
 * om hans roll i `bakgrund`, skild från citatet, eftersom den är skriven
 * om honom och inte av honom.
 */
export interface Omdomeskort {
  namn: string;
  alder: string;
  /** Sysselsättning och roll, en rad var. */
  roller: string[];
  resultat: string;
  /** Vilket prov resultatet är från. */
  prov: string;
  detalj?: string;
  citat: string;
  bakgrund?: string;
}

export const OMDOMESKORT: Omdomeskort[] = [
  {
    namn: "Niklas",
    alder: "19 år",
    roller: ["Grundare av Tvåkommanollan", "Student på Handelshögskolan"],
    resultat: "1,95",
    prov: "Vårprovet 2026",
    detalj: "Har skrivit provet 4 gånger",
    citat:
      "Jag byggde Tvåkommanollan för att jag saknade bra verktyg att plugga med inför provet. Det var i ORD och MEK jag såg mest som gick att göra bättre, och därför har vi lagt mest arbete på de två delproven.",
  },
  {
    namn: "Aron",
    alder: "19 år",
    roller: [
      "Medgrundare av första versionen av Tvåkommanollan",
      "Läser matematik på Stockholms universitet",
    ],
    resultat: "2,0",
    prov: "Höstprovet 2025",
    detalj: "158 av 160 rätt",
    citat: "Fem stjärnor ger jag Tvåkommanollan.",
    bakgrund:
      "Aron byggde den första versionen. Det var intresset för schack som drog honom till träning med ELO.",
  },
  {
    namn: "Gustav",
    alder: "19 år",
    roller: ["Arbetar i Försvarsmakten"],
    resultat: "1,9",
    prov: "Höstprovet 2025",
    citat: "Tvåkommanollan har de verktyg som behövs för att skriva högt på högskoleprovet.",
  },
];
