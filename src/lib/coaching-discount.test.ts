import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DISCOUNT_CODE,
  DISCOUNT_PERCENT,
  DISCOUNT_STORAGE_KEY,
  DISCOUNT_VERSION,
  EMPTY_DISCOUNT_STATE,
  SESSIONS_BEFORE_DISCOUNT,
  SESSION_GAP_MS,
  discountDue,
  discountUnlocked,
  discountedAmount,
  markDiscountShown,
  parseDiscountState,
  readDiscountState,
  recordDiscountShown,
  recordSessionActivity,
  serializeDiscountState,
  stopDiscount,
  touchSession,
  type DiscountState,
} from "./coaching-discount";

const START = new Date("2026-08-30T10:00:00.000Z");

/** Simulerar `n` besök med full paus emellan, ett anrop per besök. */
function efterSessioner(n: number): DiscountState {
  let state = EMPTY_DISCOUNT_STATE;
  for (let i = 0; i < n; i++) {
    state = touchSession(state, new Date(START.getTime() + i * (SESSION_GAP_MS + 60_000)));
  }
  return state;
}

describe("touchSession", () => {
  it("räknar första besöket som session ett", () => {
    expect(touchSession(EMPTY_DISCOUNT_STATE, START).sessions).toBe(1);
  });

  it("räknar inte upp inom sessionsfönstret", () => {
    let state = touchSession(EMPTY_DISCOUNT_STATE, START);
    // Fyra sidvisningar med tio minuter emellan är ETT besök, inte fyra.
    for (let i = 1; i <= 4; i++) {
      state = touchSession(state, new Date(START.getTime() + i * 10 * 60_000));
    }
    expect(state.sessions).toBe(1);
  });

  it("räknar upp när pausen är längre än fönstret", () => {
    const first = touchSession(EMPTY_DISCOUNT_STATE, START);
    const later = touchSession(first, new Date(START.getTime() + SESSION_GAP_MS + 1));
    expect(later.sessions).toBe(2);
  });

  it("räknar exakt fönstret som samma session", () => {
    const first = touchSession(EMPTY_DISCOUNT_STATE, START);
    const later = touchSession(first, new Date(START.getTime() + SESSION_GAP_MS));
    expect(later.sessions).toBe(1);
  });

  it("läser ett oläsbart lastSeen som ny session, inte som pågående", () => {
    // En trasig post får dröja rabatten, aldrig tysta den för alltid.
    const trasig: DiscountState = { ...EMPTY_DISCOUNT_STATE, sessions: 1, lastSeen: "inte en tid" };
    expect(touchSession(trasig, START).sessions).toBe(2);
  });

  it("läser en framtida tidsstämpel som pågående session", () => {
    // Motsatsen hade låtit en skev klocka räkna upp sig fram till rabatten.
    const framtid: DiscountState = {
      ...EMPTY_DISCOUNT_STATE,
      sessions: 1,
      lastSeen: new Date(START.getTime() + 5 * 60 * 60_000).toISOString(),
    };
    expect(touchSession(framtid, START).sessions).toBe(1);
  });

  it("bokför aktiviteten även när sessionen inte räknas upp", () => {
    const first = touchSession(EMPTY_DISCOUNT_STATE, START);
    const senare = new Date(START.getTime() + 60_000);
    expect(touchSession(first, senare).lastSeen).toBe(senare.toISOString());
  });
});

describe("discountDue", () => {
  it("håller tyst under tröskeln", () => {
    for (let n = 1; n < SESSIONS_BEFORE_DISCOUNT; n++) {
      expect(discountDue(efterSessioner(n))).toBe(false);
    }
  });

  it("löser ut på tredje sessionen", () => {
    expect(SESSIONS_BEFORE_DISCOUNT).toBe(3);
    expect(discountDue(efterSessioner(SESSIONS_BEFORE_DISCOUNT))).toBe(true);
  });

  it("visas bara en gång", () => {
    const visad = markDiscountShown(efterSessioner(SESSIONS_BEFORE_DISCOUNT));
    expect(discountDue(visad)).toBe(false);
    // Fler besök väcker den inte igen.
    expect(discountDue(touchSession(visad, new Date(START.getTime() + 864_000_000)))).toBe(false);
  });

  it("tystnar efter ett köp", () => {
    expect(discountDue(stopDiscount(efterSessioner(SESSIONS_BEFORE_DISCOUNT)))).toBe(false);
  });
});

describe("discountUnlocked", () => {
  it("är falskt innan rutan visats", () => {
    expect(discountUnlocked(efterSessioner(SESSIONS_BEFORE_DISCOUNT))).toBe(false);
  });

  it("överlever att rutan stängts — koden ska gå att hitta igen", () => {
    expect(discountUnlocked(markDiscountShown(efterSessioner(3)))).toBe(true);
  });

  it("släcks av ett köp", () => {
    expect(discountUnlocked(stopDiscount(markDiscountShown(efterSessioner(3))))).toBe(false);
  });
});

describe("discountedAmount", () => {
  it("drar av procenten på beloppet från Stripe", () => {
    // 350 kr = 35 000 öre → 280 kr.
    expect(discountedAmount(35_000)).toBe(28_000);
  });

  it("avrundar som Stripe gör", () => {
    expect(discountedAmount(33_333)).toBe(33_333 - Math.round((33_333 * DISCOUNT_PERCENT) / 100));
  });

  it("ger null när priset inte gick att läsa", () => {
    expect(discountedAmount(null)).toBeNull();
    expect(discountedAmount(Number.NaN)).toBeNull();
  });
});

describe("parseDiscountState", () => {
  it("ger tomt läge på skräp", () => {
    expect(parseDiscountState(null)).toEqual(EMPTY_DISCOUNT_STATE);
    expect(parseDiscountState("{")).toEqual(EMPTY_DISCOUNT_STATE);
    expect(parseDiscountState('"en sträng"')).toEqual(EMPTY_DISCOUNT_STATE);
  });

  it("kastar en gammal version", () => {
    const gammal = JSON.stringify({ version: DISCOUNT_VERSION - 1, sessions: 9, shown: true });
    expect(parseDiscountState(gammal)).toEqual(EMPTY_DISCOUNT_STATE);
  });

  it("nollar orimliga tal i stället för att lita på dem", () => {
    const skräp = JSON.stringify({ version: DISCOUNT_VERSION, sessions: -4, shown: "ja" });
    const state = parseDiscountState(skräp);
    expect(state.sessions).toBe(0);
    expect(state.shown).toBe(false);
  });

  it("går att skriva och läsa tillbaka", () => {
    const state = markDiscountShown(efterSessioner(3));
    expect(parseDiscountState(serializeDiscountState(state))).toEqual(state);
  });
});

describe("koden", () => {
  it("står versalt, som i Stripe", () => {
    // Stripe matchar promotion codes skiftlägeskänsligt.
    expect(DISCOUNT_CODE).toBe(DISCOUNT_CODE.toUpperCase());
    expect(DISCOUNT_CODE).toBe("TVAKOMMANOLLAN");
  });

  it("speglar kupongens procent", () => {
    expect(DISCOUNT_PERCENT).toBe(20);
  });
});

describe("localStorage-sidan", () => {
  function fakeStorage(): Storage {
    const map = new Map<string, string>();
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(),
      key: (i: number) => [...map.keys()][i] ?? null,
      get length() {
        return map.size;
      },
    } as Storage;
  }

  let store: Storage;

  beforeEach(() => {
    store = fakeStorage();
    (globalThis as { window?: unknown }).window = { localStorage: store };
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("läser tillbaka det som skrivits", () => {
    const state = markDiscountShown(efterSessioner(3));
    store.setItem(DISCOUNT_STORAGE_KEY, serializeDiscountState(state));
    expect(readDiscountState()).toEqual(state);
  });

  it("ger tomt läge när nyckeln saknas", () => {
    expect(readDiscountState()).toEqual(EMPTY_DISCOUNT_STATE);
  });

  it("räknar upp sessionen och skriver ner den", () => {
    expect(recordSessionActivity().sessions).toBe(1);
    expect(parseDiscountState(store.getItem(DISCOUNT_STORAGE_KEY)).sessions).toBe(1);
    // Direkt efter varandra är det samma session.
    expect(recordSessionActivity().sessions).toBe(1);
  });

  it("bokför visningen så att den inte kommer igen", () => {
    store.setItem(DISCOUNT_STORAGE_KEY, serializeDiscountState(efterSessioner(3)));
    recordDiscountShown();
    expect(discountDue(readDiscountState())).toBe(false);
    expect(discountUnlocked(readDiscountState())).toBe(true);
  });

  it("överlever en lagring som vägrar skriva", () => {
    // Safari i privat läge kastar på setItem. Rabatten är inte viktigare än
    // att sidan renderas.
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      },
    };
    expect(() => recordSessionActivity()).not.toThrow();
    expect(readDiscountState()).toEqual(EMPTY_DISCOUNT_STATE);
  });
});
