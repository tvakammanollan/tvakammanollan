import { useRouterState } from "@tanstack/react-router";
import { type Dekorform, formerForPath } from "@/lib/dekorformer";

export { HEM_FORMER } from "@/lib/dekorformer";

/**
 * Dekorformerna: mjuka färgfläckar bakom sidans övre del.
 *
 * De låg tidigare i `PageHero`, vilket gav dem till de nio sidor som har
 * en hero och ingen annan. Nu ritas de i roten (`PageDekor` nedan) ur
 * adressen, samma väg som `ZonBand`: varje sida får sin zons färg, sidor
 * utanför zonerna får cream wash, och nya rutter får former gratis i
 * stället för att glömmas bort. Startsidan och landningssidan ritar sina
 * egna (`HEM_FORMER` respektive `LandingHero`) och hoppas över här.
 *
 * Formerna är dekoration och inget annat: `aria-hidden`, utan pekhändelser,
 * och på `z-index: -1` inuti ett eget staplingssammanhang (`main` har
 * `isolate`), så de ligger under allt innehåll men ovanpå sidans botten.
 * Zonfärgerna klarar inte 3:1 mot grundytan och får därför aldrig bära
 * text; en form som råkar hamna bakom en rubrik är kosmetisk (Ink på Sky
 * ger 13,4:1), se `lib/produktzon.ts`. Plum ritas aldrig som form, därför
 * `zonDekor` och inte `zonYta`.
 *
 * Behållaren klipper sina egna barn (`overflow-hidden`), så en form som
 * sticker ut till höger ger aldrig horisontell skroll på en telefon.
 */
export function Dekorformer({ former }: { former: Dekorform[] }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden"
    >
      {former.map((f, i) => (
        <div
          key={i}
          className={`absolute ${f.className}`}
          style={{ background: f.farg, borderRadius: f.radius }}
        />
      ))}
    </div>
  );
}

export function PageDekor() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const former = formerForPath(path);
  if (!former) return null;
  return <Dekorformer former={former} />;
}
