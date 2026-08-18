/**
 * Forumets serverfunktioner.
 *
 * Läsning är publik (ingen middleware) så att trådsidor kan serverrenderas i
 * route-loaders — utan det finns ingen text att indexera, och SEO är halva
 * poängen med forumet. Skrivning kräver riktigt konto och går genom RPC:erna
 * i migrationen, där kvoterna räknas ur tabellerna.
 *
 * VIKTIGT: supabaseAdmin går förbi RLS. Varje läsning filtrerar därför på
 * `status` här i koden — policyn i databasen är andra försvarslinjen, inte
 * första.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import {
  POSTS_PER_PAGE,
  THREADS_PER_PAGE,
  MAX_BODY_LENGTH,
  MIN_BODY_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_TITLE_LENGTH,
  slugifyTitle,
  forumErrorMessage,
  threadPath,
  excerpt,
  type BlockReason,
  type CategoryKind,
} from "./forum";

/** Logga DB-felet server-side men exponera bara generisk svensk text. */
function throwDbError(error: { message: string }, ctx: string): never {
  console.error(`[forum] ${ctx}:`, error.message);
  throw new Error("Något gick fel. Försök igen om en stund.");
}

/** Fel ur en RPC: översätt vår felkod, logga resten. */
function throwRpcError(error: { message: string }, ctx: string): never {
  console.error(`[forum] ${ctx}:`, error.message);
  throw new Error(forumErrorMessage(error.message));
}

/**
 * PostgREST svarar 416 PGRST103 när `range()` börjar bortom sista raden —
 * `?sida=99` på en kategori med två sidor. Det är inte ett serverfel utan en
 * sida som inte finns, och ska bli 404. Utan detta blev varje sidnummer
 * utanför intervallet en 500:a.
 */
function isRangeError(error: { code?: string; message: string }): boolean {
  return error.code === "PGRST103" || /range not satisfiable/i.test(error.message);
}

/* ================================================================== *
 * Gemensamma typer
 * ================================================================== */

export interface ForumCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
  kind: CategoryKind;
  sortOrder: number;
}

export interface ForumAuthor {
  id: string;
  username: string;
  elo: number;
  isAdmin: boolean;
}

export interface ForumThreadSummary {
  id: number;
  title: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  isPinned: boolean;
  isLocked: boolean;
  hasAnswer: boolean;
  provTerm: string | null;
  replyCount: number;
  createdAt: string;
  lastPostAt: string;
  author: ForumAuthor | null;
  lastPoster: ForumAuthor | null;
  excerpt: string;
}

export interface ForumPost {
  id: number;
  body: string;
  createdAt: string;
  editedAt: string | null;
  helpfulCount: number;
  isAnswer: boolean;
  quotedPostId: number | null;
  quotedAuthor: string | null;
  author: ForumAuthor | null;
}

const CATEGORY_COLUMNS = "id,slug,name,description,kind,sort_order,admin_only";
// OBS: en enda literal per konstant. Sätts strängen ihop med + blir typen
// `string`, och supabase-js kan inte längre härleda radtypen ur select().
const THREAD_COLUMNS =
  "id,title,slug,category_id,author_id,is_pinned,is_locked,answer_post_id,prov_term,reply_count,created_at,last_post_at,last_post_by";
const POST_COLUMNS =
  "id,thread_id,author_id,body,quoted_post_id,helpful_count,edited_at,created_at";

type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  kind: string;
  sort_order: number;
  admin_only: boolean;
};

type ThreadRow = {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  author_id: string;
  is_pinned: boolean;
  is_locked: boolean;
  answer_post_id: number | null;
  prov_term: string | null;
  reply_count: number;
  created_at: string;
  last_post_at: string;
  last_post_by: string | null;
};

type PostRow = {
  id: number;
  thread_id: number;
  author_id: string;
  body: string;
  quoted_post_id: number | null;
  helpful_count: number;
  edited_at: string | null;
  created_at: string;
};

function toCategory(row: CategoryRow): ForumCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    kind: row.kind === "qa" ? "qa" : "discussion",
    sortOrder: row.sort_order,
  };
}

/**
 * Slå upp författare i klump. Ett raderat konto har tomt användarnamn kvar i
 * users (kontoradering avidentifierar raden) — det renderas som "Borttagen
 * användare" i UI:t, så att tråden förblir läsbar.
 */
async function fetchAuthors(ids: Array<string | null>): Promise<Map<string, ForumAuthor>> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  const map = new Map<string, ForumAuthor>();
  if (unique.length === 0) return map;

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id,username,elo_verbal,elo_math,is_admin")
    .in("id", unique);
  if (error) throwDbError(error, "fetchAuthors");

  for (const u of data ?? []) {
    map.set(u.id, {
      id: u.id,
      username: u.username ?? "",
      // Ett tal räcker i forumet; högsta ELO:t säger mest om användaren.
      elo: Math.max(u.elo_verbal ?? 0, u.elo_math ?? 0),
      isAdmin: !!u.is_admin,
    });
  }
  return map;
}

/** Första inlägget i varje tråd, för trådlistans förhandsvisning. */
async function fetchFirstPosts(threadIds: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (threadIds.length === 0) return map;

  const { data, error } = await supabaseAdmin
    .from("forum_posts")
    .select("id,thread_id,body")
    .in("thread_id", threadIds)
    .eq("status", "visible")
    .order("id", { ascending: true });
  if (error) throwDbError(error, "fetchFirstPosts");

  for (const p of data ?? []) {
    if (!map.has(p.thread_id)) map.set(p.thread_id, p.body);
  }
  return map;
}

async function buildThreadSummaries(
  rows: ThreadRow[],
  categories: Map<number, CategoryRow>,
): Promise<ForumThreadSummary[]> {
  const [authors, firstPosts] = await Promise.all([
    fetchAuthors(rows.flatMap((t) => [t.author_id, t.last_post_by])),
    fetchFirstPosts(rows.map((t) => t.id)),
  ]);

  return rows.map((t) => {
    const cat = categories.get(t.category_id);
    return {
      id: t.id,
      title: t.title,
      slug: t.slug,
      categorySlug: cat?.slug ?? "allmant",
      categoryName: cat?.name ?? "",
      isPinned: t.is_pinned,
      isLocked: t.is_locked,
      hasAnswer: t.answer_post_id != null,
      provTerm: t.prov_term,
      replyCount: t.reply_count,
      createdAt: t.created_at,
      lastPostAt: t.last_post_at,
      author: authors.get(t.author_id) ?? null,
      lastPoster: t.last_post_by ? (authors.get(t.last_post_by) ?? null) : null,
      excerpt: firstPosts.get(t.id) ?? "",
    };
  });
}

async function loadCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabaseAdmin
    .from("forum_categories")
    .select(CATEGORY_COLUMNS)
    .eq("admin_only", false)
    .order("sort_order", { ascending: true });
  if (error) throwDbError(error, "loadCategories");
  return (data ?? []) as CategoryRow[];
}

/* ================================================================== *
 * Läsning — publik, serverrenderad
 * ================================================================== */

export interface ForumHomeData {
  categories: Array<ForumCategory & { threadCount: number; postCount: number }>;
  latest: ForumThreadSummary[];
  totalThreads: number;
  totalPosts: number;
}

export const fetchForumHome = createServerFn({ method: "GET" }).handler(
  async (): Promise<ForumHomeData> => {
    assertRateLimit(ipKey("forum-home"), limits.publicRead);

    const cats = await loadCategories();
    const catById = new Map(cats.map((c) => [c.id, c]));

    const counts = await Promise.all(
      cats.map(async (c) => {
        // Båda är head-count: att hämta hem trådarnas reply_count och summera i
        // appen ser billigare ut men slår i PostgREST:s ~1000-radersgräns, och
        // siffran skulle då tyst sluta växa vid tusen trådar i en kategori.
        const [{ count: threads }, { count: posts }] = await Promise.all([
          supabaseAdmin
            .from("forum_threads")
            .select("id", { count: "exact", head: true })
            .eq("category_id", c.id)
            .eq("status", "visible"),
          supabaseAdmin
            .from("forum_posts")
            .select("id,forum_threads!inner(category_id,status)", {
              count: "exact",
              head: true,
            })
            .eq("status", "visible")
            .eq("forum_threads.category_id", c.id)
            .eq("forum_threads.status", "visible"),
        ]);
        return { id: c.id, threads: threads ?? 0, posts: posts ?? 0 };
      }),
    );
    const countById = new Map(counts.map((c) => [c.id, c]));

    const { data: latestRows, error } = await supabaseAdmin
      .from("forum_threads")
      .select(THREAD_COLUMNS)
      .eq("status", "visible")
      .order("last_post_at", { ascending: false })
      .limit(12);
    if (error) throwDbError(error, "fetchForumHome");

    const visibleLatest = (latestRows ?? []).filter((t) => catById.has(t.category_id));
    const latest = await buildThreadSummaries(visibleLatest as ThreadRow[], catById);

    return {
      categories: cats.map((c) => ({
        ...toCategory(c),
        threadCount: countById.get(c.id)?.threads ?? 0,
        postCount: countById.get(c.id)?.posts ?? 0,
      })),
      latest,
      totalThreads: counts.reduce((s, c) => s + c.threads, 0),
      totalPosts: counts.reduce((s, c) => s + c.posts, 0),
    };
  },
);

export interface ForumCategoryData {
  category: ForumCategory;
  threads: ForumThreadSummary[];
  page: number;
  total: number;
  perPage: number;
  siblings: ForumCategory[];
}

export const fetchForumCategory = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: z.string().min(2).max(40),
        page: z.number().int().min(1).max(10000).default(1),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ForumCategoryData | null> => {
    assertRateLimit(ipKey("forum-category"), limits.publicRead);

    const cats = await loadCategories();
    const catById = new Map(cats.map((c) => [c.id, c]));
    const cat = cats.find((c) => c.slug === data.slug);
    if (!cat) return null;

    const from = (data.page - 1) * THREADS_PER_PAGE;
    const {
      data: rows,
      count,
      error,
    } = await supabaseAdmin
      .from("forum_threads")
      .select(THREAD_COLUMNS, { count: "exact" })
      .eq("category_id", cat.id)
      .eq("status", "visible")
      .order("is_pinned", { ascending: false })
      .order("last_post_at", { ascending: false })
      .range(from, from + THREADS_PER_PAGE - 1);
    // null → 404 i loadern. Sida 1 får vara tom (nystartad kategori); ett
    // sidnummer bortom sista sidan är en sida som inte finns.
    if (error && isRangeError(error)) return null;
    if (error) throwDbError(error, "fetchForumCategory");

    return {
      category: toCategory(cat),
      threads: await buildThreadSummaries((rows ?? []) as ThreadRow[], catById),
      page: data.page,
      total: count ?? 0,
      perPage: THREADS_PER_PAGE,
      siblings: cats.filter((c) => c.id !== cat.id).map(toCategory),
    };
  });

export interface ForumThreadData {
  thread: {
    id: number;
    title: string;
    slug: string;
    isPinned: boolean;
    isLocked: boolean;
    provTerm: string | null;
    answerPostId: number | null;
    createdAt: string;
    replyCount: number;
    author: ForumAuthor | null;
  };
  category: ForumCategory;
  posts: ForumPost[];
  page: number;
  total: number;
  perPage: number;
}

export const fetchForumThread = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        page: z.number().int().min(1).max(10000).default(1),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ForumThreadData | null> => {
    assertRateLimit(ipKey("forum-thread"), limits.publicRead);

    const { data: threadRow, error: threadError } = await supabaseAdmin
      .from("forum_threads")
      .select(THREAD_COLUMNS)
      .eq("id", data.id)
      .eq("status", "visible")
      .maybeSingle();
    if (threadError) throwDbError(threadError, "fetchForumThread");
    if (!threadRow) return null;
    const thread = threadRow as ThreadRow;

    const { data: catRow, error: catError } = await supabaseAdmin
      .from("forum_categories")
      .select(CATEGORY_COLUMNS)
      .eq("id", thread.category_id)
      .maybeSingle();
    if (catError) throwDbError(catError, "fetchForumThread/category");
    if (!catRow || (catRow as CategoryRow).admin_only) return null;

    const from = (data.page - 1) * POSTS_PER_PAGE;
    const {
      data: postRows,
      count,
      error: postError,
    } = await supabaseAdmin
      .from("forum_posts")
      .select(POST_COLUMNS, { count: "exact" })
      .eq("thread_id", thread.id)
      .eq("status", "visible")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + POSTS_PER_PAGE - 1);
    if (postError && isRangeError(postError)) return null;
    if (postError) throwDbError(postError, "fetchForumThread/posts");

    const posts = (postRows ?? []) as PostRow[];

    // Citerade inlägg kan ligga på en annan sida — hämta bara författarnamnet.
    const quotedIds = [
      ...new Set(posts.map((p) => p.quoted_post_id).filter((id): id is number => !!id)),
    ];
    const quotedAuthorByPost = new Map<number, string>();
    if (quotedIds.length > 0) {
      const { data: quoted } = await supabaseAdmin
        .from("forum_posts")
        .select("id,author_id")
        .in("id", quotedIds)
        .eq("status", "visible");
      const quotedAuthors = await fetchAuthors((quoted ?? []).map((q) => q.author_id));
      for (const q of quoted ?? []) {
        quotedAuthorByPost.set(q.id, quotedAuthors.get(q.author_id)?.username ?? "");
      }
    }

    const authors = await fetchAuthors([...posts.map((p) => p.author_id), thread.author_id]);

    return {
      thread: {
        id: thread.id,
        title: thread.title,
        slug: thread.slug,
        isPinned: thread.is_pinned,
        isLocked: thread.is_locked,
        provTerm: thread.prov_term,
        answerPostId: thread.answer_post_id,
        createdAt: thread.created_at,
        replyCount: thread.reply_count,
        author: authors.get(thread.author_id) ?? null,
      },
      category: toCategory(catRow as CategoryRow),
      posts: posts.map((p) => ({
        id: p.id,
        body: p.body,
        createdAt: p.created_at,
        editedAt: p.edited_at,
        helpfulCount: p.helpful_count,
        isAnswer: thread.answer_post_id === p.id,
        quotedPostId: p.quoted_post_id,
        quotedAuthor: p.quoted_post_id ? (quotedAuthorByPost.get(p.quoted_post_id) ?? null) : null,
        author: authors.get(p.author_id) ?? null,
      })),
      page: data.page,
      total: count ?? 0,
      perPage: POSTS_PER_PAGE,
    };
  });

/** Kategorierna, för formuläret på /forum/nytt. */
export const fetchForumCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<ForumCategory[]> => {
    assertRateLimit(ipKey("forum-cats"), limits.publicRead);
    return (await loadCategories()).map(toCategory);
  },
);

/* ================================================================== *
 * Skrivgrind
 * ================================================================== */

export interface ForumPermission {
  canPost: boolean;
  reason: BlockReason | null;
}

export const fetchForumPermission = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ForumPermission> => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin.rpc("forum_post_block_reason", { _uid: userId });
    if (error) {
      console.error("[forum] fetchForumPermission:", error.message);
      return { canPost: false, reason: "konto" };
    }
    const reason = (data as BlockReason | null) ?? null;
    return { canPost: reason === null, reason };
  });

/* ================================================================== *
 * Skrivning
 * ================================================================== */

const bodySchema = z.string().trim().min(MIN_BODY_LENGTH).max(MAX_BODY_LENGTH);

export const createForumThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        categorySlug: z.string().min(2).max(40),
        title: z.string().trim().min(MIN_TITLE_LENGTH).max(MAX_TITLE_LENGTH),
        body: bodySchema,
        provTerm: z
          .string()
          .regex(/^\d{4}(vt|ht)$/)
          .nullable()
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`forum-thread:${userId}`, limits.forumThread);

    const { data: rows, error } = await supabaseAdmin.rpc("forum_create_thread", {
      _uid: userId,
      _category_slug: data.categorySlug,
      _title: data.title,
      _slug: slugifyTitle(data.title),
      _body: data.body,
      _prov_term: data.provTerm ?? undefined,
    });
    if (error) throwRpcError(error, "createForumThread");

    const row = (rows ?? [])[0];
    if (!row) throw new Error("Något gick fel. Försök igen om en stund.");
    return {
      threadId: row.thread_id,
      postId: row.post_id,
      slug: row.slug,
      categorySlug: data.categorySlug,
      pending: row.status === "pending",
    };
  });

export const createForumPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        threadId: z.number().int().positive(),
        body: bodySchema,
        quotedPostId: z.number().int().positive().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`forum-post:${userId}`, limits.forumPost);

    const { data: rows, error } = await supabaseAdmin.rpc("forum_create_post", {
      _uid: userId,
      _thread_id: data.threadId,
      _body: data.body,
      _quoted_post_id: data.quotedPostId ?? undefined,
    });
    if (error) throwRpcError(error, "createForumPost");

    const row = (rows ?? [])[0];
    if (!row) throw new Error("Något gick fel. Försök igen om en stund.");
    return { postId: row.post_id, pending: row.status === "pending" };
  });

export const editForumPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ postId: z.number().int().positive(), body: bodySchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`forum-edit:${userId}`, limits.forumEdit);

    const { data: status, error } = await supabaseAdmin.rpc("forum_edit_post", {
      _uid: userId,
      _post_id: data.postId,
      _body: data.body,
    });
    if (error) throwRpcError(error, "editForumPost");
    return { pending: status === "pending" };
  });

export const reportForumPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        postId: z.number().int().positive(),
        reason: z.enum(["spam", "trakasseri", "olagligt", "upphovsratt", "annat"]),
        note: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`forum-report:${userId}`, limits.forumReport);

    const { error } = await supabaseAdmin.rpc("forum_report_post", {
      _uid: userId,
      _post_id: data.postId,
      _reason: data.reason,
      _note: data.note || undefined,
    });
    if (error) throwRpcError(error, "reportForumPost");
    return { ok: true };
  });

export const toggleForumReaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ postId: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`forum-react:${userId}`, limits.forumPost);

    const { data: rows, error } = await supabaseAdmin.rpc("forum_toggle_reaction", {
      _uid: userId,
      _post_id: data.postId,
    });
    if (error) throwRpcError(error, "toggleForumReaction");
    const row = (rows ?? [])[0];
    return { helpfulCount: row?.helpful_count ?? 0, reacted: !!row?.reacted };
  });

/**
 * Markera bästa svar. Trådstartaren eller admin — RPC:n avgör vilket, så att
 * regeln står på ett ställe. Skickas postId: null tas markeringen bort.
 */
export const setForumAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        threadId: z.number().int().positive(),
        postId: z.number().int().positive().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`forum-answer:${userId}`, limits.forumEdit);

    const { data: answerId, error } = await supabaseAdmin.rpc("forum_set_answer", {
      _uid: userId,
      _thread_id: data.threadId,
      _post_id: data.postId ?? undefined,
    });
    if (error) throwRpcError(error, "setForumAnswer");
    return { answerPostId: (answerId as number | null) ?? null };
  });

/* ================================================================== *
 * Prenumerationer
 * ================================================================== */

/** Vilka reaktioner den inloggade själv satt på en sida av tråden. */
export const fetchForumThreadState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        threadId: z.number().int().positive(),
        postIds: z.array(z.number().int().positive()).max(POSTS_PER_PAGE),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ subscribed: boolean; reacted: number[] }> => {
    const { userId } = context;

    const [subRes, reactRes] = await Promise.all([
      supabaseAdmin.rpc("forum_is_subscribed", { _uid: userId, _thread_id: data.threadId }),
      data.postIds.length > 0
        ? supabaseAdmin
            .from("forum_reactions")
            .select("post_id")
            .eq("user_id", userId)
            .in("post_id", data.postIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (subRes.error) console.error("[forum] fetchForumThreadState/sub:", subRes.error.message);
    if (reactRes.error)
      console.error("[forum] fetchForumThreadState/react:", reactRes.error.message);

    return {
      subscribed: !!subRes.data,
      reacted: (reactRes.data ?? []).map((r) => r.post_id),
    };
  });

export const toggleForumSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ threadId: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`forum-sub:${userId}`, limits.forumSubscribe);

    const { data: subscribed, error } = await supabaseAdmin.rpc("forum_toggle_subscription", {
      _uid: userId,
      _thread_id: data.threadId,
    });
    if (error) throwRpcError(error, "toggleForumSubscription");
    return { subscribed: !!subscribed };
  });

/**
 * Markera tråden läst. Anropas när en inloggad öppnar tråden — tyst, så ett
 * fel här får aldrig fälla sidan.
 */
export const markForumThreadRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ threadId: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`forum-read:${userId}`, limits.forumSubscribe);

    const { error } = await supabaseAdmin.rpc("forum_mark_thread_read", {
      _uid: userId,
      _thread_id: data.threadId,
    });
    if (error) console.error("[forum] markForumThreadRead:", error.message);
    return { ok: true };
  });

export interface ForumUnread {
  threadId: number;
  title: string;
  path: string;
  unreadCount: number;
  lastPostAt: string;
  lastPoster: string | null;
}

/** Underlaget till notisklockan: trådar man följer som fått nya svar. */
export const fetchForumUnread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ForumUnread[]> => {
    const { userId } = context;

    const { data, error } = await supabaseAdmin.rpc("forum_unread_threads", {
      _uid: userId,
      _limit: 20,
    });
    if (error) {
      console.error("[forum] fetchForumUnread:", error.message);
      return [];
    }

    const rows = data ?? [];
    const authors = await fetchAuthors(rows.map((r) => r.last_post_by));

    return rows.map((r) => ({
      threadId: r.thread_id,
      title: r.title,
      path: threadPath(r.category_slug, r.thread_id, r.slug),
      unreadCount: r.unread_count,
      lastPostAt: r.last_post_at,
      lastPoster: r.last_post_by ? (authors.get(r.last_post_by)?.username ?? null) : null,
    }));
  });

/* ================================================================== *
 * Sök
 * ================================================================== */

export interface ForumSearchHit {
  threadId: number;
  title: string;
  /** Delarna till <Link to="/forum/$kategori/$trad"> — typade rutter, ingen råsträng. */
  categorySlug: string;
  trad: string;
  categoryName: string;
  replyCount: number;
  lastPostAt: string;
  excerpt: string;
  author: ForumAuthor | null;
}

export interface ForumSearchData {
  query: string;
  hits: ForumSearchHit[];
  total: number;
  page: number;
  perPage: number;
}

export const searchForum = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        q: z.string().trim().min(2).max(120),
        page: z.number().int().min(1).max(100).default(1),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ForumSearchData> => {
    assertRateLimit(ipKey("forum-search"), limits.forumSearch);

    const perPage = 20;
    const { data: rows, error } = await supabaseAdmin.rpc("forum_search", {
      _q: data.q,
      _limit: perPage,
      _offset: (data.page - 1) * perPage,
    });
    if (error) throwDbError(error, "searchForum");

    const hits = rows ?? [];
    const cats = await loadCategories();
    const catById = new Map(cats.map((c) => [c.id, c]));
    const authors = await fetchAuthors(hits.map((h) => h.author_id));

    return {
      query: data.q,
      hits: hits.map((h) => ({
        threadId: h.thread_id,
        title: h.title,
        categorySlug: catById.get(h.category_id)?.slug ?? "allmant",
        trad: `${h.thread_id}-${h.slug}`,
        categoryName: catById.get(h.category_id)?.name ?? "",
        replyCount: h.reply_count,
        lastPostAt: h.last_post_at,
        excerpt: excerpt(h.match_body ?? "", 180),
        author: authors.get(h.author_id) ?? null,
      })),
      total: Number(hits[0]?.total_count ?? 0),
      page: data.page,
      perPage,
    };
  });
