import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock } from "lucide-react";
import { GlassCard } from "@/components/layout/GlassCard";
import { PrimaryCTA } from "@/components/layout/CTAButtons";
import { StripeCheckoutEmbed } from "@/components/StripeCheckoutEmbed";
import { startOrdCheckout, type OrdAccessInfo } from "@/lib/ord-paywall.functions";
import { FREE_ORD_LIMIT } from "@/lib/ord-paywall";
import { formatMoney } from "@/lib/sv-format";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/telemetry";

/**
 * Rutan som ersätter "Öva"-knappen när de fria orden är slut.
 *
 * Kassan renderas inne i rutan när den publicerbara nyckeln finns, annars
 * skickas köparen till Stripe och kommer tillbaka till /ord. Båda vägarna
 * landar på `?kop=klart`, där sidan bekräftar köpet.
 */
export function OrdPaywall({ access }: { access: OrdAccessInfo }) {
  const startCheckout = useServerFn(startOrdCheckout);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    trackEvent("ord_paywall_shown", { answered: access.answered });
  }, [access.answered]);

  const price = access.amount !== null ? formatMoney(access.amount, access.currency) : null;

  const buy = async () => {
    setBusy(true);
    setError(null);
    try {
      const handle = await startCheckout({});
      trackEvent("ord_paywall_checkout_started", { embedded: handle.clientSecret !== null });
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
    }
  };

  return (
    <GlassCard className="p-6 sm:p-8">
      <div className="text-center">
        <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-[var(--cream)]">
          Du har klarat de {FREE_ORD_LIMIT} gratis orden
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-white/65">
          Lås upp hela ordlistan med ett engångsköp{price ? ` på ${price}` : ""}. Inga
          prenumerationer, och den är din för alltid.
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
        <div className="mt-6">
          <PrimaryCTA
            onClick={() => void buy()}
            disabled={busy || access.amount === null}
            className="w-full"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : price ? (
              `Lås upp hela ordlistan · ${price}`
            ) : (
              "Köp är inte tillgängligt just nu"
            )}
          </PrimaryCTA>
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
