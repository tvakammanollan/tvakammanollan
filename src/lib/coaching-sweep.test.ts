import { describe, expect, it } from "vitest";
import {
  CANCELED_STATUS,
  CANCEL_MESSAGES,
  ORPHAN_GRACE_MS,
  UNPAID_GRACE_MS,
  decideBooking,
  planSweep,
  type SweepBooking,
  type SweepRow,
} from "./coaching-sweep";
import { CHECKOUT_TTL_MIN } from "./coaching.server";

const NOW = new Date("2026-08-19T12:00:00Z");

function booking(minutesAgo: number, overrides: Partial<SweepBooking> = {}): SweepBooking {
  return {
    eventUri: "https://api.calendly.com/scheduled_events/aaaaaaaa-0000-0000-0000-000000000001",
    createdAt: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString(),
    startTime: "2026-08-20T14:00:00Z",
    ...overrides,
  };
}

const paid: SweepRow = { id: "rad-1", paidAt: "2026-08-19T11:00:00Z", status: "paid" };
const unpaid: SweepRow = { id: "rad-1", paidAt: null, status: "checkout" };

describe("decideBooking", () => {
  it("rör aldrig en betald tid, hur gammal den än är", () => {
    expect(decideBooking(booking(60 * 24), paid, NOW)).toEqual({
      action: "keep",
      reason: "betald",
    });
  });

  it("låter en obetald tid stå kvar under fristen", () => {
    expect(decideBooking(booking(30), unpaid, NOW)).toEqual({
      action: "keep",
      reason: "inom-frist",
    });
  });

  it("avbokar en obetald tid när fristen gått ut", () => {
    expect(decideBooking(booking(46), unpaid, NOW)).toEqual({
      action: "cancel",
      reason: "obetald",
    });
  });

  it("ger en bokning utan rad en kort respit — completeCoachingBooking hinner skriva", () => {
    expect(decideBooking(booking(2), null, NOW)).toEqual({ action: "keep", reason: "inom-frist" });
  });

  it("avbokar en bokning som aldrig passerat köpflödet", () => {
    expect(decideBooking(booking(20), null, NOW)).toEqual({
      action: "cancel",
      reason: "utanför-köpflödet",
    });
  });

  it("försöker igen när raden är märkt avbokad men tiden lever kvar", () => {
    // Avbokningen mot Calendly måste ha fallerat förra gången; att ge upp här
    // hade lämnat kvar precis den tid städaren finns för att ta bort.
    const rensad: SweepRow = { id: "rad-1", paidAt: null, status: CANCELED_STATUS };
    expect(decideBooking(booking(2), rensad, NOW)).toEqual({
      action: "cancel",
      reason: "obetald",
    });
  });

  it("tolkar ett oläsbart datum som nyss, inte som urgammalt", () => {
    // Motsatsen — att låta NaN bli "oändligt gammal" — hade avbokat allt på en
    // gång den dag Calendly ändrar sitt tidsformat.
    const trasig = booking(999, { createdAt: "inte-ett-datum" });
    expect(decideBooking(trasig, unpaid, NOW).action).toBe("keep");
    expect(decideBooking(trasig, null, NOW).action).toBe("keep");
  });
});

describe("fristerna", () => {
  it("obetald frist är längre än kassans livslängd", () => {
    // Annars går det att betala för en tid vi redan släppt, och köparen står
    // med en betald rad utan tid i kalendern.
    expect(UNPAID_GRACE_MS).toBeGreaterThan(CHECKOUT_TTL_MIN * 60 * 1000);
  });

  it("bokningar utan rad får kortare respit än obetalda", () => {
    expect(ORPHAN_GRACE_MS).toBeLessThan(UNPAID_GRACE_MS);
  });

  it("varje avbokningsskäl har en text som pekar tillbaka till sajten", () => {
    for (const text of Object.values(CANCEL_MESSAGES)) {
      expect(text).toContain("tvakommanollan.se");
    }
  });
});

describe("planSweep", () => {
  it("kopplar bokningar till rätt rad och lämnar resten som föräldralösa", () => {
    const a = booking(60, {
      eventUri: "https://api.calendly.com/scheduled_events/aaaaaaaa-0000-0000-0000-00000000000a",
    });
    const b = booking(60, {
      eventUri: "https://api.calendly.com/scheduled_events/aaaaaaaa-0000-0000-0000-00000000000b",
    });
    const plan = planSweep([a, b], new Map([[a.eventUri, paid]]), NOW);

    expect(plan.map((p) => p.verdict)).toEqual([
      { action: "keep", reason: "betald" },
      { action: "cancel", reason: "utanför-köpflödet" },
    ]);
    expect(plan[0].row?.id).toBe("rad-1");
    expect(plan[1].row).toBeNull();
  });

  it("ger tom plan för tom lista", () => {
    expect(planSweep([], new Map(), NOW)).toEqual([]);
  });
});
