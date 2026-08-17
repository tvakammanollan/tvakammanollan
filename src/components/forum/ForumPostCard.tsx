import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, CornerUpLeft, Flag, Link2, Pencil, Quote, Shield } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { EloBadge } from "@/components/EloBadge";
import { ForumBody } from "./ForumBody";
import { ForumComposer } from "./ForumComposer";
import { ReportPostDialog } from "./ReportPostDialog";
import { editForumPost, type ForumPost } from "@/lib/forum.functions";
import { displayAuthor, EDIT_WINDOW_MINUTES, type BlockReason } from "@/lib/forum";
import { formatRelativeTime, formatDate } from "@/lib/sv-format";

/**
 * Ett inlägg i en platt, kronologisk tråd.
 *
 * Plattheten är ett medvetet val: en tråd ska gå att läsa uppifrån och ned.
 * Citat löser det som nästlade svarsträd annars skulle lösa, utan att göra
 * tråden till ett träd ingen orkar följa.
 */
export function ForumPostCard({
  post,
  number,
  isOp,
  isQa,
  locked,
  canPost,
  blockReason,
  currentUserId,
  isAdmin,
  onQuote,
  onEdited,
  onMarkAnswer,
}: {
  post: ForumPost;
  number: number;
  isOp: boolean;
  isQa: boolean;
  locked: boolean;
  canPost: boolean;
  blockReason: BlockReason | null;
  currentUserId: string | null;
  isAdmin: boolean;
  onQuote: (post: ForumPost) => void;
  onEdited: () => void;
  onMarkAnswer?: (postId: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body);
  const [saving, setSaving] = useState(false);
  const [reporting, setReporting] = useState(false);
  const edit = useServerFn(editForumPost);

  const isOwn = !!currentUserId && post.author?.id === currentUserId;
  const withinWindow =
    Date.now() - new Date(post.createdAt).getTime() < EDIT_WINDOW_MINUTES * 60 * 1000;
  const canEdit = isAdmin || (isOwn && withinWindow && canPost);
  const author = displayAuthor(post.author?.username);

  const save = async () => {
    setSaving(true);
    try {
      const res = await edit({ data: { postId: post.id, body: draft } });
      toast.success(
        res.pending ? "Ändringen är sparad och väntar på granskning." : "Inlägget är uppdaterat.",
      );
      setEditing(false);
      onEdited();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#inlagg-${post.id}`;
    void navigator.clipboard?.writeText(url);
    toast.success("Länk till inlägget kopierad.");
  };

  return (
    <article
      id={`inlagg-${post.id}`}
      className={
        post.isAnswer
          ? "scroll-mt-24 rounded-2xl border border-[var(--success-line)] bg-[var(--success-soft)] p-4 backdrop-blur-sm sm:p-5"
          : "scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm sm:p-5"
      }
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <UserAvatar name={author} size={34} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-[var(--cream)]">{author}</span>
            {post.author && post.author.elo > 0 && <EloBadge elo={post.author.elo} size="sm" />}
            {post.author?.isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--amber)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--amber)]">
                <Shield className="h-3 w-3" aria-hidden />
                Moderator
              </span>
            )}
            {isOp && (
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)]">
                Trådstartare
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
            <time dateTime={post.createdAt} title={formatDate(post.createdAt)}>
              {formatRelativeTime(post.createdAt)}
            </time>
            {post.editedAt && <span> · redigerad</span>}
          </p>
        </div>
        <span className="text-xs tabular-nums text-[var(--text-tertiary)]">#{number}</span>
      </header>

      {post.isAnswer && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--success-ink)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Bästa svar
        </p>
      )}

      {post.quotedPostId && (
        <a
          href={`#inlagg-${post.quotedPostId}`}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--cream)]"
        >
          <CornerUpLeft className="h-3.5 w-3.5" aria-hidden />
          Svar till {displayAuthor(post.quotedAuthor)}
        </a>
      )}

      <div className="mt-3">
        {editing ? (
          <ForumComposer
            value={draft}
            onChange={setDraft}
            onSubmit={save}
            submitting={saving}
            canPost
            blockReason={null}
            submitLabel="Spara"
            onCancel={() => {
              setDraft(post.body);
              setEditing(false);
            }}
            autoFocus
          />
        ) : (
          <ForumBody body={post.body} />
        )}
      </div>

      {!editing && (
        <footer className="mt-4 flex flex-wrap items-center gap-1 border-t border-white/8 pt-3">
          {!locked && <PostAction icon={Quote} label="Citera" onClick={() => onQuote(post)} />}
          {canEdit && (
            <PostAction icon={Pencil} label="Redigera" onClick={() => setEditing(true)} />
          )}
          <PostAction icon={Link2} label="Länk" onClick={copyLink} />
          {currentUserId && (
            <PostAction icon={Flag} label="Rapportera" onClick={() => setReporting(true)} />
          )}
          {isAdmin && isQa && onMarkAnswer && (
            <PostAction
              icon={CheckCircle2}
              label={post.isAnswer ? "Ta bort bästa svar" : "Markera som bästa svar"}
              onClick={() => onMarkAnswer(post.isAnswer ? null : post.id)}
            />
          )}
        </footer>
      )}

      {currentUserId && (
        <ReportPostDialog postId={post.id} open={reporting} onOpenChange={setReporting} />
      )}
    </article>
  );
}

function PostAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Quote;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-[var(--text-tertiary)] transition-colors hover:bg-white/[0.04] hover:text-[var(--cream)]"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}
