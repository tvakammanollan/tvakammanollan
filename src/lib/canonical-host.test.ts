import { afterEach, describe, expect, it } from "vitest";

import { canonicalRedirect, canonicalRedirectEnabled } from "./canonical-host";

const at = (href: string) => canonicalRedirect(new URL(href));

describe("canonicalRedirect", () => {
  it("flyttar gamla domänen till den nya", () => {
    expect(at("https://hpkampen.se/")).toBe("https://tvakommanollan.se/");
    expect(at("https://www.hpkampen.se/guider/ord")).toBe("https://tvakommanollan.se/guider/ord");
  });

  it("flyttar www till apex på nya domänen", () => {
    expect(at("https://www.tvakommanollan.se/leaderboard")).toBe(
      "https://tvakommanollan.se/leaderboard",
    );
  });

  it("behåller sökväg och frågesträng", () => {
    expect(at("https://hpkampen.se/forum/kvantitativ/482-kva?sida=3")).toBe(
      "https://tvakommanollan.se/forum/kvantitativ/482-kva?sida=3",
    );
  });

  it("lämnar /api/ i fred — Stripe följer inte 3xx", () => {
    expect(at("https://hpkampen.se/api/stripe/webhook")).toBeNull();
    expect(at("https://hpkampen.se/api/health")).toBeNull();
  });

  it("låter /apiary passera som vanlig sida, inte som /api", () => {
    expect(at("https://hpkampen.se/apiary")).toBe("https://tvakommanollan.se/apiary");
  });

  it("rör inte begäran som redan ligger på apex", () => {
    expect(at("https://tvakommanollan.se/train")).toBeNull();
  });

  it("rör inte lokal utveckling", () => {
    expect(at("http://localhost:3000/train")).toBeNull();
  });
});

/**
 * Grinden är det som skiljer "koden är utrullad" från "flytten är på". Utan
 * den tar en push ner hela sajten så länge målvärdnamnet saknar Worker-route:
 * 301:an gäller allt utom /api/, och Cloudflare svarar 522 på ett värdnamn
 * ingen route besvarar.
 */
describe("canonicalRedirectEnabled", () => {
  const original = process.env.CANONICAL_REDIRECT;
  afterEach(() => {
    if (original === undefined) delete process.env.CANONICAL_REDIRECT;
    else process.env.CANONICAL_REDIRECT = original;
  });

  it("är avstängd när variabeln saknas — säkert läge är default", () => {
    delete process.env.CANONICAL_REDIRECT;
    expect(canonicalRedirectEnabled()).toBe(false);
  });

  it("slås på av exakt 'on', oavsett skiftläge och blanktecken", () => {
    process.env.CANONICAL_REDIRECT = " ON ";
    expect(canonicalRedirectEnabled()).toBe(true);
  });

  it("räknar inte 'true', '1' eller 'off' som påslaget", () => {
    for (const v of ["true", "1", "off", "yes", ""]) {
      process.env.CANONICAL_REDIRECT = v;
      expect(canonicalRedirectEnabled(), v).toBe(false);
    }
  });
});
