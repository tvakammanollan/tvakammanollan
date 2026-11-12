import { describe, expect, it } from "vitest";
import { CREAM_FORMER, HEM_FORMER, formerForPath } from "./dekorformer";

describe("formerForPath", () => {
  it("ger zonens färg på zonens sidor", () => {
    expect(formerForPath("/gamla-prov")?.[0].farg).toBe("var(--sky)");
    expect(formerForPath("/leaderboard")?.[0].farg).toBe("var(--terracotta)");
    expect(formerForPath("/stats")?.[0].farg).toBe("var(--terracotta)");
    expect(formerForPath("/ordlista/skrodera")?.[0].farg).toBe("var(--lavender)");
  });

  it("ritar aldrig Plum som form: MEK får Lavender", () => {
    const former = formerForPath("/mek-ovning") ?? [];
    expect(former.length).toBeGreaterThan(0);
    expect(former.some((f) => f.farg.includes("plum"))).toBe(false);
    expect(former[0].farg).toBe("var(--lavender)");
  });

  it("ger cream wash utanför zonerna", () => {
    expect(formerForPath("/forum")).toBe(CREAM_FORMER);
    expect(formerForPath("/guider/xyz")).toBe(CREAM_FORMER);
    expect(formerForPath("/login")).toBe(CREAM_FORMER);
  });

  it("ger ordlistans färg på prissidan och i kassan, utan att de blir zon", () => {
    expect(formerForPath("/pris")?.[0].farg).toBe("var(--lavender)");
    expect(formerForPath("/kassa")?.[0].farg).toBe("var(--lavender)");
  });

  it("hoppar över startsidan, matchen, provpasset och admin", () => {
    expect(formerForPath("/")).toBeNull();
    expect(formerForPath("/match/abc")).toBeNull();
    expect(formerForPath("/gamla-prov/2024ht/3")).toBeNull();
    expect(formerForPath("/gamla-prov/2024ht")).not.toBeNull();
    expect(formerForPath("/admin")).toBeNull();
  });

  it("startsidans egna former har alla fyra ljusa färgerna och inte Plum", () => {
    const farger = HEM_FORMER.map((f) => f.farg);
    expect(farger).toEqual(
      expect.arrayContaining([
        "var(--terracotta)",
        "var(--sky)",
        "var(--lavender)",
        "var(--cream-wash)",
      ]),
    );
    expect(farger.some((f) => f.includes("plum"))).toBe(false);
  });
});
