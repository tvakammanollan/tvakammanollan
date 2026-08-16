import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { findExam } from "@/lib/prov-data";
import { startedPasses, type ProvProgress } from "@/lib/prov-progress";
import { passKindLabel } from "@/types/gamla-prov";

/**
 * "Fortsätt där du var" på provlistan.
 *
 * Läses ur localStorage och renderas därför först i webbläsaren — servern vet
 * inte vad besökaren har påbörjat, och ska inte veta det heller.
 */
export function ProvResumeCard() {
  const [entry, setEntry] = useState<{ term: string; pass: number; progress: ProvProgress } | null>(
    null,
  );

  useEffect(() => {
    setEntry(startedPasses().find((p) => !p.progress.submittedAt) ?? null);
  }, []);

  if (!entry) return null;
  const exam = findExam(entry.term);
  if (!exam) return null;

  const pass = exam.passes.find((p) => p.pass === entry.pass);
  const answered = Object.keys(entry.progress.answers).length;
  const total = pass?.questions ?? 40;

  return (
    <Link
      to="/gamla-prov/$term/$pass"
      params={{ term: entry.term, pass: String(entry.pass) }}
      className="mb-6 flex items-center gap-4 rounded-2xl border border-[var(--amber)]/40 bg-[var(--amber)]/[0.07] p-5 transition hover:border-[var(--amber)] hover:bg-[var(--amber)]/[0.11]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--amber)]/20">
        <Clock className="h-5 w-5 text-[var(--amber)]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--cream)]">
          Fortsätt {exam.label}, provpass {entry.pass}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
          {pass ? `${passKindLabel(pass.kind)} · ` : ""}
          {answered} av {total} uppgifter besvarade
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--amber)]" aria-hidden />
    </Link>
  );
}
