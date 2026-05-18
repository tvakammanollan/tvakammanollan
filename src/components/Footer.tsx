import { Link, useRouterState } from "@tanstack/react-router";
import { Instagram, Music2, Youtube } from "lucide-react";

const PRODUCT = [
  { label: "Träna", to: "/train" },
  { label: "Öva ord", to: "/ord" },
  { label: "Gamla prov", to: "/gamla-prov" },
  { label: "Topplista", to: "/leaderboard" },
];

const COMPANY = [
  { label: "Om oss", to: "/om" },
  { label: "Kontakt", to: "/kontakt" },
];

const LEGAL = [
  { label: "Integritetspolicy", to: "/integritetspolicy" },
  { label: "Användarvillkor", to: "/villkor" },
];

// TODO: Be ägaren bekräfta sociala URLer. Lämnar # som platshållare så
// länkarna inte är synligt brutna i UI:t.
const SOCIAL = [
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "TikTok", href: "#", Icon: Music2 },
  { label: "YouTube", href: "#", Icon: Youtube },
];

// Hide footer in immersive contexts (in a match, the matchmaking queue, etc)
const HIDDEN_PREFIXES = ["/match/", "/matchmaking", "/result/", "/join/"];

export function Footer() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (HIDDEN_PREFIXES.some((p) => path.startsWith(p))) return null;

  return (
    <footer
      className="mt-24 border-t"
      style={{ borderColor: "var(--line)", background: "var(--navy)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <FooterCol title="Produkt" items={PRODUCT} />
          <FooterCol title="Företag" items={COMPANY} />
          <FooterCol title="Juridik" items={LEGAL} />
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Följ oss
            </h4>
            <ul className="mt-4 flex gap-3">
              {SOCIAL.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    rel="noopener noreferrer"
                    target={href === "#" ? undefined : "_blank"}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition hover:bg-white/5"
                    style={{ borderColor: "var(--line)", color: "var(--cream)" }}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-12 flex flex-col items-start justify-between gap-4 border-t pt-6 sm:flex-row sm:items-center"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            © {new Date().getFullYear()} HP Kampen. Gratis. Alltid.
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Byggt i Sverige för svenska HP-pluggare.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{ label: string; to: string }>;
}) {
  return (
    <div>
      <h4
        className="text-xs font-bold uppercase tracking-[0.18em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        {title}
      </h4>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to}
              className="text-sm transition hover:underline"
              style={{ color: "var(--cream)" }}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
