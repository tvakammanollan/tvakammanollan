import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";
import { Priset } from "@/components/landing/LandingSections";
import { HP_FEE_SEK } from "@/lib/hp-dates";

export const Route = createFileRoute("/pris")({
  component: PrisPage,
  head: () => ({
    meta: pageMeta({
      path: "/pris",
      title: "Pris: vad som är gratis och vad som kostar",
      description:
        "Premium ger alla 31 gamla prov, hela ordlistan och alla MEK-uppgifter för 149 kr i månaden eller 349 kr för 6 månader. Matcherna är gratis.",
      ogTitle: "Pris på Tvåkommanollan",
      ogDescription: "Vad som är gratis och vad som kostar.",
    }),
    links: pageLinks("/pris"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Pris", path: "/pris" },
      ]),
    ],
  }),
});

/**
 * Sidan om pris. Allt som står här ska gå att belägga i koden.
 *
 * Beloppen i `Priset` är skrivna för hand och ska stämma med Stripe; se
 * kommentaren ovanför `BETALKORT` i `LandingSections.tsx`. Sista stycket
 * nedan nämner dem också.
 *
 * Avsnittet "Så tänker vi" är skrivet ur det som finns i repot (vad som
 * är gratis, vad som kostar, hur MEK-uppgifterna tas fram). Den som äger
 * produkten ska läsa det och ändra det till sin egen röst: tonen och
 * motiven är inte något koden kan intyga.
 */

const PREMIUM = [
  "Alla 31 gamla prov att skriva, 124 provpass och 4 960 uppgifter",
  "Provläge på tid och övningsläge, med rättning och poäng på varje prov",
  "Hela ordlistan i träningsläget, över 10 000 ord med förklaring",
  "Alla MEK-uppgifter, arkivets och våra egna",
  "Allt som är gratis ingår också",
];

const GRATIS = [
  "De senaste proven att skriva, med facit och rättning",
  "Facit till alla 31 prov",
  "Matcherna, verbalt och kvantitativt",
  "Normeringstabeller, poängräknare och preliminärt facit",
  "Forumet och alla genomgångar",
  "Ordlistans uppslagssidor, med betydelse och exempel",
  "De första 20 orden och 10 MEK-uppgifterna i träningsläget",
  "Träningsläget för övriga delprov",
];

const TANKER = [
  {
    rubrik: "De senaste proven är gratis",
    text: "De senaste proven går att skriva utan köp och utan konto. De äldre proven ingår i Premium. Facit till alla prov står öppet på varje provs sida. När ett nytt prov läggs in blir det gratis.",
  },
  {
    rubrik: "Ordlistan och MEK har en gratisdel",
    text: "Ordlistan har över 10 000 ord med förklaring, och MEK-banken innehåller uppgifter vi skriver själva och blindprövar innan de publiceras. De första 20 orden och de första 10 MEK-uppgifterna är gratis, så att du kan prova innan du betalar. Resten ingår i Premium.",
  },
  {
    rubrik: "Per månad eller 6 månader",
    text: `Månadsköpet kostar 149 kr per månad och förnyas tills du säger upp det, vilket du gör med en knapp under Abonnemang i menyn. 6 månader kostar 349 kr och förnyas inte. Båda köpen ger samma sak: allt på sajten. Provavgiften på ${HP_FEE_SEK} kronor när du anmäler dig till själva provet går till UHR och inte till oss.`,
  },
  {
    rubrik: "Du behöver ett konto för att köpa",
    text: "Som gäst kan du inte köpa, eftersom köpet skulle försvinna med gästkontot. Allt som är gratis går att prova som gäst.",
  },
];

function PrisPage() {
  return (
    <div className="min-h-screen">
      {/* Kompakt hero med snål underkant: priskorten ska synas utan skroll,
          också på en telefon. Se `Priset`s kompakt-läge. */}
      <PageHero
        title="Vad som är gratis och vad som kostar"
        align="center"
        variant="compact"
        className="pb-4 sm:pb-6"
      />

      <Priset kompakt />

      {/* En sektion med två spalter. Det var två sektioner med var sin rubrik
          och samma punkter som priskorten ovanför; nu står det som skiljer
          Premium från gratis sida vid sida, en gång. */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h2 className="mb-8 max-w-[22ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
            Vad som ingår
          </h2>
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {[
              { rubrik: "Premium", rader: PREMIUM },
              { rubrik: "Utan köp", rader: GRATIS },
            ].map((spalt) => (
              <div key={spalt.rubrik}>
                <h3 className="mb-4 text-[20px] leading-snug tracking-[-0.02em]">{spalt.rubrik}</h3>
                <ul className="space-y-3">
                  {spalt.rader.map((rad) => (
                    <li
                      key={rad}
                      className="flex gap-2.5 text-[16px] leading-relaxed text-white/70"
                    >
                      <Check className="mt-1 h-4 w-4 shrink-0 text-success" />
                      {rad}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h2 className="mb-10 max-w-[22ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
            Så fungerar köpet
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {TANKER.map((t) => (
              <div key={t.rubrik} className="rounded-3xl border border-white/10 bg-card p-7 sm:p-8">
                <h3 className="text-[20px] leading-snug tracking-[-0.02em]">{t.rubrik}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/70">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slutet upprepade priset en tredje gång och hade, som gratiskortet
          ovanför, en knapp till "Skapa konto". Nu leder sidans sista knapp
          till kassan, och gratisvägen står bredvid. */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
          <div className="flex flex-wrap gap-3">
            <Link
              to="/kassa"
              search={{ plan: "1m" }}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-primary px-6 py-3 text-[15px] font-semibold text-on-brand transition hover:brightness-125"
            >
              Välj Premium
            </Link>
            <Link
              to="/gamla-prov"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg px-4 py-3 text-[15px] font-semibold text-[var(--cream-3)] transition hover:text-[var(--cream)]"
            >
              Börja med ett gratisprov
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
