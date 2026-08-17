import { Link, useRouterState } from "@tanstack/react-router";
import { Instagram, Music2, Youtube, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BugReportButton } from "@/components/BugReportButton";

const PRODUCT = [
  { label: "Träna", to: "/train" },
  { label: "Öva ord", to: "/ord" },
  { label: "Gamla prov", to: "/gamla-prov" },
  { label: "Poängräknare", to: "/hogskoleprovet-poangraknare" },
  { label: "Topplista", to: "/leaderboard" },
  { label: "Guider", to: "/guider" },
  { label: "Forum", to: "/forum" },
];

const COMPANY = [
  { label: "Provdatum", to: "/hogskoleprovet-datum" },
  { label: "Poäng & antagning", to: "/hogskoleprovet-poang" },
  { label: "Om oss", to: "/om" },
  { label: "Vanliga frågor", to: "/faq" },
  { label: "Kontakt", to: "/kontakt" },
];

const LEGAL = [
  { label: "Integritetspolicy", to: "/integritetspolicy" },
  { label: "Användarvillkor", to: "/villkor" },
  { label: "Forumregler", to: "/forum/regler" },
];

// Öva-sidor per delprov (transaktionell SEO + intern länkning sitewide)
const OVA = [
  { slug: "ord", label: "Öva ORD" },
  { slug: "mek", label: "Öva MEK" },
  { slug: "las", label: "Öva LÄS" },
  { slug: "elf", label: "Öva ELF" },
  { slug: "xyz", label: "Öva XYZ" },
  { slug: "kva", label: "Öva KVA" },
  { slug: "nog", label: "Öva NOG" },
  { slug: "dtk", label: "Öva DTK" },
];

// Filter out social platforms without real URLs — visa bara dem som
// faktiskt går någonstans. När ägaren har riktiga konton, fyll i href.
const SOCIAL = [
  { label: "Instagram", href: "", Icon: Instagram },
  { label: "TikTok", href: "", Icon: Music2 },
  { label: "YouTube", href: "", Icon: Youtube },
].filter((s) => s.href.length > 0);

// Hide footer in immersive contexts (in a match, the matchmaking queue, etc)
const HIDDEN_PREFIXES = ["/match/", "/matchmaking", "/result/", "/join/"];

export function Footer() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading } = useAuth();
  if (HIDDEN_PREFIXES.some((p) => path.startsWith(p))) return null;

  // Inloggad: 22 länkar under varje skärm är brus, inte navigering — den
  // stora footern är intern SEO-länkning för utloggade och crawlers. Under
  // SSR är `loading` sant och `user` null, så botar ser alltid full version.
  if (!loading && user) return <CompactFooter />;

  return (
    <footer
      className="relative"
      style={{
        background: "linear-gradient(180deg, transparent 0%, rgba(15,8,3,0.6) 30%, #0d0702 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <FooterCol title="Produkt" items={PRODUCT} />
          <FooterCol title="Företag" items={COMPANY} />
          <FooterCol title="Juridik" items={LEGAL} />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
              Hör av dig
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="mailto:info@hpkampen.se"
                  className="inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" style={{ color: "#f2a65a" }} />
                  info@hpkampen.se
                </a>
              </li>
            </ul>
            {SOCIAL.length > 0 && (
              <ul className="mt-4 flex gap-3">
                {SOCIAL.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      aria-label={label}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-white/75 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Öva per delprov — sitewide intern länkning */}
        <div className="mt-10 border-t border-white/8 pt-8">
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Öva per delprov
          </h4>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {OVA.map((o) => (
              <Link
                key={o.slug}
                to="/ova/$delprov"
                params={{ delprov: o.slug }}
                className="text-sm text-white/80 transition hover:text-white hover:underline"
              >
                {o.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} HP Kampen. Gratis. Alltid.
          </p>
          <p className="text-xs text-white/45">Byggt i Sverige för svenska HP-pluggare.</p>
        </div>
      </div>
    </footer>
  );
}

/* Inloggad footer — en rad. Guider och FAQ ligger här eftersom de togs
   bort ur mobilmenyn; bugg-rapporten flyttade hit från navbaren. */
function CompactFooter() {
  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <FooterMiniLink to="/guider">Guider</FooterMiniLink>
          <FooterMiniLink to="/faq">Vanliga frågor</FooterMiniLink>
          <FooterMiniLink to="/kontakt">Kontakt</FooterMiniLink>
          <FooterMiniLink to="/integritetspolicy">Integritetspolicy</FooterMiniLink>
        </nav>
        <div className="flex items-center gap-4">
          <BugReportButton variant="text" />
          <p className="text-xs text-white/45">© {new Date().getFullYear()} HP Kampen</p>
        </div>
      </div>
    </footer>
  );
}

function FooterMiniLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      className="text-sm text-white/60 transition hover:text-white hover:underline"
    >
      {children}
    </Link>
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
      <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">{title}</h4>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to}
              className="text-sm text-white/80 transition hover:text-white hover:underline"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
