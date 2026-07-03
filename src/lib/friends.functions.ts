import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { selectQuestionsFor, insertMatchQuestions } from "./match.server";
import { limits } from "./rate-limit";
import { assertRateLimit } from "./rate-limit.server";

export const sendFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ username: z.string().min(1).max(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`friendReq:${userId}`, limits.friendRequest);

    const { data: target } = await supabaseAdmin
      .from("users")
      .select("id, username")
      .ilike("username", data.username)
      .maybeSingle();

    if (!target) throw new Error("Användaren finns inte");
    if (target.id === userId) throw new Error("Du kan inte lägga till dig själv");

    // Check existing friendship in either direction
    const { data: existing } = await supabaseAdmin
      .from("friendships")
      .select("id, status, requester_id, addressee_id")
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${userId})`,
      )
      .maybeSingle();

    if (existing) {
      if (existing.status === "accepted") throw new Error("Ni är redan vänner");
      if (existing.status === "pending") {
        // If the other user already invited you, auto-accept
        if (existing.requester_id === target.id) {
          await supabaseAdmin
            .from("friendships")
            .update({ status: "accepted" })
            .eq("id", existing.id);
          return { ok: true, autoAccepted: true };
        }
        throw new Error("Förfrågan är redan skickad");
      }
    }

    const { error } = await supabaseAdmin.from("friendships").insert({
      requester_id: userId,
      addressee_id: target.id,
      status: "pending",
    });
    if (error) throw error;
    return { ok: true };
  });

export const respondFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        friendship_id: z.string().uuid(),
        accept: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row } = await supabaseAdmin
      .from("friendships")
      .select("*")
      .eq("id", data.friendship_id)
      .maybeSingle();
    if (!row) throw new Error("Förfrågan hittades inte");
    if (row.addressee_id !== userId) throw new Error("Inte din förfrågan");

    if (data.accept) {
      await supabaseAdmin.from("friendships").update({ status: "accepted" }).eq("id", row.id);
    } else {
      await supabaseAdmin.from("friendships").delete().eq("id", row.id);
    }
    return { ok: true };
  });

export const removeFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ friendship_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row } = await supabaseAdmin
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("id", data.friendship_id)
      .maybeSingle();
    if (!row) return { ok: true };
    if (row.requester_id !== userId && row.addressee_id !== userId)
      throw new Error("Inte din vänskap");
    await supabaseAdmin.from("friendships").delete().eq("id", data.friendship_id);
    return { ok: true };
  });

export const inviteFriendToMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        friend_id: z.string().uuid(),
        match_type: z.enum(["verbal", "math"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`matchInvite:${userId}`, limits.matchInvite);

    // Verify they are friends
    const { data: friendship } = await supabaseAdmin
      .from("friendships")
      .select("id, status")
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${data.friend_id}),and(requester_id.eq.${data.friend_id},addressee_id.eq.${userId})`,
      )
      .eq("status", "accepted")
      .maybeSingle();
    if (!friendship) throw new Error("Ni är inte vänner");

    // Create a private match (waiting)
    const room_code = "FR" + Math.floor(1000 + Math.random() * 9000).toString();
    const { data: match, error } = await supabaseAdmin
      .from("matches")
      .insert({
        match_type: data.match_type,
        player1_id: userId,
        status: "waiting",
        is_bot_match: false,
        room_code,
      })
      .select()
      .single();
    if (error || !match) throw error ?? new Error("Kunde inte skapa match");

    // Insert invite
    const { data: invite, error: invErr } = await supabaseAdmin
      .from("match_invites")
      .insert({
        from_user: userId,
        to_user: data.friend_id,
        match_id: match.id,
        match_type: data.match_type,
        status: "pending",
      })
      .select()
      .single();
    if (invErr) throw invErr;

    return { ok: true, match_id: match.id, invite_id: invite.id };
  });

/**
 * Begär revansch efter en avslutad PvP-match: skapar en ny väntande match
 * och skickar en inbjudan till samma motståndare. Motståndaren ser inbjudan
 * via notisklockan / FriendInviteListener och accepterar precis som vanligt.
 */
export const requestRematch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ match_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // Revansch delar invite-budgeten (samma spam-yta).
    assertRateLimit(`matchInvite:${userId}`, limits.matchInvite);

    const { data: prev } = await supabaseAdmin
      .from("matches")
      .select("id, match_type, player1_id, player2_id, is_bot_match")
      .eq("id", data.match_id)
      .maybeSingle();
    if (!prev) throw new Error("Matchen hittades inte");
    if (prev.is_bot_match) throw new Error("Revansch gäller bara matcher mot en spelare");
    if (prev.player1_id !== userId && prev.player2_id !== userId) throw new Error("Inte din match");

    const opponentId = prev.player1_id === userId ? prev.player2_id : prev.player1_id;
    if (!opponentId) throw new Error("Ingen motståndare att utmana");

    // Undvik dubbla aktiva revansch-inbjudningar till samma motståndare.
    const { data: existing } = await supabaseAdmin
      .from("match_invites")
      .select("id, match_id")
      .eq("from_user", userId)
      .eq("to_user", opponentId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (existing) return { ok: true, match_id: existing.match_id, already: true };

    const match_type = prev.match_type as "verbal" | "math";
    const room_code = "RV" + Math.floor(1000 + Math.random() * 9000).toString();
    const { data: match, error } = await supabaseAdmin
      .from("matches")
      .insert({
        match_type,
        player1_id: userId,
        status: "waiting",
        is_bot_match: false,
        room_code,
      })
      .select()
      .single();
    if (error || !match) throw error ?? new Error("Kunde inte skapa revansch");

    const { error: invErr } = await supabaseAdmin.from("match_invites").insert({
      from_user: userId,
      to_user: opponentId,
      match_id: match.id,
      match_type,
      status: "pending",
    });
    if (invErr) throw invErr;

    return { ok: true, match_id: match.id };
  });

export const acceptMatchInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ invite_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: invite } = await supabaseAdmin
      .from("match_invites")
      .select("*")
      .eq("id", data.invite_id)
      .maybeSingle();
    if (!invite) throw new Error("Inbjudan hittades inte");
    if (invite.to_user !== userId) throw new Error("Inte din inbjudan");
    if (invite.status !== "pending") throw new Error("Inbjudan är inte längre giltig");
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from("match_invites").update({ status: "expired" }).eq("id", invite.id);
      throw new Error("Inbjudan har gått ut");
    }

    // Get the match
    const { data: match } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("id", invite.match_id)
      .maybeSingle();
    if (!match) throw new Error("Matchen hittades inte");
    if (match.status !== "waiting" || match.player2_id) {
      throw new Error("Matchen är inte längre tillgänglig");
    }

    // Generate questions and join
    const questions = await selectQuestionsFor(match.match_type as "verbal" | "math", userId);
    await insertMatchQuestions(match.id, questions);

    await supabaseAdmin
      .from("matches")
      .update({ player2_id: userId, status: "active" })
      .eq("id", match.id);

    await supabaseAdmin.from("match_invites").update({ status: "accepted" }).eq("id", invite.id);

    return { ok: true, match_id: match.id };
  });

export const declineMatchInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ invite_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: invite } = await supabaseAdmin
      .from("match_invites")
      .select("to_user, status")
      .eq("id", data.invite_id)
      .maybeSingle();
    if (!invite || invite.to_user !== userId) throw new Error("Inte din inbjudan");
    if (invite.status !== "pending") return { ok: true };
    await supabaseAdmin
      .from("match_invites")
      .update({ status: "declined" })
      .eq("id", data.invite_id);
    return { ok: true };
  });
