import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { pageMeta } from "@/lib/page-meta";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ForumComposer } from "@/components/forum/ForumComposer";
import { useForumPermission } from "@/hooks/useForumPermission";
import { createForumThread, fetchForumCategories } from "@/lib/forum.functions";
import { MAX_TITLE_LENGTH, MIN_TITLE_LENGTH } from "@/lib/forum";
import { allExams } from "@/lib/prov-data";

/* =====================================================================
   Skapa tråd. Noindex — sidan har inget eget innehåll att indexera, och
   ett formulär i sökresultaten hjälper ingen.
   ===================================================================== */

const searchSchema = z.object({
  kategori: z.string().max(40).optional(),
});

export const Route = createFileRoute("/forum_/nytt")({
  validateSearch: searchSchema,
  loader: () => fetchForumCategories(),
  head: () => ({
    meta: pageMeta({
      path: "/forum/nytt",
      title: "Ny tråd · Tvåkommanollans forum",
      description: "Starta en ny tråd i forumet om högskoleprovet.",
      noindex: true,
    }),
  }),
  component: NewThreadPage,
});

function NewThreadPage() {
  const categories = Route.useLoaderData();
  const { kategori } = Route.useSearch();
  const navigate = useNavigate();
  const { canPost, reason } = useForumPermission();
  const create = useServerFn(createForumThread);

  const [categorySlug, setCategorySlug] = useState(kategori ?? categories[0]?.slug ?? "allmant");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [provTerm, setProvTerm] = useState("");
  const [sending, setSending] = useState(false);

  const exams = allExams();
  const category = categories.find((c) => c.slug === categorySlug);
  const titleOk =
    title.trim().length >= MIN_TITLE_LENGTH && title.trim().length <= MAX_TITLE_LENGTH;

  const submit = async () => {
    if (!titleOk) {
      toast.error(`Rubriken måste vara mellan ${MIN_TITLE_LENGTH} och ${MAX_TITLE_LENGTH} tecken.`);
      return;
    }
    setSending(true);
    try {
      const res = await create({
        data: {
          categorySlug,
          title: title.trim(),
          body,
          provTerm: provTerm || null,
        },
      });

      if (res.pending) {
        toast.success("Tråden är skickad och granskas innan den syns.");
        await navigate({ to: "/forum/$kategori", params: { kategori: res.categorySlug } });
        return;
      }

      toast.success("Tråden är publicerad.");
      await navigate({
        to: "/forum/$kategori/$trad",
        params: { kategori: res.categorySlug, trad: `${res.threadId}-${res.slug}` },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/forum" className="hover:text-white/70">
          Forum
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Ny tråd</span>
      </nav>

      <h1
        className="mt-4 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[34px]"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
      >
        Ny tråd
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/60">
        Skriv en rubrik som säger vad frågan gäller. Det är den som andra googlar. "KVA med rötter,
        uppgift 12 VT2024" hittas; "hjälp!!!" gör det inte.
      </p>

      <div className="mt-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="kategori">Kategori</Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger id="kategori" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category && (
              <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{category.description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="provtillfalle">Provtillfälle (frivilligt)</Label>
            <Select
              value={provTerm || "inget"}
              onValueChange={(v) => setProvTerm(v === "inget" ? "" : v)}
            >
              <SelectTrigger id="provtillfalle" className="mt-1.5">
                <SelectValue placeholder="Inget särskilt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inget">Inget särskilt</SelectItem>
                {exams.map((e) => (
                  <SelectItem key={e.term} value={e.term}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
              Gäller frågan en uppgift ur ett visst prov blir tråden lättare att hitta.
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="rubrik">Rubrik</Label>
          <Input
            id="rubrik"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            placeholder="Hur löser man KVA-uppgifter med rötter?"
            className="mt-1.5"
          />
          <p className="mt-1.5 text-xs tabular-nums text-[var(--text-tertiary)]">
            {title.trim().length} / {MAX_TITLE_LENGTH}
          </p>
        </div>

        <div>
          <Label>Inlägg</Label>
          <div className="mt-1.5">
            <ForumComposer
              value={body}
              onChange={setBody}
              onSubmit={submit}
              submitting={sending}
              canPost={canPost}
              blockReason={reason}
              submitLabel="Publicera tråd"
              placeholder="Beskriv vad du fastnat på. Har du testat något som inte funkade, skriv det också, då slipper den som svarar gissa."
            />
          </div>
        </div>

        {canPost && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" asChild>
              <Link to="/forum">Avbryt</Link>
            </Button>
            <Button onClick={submit} disabled={sending || !titleOk}>
              {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Publicera tråd
            </Button>
          </div>
        )}

        <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
          Genom att publicera godkänner du{" "}
          <Link to="/forum/regler" className="text-[var(--teal)] hover:underline">
            forumreglerna
          </Link>
          . Klistra inte in hela lästexter eller provuppgifter ur UHR:s häften, länka till{" "}
          <Link to="/gamla-prov" className="text-[var(--teal)] hover:underline">
            gamla prov
          </Link>{" "}
          i stället.
        </p>
      </div>
    </div>
  );
}
