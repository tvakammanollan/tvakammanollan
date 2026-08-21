import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  FilePenLine,
  Plus,
  BarChart3,
  Flag,
  MessagesSquare,
  Search,
  TrendingUp,
  Phone,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { applyOrdAudit, type OrdAuditResult } from "@/lib/ord-audit.functions";
import { AdminLeadsTab } from "@/components/AdminLeadsTab";
import { AdminUsageTab } from "@/components/AdminUsageTab";
import { AdminForumTab } from "@/components/AdminForumTab";
import { formatDate } from "@/lib/sv-format";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin · Tvåkommanollan" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const CATEGORIES = ["ORD", "MEK", "LAS", "ELF", "XYZ", "KVA", "NOG", "DTK"];
const VERBAL_CATS = ["ORD", "MEK", "LAS", "ELF"];

type QuestionRow = {
  id: string;
  category: string;
  subject_type: string;
  question_text: string;
  passage_text: string | null;
  options: unknown;
  correct_answer: string;
  difficulty: number | null;
  explanation: string | null;
  tags: string[] | null;
};

type ReportRow = {
  id: string;
  question_id: string;
  reason: string;
  comment: string | null;
  status: string;
  created_at: string;
  questions?: { category: string; question_text: string } | null;
};

function AdminPage() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("manage");

  useEffect(() => {
    if (loading) return;
    if (!profile?.is_admin) navigate({ to: "/" });
  }, [profile, loading, navigate]);

  if (loading || !profile?.is_admin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Laddar…
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Admin
        </h1>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Hem
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex flex-wrap gap-1">
          <TabsTrigger value="manage">
            <FilePenLine className="h-3.5 w-3.5" aria-hidden />
            Hantera frågor
          </TabsTrigger>
          <TabsTrigger value="new">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Ny fråga
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden />
            Frågestatistik
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Flag className="h-3.5 w-3.5" aria-hidden />
            Rapporter
          </TabsTrigger>
          <TabsTrigger value="ord-audit">
            <Search className="h-3.5 w-3.5" aria-hidden />
            ORD-audit
          </TabsTrigger>
          <TabsTrigger value="forum">
            <MessagesSquare className="h-3.5 w-3.5" aria-hidden />
            Forum
          </TabsTrigger>
          <TabsTrigger value="usage">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            Användning
          </TabsTrigger>
          <TabsTrigger value="leads">
            <Phone className="h-3.5 w-3.5" aria-hidden />
            Ringlista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <ManageTab />
        </TabsContent>
        <TabsContent value="new">
          <NewTab />
        </TabsContent>
        <TabsContent value="stats">
          <StatsTab />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
        <TabsContent value="ord-audit">
          <OrdAuditTab />
        </TabsContent>
        <TabsContent value="forum">
          <AdminForumTab />
        </TabsContent>
        <TabsContent value="usage">
          <AdminUsageTab />
        </TabsContent>
        <TabsContent value="leads">
          <AdminLeadsTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}

// ============== MANAGE TAB ==============
function ManageTab() {
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterDiff, setFilterDiff] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<QuestionRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("questions")
      .select(
        "id, category, subject_type, question_text, passage_text, options, difficulty, explanation, tags",
      )
      .order("category")
      .limit(200);
    if (filterCat !== "all") q = q.eq("category", filterCat);
    if (filterDiff !== "all") q = q.eq("difficulty", Number(filterDiff));
    if (missingOnly) q = q.is("explanation", null);
    if (search.trim()) q = q.ilike("question_text", `%${search.trim()}%`);
    const { data, error } = await q;
    if (error) toast.error("Kunde inte hämta frågor");
    setRows((data ?? []) as QuestionRow[]);
    setLoading(false);
  }, [filterCat, filterDiff, search, missingOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger>
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla kategorier</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDiff} onValueChange={setFilterDiff}>
          <SelectTrigger>
            <SelectValue placeholder="Svårighet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla svårigheter</SelectItem>
            {[1, 2, 3, 4, 5].map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Sök i frågetext…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={missingOnly} onCheckedChange={(v) => setMissingOnly(!!v)} />
          Saknar förklaring
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Kategori</th>
              <th className="px-3 py-2">Svårighet</th>
              <th className="px-3 py-2">Frågetext</th>
              <th className="px-3 py-2">Förklaring</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Laddar…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Inga frågor
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{r.category}</td>
                  <td className="px-3 py-2 tabular-nums">{r.difficulty ?? "–"}</td>
                  <td className="px-3 py-2">
                    {(r.question_text ?? "").slice(0, 60)}
                    {(r.question_text?.length ?? 0) > 60 ? "…" : ""}
                  </td>
                  <td className="px-3 py-2">
                    {r.explanation?.trim() ? (
                      <Check
                        className="h-4 w-4 text-[var(--success)]"
                        aria-label="Har förklaring"
                      />
                    ) : (
                      <X className="h-4 w-4 text-[var(--amber)]" aria-label="Saknar förklaring" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                      Redigera
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <QuestionEditor
          question={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

// ============== NEW TAB ==============
function NewTab() {
  const empty: QuestionRow = {
    id: "",
    category: "ORD",
    subject_type: "verbal",
    question_text: "",
    passage_text: null,
    options: [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" },
    ],
    correct_answer: "A",
    difficulty: 3,
    explanation: "",
    tags: [],
  };
  const [key, setKey] = useState(0);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <QuestionEditor
        key={key}
        question={empty}
        isNew
        onSaved={() => {
          setKey((k) => k + 1);
          toast.success("Fråga sparad");
        }}
        onClose={() => {
          /* embedded */
        }}
        embedded
      />
    </div>
  );
}

// ============== STATS TAB ==============
function StatsTab() {
  const [rows, setRows] = useState<{ category: string; total: number; with_e: number }[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("questions")
        .select("category, explanation")
        .limit(10000);
      const map = new Map<string, { total: number; with_e: number }>();
      for (const r of data ?? []) {
        const c = (r as { category: string }).category;
        const e = (r as { explanation: string | null }).explanation;
        const t = map.get(c) ?? { total: 0, with_e: 0 };
        t.total += 1;
        if (e && e.trim()) t.with_e += 1;
        map.set(c, t);
      }
      setRows(
        [...map.entries()]
          .map(([category, v]) => ({ category, total: v.total, with_e: v.with_e }))
          .sort((a, b) => a.category.localeCompare(b.category)),
      );
    })();
  }, []);
  const total = rows.reduce((s, r) => s + r.total, 0);
  const withE = rows.reduce((s, r) => s + r.with_e, 0);
  const pct = total > 0 ? Math.round((withE / total) * 100) : 0;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Kategori</th>
            <th className="px-3 py-2 text-right">Totalt</th>
            <th className="px-3 py-2 text-right">Med förklaring</th>
            <th className="px-3 py-2 text-right">Saknar förklaring</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const missing = r.total - r.with_e;
            return (
              <tr
                key={r.category}
                className={`border-t border-border ${missing > 0 ? "bg-[#ae2f26]/10" : ""}`}
              >
                <td className="px-3 py-2 font-medium">{r.category}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.total}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.with_e}</td>
                <td className="px-3 py-2 text-right tabular-nums">{missing}</td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-border bg-muted/40 font-semibold">
            <td className="px-3 py-2">Totalt</td>
            <td className="px-3 py-2 text-right tabular-nums">{total}</td>
            <td className="px-3 py-2 text-right tabular-nums">
              {withE} ({pct}%)
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{total - withE}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ============== REPORTS TAB ==============
function ReportsTab() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [editing, setEditing] = useState<QuestionRow | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("question_reports")
      .select(
        "id, question_id, reason, comment, status, created_at, questions(category, question_text)",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as ReportRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("question_reports").update({ status }).eq("id", id);
    if (error) toast.error("Kunde inte uppdatera");
    else {
      toast.success("Uppdaterad");
      void load();
    }
  };

  const openQuestion = async (qId: string) => {
    const { data } = await supabase
      .from("questions")
      .select(
        "id, category, subject_type, question_text, passage_text, options, difficulty, explanation, tags",
      )
      .eq("id", qId)
      .maybeSingle();
    if (!data) return;
    // Facit går inte längre att läsa som kolumn — se
    // 20260818140000_dolj_facit.sql. Admin hämtar det via definer-funktionen,
    // som kontrollerar is_admin i stället för kolumnrättigheten.
    const { data: answer, error } = await supabase.rpc("admin_question_answer", { _id: qId });
    if (error) {
      console.error("[admin] kunde inte hämta facit", error.message);
      toast.error("Kunde inte hämta facit för frågan");
      return;
    }
    setEditing({ ...(data as object), correct_answer: answer ?? "" } as QuestionRow);
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Fråga</th>
              <th className="px-3 py-2">Kategori</th>
              <th className="px-3 py-2">Anledning</th>
              <th className="px-3 py-2">Kommentar</th>
              <th className="px-3 py-2">Datum</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Inga rapporter
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">{(r.questions?.question_text ?? "").slice(0, 50)}…</td>
                  <td className="px-3 py-2">{r.questions?.category ?? "–"}</td>
                  <td className="px-3 py-2">{r.reason}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.comment ?? "–"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatDate(r.created_at, {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openQuestion(r.question_id)}
                      >
                        Granska
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(r.id, "resolved")}
                      >
                        Löst
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(r.id, "dismissed")}
                      >
                        Avfärda
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <QuestionEditor
          question={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ============== EDITOR ==============
function QuestionEditor({
  question,
  onClose,
  onSaved,
  isNew,
  embedded,
}: {
  question: QuestionRow;
  onClose: () => void;
  onSaved: () => void;
  isNew?: boolean;
  embedded?: boolean;
}) {
  const [form, setForm] = useState<QuestionRow>(() => ({
    ...question,
    options: normalizeOptions(question.options, question.category),
    tags: question.tags ?? [],
  }));
  const [saving, setSaving] = useState(false);

  const opts = (form.options as { id: string; text: string }[]) ?? [];
  const showPassage = ["LAS", "ELF", "DTK"].includes(form.category);
  const showE = form.category === "ORD";

  const setOpt = (i: number, text: string) => {
    const next = [...opts];
    next[i] = { ...next[i], text };
    setForm({ ...form, options: next });
  };

  const save = async () => {
    if (!form.question_text.trim()) {
      toast.error("Frågetext krävs");
      return;
    }
    setSaving(true);
    const payload = {
      category: form.category,
      subject_type: form.subject_type,
      question_text: form.question_text,
      passage_text: showPassage ? form.passage_text : null,
      options: opts.filter((o) => o.text.trim()),
      correct_answer: form.correct_answer,
      difficulty: form.difficulty,
      explanation: form.explanation || null,
      tags: form.tags ?? [],
    };
    const res = isNew
      ? await supabase.from("questions").insert(payload)
      : await supabase.from("questions").update(payload).eq("id", form.id);
    setSaving(false);
    if (res.error) {
      console.error(res.error);
      toast.error("Kunde inte spara");
      return;
    }
    toast.success("Sparad");
    onSaved();
  };

  const body = (
    <div className="grid gap-3">
      {isNew && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Kategori</Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  category: v,
                  subject_type: VERBAL_CATS.includes(v) ? "verbal" : "math",
                  options: normalizeOptions(form.options, v),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Typ</Label>
            <Select
              value={form.subject_type}
              onValueChange={(v) => setForm({ ...form, subject_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verbal">Verbal</SelectItem>
                <SelectItem value="math">Math</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <div>
        <Label>Frågetext</Label>
        <Textarea
          rows={3}
          value={form.question_text}
          onChange={(e) => setForm({ ...form, question_text: e.target.value })}
        />
      </div>
      {showPassage && (
        <div>
          <Label>Passage</Label>
          <Textarea
            rows={5}
            value={form.passage_text ?? ""}
            onChange={(e) => setForm({ ...form, passage_text: e.target.value })}
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label>Svarsalternativ</Label>
        {(showE ? ["A", "B", "C", "D", "E"] : ["A", "B", "C", "D"]).map((letter, i) => (
          <div key={letter} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              checked={form.correct_answer === letter}
              onChange={() => setForm({ ...form, correct_answer: letter })}
            />
            <span className="w-5 text-sm font-semibold">{letter}</span>
            <Input value={opts[i]?.text ?? ""} onChange={(e) => setOpt(i, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Svårighet ({form.difficulty ?? 3})</Label>
          <input
            type="range"
            min={1}
            max={5}
            value={form.difficulty ?? 3}
            onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        <div>
          <Label>Taggar (komma-separerade)</Label>
          <Input
            value={(form.tags ?? []).join(", ")}
            onChange={(e) =>
              setForm({
                ...form,
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            placeholder="t.ex. geometri, area"
          />
        </div>
      </div>
      <div>
        <Label>Förklaring</Label>
        <Textarea
          rows={6}
          value={form.explanation ?? ""}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          placeholder="Skriv en pedagogisk förklaring. För matte: numrera stegen (1. 2. 3.). För ORD: ge etymologi eller kontext."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {!embedded && (
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Avbryt
          </Button>
        )}
        <Button onClick={save} disabled={saving}>
          {saving ? "Sparar…" : "Spara"}
        </Button>
      </div>
    </div>
  );

  if (embedded) return body;

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Ny fråga" : "Redigera fråga"}</DialogTitle>
        </DialogHeader>
        {body}
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}

function normalizeOptions(raw: unknown, category: string): { id: string; text: string }[] {
  const letters = category === "ORD" ? ["A", "B", "C", "D", "E"] : ["A", "B", "C", "D"];
  const arr = Array.isArray(raw) ? raw : [];
  return letters.map((id, i) => {
    const o = arr[i];
    if (o && typeof o === "object" && "text" in (o as Record<string, unknown>)) {
      const obj = o as { id?: string; text: unknown };
      return { id: obj.id ?? id, text: String(obj.text ?? "") };
    }
    return { id, text: typeof o === "string" ? o : "" };
  });
}

// ============== ORD-AUDIT TAB ==============
function OrdAuditTab() {
  const runFn = useServerFn(applyOrdAudit);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<OrdAuditResult | null>(null);
  const [includeMedium, setIncludeMedium] = useState(true);
  const [includeLow, setIncludeLow] = useState(false);
  const [dryRun, setDryRun] = useState(true);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const r = await runFn({ data: { includeMedium, includeLow, dryRun } });
      setResult(r);
      if (dryRun) {
        toast.success(`DRY RUN: ${r.fixed} skulle uppdateras, ${r.already_correct} redan korrekta`);
      } else {
        toast.success(`Klart: ${r.fixed} uppdaterade, ${r.already_correct} redan korrekta`);
      }
    } catch (e) {
      toast.error("Fel: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setRunning(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "fixed") return "text-emerald-600";
    if (s === "already_correct") return "text-neutral-500";
    if (s === "not_found") return "text-amber-600";
    if (s === "mismatched") return "text-amber-600";
    if (s === "failed") return "text-red-600";
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          <Search className="mr-2 inline h-5 w-5 align-[-3px]" aria-hidden />
          ORD-audit · applicera manuella fixar
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Kör de 134 manuellt granskade fixarna från{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.ord-audit/manual-fixes.json</code>
          . Idempotent: en redan rättad rad skrivs aldrig över.
        </p>

        <div className="space-y-3 mb-5">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={dryRun} onCheckedChange={(c) => setDryRun(c === true)} />
            <span>
              <strong>Dry run</strong>: kör ingenting, visa bara vad som skulle hända
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={includeMedium}
              onCheckedChange={(c) => setIncludeMedium(c === true)}
            />
            <span>Inkludera medium-confidence fixar (1 st: FÖRSITTA)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={includeLow} onCheckedChange={(c) => setIncludeLow(c === true)} />
            <span>Inkludera low-confidence fixar (1 st: KURANT, rekommenderas ej)</span>
          </label>
        </div>

        <Button
          onClick={run}
          disabled={running}
          className={dryRun ? "" : "bg-amber-600 hover:bg-amber-700"}
        >
          {running ? "Kör…" : dryRun ? "Kör DRY RUN" : "Applicera fixar"}
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <SummaryStat label="Försökta" value={result.total_attempted} />
            <SummaryStat
              label={dryRun ? "Skulle fixas" : "Fixade"}
              value={result.fixed}
              accent="emerald"
            />
            <SummaryStat label="Redan korrekta" value={result.already_correct} />
            <SummaryStat label="Ej hittade" value={result.not_found} accent="amber" />
            <SummaryStat
              label="Mismatched"
              value={result.mismatched + result.failed}
              accent={result.failed > 0 ? "red" : "amber"}
            />
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detaljerad lista
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/50 text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">Ord</th>
                    <th className="px-3 py-2 text-left">Ändring</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Not</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-1.5 font-medium">{r.word}</td>
                      <td className="px-3 py-1.5 tabular-nums">
                        {r.from && r.to ? `${r.from} → ${r.to}` : "–"}
                      </td>
                      <td className={`px-3 py-1.5 font-semibold ${statusColor(r.status)}`}>
                        {r.status}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{r.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber" | "red";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "amber"
        ? "text-amber-600"
        : accent === "red"
          ? "text-red-600"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-2xl font-bold tabular-nums ${color}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
    </div>
  );
}
