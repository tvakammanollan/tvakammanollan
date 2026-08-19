import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Phone } from "lucide-react";
import {
  fetchCoachingLeads,
  updateCoachingLead,
  type CoachingLead,
} from "@/lib/coaching-leads.functions";
import { QUIZ_STEPS } from "@/lib/coaching-quiz";
import { formatPhone } from "@/lib/phone";
import { formatRelativeTime } from "@/lib/sv-format";
import { EmptyState } from "@/components/EmptyState";

/* =====================================================================
   Ringlistan. Ett lead är ett telefonsamtal som ska ringas, så vyn är
   byggd som en arbetslista och inte som en rapport: numret är klickbart
   (tel:), svaren står utskrivna i klartext så samtalet kan börja
   någonstans, och statusen ändras med ett klick.

   "Nya" sorteras äldst först — den som väntat längst ska ringas först.
   ===================================================================== */

const STATUSAR = [
  { value: "new", label: "Att ringa" },
  { value: "contacted", label: "Uppringda" },
  { value: "won", label: "Sålda" },
  { value: "lost", label: "Nej tack" },
  { value: "all", label: "Alla" },
] as const;

type Status = (typeof STATUSAR)[number]["value"];

/** Svarsvärde → den etikett användaren faktiskt såg. */
function labelFor(stepIndex: number, value: string | undefined): string | null {
  if (!value) return null;
  return QUIZ_STEPS[stepIndex].options.find((o) => o.value === value)?.label ?? value;
}

export function AdminLeadsTab() {
  const [status, setStatus] = useState<Status>("new");
  const fetchLeads = useServerFn(fetchCoachingLeads);
  const qc = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["coaching-leads", status],
    queryFn: () => fetchLeads({ data: { status, limit: 200 } }) as Promise<CoachingLead[]>,
    staleTime: 30_000,
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUSAR.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatus(s.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              status === s.value
                ? "bg-[#2f6b3c] text-[var(--success-ink)]"
                : "border border-white/12 text-white/60 hover:text-[var(--cream)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12" aria-busy="true">
          <Loader2 className="h-5 w-5 animate-spin text-white/40" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Phone}
          title="Inga leads här"
          subtitle={
            status === "new"
              ? "Ingen har fyllt i kvalificeringsformuläret än, eller så är alla uppringda."
              : "Inget att visa i den här vyn."
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {leads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onChanged={() => qc.invalidateQueries({ queryKey: ["coaching-leads"] })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LeadRow({ lead, onChanged }: { lead: CoachingLead; onChanged: () => void }) {
  const update = useServerFn(updateCoachingLead);
  const [note, setNote] = useState(lead.note ?? "");
  const [saving, setSaving] = useState(false);

  const setStatus = async (next: "new" | "contacted" | "won" | "lost") => {
    setSaving(true);
    try {
      await update({ data: { id: lead.id, status: next, note: note.trim() || undefined } });
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const forsok = labelFor(0, lead.answers.forsok);
  const hinder = labelFor(1, lead.answers.hinder);

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <a
            href={`tel:${lead.phone}`}
            className="text-[17px] font-semibold tabular-nums text-[var(--success)] underline-offset-4 hover:underline"
          >
            {formatPhone(lead.phone)}
          </a>
          <span className="ml-2 text-sm text-[var(--cream)]">
            {lead.name ?? lead.username ?? "namn saknas"}
          </span>
        </div>
        <span className="text-xs text-white/45">
          {formatRelativeTime(lead.created_at)}
          {lead.source ? ` · ${lead.source}` : ""}
        </span>
      </div>

      <dl className="mt-2 space-y-0.5 text-[13px] text-white/70">
        {forsok && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-white/45">Skrivit förut:</dt>
            <dd>{forsok}</dd>
          </div>
        )}
        {hinder && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-white/45">Svårast:</dt>
            <dd>{hinder}</dd>
          </div>
        )}
      </dl>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Anteckning från samtalet"
        className="mt-3 w-full rounded-lg border border-input bg-white px-3 py-2 text-[13px] text-[var(--cream)] outline-none transition-colors focus:border-[#7a5236]"
      />

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {(["contacted", "won", "lost", "new"] as const)
          .filter((s) => s !== lead.status)
          .map((s) => (
            <button
              key={s}
              type="button"
              disabled={saving}
              onClick={() => setStatus(s)}
              className="rounded-full border border-white/12 px-3 py-1 text-xs text-white/70 transition-colors hover:border-[#7a5236]/50 hover:text-[var(--cream)] disabled:opacity-50"
            >
              {STATUSAR.find((x) => x.value === s)?.label}
            </button>
          ))}
      </div>
    </li>
  );
}
