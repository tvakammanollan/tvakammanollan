import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { installSupabaseFetchAuth } from "@/integrations/supabase/fetch-auth";
import { useEffect } from "react";
import { installGlobalClickSound } from "@/lib/sounds";
import { FriendInviteListener } from "@/components/FriendInviteListener";
import { AppMotion } from "@/components/AppMotion";
import { FloatingTestCta } from "@/components/FloatingTestCta";

installSupabaseFetchAuth();

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1
          className="text-7xl font-semibold text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          404
        </h1>
        <h2 className="mt-3 text-xl font-semibold">Sidan hittades inte</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Den här sidan finns inte – men din ELO väntar.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Till hem
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Något gick snett</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Försök igen eller gå tillbaka till hem.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Försök igen
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-accent"
          >
            Till hem
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HP Kampen – Gratis ELO-rankade HP-dueller & övningsprov" },
      {
        name: "description",
        content:
          "Utmana vänner i realtid med HP-frågor. Klättra i ELO-rankingen. Träna på ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK – gratis.",
      },
      {
        name: "keywords",
        content:
          "högskoleprovet, HP-träning, högskoleprov övningar, HP-app, ORD MEK LÄS ELF XYZ KVA NOG DTK",
      },
      { property: "og:title", content: "HP Kampen – Gratis ELO-rankade HP-dueller & övningsprov" },
      {
        property: "og:description",
        content:
          "Tävla mot vänner i realtid med riktiga HP-frågor. ELO-ranking och alla 8 delprov – helt gratis.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hpkampen.se/" },
      { property: "og:locale", content: "sv_SE" },
      { property: "og:image", content: "https://hpkampen.se/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "HP Kampen · Tävla mot vänner i Högskoleprovet" },
      { property: "og:site_name", content: "HP Kampen" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "HP Kampen – Gratis ELO-rankade HP-dueller & övningsprov" },
      {
        name: "twitter:description",
        content:
          "Tävla mot vänner i realtid med riktiga HP-frågor. ELO-ranking och alla 8 delprov – helt gratis.",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/64f6b4aa-d862-4908-8a0f-3642c9ee7f51/id-preview-013c86ed--7be77bb5-7201-4fdd-81e0-566f5bf73811.lovable.app-1778513238336.png",
      },
      { name: "theme-color", content: "#0E1B2C" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "HP Kampen" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.json" },
      // canonical sätts per route (annars duplicerar TanStack länken på alla sidor)
      // hreflang för Sverige-svenska
      { rel: "alternate", hrefLang: "sv-SE", href: "https://hpkampen.se/" },
      { rel: "alternate", hrefLang: "x-default", href: "https://hpkampen.se/" },
      { rel: "stylesheet", href: appCss },
      // Preconnect / DNS-prefetch för snabbare Core Web Vitals
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "preconnect",
        href: "https://dqhgnioniarhiugxdgla.supabase.co",
        crossOrigin: "anonymous",
      },
      { rel: "dns-prefetch", href: "https://dqhgnioniarhiugxdgla.supabase.co" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,300;1,6..72,400;1,6..72,500&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap",
      },
    ],
    scripts: [
      // Schema.org WebApplication
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "@id": "https://hpkampen.se/#webapp",
          name: "HP Kampen",
          alternateName: "HP-Kampen",
          url: "https://hpkampen.se",
          description:
            "Tävla mot vänner i realtid med frågor från Högskoleprovet. ELO-ranking och alla 8 delmoment: ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK. Helt gratis.",
          applicationCategory: "EducationalApplication",
          applicationSubCategory: "TestPreparation",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "SEK" },
          inLanguage: "sv-SE",
          isAccessibleForFree: true,
          audience: {
            "@type": "EducationalAudience",
            educationalRole: "student",
            audienceType: "Gymnasieelev och högskolesökande i Sverige",
          },
          featureList: [
            "Realtidsmatcher mot vänner",
            "ELO-ranking med tiers från Brons till Diamant",
            "Övningsmatcher utan tidsbegränsning",
            "Alla 8 delprov: ORD, MEK, LÄS, ELF, XYZ, KVA, NOG, DTK",
            "8 000+ HP-ord i databasen",
            "Gratis coachning av 1.9+-spelare",
          ],
          publisher: { "@id": "https://hpkampen.se/#org" },
          creator: { "@id": "https://hpkampen.se/#niklas" },
        }),
      },
      // Schema.org EducationalOrganization
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "@id": "https://hpkampen.se/#org",
          name: "HP Kampen",
          url: "https://hpkampen.se",
          logo: "https://hpkampen.se/favicon.svg",
          areaServed: "SE",
          description:
            "Sveriges enda gratis plattform för Högskoleprovet med realtidsmatcher och ELO-ranking. Träna alla 8 delprov med riktiga HP-frågor.",
          founder: { "@id": "https://hpkampen.se/#niklas" },
          knowsAbout: [
            "Högskoleprovet",
            "HP",
            "ORD",
            "MEK",
            "LÄS",
            "ELF",
            "XYZ",
            "KVA",
            "NOG",
            "DTK",
            "Ordkunskap",
            "Läsförståelse",
            "Matematik",
            "Logisk slutledning",
          ],
        }),
      },
      // Schema.org Person (grundaren)
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          "@id": "https://hpkampen.se/#niklas",
          name: "Niklas",
          jobTitle: "Grundare",
          worksFor: { "@id": "https://hpkampen.se/#org" },
          description: "Grundare av HP Kampen. Fick 1,9 på Högskoleprovet.",
        }),
      },
      // Schema.org FAQPage — Google rich results
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Vad är HP Kampen?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "HP Kampen är en gratis plattform där du tävlar mot vänner i realtid med frågor från Högskoleprovet. Du klättrar i en ELO-ranking och kan träna alla 8 delprov: ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK.",
              },
            },
            {
              "@type": "Question",
              name: "Kostar HP Kampen något?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Nej, HP Kampen är helt gratis. Inga annonser, inget kreditkort, inga in-app-köp. Du kan även få en gratis 30-min coachning från en spelare som fått 1,9+ på HP.",
              },
            },
            {
              "@type": "Question",
              name: "Hur funkar matcherna?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Du väljer verbal eller matte, sen matchar vi dig mot en spelare på din ELO-nivå inom sekunder. En match är 8 frågor på 8 minuter. Vinnaren får ELO, förloraren tappar.",
              },
            },
            {
              "@type": "Question",
              name: "Vad är ELO?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "ELO är ett rankingsystem från schackvärlden. Du börjar på 1 000. Vinner du mot en starkare spelare får du fler poäng. Förlorar du mot en svagare tappar du mer. Tiers: Brons under 1 000, Silver 1 000–1 199, Guld 1 200–1 399, Platina 1 400–1 599, Diamant 1 600+.",
              },
            },
            {
              "@type": "Question",
              name: "Vilka delprov kan jag träna?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Alla åtta: ORD (ordkunskap), MEK (meningskomplettering), LÄS (läsförståelse), ELF (engelsk läsförståelse), XYZ (matematisk problemlösning), KVA (kvantitativa jämförelser), NOG (kvantitativa resonemang) och DTK (diagram, tabeller och kartor).",
              },
            },
            {
              "@type": "Question",
              name: "Behöver jag ett konto?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Du kan spela som gäst utan konto, men då sparas inte din ELO och du syns inte på topplistan. Kontoregistrering tar 30 sekunder med bara e-post och lösenord.",
              },
            },
            {
              "@type": "Question",
              name: "När är nästa Högskoleprovet?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Högskoleprovet ges normalt två gånger per år: en gång i mars/april och en gång i oktober. Kommande datum 2026–2027: 24 oktober 2026, 27 mars 2027, 23 oktober 2027. Anmälan öppnar ungefär tre månader innan via antagning.se.",
              },
            },
            {
              "@type": "Question",
              name: "Hur räknas HP-poäng?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Högskoleprovet ger ett resultat mellan 0,0 och 2,0 med en decimal. Resultatet baseras på andel rätta svar i de åtta delproverna (ORD, MEK, LÄS, ELF, XYZ, KVA, NOG, DTK). Felaktiga svar ger inga minuspoäng, det lönar sig alltid att gissa. Medelvärdet brukar ligga kring 0,9–1,0.",
              },
            },
          ],
        }),
      },
      // Schema.org WebSite med SearchAction (för Google site search box)
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://hpkampen.se/#website",
          url: "https://hpkampen.se",
          name: "HP Kampen",
          description: "Realtidsmatcher och ELO-ranking för Högskoleprovet. Gratis.",
          inLanguage: "sv-SE",
          publisher: { "@id": "https://hpkampen.se/#org" },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {/* Static nav links for Googlebot — hidden visually, crawlable */}
        <nav aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
          <a href="/">Hem</a>
          <a href="/leaderboard">Topplista</a>
          <a href="/gamla-prov">Gamla prov</a>
          <a href="/train">Träna HP</a>
          <a href="/ord">Öva ord</a>
          <a href="/matchmaking">Hitta match</a>
          <a href="/friends">Vänner</a>
          <a href="/signup">Skapa konto</a>
          <a href="/login">Logga in</a>
        </nav>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    installGlobalClickSound();
    // Install client-side error telemetry (#16)
    void import("@/lib/telemetry").then((m) => m.installBrowserTelemetry());
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <AppMotion />
        <Navbar />
        <main className="animate-fade-up">
          <Outlet />
        </main>
        <FloatingTestCta />
        <FriendInviteListener />
        <Toaster richColors position="top-center" />
      </div>
    </QueryClientProvider>
  );
}
