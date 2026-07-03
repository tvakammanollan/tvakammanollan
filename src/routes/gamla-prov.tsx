import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { termToLabel, type RawQ } from "@/types/gamla-prov";
import { PageHero } from "@/components/layout/PageHero";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Image as ImageIcon,
  Trophy,
  Target,
  RotateCcw,
  X,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/gamla-prov")({
  component: GamlaProvPage,
  head: () => ({
    meta: pageMeta({
      path: "/gamla-prov",
      title: "Gamla högskoleprov · öva med riktiga frågor · HP Kampen",
      description:
        "Öva på riktiga gamla högskoleprov från 2022 till 2026. Filtrera per delprov, år och provpass. Med facit och normering. Helt gratis.",
      ogTitle: "Gamla högskoleprov · HP Kampen",
      ogDescription:
        "Skriv hela provpass från riktiga HP 2022–2026. Med facit och normering. Gratis.",
    }),
    links: pageLinks("/gamla-prov"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Gamla prov", path: "/gamla-prov" },
      ]),
      // LearningResource schema — markerar sidan som ett pedagogiskt verktyg
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: "Gamla högskoleprov 2022–2026 med facit",
        description:
          "Komplett samling av gamla högskoleprovsfrågor från Vårprovet 2022 till och med 2026. Skriv hela provpass under originaltidsgränser, få omedelbar rättning och uppskattad normering.",
        url: "https://hpkampen.se/gamla-prov",
        inLanguage: "sv-SE",
        isAccessibleForFree: true,
        learningResourceType: "Practice exam",
        educationalUse: "Test preparation",
        educationalLevel: "Gymnasieelev och högskolesökande",
        audience: {
          "@type": "EducationalAudience",
          educationalRole: "student",
        },
        publisher: { "@id": "https://hpkampen.se/#org" },
        teaches: [
          "ORD · Ordkunskap",
          "MEK · Meningskomplettering",
          "LÄS · Svensk läsförståelse",
          "ELF · Engelsk läsförståelse",
          "XYZ · Matematisk problemlösning",
          "KVA · Kvantitativa jämförelser",
          "NOG · Kvantitativa resonemang",
          "DTK · Diagram, tabeller och kartor",
        ],
      }),
    ],
  }),
});

/* ─── Types ─────────────────────────────────────────────────────── */

/* ─── Constants & helpers ───────────────────────────────────────── */

const ALT_KEYS = ["a", "b", "c", "d", "e"] as const;
const ALT_LABELS = ["A", "B", "C", "D", "E"];

function termSortKey(term: string): string {
  const m = term.match(/^(\d{4})(ht|vt)/);
  if (!m) return term;
  return m[1] + (m[2] === "ht" ? "b" : "a");
}

function ppDescription(pp: number, delProvs: Set<string>): string {
  const verbal = ["ORD", "LÄS", "MEK", "ELF"];
  const math = ["XYZ", "KVA", "NOG", "DTK"];
  const isVerbal = verbal.some((d) => delProvs.has(d));
  const isMath = math.some((d) => delProvs.has(d));
  if (isVerbal && !isMath) return "Verbal · ORD · LÄS · MEK · ELF";
  if (isMath && !isVerbal) return "Kvantitativ · XYZ · KVA · NOG · DTK";
  return "Verbal & kvantitativ";
}

function delProvLabel(code: string): string {
  const m: Record<string, string> = {
    ORD: "Ordförståelse",
    LÄS: "Läsförståelse",
    MEK: "Meningskompl.",
    ELF: "Engelsk läs.",
    XYZ: "Mat. problem",
    KVA: "Kvant. jämför.",
    NOG: "Kvant. resonem.",
    DTK: "Diagram/tabell",
  };
  return m[code] || code;
}

// Approximate HP normering (only sensible for full 160-question exam — for single
// provpass we extrapolate)
function approxNormering(rawOutOfTotal: number, total: number): number {
  const fullRaw = Math.round((rawOutOfTotal / total) * 160);
  const table: [number, number][] = [
    [0, 0.0],
    [10, 0.05],
    [20, 0.1],
    [30, 0.15],
    [40, 0.2],
    [50, 0.35],
    [55, 0.45],
    [60, 0.55],
    [65, 0.65],
    [70, 0.75],
    [75, 0.85],
    [80, 0.95],
    [85, 1.05],
    [90, 1.15],
    [95, 1.2],
    [100, 1.25],
    [105, 1.3],
    [110, 1.35],
    [115, 1.4],
    [120, 1.5],
    [125, 1.55],
    [130, 1.65],
    [135, 1.75],
    [140, 1.85],
    [145, 1.9],
    [150, 1.95],
    [155, 2.0],
    [160, 2.0],
  ];
  for (let i = 0; i < table.length - 1; i++) {
    const [a, va] = table[i];
    const [b, vb] = table[i + 1];
    if (fullRaw >= a && fullRaw <= b) {
      const t = (fullRaw - a) / (b - a || 1);
      return Math.round((va + (vb - va) * t) * 20) / 20;
    }
  }
  return 0;
}

/* ─── Page ──────────────────────────────────────────────────────── */

function GamlaProvPage() {
  const [allQuestions, setAllQuestions] = useState<RawQ[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Selection
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedPass, setSelectedPass] = useState<number | null>(null);

  // Quiz state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showPassage, setShowPassage] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  // Load data once
  useEffect(() => {
    let abort = false;
    fetch("/gamla-prov-data.json")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((d: RawQ[]) => {
        if (!abort) {
          setAllQuestions(d);
          setLoadingData(false);
        }
      })
      .catch((e) => {
        if (!abort) {
          setDataError(String(e));
          setLoadingData(false);
        }
      });
    return () => {
      abort = true;
    };
  }, []);

  // Group by exam → provpass
  const examMap = useMemo(() => {
    const m = new Map<string, Map<number, Set<string>>>();
    for (const q of allQuestions) {
      if (!m.has(q.exam_term)) m.set(q.exam_term, new Map());
      const ppMap = m.get(q.exam_term)!;
      if (!ppMap.has(q.provpass)) ppMap.set(q.provpass, new Set());
      ppMap.get(q.provpass)!.add(q.delProv);
    }
    return new Map(
      [...m.entries()].sort((a, b) => termSortKey(b[0]).localeCompare(termSortKey(a[0]))),
    );
  }, [allQuestions]);

  // Current quiz questions
  const questions = useMemo(() => {
    if (!selectedTerm || !selectedPass) return [];
    return allQuestions
      .filter((q) => q.exam_term === selectedTerm && q.provpass === selectedPass)
      .sort((a, b) => a.nr - b.nr);
  }, [allQuestions, selectedTerm, selectedPass]);

  const total = questions.length;
  const q = questions[currentIdx];
  const answered = Object.keys(answers).length;
  const score = submitted ? questions.filter((qq) => answers[qq.nr] === qq.svar).length : 0;

  const hasFacit = useMemo(() => questions.some((qq) => qq.svar && qq.svar !== ""), [questions]);

  function pickAnswer(letter: string) {
    if (submitted || !q) return;
    setAnswers((prev) => ({ ...prev, [q.nr]: letter }));
  }

  function goTo(idx: number) {
    setCurrentIdx(Math.max(0, Math.min(total - 1, idx)));
    setShowResults(false);
  }

  function handleSubmit() {
    setSubmitted(true);
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToExams() {
    setSelectedTerm(null);
    setSelectedPass(null);
    setCurrentIdx(0);
    setAnswers({});
    setSubmitted(false);
    setShowResults(false);
    setShowPassage(true);
  }

  function backToPasses() {
    setSelectedPass(null);
    setCurrentIdx(0);
    setAnswers({});
    setSubmitted(false);
    setShowResults(false);
    setShowPassage(true);
  }

  function startPass(pp: number) {
    setSelectedPass(pp);
    setCurrentIdx(0);
    setAnswers({});
    setSubmitted(false);
    setShowResults(false);
    setShowPassage(true);
  }

  /* ── Loading / error ─────────────────────────────────────────── */
  if (loadingData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--navy)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-[#f2a65a] border-t-transparent animate-spin" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Laddar prov…
          </p>
        </div>
      </div>
    );
  }
  if (dataError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--navy)" }}
      >
        <div className="rounded-2xl border border-red-400/40 bg-red-400/5 p-6 text-center max-w-md">
          <p className="text-red-300">Kunde inte ladda data: {dataError}</p>
        </div>
      </div>
    );
  }

  /* ── Exam picker (no term selected) ──────────────────────────── */
  if (!selectedTerm) {
    return (
      <div className="min-h-screen">
        <PageHero
          eyebrow="Högskoleprovet · gamla prov"
          title="Välj prov"
          subtitle={`${examMap.size} provtillfällen · ${allQuestions.length.toLocaleString("sv-SE")} uppgifter med facit.`}
          align="center"
          variant="compact"
        />
        <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {[...examMap.entries()].map(([term, ppMap]) => (
              <div
                key={term}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm transition-all hover:border-[#f2a65a]/50 hover:bg-white/[0.04]"
              >
                <button
                  type="button"
                  onClick={() => setSelectedTerm(term)}
                  className="w-full p-5 text-left"
                >
                  <div className="text-base font-semibold text-white">{termToLabel(term)}</div>
                  <div className="mt-1 text-xs text-white/55">
                    {ppMap.size} provpass ·{" "}
                    {[...ppMap.values()].reduce((s, set) => s + set.size, 0) * 10} uppgifter
                  </div>
                </button>
                <Link
                  to="/gamla-prov/$term"
                  params={{ term }}
                  className="block border-t border-white/8 px-5 py-2.5 text-xs font-medium text-[#f2a65a] transition-colors hover:bg-[#f2a65a]/10"
                >
                  Visa alla frågor &amp; facit →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Provpass picker (term selected, no pp) ──────────────────── */
  if (!selectedPass) {
    const ppMap = examMap.get(selectedTerm);
    if (!ppMap) return null;
    const sortedPps = [...ppMap.entries()].sort(([a], [b]) => a - b);
    return (
      <div className="min-h-screen" style={{ background: "var(--navy)", color: "var(--cream)" }}>
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={backToExams}
              className="flex items-center gap-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft className="h-4 w-4" /> Alla prov
            </button>
          </div>
          <div className="mb-8">
            <p
              className="mb-1 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-tertiary)" }}
            >
              {termToLabel(selectedTerm)}
            </p>
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--cream)" }}
            >
              Välj provpass
            </h1>
          </div>
          <div className="space-y-3">
            {sortedPps.map(([pp, dels]) => (
              <button
                key={pp}
                type="button"
                onClick={() => startPass(pp)}
                className="group w-full rounded-2xl border p-5 text-left transition-all hover:border-[#f2a65a]/50 hover:shadow-[0_0_16px_rgba(242,166,90,0.12)]"
                style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
              >
                <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                  Provpass {pp}
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {ppDescription(pp, dels)} · 40 uppgifter · 55 min
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Results screen ──────────────────────────────────────────── */
  if (showResults && submitted) {
    const byDelProv = questions.reduce<Record<string, { correct: number; total: number }>>(
      (acc, qq) => {
        const k = qq.delProv;
        if (!acc[k]) acc[k] = { correct: 0, total: 0 };
        acc[k].total++;
        if (answers[qq.nr] === qq.svar) acc[k].correct++;
        return acc;
      },
      {},
    );

    const norm = approxNormering(score, total);
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const wrongQs = questions.filter((qq) => answers[qq.nr] !== qq.svar && qq.svar);
    const unanswered = questions.filter((qq) => !answers[qq.nr]).length;

    return (
      <div className="min-h-screen" style={{ background: "var(--navy)", color: "var(--cream)" }}>
        <div className="mx-auto max-w-2xl px-4 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={backToPasses}
              className="flex items-center gap-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft className="h-4 w-4" /> Provpass
            </button>
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: "var(--text-tertiary)" }}
            >
              {termToLabel(selectedTerm)} · Pass {selectedPass}
            </span>
            <span className="w-20" />
          </div>

          {/* Hero score */}
          <div
            className="mb-5 overflow-hidden rounded-3xl border p-6 text-center"
            style={{
              borderColor: "var(--line)",
              background: "linear-gradient(135deg, var(--navy-2) 0%, rgba(242,166,90,0.08) 100%)",
            }}
          >
            <div
              className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "rgba(234,179,8,0.18)" }}
            >
              <Trophy className="h-6 w-6" style={{ color: "var(--amber)" }} />
            </div>
            <p
              className="mt-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-tertiary)" }}
            >
              Slutresultat
            </p>
            {hasFacit ? (
              <>
                <p
                  className="mt-3 text-6xl font-bold tabular-nums"
                  style={{ color: "var(--amber)", fontFamily: "var(--font-display)" }}
                >
                  {score}
                  <span className="text-2xl font-normal" style={{ color: "var(--text-secondary)" }}>
                    /{total}
                  </span>
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {pct}% rätt
                  {unanswered > 0 && <> · {unanswered} obesvarade</>}
                </p>
              </>
            ) : (
              // Utan facit vore en poängsiffra missvisande — visa inte 0/40.
              <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                Kan inte räkna poäng utan facit. Du svarade på {total - unanswered} av {total}{" "}
                uppgifter.
              </p>
            )}
          </div>

          {/* Normering — only meaningful when facit exists for most questions */}
          {hasFacit && (
            <div
              className="mb-5 rounded-2xl border p-5"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" style={{ color: "#f2a65a" }} />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#f2a65a" }}
                >
                  Ungefärlig normering
                </span>
              </div>
              <p
                className="mt-2 text-4xl font-bold tabular-nums"
                style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
              >
                {norm.toFixed(2)}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                Baserat på antagandet att du fick samma % rätt på hela provet (160 uppgifter).
                Faktisk normering bestäms av UHR efter provdagen.
              </p>
            </div>
          )}

          {!hasFacit && (
            <div
              className="mb-5 rounded-2xl border p-4 text-xs"
              style={{
                borderColor: "rgba(234,179,8,0.3)",
                background: "rgba(234,179,8,0.05)",
                color: "var(--text-secondary)",
              }}
            >
              <strong style={{ color: "var(--amber)" }}>Facit saknas för detta provpass.</strong> Vi
              har frågor och alternativ, men inte rätt svar — därför kan ingen poäng räknas.
            </div>
          )}

          {/* Per delprov */}
          <div
            className="mb-5 rounded-2xl border p-5"
            style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
          >
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              Per delprov
            </p>
            <div className="space-y-2.5">
              {Object.entries(byDelProv).map(([code, s]) => {
                const p = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <div key={code}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span style={{ color: "var(--cream)" }}>
                        <strong className="mr-1.5" style={{ color: "#f2a65a" }}>
                          {code}
                        </strong>
                        {delProvLabel(code)}
                      </span>
                      <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {s.correct}/{s.total} · {p}%
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${p}%`,
                          background:
                            p >= 80
                              ? "rgb(52,211,153)"
                              : p >= 50
                                ? "rgb(234,179,8)"
                                : "rgb(239,68,68)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wrong answers */}
          {wrongQs.length > 0 && (
            <div
              className="mb-5 rounded-2xl border p-5"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Felaktiga svar ({wrongQs.length})
              </p>
              <div className="space-y-2">
                {wrongQs.map((qq) => {
                  const idx = questions.findIndex((x) => x.nr === qq.nr);
                  const ans = answers[qq.nr];
                  return (
                    <button
                      key={qq.nr}
                      type="button"
                      onClick={() => goTo(idx)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-xs transition-all hover:border-[#f2a65a]"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold tabular-nums"
                          style={{ background: "rgba(239,68,68,0.15)", color: "rgb(239,68,68)" }}
                        >
                          {qq.nr}
                        </span>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: "#f2a65a" }}
                        >
                          {qq.delProv}
                        </span>
                      </span>
                      <span
                        className="text-xs tabular-nums"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Du: <strong style={{ color: "rgb(239,68,68)" }}>{ans || "—"}</strong>
                        {" · "}
                        Rätt: <strong style={{ color: "rgb(52,211,153)" }}>{qq.svar}</strong>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setShowResults(false);
                setCurrentIdx(0);
              }}
              className="flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all hover:border-[#f2a65a]"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}
            >
              <BookOpen className="h-4 w-4" /> Granska alla
            </button>
            <button
              type="button"
              onClick={backToPasses}
              className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg,#f2a65a,#c97b41)",
                color: "white",
                boxShadow: "0 0 20px rgba(242,166,90,0.35)",
              }}
            >
              <RotateCcw className="h-4 w-4" /> Nytt provpass
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Question screen ─────────────────────────────────────────── */
  if (!q) return null;

  const userAns = answers[q.nr];
  const alts = ALT_KEYS.map((k, i) => ({
    letter: ALT_LABELS[i],
    text: (q as unknown as Record<string, string>)[k],
  })).filter(({ text }) => text && !text.startsWith("["));
  const passage = q.passage;
  const hasPassage = !!passage;
  const hasImage = !!q.image;
  const isELF = q.delProv === "ELF";
  const progressPct = total > 0 ? Math.round(((currentIdx + 1) / total) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--navy)", color: "var(--cream)" }}>
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={backToPasses}
            className="flex items-center gap-1 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            <ChevronLeft className="h-4 w-4" /> Provpass
          </button>
          <div className="flex-1 text-center">
            <div
              className="text-[11px] uppercase tracking-widest"
              style={{ color: "var(--text-tertiary)" }}
            >
              {termToLabel(selectedTerm)} · Pass {selectedPass}
            </div>
            <div className="text-xs tabular-nums mt-0.5" style={{ color: "var(--cream)" }}>
              {currentIdx + 1} / {total}
            </div>
          </div>
          <div className="w-20 text-right">
            {submitted && (
              <button
                type="button"
                onClick={() => setShowResults(true)}
                className="text-xs font-semibold underline-offset-2 hover:underline"
                style={{ color: "var(--amber)" }}
              >
                {score}/{total} rätt
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div
          className="mb-6 h-1 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg,#f2a65a,#c97b41)",
            }}
          />
        </div>

        {/* ELF notice */}
        {isELF && !passage && (
          <div
            className="mb-4 rounded-2xl border p-4 text-xs leading-relaxed"
            style={{
              borderColor: "rgba(234,179,8,0.3)",
              background: "rgba(234,179,8,0.05)",
              color: "var(--text-secondary)",
            }}
          >
            <strong style={{ color: "var(--amber)" }}>Engelska texten är inte tillgänglig.</strong>{" "}
            Den tas bort en vecka efter provdagen pga upphovsrätt.
          </div>
        )}

        {/* Passage */}
        {hasPassage && (
          <div
            className="mb-4 rounded-2xl border"
            style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
          >
            <button
              type="button"
              onClick={() => setShowPassage((v) => !v)}
              className="flex w-full items-start justify-between gap-3 rounded-2xl px-5 py-4 text-left"
            >
              <span className="flex flex-col gap-1">
                <span
                  className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: "#f2a65a" }}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {isELF ? "Engelska texten" : "Läspassage"}
                </span>
                {q.passage_title && (
                  <span
                    className="text-base font-semibold leading-tight"
                    style={{ color: "var(--cream)" }}
                  >
                    {q.passage_title}
                  </span>
                )}
              </span>
              <span
                className="text-xs whitespace-nowrap mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                {showPassage ? "Dölj ↑" : "Visa ↓"}
              </span>
            </button>
            {showPassage && passage && (
              <div
                className="rounded-b-2xl px-5 pb-5 overflow-y-auto"
                style={{ color: "var(--text-secondary)", maxHeight: "60vh" }}
              >
                <article
                  className="text-[15px] leading-[1.75] font-serif"
                  style={{ color: "var(--cream)" }}
                >
                  {passage.split(/\n\n+/).map((para, i) => {
                    const trimmed = para.trim();
                    if (!trimmed) return null;
                    // Subheading: "### Heading"
                    if (trimmed.startsWith("### ")) {
                      return (
                        <h3
                          key={i}
                          className="mt-6 mb-3 text-sm font-bold uppercase tracking-widest font-sans"
                          style={{ color: "#f2a65a" }}
                        >
                          {trimmed.slice(4)}
                        </h3>
                      );
                    }
                    // Byline: "_Author Name_"
                    if (trimmed.startsWith("_") && trimmed.endsWith("_")) {
                      return (
                        <p
                          key={i}
                          className="mt-5 text-sm italic font-sans"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {trimmed.slice(1, -1)}
                        </p>
                      );
                    }
                    // Glossary block: "||GLOSS|| term = def term2 = def2 ..."
                    if (trimmed.startsWith("||GLOSS|| ")) {
                      const body = trimmed.slice("||GLOSS|| ".length);
                      // Split entries at " = " heuristically: each entry is "<term> = <def>"
                      // Simple split: find " = " positions, then walk back 1 word for term
                      const eqPositions: number[] = [];
                      const re = / = /g;
                      let m: RegExpExecArray | null;
                      while ((m = re.exec(body)) !== null) eqPositions.push(m.index);
                      type Entry = { term: string; def: string };
                      const entries: Entry[] = [];
                      let cursor = 0;
                      for (let k = 0; k < eqPositions.length; k++) {
                        const eqIdx = eqPositions[k];
                        const segment = body.slice(cursor, eqIdx);
                        // Determine where current entry's term starts (split previous def from current term)
                        let term: string;
                        let prevDef: string;
                        if (k === 0) {
                          // first entry: everything before " = " is the term
                          term = segment.trim();
                          prevDef = "";
                        } else {
                          // Term is last word(s) of segment; greedy: 1 word unless capitalized phrase
                          const words = segment.trim().split(/\s+/);
                          // Look for trailing capitalized phrase
                          let termWords = 1;
                          for (let w = words.length - 1; w >= 0; w--) {
                            if (/^[A-ZÅÄÖ]/.test(words[w])) {
                              termWords = words.length - w;
                            } else if (termWords > 1) {
                              break;
                            }
                          }
                          // Cap at 5 words to avoid runaway
                          termWords = Math.min(termWords, 5);
                          term = words.slice(-termWords).join(" ");
                          prevDef = words.slice(0, words.length - termWords).join(" ");
                        }
                        if (k > 0) entries[k - 1].def = prevDef;
                        entries.push({ term, def: "" });
                        cursor = eqIdx + 3; // past " = "
                      }
                      // Last def: from last " = " to end
                      if (entries.length > 0) {
                        entries[entries.length - 1].def = body.slice(cursor).trim();
                      }
                      return (
                        <dl
                          key={i}
                          className="mt-4 mb-2 rounded-xl border px-4 py-3 text-xs font-sans"
                          style={{
                            borderColor: "rgba(165,180,252,0.18)",
                            background: "rgba(242,166,90,0.06)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {entries.map((e, j) => (
                            <div key={j} className={j > 0 ? "mt-1.5" : ""}>
                              <dt className="inline font-semibold" style={{ color: "#f2a65a" }}>
                                {e.term}
                              </dt>
                              <dd className="inline ml-2">= {e.def}</dd>
                            </div>
                          ))}
                        </dl>
                      );
                    }
                    return (
                      <p key={i} className="mb-4 last:mb-0">
                        {trimmed}
                      </p>
                    );
                  })}
                </article>
              </div>
            )}
          </div>
        )}

        {/* Image */}
        {hasImage && (
          <div
            className="mb-4 overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
          >
            <div className="flex items-center justify-between px-4 py-2.5">
              <span
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#f2a65a" }}
              >
                <ImageIcon className="h-3.5 w-3.5" /> Figur ur provhäftet
              </span>
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="text-xs underline-offset-2 hover:underline"
                style={{ color: "var(--text-tertiary)" }}
              >
                Förstora
              </button>
            </div>
            <button type="button" onClick={() => setShowImageModal(true)} className="block w-full">
              <img
                src={q.image}
                alt={`Figur till uppgift ${q.nr}`}
                className="w-full bg-white"
                decoding="async"
                // Provbilderna är ~5:7 (1009×1400 / 784×1100) — reservera ytan
                // så layouten inte hoppar när bilden laddats (CLS).
                style={{ maxHeight: "60vh", objectFit: "contain", aspectRatio: "5 / 7" }}
              />
            </button>
          </div>
        )}

        {/* Question card */}
        <div
          className="rounded-2xl border p-5 transition-all"
          style={{
            borderColor: submitted
              ? userAns === q.svar
                ? "rgba(52,211,153,0.4)"
                : userAns
                  ? "rgba(239,68,68,0.4)"
                  : "var(--line)"
              : "var(--line)",
            background: "var(--navy-2)",
          }}
        >
          <div className="mb-4 flex items-start gap-3">
            <span
              className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums"
              style={{ background: "rgba(242,166,90,0.18)", color: "#f2a65a" }}
            >
              {q.nr}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className="mb-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: "rgba(242,166,90,0.1)", color: "#f2a65a" }}
              >
                {q.delProv}
              </span>
              <p className="text-sm font-medium leading-snug" style={{ color: "var(--cream)" }}>
                {q.fraga && !q.fraga.startsWith("[")
                  ? q.fraga
                  : isELF
                    ? "Välj det ord/den fras som passar bäst i luckan markerad i texten ovan."
                    : "[Se figur eller provhäfte]"}
              </p>
            </div>
          </div>

          {alts.length > 0 && (
            <div className="ml-9 space-y-2">
              {alts.map(({ letter, text }) => {
                const sel = userAns === letter;
                const corr = q.svar === letter;
                let bg = "transparent";
                let border = "var(--line)";
                let color = "var(--text-secondary)";
                if (submitted && q.svar) {
                  if (corr) {
                    bg = "rgba(52,211,153,0.12)";
                    border = "rgba(52,211,153,0.5)";
                    color = "rgb(52,211,153)";
                  } else if (sel) {
                    bg = "rgba(239,68,68,0.12)";
                    border = "rgba(239,68,68,0.5)";
                    color = "rgb(239,68,68)";
                  }
                } else if (sel) {
                  bg = "rgba(242,166,90,0.18)";
                  border = "rgba(242,166,90,0.6)";
                  color = "var(--cream)";
                }
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => pickAnswer(letter)}
                    disabled={submitted}
                    className="flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all disabled:cursor-default"
                    style={{ background: bg, borderColor: border, color }}
                  >
                    <span className="mt-0.5 shrink-0 font-bold">{letter}</span>
                    <span>{text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {alts.length === 0 && (
            <p
              className="ml-9 text-sm"
              style={{ color: submitted ? "rgb(52,211,153)" : "var(--text-tertiary)" }}
            >
              {submitted && q.svar ? (
                <>
                  Rätt svar: <strong>{q.svar}</strong>
                </>
              ) : isELF ? (
                "Texten saknas. Se rätt svar efter inlämning."
              ) : (
                "Se figuren ovan eller provhäftet."
              )}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo(currentIdx - 1)}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:opacity-30"
            style={{ borderColor: "var(--line)", color: "var(--cream)" }}
          >
            <ChevronLeft className="h-4 w-4" /> Föregående
          </button>

          {currentIdx < total - 1 ? (
            <button
              type="button"
              onClick={() => goTo(currentIdx + 1)}
              className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all hover:border-[#f2a65a]"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}
            >
              Nästa <ChevronRight className="h-4 w-4" />
            </button>
          ) : !submitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-full px-5 py-2 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg,#f2a65a,#c97b41)",
                color: "white",
                boxShadow: "0 0 20px rgba(242,166,90,0.35)",
              }}
            >
              Visa facit{answered > 0 ? ` (${answered}/${total})` : ""}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowResults(true)}
              className="rounded-full px-5 py-2 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#f2a65a,#c97b41)", color: "white" }}
            >
              Tillbaka till resultat
            </button>
          )}
        </div>

        {/* Dot navigation */}
        {total <= 40 && (
          <div className="mt-6 flex flex-wrap justify-center gap-1.5">
            {questions.map((qq, i) => {
              const ans = answers[qq.nr];
              let dotColor = "rgba(255,255,255,0.12)";
              if (submitted && qq.svar) {
                dotColor =
                  ans === qq.svar
                    ? "rgba(52,211,153,0.7)"
                    : ans
                      ? "rgba(239,68,68,0.7)"
                      : "rgba(255,255,255,0.12)";
              } else if (ans) {
                dotColor = "rgba(242,166,90,0.7)";
              }
              const isActive = i === currentIdx;
              return (
                <button
                  key={qq.nr}
                  type="button"
                  onClick={() => goTo(i)}
                  className="h-2.5 w-2.5 rounded-full transition-all"
                  style={{
                    background: dotColor,
                    transform: isActive ? "scale(1.6)" : "scale(1)",
                    outline: isActive ? "2px solid rgba(242,166,90,0.6)" : "none",
                    outlineOffset: "1px",
                  }}
                  title={`Fråga ${qq.nr}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Image modal */}
      {showImageModal && q.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            type="button"
            onClick={() => setShowImageModal(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-all hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={q.image}
            alt={`Figur till uppgift ${q.nr}`}
            className="max-h-full max-w-full bg-white"
            style={{ objectFit: "contain" }}
          />
        </div>
      )}
    </div>
  );
}
