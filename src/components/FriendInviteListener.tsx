import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { acceptMatchInvite } from "@/lib/friends.functions";
import { sounds } from "@/lib/sounds";

/**
 * Lyssnar globalt på inkommande matchinbjudningar via Supabase Realtime
 * och visar en toast med en "Acceptera"-knapp som tar dig direkt in i matchen.
 */
export function FriendInviteListener() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const acceptFn = useServerFn(acceptMatchInvite);

  useEffect(() => {
    if (!user) return;
    // Unikt kanalnamn per montering — annars kan en snabb om-montering under
    // auth-bytet återanvända samma topic och få supabase att kasta
    // "cannot add postgres_changes ... after subscribe()" (kraschade tidigare appen).
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`invites-${user.id}-${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "match_invites",
            filter: `to_user=eq.${user.id}`,
          },
          async (payload) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inv = payload.new as any;
            // Look up sender name
            const { data: sender } = await supabase
              .from("users")
              .select("username")
              .eq("id", inv.from_user)
              .maybeSingle();
            const name = sender?.username ?? "En vän";
            const typeLabel = inv.match_type === "math" ? "matte" : "verbal";
            sounds.invite();
            toast.message(`${name} bjuder in dig`, {
              description: `Snabbmatch i ${typeLabel}`,
              duration: 20000,
              action: {
                label: "Acceptera",
                onClick: async () => {
                  try {
                    const r = await acceptFn({ data: { invite_id: inv.id } });
                    const r2 = r as { match_id: string };
                    sounds.matchFound();
                    navigate({
                      to: "/match/$matchId",
                      params: { matchId: r2.match_id },
                    });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Kunde inte acceptera");
                  }
                },
              },
            });
          },
        )
        .subscribe();
    } catch {
      /* realtime kan strula — påverkar bara live-notiser, inte sidan */
    }
    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [user, navigate, acceptFn]);

  return null;
}
