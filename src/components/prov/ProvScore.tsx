import { Target } from "lucide-react";
import { formatDecimal, formatPercent } from "@/lib/sv-format";
import type { ExamResult, PartResult, PassResult } from "@/lib/prov-results";

/* =====================================================================
   Vad du fick på ett gammalt prov — samma siffror på tre ytor: kortet i
   provlistan, provtillfällets sida och resultatskärmen efter ett inlämnat
   pass. Ett provresultat som skiljer sig mellan två sidor är värre än inget
   alls, så uträkningen ligger i lib/prov-results.ts och renderingen här.
   ===================================================================== */

const PART_LABEL = { verbal: "Verbal", kvant: "Matte" } as const;

/** "1 av 2 pass" — det som saknas innan delen får en poäng. */
function partProgress(part: PartResult): string {
  return `${part.done} av ${part.passes} pass`;
}

/**
 * Kompakt rad i provlistans kort: Verbal · Matte · Totalt.
 *
 * Renderas som `span`-element eftersom kortet är en länk, och håller sig till
 * ett kort mått — den ska gå att läsa i förbifarten när man skrollar genom
 * trettio provtillfällen, inte studeras.
 */
export function ProvScoreRow({ result }: { result: ExamResult }) {
  if (result.done === 0) return null;

  return (
    <span className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/8 pt-3">
      <PartChip part={result.verbal} />
      <PartChip part={result.kvant} />
      {result.normering !== null && (
        <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--amber)]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--amber)]">
          Totalt
          <span className="tabular-nums">{formatDecimal(result.normering, 2)}</span>
        </span>
      )}
    </span>
  );
}

function PartChip({ part }: { part: PartResult }) {
  if (part.passes === 0) return null;
  const label = PART_LABEL[part.kind];

  return part.normering !== null ? (
    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--success-soft)] px-2.5 py-0.5 text-[11px] text-[var(--success)]">
      {label}
      <span className="font-semibold tabular-nums">{formatDecimal(part.normering, 2)}</span>
    </span>
  ) : (
    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[11px] text-[var(--text-tertiary)]">
      {label}
      <span className="tabular-nums">{partProgress(part)}</span>
    </span>
  );
}

/**
 * Hela uträkningen, för provtillfällets sida och resultatskärmen.
 *
 * Rutan visar även de delar som inte är klara. Att se "Matte — 1 av 2 pass"
 * bredvid en färdig verbal poäng är hela svaret på varför det inte står någon
 * totalpoäng ännu; utan den raden ser sidan bara ut att sakna en siffra.
 */
export function ProvScorePanel({
  result,
  title = "Ditt resultat",
}: {
  result: ExamResult;
  title?: string;
}) {
  if (result.done === 0) return null;

  const complete = result.normering !== null;
  const rawScore = result.verbal.score + result.kvant.score;
  const rawTotal = result.verbal.total + result.kvant.total;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--amber)]">
        <Target className="h-4 w-4" aria-hidden />
        {title}
      </h2>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <PartCell part={result.verbal} />
        <PartCell part={result.kvant} />
        <Cell
          label="Totalt"
          value={complete ? formatDecimal(result.normering, 2) : null}
          sub={
            complete ? `${rawScore} av ${rawTotal} rätt` : `${result.done} av ${result.passes} pass`
          }
          accent
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[var(--text-tertiary)]">
        {complete
          ? "Delarnas poäng räknas ur andelen rätt, och totalpoängen är medelvärdet av dem — så räknas provet. Det är ändå en uppskattning: UHR normerar varje prov för sig och sätter gränserna först efter provdagen."
          : "Poängen för en del visas när båda dess provpass är skrivna, och totalpoängen när alla fyra är det."}
        {result.practice && " Något av passen är skrivet i övningsläge, alltså utan tidspress."}
      </p>
    </section>
  );
}

function PartCell({ part }: { part: PartResult }) {
  if (part.passes === 0) return null;
  const complete = part.normering !== null;

  return (
    <Cell
      label={PART_LABEL[part.kind]}
      value={complete ? formatDecimal(part.normering, 2) : null}
      sub={complete ? `${part.score} av ${part.total} rätt` : partProgress(part)}
    />
  );
}

function Cell({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | null;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
        {label}
      </p>
      <p
        className={`mt-0.5 text-2xl font-bold tabular-nums ${
          value === null
            ? "text-[var(--text-tertiary)]"
            : accent
              ? "text-[var(--amber)]"
              : "text-[var(--cream)]"
        }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value ?? "–"}
      </p>
      <p className="mt-0.5 text-[11px] tabular-nums text-[var(--text-tertiary)]">{sub}</p>
    </div>
  );
}

/**
 * Ett enskilt provpass resultat, som en liten etikett bredvid passet.
 *
 * Procenten står där för att antalet ensamt inte säger något när provpassen
 * har olika många uppgifter (ELF saknas i några av de äldre passen).
 */
export function PassScoreBadge({ result }: { result: PassResult }) {
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="inline-flex items-baseline gap-1 rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-xs font-semibold tabular-nums text-[var(--success)]">
        {result.score}/{result.total}
        <span className="font-normal">· {formatPercent(result.score / result.total)}</span>
      </span>
      {result.mode === "ova" && (
        <span className="text-[10px] text-[var(--text-tertiary)]">övningsläge</span>
      )}
    </span>
  );
}
