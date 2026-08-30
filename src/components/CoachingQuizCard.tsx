import { useCallback, useMemo, useRef, useState } from "react";
import { m } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Loader2, Send, Sparkles } from "lucide-react";
import { EyebrowLabel } from "@/components/layout/EyebrowLabel";
import { useAuth } from "@/hooks/useAuth";
import { useImpression } from "@/hooks/useImpression";
import { trackEvent } from "@/lib/events";
import { submitCoachingLead } from "@/lib/coaching-leads.functions";
import { QUIZ_STEPS, quizComplete, quizOutcome, type QuizAnswers } from "@/lib/coaching-quiz";
import { formatPhone, normalizePhone } from "@/lib/phone";

/* =====================================================================
   "Är studieupplägget något för dig?" — kvalificering + återuppringning.

   Ligger under Dagens ord i dashboardens vänsterspalt och är avsiktligt
   INTE en modal: den som är osäker klickar inte upp en dialog, men svarar
   gärna på en fråga som redan står på skärmen. Formuläret byter därför
   innehåll på plats, i samma ruta.

   Två frågor, och alla svar leder vidare — se coaching-quiz.ts för varför.
   Det som skiljer vägarna åt är sammanfattningen, som formuleras ur
   svaren så att samtalet efteråt börjar någonstans.

   Bredden är det svåra: spalten är 288 px på lg. Allt här är därför
   staplat i en kolumn och testat i den bredden.
   ===================================================================== */

type Phase = "teaser" | "q1" | "q2" | "form" | "done";

const SOURCE = "dashboard" as const;

export function CoachingQuizCard() {
  const { user } = useAuth();
  const submit = useServerFn(submitCoachingLead);

  const [phase, setPhase] = useState<Phase>("teaser");
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  // E-post och meddelande är frivilliga. Numret är fortfarande det enda som
  // krävs — produkten är ett telefonsamtal — men går personen inte att nå på
  // telefon fanns tidigare ingen andra väg alls, och den som har något
  // specifikt att berätta hade ingenstans att skriva det.
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [savedPhone, setSavedPhone] = useState<string | null>(null);

  const seen = useImpression<HTMLDivElement>(
    useCallback(() => trackEvent("coaching_quiz_viewed", { source: SOURCE }), []),
  );

  const outcome = useMemo(() => quizOutcome(answers), [answers]);
  const phoneRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setPhase("q1");
    trackEvent("coaching_quiz_started", { source: SOURCE });
  };

  const answer = (stepIndex: number, value: string) => {
    const step = QUIZ_STEPS[stepIndex];
    const next = { ...answers, [step.id]: value };
    setAnswers(next);
    trackEvent("coaching_quiz_answered", { source: SOURCE, step: stepIndex + 1, value });

    if (stepIndex === 0) {
      setPhase("q2");
      return;
    }
    // Sammanfattningen kräver båda svaren. quizComplete och inte "vi är på
    // sista steget": går man bakåt och ändrar ska kortet inte kunna hamna i
    // ett läge där texten bygger på ett svar som inte finns.
    if (quizComplete(next)) {
      setPhase("form");
      trackEvent("coaching_quiz_qualified", { source: SOURCE });
      // Fältet får fokus först när rutan bytt innehåll, annars hoppar sidan.
      requestAnimationFrame(() => phoneRef.current?.focus());
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Samma validering som servern kör, men här för att svaret ska komma
    // direkt. Servern är den som räknas — den här är bekvämlighet.
    const parsed = normalizePhone(phone);
    if (!parsed.ok) {
      setError(parsed.error ?? "Numret ser inte ut att stämma.");
      phoneRef.current?.focus();
      return;
    }
    // Frivilligt fält, men ett ifyllt fält ska vara rätt ifyllt: en felstavad
    // adress är sämre än ingen, eftersom den ser ut som en väg att nå någon.
    if (email.trim() && !/^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(email.trim())) {
      setError("E-postadressen ser inte ut att stämma.");
      return;
    }
    if (!quizComplete(answers)) {
      setError("Svara på båda frågorna först.");
      setPhase("q1");
      return;
    }

    setPending(true);
    try {
      const res = await submit({
        data: {
          phone,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim() || undefined,
          answers: { forsok: answers.forsok!, hinder: answers.hinder! },
          source: SOURCE,
        },
      });
      setSavedPhone(res.phone);
      setPhase("done");
      trackEvent("coaching_lead_submitted", {
        source: SOURCE,
        is_guest: !!user?.is_anonymous,
      });
    } catch (err) {
      // Serverns felmeddelanden är skrivna för att visas (fel nummer,
      // rate limit). Är det något annat får användaren den generiska texten.
      const msg = err instanceof Error ? err.message : "";
      setError(msg && msg.length < 160 ? msg : "Det gick inte att skicka just nu. Försök igen.");
      trackEvent("coaching_lead_failed", { source: SOURCE });
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      ref={seen}
      className="rounded-2xl border border-success/25 bg-success/[0.06] p-5"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <EyebrowLabel tone="leaf" animate={false}>
          Studieupplägg
        </EyebrowLabel>
      </div>

      {phase === "teaser" && (
        <>
          <h3
            className="mt-2 text-[19px] font-bold leading-tight text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Osäker på om det är något för dig?
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-white/65">
            Svara på två snabba frågor, så ser du om ett upplägg skulle hjälpa dig.
          </p>
          <button
            type="button"
            onClick={start}
            className="group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-semibold text-success-ink transition hover:brightness-110"
          >
            Ta reda på det
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </>
      )}

      {(phase === "q1" || phase === "q2") && (
        <QuestionStep
          index={phase === "q1" ? 0 : 1}
          selected={phase === "q1" ? answers.forsok : answers.hinder}
          onPick={answer}
          onBack={phase === "q2" ? () => setPhase("q1") : undefined}
        />
      )}

      {phase === "form" && (
        <form onSubmit={send} className="mt-2">
          <h3
            className="text-[18px] font-bold leading-tight text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {outcome.headline}
          </h3>
          <ul className="mt-2.5 space-y-1.5">
            {outcome.lines.map((line) => (
              <li key={line} className="flex gap-2 text-[13px] leading-relaxed text-white/70">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[13px] leading-relaxed text-white/65">
            Lämna ditt nummer så kontaktar vi dig och går igenom det. Kostar ingenting, och du
            binder dig inte till något.
          </p>

          <label htmlFor="lead-namn" className="mt-3.5 block text-xs font-medium text-white/70">
            Namn <span className="text-white/45">(frivilligt)</span>
          </label>
          <input
            id="lead-namn"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
            maxLength={80}
            className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-[var(--cream)] outline-none transition-colors focus:border-success"
          />

          <label htmlFor="lead-telefon" className="mt-3 block text-xs font-medium text-white/70">
            Mobilnummer
          </label>
          <input
            id="lead-telefon"
            ref={phoneRef}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError(null);
            }}
            autoComplete="tel"
            placeholder="070-123 45 67"
            required
            aria-invalid={!!error}
            aria-describedby={error ? "lead-fel" : undefined}
            className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-[var(--cream)] outline-none transition-colors focus:border-success"
          />

          <label htmlFor="lead-epost" className="mt-3 block text-xs font-medium text-white/70">
            E-post <span className="text-white/45">(frivilligt)</span>
          </label>
          <input
            id="lead-epost"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            autoComplete="email"
            placeholder="du@exempel.se"
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-[var(--cream)] outline-none transition-colors focus:border-success"
          />

          <label htmlFor="lead-meddelande" className="mt-3 block text-xs font-medium text-white/70">
            Något vi bör veta? <span className="text-white/45">(frivilligt)</span>
          </label>
          <textarea
            id="lead-meddelande"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="T.ex. när du skriver provet, eller vad du fastnar på"
            className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-[var(--cream)] outline-none transition-colors focus:border-success"
          />

          {/* Ingen kryssruta. Samtycket är själva inskicket: texten står före
              knappen, den säger exakt vad som händer, och att trycka på "Ring
              mig" är den entydiga viljeyttring GDPR kräver. En kryssruta är ett
              av flera sätt att visa samtycke, inte det enda. `consent_at`
              skrivs fortfarande på raden — beviset är tidpunkten för inskicket. */}
          <p className="mt-3 text-[12px] leading-relaxed text-white/55">
            När du skickar sparar vi dina uppgifter för att kunna kontakta dig om studieupplägget,
            och inget annat. Se{" "}
            <Link
              to="/integritetspolicy"
              className="underline underline-offset-2"
              style={{ color: "var(--teal)" }}
            >
              integritetspolicyn
            </Link>
            .
          </p>

          {error && (
            <p
              id="lead-fel"
              role="alert"
              className="mt-2.5 rounded-lg border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 py-2 text-[12px] text-[var(--destructive)]"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-semibold text-success-ink transition hover:brightness-110 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Skickar
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Skicka in
              </>
            )}
          </button>
        </form>
      )}

      {phase === "done" && (
        <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
            <Sparkles className="h-5 w-5" />
          </span>
          <h3
            className="mt-3 text-[18px] font-bold leading-tight text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tack, vi hör av oss
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">
            Vi hör av oss till {savedPhone ? formatPhone(savedPhone) : "dig"} inom ett par dagar.
            Svarar du inte skickar vi ett sms i stället.
          </p>
        </m.div>
      )}
    </div>
  );
}

function QuestionStep({
  index,
  selected,
  onPick,
  onBack,
}: {
  index: number;
  selected: string | undefined;
  onPick: (stepIndex: number, value: string) => void;
  onBack?: () => void;
}) {
  const step = QUIZ_STEPS[index];
  return (
    <m.div key={step.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <h3
          className="text-[17px] font-bold leading-tight text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {step.question}
        </h3>
        <span className="shrink-0 text-[11px] tabular-nums text-white/45">
          {index + 1}/{QUIZ_STEPS.length}
        </span>
      </div>

      <div role="radiogroup" aria-label={step.question} className="mt-3 space-y-2">
        {step.options.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPick(index, opt.value)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left text-[13px] leading-snug transition-colors ${
                active
                  ? "border-success bg-success/12 font-medium text-[var(--cream)]"
                  : "border-white/12 bg-white/[0.03] text-white/75 hover:border-success/50 hover:text-[var(--cream)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-3 text-[12px] text-white/50 underline underline-offset-2 transition-colors hover:text-[var(--cream)]"
        >
          Tillbaka
        </button>
      )}
    </m.div>
  );
}
