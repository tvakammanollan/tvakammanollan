import { isOrdPlan, type OrdPlan } from "./ord-paywall";

/**
 * Köpet en utloggad besökare valde på ett betalkort, sparat över
 * inloggningen. Utan det landade den som klickade "Välj 6 månader" på
 * kassan, ombads skapa konto, och kom efter registreringen till startsidan
 * i stället för tillbaka. Login och onboarding läser den och skickar
 * vidare till `/kassa?plan=…`; `/kassa` tömmer den för en inloggad.
 *
 * localStorage och inte sessionStorage: bekräftelsemejlet öppnas ofta i en
 * ny flik. Ett val äldre än `MAX_AGE_MS` räknas inte, så ingen skickas till
 * en kassa de glömt att de klickat på.
 */
export const PENDING_PLAN_KEY = "tkn:kop-plan";
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function parsePendingPlan(raw: string | null, now: number): OrdPlan | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { plan?: unknown; at?: unknown };
    if (!isOrdPlan(v.plan) || typeof v.at !== "number") return null;
    if (now - v.at > MAX_AGE_MS || v.at > now + 60_000) return null;
    return v.plan;
  } catch {
    return null;
  }
}

export function rememberPendingPlan(plan: OrdPlan): void {
  try {
    localStorage.setItem(PENDING_PLAN_KEY, JSON.stringify({ plan, at: Date.now() }));
  } catch {
    /* utan lagring tappas valet, inget värre */
  }
}

export function readPendingPlan(): OrdPlan | null {
  try {
    return parsePendingPlan(localStorage.getItem(PENDING_PLAN_KEY), Date.now());
  } catch {
    return null;
  }
}

export function clearPendingPlan(): void {
  try {
    localStorage.removeItem(PENDING_PLAN_KEY);
  } catch {
    /* ignoreras */
  }
}
