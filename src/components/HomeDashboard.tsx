import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MatchmakerModal, type MatchType } from "@/components/MatchmakerModal";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { ResumeMatchBanner } from "@/components/ui/ResumeMatchBanner";
import { CoachingModal } from "@/components/CoachingModal";
import { ArrowRight, Sparkles } from "lucide-react";
import { formatInt } from "@/lib/sv-format";

/* =====================================================================
   HOME DASHBOARD — "Today's Brief"
   Following critique §05:
     · ONE headline answer ("Idag: 12 ord du fick fel förra veckan")
     · ONE primary CTA (amber, "Starta dagens pass — 12 min")
     · Second-glance row: 3 subtle cards, equal weight, text links
     · Streak as conversational sentence
     · Friends as ambient footer ("3 vänner spelar nu")
     · ELO chart moved to /stats (NOT on the home anymore)
   ===================================================================== */

interface RecallWord {
  id: string;
  word: string;
}

interface DashboardData {
  recallWords: RecallWord[];
  friendsOnline: number;
  recentMatchesToday: number;
}

export function HomeDashboard() {
  const { user, profile } = useAuth();
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>("verbal");
  const [coachingOpen, setCoachingOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [data, setData] = useState<DashboardData>({
    recallWords: [],
    friendsOnline: 0,
    recentMatchesToday: 0,
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [wrongWords, friends, todayMatches] = await Promise.all([
        supabase
          .from("word_practice_answers")
          .select("question_id, questions(question_text)")
          .eq("user_id", user.id)
          .eq("is_correct", false)
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("friendships")
          .select("requester_id, addressee_id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
        supabase
          .from("matches")
          .select("id", { count: "exact", head: true })
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .gte("created_at", startOfDay.toISOString()),
      ]);
      if (cancelled) return;

      let friendsOnline = 0;
      const friendIds: string[] = [];
      for (const f of friends.data ?? []) {
        const fid =
          f.requester_id === user.id ? f.addressee_id : f.requester_id;
        if (fid) friendIds.push(fid as string);
      }
      if (friendIds.length > 0) {
        const { data: active } = await supabase
          .from("matches")
          .select("player1_id,player2_id")
          .or(
            `player1_id.in.(${friendIds.join(",")}),player2_id.in.(${friendIds.join(",")})`,
          )
          .gte("created_at", fifteenMinAgo);
        const activeSet = new Set<string>();
        for (const m of active ?? []) {
          if (m.player1_id && friendIds.includes(m.player1_id))
            activeSet.add(m.player1_id);
          if (m.player2_id && friendIds.includes(m.player2_id as string))
            activeSet.add(m.player2_id as string);
        }
        friendsOnline = activeSet.size;
      }

      const seen = new Set<string>();
      const recall: RecallWord[] = [];
      for (const row of (wrongWords.data ?? []) as Array<{
        question_id: string;
        questions: { question_text: string } | null;
      }>) {
        if (!row.question_id || seen.has(row.question_id)) continue;
        seen.add(row.question_id);
        const text = row.questions?.question_text ?? "ord";
        recall.push({ id: row.question_id, word: text.slice(0, 30) });
        if (recall.length >= 12) break;
      }

      setData({
        recallWords: recall,
        friendsOnline,
        recentMatchesToday: todayMatches.count ?? 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-12">
        <div className="skeleton-shimmer h-48 rounded-2xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="skeleton-shimmer h-32 rounded-2xl" />
          <div className="skeleton-shimmer h-32 rounded-2xl" />
          <div className="skeleton-shimmer h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  const openMatch = (t: MatchType) => {
    setMatchType(t);
    setMatchOpen(true);
  };

  const isGuest = !!user.is_anonymous;
  const streak = profile.current_streak ?? 0;
  const recallCount = data.recallWords.length;

  const brief = (() => {
    if (recallCount >= 5) {
      return {
        eyebrow: `Idag · ${recallCount} ord att repetera`,
        title: (
          <>
            Du hade{" "}
            <em className="text-amber-italic">{recallCount} ord</em> fel
            senast.
          </>
        ),
        body: "Tio minuter räcker. Vi väljer ut dem, du svarar, vi flyttar dem ur kön när de fastnar.",
        cta: "Starta repetition",
        ctaTime: `${Math.max(8, Math.round(recallCount * 0.8))} min`,
        action: "ord" as const,
      };
    }
    if (streak >= 1) {
      return {
        eyebrow: `Dag ${streak} · streak`,
        title: (
          <>
            Behåll <em className="text-amber-italic">{streak} dagar</em> genom
            en match till.
          </>
        ),
        body: "Fem frågor räcker för att hålla streaken vid liv. Ingen press.",
        cta: "Hitta en match",
        ctaTime: "8 min",
        action: "match" as const,
      };
    }
    return {
      eyebrow: "Dag 1 · första passet",
      title: (
        <>
          Börja med en <em className="text-amber-italic">snabbmatch.</em>
        </>
      ),
      body: "8 minuter mot någon på din nivå. Vi matchar dig inom 10 sekunder.",
      cta: "Hitta en match",
      ctaTime: "8 min",
      action: "match" as const,
    };
  })();

  return (
    <div className="relative min-h-screen bg-paper text-navy">
      <ResumeMatchBanner />
      {isGuest && <GuestRibbon />}

      <main className="mx-auto max-w-[1100px] px-6 pb-32 pt-10 sm:pt-16">
        {/* === ONE HEADLINE ANSWER === */}
        <motion.section
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative"
        >
          <p className="eyebrow">{brief.eyebrow}</p>
          <h1 className="display mt-4 text-[40px] leading-[1.05] text-navy sm:text-[64px]">
            {brief.title}
          </h1>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-[1.6] text-navy/70">
            {brief.body}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            {brief.action === "match" ? (
              <button
                type="button"
                onClick={() => openMatch("verbal")}
                className="btn-shine btn-amber"
              >
                {brief.cta} — {brief.ctaTime}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link to="/ord" className="btn-shine btn-amber">
                {brief.cta} — {brief.ctaTime}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCoachingOpen(true)}
              className="btn-link text-navy/65"
            >
              eller boka 30 min gratis coachning
            </button>
          </div>

          {streak > 0 && (
            <p className="mt-8 max-w-[58ch] border-t border-[var(--line-cream)] pt-6 font-mono text-[12px] uppercase tracking-[0.14em] text-navy/55">
              <span className="text-amber-deep">Streak</span>{" "}
              <span className="numeric-display text-navy">· {streak}</span>{" "}
              ·{" "}
              {data.recentMatchesToday > 0
                ? `${data.recentMatchesToday} match${data.recentMatchesToday > 1 ? "er" : ""} idag`
                : "ingen match idag ännu"}
            </p>
          )}
        </motion.section>

        {/* === SECOND-GLANCE ROW === */}
        <section className="mt-20">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="eyebrow eyebrow-muted"
          >
            Andra vägar in
          </motion.p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <SecondaryCard
              eyebrow="Realtid"
              title="Hitta en match"
              body="Verbal eller matte, mot en spelare eller bot."
              onClick={() => openMatch("verbal")}
              delay={0}
            />
            <SecondaryCard
              eyebrow="Solo"
              title="Träna ord"
              body="8 000+ riktiga HP-frågor i lugn takt."
              to="/ord"
              delay={1}
            />
            <SecondaryCard
              eyebrow="Lugnt"
              title="Hela provet"
              body="Träna delprov utan tidspress, du väljer längd."
              to="/train"
              delay={2}
            />
          </div>
        </section>

        {/* === AMBIENT FOOTER === */}
        <section className="mt-20 grid gap-12 border-t border-[var(--line-cream)] pt-12 sm:grid-cols-2">
          <Ambient
            eyebrow="Vänner"
            title={
              data.friendsOnline > 0 ? (
                <>
                  <span className="numeric-display">
                    {data.friendsOnline}
                  </span>{" "}
                  vän{data.friendsOnline > 1 ? "ner" : ""} spelar nu.
                </>
              ) : (
                "Det här är ett tråkigt ställe utan dem."
              )
            }
            cta={
              data.friendsOnline > 0
                ? "Utmana en →"
                : "Skicka inbjudningslänk →"
            }
            to="/friends"
          />
          <Ambient
            eyebrow="Rankning"
            title={
              <>
                Du står på{" "}
                <span className="numeric-display">
                  ELO {formatInt(Math.max(profile.elo_verbal, profile.elo_math))}
                </span>
                .
              </>
            }
            cta="Se hela topplistan →"
            to="/leaderboard"
          />
        </section>

        <footer className="mt-32 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-navy/45">
            ✦ Lite konkurrens, lite läsning. Du klarar det här.
          </p>
        </footer>
      </main>

      <MatchmakerModal
        open={matchOpen}
        onOpenChange={setMatchOpen}
        matchType={matchType}
      />
      <CoachingModal open={coachingOpen} onOpenChange={setCoachingOpen} />
      <OnboardingModal
        open={
          !isGuest &&
          profile.onboarding_completed === false &&
          !onboardingDismissed
        }
        onClose={() => setOnboardingDismissed(true)}
        onStartFirstMatch={(t) => {
          setOnboardingDismissed(true);
          openMatch(t);
        }}
      />
    </div>
  );
}

function GuestRibbon() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border-b border-[var(--line-cream)] bg-pergament px-6 py-3"
    >
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 text-[14px]">
        <span className="inline-flex items-center gap-2.5 text-navy/85">
          <Sparkles className="h-4 w-4 text-amber-deep" />
          Du spelar som gäst. Din ELO sparas inte.
        </span>
        <Link to="/signup" className="btn-link text-navy">
          Skapa ett konto
        </Link>
      </div>
    </motion.div>
  );
}

function SecondaryCard({
  eyebrow,
  title,
  body,
  to,
  onClick,
  delay,
}: {
  eyebrow: string;
  title: string;
  body: string;
  to?: string;
  onClick?: () => void;
  delay: number;
}) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.7,
        delay: delay * 0.08,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      whileHover={{ y: -4 }}
      className="group h-full cursor-pointer rounded-2xl border border-[var(--line-cream)] bg-paper-2 p-7 transition-shadow duration-300 hover:shadow-[var(--shadow-md)]"
    >
      <p className="eyebrow eyebrow-teal">{eyebrow}</p>
      <h3 className="display mt-4 text-[22px] leading-tight text-navy">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.5] text-navy/65">{body}</p>
      <p className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-amber-deep transition-transform group-hover:translate-x-1">
        Starta <ArrowRight className="h-3.5 w-3.5" />
      </p>
    </motion.div>
  );
  if (to) {
    return (
      <Link
        to={to}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params={{} as any}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="text-left">
      {inner}
    </button>
  );
}

function Ambient({
  eyebrow,
  title,
  cta,
  to,
}: {
  eyebrow: string;
  title: React.ReactNode;
  cta: string;
  to: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6 }}
    >
      <p className="eyebrow eyebrow-muted">{eyebrow}</p>
      <p className="display mt-3 text-[22px] leading-tight text-navy">
        {title}
      </p>
      <Link
        to={to}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params={{} as any}
        className="btn-link mt-3 inline-block text-navy/65"
      >
        {cta}
      </Link>
    </motion.div>
  );
}
