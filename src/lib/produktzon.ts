/**
 * Produktzonerna och deras färger.
 *
 * Podia-systemet (DESIGN.md) bygger på att varje produktyta äger exakt en
 * färg, och att kopplingen är låst: ser du Sky vet du att du är i arkivet.
 * Hela poängen går förlorad om två zoner delar färg eller om en zon byter
 * färg mellan två sidor, så kopplingen bor på ETT ställe, här.
 *
 * **Färgerna är ytor, aldrig text.** Mätt mot grundytan Fog #f5f5f5:
 * Sky 1,6:1, Lavender 1,8:1, Terracotta 2,1:1. Ingen av dem når ens 3:1,
 * alltså kan de inte bära en bokstav eller en ikon som ska gå att urskilja.
 * Terracotta klarar inte heller vit text ovanpå sig (2,3:1). Det som står
 * PÅ en zonyta är `zonText` nedan, och det är därför den finns: utan den
 * blir nästa person som behöver text på ett zonkort tvungen att gissa.
 *
 * Plum är med flit Lavenders mörka variant i DESIGN.md. Att MEK fick just
 * den i stället för en femte färg är ett val: MEK och ordlistan säljs som
 * ett köp och hör ihop, och en femte kulör hade gjort paletten luddig.
 */
export type Produktzon = "prov" | "duell" | "mek" | "ord";

/** Zonens yta. Läggs på kort, paneler och dekorformer, aldrig på text. */
export const zonYta: Record<Produktzon, string> = {
  prov: "var(--sky)",
  duell: "var(--terracotta)",
  mek: "var(--plum)",
  ord: "var(--lavender)",
};

/**
 * Zonens färg när den används som DEKORFORM bakom innehåll.
 *
 * Skild från `zonYta` av ett mätt skäl. Dekorformerna ligger bakom
 * rubriken och ingressen, och vid 375 px bredd överlappar de dem: 200×10
 * px på H1:an och 124×28 på ingressen. Med en ljus form är det kosmetiskt
 * (Ink på Sky vid 70 % ger 13,4:1, på terracotta 11,0:1, på Lavender
 * 12,7:1). Med Plum, som är mörk, blir det mörk text på nästan svart.
 *
 * DESIGN.md listar också bara fyra färger som dekorformer: terracotta,
 * Sky, Lavender och Cream. Plum står där som kortfyllning, aldrig som
 * form. MEK får därför sin ljusa släkting Lavender i bakgrunden och
 * behåller Plum på ytor som faktiskt är fyllda.
 *
 * Sänk inte opaciteten för att smyga in Plum här: problemet är inte hur
 * stark formen är utan att texten hamnar ovanpå den.
 */
export const zonDekor: Record<Produktzon, string> = {
  prov: "var(--sky)",
  duell: "var(--terracotta)",
  mek: "var(--lavender)",
  ord: "var(--lavender)",
};

/**
 * Text ovanpå zonens yta. Ink duger på de tre ljusa (8,7:1 eller bättre);
 * Plum är mörk och kräver därför Paper i stället.
 */
export const zonText: Record<Produktzon, string> = {
  prov: "var(--cream)",
  duell: "var(--cream)",
  mek: "var(--on-brand)",
  ord: "var(--cream)",
};

/**
 * Vilken zon en adress tillhör, eller null för sidor som inte är en
 * produktyta (start, guider, forum, villkor och så vidare).
 *
 * Matchar på prefix och inte på exakt sträng, eftersom varje zon har
 * undersidor: `/gamla-prov/2026vt/2`, `/ordlista/bokstav/s`, `/match/<id>`.
 * Ordningen spelar roll: `/ordlista` måste provas före `/ord`, annars
 * fångar den senare båda. Testet pinnar just det.
 */
export function zonForPath(path: string): Produktzon | null {
  const p = path.toLowerCase();
  const prefix = (s: string) => p === s || p.startsWith(s + "/");

  if (prefix("/gamla-prov")) return "prov";
  if (prefix("/ordlista") || prefix("/ord")) return "ord";
  if (prefix("/mek-ovning")) return "mek";
  if (prefix("/matchmaking") || prefix("/match") || prefix("/result") || prefix("/leaderboard")) {
    return "duell";
  }
  return null;
}
