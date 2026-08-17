import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";

/* =====================================================================
   Forumregler och tillhandahållarinformation.

   Detta är inte en trevlig detalj utan ett lagkrav. BBS-lagen (1998:112)
   ålägger den som tillhandahåller en elektronisk anslagstavla att ha uppsikt
   över tjänsten i skälig omfattning, att ta bort vissa slags meddelanden och
   att informera användarna om vem tillhandahållaren är och vilka uppgifter
   som lagras. Ändras något av det nedan — ändra här också.
   ===================================================================== */

export const Route = createFileRoute("/forum_/regler")({
  head: () => ({
    meta: pageMeta({
      path: "/forum/regler",
      title: "Forumregler · HP Kampen",
      description:
        "Reglerna för HP Kampens forum: vem som driver det, vad som lagras, vad som inte får publiceras och hur du rapporterar ett inlägg.",
      ogTitle: "Forumregler · HP Kampen",
      ogDescription: "Regler, tillhandahållare och hur du rapporterar ett inlägg.",
    }),
    links: pageLinks("/forum/regler"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Forum", path: "/forum" },
        { name: "Regler", path: "/forum/regler" },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Forumregler",
        url: "https://hpkampen.se/forum/regler",
        inLanguage: "sv-SE",
        isPartOf: { "@id": "https://hpkampen.se/#website" },
        publisher: { "@id": "https://hpkampen.se/#org" },
      }),
    ],
  }),
  component: ForumRulesPage,
});

function ForumRulesPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Forum"
        title="Regler"
        subtitle="Korta, och de handlar mest om att göra forumet användbart för nästa person som googlar samma fråga."
        align="center"
        variant="compact"
      />

      <div className="mx-auto max-w-2xl px-4 pb-24 sm:px-6">
        <Section title="Vem driver forumet">
          <p>
            HP Kampen drivs av <Strong>Niklas Pellkvist</Strong> som privatperson. Forumet är en del
            av hpkampen.se och tillhandahålls utan kostnad och utan annonser.
          </p>
          <p>
            Kontakt i alla frågor som rör forumet — inklusive begäran om att få ett inlägg
            borttaget:{" "}
            <a
              href="mailto:info@hpkampen.se"
              className="text-[var(--teal)] underline underline-offset-2"
            >
              info@hpkampen.se
            </a>
            .
          </p>
          <p>
            Forumet har ingen ansvarig utgivare och omfattas inte av utgivningsbevis. Varje
            användare ansvarar själv för det hen skriver.
          </p>
        </Section>

        <Section title="Vad som lagras">
          <p>
            När du skriver i forumet lagras inläggets text, tidpunkt och vilket konto som skrev det.
            Ditt användarnamn visas offentligt tillsammans med inlägget; din mejladress gör det
            inte.
          </p>
          <p>
            Raderar du ditt konto avidentifieras din användarrad, och dina inlägg står kvar utan
            namn (märkta "Borttagen användare") så att trådarna förblir läsbara. Vill du ha ett
            enskilt inlägg borttaget — hör av dig.
          </p>
          <p>
            Hela bilden av vad sajten samlar in står i{" "}
            <Link to="/integritetspolicy" className="text-[var(--teal)] hover:underline">
              integritetspolicyn
            </Link>
            .
          </p>
        </Section>

        <Section title="Så skriver du">
          <List
            items={[
              "Skriv en rubrik som säger vad frågan gäller. Den är det andra googlar.",
              "Visa hur du tänkt, inte bara vad svaret blev — det är därför folk kommer tillbaka.",
              "Svara på frågan som ställdes. Går diskussionen åt ett annat håll: starta en ny tråd.",
              "Matte skrivs mellan dollartecken: $x^2$, $\\frac{3}{4}$.",
            ]}
          />
        </Section>

        <Section title="Det här får inte publiceras">
          <p>
            Utöver vad som är olagligt tar jag bort inlägg som uppenbart utgör hets mot folkgrupp,
            barnpornografibrott, olaga våldsskildring, uppvigling eller uppenbart intrång i
            upphovsrätt. Det är vad lagen om ansvar för elektroniska anslagstavlor (1998:112) kräver
            av mig som tillhandahållare, och det görs utan diskussion.
          </p>
          <List
            items={[
              "Reklam, spam och länkar vars enda syfte är att sälja något.",
              "Påhopp på andra användare. Kritisera resonemang, inte personer.",
              "Personuppgifter om någon annan — namn, skola, bilder, kontaktuppgifter.",
              "Inklistrade lästexter och provuppgifter ur UHR:s häften. De är upphovsrättsskyddade — det är just därför den engelska läsförståelsen plockas bort ur häftena en vecka efter provdagen. Länka till uppgiften i gamla prov i stället.",
              "Läckta uppgifter från ett pågående provtillfälle. Det är den enda innehållstypen som kan skada sajtens möjlighet att alls publicera gamla prov, och trådar kring provdatum kan låsas i förebyggande syfte.",
            ]}
          />
        </Section>

        <Section title="Vem får skriva">
          <p>
            Läsa kan alla, även utan konto. För att skriva krävs ett konto med bekräftad mejladress
            som är äldre än tio minuter. Gästkonton — de som skapas automatiskt när du spelar utan
            att registrera dig — kan inte skriva.
          </p>
          <p>
            Det är inte krångel för krånglets skull: utan den spärren kan vem som helst skapa
            obegränsat med konton på några sekunder, och forumet vore spammat inom en vecka.
          </p>
          <p>
            Nya konton har lite hårdare gränser de första inläggen — bland annat hamnar inlägg med
            länkar i granskning i stället för att publiceras direkt. Det släpper av sig självt.
          </p>
        </Section>

        <Section title="Om något är fel">
          <p>
            Varje inlägg har en rapportknapp. Rapporterade inlägg hamnar i en kö som jag går igenom,
            och tre obehandlade anmälningar på samma inlägg döljer det automatiskt tills jag hunnit
            titta.
          </p>
          <p>
            Åtgärderna är: godkänna, dölja, radera, och i upprepade fall stänga av kontot från
            forumet. Ingenting raderas hårt — ett inlägg som tagits bort går att återställa om det
            visar sig ha varit fel.
          </p>
          <p>
            Tycker du att jag gjort fel bedömning: mejla{" "}
            <a
              href="mailto:info@hpkampen.se"
              className="text-[var(--teal)] underline underline-offset-2"
            >
              info@hpkampen.se
            </a>{" "}
            så tittar jag på det igen.
          </p>
        </Section>

        <div className="mt-12 flex flex-wrap gap-3 border-t border-white/8 pt-8 text-sm">
          <Link to="/forum" className="text-[var(--teal)] hover:underline">
            ← Till forumet
          </Link>
          <span className="text-white/25" aria-hidden>
            ·
          </span>
          <Link to="/integritetspolicy" className="text-[var(--teal)] hover:underline">
            Integritetspolicy
          </Link>
          <span className="text-white/25" aria-hidden>
            ·
          </span>
          <Link to="/villkor" className="text-[var(--teal)] hover:underline">
            Användarvillkor
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2
        className="text-[20px] font-bold text-[var(--cream)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
        {children}
      </div>
    </section>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-[var(--cream)]">{children}</strong>;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
