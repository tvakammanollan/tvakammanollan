import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { allExams } from "@/lib/prov-data";
import { freeExams } from "@/lib/prov-access";

/**
 * Det som står i stället för Provläge/Övningsläge på ett prov som kräver
 * Premium. Köpet görs på /pris och /kassa; här finns bara vägen dit och de
 * prov som går att skriva utan köp.
 */
export function ProvLocked({ label }: { label: string }) {
  const free = freeExams(allExams());
  return (
    <section className="mt-6 rounded-2xl border border-white/12 bg-white/[0.02] p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--cream)]">
        <Lock className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden />
        {label} ingår i Premium
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        Premium ger dig alla {allExams().length} gamla prov med facit och rättning, hela ordlistan
        och alla MEK-uppgifter. Det kostar 149 kr per månad eller 349 kr för 6 månader.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          to="/pris"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-on-brand transition hover:brightness-110"
        >
          Köp Premium
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-[var(--text-secondary)] underline underline-offset-2 hover:text-[var(--cream)]"
        >
          Logga in om du redan har köpt
        </Link>
      </div>
      <p className="mt-5 text-sm text-[var(--text-secondary)]">
        Gratis att skriva:{" "}
        {free.map((e, i) => (
          <span key={e.term}>
            {i === 0 ? null : i === free.length - 1 ? " och " : ", "}
            <Link
              to="/gamla-prov/$term"
              params={{ term: e.term }}
              className="underline underline-offset-2 hover:text-[var(--cream)]"
            >
              {e.label.toLowerCase()}
            </Link>
          </span>
        ))}
        .
      </p>
    </section>
  );
}
