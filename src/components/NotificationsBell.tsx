import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  respondFriendRequest,
  acceptMatchInvite,
  declineMatchInvite,
} from "@/lib/friends.functions";
import { fetchForumUnread } from "@/lib/forum.functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/UserAvatar";
import { Bell, Check, X, Swords, UserPlus, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";
import { formatInt } from "@/lib/sv-format";
import { displayName } from "@/lib/guest-name";

/* =====================================================================
   NOTISKLOCKA — samlar väntande vänförfrågningar, matchinbjudningar och
   nya svar i trådar man följer på ett ställe. Vän- och matchnotiser går
   att besvara direkt; forumnotiser leder till tråden.

   Allt härleds ur befintliga tabeller (friendships, match_invites,
   forum_subscriptions) vid uppslag — ingen notistabell. Uppdateras live
   via realtime.
   ===================================================================== */

type FriendNotif = {
  kind: "friend";
  id: string; // friendship id
  fromName: string;
  fromId: string;
};
type InviteNotif = {
  kind: "invite";
  id: string; // invite id
  matchId: string;
  matchType: "verbal" | "math";
  fromName: string;
  fromId: string;
};
type ForumNotif = {
  kind: "forum";
  id: string; // `forum-<threadId>`
  threadId: number;
  title: string;
  path: string;
  unreadCount: number;
  fromName: string;
};
type Notif = FriendNotif | InviteNotif | ForumNotif;

export function NotificationsBell({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const respondReq = useServerFn(respondFriendRequest);
  const acceptInvite = useServerFn(acceptMatchInvite);
  const declineInvite = useServerFn(declineMatchInvite);
  const loadForumUnread = useServerFn(fetchForumUnread);

  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const nowIso = new Date().toISOString();
    const [friendRes, inviteRes, forumRes] = await Promise.all([
      supabase
        .from("friendships")
        .select("id, requester_id")
        .eq("addressee_id", userId)
        .eq("status", "pending"),
      supabase
        .from("match_invites")
        .select("id, match_id, match_type, from_user")
        .eq("to_user", userId)
        .eq("status", "pending")
        .gt("expires_at", nowIso),
      // Gäster har inga prenumerationer — anropet returnerar tom lista och
      // får aldrig fälla resten av klockan.
      loadForumUnread({}).catch(() => []),
    ]);

    const friends = friendRes.data ?? [];
    const invites = inviteRes.data ?? [];
    const forum = forumRes ?? [];

    // Slå upp avsändarnamn via RPC (samma som vänsidan använder).
    const ids = Array.from(
      new Set([
        ...friends.map((f) => f.requester_id as string),
        ...invites.map((i) => i.from_user as string),
      ]),
    );
    let nameMap: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: us } = await supabase.rpc("get_users_basic", { _ids: ids });
      nameMap = Object.fromEntries(
        (us ?? []).map((u) => [u.id as string, displayName(u.username as string, u.id as string)]),
      );
    }

    const next: Notif[] = [
      ...invites.map(
        (i): InviteNotif => ({
          kind: "invite",
          id: i.id as string,
          matchId: i.match_id as string,
          matchType: (i.match_type as "verbal" | "math") ?? "verbal",
          fromId: i.from_user as string,
          fromName: nameMap[i.from_user as string] ?? "En spelare",
        }),
      ),
      ...friends.map(
        (f): FriendNotif => ({
          kind: "friend",
          id: f.id as string,
          fromId: f.requester_id as string,
          fromName: nameMap[f.requester_id as string] ?? "Någon",
        }),
      ),
      // Sist: forumsvar är sällan lika brådskande som en väntande utmaning.
      ...forum.map(
        (t): ForumNotif => ({
          kind: "forum",
          id: `forum-${t.threadId}`,
          threadId: t.threadId,
          title: t.title,
          path: t.path,
          unreadCount: t.unreadCount,
          fromName: t.lastPoster ?? "Någon",
        }),
      ),
    ];
    setItems(next);
  }, [userId, loadForumUnread]);

  useEffect(() => {
    void refresh();
    // Unikt kanalnamn per montering. Annars kan en snabb om-montering (t.ex.
    // när auth-tillståndet byter user→profile) återanvända samma topic medan
    // den gamla kanalen fortfarande stängs → supabase kastar
    // "cannot add postgres_changes callbacks ... after subscribe()".
    const channelName = `notif-${userId}-${Math.random().toString(36).slice(2)}`;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    try {
      ch = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "friendships" },
          () => void refresh(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "match_invites" },
          () => void refresh(),
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "forum_posts" },
          () => void refresh(),
        )
        .subscribe();
    } catch {
      /* realtime kan strula — notiserna uppdateras ändå vid omladdning */
    }
    return () => {
      if (ch) void supabase.removeChannel(ch);
    };
  }, [userId, refresh]);

  const count = items.length;

  const onAcceptFriend = async (id: string) => {
    setBusyId(id);
    try {
      await respondReq({ data: { friendship_id: id, accept: true } });
      sounds.ping();
      setItems((cur) => cur.filter((n) => n.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Misslyckades");
    } finally {
      setBusyId(null);
    }
  };

  const onDeclineFriend = async (id: string) => {
    setBusyId(id);
    try {
      await respondReq({ data: { friendship_id: id, accept: false } });
      setItems((cur) => cur.filter((n) => n.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Misslyckades");
    } finally {
      setBusyId(null);
    }
  };

  const onAcceptInvite = async (n: InviteNotif) => {
    setBusyId(n.id);
    try {
      const r = await acceptInvite({ data: { invite_id: n.id } });
      const r2 = r as { match_id: string };
      sounds.matchFound();
      setOpen(false);
      setItems((cur) => cur.filter((x) => x.id !== n.id));
      navigate({ to: "/match/$matchId", params: { matchId: r2.match_id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte acceptera");
    } finally {
      setBusyId(null);
    }
  };

  const onDeclineInvite = async (id: string) => {
    setBusyId(id);
    try {
      await declineInvite({ data: { invite_id: id } });
      setItems((cur) => cur.filter((n) => n.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Misslyckades");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={count > 0 ? `Notiser (${count} nya)` : "Notiser"}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold tabular-nums text-on-brand shadow-sm">
                {count > 9 ? "9+" : count}
              </span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 border-white/10 bg-[rgba(251,246,236,0.92)] p-0 text-[var(--cream)] shadow-[0_12px_40px_rgba(46,30,20,0.4)] backdrop-blur-xl"
      >
        <div className="border-b border-white/8 px-4 py-3">
          <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Notiser
          </p>
        </div>
        {count === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-white/55">
            <Bell className="mx-auto mb-2 h-6 w-6 text-white/25" />
            Inget nytt just nu.
          </div>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {items.map((n) =>
              n.kind === "forum" ? (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      // Trådsidan markerar tråden läst när den öppnas, så
                      // notisen försvinner av sig själv vid nästa uppslag.
                      navigate({ to: n.path });
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MessageSquare className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{n.title}</span>
                      <span className="flex items-center gap-1 text-xs text-white/55">
                        {n.unreadCount === 1
                          ? "1 nytt svar"
                          : `${formatInt(n.unreadCount)} nya svar`}
                        {" · "}
                        {n.fromName}
                      </span>
                    </span>
                  </button>
                </li>
              ) : (
                <li
                  key={`${n.kind}-${n.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                >
                  <UserAvatar name={n.fromName} seed={n.fromId} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-semibold">{n.fromName}</span>
                    </p>
                    <p className="flex items-center gap-1 text-xs text-white/55">
                      {n.kind === "invite" ? (
                        <>
                          <Swords className="h-3 w-3" />
                          Utmanar dig · {n.matchType === "math" ? "matte" : "verbal"}
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3" />
                          Vill bli vän
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {busyId === n.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white/55" />
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-label="Acceptera"
                          onClick={() =>
                            n.kind === "invite" ? onAcceptInvite(n) : onAcceptFriend(n.id)
                          }
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-brand transition hover:brightness-110"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Avböj"
                          onClick={() =>
                            n.kind === "invite" ? onDeclineInvite(n.id) : onDeclineFriend(n.id)
                          }
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/12 text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
