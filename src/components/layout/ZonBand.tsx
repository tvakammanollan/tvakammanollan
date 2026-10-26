import { useRouterState } from "@tanstack/react-router";
import { zonForPath, zonYta } from "@/lib/produktzon";

/**
 * Tunn färgremsa direkt under navbaren som säger vilken produktyta du
 * står på: Sky i arkivet, terracotta i duellen, Plum i MEK, Lavender i
 * ordlistan. Utanför de fyra zonerna renderas ingenting alls.
 *
 * Varför här och inte per rutt: `PageHero` bär zonens dekorformer, men
 * långt ifrån alla ytor har en hero. Matchen, resultatsidan och
 * ordlistans uppslagssidor har egna layouter, och match- och
 * resultatsidorna är dessutom täta skärmar där ingenting får läggas
 * ovanpå innehållet. Att härleda zonen ur adressen i roten ger varje
 * yta sin färg utan en enda ruttändring, och nya rutter under en zon
 * får den gratis i stället för att glömmas bort.
 *
 * Remsan är en SOLID yta utan något ovanpå, så den är det enda stället
 * där zonens riktiga färg kan användas rakt av. Därför `zonYta` och
 * inte `zonDekor`: MEK ska vara Plum här. Bakom text hade Plum varit
 * oläsbar, vilket är hela skälet till att de två listorna är skilda åt.
 *
 * Färgen bär ingen information som inte redan står i rubriken och
 * titeln, därför `aria-hidden`. Den är förstärkning, inte den enda
 * vägen att veta var man är.
 *
 * 6 px med flit. Tunnare läser som en hårfin kant i Mist och försvinner
 * bland sidans övriga linjer i stället för att se avsiktlig ut.
 */
export function ZonBand() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const zon = zonForPath(path);

  if (!zon) return null;

  return <div aria-hidden="true" className="h-1.5 w-full" style={{ background: zonYta[zon] }} />;
}
