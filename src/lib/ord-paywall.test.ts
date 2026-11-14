import { describe, expect, it } from "vitest";
import {
  ORD_PLANS,
  accessMonths,
  isOrdPlan,
  FREE_MEK_LIMIT,
  TIME_LIMITED_FROM,
  accessExpiresAt,
  purchaseIsActive,
  FREE_ORD_LIMIT,
  cappedBatchSize,
  mekAccess,
  ordAccess,
  planPriceLabel,
  purchaseAccess,
} from "./ord-paywall";

describe("mekAccess", () => {
  it("släpper igenom de första 40 MEK-uppgifterna och låser sedan", () => {
    expect(FREE_MEK_LIMIT).toBe(40);
    expect(mekAccess(39, false)).toMatchObject({ locked: false, freeRemaining: 1 });
    expect(mekAccess(40, false)).toMatchObject({ locked: true, freeRemaining: 0 });
  });

  it("ordlisteköpet låser upp MEK", () => {
    expect(mekAccess(300, true)).toMatchObject({ locked: false, freeRemaining: null });
  });

  it("kapar en MEK-batch vid gratisgränsen", () => {
    expect(cappedBatchSize(20, mekAccess(32, false))).toBe(8);
  });
});

describe("ordAccess", () => {
  it("släpper igenom de första 40 orden", () => {
    expect(ordAccess(0, false)).toMatchObject({ locked: false, freeRemaining: FREE_ORD_LIMIT });
    expect(ordAccess(39, false)).toMatchObject({ locked: false, freeRemaining: 1 });
  });

  it("låser vid det fyrtionde svaret", () => {
    expect(ordAccess(40, false)).toMatchObject({ locked: true, freeRemaining: 0 });
    expect(ordAccess(500, false).locked).toBe(true);
  });

  it("låser aldrig upp den som köpt", () => {
    expect(ordAccess(500, true)).toMatchObject({ locked: false, freeRemaining: null });
  });

  it("läser ett trasigt antal som noll, inte som obegränsat", () => {
    expect(ordAccess(Number.NaN, false).freeRemaining).toBe(FREE_ORD_LIMIT);
    expect(ordAccess(-5, false).freeRemaining).toBe(FREE_ORD_LIMIT);
  });
});

describe("cappedBatchSize", () => {
  it("kapar en batch vid gratisgränsen", () => {
    expect(cappedBatchSize(20, ordAccess(35, false))).toBe(5);
    expect(cappedBatchSize(20, ordAccess(40, false))).toBe(0);
  });

  it("rör inte batchen för den som köpt", () => {
    expect(cappedBatchSize(20, ordAccess(900, true))).toBe(20);
  });
});

describe("köpets giltighet", () => {
  it("gäller i sex månader när köpet inte bär någon längd", () => {
    expect(accessExpiresAt("2026-11-15T10:00:00Z")?.toISOString()).toBe("2027-05-15T10:00:00.000Z");
  });

  it("enmånadsköpet gäller en månad, sexmånadersköpet sex", () => {
    expect(ORD_PLANS["1m"].months).toBe(1);
    expect(ORD_PLANS["6m"].months).toBe(6);
    expect(accessExpiresAt("2026-11-15T10:00:00Z", 1)?.toISOString()).toBe(
      "2026-12-15T10:00:00.000Z",
    );
    const paid = "2026-11-15T10:00:00Z";
    expect(purchaseIsActive(paid, Date.parse("2026-12-15T09:59:59Z"), 1)).toBe(true);
    expect(purchaseIsActive(paid, Date.parse("2026-12-15T10:00:00Z"), 1)).toBe(false);
  });

  it("läser en okänd eller saknad längd som sex månader", () => {
    expect(accessMonths(null)).toBe(6);
    expect(accessMonths(undefined)).toBe(6);
    expect(accessMonths(3)).toBe(6);
    expect(accessMonths("1")).toBe(1);
    expect(accessMonths(1)).toBe(1);
  });

  it("känner bara igen de två planerna", () => {
    expect(isOrdPlan("1m")).toBe(true);
    expect(isOrdPlan("6m")).toBe(true);
    expect(isOrdPlan("12m")).toBe(false);
    expect(isOrdPlan("toString")).toBe(false);
  });

  it("släpper vid utgången, inte före", () => {
    const paid = "2026-11-15T10:00:00Z";
    expect(purchaseIsActive(paid, Date.parse("2027-05-15T09:59:59Z"))).toBe(true);
    expect(purchaseIsActive(paid, Date.parse("2027-05-15T10:00:00Z"))).toBe(false);
  });

  it("köp från tiden då kassan lovade 'för alltid' går aldrig ut", () => {
    expect(new Date(TIME_LIMITED_FROM).toISOString()).toBe("2026-10-21T00:00:00.000Z");
    expect(accessExpiresAt("2026-10-15T13:13:01Z")).toBeNull();
    expect(purchaseIsActive("2026-10-15T13:13:01Z", Date.parse("2030-01-01"))).toBe(true);
  });

  it("ett oläsbart datum låser inte ute någon", () => {
    expect(purchaseIsActive("inte ett datum", Date.parse("2030-01-01"))).toBe(true);
  });
});

describe("purchaseAccess", () => {
  const paid = "2026-11-15T10:00:00Z";
  const end = "2026-12-15T10:00:00Z";
  const before = Date.parse("2026-12-15T09:59:59Z");
  const after = Date.parse("2026-12-15T10:00:01Z");

  it("läser engångsköp precis som förut", () => {
    const a = purchaseAccess({ paid_at: paid, access_months: 6 }, before);
    expect(a).toMatchObject({ kind: "one_time", active: true, renews: false });
    expect(a.expiresAt?.toISOString()).toBe("2027-05-15T10:00:00.000Z");
    expect(purchaseAccess({ paid_at: paid, access_months: 1 }, after).active).toBe(false);
    expect(purchaseAccess({ paid_at: "2026-09-01T00:00:00Z" }, after)).toMatchObject({
      active: true,
      expiresAt: null,
    });
  });

  it("låter en aktiv prenumeration gälla till periodslutet och förnyas", () => {
    const row = {
      paid_at: paid,
      access_months: 1,
      stripe_subscription_id: "sub_1",
      subscription_status: "active",
      current_period_end: end,
      cancel_at_period_end: false,
    };
    expect(purchaseAccess(row, before)).toMatchObject({
      kind: "subscription",
      active: true,
      renews: true,
      cancelAtPeriodEnd: false,
    });
    expect(purchaseAccess(row, after)).toMatchObject({ active: false, renews: false });
  });

  it("räknar en uppsagd prenumeration som aktiv perioden ut men utan förnyelse", () => {
    const a = purchaseAccess(
      {
        paid_at: paid,
        stripe_subscription_id: "sub_1",
        subscription_status: "active",
        current_period_end: end,
        cancel_at_period_end: true,
      },
      before,
    );
    expect(a).toMatchObject({ active: true, renews: false, cancelAtPeriodEnd: true });
  });

  it("släpper igenom past_due till periodslutet", () => {
    const row = {
      paid_at: paid,
      stripe_subscription_id: "sub_1",
      subscription_status: "past_due",
      current_period_end: end,
    };
    expect(purchaseAccess(row, before)).toMatchObject({ active: true, renews: true });
    expect(purchaseAccess(row, after).active).toBe(false);
  });

  it("stänger en avslutad prenumeration när periodslutet passerats", () => {
    const row = {
      paid_at: paid,
      stripe_subscription_id: "sub_1",
      subscription_status: "canceled",
      current_period_end: end,
    };
    expect(purchaseAccess(row, before)).toMatchObject({ active: true, renews: false });
    expect(purchaseAccess(row, after).active).toBe(false);
  });

  it("faller tillbaka på paid_at plus en månad när periodslutet saknas", () => {
    const row = { paid_at: paid, access_months: 1, stripe_subscription_id: "sub_1" };
    expect(purchaseAccess(row, before).active).toBe(true);
    expect(purchaseAccess(row, after).active).toBe(false);
    // Även med access_months NULL: en prenumeration är aldrig sex månader.
    expect(purchaseAccess({ ...row, access_months: null }, after).active).toBe(false);
  });

  it("låser inte ute någon för ett oläsbart datum", () => {
    expect(
      purchaseAccess({ paid_at: "trasigt", stripe_subscription_id: "sub_1" }, after).active,
    ).toBe(true);
  });
});

describe("planPriceLabel", () => {
  it("skriver per månad för prenumerationen och längden för engångsköpet", () => {
    expect(planPriceLabel("1m", "149 kr")).toBe("149 kr per månad");
    expect(planPriceLabel("6m", "349 kr")).toBe("349 kr för 6 månader");
  });
});
