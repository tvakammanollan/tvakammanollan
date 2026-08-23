import { Link } from "@tanstack/react-router";

/**
 * CTA högst upp på en delprovsguide, till motsvarande /ova/$delprov-sida.
 *
 * RelatedGuides (guider-meta.tsx) har redan en identisk banderoll längst ner
 * på varje guide — den här är en andra kopia högst upp, så att CTA:n
 * uppfyller "både högt och lågt på sidan" (se SEO-CHECKLIST.md) i stället för
 * att bara finnas i botten två gånger (train-länken och ova-banderollen).
 * Länkar till /ova/$delprov och inte rakt till /train eller /ord, eftersom
 * den sidan visar riktiga exempeluppgifter innan besökaren committar till en
 * hel övningssession.
 */
export function GuideTopCta({ delprov, code }: { delprov: string; code: string }) {
  return (
    <Link
      to="/ova/$delprov"
      params={{ delprov }}
      className="group mb-8 flex items-center justify-between gap-3 rounded-2xl border border-[#ae2f26]/25 bg-[#ae2f26]/[0.06] p-4 transition-colors hover:border-[#ae2f26]/50 hover:bg-[#ae2f26]/[0.1]"
    >
      <span className="text-sm font-semibold" style={{ color: "var(--cream)" }}>
        Öva riktiga {code}-frågor med facit
      </span>
      <span
        className="shrink-0 text-sm font-semibold transition-transform group-hover:translate-x-0.5"
        style={{ color: "var(--amber)" }}
      >
        Kom igång →
      </span>
    </Link>
  );
}
