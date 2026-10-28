import { cn } from "@/lib/utils";
import { type Produktzon, zonDekor } from "@/lib/produktzon";

type Variant = "compact" | "content";

/**
 * Page hero used across all non-landing routes.
 *
 * `compact` = workspace pages (lower height).
 * `content` = marketing/long-form pages (taller).
 *
 * Pass `cycleWords` for a closing word in apple red (only the first is shown; the
 * cycling animation is gone). `title` är då den
 * fasta delen av meningen och det cyklande ordet står efter den, på samma
 * rad, med ett vanligt mellanslag emellan.
 */
export function PageHero({
  title,
  subtitle,
  cycleWords,
  primaryCta,
  secondaryCta,
  variant = "compact",
  align = "left",
  zon,
  dekor,
  className,
}: {
  /**
   * Produktzonen sidan tillhör. Sätter den färgar heron med zonens
   * dekorformer, vilket är det enda stället zonfärgen får synas i hero:n.
   * Formerna ligger bakom innehållet och är rent dekorativa — zonfärgerna
   * klarar inte 3:1 mot grundytan och kan därför inte bära text, ikoner
   * eller något annat man ska kunna urskilja. Se `lib/produktzon.ts`.
   */
  zon?: Produktzon;
  /**
   * Dekorformer för sidor som INTE är en produktyta, t.ex. forumet. Zonens
   * färger är reserverade för sina ytor: lånar man dem till en sida utan
   * zon slutar färg betyda yta, och det är hela poängen med systemet.
   * Cream tillhör ingen zon och är den DESIGN.md listar för dekor.
   * Ignoreras när `zon` är satt.
   */
  dekor?: "cream";
  title: string;
  subtitle?: string;
  cycleWords?: string[];
  primaryCta?: React.ReactNode;
  secondaryCta?: React.ReactNode;
  variant?: Variant;
  align?: "left" | "center";
  className?: string;
}) {
  const isCompact = variant === "compact";
  const centered = align === "center";

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        // Compact-heron låg 16 px för tätt inpå navbaren. Det syntes mest på
        // /ord, därför att "Öva" börjar på ett Ö: prickarna når 0,99em över
        // baslinjen medan ett vanligt versalt begynnelsebokstav stannar på 0,72,
        // så samma ruta ger 14 px mindre optisk luft än "Se vem som är" på
        // /leaderboard. Rutan var alltså snål överallt och /ord avslöjade det.
        isCompact ? "pt-24 pb-12 sm:pt-28 sm:pb-16" : "pt-28 pb-20 sm:pt-32 sm:pb-24",
        className,
      )}
    >
      {zon || dekor ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-10 right-[7%] h-[180px] w-[200px] opacity-70"
            style={{
              background: zon ? zonDekor[zon] : "var(--cream-wash)",
              borderRadius: "58% 42% 37% 63% / 45% 55% 45% 55%",
            }}
          />
          <div
            className="absolute -bottom-12 left-[6%] h-[112px] w-[124px] opacity-60"
            style={{
              background: zon ? zonDekor[zon] : "var(--cream-wash)",
              borderRadius: "42% 58% 61% 39% / 52% 38% 62% 48%",
            }}
          />
        </div>
      ) : null}

      <div className={cn("relative mx-auto max-w-6xl px-4 sm:px-6", centered && "text-center")}>
        <h1
          className={cn(
            "font-bold tracking-tight text-white",
            isCompact
              ? "text-[40px] leading-[1.05] sm:text-[56px] md:text-[64px]"
              : "text-[48px] leading-[1.02] sm:text-[68px] md:text-[84px]",
          )}
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
        >
          {/* Rubrik och cyklande ord är EN mening ("Träna ORD.", "Se vem som
              är bäst."), så mellan dem står ett riktigt mellanslag. Ordet låg
              tidigare som ett eget block under rubriken: meningen bröts mitt
              itu och mellanslaget blev en radbrytning. Mellanslaget är också
              en radbrytningsmöjlighet, så på en smal skärm bryts meningen där
              den ska brytas i stället för att svämma över. */}
          {title}
          {cycleWords && cycleWords.length > 0 ? (
            <>
              {" "}
              <span className="text-primary">{cycleWords[0]}</span>
            </>
          ) : null}
        </h1>

        {subtitle ? (
          <p
            className={cn(
              "mt-6 text-[17px] leading-relaxed text-white/65 sm:text-[18px]",
              centered ? "mx-auto max-w-2xl" : "max-w-2xl",
            )}
          >
            {subtitle}
          </p>
        ) : null}

        {primaryCta || secondaryCta ? (
          <div
            className={cn("mt-8 flex flex-wrap items-center gap-3", centered && "justify-center")}
          >
            {primaryCta}
            {secondaryCta}
          </div>
        ) : null}
      </div>
    </section>
  );
}
