import { describe, it, expect } from "vitest";
import { formatWaitTime } from "./wait-time";

describe("formatWaitTime", () => {
  it("skriver sekunder under en minut", () => {
    expect(formatWaitTime(1000)).toBe("1 sekund");
    expect(formatWaitTime(5000)).toBe("5 sekunder");
    expect(formatWaitTime(59_000)).toBe("59 sekunder");
  });

  it("skriver minuter i stället för hundratals sekunder", () => {
    expect(formatWaitTime(60_000)).toBe("1 minut");
    expect(formatWaitTime(90_000)).toBe("2 minuter");
    expect(formatWaitTime(600_000)).toBe("10 minuter");
  });

  it("skriver timmar i stället för tusentals sekunder", () => {
    // Det verkliga fallet som såg trasigt ut: 3501 sekunder kvar av en
    // timkvot. Blir "59 minuter" och inte "1 timme" — 3501 s är 58,4 minuter,
    // och att säga en timme hade varit att avrunda bort tid användaren
    // faktiskt slipper vänta.
    expect(formatWaitTime(3_501_000)).toBe("59 minuter");
    expect(formatWaitTime(3_600_000)).toBe("1 timme");
    expect(formatWaitTime(5_400_000)).toBe("2 timmar");
  });

  it("avrundar alltid uppåt, aldrig nedåt", () => {
    // 61 s får inte bli "1 minut" — då försöker användaren för tidigt, får
    // samma fel igen och slutar tro på siffran.
    expect(formatWaitTime(61_000)).toBe("2 minuter");
    expect(formatWaitTime(3_601_000)).toBe("2 timmar");
    expect(formatWaitTime(1500)).toBe("2 sekunder");
  });

  it("säger aldrig noll eller negativt", () => {
    expect(formatWaitTime(0)).toBe("1 sekund");
    expect(formatWaitTime(-5000)).toBe("1 sekund");
    expect(formatWaitTime(1)).toBe("1 sekund");
  });

  it("böjer entalsformerna rätt", () => {
    for (const [ms, want] of [
      [1000, "1 sekund"],
      [60_000, "1 minut"],
      [3_600_000, "1 timme"],
    ] as const) {
      expect(formatWaitTime(ms)).toBe(want);
    }
  });
});
