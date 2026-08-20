import { describe, it, expect } from "vitest";
import { MATCH_TOTAL_SECONDS, OPPONENT_GRACE_SECONDS, secondsLeftFrom } from "./match-clock";

describe("matchklockan", () => {
  it("räknar ned från full speltid", () => {
    const now = Date.now();
    expect(secondsLeftFrom(now, now)).toBe(MATCH_TOTAL_SECONDS);
    expect(secondsLeftFrom(now - 60_000, now)).toBe(MATCH_TOTAL_SECONDS - 60);
  });

  it("bottnar på noll i stället för att gå negativ", () => {
    const now = Date.now();
    expect(secondsLeftFrom(now - 10 * 60_000, now)).toBe(0);
  });

  it("håller sig till fem minuter — banderollen 'Fortsätt matchen' räknar på samma tal", () => {
    // Regressionen: ResumeMatchBanner hade en egen konstant på 8 minuter, så
    // den erbjöd återupptagning i tre minuter efter att tiden tagit slut. Den
    // som klickade landade på en match med noll sekunder kvar och fick den
    // inlämnad automatiskt i samma sekund.
    expect(MATCH_TOTAL_SECONDS).toBe(5 * 60);
  });

  it("ger motståndaren samma karens som servern kräver innan matchen får avslutas", () => {
    expect(OPPONENT_GRACE_SECONDS).toBe(30);
  });
});
