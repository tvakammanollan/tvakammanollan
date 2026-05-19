import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { Mail, MessageSquare, Bug } from "lucide-react";

export const Route = createFileRoute("/kontakt")({
  component: KontaktPage,
  head: () => ({
    meta: pageMeta({
      path: "/kontakt",
      title: "Kontakt · HP Kampen",
      description:
        "Hör av dig till HP Kampen. E-post, buggrapporter och feedback. Vi svarar oftast inom 1 vardag.",
      ogTitle: "Kontakt · HP Kampen",
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
        name: "Kontakt · HP Kampen",
        url: "https://hpkampen.se/kontakt",
        description:
          "Kontaktinformation till HP Kampen — e-post, buggrapporter och feedback.",
        publisher: { "@id": "https://hpkampen.se/#org" },
      }),
    ],
  }),
});

function KontaktPage() {
  return (
    <article
      className="mx-auto max-w-2xl px-4 py-12 text-[15px] leading-[1.75]"
      style={{ color: "var(--text-secondary)" }}
    >
      <header className="mb-10">
        <h1
          className="text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          Kontakt
        </h1>
        <p className="mt-3" style={{ color: "var(--text-secondary)" }}>
          Hör av dig om allt — fel i en fråga, feature-önskemål, samarbeten
          eller bara hejhej. Vi svarar oftast inom en vardag.
        </p>
      </header>

      <ul className="space-y-4">
        <li>
          <a
            href="mailto:hej@hpkampen.se"
            className="flex items-center gap-3 rounded-2xl border p-4 transition hover:bg-white/5"
            style={{ borderColor: "var(--line)", color: "var(--cream)" }}
          >
            <Mail className="h-5 w-5" style={{ color: "var(--amber)" }} />
            <span>
              <span className="font-semibold">hej@hpkampen.se</span>
              <span
                className="ml-2 text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Allmänna frågor och feedback
              </span>
            </span>
          </a>
        </li>
        <li>
          <a
            href="mailto:bugs@hpkampen.se?subject=Bugg-rapport"
            className="flex items-center gap-3 rounded-2xl border p-4 transition hover:bg-white/5"
            style={{ borderColor: "var(--line)", color: "var(--cream)" }}
          >
            <Bug className="h-5 w-5" style={{ color: "var(--amber)" }} />
            <span>
              <span className="font-semibold">bugs@hpkampen.se</span>
              <span
                className="ml-2 text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Felrapporter (eller använd bug-knappen i appen)
              </span>
            </span>
          </a>
        </li>
        <li>
          <a
            href="mailto:press@hpkampen.se?subject=Press"
            className="flex items-center gap-3 rounded-2xl border p-4 transition hover:bg-white/5"
            style={{ borderColor: "var(--line)", color: "var(--cream)" }}
          >
            <MessageSquare className="h-5 w-5" style={{ color: "var(--amber)" }} />
            <span>
              <span className="font-semibold">press@hpkampen.se</span>
              <span
                className="ml-2 text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Press och samarbeten
              </span>
            </span>
          </a>
        </li>
      </ul>

      <p
        className="mt-10 text-sm"
        style={{ color: "var(--text-tertiary)" }}
      >
        {/* TODO: Be ägaren bekräfta vilka mejladresser som är aktiva och om
            något bör bytas ut. Lägg till postadress + organisationsuppgifter
            när bolagsinfo är fastställd. */}
      </p>
    </article>
  );
}
