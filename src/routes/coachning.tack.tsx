import { createFileRoute, Link } from "@tanstack/react-router";
import { pageTitle } from "@/lib/page-meta";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { confirmCoachingCheckout, type CoachingReceipt } from "@/lib/coaching.functions";
import { formatMoney } from "@/lib/sv-format";
import { trackEvent } from "@/lib/events";
import { stopCoachingPrompts } from "@/lib/coaching-prompt";
import { CoachingScheduler } from "@/components/CoachingScheduler";

/**
 * Kvittosidan efter betalningen.
 *
 * Bokföringen görs egentligen av webhooken — den kommer även om webbläsaren
 * stängs mitt i betalningen. Den här sidan bekräftar mot Stripe en gång till
 * så att köparen ser sitt kvitto direkt, även om webhooken är sen. Båda
 * vägarna är idempotenta.
 *
 * Tiden är normalt redan vald när man landar här: sedan 2026-08-29 väljs den
 * i CoachingModal, före betalningen, med kassan inbäddad i samma ruta.
 * `CoachingScheduler` nedan visar då bara den bokade tiden. Den kan fortfarande
 * öppna en väljare, och det är reservvägen för köp som blivit betalda utan tid
 * (Calendly nere när modalen öppnades). Se `startPaidCoachingBooking`.
 *
 * noindex: sidan finns bara för den som just betalat, och session-id:t i
 * URL:en har inget i ett sökindex att göra.
 */
export const Route = createFileRoute("/coachning/tack")({
  component: TackPage,
  validateSearch: z.object({ session_id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: pageTitle("Tack för ditt köp") },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function TackPage() {
  const { session_id: sessionId } = Route.useSearch();
  const confirmFn = useServerFn(confirmCoachingCheckout);
  const [receipt, setReceipt] = useState<CoachingReceipt | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let alive = true;
    confirmFn({ data: { sessionId } })
      .then((r) => {
        if (!alive) return;
        setReceipt(r);
        // Bara den bekräftelse som faktiskt vände raden räknas — annars blir
        // en omladdning av tacksidan ett extra köp i statistiken.
        if (r.paid && r.firstConfirmation) {
          trackEvent("coaching_purchase_completed", { amount: r.amount, currency: r.currency });
        }
        // Den som köpt ska aldrig se nudgen igen. Läggs vid varje bekräftat
        // köp och inte bara det första: firstConfirmation är falskt vid en
        // omladdning, och räkningen sitter i webbläsaren.
        if (r.paid) stopCoachingPrompts();
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [sessionId, confirmFn]);

  const laddar = !!sessionId && !receipt && !failed;

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:py-28">
      {laddar ? (
        <div aria-busy="true">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-white/60">Bekräftar din betalning…</p>
        </div>
      ) : receipt?.paid ? (
        <>
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <h1
            className="mt-5 text-[30px] font-bold leading-tight text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tack för ditt köp!
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            {receipt.amount !== null && (
              <>
                Vi har tagit emot din betalning på{" "}
                <strong>{formatMoney(receipt.amount, receipt.currency ?? "SEK")}</strong>.{" "}
              </>
            )}
            Kvittot skickas
            {receipt.email ? (
              <>
                {" "}
                till <strong>{receipt.email}</strong>
              </>
            ) : null}{" "}
            från Stripe.
          </p>
          {/* Tiden. Komponenten sköter själv fallen "redan bokad" (normalfallet
              nu när tiden väljs före betalningen), "Calendly är inte påslaget"
              och "något gick fel" — och den öppnar aldrig en väljare utan en
              betald session bakom sig. */}
          {sessionId && <CoachingScheduler sessionId={sessionId} />}
          <Link
            to="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3.5 text-[15px] font-semibold text-on-brand transition hover:brightness-110"
          >
            Tillbaka till träningen
          </Link>
        </>
      ) : (
        <>
          <Mail className="mx-auto h-12 w-12 text-bark" />
          <h1
            className="mt-5 text-[26px] font-bold leading-tight text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Vi hittar ingen slutförd betalning
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            Betalningen kan ha avbrutits, eller så tar den några sekunder till att gå igenom. Ladda
            om sidan, eller mejla{" "}
            <a href="mailto:info@tvakommanollan.se" className="underline">
              info@tvakommanollan.se
            </a>{" "}
            så reder vi ut det. Har pengarna dragits är köpet giltigt oavsett vad som står här.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl border border-[rgba(46,30,20,0.2)] px-7 py-3.5 text-[15px] font-semibold text-[var(--cream)] transition hover:bg-white/5"
          >
            Tillbaka till startsidan
          </Link>
        </>
      )}
    </div>
  );
}
