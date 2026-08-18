import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchCoachingOffer, type CoachingOffer } from "@/lib/coaching.functions";
import { formatMoney } from "@/lib/sv-format";

/**
 * Priset på coachningen, hämtat ur Stripe.
 *
 * Kortet på startsidan, blocket på landningssidan och modalen visar samma
 * belopp och skulle annars fråga tre gånger. Cachen ligger i modulen, alltså
 * per sidladdning: priset ändras i dashboarden och slår igenom vid nästa
 * besök, utan att kosta ett anrop per komponent.
 */
let cache: CoachingOffer | null = null;
let inflight: Promise<CoachingOffer> | null = null;

export function useCoachingOffer(enabled = true): {
  offer: CoachingOffer | null;
  loading: boolean;
} {
  const offerFn = useServerFn(fetchCoachingOffer);
  const [offer, setOffer] = useState<CoachingOffer | null>(cache);
  const [loading, setLoading] = useState(enabled && !cache);

  useEffect(() => {
    if (!enabled || cache) return;
    let alive = true;
    setLoading(true);
    const request = (inflight ??= offerFn());
    request
      .then((data) => {
        cache = data;
        if (alive) setOffer(data);
      })
      .catch(() => {
        // Serverfunktionen svarar med available:false i stället för att kasta;
        // hamnar vi här är nätet nere och då är "inget pris" rätt svar.
        if (alive) setOffer(null);
      })
      .finally(() => {
        inflight = null;
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [enabled, offerFn]);

  return { offer, loading };
}

/** "1 495 kr" eller "249 kr / månad". null när priset inte gick att läsa. */
export function coachingPriceLabel(offer: CoachingOffer | null): string | null {
  if (!offer?.available || offer.amount === null) return null;
  const belopp = formatMoney(offer.amount, offer.currency);
  if (!offer.interval) return belopp;
  const singular = { day: "dag", week: "vecka", month: "månad", year: "år" }[offer.interval];
  const plural = { day: "dagar", week: "veckor", month: "månader", year: "år" }[offer.interval];
  const period = offer.intervalCount === 1 ? singular : `${offer.intervalCount} ${plural}`;
  return `${belopp} / ${period}`;
}
