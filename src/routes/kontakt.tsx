import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { Mail, MessageSquare, Bug } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";

export const Route = createFileRoute("/kontakt")({
  component: KontaktPage,
  head: () => ({
    meta: pageMeta({
      path: "/kontakt",
      title: "Kontakt · Tvåkommanollan",
      description:
        "Hör av dig till Tvåkommanollan. E-post, buggrapporter och feedback. Vi svarar oftast inom 1 vardag.",
      ogTitle: "Kontakt · Tvåkommanollan",
      ogDescription: "Hör av dig. E-post, buggrapporter och feedback.",
    }),
    links: pageLinks("/kontakt"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Kontakt", path: "/kontakt" },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Kontakt · Tvåkommanollan",
        url: "https://tvakommanollan.se/kontakt",
        description: "Kontaktinformation till Tvåkommanollan: e-post, buggrapporter och feedback.",
        publisher: { "@id": "https://tvakommanollan.se/#org" },
      }),
    ],
  }),
});

function KontaktPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Hör av dig"
        title="Kontakt"
        subtitle="Fel i en fråga, feature-önskemål, samarbeten eller bara hejhej. Vi svarar oftast inom en vardag."
        align="center"
        variant="content"
      />
      <article
        className="mx-auto max-w-2xl px-4 pb-24 text-[15px] leading-[1.75] sm:px-6"
        style={{ color: "var(--text-secondary)" }}
      >
        <ul className="space-y-4">
          <li>
            <a
              href="mailto:info@tvakommanollan.se"
              className="flex items-center gap-3 rounded-2xl border p-4 transition hover:bg-white/5"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}
            >
              <Mail className="h-5 w-5" style={{ color: "var(--amber)" }} />
              <span>
                <span className="font-semibold">info@tvakommanollan.se</span>
                <span className="ml-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Allmänt, feedback, press, samarbeten
                </span>
              </span>
            </a>
          </li>
          <li>
            <div
              className="flex items-start gap-3 rounded-2xl border p-4"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}
            >
              <Bug className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--amber)" }} />
              <span>
                <span className="block font-semibold">Buggrapport</span>
                <span className="mt-1 block text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Använd bug-knappen i appen (kräver inloggning), så får vi med rätt context
                  automatiskt. Annars mejla{" "}
                  <a
                    href="mailto:info@tvakommanollan.se?subject=Bugg-rapport"
                    className="underline"
                    style={{ color: "var(--amber)" }}
                  >
                    info@tvakommanollan.se
                  </a>
                  .
                </span>
              </span>
            </div>
          </li>
          <li>
            <div
              className="flex items-start gap-3 rounded-2xl border p-4"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}
            >
              <MessageSquare
                className="h-5 w-5 shrink-0 mt-0.5"
                style={{ color: "var(--amber)" }}
              />
              <span>
                <span className="block font-semibold">Vem driver Tvåkommanollan?</span>
                <span className="mt-1 block text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Sajten drivs av Niklas Pellkvist som privatperson. Den är gratis, utan annonser
                  och utan kommersiell verksamhet kopplad till sig. Mer om varför sajten finns:{" "}
                  <Link to="/om" className="underline" style={{ color: "var(--amber)" }}>
                    /om
                  </Link>
                  .
                </span>
              </span>
            </div>
          </li>
        </ul>

        <p className="mt-10 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Vi svarar normalt inom en vardag på mejl. Bug-rapporter via knappen i appen hanteras
          oftast snabbare eftersom de innehåller felkontext.
        </p>
      </article>
    </div>
  );
}
