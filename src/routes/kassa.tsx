import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Check, CheckCircle2, Loader2 } from "lucide-react";
import { pageTitle } from "@/lib/page-meta";
import { supabase } from "@/integrations/supabase/client";
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
import { ORD_PLAN_IDS, POPULAR_PLAN, type OrdPlan } from "@/lib/ord-paywall";
import { OrdPurchaseCard } from "@/components/OrdPurchaseCard";
import { PremiumWelcome } from "@/components/PremiumWelcome";
import { SaveGuestPurchase, type SaveGuestOutcome } from "@/components/SaveGuestPurchase";
import { clearPendingPlan, rememberPendingPlan } from "@/lib/pending-plan";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { isAutoUsername } from "@/lib/username";
import { formatMoney } from "@/lib/sv-format";
import { isCrawler } from "@/lib/in-app-browser";
import { announcePremiumChanged } from "@/lib/guest-claim";
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
 * Inget konto krävs för att betala (sedan 2026-11-25). En utloggad besökare
 * får ett gästkonto i tysthet, som /matchmaking ger, och köpet knyts till
 * det. Efter betalningen ber `SaveGuestPurchase` om kontot: gästen görs om
 * till ett riktigt konto med samma id, eller loggar in och köpet flyttas.
 * Att kräva ett konto före betalningen var det som stod mellan "Välj
 * 6 månader" och kassan, och det tog fler steg än själva köpet.
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
  "Alla gamla prov att skriva på tid, med rättning och poäng",
  "Över 10 000 ord i träningsläget",
  "Alla MEK-uppgifter, arkivets och våra egna",
  "Moms ingår, inget läggs på i kassan",
];

/**
 * Vad köpet binder en till. Står först i listan, så att det syns innan man
 * betalar. "Ingen bindningstid" står redan på planknappen; samma rad tre
 * gånger på en skärm läste som att vi försökte övertyga.
 */
const VILLKORSRADER: Record<OrdPlan, string[]> = {
  "1m": ["Förnyas varje månad tills du säger upp, vilket du gör under Abonnemang i menyn"],
  "6m": ["Engångsköp som inte förnyas"],
};

/** Planknappens rubrik och underrad. */
const PLAN_TEXT: Record<OrdPlan, { rubrik: string; under: string }> = {
  "1m": { rubrik: "Per månad", under: "Mest populär. Ingen bindningstid" },
  "6m": { rubrik: "6 månader", under: "Engångsköp, ingen bindningstid" },
};

function KassaPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const fetchAccess = useServerFn(getOrdAccess);
  const startCheckout = useServerFn(startOrdCheckout);
  const confirmPurchase = useServerFn(confirmOrdCheckout);

  // Utan plan i länken är månadsköpet förvalt (Niklas beslut 2026-11-17):
  // kampanjkoden för gratismånaden gäller bara den produkten, och en länk
  // utan `?plan=` hade annars öppnat sexmånadersköpet där koden avvisas.
  const plan: OrdPlan = search.plan ?? POPULAR_PLAN;
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

  /** Adressen från Stripes kassa, till kontoformuläret efter ett köp som gäst. */
  const [purchaseEmail, setPurchaseEmail] = useState<string | null>(null);
  /**
   * Steget efter ett köp som gäst. Bestäms när köpet bekräftats och lever
   * sedan oberoende av inloggningen: den som loggar in i steget byter konto
   * mitt i, och steget får inte försvinna innan köpet hunnit flyttas.
   */
  const [saveStep, setSaveStep] = useState<"show" | "done">("done");
  const [saveOutcome, setSaveOutcome] = useState<SaveGuestOutcome | "skipped" | null>(null);
  /** Gästkontot åt en utloggad besökare. `failed`: visa kontovägarna i stället. */
  const [guestStart, setGuestStart] = useState<"idle" | "starting" | "failed">("idle");

  // Gäst och inte utloggad: `isGuestUser` räknar också konton utan adress,
  // och kassan ska bara behandla gästkonton som gäster.
  const isGuest = !!user && user.is_anonymous === true;

  // Utloggad eller gäst: kom ihåg valet, så att login och onboarding skickar
  // tillbaka hit om besökaren väljer att logga in före köpet. Tömms när köpet
  // är gjort, annars hade varje senare inloggning landat i kassan.
  useEffect(() => {
    if (authLoading || returning) return;
    if (access?.owned) clearPendingPlan();
    else if (!user || isGuest) rememberPendingPlan(plan);
    else clearPendingPlan();
  }, [authLoading, returning, isGuest, user, plan, access?.owned]);

  // Utloggad: skapa ett gästkonto så att kassan kan öppnas direkt. Robotar
  // som kör sidans skript får inget; de ser kontovägarna.
  useEffect(() => {
    if (authLoading || user || returning || guestStart !== "idle") return;
    if (isCrawler(navigator.userAgent)) {
      setGuestStart("failed");
      return;
    }
    setGuestStart("starting");
    // Inget username i metadatan, se useGuestPlay: namnen är unika och
    // gästnamnen för få. Triggern sätter ett auto-namn.
    void supabase.auth
      .signInAnonymously()
      .then(({ error: guestError }) => {
        if (guestError) {
          trackError(guestError, { where: "kassa_guest_start" });
          setGuestStart("failed");
        }
      })
      .catch((e) => {
        trackError(e, { where: "kassa_guest_start" });
        setGuestStart("failed");
      });
  }, [authLoading, user, returning, guestStart]);

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

  // Tillbaka från Stripe: bekräfta köpet. Utan session går det inte: köpet
  // hör till kontot som betalade, och det är inte inloggat i den här
  // webbläsaren. Då visas reservtexten med vart man mejlar.
  const confirmedRef = useRef(false);
  useEffect(() => {
    if (!returning || authLoading || confirmedRef.current) return;
    confirmedRef.current = true;
    if (!user) {
      setConfirmed("failed");
      return;
    }
    const boughtAsGuest = user.is_anonymous === true;
    void confirmPurchase({ data: { sessionId: search.session_id! } })
      .then((r) => {
        setConfirmed(r.owned ? "ok" : "failed");
        if (!r.owned) return;
        trackEvent("ord_purchase_completed", { via: "return", is_guest: boughtAsGuest });
        clearPendingPlan();
        announcePremiumChanged();
        if (boughtAsGuest) {
          setPurchaseEmail(r.email);
          setSaveStep("show");
        }
      })
      .catch(() => setConfirmed("failed"));
  }, [returning, authLoading, user, confirmPurchase, search.session_id]);

  // Öppna kassan för valt köp så snart priset finns. Ett byte av plan ger en
  // ny session; den gamla går ut av sig själv hos Stripe.
  const openedFor = useRef<string | null>(null);
  const canBuy = access !== null && !access.owned && access.plans.some((p) => p.plan === plan);
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
          is_guest: access?.isAnonymous === true,
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
  }, [returning, canBuy, plan, attempt, startCheckout, fetchAccess, access?.isAnonymous]);

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
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:pt-14">
        {returning && confirmed === "ok" && saveStep === "show" ? (
          <SaveGuestPurchase
            defaultEmail={purchaseEmail}
            onDone={(outcome) => {
              setSaveOutcome(outcome);
              setSaveStep("done");
            }}
            onSkip={() => {
              setSaveOutcome("skipped");
              setSaveStep("done");
            }}
          />
        ) : returning ? (
          <PremiumWelcome
            state={confirmed ?? "pending"}
            needsUsername={!isGuest && !!profile && isAutoUsername(profile.username)}
            guestUnsaved={isGuest}
            claimConflict={saveOutcome === "conflict"}
          />
        ) : (
          <>
            <h1 className="text-[28px] leading-tight tracking-[-0.035em] sm:text-[44px]">
              Premium: allt på Tvåkommanollan
            </h1>
            {/* Ingressen göms på mobil: listan under kassan säger samma sak, och
            på en telefon ska planvalet och kassan synas utan skroll. */}
            <p className="mt-3 hidden max-w-xl text-[16px] leading-relaxed text-white/70 sm:block">
              Alla gamla prov, hela ordlistan och alla MEK-uppgifter. Välj hur länge du vill ha
              tillgång och betala direkt här.
            </p>
            {/* Ordningen i DOM:en är mobilens: planval, kassan, sedan vad som ingår. På
                dator lägger gridden kassan i högerkolumnen över båda raderna, och planval
                och lista står till vänster som förut. */}
            <div className="mt-5 grid gap-5 sm:mt-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-6 lg:gap-y-3">
              <div className="space-y-2.5 sm:space-y-3 lg:col-start-1 lg:row-start-1">
                {ORD_PLAN_IDS.map((p) => {
                  const vald = p === plan;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => choose(p)}
                      aria-pressed={vald}
                      className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition sm:px-5 sm:py-4 ${
                        vald ? PLAN_STYLE[p].vald : "border-white/10 bg-card hover:border-white/25"
                      }`}
                    >
                      <span>
                        <span className="block text-[17px] font-semibold">
                          {PLAN_TEXT[p].rubrik}
                        </span>
                        <span className="text-[13px] text-white/60">{PLAN_TEXT[p].under}</span>
                      </span>
                      <span className="text-[22px] tracking-[-0.02em]">{price(p)}</span>
                    </button>
                  );
                })}
              </div>

              <GlassCard className="min-h-[280px] p-4 sm:min-h-[320px] sm:p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                {/* Gästen kan ha ett konto sedan tidigare. Loggar den in nu hamnar
                    köpet där direkt; gör den det efter köpet flyttas det dit. */}
                {isGuest && access && !access.owned && (
                  <p className="mb-3 text-center text-[13px] text-white/60">
                    Har du redan ett konto?{" "}
                    <Link to="/login" className="font-semibold text-primary hover:underline">
                      Logga in
                    </Link>{" "}
                    först, så hamnar köpet där direkt.
                  </p>
                )}
                {authLoading ||
                (!user && guestStart !== "failed") ||
                (user && !access && !accessFailed) ? (
                  <Spinnerruta />
                ) : !user ? (
                  <div className="py-6 text-center sm:py-10">
                    <h2 className="text-xl font-semibold">Skapa ett konto för att köpa</h2>
                    <p className="mx-auto mt-2 max-w-md text-[15px] text-white/65">
                      Kassan gick inte att öppna utan konto just nu. Skapa ett konto eller logga in,
                      så kommer du tillbaka hit och kan betala direkt.
                    </p>
                    {/* Google direkt här: ett tryck i stället för att gå via
                      registreringssidan. Valet av köp är redan sparat
                      (`rememberPendingPlan`), så returen hamnar i kassan. */}
                    <div className="mx-auto mt-6 max-w-sm">
                      <GoogleButton />
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      <PrimaryCTA to="/signup">Skapa konto med e-post</PrimaryCTA>
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
                    <h2 className="mt-4 text-xl font-semibold">Du har redan Premium</h2>
                    <OrdPurchaseCard className="mx-auto mt-6 max-w-md text-left" manageLink />
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

              <ul className="space-y-2.5 text-[14px] text-white/70 lg:col-start-1 lg:row-start-2">
                {[...VILLKORSRADER[plan], ...INGAR].map((rad) => (
                  <li key={rad} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    {rad}
                  </li>
                ))}
              </ul>
            </div>
          </>
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
