import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import {
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  inviteFriendToMatch,
} from "@/lib/friends.functions";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { UserPlus, Check, X, Trash2, Swords, Loader2 } from "lucide-react";
import { sounds } from "@/lib/sounds";

export const Route = createFileRoute("/friends")({
  component: FriendsPage,
  head: () => ({
    meta: [
      { title: "Vänner — HP Kampen" },
      { name: "description", content: "Lägg till vänner och bjud in dem till en battle." },
    ],
  }),
});

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  other: { id: string; username: string; elo_verbal: number; elo_math: number } | null;
  isIncoming: boolean;
}

function FriendsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<FriendshipRow[]>([]);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const sendReq = useServerFn(sendFriendRequest);
  const respondReq = useServerFn(respondFriendRequest);
  const removeReq = useServerFn(removeFriend);
  const inviteFn = useServerFn(inviteFriendToMatch);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("friendships")
        .select("*")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      const arr = (data ?? []) as Omit<FriendshipRow, "other" | "isIncoming">[];
      const otherIds = arr.map((r) =>
        r.requester_id === user.id ? r.addressee_id : r.requester_id,
      );
      let otherMap: Record<string, FriendshipRow["other"]> = {};
      if (otherIds.length > 0) {
        const { data: us } = await supabase.rpc("get_users_basic", {
          _ids: otherIds,
        });
        otherMap = Object.fromEntries(
          (us ?? []).map((u) => [u.id, u as NonNullable<FriendshipRow["other"]>]),
        );
      }
      const enriched: FriendshipRow[] = arr.map((r) => {
        const otherId = r.requester_id === user.id ? r.addressee_id : r.requester_id;
        return {
          ...r,
          other: otherMap[otherId] ?? null,
          isIncoming: r.addressee_id === user.id,
        };
      });
      if (!cancelled) setRows(enriched);
    })();

    // Realtime
    const channel = supabase
      .channel(`friendships-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => setTick((t) => t + 1),
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [user, loading, navigate, tick]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;
    setBusy(true);
    try {
      const r = await sendReq({ data: { username: name } });
      const r2 = r as { autoAccepted?: boolean };
      sounds.ping();
      toast.success(
        r2.autoAccepted
          ? `Ni är nu vänner!`
          : `Förfrågan skickad till ${name}`,
      );
      setUsername("");
      setTick((t) => t + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte skicka förfrågan");
    } finally {
      setBusy(false);
    }
  };

  const respond = async (id: string, accept: boolean) => {
    try {
      await respondReq({ data: { friendship_id: id, accept } });
      sounds.ping();
      setTick((t) => t + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Misslyckades");
    }
  };

  const remove = async (id: string) => {
    try {
      await removeReq({ data: { friendship_id: id } });
      setTick((t) => t + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Misslyckades");
    }
  };

  const invite = async (friendId: string, type: "verbal" | "math") => {
    try {
      const r = await inviteFn({ data: { friend_id: friendId, match_type: type } });
      const r2 = r as { match_id: string };
      sounds.matchFound();
      toast.success("Inbjudan skickad – väntar på din vän");
      navigate({ to: "/match/$matchId", params: { matchId: r2.match_id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte bjuda in");
    }
  };

  const accepted = rows.filter((r) => r.status === "accepted");
  const incoming = rows.filter((r) => r.status === "pending" && r.isIncoming);
  const outgoing = rows.filter((r) => r.status === "pending" && !r.isIncoming);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-muted-foreground">Laddar…</div>
    );
  }

  if (user.is_anonymous) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Skapa konto för vänner
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Som gäst kan du inte lägga till vänner. Skapa ett konto så öppnas vänlistan upp.
        </p>
        <Button asChild className="mt-6">
          <Link to="/signup">Skapa konto</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow text-[#10b981]">Din krets</p>
        <h1
          className="mt-1 text-[36px] font-bold leading-tight text-[#022c22] sm:text-[44px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Vänner
        </h1>
        <p className="mt-2 text-sm text-[#5a5a5a]">
          Lägg till vänner via användarnamn och bjud in dem till en snabbmatch.
        </p>
      </motion.div>

      {/* Add friend */}
      <form onSubmit={handleAdd} className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Användarnamn"
          className="flex-1"
        />
        <Button type="submit" disabled={busy || !username.trim()} className="gap-1.5">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Lägg till
        </Button>
      </form>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground">
            Förfrågningar ({incoming.length})
          </h2>
          <ul className="grid gap-2">
            {incoming.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={r.other?.username ?? "?"} size={36} />
                  <span className="text-sm font-medium">{r.other?.username ?? "Okänd"}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="default" onClick={() => respond(r.id, true)} className="gap-1">
                    <Check className="h-4 w-4" /> Acceptera
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => respond(r.id, false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Friends list */}
      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground">
          Mina vänner ({accepted.length})
        </h2>
        {accepted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            Du har inga vänner än. Lägg till någon ovan!
          </p>
        ) : (
          <ul className="grid gap-2">
            {accepted.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={r.other?.username ?? "?"} size={40} />
                  <div>
                    <div className="text-sm font-semibold">{r.other?.username}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      Verbal {r.other?.elo_verbal ?? 1000} · Matte {r.other?.elo_math ?? 1000}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1"
                    onClick={() => r.other && invite(r.other.id, "verbal")}
                  >
                    <Swords className="h-4 w-4" /> Verbal
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1"
                    onClick={() => r.other && invite(r.other.id, "math")}
                  >
                    <Swords className="h-4 w-4" /> Matte
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(r.id)}
                    aria-label="Ta bort vän"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Outgoing */}
      {outgoing.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground">
            Skickade förfrågningar
          </h2>
          <ul className="grid gap-2">
            {outgoing.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={r.other?.username ?? "?"} size={32} />
                  <span className="text-sm">{r.other?.username}</span>
                  <span className="text-xs text-muted-foreground">Väntar…</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                  Avbryt
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
