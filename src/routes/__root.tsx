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

installSupabaseFetchAuth();

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold text-primary" style={{ fontFamily: "var(--font-display)" }}>
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
      { title: "HP Kampen – Tävla mot vänner i Högskoleprovet" },
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
      { property: "og:title", content: "HP Kampen – Tävla i Högskoleprovet" },
      {
        property: "og:description",
        content: "Realtidsmatcher och ELO-ranking för HP-pluggare. Gratis.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hpkampen.se/" },
      { property: "og:locale", content: "sv_SE" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/64f6b4aa-d862-4908-8a0f-3642c9ee7f51/id-preview-013c86ed--7be77bb5-7201-4fdd-81e0-566f5bf73811.lovable.app-1778513238336.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "HP Kampen — Tävla mot vänner i Högskoleprovet" },
      { property: "og:site_name", content: "HP Kampen" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "HP Kampen – Tävla i Högskoleprovet" },
      {
        name: "twitter:description",
        content: "Realtidsmatcher och ELO-ranking för HP-pluggare. Gratis.",
      },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/64f6b4aa-d862-4908-8a0f-3642c9ee7f51/id-preview-013c86ed--7be77bb5-7201-4fdd-81e0-566f5bf73811.lovable.app-1778513238336.png" },
      { name: "theme-color", content: "#0E1B2C" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "HP Kampen" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "canonical", href: "https://hpkampen.se/" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,300;1,6..72,400;1,6..72,500&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "HP Kampen",
          url: "https://hpkampen.se",
          description:
            "Tävla mot vänner i realtid med frågor från Högskoleprovet. ELO-ranking och alla 8 delmoment — ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK. Helt gratis.",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "SEK" },
          inLanguage: "sv-SE",
          featureList: [
            "Realtidsmatcher mot vänner",
            "ELO-ranking med tiers från Brons till Diamant",
            "Bot-träning utan tidsbegränsning",
            "Alla 8 delprov: ORD, MEK, LÄS, ELF, XYZ, KVA, NOG, DTK",
            "8 000+ HP-ord i databasen",
            "Gratis coachning av 1.9+-spelare",
          ],
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
        <Navbar />
        <main className="animate-fade-up">
          <Outlet />
        </main>
        <FriendInviteListener />
        <Toaster richColors position="top-center" />
      </div>
    </QueryClientProvider>
  );
}
