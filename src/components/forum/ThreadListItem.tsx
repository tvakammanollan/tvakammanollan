import { Link } from "@tanstack/react-router";
import { CheckCircle2, Lock, MessageSquare, Pin } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { displayAuthor, excerpt, provTermLabel } from "@/lib/forum";
import type { ForumThreadSummary } from "@/lib/forum.functions";
import { formatInt, formatRelativeTime } from "@/lib/sv-format";

/** En rad i trådlistan — rubrik, utdrag och vem som skrev senast. */
export function ThreadListItem({
  thread,
  showCategory,
}: {
  thread: ForumThreadSummary;
  showCategory?: boolean;
}) {
  const preview = excerpt(thread.excerpt, 140);

  return (
    <li className="group rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm transition-colors hover:border-[var(--amber)]/40 hover:bg-white/[0.04]">
      <Link
        to="/forum/$kategori/$trad"
        params={{ kategori: thread.categorySlug, trad: `${thread.id}-${thread.slug}` }}
        className="flex gap-3 p-4 sm:gap-4 sm:p-5"
      >
        <UserAvatar name={displayAuthor(thread.author?.username)} size={38} className="mt-0.5" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {thread.isPinned && (
              <Pin className="h-3.5 w-3.5 shrink-0 text-[var(--amber)]" aria-label="Nålad" />
            )}
            {thread.isLocked && (
              <Lock
                className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]"
                aria-label="Låst"
              />
            )}
            <h3 className="text-[15px] font-semibold leading-snug text-[var(--cream)]">
              {thread.title}
            </h3>
            {thread.hasAnswer && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--success-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--success-ink)]">
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                Löst
              </span>
            )}
          </div>

          {preview && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--text-tertiary)]">
              {preview}
            </p>
          )}

          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-tertiary)]">
            <span>{displayAuthor(thread.author?.username)}</span>
            {showCategory && thread.categoryName && (
              <>
                <span aria-hidden>·</span>
                <span className="text-[var(--teal)]">{thread.categoryName}</span>
              </>
            )}
            {thread.provTerm && (
              <>
                <span aria-hidden>·</span>
                <span>{provTermLabel(thread.provTerm)}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>
              senast {formatRelativeTime(thread.lastPostAt)}
              {thread.lastPoster ? ` av ${displayAuthor(thread.lastPoster.username)}` : ""}
            </span>
          </p>
        </div>

        <span className="flex shrink-0 flex-col items-center justify-center gap-0.5 text-[var(--text-tertiary)]">
          <MessageSquare className="h-4 w-4" aria-hidden />
          <span className="text-xs tabular-nums">{formatInt(thread.replyCount)}</span>
          <span className="sr-only">svar</span>
        </span>
      </Link>
    </li>
  );
}
