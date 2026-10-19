import { ClipboardCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FACIT, PART_LENGTH } from "@/lib/preliminart-facit";

/**
 * Rutan om preliminärt facit. Ren presentation: `CoachingPrompt` äger beslutet
 * att visa den, `facit-promo.ts` minnet av att den visats.
 */
export function FacitPromoDialog({
  open,
  onOpenChange,
  onGo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGo: () => void;
}) {
  const g = FACIT.troligGrans;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[440px]">
        <div
          className="px-6 pb-5 pt-8 text-center"
          style={{
            background:
              "linear-gradient(165deg, rgba(174,47,38,0.10) 0%, rgba(174,47,38,0.035) 48%, rgba(174,47,38,0) 100%)",
          }}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ClipboardCheck className="h-6 w-6" aria-hidden />
          </div>
          <p className="mt-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            {FACIT.label}
          </p>
          <DialogTitle
            className="mt-2 text-[22px] leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Preliminärt facit är ute
          </DialogTitle>
        </div>

        <div className="px-6 pb-6">
          <DialogDescription className="text-[14.5px] leading-relaxed text-white/70">
            Alla svar på provpass 1, 2, 4 och 5, och mina tankar om provet.
            {g && (
              <>
                {" "}
                Min gissning är att det krävs{" "}
                <strong className="text-[var(--cream)]">
                  {g.verbal === g.kvant
                    ? `${g.verbal}/${PART_LENGTH} på båda delarna`
                    : `${g.verbal}/${PART_LENGTH} verbalt och ${g.kvant}/${PART_LENGTH} kvantitativt`}
                </strong>{" "}
                för 2,0.
              </>
            )}
          </DialogDescription>

          <Button
            onClick={onGo}
            className="mt-6 w-full bg-primary py-6 text-[15px] text-on-brand hover:bg-primary-deep"
          >
            Se facit och räkna dina rätt
          </Button>
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
