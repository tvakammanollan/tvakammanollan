import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, Phone, Search } from "lucide-react";
import {
  fetchCoachingLeads,
  updateCoachingLead,
  type CoachingLead,
} from "@/lib/coaching-leads.functions";
import { QUIZ_STEPS } from "@/lib/coaching-quiz";
import { formatPhone } from "@/lib/phone";
import { formatDate, formatRelativeTime } from "@/lib/sv-format";
import { EmptyState } from "@/components/EmptyState";
import { downloadCsv, toCsv } from "@/lib/csv";

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

const SORTERINGAR = [
  { value: "oldest", label: "Äldsta först" },
  { value: "newest", label: "Nyaste först" },
  { value: "name", label: "Namn A–Ö" },
] as const;

type Sort = (typeof SORTERINGAR)[number]["value"];

/** Svarsvärde → den etikett användaren faktiskt såg. */
function labelFor(stepIndex: number, value: string | undefined): string | null {
  if (!value) return null;
  return QUIZ_STEPS[stepIndex].options.find((o) => o.value === value)?.label ?? value;
}

export function AdminLeadsTab() {
  const [status, setStatus] = useState<Status>("new");
  const [sort, setSort] = useState<Sort>("oldest");
  const [search, setSearch] = useState("");
  // Sökningen går till servern, så varje tangenttryck ska inte bli en query.
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const fetchLeads = useServerFn(fetchCoachingLeads);
  const qc = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["coaching-leads", status, sort, debounced],
    queryFn: () =>
      fetchLeads({
        data: { status, sort, search: debounced || undefined, limit: 500 },
      }) as Promise<CoachingLead[]>,
    staleTime: 30_000,
  });

  /**
   * Exporten tar exakt det som visas — samma filter, samma sortering. En
   * export som tyst tar med annat än listan man tittar på är svår att lita på.
   */
  const exportera = () => {
    const csv = toCsv(
      [
        "Inkom",
        "Namn",
        "Telefon",
        "E-post",
        "Status",
        "Källa",
        "Skrivit förut",
        "Svårast",
        "Meddelande",
        "Anteckning",
        "Konto",
      ],
      leads.map((l) => [
        formatDate(l.created_at),
        l.name ?? "",
        l.phone,
        l.email ?? "",
        STATUSAR.find((s) => s.value === l.status)?.label ?? l.status,
        l.source ?? "",
        labelFor(0, l.answers.forsok) ?? "",
        labelFor(1, l.answers.hinder) ?? "",
        l.message ?? "",
        l.note ?? "",
        l.username ?? "",
      ]),
    );
    const idag = new Date().toISOString().slice(0, 10);
    downloadCsv(`ringlista-${status}-${idag}.csv`, csv);
  };

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
                ? "bg-success text-[var(--success-ink)]"
                : "border border-white/12 text-white/60 hover:text-[var(--cream)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[12rem]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök namn, nummer eller e-post"
            aria-label="Sök i ringlistan"
            className="w-full rounded-full border border-white/12 bg-white py-2 pl-9 pr-3 text-sm text-[var(--cream)] outline-none transition-colors focus:border-bark"
          />
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sortering"
          className="rounded-full border border-white/12 bg-white px-3 py-2 text-sm text-[var(--cream)] outline-none focus:border-bark"
        >
          {SORTERINGAR.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={exportera}
          disabled={leads.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-xs font-semibold text-white/70 transition-colors hover:border-bark/50 hover:text-[var(--cream)] disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Exportera CSV ({leads.length})
        </button>
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

      {lead.email && (
        <a
          href={`mailto:${lead.email}`}
          className="mt-1 block text-[13px] text-[var(--text-secondary)] underline-offset-4 hover:underline"
        >
          {lead.email}
        </a>
      )}

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
        {lead.message && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-white/45">Meddelande:</dt>
            <dd className="whitespace-pre-wrap">{lead.message}</dd>
          </div>
        )}
      </dl>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Anteckning från samtalet"
        className="mt-3 w-full rounded-lg border border-input bg-white px-3 py-2 text-[13px] text-[var(--cream)] outline-none transition-colors focus:border-bark"
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
              className="rounded-full border border-white/12 px-3 py-1 text-xs text-white/70 transition-colors hover:border-bark/50 hover:text-[var(--cream)] disabled:opacity-50"
            >
              {STATUSAR.find((x) => x.value === s)?.label}
            </button>
          ))}
      </div>
    </li>
  );
}
