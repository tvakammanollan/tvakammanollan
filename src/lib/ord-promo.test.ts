import { describe, expect, it } from "vitest";
import {
  BACKOFF_COOLDOWN_MS,
  COOLDOWN_MS,
  EMPTY_ORD_PROMO_STATE as E,
  isOrdPromoPath,
  ordPromoDue,
  parseOrdPromoState,
  recordPromoShown,
} from "./ord-promo";

const t0 = new Date("2026-10-02T10:00:00Z");
const after = (ms: number) => new Date(t0.getTime() + ms);

describe("ordPromoDue", () => {
  it("väntar tre sidvisningar före första visningen", () => {
    expect(ordPromoDue({ ...E, pageviews: 2 })).toBe(false);
    expect(ordPromoDue({ ...E, pageviews: 3 })).toBe(true);
  });

  it("kräver både vila och fyra sidvisningar efter en visning", () => {
    const shown = recordPromoShown(E, t0);
    expect(ordPromoDue({ ...shown, pageviews: 10 }, after(COOLDOWN_MS - 1))).toBe(false);
    expect(ordPromoDue({ ...shown, pageviews: 3 }, after(COOLDOWN_MS))).toBe(false);
    expect(ordPromoDue({ ...shown, pageviews: 4 }, after(COOLDOWN_MS))).toBe(true);
  });

  it("vilar ett dygn efter fyra visningar utan klick", () => {
    let s = E;
    for (let i = 0; i < 4; i++) s = recordPromoShown(s, t0);
    s = { ...s, pageviews: 9 };
    expect(ordPromoDue(s, after(COOLDOWN_MS))).toBe(false);
    expect(ordPromoDue(s, after(BACKOFF_COOLDOWN_MS))).toBe(true);
  });

  it("tystnar efter köp", () => {
    expect(ordPromoDue({ ...E, pageviews: 99, stopped: true })).toBe(false);
  });

  it("läser ett oläsbart visningsdatum som nyss, inte som urgammalt", () => {
    expect(ordPromoDue({ ...E, shownCount: 1, pageviews: 9, lastShownAt: "skräp" })).toBe(false);
  });
});

describe("parseOrdPromoState", () => {
  it("klarar skräp och gammal version", () => {
    expect(parseOrdPromoState("{")).toEqual(E);
    expect(parseOrdPromoState('{"version":0}')).toEqual(E);
    expect(parseOrdPromoState(null)).toEqual(E);
  });
});

describe("isOrdPromoPath", () => {
  it("håller rutan borta från /ord men inte från ordlistan", () => {
    expect(isOrdPromoPath("/ord")).toBe(false);
    expect(isOrdPromoPath("/ordlista/frist")).toBe(true);
    expect(isOrdPromoPath("/")).toBe(true);
  });
});
