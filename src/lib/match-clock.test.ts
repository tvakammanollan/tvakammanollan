import { describe, it, expect } from "vitest";
import {
  MATCH_TOTAL_SECONDS,
  OPPONENT_GRACE_SECONDS,
  matchIsLive,
  resolveMatchAnchor,
  secondsLeftFrom,
} from "./match-clock";

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

describe("matchIsLive", () => {
  it("bara `active` är spelbart", () => {
    expect(matchIsLive("active")).toBe(true);
    expect(matchIsLive("waiting")).toBe(false);
    expect(matchIsLive("finished")).toBe(false);
    expect(matchIsLive(null)).toBe(false);
    expect(matchIsLive(undefined)).toBe(false);
  });
});

describe("resolveMatchAnchor", () => {
  const now = 1_700_000_000_000;

  it("serverns started_at går före allt annat", () => {
    const server = new Date(now - 30_000).toISOString();
    const r = resolveMatchAnchor({ startedAt: server, stored: String(now - 999_000), now });
    expect(r.anchor).toBe(now - 30_000);
    // Servern äger tiden — inget behöver sparas lokalt.
    expect(r.persist).toBe(false);
  });

  it("faller tillbaka på det lokala ankaret när servern saknar sitt", () => {
    const r = resolveMatchAnchor({ startedAt: null, stored: String(now - 60_000), now });
    expect(r).toEqual({ anchor: now - 60_000, persist: false });
  });

  it("ett gammalt men giltigt lokalt ankare behålls — tiden SKA kunna vara slut", () => {
    const gammalt = now - 10 * 60_000;
    const r = resolveMatchAnchor({ startedAt: null, stored: String(gammalt), now });
    expect(r.anchor).toBe(gammalt);
    expect(secondsLeftFrom(r.anchor, now)).toBe(0);
  });

  it("kastar ankare som är oläsbara eller ligger i framtiden — de läses som 'nyss'", () => {
    for (const trasigt of ["", "abc", "0", "-1", String(now + 60_000), null]) {
      const r = resolveMatchAnchor({ startedAt: null, stored: trasigt, now });
      expect(r).toEqual({ anchor: now, persist: true });
      expect(secondsLeftFrom(r.anchor, now)).toBe(MATCH_TOTAL_SECONDS);
    }
  });

  it("ett ogiltigt started_at tar inte matchen — det faller vidare, inte till noll", () => {
    const r = resolveMatchAnchor({ startedAt: "inte ett datum", stored: null, now });
    expect(r).toEqual({ anchor: now, persist: true });
  });
});

describe("secondsLeftFrom — felfall", () => {
  it("ett NaN-ankare ger full tid, aldrig noll", () => {
    // Noll här hade inte hamnat i en logg utan i en automatisk inlämning.
    expect(secondsLeftFrom(NaN)).toBe(MATCH_TOTAL_SECONDS);
  });

  it("ett ankare i framtiden ger aldrig mer än matchens längd", () => {
    const now = 1_700_000_000_000;
    expect(secondsLeftFrom(now + 600_000, now)).toBe(MATCH_TOTAL_SECONDS);
  });
});
