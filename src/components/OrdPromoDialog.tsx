import { BookOpen, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FREE_ORD_LIMIT } from "@/lib/ord-paywall";
import { formatInt, formatMoney } from "@/lib/sv-format";

/**
 * Påminnelsen om Hela Ordlistan. Ren presentation: `CoachingPrompt` äger
 * beslutet att visa den, `ord-promo.ts` räkningen. Knappen går till /ord, där
 * kassan redan finns, så det finns fortfarande bara en väg in i Stripe.
 */
export function OrdPromoDialog({
  open,
  onOpenChange,
  onGo,
  answered,
  amount,
  currency,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGo: () => void;
  /** null = utloggad eller okänt. */
  answered: number | null;
  amount: number | null;
  currency: string;
}) {
  const price = amount !== null ? formatMoney(amount, currency) : null;
  const remaining = answered !== null ? Math.max(0, FREE_ORD_LIMIT - answered) : null;

  const title =
    remaining === 0
      ? "Du har klarat de gratis orden"
      : remaining !== null && remaining < FREE_ORD_LIMIT
        ? `${formatInt(remaining)} gratisord kvar`
        : "Orden är det som lyfter provet";

  const body =
    remaining === 0
      ? "Resten av listan väntar. Lås upp den en gång och öva obegränsat, för alltid."
      : "Ordförståelse är den delen av provet som går att plugga mest på. Med hela listan tränar du på över 10 000 riktiga ORD-frågor, med förklaring till varje ord.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[440px]">
        <div
          className="px-6 pb-5 pt-8 text-center"
          style={{
            background:
              "linear-gradient(165deg, rgba(47,107,60,0.12) 0%, rgba(47,107,60,0.04) 48%, rgba(47,107,60,0) 100%)",
          }}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <BookOpen className="h-6 w-6" aria-hidden />
          </div>
          <p className="mt-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-success">
            Hela ordlistan
          </p>
          <DialogTitle
            className="mt-2 text-[22px] leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </DialogTitle>
        </div>

        <div className="px-6 pb-6">
          <DialogDescription className="text-[14.5px] leading-relaxed text-white/70">
            {body}
          </DialogDescription>

          <ul className="mt-5 space-y-2.5 text-[14px] text-white/70">
            {[
              "Över 10 000 ord ur riktiga högskoleprov",
              "Repetition som tar de ord du missar igen",
              price
                ? `${price} en gång, ingen prenumeration`
                : "Ett engångsköp, ingen prenumeration",
            ].map((rad) => (
              <li key={rad} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                <span>{rad}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={onGo}
            className="mt-6 w-full bg-primary py-6 text-[15px] text-on-brand hover:bg-primary-deep"
          >
            {remaining === 0 ? "Lås upp ordlistan" : "Öva ord nu"}
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
