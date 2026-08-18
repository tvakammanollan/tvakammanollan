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
    if (!enabled) return;
    if (cache) {
      // Cachen kan ha fyllts av en annan komponent efter att den här
      // monterades — modalen slår ju inte på hämtningen förrän den öppnas.
      // Utan det här steget står dess egen state kvar på null för alltid, och
      // resultatet blev en köpknapp som visade priset bredvid en modal som
      // påstod att köp inte var igång.
      setOffer(cache);
      setLoading(false);
      return;
    }
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

/**
 * "Engångsköp · Ingen bindningstid" — men bara när priset faktiskt är ett
 * engångsköp.
 *
 * Härleds ur `offer.interval` i stället för att skrivas i klartext, därför att
 * priset läses ur Stripe vid körning. En hårdkodad rad hade blivit en osanning
 * i samma sekund som produkten fick ett månadspris — och reservvägen
 * (namnuppslag → default_price) har redan en gång pekat på ett återkommande
 * pris utan att någon märkte det. Är priset återkommande säger vi hellre
 * ingenting alls än fel sak.
 */
export function coachingTermsLabel(offer: CoachingOffer | null): string | null {
  if (!offer?.available || offer.amount === null) return null;
  return offer.interval ? null : "Engångsköp · Ingen bindningstid";
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
