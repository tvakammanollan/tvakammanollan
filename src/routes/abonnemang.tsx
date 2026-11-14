import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2 } from "lucide-react";
import { pageTitle } from "@/lib/page-meta";
import { useAuth } from "@/hooks/useAuth";
import { OrdPurchaseCard } from "@/components/OrdPurchaseCard";
import {
  getOrdAccess,
  type OrdAccessInfo,
  type OrdPurchaseStatus,
} from "@/lib/ord-paywall.functions";
import { FREE_MEK_LIMIT, FREE_ORD_LIMIT, type OrdPlan } from "@/lib/ord-paywall";
import { formatMoney } from "@/lib/sv-format";

/**
 * Hantera abonnemang: vad användaren har köpt, när det förnyas eller går
 * ut, och knappen för att säga upp. Nås från menyn under användarnamnet.
 *
 * Sidan finns för att ingen ska känna sig lurad. Allt som gäller köpet står
 * här i klartext, uppsägningen är ett klick bort och kräver inget mejl, och
 * de två köpen beskrivs med vad som händer efter perioden, inte bara priset.
 * Lägg inte till något här som gör uppsägningen svårare att hitta, som en
 * extra bekräftelse, ett erbjudande i vägen eller en fråga om varför.
 *
 * Privat sida, så noindex. Allt hämtas i webbläsaren.
 */
export const Route = createFileRoute("/abonnemang")({
  component: AbonnemangPage,
  head: () => ({
    meta: [{ title: pageTitle("Abonnemang") }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

/** Reservbelopp om Stripe inte svarar. Kassan läser alltid sitt eget pris. */
const RESERVPRIS: Record<OrdPlan, number> = { "1m": 14900, "6m": 34900 };

const PLANER: {
  plan: OrdPlan;
  rubrik: string;
  enhet: string;
  rader: string[];
  yta: string;
  knapp: string;
}[] = [
  {
    plan: "1m",
    rubrik: "Per månad",
    enhet: "per månad",
    rader: [
      "Dras idag och sedan samma dag varje månad",
      "Säg upp här när som helst, utan uppsägningstid",
      "Efter uppsägningen har du kvar tillgången månaden ut",
    ],
    yta: "border-2 border-terracotta bg-terracotta/10",
    knapp: "bg-terracotta text-[var(--cream)] hover:brightness-110",
  },
  {
    plan: "6m",
    rubrik: "6 månader",
    enhet: "för 6 månader",
    rader: ["Hela ordlistan och all MEK i 6 månader", "Ett köp gäller både ordlistan och MEK"],
    yta: "border-2 border-plum bg-lavender",
    knapp: "bg-plum text-[var(--on-brand)] hover:brightness-110",
  },
];

function AbonnemangPage() {
  const { user, loading: authLoading } = useAuth();
  const fetchAccess = useServerFn(getOrdAccess);
  const [purchase, setPurchase] = useState<{
    status: OrdPurchaseStatus | null;
    failed: boolean;
  } | null>(null);
  const [access, setAccess] = useState<OrdAccessInfo | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    void fetchAccess({})
      .then(setAccess)
      .catch(() => setAccess(null));
  }, [authLoading, user, fetchAccess]);

  const loggedIn = !authLoading && !!user && access?.isAnonymous !== true;
  const loading = authLoading || (!!user && purchase === null);
  const active = purchase?.status?.active === true;

  const price = (p: OrdPlan) => {
    const found = access?.plans.find((x) => x.plan === p);
    return formatMoney(found?.amount ?? RESERVPRIS[p], access?.currency ?? "SEK");
  };

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:pt-14">
        <h1 className="text-[32px] leading-tight tracking-[-0.035em] sm:text-[40px]">Abonnemang</h1>
        <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-white/70">
          Hela ordlistan och all MEK-övning. De första {FREE_ORD_LIMIT} orden och {FREE_MEK_LIMIT}{" "}
          MEK-uppgifterna är gratis, och allt annat på sajten är gratis utan köp.
        </p>

        {/* Kortet läser köpet själv och säger till sidan vad det hittade. */}
        {user && (
          <OrdPurchaseCard
            className="mt-8"
            onLoaded={(status, failed) => setPurchase({ status, failed })}
          />
        )}

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white/55" aria-hidden />
          </div>
        ) : purchase?.failed ? (
          <p role="alert" className="mt-8 text-[15px] text-[var(--destructive)]">
            Vi kunde inte läsa ditt köp just nu. Ladda om sidan om en stund, eller mejla
            info@tvakommanollan.se.
          </p>
        ) : active ? (
          <p className="mt-4 text-sm text-white/55">
            Du kan välja ett nytt köp här när det du har gått ut.
          </p>
        ) : (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-[var(--cream)]">
              {purchase?.status ? "Köp igen" : "Välj köp"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {PLANER.map(({ plan, rubrik, enhet, rader, yta, knapp }) => (
                <div key={plan} className={`flex flex-col rounded-2xl p-6 ${yta}`}>
                  <p className="text-sm font-semibold text-[var(--cream)]">{rubrik}</p>
                  <p className="mt-3 text-[34px] leading-none tracking-[-0.03em] text-[var(--cream)]">
                    {price(plan)}
                  </p>
                  <p className="mt-1.5 text-[13px] text-white/60">{enhet}, moms ingår</p>
                  <ul className="mt-5 space-y-2.5 text-[14px] leading-relaxed text-white/75">
                    {rader.map((rad) => (
                      <li key={rad} className="flex gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                        {rad}
                      </li>
                    ))}
                  </ul>
                  <div className="flex-1" />
                  <Link
                    to="/kassa"
                    search={{ plan }}
                    className={`mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg px-6 py-3 text-[15px] font-semibold transition ${knapp}`}
                  >
                    {plan === "1m" ? "Välj per månad" : "Välj 6 månader"}
                  </Link>
                </div>
              ))}
            </div>
            {!loggedIn && (
              <p className="mt-4 text-sm text-white/60">
                Du behöver ett konto för att köpa, så att köpet följer med dig.{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Logga in
                </Link>{" "}
                eller{" "}
                <Link to="/signup" className="font-semibold text-primary hover:underline">
                  skapa ett konto
                </Link>
                .
              </p>
            )}
          </section>
        )}

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-base font-semibold text-[var(--cream)]">Så fungerar det</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-white/70">
            <li>Priset i kassan är det du betalar. Moms ingår och inga avgifter läggs på.</li>
            <li>
              Månadsköpet säger du upp här, med en knapp. Du behöver inte mejla eller förklara
              varför.
            </li>
            <li>
              Efter uppsägningen dras inga fler pengar. Du har kvar tillgången till slutet av den
              månad du redan betalat, och kan ångra dig fram till dess.
            </li>
            <li>En påbörjad månad betalas inte tillbaka.</li>
            <li>Raderar du ditt konto avslutas prenumerationen direkt.</li>
            <li>
              Kvittot kommer på mejl från Stripe, som sköter betalningen. Vi ser aldrig ditt kort.
            </li>
          </ul>
          <p className="mt-4 text-sm text-white/60">
            Allt står också i{" "}
            <Link to="/villkor" className="font-semibold text-primary hover:underline">
              villkoren
            </Link>
            . Frågor om ett köp: mejla{" "}
            <a
              href="mailto:info@tvakommanollan.se?subject=Abonnemang"
              className="font-semibold text-primary hover:underline"
            >
              info@tvakommanollan.se
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
