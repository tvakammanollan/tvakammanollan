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
        "Alla gamla högskoleprov, duellerna, normeringen och forumet är gratis. Hela ordlistan och MEK kostar 149 kr för en månad eller 349 kr för sex, moms inräknad.",
      ogTitle: "Pris på Tvåkommanollan",
      ogDescription: "Vad som är gratis, vad som kostar och varför.",
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

const GRATIS = [
  "Alla 30 provtillfällen med facit, 4 800 uppgifter",
  "Duellerna, verbalt och kvantitativt",
  "Normeringstabeller, poängräknare och preliminärt facit",
  "Forumet och alla genomgångar",
  "Ordlistans uppslagssidor, med betydelse och exempel",
  "De första 40 orden och 40 MEK-uppgifterna i träningsläget",
];

const TANKER = [
  {
    rubrik: "Provarkivet är gratis för att provet är allas",
    text: "Gamla prov är UHR:s eget material och finns öppet. Det vi lägger till är facit på varje uppgift, normering och ett sätt att skriva dem på tid. Att ta betalt för att komma åt själva proven vore att sälja något som redan är fritt.",
  },
  {
    rubrik: "Det som kostar är volymen i ORD och MEK",
    text: "Ordlistan har över 10 000 ord med förklaring, och MEK-banken innehåller uppgifter vi skriver själva och blindprövar innan de publiceras. Det är den mängden som ligger bakom köpet. De första 40 av varje är gratis, så att du kan avgöra om det hjälper dig innan du betalar något.",
  },
  {
    rubrik: "Ett köp, ingen prenumeration",
    text: "Du väljer en månad eller sex, betalar en gång och det gäller just den tiden. Inget förnyas av sig självt och inget dras i efterhand. Ett köp låser upp både ordlistan och MEK.",
  },
  {
    rubrik: "Du behöver ett riktigt konto för att köpa",
    text: "Gästkonton kan inte köpa, för köpet skulle försvinna tillsammans med kontot. Allt annat går att prova som gäst.",
  },
];

function PrisPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        title="Vad som är gratis och vad som kostar"
        align="center"
        variant="content"
      />

      <Priset />

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h2 className="mb-8 max-w-[22ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
            Det här kostar inget
          </h2>
          <ul className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {GRATIS.map((rad) => (
              <li key={rad} className="flex gap-2.5 text-[16px] leading-relaxed text-white/70">
                <Check className="mt-1 h-4 w-4 shrink-0 text-success" />
                {rad}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-white/10 bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h2 className="mb-10 max-w-[22ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
            Så tänker vi
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

      <section>
        <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
          <h2 className="text-[24px] leading-tight tracking-[-0.03em] sm:text-[30px]">
            Priset är vad du betalar
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/70">
            149 kr för en månad och 349 kr för sex månader, med moms inräknad. Inget läggs på i
            kassan. Provavgiften på {HP_FEE_SEK} kronor när du anmäler dig till själva provet går
            till UHR och inte till oss.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-primary px-6 py-3 text-[15px] font-semibold text-on-brand transition hover:brightness-125"
            >
              Skapa konto
            </Link>
            <Link
              to="/gamla-prov"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg px-4 py-3 text-[15px] font-semibold text-[var(--cream-3)] transition hover:text-[var(--cream)]"
            >
              Börja med gamla prov
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
