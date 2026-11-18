import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { findExam } from "@/lib/prov-data";
import { startedPasses } from "@/lib/prov-progress";
import { loadResults } from "@/lib/prov-results";
import { latestResult, secondsLeft, suggestNextPass } from "@/lib/prov-next";
import { enhet } from "@/lib/sv-format";

type Card =
  | {
      kind: "resume";
      term: string;
      label: string;
      pass: number;
      passKind: "verbal" | "kvant";
      answered: number;
      total: number;
      /** Kvar på klockan i provläge; null i övningsläge. */
      seconds: number | null;
      paused: boolean;
    }
  | {
      kind: "next";
      term: string;
      label: string;
      lastPass: number;
      score: number;
      total: number;
      next: { pass: number; kind: "verbal" | "kvant"; completesPart: boolean } | null;
    };

const KIND_WORD = { verbal: "verbal", kvant: "kvantitativ" } as const;
const PART_WORD = { verbal: "verbala", kvant: "kvantitativa" } as const;

const PRIMARY =
  "inline-flex min-h-[48px] items-center justify-center rounded-lg bg-primary px-6 py-3.5 text-[15px] font-semibold text-on-brand transition hover:brightness-125";
const SECONDARY =
  "inline-flex min-h-[44px] items-center text-[15px] font-semibold text-[var(--cream)] underline-offset-2 hover:underline";

/**
 * Startsidans provkort.
 *
 * Tre lägen, i den här ordningen:
 *  1. Ett påbörjat, ej inlämnat pass: "Fortsätt provpass N", hur långt man
 *     kommit och hur mycket tid som är kvar. Det är det dyraste att tappa
 *     bort, ett pass i provläge har en klocka som går.
 *  2. Ett tidigare inlämnat pass: resultatet och nästa pass att skriva, helst
 *     det som gör delen hel så att den får en poäng.
 *  3. Inget av det: kortet som det alltid sett ut.
 *
 * Läget läses ur localStorage, alltså först efter första renderingen. Servern
 * och första klientrenderingen visar läge 3, så att hydreringen stämmer.
 */
export function ProvHomeCard() {
  const [card, setCard] = useState<Card | null>(null);

  useEffect(() => {
    const started = startedPasses().find((p) => !p.progress.submittedAt);
    if (started) {
      const exam = findExam(started.term);
      const pass = exam?.passes.find((p) => p.pass === started.pass);
      if (exam && pass) {
        const { progress } = started;
        setCard({
          kind: "resume",
          term: exam.term,
          label: exam.label,
          pass: pass.pass,
          passKind: pass.kind,
          answered: Object.keys(progress.answers).length,
          total: pass.questions,
          seconds: secondsLeft(progress.endsAt, progress.pausedAt, Date.now()),
          paused: progress.pausedAt != null,
        });
        return;
      }
    }

    const results = loadResults();
    const latest = latestResult(results);
    const exam = latest ? findExam(latest.term) : undefined;
    if (latest && exam) {
      setCard({
        kind: "next",
        term: exam.term,
        label: exam.label,
        lastPass: latest.pass,
        score: latest.result.score,
        total: latest.result.total,
        next: suggestNextPass(exam, results, latest.result.kind),
      });
    }
  }, []);

  if (card?.kind === "resume") {
    const pct = card.total > 0 ? Math.round((card.answered / card.total) * 100) : 0;
    const klocka =
      card.seconds === null
        ? "Övningsläge, utan klocka."
        : card.seconds === 0
          ? "Tiden har gått ut, passet lämnas in när du öppnar det."
          : card.paused
            ? `Pausat med ${enhet(Math.ceil(card.seconds / 60), "minut")} kvar.`
            : `${enhet(Math.ceil(card.seconds / 60), "minut")} kvar på klockan.`;

    return (
      <section className="flex flex-col rounded-[40px] bg-sky p-7 sm:p-8">
        <h2
          className="display mt-5 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[32px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Fortsätt provpass {card.pass}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-bark">
          {card.label}, {KIND_WORD[card.passKind]}. {card.answered} av {card.total} besvarade.{" "}
          {klocka}
        </p>
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-card/60"
          role="progressbar"
          aria-valuenow={card.answered}
          aria-valuemin={0}
          aria-valuemax={card.total}
          aria-label="Besvarade uppgifter"
        >
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex-1" />
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            to="/gamla-prov/$term/$pass"
            params={{ term: card.term, pass: String(card.pass) }}
            className={PRIMARY}
          >
            Fortsätt
          </Link>
          <Link to="/gamla-prov" className={SECONDARY}>
            Alla gamla prov
          </Link>
        </div>
      </section>
    );
  }

  if (card?.kind === "next") {
    return (
      <section className="flex flex-col rounded-[40px] bg-sky p-7 sm:p-8">
        <h2
          className="display mt-5 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[32px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Skriv ett provpass
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-bark">
          Senast: {card.label}, provpass {card.lastPass}, {card.score} av {card.total} rätt.
          {card.next?.completesPart &&
            ` Provpass ${card.next.pass} ger dig den ${PART_WORD[card.next.kind]} poängen.`}
        </p>
        <div className="flex-1" />
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          {card.next ? (
            <>
              <Link
                to="/gamla-prov/$term/$pass"
                params={{ term: card.term, pass: String(card.next.pass) }}
                className={PRIMARY}
              >
                Skriv provpass {card.next.pass}
              </Link>
              <Link to="/gamla-prov" className={SECONDARY}>
                Alla gamla prov
              </Link>
            </>
          ) : (
            <Link to="/gamla-prov" className={PRIMARY}>
              Välj provtillfälle
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <Link
      to="/gamla-prov"
      className="flex flex-col rounded-[40px] bg-sky p-7 transition hover:brightness-[1.03] sm:p-8"
    >
      <h2
        className="display mt-5 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[32px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Skriv ett provpass
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-bark">
        40 uppgifter på tid, med facit på varje uppgift.
      </p>
      <div className="flex-1" />
      <span className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 self-start rounded-lg bg-primary px-6 py-3.5 text-[15px] font-semibold text-on-brand">
        Välj provtillfälle
      </span>
    </Link>
  );
}
