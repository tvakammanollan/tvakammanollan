import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { joinMatch } from "@/lib/match.functions";
import { Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/join/$roomCode")({
  component: JoinPage,
  head: () => ({
    meta: [
      { title: "Gå med i match · Tvåkommanollan" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function JoinPage() {
  const { roomCode } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const joinFn = useServerFn(joinMatch);
  const tried = useRef(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(e instanceof Error ? e.message : "Kunde inte ansluta till rummet.");
      }
    })();
  }, [user, loading, roomCode, joinFn, navigate]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#8c1d18]/30 bg-[#8c1d18]/10 text-[#8c1d18]">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <div>
          <p className="eyebrow text-[#7a5236]">Privat rum</p>
          <h1
            className="mt-1 text-[26px] font-bold leading-tight text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Kunde inte ansluta
          </h1>
          <p className="mt-2 text-sm text-white/65">{error}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild className="bg-[#ae2f26] text-[#fff8f5] hover:bg-[#8f2620]">
            <Link to="/">Till start</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/friends">Bjud in en vän</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <m.span
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ae2f26] to-[#8f2620] text-[var(--cream)] shadow-[var(--shadow-glow-gold)]"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Users className="h-7 w-7" />
      </m.span>
      <div>
        <p className="eyebrow text-[#7a5236]">Privat rum</p>
        <h1
          className="mt-1 text-[28px] font-bold leading-tight text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ansluter…
        </h1>
        <p className="mt-1.5 text-sm text-white/65">
          Rum-kod: <span className="font-mono font-semibold text-[#ae2f26]">{roomCode}</span>
        </p>
      </div>
    </div>
  );
}
