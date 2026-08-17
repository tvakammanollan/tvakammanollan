import { describe, it, expect } from "vitest";
import { isAutoUsername, isRankable } from "./username";

describe("isAutoUsername", () => {
  it("känner igen namnet handle_new_user() sätter", () => {
    expect(isAutoUsername("user_a1b2c3d4")).toBe(true);
    expect(isAutoUsername("user_00000000")).toBe(true);
    expect(isAutoUsername(" user_deadbeef ")).toBe(true);
  });

  it("släpper igenom självvalda namn som börjar på user", () => {
    // Riktigt konto på listan i dag (#6 verbalt) — inget understreck.
    expect(isAutoUsername("user141350")).toBe(false);
    expect(isAutoUsername("username")).toBe(false);
    expect(isAutoUsername("user_niklas")).toBe(false); // inte hex
  });

  it("hanterar tomt och saknat", () => {
    expect(isAutoUsername("")).toBe(false);
    expect(isAutoUsername(null)).toBe(false);
    expect(isAutoUsername(undefined)).toBe(false);
  });
});

describe("isRankable", () => {
  it("rankar konton med eget namn", () => {
    expect(isRankable("inquam")).toBe(true);
    expect(isRankable("xing long")).toBe(true);
    expect(isRankable("user141350")).toBe(true);
  });

  it("rankar inte anonyma eller namnlösa konton", () => {
    expect(isRankable("user_a1b2c3d4")).toBe(false);
    expect(isRankable("")).toBe(false);
    expect(isRankable("   ")).toBe(false);
    expect(isRankable(null)).toBe(false);
  });
});
