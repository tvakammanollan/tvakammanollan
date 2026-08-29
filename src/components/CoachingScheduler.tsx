import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck2, CalendarClock, Loader2 } from "lucide-react";
import {
  attachPaidCoachingBooking,
  startPaidCoachingBooking,
  type CoachingBookingStart,
} from "@/lib/coaching.functions";
import { CALENDLY_ORIGIN, readCalendlyMessage } from "@/lib/calendly-embed";
import { formatDateLong, formatTime } from "@/lib/sv-format";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/telemetry";

/* =====================================================================
   Tidsvalet på tacksidan — RESERVEN, inte normalvägen.

   Tiden väljs numera i CoachingModal, före betalningen. Den här komponenten
   finns för de köp som ändå blir betalda utan tid: Calendly kan ha varit
   nere när modalen öppnades, och då gick köpet rakt till kassan. Har raden
   redan en tid visar den bara den, vilket är vad de allra flesta ser här.

   Calendly bäddas in som en vanlig iframe, utan deras widget.js: det enda
   scriptet gör är att lyssna på postMessage, vilket vi gör själva nedan.
   Därmed öppnas bara `frame-src` i CSP:n, inte `script-src`.

   Vad som händer inne i iframen läses ur Calendlys egna meddelanden.
   `calendar_viewed` skiljer "väljaren laddade" från en trasig event-typ-slug
   (den är en känd tyst felkälla — byts slugen i Calendly laddar iframen en
   404-sida utan att något loggas), och `time_selected` skiljer "tittade på
   tiderna" från "valde en".
   ===================================================================== */

type Läge = "laddar" | "valj" | "bokad" | "av" | "fel";

export function CoachingScheduler({ sessionId }: { sessionId: string }) {
  const startFn = useServerFn(startPaidCoachingBooking);
  const completeFn = useServerFn(attachPaidCoachingBooking);

  const [läge, setLäge] = useState<Läge>("laddar");
  const [start, setStart] = useState<CoachingBookingStart | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [fel, setFel] = useState<string | null>(null);

  /**
   * Calendly skickar ibland samma `event_scheduled` mer än en gång, och
   * `event_type_viewed` varje gång väljaren byter vy. Utan spärrarna räknas
   * en bokning som två och mätningen blir obrukbar.
   */
  const hanterad = useRef<string | null>(null);
  const rapporterad = useRef({ kalender: false, tidsval: false });
  const startad = useRef(false);

  useEffect(() => {
    if (startad.current) return;
    startad.current = true;
    (async () => {
      try {
        const res = (await startFn({ data: { sessionId } })) as CoachingBookingStart;
        setStart(res);
        if (res.scheduledAt) {
          setScheduledAt(res.scheduledAt);
          setLäge("bokad");
        } else if (res.reason === "ok" && res.schedulingUrl) {
          setLäge("valj");
          trackEvent("coaching_booking_opened", { source: "dashboard", scheduling: true });
        } else {
          // "av" (Calendly inte påslaget) och "obetald" ser likadana ut för
          // köparen: vi hör av oss manuellt. Skillnaden syns i loggen.
          setLäge("av");
        }
      } catch {
        setLäge("fel");
        setFel("Vi kunde inte öppna tidsvalet just nu.");
      }
    })();
  }, [sessionId, startFn]);

  useEffect(() => {
    if (läge !== "valj" || !start?.schedulingUrl || !start.requestId) return;
    const requestId = start.requestId;
    const lyssnare = (e: MessageEvent) => {
      if (e.origin !== CALENDLY_ORIGIN) return;
      const msg = readCalendlyMessage(e.data);
      if (!msg) return;

      if (msg.kind === "calendar_viewed") {
        if (rapporterad.current.kalender) return;
        rapporterad.current.kalender = true;
        trackEvent("coaching_calendar_viewed", { source: "dashboard" });
        return;
      }
      if (msg.kind === "time_selected") {
        if (rapporterad.current.tidsval) return;
        rapporterad.current.tidsval = true;
        trackEvent("coaching_time_selected", { source: "dashboard" });
        return;
      }

      const nyckel = msg.inviteeUri ?? "utan-uri";
      if (hanterad.current === nyckel) return;
      hanterad.current = nyckel;
      trackEvent("coaching_time_booked", { source: "dashboard" });

      if (!msg.inviteeUri) {
        // Tiden ÄR bokad, men utan invitee-URI går den inte att slå upp och
        // därmed inte att skriva på raden. Säg det hellre än att låta köparen
        // sitta kvar i en kalender som ser klar ut.
        trackError("calendly: event_scheduled utan invitee-uri", { source: "tacksidan" });
        setLäge("fel");
        setFel("Vi fick inte tillbaka din bokningsreferens.");
        return;
      }

      void (async () => {
        try {
          const res = (await completeFn({
            data: { requestId, inviteeUri: msg.inviteeUri!, sessionId },
          })) as { scheduledAt: string | null };
          setScheduledAt(res.scheduledAt);
          setLäge("bokad");
        } catch {
          // Tiden är bokad hos Calendly även om vi inte lyckades skriva den.
          setLäge("fel");
          setFel("Din tid är bokad, men vi kunde inte spara den hos oss.");
        }
      })();
    };
    window.addEventListener("message", lyssnare);
    return () => window.removeEventListener("message", lyssnare);
  }, [läge, start, completeFn, sessionId]);

  if (läge === "laddar") {
    return (
      <div className="mt-8 rounded-2xl border border-[rgba(46,30,20,0.16)] p-8" aria-busy="true">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#ae2f26]" />
        <p className="mt-3 text-sm text-white/60">Hämtar lediga tider…</p>
      </div>
    );
  }

  if (läge === "bokad") {
    return (
      <div className="mt-8 rounded-2xl border border-[#2f6b3c]/30 bg-[#2f6b3c]/[0.07] p-6 text-left">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#2f6b3c]">
          <CalendarCheck2 className="h-4 w-4" aria-hidden />
          Din tid är bokad
        </p>
        {scheduledAt && (
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">
            Vi ses <strong>{formatDateLong(scheduledAt)}</strong> kl{" "}
            <strong>{formatTime(scheduledAt)}</strong>. En kalenderinbjudan med länk kommer från
            Calendly.
          </p>
        )}
      </div>
    );
  }

  if (läge === "av") {
    return (
      <p className="mt-6 text-[15px] leading-relaxed text-white/70">
        Vi hör av oss inom <strong>24 timmar</strong> för att boka in ditt samtal.
      </p>
    );
  }

  if (läge === "fel") {
    return (
      <div className="mt-8 rounded-2xl border border-[rgba(46,30,20,0.16)] p-6 text-left">
        <p className="text-[15px] leading-relaxed text-white/70">{fel}</p>
        <p className="mt-3 text-xs text-white/50">
          Mejla{" "}
          <a href="mailto:info@tvakommanollan.se" className="underline">
            info@tvakommanollan.se
          </a>{" "}
          så tar vi det därifrån. Ditt köp är genomfört oavsett vad som står här.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 text-left">
      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--cream)]">
        <CalendarClock className="h-4 w-4 text-[#ae2f26]" aria-hidden />
        Välj en tid som passar dig
      </p>
      <iframe
        src={start!.schedulingUrl!}
        title="Välj en tid för din coachning"
        className="mt-3 h-[65vh] min-h-[460px] w-full rounded-xl border border-[rgba(46,30,20,0.16)]"
      />
    </div>
  );
}
