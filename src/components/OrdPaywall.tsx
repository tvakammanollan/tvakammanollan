import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import { PrimaryCTA, SecondaryCTA } from "@/components/layout/CTAButtons";
import { StripeCheckoutEmbed } from "@/components/StripeCheckoutEmbed";
import { startOrdCheckout, type OrdAccessInfo } from "@/lib/ord-paywall.functions";
import {
  FREE_MEK_LIMIT,
  FREE_ORD_LIMIT,
  planDuration,
  type OrdPlan,
  type PaywallReturnPath,
  type PaywallSubject,
} from "@/lib/ord-paywall";
import { formatMoney } from "@/lib/sv-format";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/telemetry";

/**
 * Rutan som ersätter "Öva"-knappen när de fria orden eller MEK-uppgifterna är
 * slut. Samma köp låser upp båda, så bara rubriken skiljer sig.
 *
 * Två köp, en månad och sex månader, med var sin knapp och var sin produkt i
 * Stripe. `plan` är köpet besökaren redan valt (betalkorten på landningen
 * länkar hit med `?plan=`): då öppnas kassan för just det direkt.
 *
 * Kassan renderas inne i rutan när den publicerbara nyckeln finns, annars
 * skickas köparen till Stripe och kommer tillbaka till `returnTo`. Båda vägarna
 * landar på `?kop=klart`, där sidan bekräftar köpet.
 */
export function OrdPaywall({
  access,
  subject = "ord",
  returnTo = "/ord",
  plan: chosenPlan,
}: {
  access: OrdAccessInfo;
  subject?: PaywallSubject;
  returnTo?: PaywallReturnPath;
  plan?: OrdPlan;
}) {
  const startCheckout = useServerFn(startOrdCheckout);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    trackEvent(subject === "mek" ? "mek_paywall_shown" : "ord_paywall_shown", {
      answered: access.answered,
    });
  }, [access.answered, subject]);

  const [busyPlan, setBusyPlan] = useState<OrdPlan | null>(null);

  const buy = async (plan: OrdPlan) => {
    setBusy(true);
    setBusyPlan(plan);
    setError(null);
    try {
      const handle = await startCheckout({ data: { returnTo, plan } });
      trackEvent(
        subject === "mek" ? "mek_paywall_checkout_started" : "ord_paywall_checkout_started",
        { embedded: handle.clientSecret !== null, plan },
      );
      if (handle.alreadyOwned) {
        window.location.reload();
        return;
      }
      if (handle.clientSecret) setSecret(handle.clientSecret);
      else if (handle.url) window.location.assign(handle.url);
    } catch (e) {
      trackError(e, { where: "ord_checkout" });
      setError(e instanceof Error ? e.message : "Kunde inte öppna kassan.");
    } finally {
      setBusy(false);
      setBusyPlan(null);
    }
  };

  // Valt på förhand: öppna kassan för det köpet så snart priset finns.
  const autoStarted = useRef(false);
  const chosenAvailable = access.plans.some((p) => p.plan === chosenPlan);
  useEffect(() => {
    if (!chosenPlan || !chosenAvailable || access.isAnonymous || autoStarted.current) return;
    autoStarted.current = true;
    void buy(chosenPlan);
    // `buy` byts varje rendering men gör samma sak; körs en gång.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenPlan, chosenAvailable, access.isAnonymous]);

  return (
    <GlassCard className="p-6 sm:p-8">
      <div className="text-center">
        <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-[var(--cream)]">
          {!access.locked
            ? "Lås upp hela ordlistan och MEK"
            : subject === "mek"
              ? `Du har klarat de ${FREE_MEK_LIMIT} gratis MEK-uppgifterna`
              : `Du har klarat de ${FREE_ORD_LIMIT} gratis orden`}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-white/65">
          Lås upp hela ordlistan och all MEK-övning i en månad eller sex. Priset är med moms, du
          betalar en gång och ingenting förnyas automatiskt.
        </p>
      </div>

      {secret && access.publishableKey ? (
        <div className="mt-6">
          <StripeCheckoutEmbed
            clientSecret={secret}
            publishableKey={access.publishableKey}
            onError={(msg) => {
              setSecret(null);
              setError(msg);
            }}
          />
        </div>
      ) : access.isAnonymous ? (
        <div className="mt-6 text-center">
          <p className="text-sm text-white/65">
            Skapa ett konto först, så följer köpet med dig om du byter enhet.
          </p>
          <Link
            to="/signup"
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-[var(--on-brand)] transition hover:brightness-110"
          >
            Skapa konto
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {access.plans.length === 0 ? (
            <PrimaryCTA disabled className="w-full">
              Köp är inte tillgängligt just nu
            </PrimaryCTA>
          ) : (
            access.plans.map((p) => {
              // Det förvalda köpet, annars det längre, bär primärfärgen.
              const primary = p.plan === (chosenPlan ?? "6m");
              const Cta = primary ? PrimaryCTA : SecondaryCTA;
              return (
                <Cta
                  key={p.plan}
                  onClick={() => void buy(p.plan)}
                  disabled={busy}
                  className="w-full"
                >
                  {busyPlan === p.plan ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    `${planDuration(p.plan).replace(/^./, (c) => c.toUpperCase())}, ${formatMoney(p.amount, access.currency)}`
                  )}
                </Cta>
              );
            })
          )}
          {error && (
            <p role="alert" className="mt-3 text-center text-sm text-[var(--destructive)]">
              {error}
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}
