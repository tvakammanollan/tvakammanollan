import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";

export const Route = createFileRoute("/villkor")({
  component: VillkorPage,
  head: () => ({
    meta: pageMeta({
      path: "/villkor",
      title: "Användarvillkor",
      description:
        "Användarvillkoren för Tvåkommanollan. Vad du får göra, hur vi hanterar konton och villkoren för köp av hela ordlistan och MEK.",
      ogTitle: "Tvåkommanollan | Användarvillkor",
      ogDescription: "Användarvillkoren för Tvåkommanollan.",
    }),
    links: pageLinks("/villkor"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Användarvillkor", path: "/villkor" },
      ]),
    ],
  }),
});

function VillkorPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        align="center"
        title="Användarvillkor"
        subtitle="Senast uppdaterad: 2026-11-14"
        variant="compact"
      />
      <article
        className="mx-auto max-w-3xl px-4 pb-24 text-[15px] leading-[1.75] sm:px-6"
        style={{ color: "var(--text-secondary)" }}
      >
        <section className="space-y-6">
          <p>
            Genom att använda Tvåkommanollan godkänner du dessa villkor. Tjänsten drivs av{" "}
            <strong style={{ color: "var(--cream)" }}>Niklas Pellkvist</strong> som privatperson.
            Det mesta på sajten är gratis. Det som kostar är Hela Ordlistan (hela ordlistan och
            MEK-övningen), som du köper frivilligt och som har egna villkor längre ned. Kontakt:{" "}
            <a
              href="mailto:info@tvakommanollan.se"
              className="underline"
              style={{ color: "var(--amber)" }}
            >
              info@tvakommanollan.se
            </a>
            .
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Användning
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Tvåkommanollan är gratis att använda, förutom ordträningen efter de första 40 orden
              och MEK-övningen efter de första 40 uppgifterna. De kräver köpet Hela Ordlistan, se
              avsnittet om köp nedan.
            </li>
            <li>Du måste vara minst 13 år för att skapa konto.</li>
            <li>
              Ett konto per person. Inga botar eller automatiserad användning (utöver de bottar vi
              själva tillhandahåller för träning).
            </li>
            <li>
              Innehållet (frågor, ord, övningsmaterial, guider) får inte skrapas, kopieras eller
              återanvändas kommersiellt utan skriftligt tillstånd.
            </li>
            <li>
              Du får inte använda tjänsten för att trakassera andra användare, sprida olämpligt
              innehåll eller på annat sätt missbruka plattformen.
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Kontosäkerhet
          </h2>
          <p>
            Du ansvarar för att hålla ditt lösenord säkert och för aktivitet som sker via ditt
            konto. Misstänker du obehörig åtkomst, kontakta oss omedelbart så hjälper vi dig att
            säkra kontot.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Innehåll, upphovsrätt och ansvar
          </h2>
          <p>
            Frågor på Tvåkommanollan baseras på publicerade högskoleprov från Universitets- och
            högskolerådet (UHR). Materialet får användas för studiesyfte men inte för kommersiell
            vidareförsäljning. Tvåkommanollan är inte officiellt godkänt eller affilierat med UHR.
            Vi eftersträvar korrekthet i frågor, facit och normering men kan inte garantera att alla
            svar är felfria. Hittar du fel, rapportera via bug-knappen så fixar vi det.
          </p>
          <p>
            Den kostnadsfria delen av tjänsten tillhandahålls "i befintligt skick" utan garantier,
            och vi ansvarar inte för indirekta skador som följer av användningen (t.ex. uteblivet
            provresultat, missade ansökningar). För det du har betalat för gäller i stället det som
            står under Köp av Hela Ordlistan, och i övrigt svensk konsumenträtt.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Köp av Hela Ordlistan
          </h2>
          <p>
            Hela Ordlistan ger ditt konto obegränsad ordträning och MEK-övning utöver de 40 ord och
            40 MEK-uppgifter som är gratis. Den finns som två köp: en prenumeration per månad, och 6
            månader som engångsköp. Sexmånadersköpet gäller 6 månader från betalningen och förnyas
            inte. Vill du fortsätta efter perioden köper du igen. Avtalet ingås
            mellan dig och Niklas Pellkvist när du slutför betalningen i kassan. Köpet knyts till
            det konto du var inloggad med, och gästkonton kan inte köpa. Priset som visas i kassan
            är det du betalar, och betalningen hanteras av Stripe.
          </p>
          <p>
            Åtkomsten gäller hela den köpta perioden, förutsatt att ditt konto inte stängts av
            enligt dessa villkor. Köp gjorda före den 21 oktober 2026 gäller utan tidsgräns, så
            länge Tvåkommanollan finns kvar. Läggs tjänsten ned medan ett köp gäller betalar vi
            tillbaka köpet.
          </p>
          <h3 className="mt-6 font-semibold text-center" style={{ color: "var(--cream)" }}>
            Prenumerationen
          </h3>
          <p>
            Månadsköpet är en prenumeration. Priset dras i förskott när du köper och sedan samma dag
            varje månad, tills du säger upp. Du säger upp när som helst under Ditt köp på
            statistiksidan, utan uppsägningstid. Tillgången gäller då månaden ut och inga fler
            dragningar görs. En påbörjad månad betalas inte tillbaka. Fram till att månaden tagit
            slut kan du ångra uppsägningen på samma ställe.
          </p>
          <p>
            Går en dragning inte igenom försöker Stripe igen under några dagar, och tillgången
            gäller under tiden till slutet av den månad du redan betalat. Lyckas ingen dragning
            avslutas prenumerationen. Raderar du kontot avslutas prenumerationen direkt.
          </p>
          <p>
            Använder du en rabattkod gäller den det som står i kassan. En kod som gör första
            månaden gratis gör inte de följande gratis: från andra månaden dras det vanliga priset
            om du inte säger upp innan dess.
          </p>
          <h3 className="mt-6 font-semibold text-center" style={{ color: "var(--cream)" }}>
            Ångerrätt
          </h3>
          <p>
            Hela Ordlistan är digitalt innehåll som blir tillgängligt direkt efter betalningen.
            Genom att slutföra köpet går du uttryckligen med på att leveransen börjar direkt och
            godkänner att ångerrätten då faller bort. Det gäller det första köpet; en förnyelse av
            prenumerationen ger ingen ny ångerrätt, men du kan säga upp när som helst. Är något fel, eller fungerar inte åtkomsten,
            hör av dig till{" "}
            <a
              href="mailto:info@tvakommanollan.se?subject=Hela%20Ordlistan"
              className="underline"
              style={{ color: "var(--amber)" }}
            >
              info@tvakommanollan.se
            </a>{" "}
            så rättar vi det eller betalar tillbaka.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Avstängning
          </h2>
          <p>
            Vi kan stänga av konton som bryter mot dessa villkor (fusk, trakasserier, missbruk av
            tjänsten, försök att kringgå säkerhetsmekanismer). Vid avstängning förlorar du tillgång
            till ditt konto och din ELO-historik.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Tillämplig lag och tvister
          </h2>
          <p>
            Dessa villkor regleras av svensk rätt. Tvister som inte kan lösas i samförstånd avgörs i
            svensk domstol. Som konsument har du även rätt att vända dig till{" "}
            <a
              href="https://www.arn.se"
              className="underline"
              style={{ color: "var(--amber)" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Allmänna reklamationsnämnden (ARN)
            </a>
            .
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Ändringar
          </h2>
          <p>
            Vi kan uppdatera villkoren. Vid större ändringar meddelar vi via e-post eller en notis
            på sajten. Mindre ändringar visas genom uppdaterat datum längst upp på denna sida.
          </p>
        </section>
      </article>
    </div>
  );
}
