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
import { useOAuthErrorToast } from "@/hooks/useOAuthErrorToast";
import { useEffect } from "react";
import { installGlobalClickSound } from "@/lib/sounds";
import { LazyMotion } from "framer-motion";
import { FriendInviteListener } from "@/components/FriendInviteListener";
import { AchievementWatcher } from "@/components/AchievementWatcher";
import { SafeBoundary } from "@/components/SafeBoundary";
import { AppMotion } from "@/components/AppMotion";
import { Footer } from "@/components/Footer";
import { ConsentBanner } from "@/components/ConsentBanner";
import { CoachingPrompt } from "@/components/CoachingPrompt";
import { Analytics } from "@/components/Analytics";

installSupabaseFetchAuth();

// Origin för preconnect/dns-prefetch. Faller tillbaka på tvakommanollan.se så att
// en saknad env-variabel inte ger en trasig <link>-tagg i <head>.
const SUPABASE_ORIGIN =
  import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://tvakommanollan.se";

// Framer-motions animations-runtime laddas asynkront (egen chunk) — se
// src/lib/motion-features.ts. `strict` gör att en glömd motion.→m.-migrering
// kastar direkt i dev i stället för att tyst dra in hela runtimen igen.
const loadMotionFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

function NotFoundComponent() {
  const POPULAR = [
    { to: "/gamla-prov", label: "Gamla prov", desc: "Skriv hela HP-pass 2022–2026" },
    { to: "/train", label: "Träna", desc: "Alla 8 delprov i lugn takt" },
    { to: "/leaderboard", label: "Topplista", desc: "Sveriges vassaste HP-spelare" },
    { to: "/guider", label: "Guider", desc: "Strategi per delprov" },
    { to: "/forum", label: "Forum", desc: "Fråga och svara om HP" },
    { to: "/faq", label: "Vanliga frågor", desc: "Svar på det vanligaste" },
  ] as const;

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <h1
          className="text-7xl font-semibold text-primary sm:text-8xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          404
        </h1>
        <h2 className="mt-3 text-xl font-semibold sm:text-2xl">Sidan hittades inte</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Den här sidan finns inte, men din ELO väntar. Här är några populära ställen att gå till
          istället:
        </p>

        <ul className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          {POPULAR.map((p) => (
            <li key={p.to}>
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                to={p.to as any}
                className="group block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50 hover:shadow-md"
              >
                <div className="text-sm font-semibold text-foreground">{p.label} →</div>
                <div className="mt-1 text-xs text-muted-foreground">{p.desc}</div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8">
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
      <div className="max-w-lg text-center">
        <h1 className="text-xl font-semibold tracking-tight">Något gick snett</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Försök igen eller gå tillbaka till hem.
        </p>
        <details className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-left text-xs">
          <summary className="cursor-pointer text-white/60">Teknisk info (för debugging)</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-[11px] text-[#8c1d18]">
            {error?.name ? `${error.name}: ` : ""}
            {error?.message ?? String(error)}
            {error?.stack ? `\n\n${error.stack.split("\n").slice(0, 5).join("\n")}` : ""}
          </pre>
        </details>
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
      { title: "Tvåkommanollan – Gratis ELO-rankade HP-dueller & övningsprov" },
      {
        name: "description",
        content:
          "Utmana vänner i realtid med HP-frågor. Klättra i ELO-rankingen. Träna på ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK – gratis.",
      },
      {
        property: "og:title",
        content: "Tvåkommanollan – Gratis ELO-rankade HP-dueller & övningsprov",
      },
      {
        property: "og:description",
        content:
          "Tävla mot vänner i realtid med riktiga HP-frågor. ELO-ranking och alla 8 delprov – helt gratis.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://tvakommanollan.se/" },
      { property: "og:locale", content: "sv_SE" },
      { property: "og:image", content: "https://tvakommanollan.se/og-image-3.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Tvåkommanollan · Tävla mot vänner i Högskoleprovet" },
      { property: "og:site_name", content: "Tvåkommanollan" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Tvåkommanollan – Gratis ELO-rankade HP-dueller & övningsprov",
      },
      {
        name: "twitter:description",
        content:
          "Tävla mot vänner i realtid med riktiga HP-frågor. ELO-ranking och alla 8 delprov – helt gratis.",
      },
      { name: "twitter:image", content: "https://tvakommanollan.se/og-image-3.png" },
      { name: "theme-color", content: "#fbf6ec" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Tvåkommanollan" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      // SVG först för moderna klienter, PNG som reserv. Google och
      // Androids "lägg till på hemskärmen" tar inte SVG, så utan
      // PNG-varianterna föll de tillbaka på en skalad skärmdump.
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/icon-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      // canonical sätts per route (annars duplicerar TanStack länken på alla sidor)
      // hreflang för Sverige-svenska
      { rel: "alternate", hrefLang: "sv-SE", href: "https://tvakommanollan.se/" },
      { rel: "alternate", hrefLang: "x-default", href: "https://tvakommanollan.se/" },
      { rel: "stylesheet", href: appCss },
      // Preconnect / DNS-prefetch för snabbare Core Web Vitals.
      // Härledd ur miljön, inte hårdkodad: den gamla adressen låg kvar efter
      // flytten till nytt Supabase-projekt, så webbläsaren värmde upp en
      // anslutning till fel server och missade vinsten helt.
      { rel: "preconnect", href: SUPABASE_ORIGIN, crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: SUPABASE_ORIGIN },
      // OBS: Google Fonts-länken (Newsreader/Geist/Geist Mono) borttagen —
      // ingen font-family i CSS:en refererade de familjerna, så typografin
      // renderades redan med fallbackarna (Georgia/system-ui). Länken var
      // enbart renderblockerande dödvikt.
    ],
    scripts: [
      // OBS: AdSense-skriptet borttaget (2026-07). Det fanns inga annonsplatser
      // i koden, CSP:n blockerade skriptet, OCH integritetspolicyn lovar "inga
      // spårningscookies" — att ladda Googles tracker utan samtycke bryter mot
      // GDPR/ePrivacy. Vill du visa annonser i framtiden krävs: (1) en Google-
      // certifierad samtyckesplattform (CMP) FÖRE skriptet laddas för EU-
      // användare, (2) CSP-uppdatering, (3) uppdaterad integritetspolicy.
      // ads.txt ligger kvar i public/ inför den dagen.
      // Schema.org WebApplication
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "@id": "https://tvakommanollan.se/#webapp",
          name: "Tvåkommanollan",
          alternateName: "Tvakommanollan",
          url: "https://tvakommanollan.se",
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
            "10 000+ HP-ord i databasen",
            "Gratis coachning av 1.9+-spelare",
          ],
          publisher: { "@id": "https://tvakommanollan.se/#org" },
          creator: { "@id": "https://tvakommanollan.se/#niklas" },
        }),
      },
      // Schema.org EducationalOrganization
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "@id": "https://tvakommanollan.se/#org",
          name: "Tvåkommanollan",
          url: "https://tvakommanollan.se",
          logo: "https://tvakommanollan.se/icon-192.png",
          areaServed: "SE",
          description:
            "Sveriges enda gratis plattform för Högskoleprovet med realtidsmatcher och ELO-ranking. Träna alla 8 delprov med riktiga HP-frågor.",
          founder: { "@id": "https://tvakommanollan.se/#niklas" },
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
          "@id": "https://tvakommanollan.se/#niklas",
          name: "Niklas",
          jobTitle: "Grundare",
          worksFor: { "@id": "https://tvakommanollan.se/#org" },
          description: "Grundare av Tvåkommanollan. Fick 1,9 på Högskoleprovet.",
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
              name: "Vad är Tvåkommanollan?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Tvåkommanollan är en gratis plattform där du tävlar mot vänner i realtid med frågor från Högskoleprovet. Du klättrar i en ELO-ranking och kan träna alla 8 delprov: ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK.",
              },
            },
            {
              "@type": "Question",
              name: "Kostar Tvåkommanollan något?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Nej, Tvåkommanollan är helt gratis. Inga annonser, inget kreditkort, inga in-app-köp. Du kan även få en gratis 30-min coachning från en spelare som fått 1,9+ på HP.",
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
                text: "Högskoleprovet ger ett resultat mellan 0,00 och 2,00, i steg om 0,05. Resultatet baseras på andel rätta svar i de åtta delproverna (ORD, MEK, LÄS, ELF, XYZ, KVA, NOG, DTK). Felaktiga svar ger inga minuspoäng, det lönar sig alltid att gissa. Medelvärdet brukar ligga kring 0,9–1,0.",
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
          "@id": "https://tvakommanollan.se/#website",
          url: "https://tvakommanollan.se",
          name: "Tvåkommanollan",
          description: "Realtidsmatcher och ELO-ranking för Högskoleprovet. Gratis.",
          inLanguage: "sv-SE",
          publisher: { "@id": "https://tvakommanollan.se/#org" },
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
        <nav
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap",
          }}
        >
          <a href="/">Hem</a>
          <a href="/leaderboard">Topplista</a>
          <a href="/gamla-prov">Gamla prov</a>
          <a href="/train">Träna HP</a>
          <a href="/ord">Öva ord</a>
          <a href="/matchmaking">Hitta match</a>
          <a href="/friends">Vänner</a>
          <a href="/signup">Skapa konto</a>
          <a href="/login">Logga in</a>
          <a href="/faq">Vanliga frågor</a>
          <a href="/forum">Forum om högskoleprovet</a>
          <a href="/guider">Guider till HP</a>
          <a href="/guider/ord">ORD-guide</a>
          <a href="/guider/mek">MEK-guide</a>
          <a href="/guider/las">LÄS-guide</a>
          <a href="/guider/elf">ELF-guide</a>
          <a href="/guider/xyz">XYZ-guide</a>
          <a href="/guider/kva">KVA-guide</a>
          <a href="/guider/nog">NOG-guide</a>
          <a href="/guider/dtk">DTK-guide</a>
          <a href="/hogskoleprovet-poang">HP-poäng och normering</a>
          <a href="/guider/tidspress">Tidspress HP</a>
          <a href="/guider/bra-resultat">Få bra HP-resultat</a>
          <a href="/om">Om Tvåkommanollan</a>
          <a href="/kontakt">Kontakt</a>
        </nav>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // OAuth-returen kan landa på vilken route som helst (redirectTo + Site URL),
  // så felet fångas här i stället för på en enskild callback-sida.
  useOAuthErrorToast();
  useEffect(() => {
    installGlobalClickSound();
    // Install client-side error telemetry (#16)
    void import("@/lib/telemetry").then((m) => m.installBrowserTelemetry());
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures} strict>
        <div className="min-h-screen bg-background">
          {/* Skip-to-content för tangentbordsanvändare och skärmläsare.
            Visas bara vid keyboard-focus (sr-only:focus). */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Hoppa till innehåll
          </a>
          <AppMotion />
          <Navbar />
          <main id="main-content" className="animate-fade-up">
            <Outlet />
          </main>
          <Footer />
          <FriendInviteListener />
          <SafeBoundary label="achievement-watcher">
            <AchievementWatcher />
          </SafeBoundary>
          <SafeBoundary label="analytics">
            <Analytics />
          </SafeBoundary>
          <SafeBoundary label="consent-banner">
            <ConsentBanner />
          </SafeBoundary>
          <SafeBoundary label="coaching-prompt">
            <CoachingPrompt />
          </SafeBoundary>
          <Toaster richColors position="top-center" />
        </div>
      </LazyMotion>
    </QueryClientProvider>
  );
}
