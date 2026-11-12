import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Check, CheckCircle2, Loader2 } from "lucide-react";
import { pageTitle } from "@/lib/page-meta";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/layout/GlassCard";
import { PrimaryCTA } from "@/components/layout/CTAButtons";
import { StripeCheckoutEmbed } from "@/components/StripeCheckoutEmbed";
import {
  confirmOrdCheckout,
  getOrdAccess,
  startOrdCheckout,
  type OrdAccessInfo,
} from "@/lib/ord-paywall.functions";
import { ORD_PLAN_IDS, planDuration, type OrdPlan } from "@/lib/ord-paywall";
import { clearPendingPlan, rememberPendingPlan } from "@/lib/pending-plan";
import { formatMoney } from "@/lib/sv-format";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/telemetry";

/**
 * Kassan för Hela Ordlistan + MEK. Betalkorten på landningen och /pris
 * länkar hit med `?plan=1m|6m`, och sidan öppnar Stripes inbäddade kassa för
 * just det köpet direkt. Köpet kräver inte att gratisorden eller
 * gratis-MEK:en är slut; det gör bara spärren i övningsläget.
 *
 * Kassan tar tillbaka köparen hit (`?kop=klart&session_id=…`), där köpet
 * bekräftas mot Stripe som reserv för webhooken.
 *
 * noindex: sidan är en kassa, inte innehåll.
 */
export const Route = createFileRoute("/kassa")({
  component: KassaPage,
  validateSearch: z.object({
    plan: z.enum(["1m", "6m"]).optional().catch(undefined),
    kop: z.string().optional(),
    session_id: z.string().optional(),
  }),
  head: () => ({
    meta: [{ title: pageTitle("Kassan") }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

/** Färgerna följer betalkorten: orange för en månad, lila för 6 månader. */
const PLAN_STYLE: Record<OrdPlan, { vald: string; ikon: string }> = {
  "1m": { vald: "border-terracotta bg-terracotta/15", ikon: "text-[var(--cream)]" },
  "6m": { vald: "border-plum bg-lavender", ikon: "text-[var(--plum)]" },
};

const INGAR = [
  "Över 10 000 ord i träningsläget",
  "Alla MEK-uppgifter, arkivets och våra egna",
  "Moms ingår, inget läggs på i kassan",
  "Engångsköp, ingenting förnyas automatiskt",
];

function KassaPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fetchAccess = useServerFn(getOrdAccess);
  const startCheckout = useServerFn(startOrdCheckout);
  const confirmPurchase = useServerFn(confirmOrdCheckout);

  const plan: OrdPlan = search.plan ?? "6m";
  const returning = search.kop === "klart" && !!search.session_id;

  const [access, setAccess] = useState<OrdAccessInfo | null>(null);
  const [accessFailed, setAccessFailed] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Höjs av "Försök igen" så att kassan öppnas på nytt. */
  const [attempt, setAttempt] = useState(0);
  const [confirmed, setConfirmed] = useState<"pending" | "ok" | "failed" | null>(
    returning ? "pending" : null,
  );

  const isGuest = !authLoading && (!user || access?.isAnonymous === true);

  // Utloggad eller gäst: kom ihåg valet, så att login och onboarding skickar
  // tillbaka hit i stället för till startsidan.
  useEffect(() => {
    if (authLoading) return;
    if (isGuest) rememberPendingPlan(plan);
    else if (user) clearPendingPlan();
  }, [authLoading, isGuest, user, plan]);

  useEffect(() => {
    if (authLoading || !user) return;
    setAccessFailed(false);
    void fetchAccess({})
      .then(setAccess)
      .catch((e) => {
        trackError(e, { where: "kassa_access" });
        setAccessFailed(true);
      });
  }, [authLoading, user, fetchAccess]);

  // Tillbaka från Stripe: bekräfta köpet.
  const confirmedRef = useRef(false);
  useEffect(() => {
    if (!returning || authLoading || !user || confirmedRef.current) return;
    confirmedRef.current = true;
    void confirmPurchase({ data: { sessionId: search.session_id! } })
      .then((r) => {
        setConfirmed(r.owned ? "ok" : "failed");
        if (r.owned) trackEvent("ord_purchase_completed", { via: "return" });
      })
      .catch(() => setConfirmed("failed"));
  }, [returning, authLoading, user, confirmPurchase, search.session_id]);

  // Öppna kassan för valt köp så snart priset finns. Ett byte av plan ger en
  // ny session; den gamla går ut av sig själv hos Stripe.
  const openedFor = useRef<string | null>(null);
  const canBuy =
    access !== null &&
    !access.owned &&
    !access.isAnonymous &&
    access.plans.some((p) => p.plan === plan);
  useEffect(() => {
    const key = `${plan}:${attempt}`;
    if (returning || !canBuy || openedFor.current === key) return;
    openedFor.current = key;
    setSecret(null);
    setError(null);
    setBusy(true);
    void startCheckout({ data: { returnTo: "/kassa", plan } })
      .then((handle) => {
        trackEvent("ord_paywall_checkout_started", {
          embedded: handle.clientSecret !== null,
          plan,
        });
        if (handle.alreadyOwned) {
          void fetchAccess({}).then(setAccess);
          return;
        }
        if (handle.clientSecret) setSecret(handle.clientSecret);
        else if (handle.url) window.location.assign(handle.url);
      })
      .catch((e) => {
        trackError(e, { where: "kassa_checkout" });
        setError(e instanceof Error ? e.message : "Kunde inte öppna kassan.");
      })
      .finally(() => setBusy(false));
  }, [returning, canBuy, plan, attempt, startCheckout, fetchAccess]);

  const choose = (p: OrdPlan) => {
    if (p === plan) return;
    void navigate({ to: "/kassa", search: { plan: p }, replace: true });
  };

  const price = (p: OrdPlan) => {
    const found = access?.plans.find((x) => x.plan === p);
    if (found) return formatMoney(found.amount, access?.currency ?? "SEK");
    return p === "1m" ? "149 kr" : "349 kr";
  };

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:pt-14">
        <h1 className="text-[32px] leading-tight tracking-[-0.035em] sm:text-[44px]">
          Hela ordlistan och MEK
        </h1>
        <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-white/70">
          Välj hur länge du vill ha tillgång och betala direkt här. Du behöver inte ha använt upp
          gratisorden först.
        </p>

        {returning ? (
          <GlassCard className="mt-8 p-6 text-center sm:p-10">
            {confirmed === "ok" ? (
              <>
                <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden />
                <h2 className="mt-4 text-2xl font-semibold">Tack! Allt är upplåst</h2>
                <p className="mx-auto mt-2 max-w-md text-[15px] text-white/65">
                  Hela ordlistan och all MEK-övning är ditt nu. Kvittot kommer på mejlen från
                  Stripe.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <PrimaryCTA to="/ord">Öva ord</PrimaryCTA>
                  <PrimaryCTA to="/mek-ovning">Öva MEK</PrimaryCTA>
                </div>
              </>
            ) : confirmed === "failed" ? (
              <>
                <h2 className="text-xl font-semibold">Vi kunde inte bekräfta köpet ännu</h2>
                <p className="mx-auto mt-2 max-w-md text-[15px] text-white/65">
                  Har du betalat låses allt upp inom någon minut. Ladda om sidan, eller hör av dig
                  till info@tvakommanollan.se om det dröjer.
                </p>
              </>
            ) : (
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/55" aria-hidden />
            )}
          </GlassCard>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            <div className="space-y-3">
              {ORD_PLAN_IDS.map((p) => {
                const vald = p === plan;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => choose(p)}
                    aria-pressed={vald}
                    className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition ${
                      vald ? PLAN_STYLE[p].vald : "border-white/10 bg-card hover:border-white/25"
                    }`}
                  >
                    <span>
                      <span className="block text-[17px] font-semibold">
                        {planDuration(p).replace(/^./, (c) => c.toUpperCase())}
                      </span>
                      <span className="text-[13px] text-white/60">inklusive moms</span>
                    </span>
                    <span className="text-[22px] tracking-[-0.02em]">{price(p)}</span>
                  </button>
                );
              })}
              <ul className="space-y-2.5 pt-3 text-[14px] text-white/70">
                {INGAR.map((rad) => (
                  <li key={rad} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    {rad}
                  </li>
                ))}
              </ul>
            </div>

            <GlassCard className="min-h-[320px] p-4 sm:p-6">
              {authLoading || (user && !access && !accessFailed) ? (
                <Spinnerruta />
              ) : isGuest ? (
                <div className="py-10 text-center">
                  <h2 className="text-xl font-semibold">Skapa ett konto för att köpa</h2>
                  <p className="mx-auto mt-2 max-w-md text-[15px] text-white/65">
                    Köpet knyts till ditt konto så att det följer med dig mellan enheter. När du är
                    inloggad kommer du tillbaka hit till kassan.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <PrimaryCTA to="/signup">Skapa konto</PrimaryCTA>
                    <Link
                      to="/login"
                      className="inline-flex min-h-[44px] items-center px-4 text-sm font-semibold text-white/70 transition hover:text-[var(--cream)]"
                    >
                      Logga in
                    </Link>
                  </div>
                </div>
              ) : access?.owned ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden />
                  <h2 className="mt-4 text-xl font-semibold">
                    Du har redan hela ordlistan och MEK
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-[15px] text-white/65">
                    Ditt konto har ett köp som gäller, så det finns inget att betala.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <PrimaryCTA to="/ord">Öva ord</PrimaryCTA>
                    <PrimaryCTA to="/mek-ovning">Öva MEK</PrimaryCTA>
                  </div>
                </div>
              ) : secret && access?.publishableKey ? (
                <StripeCheckoutEmbed
                  key={secret}
                  clientSecret={secret}
                  publishableKey={access.publishableKey}
                  onError={(msg) => {
                    setSecret(null);
                    setError(msg);
                  }}
                />
              ) : error || accessFailed || (access && !canBuy) ? (
                <div className="py-10 text-center">
                  <p role="alert" className="text-[15px] text-[var(--destructive)]">
                    {error ?? "Kassan går inte att öppna just nu. Försök igen om en stund."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      if (!access || accessFailed) {
                        setAccessFailed(false);
                        void fetchAccess({})
                          .then(setAccess)
                          .catch(() => setAccessFailed(true));
                      }
                      setAttempt((n) => n + 1);
                    }}
                    className="mt-4 inline-flex min-h-[44px] items-center rounded-lg border border-white/25 px-5 text-sm font-semibold transition hover:bg-secondary"
                  >
                    Försök igen
                  </button>
                </div>
              ) : busy || !secret ? (
                <Spinnerruta />
              ) : null}
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  );
}

function Spinnerruta() {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-white/55" aria-label="Öppnar kassan" />
    </div>
  );
}
