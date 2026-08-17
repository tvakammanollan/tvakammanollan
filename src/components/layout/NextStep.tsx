import { Link } from "@tanstack/react-router";
import { PrimaryCTA } from "@/components/layout/CTAButtons";
import { ArrowRight, type LucideIcon } from "lucide-react";

/* =====================================================================
   NEXT STEP — samma svar på "vad gör jag nu?" på varje slutskärm.

   Träningspasset, ord-passet och matchresultatet slutade alla i knappar
   som ledde tillbaka in i sig själva ("Träna igen" / "Ändra
   inställningar" / "Kör 10 till"), så enda vägen vidare var navbaren.
   Formen är densamma överallt: en primär upprepa-knapp, och under den
   vägarna ut. Lägger du till en ny slutskärm — använd den här.
   ===================================================================== */

export type Forward =
  | {
      label: string;
      icon: LucideIcon;
      to: string;
      params?: Record<string, string>;
      search?: Record<string, unknown>;
    }
  | { label: string; icon: LucideIcon; onClick: () => void };

/** Den primära handlingen är antingen en knapp eller en länk — aldrig båda. */
type Primary =
  | { primaryLabel: string; onPrimary: () => void; primaryTo?: never; primaryParams?: never }
  | {
      primaryLabel: string;
      primaryTo: string;
      primaryParams?: Record<string, string>;
      onPrimary?: never;
    };

export function NextStep({
  primaryIcon,
  primaryDisabled,
  forward,
  ...primary
}: Primary & {
  primaryIcon?: React.ReactNode;
  primaryDisabled?: boolean;
  forward: Forward[];
}) {
  return (
    <div className="mt-8">
      {primary.primaryTo ? (
        <PrimaryCTA
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          to={primary.primaryTo as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          params={primary.primaryParams as any}
          className="w-full"
          icon={primaryIcon}
        >
          {primary.primaryLabel}
        </PrimaryCTA>
      ) : (
        <PrimaryCTA
          onClick={primary.onPrimary}
          disabled={primaryDisabled}
          className="w-full"
          icon={primaryIcon}
        >
          {primary.primaryLabel}
        </PrimaryCTA>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {forward.map((f) => {
          const Icon = f.icon;
          const inner = (
            <>
              <Icon className="h-4 w-4" />
              {f.label}
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </>
          );
          const className =
            "group inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-[#e8e4da]";

          if ("to" in f) {
            return (
              <Link
                key={f.label}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                to={f.to as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                params={f.params as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                search={f.search as any}
                className={className}
              >
                {inner}
              </Link>
            );
          }
          return (
            <button key={f.label} type="button" onClick={f.onClick} className={className}>
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
