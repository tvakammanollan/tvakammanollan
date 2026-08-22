import {
  ArrowRight,
  Check,
  FileText,
  ListChecks,
  RotateCcw,
  Swords,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { NextStep } from "@/components/layout/NextStep";
import { ProvScorePanel } from "@/components/prov/ProvScore";
import { useProvResults } from "@/hooks/useProvResults";
import { formatDecimal, formatPercent, antal } from "@/lib/sv-format";
import { HP_TOTAL_QUESTIONS, normeringForPart } from "@/lib/normering";
import { acceptedAnswers, findExam, isCorrect } from "@/lib/prov-data";
import { summariseExam } from "@/lib/prov-results";
import { delprovShort, type ProvPass } from "@/types/gamla-prov";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

/**
 * Resultatsidan efter ett inlämnat provpass.
 *
 * Poäng, tid, delprovsfördelning och en genomgång av varje fel. Normeringen
 * är en uppskattning av hela provet — den sägs rakt ut, i stället för att
 * presenteras som ett facit.
 */
export function ProvResult({
  data,
  answers,
  elapsedSeconds,
  onReview,
  onRestart,
  nextPass,
}: {
  data: ProvPass;
  answers: Record<number, string>;
  elapsedSeconds: number;
  onReview: (index: number) => void;
  onRestart: () => void;
  nextPass?: number;
}) {
  // Provtillfället i stort: passet som just lämnades in är sparat, så panelen
  // vet redan om det var det som gjorde den verbala delen — eller hela provet
  // — färdig. Läses ur localStorage efter montering, alltså efter submit().
  const results = useProvResults();
  const exam = findExam(data.term);
  const examResult = results && exam ? summariseExam(exam, results) : null;

  const total = data.questions.length;
  const score = data.questions.filter((q) => isCorrect(q, answers[q.nr])).length;
  const unanswered = data.questions.filter((q) => !answers[q.nr]).length;
  const ratio = total > 0 ? score / total : 0;
  // UHR:s egen tabell för DET HÄR provtillfället när den finns. Ett provpass
  // är halva provdelen, så andelen räknas upp — det är en uppskattning ur ett
  // halvt underlag oavsett tabell, och det står i texten under.
  const del = normeringForPart(data.term, data.kind, score, total);
  const normering = del.value;

  const perSection = data.sections.map((section) => {
    const items = data.questions.filter((q) => q.delprov === section.code);
    const right = items.filter((q) => isCorrect(q, answers[q.nr])).length;
    return { code: section.code, right, total: items.length };
  });

  const wrong = data.questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => !isCorrect(q, answers[q.nr]));
  const alla = data.questions.map((q, i) => ({ q, i }));
  // Provets egen ordning. `i` är indexet i `data.questions` och måste följa med
  // orört — det är det `onReview` öppnar. Sorteringen är ett skyddsnät: arkivet
  // levererar redan uppgifterna i nummerordning, och om det någon gång inte gör
  // det ska genomgången ändå stämma med häftet.
  const iOrdning = [...alla].sort((a, b) => a.q.nr - b.q.nr);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center backdrop-blur-sm">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--amber)]/18">
          <Trophy className="h-6 w-6 text-[var(--amber)]" aria-hidden />
        </span>
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          {data.label} · Provpass {data.pass}
        </p>
        <p
          className="mt-2 text-6xl font-bold tabular-nums text-[var(--amber)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {score}
          <span className="text-2xl font-normal text-[var(--text-secondary)]">/{total}</span>
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {formatPercent(ratio)} rätt · {formatDuration(elapsedSeconds)}
          {unanswered > 0 && <> · {unanswered} obesvarade</>}
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--amber)]">
          <Target className="h-4 w-4" aria-hidden />
          Uppskattad normering
        </h2>
        <p
          className="mt-2 text-4xl font-bold tabular-nums text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {formatDecimal(normering, 2)}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
          Gäller om du fick lika stor andel rätt på hela{" "}
          {data.kind === "verbal" ? "den verbala" : "den kvantitativa"} delen. Ett provpass är halva
          delen, så det räcker inte för en riktig normering.{" "}
          {del.official
            ? `Uppslagen i UHR:s egen tabell för ${data.label.toLowerCase()}.`
            : `UHR:s tabell för ${data.label.toLowerCase()} finns inte att hämta, så siffran kommer ur en generell tabell över ${HP_TOTAL_QUESTIONS} uppgifter.`}
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Per delprov
        </h2>
        <div className="space-y-3">
          {perSection.map((s) => {
            const pct = s.total > 0 ? s.right / s.total : 0;
            return (
              <div key={s.code}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-[var(--cream)]">
                    <strong className="mr-1.5 text-[var(--amber)]">{s.code}</strong>
                    {delprovShort(s.code)}
                  </span>
                  <span className="tabular-nums text-[var(--text-secondary)]">
                    {s.right}/{s.total} · {formatPercent(pct)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct * 100}%`,
                      background:
                        pct >= 0.8
                          ? "var(--success)"
                          : pct >= 0.5
                            ? "var(--amber)"
                            : "var(--danger)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {examResult && (
        <ProvScorePanel result={examResult} title={`Hela ${data.label.toLowerCase()}`} />
      )}

      {/* Genomgången. Låg tidigare bara som en lista över FELEN, vilket gjorde
          att den som svarat rätt på en uppgift genom att gissa aldrig fick veta
          det — och att en uppgift man var osäker på men råkade pricka inte gick
          att hitta tillbaka till. Nu står alla fyrtio: ditt svar, rätt svar och
          om det blev rätt.

          EN lista, i provets egen nummerordning. Uppgifterna låg i två grupper
          ("Att gå igenom" och "Rätt"), var och en internt sorterad. Följden var
          att numren hoppade — 3, 7, 9, 14 … och sedan 1, 2, 4, 5 — och den som
          letade efter uppgift 12 fick söka i två listor beroende på om det
          blivit rätt eller fel. Det läste som att uppgifter saknades. Vad som
          är rätt och fel syns på varje rad (`ReviewRow`), så grupperingen bar
          ingen information som raden inte redan har. */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Genomgång ({alla.length} uppgifter)
        </h2>
        <p className="mb-3 text-xs text-[var(--text-tertiary)]">
          {wrong.length > 0
            ? `${antal(wrong.length, "uppgift", "uppgifter")} att gå igenom. Klicka på en uppgift för att se den med alternativen och facit.`
            : "Allt rätt. Klicka på en uppgift för att se den med alternativen och facit."}
        </p>

        <ul className="space-y-2">
          {iOrdning.map(({ q, i }) => (
            <li key={q.nr}>
              <ReviewRow q={q} answer={answers[q.nr]} onClick={() => onReview(i)} />
            </li>
          ))}
        </ul>
      </section>

      {/* Nästa provpass är det uppenbara nästa steget, men låg sist — under
          två likvärdiga outline-knappar. Och saknades det (sista passet)
          slutade sidan i en återvändsgränd. Samma form som efter en match,
          ett träningspass och ett ordpass. */}
      {nextPass !== undefined ? (
        <NextStep
          primaryLabel={`Fortsätt med provpass ${nextPass}`}
          primaryTo="/gamla-prov/$term/$pass"
          primaryParams={{ term: data.term, pass: String(nextPass) }}
          primaryIcon={<ArrowRight className="h-4 w-4" />}
          forward={[
            { label: "Gå igenom alla uppgifter", icon: ListChecks, onClick: () => onReview(0) },
            { label: "Gör om provpasset", icon: RotateCcw, onClick: onRestart },
            { label: "Alla gamla prov", icon: FileText, to: "/gamla-prov" },
          ]}
        />
      ) : (
        <NextStep
          primaryLabel="Gör om provpasset"
          onPrimary={onRestart}
          primaryIcon={<RotateCcw className="h-4 w-4" />}
          forward={[
            { label: "Gå igenom alla uppgifter", icon: ListChecks, onClick: () => onReview(0) },
            { label: "Alla gamla prov", icon: FileText, to: "/gamla-prov" },
            {
              label: "Spela en match",
              icon: Swords,
              to: "/matchmaking",
              search: { type: "verbal" },
            },
          ]}
        />
      )}
    </div>
  );
}

/**
 * En rad i genomgången: uppgiftsnummer, uppgiftens början, ditt svar och facit.
 *
 * `acceptedAnswers` och inte `q.answer`: UHR har i efterhand godkänt flera svar
 * på ett antal uppgifter, och då är båda rätt. Att skriva ut `q.answer` ensamt
 * hade markerat ett godkänt svar som fel.
 */
function ReviewRow({
  q,
  answer,
  onClick,
}: {
  q: ProvPass["questions"][number];
  answer: string | undefined;
  onClick: () => void;
}) {
  const facit = acceptedAnswers(q);
  const rätt = isCorrect(q, answer);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-left transition-colors hover:border-[var(--amber)]/50 hover:bg-white/[0.03]"
    >
      <span
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums ${
          rätt
            ? "bg-[var(--success)] text-[var(--success-ink)]"
            : "bg-[var(--danger)] text-[var(--danger-ink)]"
        }`}
      >
        {q.nr}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm text-[var(--cream)]">
          {q.text ?? `${q.delprov}-uppgift ${q.nr}`}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">
          Du svarade{" "}
          <strong className={rätt ? "text-[var(--success)]" : "text-[var(--destructive)]"}>
            {answer ?? "–"}
          </strong>{" "}
          · rätt svar <strong className="text-[var(--cream)]">{facit.join(" eller ")}</strong>
          {q.utgar ? " · uppgiften ströks av UHR" : ""}
        </span>
      </span>
      {rätt ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" aria-hidden />
      ) : (
        <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" aria-hidden />
      )}
    </button>
  );
}
