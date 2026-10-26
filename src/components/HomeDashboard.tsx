import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { m } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { MatchmakerModal, type MatchType } from "@/components/MatchmakerModal";
import { RankBadge } from "@/components/ui/RankBadge";
import { RankIcon } from "@/components/ui/RankIcon";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { ResumeMatchBanner } from "@/components/ui/ResumeMatchBanner";
import { WordOfTheDay } from "@/components/WordOfTheDay";
import type { WordOfTheDay as Wotd } from "@/lib/word-practice.functions";
import { SafeBoundary } from "@/components/SafeBoundary";
import { getRankForElo, getNextRank, getEloProgressInTier } from "@/types";
import { FACIT, facitKnappSynlig } from "@/lib/preliminart-facit";
import { getNextHpDate } from "@/lib/hp-dates";
import {
  Sparkles,
  Flame,
} from "lucide-react";
import { trackEvent } from "@/lib/events";

/* =====================================================================
   HOME DASHBOARD — tre val, inget mer.

   Skärmen svarar på en enda fråga: "vad gör jag nu?". Svaret är spela en
   match, plugga ord, eller öva MEK. Coachningen ligger i menyn (navbaren)
   sedan 2026-10-20, då MEK-övningen tog dess kort. Allt som är uppföljning
   (ELO-kurva, achievements, HP-estimat) bor på /stats; allt som är
   navigering bor i navbaren. Läggs något tillbaka här måste det tjäna
   sin plats mot de tre.
   ===================================================================== */

export function HomeDashboard({ wordOfTheDay }: { wordOfTheDay?: Wotd | null }) {
  const { user, profile } = useAuth();
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>("verbal");
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12" aria-busy="true">
        <div className="skeleton-shimmer h-20 rounded-2xl" />
        <div className="mt-8 space-y-3">
          <div className="skeleton-shimmer h-44 rounded-2xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="skeleton-shimmer h-28 rounded-2xl" />
            <div className="skeleton-shimmer h-28 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const isGuest = !!user.is_anonymous;
  const activeElo = matchType === "verbal" ? profile.elo_verbal : profile.elo_math;

  // Det som är nytt varje dag är hur lång tid det är kvar, inte vad man heter.
  // Här stod tidigare "God morgon / Hej / God kväll" följt av användarnamnet:
  // tre saker om användaren, alla redan kända, och för en gäst ett slumpat
  // "Gäst rönnbär".
  const nastaProv = getNextHpDate();
  const dagarKvar = nastaProv
    ? Math.max(0, Math.ceil((nastaProv.date.getTime() - Date.now()) / 86_400_000))
    : null;
  const nedräkning =
    nastaProv && dagarKvar !== null
      ? `${nastaProv.label}, ${dagarKvar} ${dagarKvar === 1 ? "dag" : "dagar"} kvar`
      : null;

  return (
    // Två mycket svaga toningar högst upp, en löv och en bark. De ligger
    // bakom allt och rör inget innehåll, men de tar bort intrycket av en
    // enda platt cremeyta. Inga klot, ingen kantig gradient — bara en
    // aning färg som tonar ut inom de första 500 px.
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(47,107,60,0.05) 0%, rgba(47,107,60,0) 380px), linear-gradient(180deg, rgba(122,82,54,0.04) 0%, rgba(122,82,54,0) 520px)",
        backgroundRepeat: "no-repeat",
      }}
    >
      {isGuest && <GuestBanner />}
      <ResumeMatchBanner />

      {/* EN övergång för hela skärmen, inte en per kort.
          Korten låg tidigare i var sitt `Reveal` med olika `delay` (0 / 0,05 /
          0,08 / 0,11) och var sin IntersectionObserver. `Reveal` är dessutom en
          SCROLL-primitiv: den väntar på att elementet syns, vilket för en yta
          som redan ligger ovanför vecket betyder "vänta på nästa
          observer-callback". Fyra block som var för sig väntar in en observer
          och sedan animerar i 0,75 s kommer in i trappa — och eftersom dagens
          ord serverrenderas medan coachningskortets pris hämtas från Stripe såg
          trappan olika ut vid varje laddning. Nu rör sig hela skärmen som en
          enhet, och det som fortfarande saknar data har ett skelett i sin egen
          höjd i stället för en egen inflygning. */}
      <m.div
        className="mx-auto max-w-5xl px-4 py-10 sm:py-12"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ---------- Header: nedräkning, rubrik och en enda statusrad ---------- */}
        <div>
          <header>
            <div className="min-w-0">
              {nedräkning ? (
                <p className="text-sm font-semibold text-bark">{nedräkning}</p>
              ) : null}
              {/* Rubriken är en fråga, för det är vad sidan är: ett val
                  mellan fyra aktiviteter. Användarens namn och avatar finns
                  redan i navbaren. */}
              <h1
                className="display mt-2 text-[30px] font-bold leading-tight text-[var(--cream)] sm:text-[38px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Vad vill du göra idag?
              </h1>
            </div>

            {/* ELO:t följer ämnesvalet i spela-kortet nedanför och visar det
                faktiska talet. Här stod tidigare `Math.max(verbal, math)`,
                vilket gjorde två saker fel på en gång: ett verbalt ELO som
                sjunkit under startvärdet doldes bakom mattens orörda 1000 —
                alltså ett golv som inte finns i datan — och siffran ändrade
                sig aldrig när man växlade mellan Verbal och Matte. */}
            <StatusRow
              elo={activeElo}
              track={matchType}
              streak={isGuest ? 0 : (profile.current_streak ?? 0)}
            />
          </header>
        </div>

        <div className="mt-10">
          {facitKnappSynlig(FACIT) && <EfterProvetKnapp />}

          {/* Fyra aktiviteter, en per produktyta, i zonens egen färg. Färgen
              är hela poängen: den lär ut systemet medan man använder det, så
              att Sky betyder arkivet också på /gamla-prov. Kopplingen är låst
              i `lib/produktzon.ts` — ändra den där, inte här.

              Zonfärgerna är YTOR. Ingen av dem klarar 3:1 mot grundytan, så
              text ovanpå dem är Ink eller Graphite, och på Plum vit. Sätt
              aldrig en zonfärg på en bokstav. */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* ---------- Duellen ---------- */}
            <section className="flex flex-col rounded-[40px] bg-terracotta p-7 sm:p-8">

              <h2
                className="display mt-5 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[32px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Spela en match
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--cream-3)]">
                8 uppgifter på 5 minuter. Verbal och kvantitativ ELO räknas var för sig.
              </p>

              {/* Spåret måste vara ljusare än kortet, inte mörkare som när
                  kortet var vitt — annars försvinner det valda alternativet. */}
              <div
                role="radiogroup"
                aria-label="Välj ämne"
                className="mt-5 inline-flex self-start rounded-full bg-card/60 p-1"
              >
                <SubjectPill
                  label="Verbal"
                  active={matchType === "verbal"}
                  onClick={() => setMatchType("verbal")}
                />
                <SubjectPill
                  label="Kvantitativ"
                  active={matchType === "math"}
                  onClick={() => setMatchType("math")}
                />
              </div>

              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setMatchOpen(true)}
                className="group mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-[15px] font-semibold text-on-brand transition hover:brightness-125 sm:w-auto sm:self-start sm:px-8"
              >
                Spela {matchType === "verbal" ? "verbal" : "kvantitativ"}
              </button>
            </section>

            {/* ---------- Gamla prov ---------- */}
            <Link
              to="/gamla-prov"
              className="flex flex-col rounded-[40px] bg-sky p-7 transition hover:brightness-[1.03] sm:p-8"
            >
              <h2
                className="display mt-5 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[32px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Skriv ett provpass
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-bark">
                40 uppgifter på tid, med facit på varje uppgift.
              </p>
              <div className="flex-1" />
              <span className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 self-start rounded-lg bg-primary px-6 py-3.5 text-[15px] font-semibold text-on-brand">
                Välj provtillfälle
              </span>
            </Link>

            {/* ---------- Ordlistan ---------- */}
            <Link
              to="/ord"
              className="flex flex-col rounded-[40px] bg-lavender p-7 transition hover:brightness-[1.03] sm:p-8"
            >
              <h2
                className="display mt-5 text-[24px] font-bold leading-tight text-[var(--cream)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Plugga ord
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--plum)]">
                Över 10 000 HP-ord. Ord du missar kommer tillbaka nästa dag, sedan med längre
                mellanrum för varje gång du har rätt.
              </p>
              <div className="flex-1" />
              <span className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 self-start rounded-lg border-2 border-[var(--plum)] px-6 py-3 text-[15px] font-semibold text-[var(--plum)]">
                Öva ord
              </span>
            </Link>

            {/* ---------- MEK ---------- */}
            <Link
              to="/mek-ovning"
              className="flex flex-col rounded-[40px] bg-plum p-7 transition hover:brightness-125 sm:p-8"
            >
              <h2
                className="display mt-5 text-[24px] font-bold leading-tight text-on-brand"
                style={{ fontFamily: "var(--font-display)" }}
              >
                MEK-övning
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--navy-3)]">
                Uppgifter ur gamla prov och Tvåkommanollans egna. Du röstar efter varje fråga, och
                de som får tummen upp visas oftare.
              </p>
              <div className="flex-1" />
              <span className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 self-start rounded-lg bg-cream-wash px-6 py-3.5 text-[15px] font-semibold text-[var(--cream-3)]">
                Öva MEK
              </span>
            </Link>
          </div>

          <div className="mt-4">
            <SafeBoundary label="word-of-the-day">
              <WordOfTheDay initial={wordOfTheDay} />
            </SafeBoundary>
          </div>
        </div>
      </m.div>

      <MatchmakerModal open={matchOpen} onOpenChange={setMatchOpen} matchType={matchType} />
      <OnboardingModal
        open={!isGuest && profile.onboarding_completed === false && !onboardingDismissed}
        onClose={() => setOnboardingDismissed(true)}
        onStartFirstMatch={(t) => {
          setOnboardingDismissed(true);
          setMatchType(t);
          setMatchOpen(true);
        }}
      />
    </div>
  );
}

/* =================== GUEST BANNER =================== */
function GuestBanner() {
  return (
    <div className="bg-cream-wash px-4 py-3">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--cream-3)]">
          Du spelar som gäst. Skapa ett konto för att spara din ELO.
        </p>
        <Link
          to="/signup"
          className="group inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-on-brand transition hover:brightness-125"
        >
          Skapa konto
        </Link>
      </div>
    </div>
  );
}

/* =================== STATUSRAD ===================
   Rank, streak och "hur långt till nästa rank" på en rad. Tidigare låg
   detta som fyra separata element (två rank-pills, en streak-pill och en
   egen progress-sektion) som tillsammans tog mer plats än spela-knappen. */
function StatusRow({ elo, track, streak }: { elo: number; track: MatchType; streak: number }) {
  const rank = getRankForElo(elo);
  const next = getNextRank(elo);
  const pct = getEloProgressInTier(elo);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="inline-flex items-center gap-2">
        <RankBadge elo={elo} size="sm" />
        {/* Vilket ELO som visas måste stå utskrivet — annars ser samma rad
            olika ut vid två besök utan att något förklarar varför. */}
        <span className="text-xs font-medium text-white/50">
          {track === "verbal" ? "verbal" : "kvantitativ"}
        </span>
      </span>

      {streak > 0 && (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success tabular-nums">
          <Flame className="h-3.5 w-3.5" />
          {streak} dagar
        </span>
      )}

      {next ? (
        <span className="inline-flex min-w-[9rem] flex-1 items-center gap-2 text-[11px] text-white/55">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${rank.accent}, ${next.accent})`,
              }}
            />
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
            {next.minElo - elo} till
            <RankIcon rank={next} className="h-3.5 w-3.5" style={{ color: next.accent }} />
            {next.shortName}
          </span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-white/55">
          <RankIcon rank={rank} className="h-3.5 w-3.5" style={{ color: rank.accent }} />
          Högsta ranken
        </span>
      )}
    </div>
  );
}

/* =================== ÄMNESVÄXEL ===================
   Verbal och matte var två jämnstora primärkort, vilket gjorde att
   skärmen saknade ett tydligt förstaval. Nu är ämnet ett litet val
   inuti spela-kortet och matchen är den enda knappen. */
function SubjectPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-bark/15 text-bark"
          : "text-white/50 hover:bg-white/[0.04] hover:text-[var(--cream)]"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Textlänk till preliminärt facit, veckorna efter en provdag.
 *
 * Med flit inte ett kort till och inte en popup: skärmen ska fortfarande
 * svara på "vad gör jag nu?" med tre val, och den som undrar över facit
 * hittar dit själv. Försvinner av sig själv när `promoUntil` passerat.
 */
function EfterProvetKnapp() {
  return (
    <p className="mb-4 text-sm">
      <Link
        to="/hogskoleprovet-facit"
        onClick={() => trackEvent("facit_button_clicked", { term: FACIT.term })}
        className="font-semibold text-primary underline-offset-2 hover:underline"
      >
        Efter provet: facit och trolig normering
      </Link>
    </p>
  );
}
