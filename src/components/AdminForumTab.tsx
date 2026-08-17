import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Ban,
  Bomb,
  Check,
  ExternalLink,
  EyeOff,
  Flag,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { ForumBody } from "@/components/forum/ForumBody";
import {
  banForumUser,
  fetchForumModeration,
  moderateForumPost,
  nukeForumUser,
  type ModerationPost,
  type ModerationQueue,
} from "@/lib/forum-moderation.functions";
import { REPORT_REASONS, displayAuthor } from "@/lib/forum";
import { formatDate, formatInt, formatRelativeTime } from "@/lib/sv-format";

/**
 * Moderationskön.
 *
 * Byggd för att skötas av en person på några sekunder per inlägg: kön är
 * inlägg i granskning plus inlägg med obehandlade rapporter, äldst först, och
 * varje rad har alla åtgärder direkt — inklusive "nuke", som döljer allt
 * användaren skrivit det senaste dygnet i ett klick.
 */
export function AdminForumTab() {
  const [queue, setQueue] = useState<ModerationQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useServerFn(fetchForumModeration);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setQueue(await load({}));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte hämta kön.");
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading && !queue) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        Hämtar kön…
      </div>
    );
  }

  if (!queue || queue.posts.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Kön är tom"
        subtitle="Inga inlägg väntar på granskning och inga rapporter är obehandlade."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {formatInt(queue.pendingCount)} i granskning · {formatInt(queue.reportCount)} rapporterade
        </p>
        <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Uppdatera
        </Button>
      </div>

      <ul className="space-y-3">
        {queue.posts.map((post) => (
          <QueueItem
            key={post.id}
            post={post}
            busy={busy === post.id}
            setBusy={setBusy}
            onDone={refresh}
          />
        ))}
      </ul>
    </div>
  );
}

const REASON_LABEL = new Map<string, string>(REPORT_REASONS.map((r) => [r.value, r.label]));

function QueueItem({
  post,
  busy,
  setBusy,
  onDone,
}: {
  post: ModerationPost;
  busy: boolean;
  setBusy: (id: number | null) => void;
  onDone: () => Promise<void>;
}) {
  const moderate = useServerFn(moderateForumPost);
  const ban = useServerFn(banForumUser);
  const nuke = useServerFn(nukeForumUser);

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(post.id);
    try {
      await fn();
      toast.success(message);
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setBusy(null);
    }
  };

  const banned = post.authorBannedUntil && new Date(post.authorBannedUntil) > new Date();

  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-[var(--cream)]">
              {displayAuthor(post.authorName)}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {formatInt(post.authorPostCount)} inlägg totalt
            </span>
            {post.status === "pending" && (
              <span className="rounded-full bg-[var(--amber)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--amber)]">
                I granskning
              </span>
            )}
            {banned && (
              <span className="rounded-full bg-[var(--danger-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--danger-ink)]">
                Avstängd t.o.m. {formatDate(post.authorBannedUntil!)}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {formatRelativeTime(post.createdAt)} i{" "}
            <Link
              to="/forum/$kategori/$trad"
              params={{ kategori: post.categorySlug, trad: String(post.threadId) }}
              target="_blank"
              className="inline-flex items-center gap-1 text-[var(--teal)] hover:underline"
            >
              {post.threadTitle}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
          </p>
        </div>
      </header>

      {post.reports.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3">
          {post.reports.map((r) => (
            <li key={r.id} className="flex items-start gap-2 text-xs text-[var(--danger-ink)]">
              <Flag className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              <span>
                <span className="font-medium">{REASON_LABEL.get(r.reason) ?? r.reason}</span>
                {r.note ? ` — ${r.note}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <ForumBody body={post.body} />
      </div>

      <footer className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() =>
            run(
              () => moderate({ data: { postId: post.id, action: "approve" } }),
              "Inlägget är godkänt.",
            )
          }
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
          Godkänn
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() =>
            run(() => moderate({ data: { postId: post.id, action: "hide" } }), "Inlägget är dolt.")
          }
        >
          <EyeOff className="h-3.5 w-3.5" aria-hidden />
          Dölj
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() =>
            run(
              () => moderate({ data: { postId: post.id, action: "delete" } }),
              "Inlägget är raderat.",
            )
          }
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Radera
        </Button>

        <span className="mx-1 w-px self-stretch bg-white/10" aria-hidden />

        {[
          { days: 7, label: "Stäng av 7 d" },
          { days: 30, label: "Stäng av 30 d" },
          { days: 0, label: "Permanent" },
        ].map((opt) => (
          <Button
            key={opt.days}
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (!confirm(`${opt.label} — ${displayAuthor(post.authorName)}?`)) return;
              void run(async () => {
                await moderate({ data: { postId: post.id, action: "delete" } });
                await ban({ data: { targetId: post.authorId, days: opt.days } });
              }, "Användaren är avstängd och inlägget raderat.");
            }}
          >
            <Ban className="h-3.5 w-3.5" aria-hidden />
            {opt.label}
          </Button>
        ))}

        {banned && (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() =>
              run(
                () => ban({ data: { targetId: post.authorId, days: null } }),
                "Avstängningen är hävd.",
              )
            }
          >
            Häv avstängning
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            if (!confirm(`Radera ALLT ${displayAuthor(post.authorName)} skrivit senaste dygnet?`))
              return;
            void run(async () => {
              const res = await nuke({ data: { targetId: post.authorId, hours: 24 } });
              return res;
            }, "Allt från senaste dygnet är raderat.");
          }}
        >
          <Bomb className="h-3.5 w-3.5" aria-hidden />
          Nuke 24 h
        </Button>
      </footer>
    </li>
  );
}
