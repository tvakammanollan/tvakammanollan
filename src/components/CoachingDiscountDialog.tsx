import { BadgePercent, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DiscountCodeChip } from "@/components/DiscountCodeChip";
import {
  useCoachingOffer,
  coachingPriceLabel,
  coachingDiscountedPriceLabel,
} from "@/hooks/useCoachingOffer";
import { DISCOUNT_PERCENT } from "@/lib/coaching-discount";

/* =====================================================================
   LOJALITETSRABATTEN — rutan som delar ut koden.

   Ren presentation: räkningen bor i `coaching-discount.ts` och beslutet att
   visa rutan i `CoachingPrompt`, som äger båda de automatiska rutorna och
   därför kan garantera att de aldrig krockar. Den här filen vet bara att den
   är öppen.

   Priset hämtas ur Stripe som överallt annars, och rabatten räknas ur det
   beloppet. Saknas priset (Stripe nere, eller inte konfigurerat) faller rutan
   tillbaka på koden och ett "läs mer" i stället för en siffra vi inte kan stå
   för — samma regel som kortet på startsidan följer.
   ===================================================================== */

export function CoachingDiscountDialog({
  open,
  onOpenChange,
  onBuy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onBuy: () => void;
}) {
  const { offer } = useCoachingOffer(open);
  const ordinarie = coachingPriceLabel(offer);
  const rabatterat = coachingDiscountedPriceLabel(offer);
  const tidsbokning = !!offer?.available && offer.schedulingEnabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[440px]">
        <div
          className="px-6 pb-5 pt-8 text-center"
          style={{
            background:
              "linear-gradient(165deg, rgba(174,47,38,0.14) 0%, rgba(174,47,38,0.05) 48%, rgba(174,47,38,0) 100%)",
          }}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <BadgePercent className="h-6 w-6" aria-hidden />
          </div>
          <p className="mt-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            {DISCOUNT_PERCENT} % rabatt
          </p>
          <DialogTitle
            className="mt-2 text-[22px] leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tack för att du kommer tillbaka.
          </DialogTitle>
        </div>

        <div className="px-6 pb-6">
          {/* Vänsterställd under en centrerad rubrik, av samma skäl som nudgen:
              brödtexten går på flera rader i mobil och blir en ojämn kil om den
              centreras. */}
          <DialogDescription className="text-[14.5px] leading-relaxed text-white/70">
            Det här är tredje gången du är här. Det räcker gott för att förtjäna ett bättre pris.
            Använd koden i kassan så får du {DISCOUNT_PERCENT} procent på det personliga
            studieupplägget.
          </DialogDescription>

          <div className="mt-5">
            <DiscountCodeChip source="popup" />
          </div>

          {rabatterat && ordinarie ? (
            <div className="mt-5 flex items-baseline justify-center gap-2.5">
              <span className="text-[15px] text-white/45 line-through">{ordinarie}</span>
              <span
                className="text-[26px] leading-none tracking-tight text-[var(--cream)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {rabatterat}
              </span>
            </div>
          ) : null}

          <ul className="mt-5 space-y-2.5 text-[14px] text-white/70">
            {[
              "Byggt efter din nivå och tiden du har kvar",
              "Av någon som själv skrivit 1,95 eller högre på provet",
              tidsbokning
                ? "Du väljer en tid som passar innan du betalar"
                : "Vi hör av oss inom 24 timmar efter köpet",
            ].map((rad) => (
              <li key={rad} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                <span>{rad}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={onBuy}
            className="mt-6 w-full bg-primary py-6 text-[15px] text-on-brand hover:bg-primary-deep"
          >
            {rabatterat ? "Kom igång" : "Läs mer om coachning"}
          </Button>

          {/* Ingen påhittad utgång. Koden ligger i Stripe utan utgångsdatum och
              utan tak på antal inlösen, och en uppdiktad deadline i den här
              rutan hade varit en osanning som dessutom syns direkt för den som
              provar koden dagen efter. */}
          <p className="mt-3 text-center text-[12.5px] text-white/50">
            Koden ligger kvar i kassan, så du hinner tänka.
          </p>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mx-auto mt-3 block text-[13px] text-white/50 underline-offset-4 transition hover:text-[var(--cream)] hover:underline"
          >
            Inte nu
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
