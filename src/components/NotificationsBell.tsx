import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  respondFriendRequest,
  acceptMatchInvite,
  declineMatchInvite,
} from "@/lib/friends.functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/UserAvatar";
import { Bell, Check, X, Swords, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";

/* =====================================================================
   NOTISKLOCKA — samlar väntande vänförfrågningar + matchinbjudningar på
   ett ställe, med acceptera/avböj direkt. Härleds från friendships +
   match_invites (inga nya tabeller). Uppdateras live via realtime.
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
type Notif = FriendNotif | InviteNotif;

export function NotificationsBell({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const respondReq = useServerFn(respondFriendRequest);
  const acceptInvite = useServerFn(acceptMatchInvite);
  const declineInvite = useServerFn(declineMatchInvite);

  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const nowIso = new Date().toISOString();
    const [friendRes, inviteRes] = await Promise.all([
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
    ]);

    const friends = friendRes.data ?? [];
    const invites = inviteRes.data ?? [];

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
        (us ?? []).map((u) => [u.id as string, (u.username as string) ?? "Okänd"]),
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
    ];
    setItems(next);
  }, [userId]);

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
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ae2f26] opacity-60" />
              <span className="relative inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ae2f26] px-1 text-[10px] font-bold tabular-nums text-[#2e1e14] shadow-sm">
                {count > 9 ? "9+" : count}
              </span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 border-white/10 bg-[rgba(15,8,3,0.96)] p-0 text-[#2e1e14] shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
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
            {items.map((n) => (
              <li
                key={`${n.kind}-${n.id}`}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
              >
                <UserAvatar name={n.fromName} size={34} />
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
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ae2f26] text-[#2e1e14] transition hover:brightness-110"
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
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
