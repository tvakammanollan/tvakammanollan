import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { joinMatch } from "@/lib/match.functions";
import { toast } from "sonner";
import { Users } from "lucide-react";

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <motion.span
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#4338ca] text-white shadow-[var(--shadow-glow-green)]"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Users className="h-7 w-7" />
      </motion.span>
      <div>
        <p className="eyebrow text-[#6366f1]">Privat rum</p>
        <h1
          className="mt-1 text-[28px] font-bold leading-tight text-[#050507]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ansluter…
        </h1>
        <p className="mt-1.5 text-sm text-[#737373]">
          Rum-kod: <span className="font-mono font-semibold text-[#050507]">{roomCode}</span>
        </p>
      </div>
    </div>
  );
}
