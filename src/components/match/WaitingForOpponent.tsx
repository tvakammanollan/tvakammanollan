import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { m } from "framer-motion";
import { toast } from "sonner";
import { Clock, Loader2, Trophy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cancelMatchInvite } from "@/lib/friends.functions";
import { displayName } from "@/lib/guest-name";
import { Button } from "@/components/ui/button";

/* =====================================================================
   VÄNTSKÄRMEN — den som skickat en inbjudan och väntar på svar.

   Var fram till 2026-08-29 en återvändsgränd: en pulserande pokal och
   texten "Matchen startar automatiskt när din vän accepterar", utan
   knappar. Inbjudan lever i 30 minuter (`expires_at` på match_invites) och
   når bara den som är online just då — går den ut händer INGENTING på
   skärmen. Den stod alltså kvar och lovade en match som aldrig kunde bli
   av, vilket är precis så en fungerande funktion ser trasig ut. I
   produktion syntes det som väntande matcher som aldrig blev något: 21 av
   22 `pending`-inbjudningar hade passerat sitt expires_at.

   Nu säger skärmen tre saker den inte sa: vem den väntar på, hur länge
   inbjudan gäller, och vad som hände när tiden gick ut. Och det finns en
   väg ut åt båda hållen — avbryta (river inbjudan och matchen) eller bara
   lämna sidan, för accepterar motståndaren så dyker matchen upp i klockan.
   ===================================================================== */

/** Hur ofta nedräkningen ritas om. Minuter räcker; en sekundklocka här
    stressar utan att hjälpa, och skärmen kan stå uppe i en halvtimme. */
const TICK_MS = 15_000;

interface InviteRow {
  id: string;
  to_user: string;
  expires_at: string;
}

export function WaitingForOpponent({
  matchId,
  isMine,
}: {
  matchId: string;
  /** Är det JAG som bjudit in? Bara då finns det en inbjudan att avbryta. */
  isMine: boolean;
}) {
  const navigate = useNavigate();
  const cancelFn = useServerFn(cancelMatchInvite);

  const [invite, setInvite] = useState<InviteRow | null>(null);
  const [namn, setNamn] = useState<string | null>(null);
  const [laddad, setLaddad] = useState(false);
  const [avbryter, setAvbryter] = useState(false);
  const [nu, setNu] = useState(() => Date.now());

  // Inbjudan läses med klientens egen nyckel. RLS släpper igenom både
  // avsändare och mottagare (match_invites_select_involved), så det behövs
  // ingen serverfunktion för att titta på sin egen inbjudan.
  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("match_invites")
        .select("id, to_user, expires_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!alive) return;
      setInvite((data as InviteRow) ?? null);
      setLaddad(true);
      if (data?.to_user) {
        const { data: users } = await supabase.rpc("get_users_basic", { _ids: [data.to_user] });
        if (!alive) return;
        const u = (users as { id: string; username: string | null }[] | null)?.[0];
        setNamn(u?.username ? displayName(u.username) : null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [matchId]);

  useEffect(() => {
    const t = setInterval(() => setNu(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  const avbryt = useCallback(async () => {
    setAvbryter(true);
    try {
      const r = (await cancelFn({ data: { match_id: matchId } })) as { started?: boolean };
      // Motståndaren hann acceptera i samma sekund — då finns det en match
      // att spela, och att säga "avbruten" vore direkt fel.
      if (r.started) {
        toast.success("Motståndaren accepterade precis. Matchen är igång.");
        setAvbryter(false);
        return;
      }
      toast.success("Inbjudan avbruten.");
      void navigate({ to: "/" });
    } catch (e) {
      setAvbryter(false);
      toast.error(e instanceof Error ? e.message : "Kunde inte avbryta");
    }
  }, [cancelFn, matchId, navigate]);

  const utgår = invite ? Date.parse(invite.expires_at) : null;
  // Ett oläsbart datum får aldrig läsas som "utgången" — då säger skärmen att
  // inbjudan är död medan motståndaren fortfarande kan acceptera.
  const utgången = utgår !== null && !Number.isNaN(utgår) && utgår <= nu;
  const minuterKvar =
    utgår !== null && !Number.isNaN(utgår) ? Math.max(0, Math.ceil((utgår - nu) / 60_000)) : null;
  const motståndare = namn ?? "motståndaren";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <m.span
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-deep text-[var(--cream)] shadow-[var(--shadow-glow-gold)]"
        animate={utgången ? undefined : { scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {utgången ? <Clock className="h-7 w-7" /> : <Trophy className="h-7 w-7" />}
      </m.span>

      <div>
        <p className="eyebrow text-primary">{utgången ? "Inget svar" : "Väntar"}</p>
        <h1
          className="mt-1 text-[30px] font-bold leading-tight text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {utgången ? `${motståndare} svarade inte` : `Väntar på ${motståndare}`}
        </h1>
      </div>

      {utgången ? (
        <p className="text-white/65">
          Inbjudan gällde i 30 minuter och har gått ut. En match spelas live i fem minuter, så den
          måste accepteras medan ni båda är här. Skicka en ny när {motståndare} är online, eller
          spela en match direkt mot datorn under tiden.
        </p>
      ) : (
        <>
          <p className="text-white/65">
            Matchen startar automatiskt så snart {motståndare} accepterar.
            {minuterKvar !== null && (
              <>
                {" "}
                Inbjudan gäller i <strong className="text-[var(--cream)]">
                  {minuterKvar} min
                </strong>{" "}
                till.
              </>
            )}
          </p>
          {/* Att stänga fliken är inte att missa matchen — inbjudan ligger kvar
              och accepteras den så syns matchen i notisklockan. Utan den här
              raden ser skärmen ut som något man måste sitta av. */}
          <p className="text-sm text-white/45">
            Du kan lämna sidan. Accepterar {motståndare} hittar du matchen i notisklockan.
          </p>
          <m.div
            className="flex gap-1.5"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2 w-2 rounded-full bg-primary" />
            ))}
          </m.div>
        </>
      )}

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {/* Bara den som skickat inbjudan kan riva den, och bara så länge det
            finns en. Laddad-flaggan hindrar att knappen blinkar förbi. */}
        {isMine && laddad && (
          <Button
            onClick={() => void avbryt()}
            disabled={avbryter}
            variant="outline"
            className="min-h-[44px] gap-2"
          >
            {avbryter ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" aria-hidden />
            )}
            {utgången ? "Stäng" : "Avbryt inbjudan"}
          </Button>
        )}
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-[15px] font-semibold text-on-brand transition hover:brightness-110"
        >
          Till startsidan
        </Link>
      </div>
    </div>
  );
}
