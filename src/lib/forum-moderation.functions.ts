/**
 * Moderation — allt som bara admin får göra.
 *
 * Egen fil därför att det är den enda delen av forumet som läser dolt
 * innehåll: här är `status`-filtret medvetet avstängt, och därför måste
 * admin-kontrollen ligga först i varje handler.
 *
 * Ingenting raderas hårt. `status='deleted'` + vem och när. En tråd där svar
 * försvinner blir obegriplig, och du vill kunna ångra.
 *
 * Alla åtgärder loggas i befintliga audit_log med `forum:`-prefixad action —
 * ingen ny loggtabell.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database, Json } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { limits } from "./rate-limit";
import { assertRateLimit } from "./rate-limit.server";
import { slugifyTitle } from "./forum";

function throwDbError(error: { message: string }, ctx: string): never {
  console.error(`[forum-mod] ${ctx}:`, error.message);
  throw new Error("Något gick fel — försök igen om en stund.");
}

/**
 * supabaseAdmin går förbi RLS, så den här kontrollen är den enda kontrollen.
 * Kasta, aldrig returnera false — en glömd if-sats ska inte kunna öppna kön.
 */
async function requireAdmin(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error) throwDbError(error, "requireAdmin");
  if (!data?.is_admin) throw new Error("Behörighet saknas.");
}

type ThreadUpdate = Database["public"]["Tables"]["forum_threads"]["Update"];

async function logAction(
  userId: string,
  action: string,
  recordId: string,
  meta: Json,
): Promise<void> {
  const { error } = await supabaseAdmin.from("audit_log").insert({
    action: `forum:${action}`,
    table_name: "forum",
    user_id: userId,
    record_id: recordId,
    meta,
  });
  // Best-effort: loggen får aldrig stoppa en moderationsåtgärd.
  if (error) console.error("[forum-mod] audit_log:", error.message);
}

/* ================================================================== *
 * Kön
 * ================================================================== */

export interface ModerationPost {
  id: number;
  threadId: number;
  threadTitle: string;
  categorySlug: string;
  body: string;
  status: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorPostCount: number;
  authorBannedUntil: string | null;
  reports: Array<{ id: number; reason: string; note: string | null; createdAt: string }>;
}

export interface ModerationQueue {
  posts: ModerationPost[];
  pendingCount: number;
  reportCount: number;
}

export const fetchForumModeration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ModerationQueue> => {
    const { userId } = context;
    await requireAdmin(userId);
    assertRateLimit(`forum-mod:${userId}`, limits.publicRead);

    // Kön = inlägg i granskning + inlägg med obehandlade rapporter, äldst först.
    const [{ data: pendingRows, error: pendingError }, { data: reportRows, error: reportError }] =
      await Promise.all([
        supabaseAdmin
          .from("forum_posts")
          .select("id,thread_id,author_id,body,status,created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(100),
        supabaseAdmin
          .from("forum_reports")
          .select("id,post_id,reason,note,created_at")
          .is("handled_at", null)
          .order("created_at", { ascending: true })
          .limit(200),
      ]);
    if (pendingError) throwDbError(pendingError, "fetchForumModeration/pending");
    if (reportError) throwDbError(reportError, "fetchForumModeration/reports");

    const reportedIds = [...new Set((reportRows ?? []).map((r) => r.post_id))];
    const pendingIds = new Set((pendingRows ?? []).map((p) => p.id));
    const extraIds = reportedIds.filter((id) => !pendingIds.has(id));

    let extraRows: typeof pendingRows = [];
    if (extraIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("forum_posts")
        .select("id,thread_id,author_id,body,status,created_at")
        .in("id", extraIds)
        .neq("status", "deleted");
      if (error) throwDbError(error, "fetchForumModeration/reported");
      extraRows = data ?? [];
    }

    const posts = [...(pendingRows ?? []), ...(extraRows ?? [])];
    if (posts.length === 0) {
      return { posts: [], pendingCount: 0, reportCount: reportedIds.length };
    }

    const threadIds = [...new Set(posts.map((p) => p.thread_id))];
    const authorIds = [...new Set(posts.map((p) => p.author_id))];

    const [{ data: threads }, { data: authors }, { data: cats }] = await Promise.all([
      supabaseAdmin.from("forum_threads").select("id,title,category_id").in("id", threadIds),
      supabaseAdmin
        .from("users")
        .select("id,username,forum_post_count,forum_banned_until")
        .in("id", authorIds),
      supabaseAdmin.from("forum_categories").select("id,slug"),
    ]);

    const catSlug = new Map((cats ?? []).map((c) => [c.id, c.slug]));
    const threadById = new Map((threads ?? []).map((t) => [t.id, t]));
    const authorById = new Map((authors ?? []).map((u) => [u.id, u]));

    const reportsByPost = new Map<number, ModerationPost["reports"]>();
    for (const r of reportRows ?? []) {
      const list = reportsByPost.get(r.post_id) ?? [];
      list.push({ id: r.id, reason: r.reason, note: r.note, createdAt: r.created_at });
      reportsByPost.set(r.post_id, list);
    }

    const out: ModerationPost[] = posts
      .map((p) => {
        const thread = threadById.get(p.thread_id);
        const author = authorById.get(p.author_id);
        return {
          id: p.id,
          threadId: p.thread_id,
          threadTitle: thread?.title ?? "(borttagen tråd)",
          categorySlug: thread ? (catSlug.get(thread.category_id) ?? "allmant") : "allmant",
          body: p.body,
          status: p.status,
          createdAt: p.created_at,
          authorId: p.author_id,
          authorName: author?.username ?? "",
          authorPostCount: author?.forum_post_count ?? 0,
          authorBannedUntil: author?.forum_banned_until ?? null,
          reports: reportsByPost.get(p.id) ?? [],
        };
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return {
      posts: out,
      pendingCount: (pendingRows ?? []).length,
      reportCount: reportedIds.length,
    };
  });

/* ================================================================== *
 * Åtgärder på inlägg
 * ================================================================== */

export const moderateForumPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        postId: z.number().int().positive(),
        action: z.enum(["approve", "hide", "delete"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await requireAdmin(userId);

    const patch =
      data.action === "approve"
        ? { status: "visible", deleted_at: null, deleted_by: null }
        : data.action === "hide"
          ? { status: "hidden" }
          : { status: "deleted", deleted_at: new Date().toISOString(), deleted_by: userId };

    const { error } = await supabaseAdmin.from("forum_posts").update(patch).eq("id", data.postId);
    if (error) throwDbError(error, "moderateForumPost");

    // Åtgärdat inlägg = åtgärdade rapporter.
    await supabaseAdmin
      .from("forum_reports")
      .update({ handled_at: new Date().toISOString(), handled_by: userId })
      .eq("post_id", data.postId)
      .is("handled_at", null);

    await logAction(userId, `post_${data.action}`, String(data.postId), {});
    return { ok: true };
  });

/* ================================================================== *
 * Åtgärder på trådar
 * ================================================================== */

/** Vad admin kan ändra på en tråd. Exporterad så att UI:t slipper härleda den. */
export interface ThreadModerationInput {
  threadId: number;
  pinned?: boolean;
  locked?: boolean;
  deleted?: boolean;
  title?: string;
  categorySlug?: string;
  answerPostId?: number | null;
}

export const moderateForumThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        threadId: z.number().int().positive(),
        pinned: z.boolean().optional(),
        locked: z.boolean().optional(),
        deleted: z.boolean().optional(),
        title: z.string().trim().min(5).max(140).optional(),
        categorySlug: z.string().min(2).max(40).optional(),
        answerPostId: z.number().int().positive().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await requireAdmin(userId);

    const patch: ThreadUpdate = {};
    if (data.pinned !== undefined) patch.is_pinned = data.pinned;
    if (data.locked !== undefined) patch.is_locked = data.locked;
    if (data.title !== undefined) {
      patch.title = data.title;
      patch.slug = slugifyTitle(data.title);
    }
    if (data.deleted !== undefined) {
      patch.status = data.deleted ? "deleted" : "visible";
      patch.deleted_at = data.deleted ? new Date().toISOString() : null;
      patch.deleted_by = data.deleted ? userId : null;
    }
    if (data.categorySlug !== undefined) {
      const { data: cat, error } = await supabaseAdmin
        .from("forum_categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (error) throwDbError(error, "moderateForumThread/category");
      if (!cat) throw new Error("Kategorin finns inte.");
      patch.category_id = cat.id;
    }
    if (data.answerPostId !== undefined) {
      if (data.answerPostId !== null) {
        // Bästa svar måste ligga i tråden, annars pekar QAPage-datan fel.
        const { data: post } = await supabaseAdmin
          .from("forum_posts")
          .select("id")
          .eq("id", data.answerPostId)
          .eq("thread_id", data.threadId)
          .eq("status", "visible")
          .maybeSingle();
        if (!post) throw new Error("Inlägget hör inte till tråden.");
      }
      patch.answer_post_id = data.answerPostId;
    }

    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await supabaseAdmin
      .from("forum_threads")
      .update(patch)
      .eq("id", data.threadId);
    if (error) throwDbError(error, "moderateForumThread");

    await logAction(userId, "thread_update", String(data.threadId), patch);
    return { ok: true };
  });

/* ================================================================== *
 * Åtgärder på användare
 * ================================================================== */

export const banForumUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        targetId: z.string().uuid(),
        // null = häv avstängningen, 0 = permanent
        days: z.number().int().min(0).max(3650).nullable(),
        reason: z.string().trim().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await requireAdmin(userId);
    if (data.targetId === userId) throw new Error("Du kan inte stänga av dig själv.");

    const until =
      data.days === null
        ? null
        : data.days === 0
          ? new Date("9999-12-31T00:00:00Z").toISOString()
          : new Date(Date.now() + data.days * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin
      .from("users")
      .update({ forum_banned_until: until, forum_ban_reason: data.reason ?? null })
      .eq("id", data.targetId);
    if (error) throwDbError(error, "banForumUser");

    await logAction(userId, data.days === null ? "unban" : "ban", data.targetId, {
      days: data.days,
      reason: data.reason ?? null,
    });
    return { ok: true, until };
  });

/**
 * "Nuke": dölj allt användaren skrivit det senaste dygnet. En knapp, därför att
 * moderation som kostar kvällar inte blir gjord.
 */
export const nukeForumUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        targetId: z.string().uuid(),
        hours: z.number().int().min(1).max(168).default(24),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await requireAdmin(userId);
    if (data.targetId === userId) throw new Error("Du kan inte radera dina egna inlägg så här.");

    const since = new Date(Date.now() - data.hours * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { data: posts, error } = await supabaseAdmin
      .from("forum_posts")
      .update({ status: "deleted", deleted_at: now, deleted_by: userId })
      .eq("author_id", data.targetId)
      .gte("created_at", since)
      .neq("status", "deleted")
      .select("id,thread_id");
    if (error) throwDbError(error, "nukeForumUser");

    // Trådar där startinlägget försvann blir obegripliga — ta dem också.
    const { data: threads } = await supabaseAdmin
      .from("forum_threads")
      .update({ status: "deleted", deleted_at: now, deleted_by: userId })
      .eq("author_id", data.targetId)
      .gte("created_at", since)
      .neq("status", "deleted")
      .select("id");

    await logAction(userId, "nuke", data.targetId, {
      hours: data.hours,
      posts: posts?.length ?? 0,
      threads: threads?.length ?? 0,
    });
    return { posts: posts?.length ?? 0, threads: threads?.length ?? 0 };
  });
