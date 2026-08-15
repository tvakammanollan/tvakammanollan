import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyticsConfigured } from "@/lib/analytics";
import {
  CONSENT_CHANGED_EVENT,
  readConsent,
  writeConsent,
  type ConsentRecord,
} from "@/lib/consent";
import { formatRelativeTime } from "@/lib/sv-format";

/**
 * Låter besökaren se och ändra sitt analyssamtycke direkt i
 * integritetspolicyn. GDPR kräver att ett samtycke går att ta tillbaka lika
 * enkelt som det gavs — utan mejl, utan att leta.
 */
export function ConsentSettings() {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [mounted, setMounted] = useState(false);

  const sync = useCallback(() => setRecord(readConsent()), []);

  useEffect(() => {
    setMounted(true);
    sync();
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  // Som i bannern: bara valet skrivs här, <Analytics /> reagerar på det.
  const decide = (choice: "granted" | "denied") => {
    setRecord(writeConsent(choice));
  };

  // Under SSR vet vi inte vad som står i localStorage — rendera inget hellre
  // än fel, annars blir det hydration-mismatch.
  if (!mounted) return null;
  if (!analyticsConfigured()) return null;

  const granted = record?.choice === "granted";

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
      <p className="text-sm font-medium" style={{ color: "var(--cream)" }}>
        Ditt val just nu
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm">
        {granted ? (
          <Check className="size-4 shrink-0" style={{ color: "var(--teal)" }} aria-hidden="true" />
        ) : (
          <X className="size-4 shrink-0" aria-hidden="true" />
        )}
        <span>
          {granted ? "Analys är påslagen." : "Analys är avstängd — inget analysskript laddas."}
          {record ? ` Valt ${formatRelativeTime(record.decidedAt)}.` : " Du har inte svarat ännu."}
        </span>
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => decide("granted")}
          disabled={granted}
          className="border border-white/10 hover:bg-white/5"
        >
          Tillåt analys
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => decide("denied")}
          disabled={record?.choice === "denied"}
          className="border border-white/10 hover:bg-white/5"
        >
          Stäng av analys
        </Button>
      </div>
      <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
        Stänger du av slutar insamlingen direkt och den lokala identifieraren nollställs. Data som
        redan samlats in tas bort om du mejlar oss — se Dina rättigheter ovan.
      </p>
    </div>
  );
}
