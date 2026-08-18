import { describe, expect, it } from "vitest";
import { coachingPriceLabel, coachingTermsLabel } from "./useCoachingOffer";
import type { CoachingOffer } from "@/lib/coaching.functions";

const bas: CoachingOffer = {
  available: true,
  amount: 35000,
  currency: "sek",
  interval: null,
  intervalCount: 1,
  schedulingEnabled: false,
  productName: "Studieupplägg",
};

describe("coachingTermsLabel", () => {
  it("lovar ingen bindningstid när priset är ett engångsköp", () => {
    expect(coachingTermsLabel(bas)).toBe("Engångsköp · Ingen bindningstid");
  });

  it("säger ingenting alls när priset är återkommande", () => {
    // Det här är hela poängen: reservvägen har en gång pekat på ett
    // månadspris, och då får raden inte påstå motsatsen.
    expect(coachingTermsLabel({ ...bas, interval: "month" })).toBeNull();
    expect(coachingTermsLabel({ ...bas, interval: "year" })).toBeNull();
  });

  it("säger ingenting när priset inte gick att läsa", () => {
    expect(coachingTermsLabel(null)).toBeNull();
    expect(coachingTermsLabel({ ...bas, available: false })).toBeNull();
    expect(coachingTermsLabel({ ...bas, amount: null })).toBeNull();
  });
});

describe("coachingPriceLabel", () => {
  // sv-SE-formatering sätter hårda mellanslag (U+00A0/U+202F) mellan belopp
  // och valuta, så en rak jämförelse mot vanliga mellanslag failar med två
  // strängar som ser identiska ut i utskriften.
  const norm = (s: string | null) => s?.replace(/[\u00a0\u202f]/g, " ") ?? null;

  it("engångspris utan periodangivelse", () => {
    expect(norm(coachingPriceLabel(bas))).toBe("350 kr");
  });

  it("återkommande pris får sin period", () => {
    expect(norm(coachingPriceLabel({ ...bas, interval: "month" }))).toBe("350 kr / månad");
    expect(norm(coachingPriceLabel({ ...bas, interval: "month", intervalCount: 3 }))).toBe(
      "350 kr / 3 månader",
    );
  });
});
