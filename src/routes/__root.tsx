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
      { name: "theme-color", content: "#1a5c3a" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "HP Kampen" },
      { title: "HP Kampen – Tävla mot vänner i Högskoleprovet" },
      {
        name: "description",
        content:
          "Utmana vänner i realtid med HP-frågor. Klättra i ELO-rankingen. Träna på ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK.",
      },
      { name: "keywords", content: "Högskoleprovet, HP, ELO, ord, matte, träning, plugga, högskoleprov övningar" },
      { name: "author", content: "HP Kampen" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: "HP Kampen – Tävla mot vänner i Högskoleprovet" },
      {
        property: "og:description",
        content:
          "Utmana vänner i realtid med HP-frågor. Klättra i ELO-rankingen. Träna på alla 8 delmoment.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "HP Kampen" },
      { property: "og:url", content: "https://hpkampen.se" },
      { property: "og:image", content: "/og-image.png" },
      { property: "og:locale", content: "sv_SE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "HP Kampen – Tävla mot vänner i Högskoleprovet" },
      { name: "twitter:description", content: "Utmana vänner i realtid med HP-frågor. Klättra i ELO-rankingen." },
      { name: "twitter:image", content: "/og-image.png" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "canonical", href: "https://hpkampen.se" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap",
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
            "Utmana vänner i realtid med HP-frågor. Klättra i ELO-rankingen. Träna på alla 8 delmoment.",
          applicationCategory: "EducationalApplication",
          inLanguage: "sv-SE",
          offers: { "@type": "Offer", price: "0", priceCurrency: "SEK" },
          operatingSystem: "Web",
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
