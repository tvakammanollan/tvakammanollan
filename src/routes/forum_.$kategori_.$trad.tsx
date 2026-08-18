import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, notFound, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowDown, Bell, BellOff, Lock, MessageSquarePlus, Pin, Trash2 } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { supabase } from "@/integrations/supabase/client";
import { ForumPostCard } from "@/components/forum/ForumPostCard";
import { ForumComposer } from "@/components/forum/ForumComposer";
import { ForumPagination } from "@/components/forum/ForumPagination";
import { useForumPermission } from "@/hooks/useForumPermission";
import { useAuth } from "@/hooks/useAuth";
import {
  createForumPost,
  fetchForumThread,
  fetchForumThreadState,
  markForumThreadRead,
  setForumAnswer,
  toggleForumSubscription,
  type ForumPost,
  type ForumThreadData,
} from "@/lib/forum.functions";
import { moderateForumThread, type ThreadModerationInput } from "@/lib/forum-moderation.functions";
import {
  buildQuote,
  displayAuthor,
  excerpt,
  pageCount,
  parseThreadParam,
  provTermLabel,
  threadPath,
} from "@/lib/forum";
import { formatDate, formatInt } from "@/lib/sv-format";

/* =====================================================================
   En tråd: platt och kronologisk, med citat i stället för svarsträd.

   URL:en är /forum/<kategori>/<id>-<slug>. Uppslag sker på id, så en ändrad
   rubrik gör aldrig en gammal länk trasig — fel slug 301:as hit i stället.
   ===================================================================== */

const searchSchema = z.object({
  sida: z.number().int().min(1).max(10000).optional(),
});

export const Route = createFileRoute("/forum_/$kategori_/$trad")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ sida: search.sida ?? 1 }),
  loader: async ({ params, deps }) => {
    const parsed = parseThreadParam(params.trad);
    if (!parsed) throw notFound();

    const data = await fetchForumThread({ data: { id: parsed.id, page: deps.sida } });
    if (!data) throw notFound();

    // Fel slug eller fel kategori i länken: skicka vidare till den rätta.
    const canonicalTrad = `${data.thread.id}-${data.thread.slug}`;
    if (params.trad !== canonicalTrad || params.kategori !== data.category.slug) {
      throw redirect({
        to: "/forum/$kategori/$trad",
        params: { kategori: data.category.slug, trad: canonicalTrad },
        search: deps.sida > 1 ? { sida: deps.sida } : {},
        statusCode: 301,
      });
    }
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { thread, category, posts, page, total, perPage } = loaderData;
    const base = threadPath(category.slug, thread.id, thread.slug);
    const path = page > 1 ? `${base}?sida=${page}` : base;
    const suffix = page > 1 ? ` – sida ${page}` : "";
    const first = posts[0];
    const description = first
      ? excerpt(first.body, 155)
      : `Diskussion om högskoleprovet i ${category.name}.`;

    const answer = posts.find((p) => p.isAnswer);
    const isQa = category.kind === "qa";

    return {
      meta: pageMeta({
        path,
        title: `${thread.title}${suffix} · HP Kampens forum`,
        description,
        ogTitle: thread.title,
        ogDescription: description,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Forum", path: "/forum" },
          { name: category.name, path: `/forum/${category.slug}` },
          { name: thread.title, path: base },
        ]),
        jsonLdScript(
          isQa
            ? qaPageSchema({ thread, category, posts, answer, total, base })
            : discussionSchema({ thread, category, posts, total, base }),
        ),
      ],
    };
  },
  component: ForumThreadPage,
});

/* ------------------------------------------------------------------ *
 * Structured data
 * ------------------------------------------------------------------ */

function authorSchema(name: string | null | undefined) {
  return { "@type": "Person", name: displayAuthor(name) };
}

function answerSchema(post: ForumPost, base: string) {
  return {
    "@type": "Answer",
    text: post.body,
    dateCreated: post.createdAt,
    url: `https://tvakommanollan.se${base}#inlagg-${post.id}`,
    author: authorSchema(post.author?.username),
    upvoteCount: post.helpfulCount,
  };
}

/** Q&A-kategorier: QAPage med acceptedAnswer ger ett eget rich result. */
function qaPageSchema({
  thread,
  category,
  posts,
  answer,
  total,
  base,
}: {
  thread: ForumThreadData["thread"];
  category: ForumThreadData["category"];
  posts: ForumPost[];
  answer: ForumPost | undefined;
  total: number;
  base: string;
}) {
  const [question, ...replies] = posts;
  const suggested = replies.filter((p) => p.id !== answer?.id);

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    inLanguage: "sv-SE",
    isPartOf: { "@id": "https://tvakommanollan.se/#website" },
    mainEntity: {
      "@type": "Question",
      name: thread.title,
      text: question?.body ?? thread.title,
      dateCreated: thread.createdAt,
      answerCount: Math.max(0, total - 1),
      author: authorSchema(thread.author?.username),
      url: `https://tvakommanollan.se${base}`,
      about: { "@type": "Thing", name: `Högskoleprovet – ${category.name}` },
      ...(answer ? { acceptedAnswer: answerSchema(answer, base) } : {}),
      ...(suggested.length > 0
        ? { suggestedAnswer: suggested.map((p) => answerSchema(p, base)) }
        : {}),
    },
  };
}

function discussionSchema({
  thread,
  category,
  posts,
  total,
  base,
}: {
  thread: ForumThreadData["thread"];
  category: ForumThreadData["category"];
  posts: ForumPost[];
  total: number;
  base: string;
}) {
  const [first, ...replies] = posts;
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: thread.title,
    articleBody: first?.body ?? "",
    datePublished: thread.createdAt,
    url: `https://tvakommanollan.se${base}`,
    inLanguage: "sv-SE",
    author: authorSchema(thread.author?.username),
    isPartOf: { "@id": "https://tvakommanollan.se/#website" },
    about: { "@type": "Thing", name: `Högskoleprovet – ${category.name}` },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: Math.max(0, total - 1),
    },
    comment: replies.map((p) => ({
      "@type": "Comment",
      text: p.body,
      dateCreated: p.createdAt,
      url: `https://tvakommanollan.se${base}#inlagg-${p.id}`,
      author: authorSchema(p.author?.username),
    })),
  };
}

/* ------------------------------------------------------------------ *
 * Sidan
 * ------------------------------------------------------------------ */

function ForumThreadPage() {
  const { thread, category, posts, page, total, perPage } = Route.useLoaderData();
  const router = useRouter();
  const navigate = Route.useNavigate();
  const { profile } = useAuth();
  const { canPost, reason, userId } = useForumPermission();

  const [draft, setDraft] = useState("");
  const [quotedPostId, setQuotedPostId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  // Egen prenumeration + egna reaktioner. Hämtas separat från loadern, som är
  // publik och serverrenderad — trådsidan ska kunna cachas lika för alla.
  const [subscribed, setSubscribed] = useState(false);
  const [reacted, setReacted] = useState<Set<number>>(() => new Set());
  const [subBusy, setSubBusy] = useState(false);
  const [newPosts, setNewPosts] = useState(0);

  const post = useServerFn(createForumPost);
  const moderate = useServerFn(moderateForumThread);
  const markAnswer = useServerFn(setForumAnswer);
  const loadState = useServerFn(fetchForumThreadState);
  const toggleSub = useServerFn(toggleForumSubscription);
  const markRead = useServerFn(markForumThreadRead);

  const pages = pageCount(total, perPage);
  const isAdmin = !!profile?.is_admin;
  const isQa = category.kind === "qa";
  const firstNumber = (page - 1) * perPage + 1;
  const isThreadAuthor = !!userId && thread.author?.id === userId;
  const canMarkAnswer = isAdmin || isThreadAuthor;

  const postIdsKey = posts.map((p) => p.id).join(",");

  // Eget tillstånd för sidan + markera tråden läst. Båda är tysta: en trasig
  // notisräknare får aldrig fälla en tråd som annars går att läsa.
  useEffect(() => {
    if (!userId) {
      setSubscribed(false);
      setReacted(new Set());
      return;
    }
    let cancelled = false;
    const ids = postIdsKey ? postIdsKey.split(",").map(Number) : [];
    void (async () => {
      try {
        const res = await loadState({ data: { threadId: thread.id, postIds: ids } });
        if (!cancelled) {
          setSubscribed(res.subscribed);
          setReacted(new Set(res.reacted));
        }
      } catch {
        /* tyst */
      }
      try {
        await markRead({ data: { threadId: thread.id } });
      } catch {
        /* tyst */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, thread.id, postIdsKey, loadState, markRead]);

  // Realtid: räkna nya inlägg i tråden i stället för att klistra in dem.
  // Auto-append hoppar i scrollen mitt i att någon läser.
  useEffect(() => {
    // Bara på sista sidan — nya inlägg hamnar aldrig på en tidigare sida.
    if (page !== pages) return;

    // Unikt kanalnamn per montering: ett återanvänt topic under snabb
    // om-montering kastar "cannot add postgres_changes callbacks after
    // subscribe()" (har kraschat inloggningen i den här appen förut).
    const channelName = `forum-thread-${thread.id}-${Math.random().toString(36).slice(2)}`;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    try {
      ch = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "forum_posts",
            filter: `thread_id=eq.${thread.id}`,
          },
          (payload) => {
            const row = payload.new as { status?: string; author_id?: string };
            // Egna inlägg syns direkt via invalidate(), och ett inlägg i
            // moderationskön ska inte annonseras för andra.
            if (row.status !== "visible" || row.author_id === userId) return;
            setNewPosts((n) => n + 1);
          },
        )
        .subscribe();
    } catch {
      /* realtime kan strula — tråden fungerar ändå, bara utan liveräknare */
    }
    return () => {
      if (ch) void supabase.removeChannel(ch);
    };
  }, [thread.id, userId, page, pages]);

  const showNewPosts = useCallback(async () => {
    setNewPosts(0);
    await router.invalidate();
  }, [router]);

  const quote = (target: ForumPost) => {
    setQuotedPostId(target.id);
    setDraft((d) => buildQuote(target.author?.username ?? "", target.body) + d);
    document.getElementById("svara")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submit = async () => {
    setSending(true);
    try {
      const res = await post({
        data: { threadId: thread.id, body: draft, quotedPostId },
      });
      setDraft("");
      setQuotedPostId(null);
      setNewPosts(0); // invalidate() nedan hämtar hem allt nytt ändå

      if (res.pending) {
        toast.success("Inlägget är skickat och granskas innan det syns.");
      } else {
        toast.success("Inlägget är publicerat.");
      }

      await router.invalidate();
      const lastPage = pageCount(total + 1, perPage);
      if (!res.pending && lastPage !== page) {
        await navigate({ search: lastPage > 1 ? { sida: lastPage } : {} });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setSending(false);
    }
  };

  const runModeration = async (patch: ThreadModerationInput) => {
    try {
      await moderate({ data: patch });
      await router.invalidate();
      toast.success("Klart.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Något gick fel.");
    }
  };

  /**
   * Bästa svar. Går via forum_set_answer, inte moderationsvägen: det är
   * trådstartaren som vet vilket svar som löste problemet, och RPC:n avgör
   * vem som får sätta det.
   */
  const runAnswer = async (postId: number | null) => {
    try {
      await markAnswer({ data: { threadId: thread.id, postId } });
      await router.invalidate();
      toast.success(postId ? "Markerat som bästa svar." : "Markeringen är borttagen.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Något gick fel.");
    }
  };

  const runToggleSubscription = async () => {
    setSubBusy(true);
    try {
      const res = await toggleSub({ data: { threadId: thread.id } });
      setSubscribed(res.subscribed);
      toast.success(
        res.subscribed
          ? "Du följer tråden och får en notis vid nya svar."
          : "Du följer inte längre tråden.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setSubBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/forum" className="hover:text-white/70">
          Forum
        </Link>
        <span className="px-1.5">/</span>
        <Link
          to="/forum/$kategori"
          params={{ kategori: category.slug }}
          className="hover:text-white/70"
        >
          {category.name}
        </Link>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[26px] font-bold leading-tight text-[var(--cream)] sm:text-[34px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          {thread.isPinned && (
            <Pin className="mr-2 inline h-5 w-5 text-[var(--amber)]" aria-label="Nålad" />
          )}
          {thread.title}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-tertiary)]">
          <span>{displayAuthor(thread.author?.username)}</span>
          <span aria-hidden>·</span>
          <time dateTime={thread.createdAt}>{formatDate(thread.createdAt)}</time>
          <span aria-hidden>·</span>
          <span>{formatInt(thread.replyCount)} svar</span>
          {thread.provTerm && (
            <>
              <span aria-hidden>·</span>
              <Link
                to="/gamla-prov/$term"
                params={{ term: thread.provTerm }}
                className="text-[var(--teal)] hover:underline"
              >
                {provTermLabel(thread.provTerm)}
              </Link>
            </>
          )}
          {pages > 1 && (
            <>
              <span aria-hidden>·</span>
              <span>
                sida {page} av {pages}
              </span>
            </>
          )}
        </p>
      </header>

      {canPost && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void runToggleSubscription()}
            disabled={subBusy}
            aria-pressed={subscribed}
            className={
              subscribed
                ? "inline-flex items-center gap-2 rounded-lg border border-[var(--amber)]/40 bg-[var(--amber)]/10 px-3 py-1.5 text-xs font-medium text-[var(--amber)] transition-colors hover:bg-[var(--amber)]/20 disabled:opacity-50"
                : "inline-flex items-center gap-2 rounded-lg border border-white/12 px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--amber)]/50 hover:text-[var(--cream)] disabled:opacity-50"
            }
          >
            {subscribed ? (
              <>
                <Bell className="h-3.5 w-3.5" aria-hidden />
                Följer tråden
              </>
            ) : (
              <>
                <BellOff className="h-3.5 w-3.5" aria-hidden />
                Följ tråden
              </>
            )}
          </button>
        </div>
      )}

      {thread.isLocked && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-[var(--text-tertiary)]">
          <Lock className="h-4 w-4 shrink-0" aria-hidden />
          Tråden är låst. Den går att läsa men inte att svara i.
        </p>
      )}

      {isAdmin && (
        <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-[var(--amber)]/25 bg-[var(--amber)]/[0.06] p-3">
          <ModButton
            icon={Pin}
            label={thread.isPinned ? "Avnåla" : "Nåla"}
            onClick={() => runModeration({ threadId: thread.id, pinned: !thread.isPinned })}
          />
          <ModButton
            icon={Lock}
            label={thread.isLocked ? "Lås upp" : "Lås"}
            onClick={() => runModeration({ threadId: thread.id, locked: !thread.isLocked })}
          />
          <ModButton
            icon={Trash2}
            label="Radera tråd"
            onClick={() => {
              if (confirm("Radera hela tråden?")) {
                void runModeration({ threadId: thread.id, deleted: true });
              }
            }}
          />
        </div>
      )}

      <ol className="mt-6 grid gap-3">
        {posts.map((p, i) => (
          <li key={p.id}>
            <ForumPostCard
              post={p}
              number={firstNumber + i}
              isOp={p.author?.id === thread.author?.id}
              isQa={isQa}
              locked={thread.isLocked}
              canPost={canPost}
              blockReason={reason}
              currentUserId={userId}
              isAdmin={isAdmin}
              reacted={reacted.has(p.id)}
              canMarkAnswer={canMarkAnswer}
              onQuote={quote}
              onEdited={() => void router.invalidate()}
              onMarkAnswer={runAnswer}
            />
          </li>
        ))}
      </ol>

      {newPosts > 0 && (
        <button
          type="button"
          onClick={() => void showNewPosts()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--amber)]/30 bg-[var(--amber)]/[0.08] px-4 py-2.5 text-sm font-medium text-[var(--amber)] transition-colors hover:bg-[var(--amber)]/15"
        >
          <ArrowDown className="h-4 w-4" aria-hidden />
          {newPosts === 1 ? "1 nytt inlägg" : `${formatInt(newPosts)} nya inlägg`} — visa
        </button>
      )}

      <ForumPagination page={page} pageCount={pages} />

      <section id="svara" className="mt-10 scroll-mt-24">
        <h2
          className="mb-3 flex items-center gap-2 text-[18px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <MessageSquarePlus className="h-5 w-5 text-[var(--amber)]" aria-hidden />
          Svara
        </h2>

        {thread.isLocked && !isAdmin ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-[var(--text-tertiary)]">
            Tråden är låst.
          </p>
        ) : (
          <>
            {quotedPostId && (
              <p className="mb-2 text-xs text-[var(--text-tertiary)]">
                Svarar på inlägg #{quotedPostId} ·{" "}
                <button
                  type="button"
                  onClick={() => setQuotedPostId(null)}
                  className="underline underline-offset-2 hover:text-[var(--cream)]"
                >
                  ta bort kopplingen
                </button>
              </p>
            )}
            <ForumComposer
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              submitting={sending}
              canPost={canPost}
              blockReason={reason}
              submitLabel="Publicera svar"
              placeholder={
                isQa
                  ? "Visa gärna hur du tänker, inte bara svaret — det är det folk kommer tillbaka för."
                  : "Skriv ditt svar…"
              }
            />
          </>
        )}
      </section>

      <section className="mt-12 border-t border-white/8 pt-6 text-sm">
        <Link
          to="/forum/$kategori"
          params={{ kategori: category.slug }}
          className="text-[var(--teal)] hover:underline"
        >
          ← Alla trådar i {category.name}
        </Link>
      </section>
    </div>
  );
}

function ModButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Pin;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-2.5 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--amber)]/50 hover:text-[var(--cream)]"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}
