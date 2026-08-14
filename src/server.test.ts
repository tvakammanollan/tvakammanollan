import { describe, it, expect } from "vitest";
import { normalizePathForStats } from "./server";

describe("normalizePathForStats", () => {
  it("räknar vanliga sidor", () => {
    expect(normalizePathForStats("/")).toBe("/");
    expect(normalizePathForStats("/leaderboard")).toBe("/leaderboard");
    expect(normalizePathForStats("/ova/ord")).toBe("/ova/ord");
  });

  it("normaliserar bort avslutande snedstreck", () => {
    expect(normalizePathForStats("/train/")).toBe("/train");
  });

  // Utan detta blir det en ny rad per match och tabellen växer obegränsat.
  describe("rörliga segment", () => {
    it("slår ihop match-, resultat- och rums-id", () => {
      expect(normalizePathForStats("/match/9f8b7c6d-1234-4abc-89ef-0123456789ab")).toBe(
        "/match/:id",
      );
      expect(normalizePathForStats("/result/9f8b7c6d-1234-4abc-89ef-0123456789ab")).toBe(
        "/result/:id",
      );
      expect(normalizePathForStats("/join/ABC123")).toBe("/join/:id");
    });

    it("behåller uppräkneliga segment som provterminer", () => {
      expect(normalizePathForStats("/gamla-prov/2026vt")).toBe("/gamla-prov/2026vt");
    });
  });

  describe("räknas inte", () => {
    it("assets och filer", () => {
      expect(normalizePathForStats("/assets/styles-abc123.css")).toBeNull();
      expect(normalizePathForStats("/og-image.png")).toBeNull();
      expect(normalizePathForStats("/sitemap.xml")).toBeNull();
    });

    it("api, serverfunktioner och maskin-endpoints", () => {
      expect(normalizePathForStats("/api/health")).toBeNull();
      expect(normalizePathForStats("/_serverFn/whatever")).toBeNull();
      expect(normalizePathForStats("/.well-known/oauth-protected-resource")).toBeNull();
    });

    it("orimligt långa sökvägar", () => {
      expect(normalizePathForStats("/" + "a".repeat(250))).toBeNull();
    });
  });
});
