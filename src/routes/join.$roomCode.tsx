import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { joinMatch } from "@/lib/match.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/join/$roomCode")({
  component: JoinPage,
});

function JoinPage() {
  const { roomCode } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const joinFn = useServerFn(joinMatch);
  const tried = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: `/join/${roomCode}` } as never });
      return;
    }
    if (tried.current) return;
    tried.current = true;
    (async () => {
      try {
        const res = await joinFn({ data: { room_code: roomCode } });
        navigate({ to: "/match/$matchId", params: { matchId: res.match_id } });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Kunde inte ansluta";
        toast.error(msg);
        navigate({ to: "/" });
      }
    })();
  }, [user, loading, roomCode, joinFn, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Ansluter till rum {roomCode}…
    </div>
  );
}
