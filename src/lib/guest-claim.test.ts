import { describe, expect, it } from "vitest";
import { GUEST_CLAIM_MAX_AGE_MS, decideGuestClaim, parseGuestClaim } from "./guest-claim";
import type { OrdPurchaseRow } from "./ord-paywall";

// Långt fram med flit: köp betalda före 2026-10-21 gäller för alltid
// (`TIME_LIMITED_FROM`), så ett köp som gått ut måste vara betalt efter det.
const NOW = Date.parse("2027-08-01T12:00:00Z");
const TOKEN = "eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ4In0.signatur-som-ar-lang-nog";

describe("parseGuestClaim", () => {
  it("läser en färsk token", () => {
    expect(parseGuestClaim(JSON.stringify({ token: TOKEN, at: NOW - 1000 }), NOW)).toBe(TOKEN);
    expect(parseGuestClaim(JSON.stringify({ token: TOKEN, at: NOW }), NOW)).toBe(TOKEN);
  });

  it("släpper en token äldre än en timme", () => {
    expect(
      parseGuestClaim(JSON.stringify({ token: TOKEN, at: NOW - GUEST_CLAIM_MAX_AGE_MS - 1 }), NOW),
    ).toBeNull();
  });

  it("tål skräp", () => {
    expect(parseGuestClaim(null, NOW)).toBeNull();
    expect(parseGuestClaim("inte json", NOW)).toBeNull();
    expect(parseGuestClaim(JSON.stringify({ at: NOW }), NOW)).toBeNull();
    expect(parseGuestClaim(JSON.stringify({ token: "kort", at: NOW }), NOW)).toBeNull();
    expect(parseGuestClaim(JSON.stringify({ token: "x".repeat(5000), at: NOW }), NOW)).toBeNull();
    expect(parseGuestClaim(JSON.stringify({ token: TOKEN }), NOW)).toBeNull();
    expect(parseGuestClaim(JSON.stringify({ token: TOKEN, at: "igår" }), NOW)).toBeNull();
    // En tidsstämpel i framtiden är en trasig klocka, inte en färsk token.
    expect(parseGuestClaim(JSON.stringify({ token: TOKEN, at: NOW + 3_600_000 }), NOW)).toBeNull();
  });
});

const dagar = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

/** Sexmånadersköp betalt för `n` dagar sedan. */
const engångsköp = (n: number): OrdPurchaseRow => ({ paid_at: dagar(n), access_months: 6 });

/** Prenumeration med periodslut om `n` dagar (negativt = passerat). */
const prenumeration = (n: number, status = "active"): OrdPurchaseRow => ({
  paid_at: dagar(30 - n),
  access_months: 1,
  stripe_subscription_id: "sub_test",
  subscription_status: status,
  current_period_end: new Date(NOW + n * 86_400_000).toISOString(),
  cancel_at_period_end: false,
});

describe("decideGuestClaim", () => {
  const base = { guestId: "gast", userId: "konto", now: NOW };

  it("flyttar ingenting när gästen själv blev kontot", () => {
    expect(
      decideGuestClaim({ ...base, userId: "gast", guestRow: engångsköp(1), userRow: null }),
    ).toBe("same");
  });

  it("flyttar ingenting när gästen inte har något köp", () => {
    expect(decideGuestClaim({ ...base, guestRow: null, userRow: null })).toBe("nothing");
  });

  it("flyttar ett köp som gäller till ett konto utan köp", () => {
    expect(decideGuestClaim({ ...base, guestRow: engångsköp(1), userRow: null })).toBe("move");
    expect(decideGuestClaim({ ...base, guestRow: prenumeration(20), userRow: null })).toBe("move");
  });

  it("flyttar över ett köp som gått ut på kontot", () => {
    expect(decideGuestClaim({ ...base, guestRow: engångsköp(1), userRow: engångsköp(200) })).toBe(
      "move",
    );
  });

  it("slår aldrig ihop två köp som gäller", () => {
    expect(decideGuestClaim({ ...base, guestRow: engångsköp(1), userRow: prenumeration(10) })).toBe(
      "conflict",
    );
    expect(decideGuestClaim({ ...base, guestRow: prenumeration(20), userRow: engångsköp(2) })).toBe(
      "conflict",
    );
  });

  it("låter ett gästköp som gått ut ligga kvar", () => {
    expect(decideGuestClaim({ ...base, guestRow: engångsköp(200), userRow: null })).toBe("nothing");
    expect(
      decideGuestClaim({ ...base, guestRow: prenumeration(-40, "canceled"), userRow: null }),
    ).toBe("nothing");
  });

  it("flyttar en levande prenumeration även när tillgången är pausad", () => {
    // Misslyckad dragning: tillgången har gått ut men Stripe försöker fortfarande.
    // Ligger den kvar på gästen kan ingen säga upp den.
    const pausad = prenumeration(25, "past_due");
    expect(decideGuestClaim({ ...base, guestRow: pausad, userRow: null })).toBe("move");
  });
});
