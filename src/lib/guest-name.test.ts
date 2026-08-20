import { describe, expect, it } from "vitest";
import { displayName, guestName, isAutoGuestName, isGeneratedGuestName } from "./guest-name";
import { isRankable } from "./username";

describe("guestName", () => {
  it("är deterministiskt per frö", () => {
    expect(guestName("abc")).toBe(guestName("abc"));
  });

  it("ger ett namn ur listan", () => {
    expect(guestName("abc")).toMatch(/^Gäst \S+$/);
  });
});

describe("displayName", () => {
  // Hela gästnamnsfunktionen vilar på den här raden sedan namnet slutade
  // skrivas till databasen: triggern sätter user_<8 hex>, och det är BARA
  // här det blir "Gäst ekorre". Slutar den mappa syns id:t i navbaren, i
  // matchen och på resultatskärmen.
  it("gör om triggerns user_<hex> till ett lundnamn", () => {
    const id = "86b94273-1f0e-4a55-9d3c-9a1f6d0b2c11";
    expect(displayName("user_86b94273", id)).toBe(guestName(id));
    expect(displayName("user_86b94273", id)).toMatch(/^Gäst /);
  });

  it("lämnar valda namn i fred", () => {
    expect(displayName("lina_p", "id")).toBe("lina_p");
  });
});

describe("gästkonton rankas inte", () => {
  // Båda schemana måste kännas igen: nya konton får triggerns user_<hex>,
  // och de 15 rader som hann skrivas med "Gäst <ord>" ligger kvar.
  it("känner igen triggerns format", () => {
    expect(isAutoGuestName("user_86b94273")).toBe(true);
    expect(isRankable("user_86b94273")).toBe(false);
  });

  it("känner igen de kvarvarande Gäst-raderna", () => {
    expect(isGeneratedGuestName("Gäst ekorre")).toBe(true);
    expect(isRankable("Gäst ekorre")).toBe(false);
  });

  it("rör inte någon som valt ett namn som börjar på Gäst", () => {
    expect(isGeneratedGuestName("Gäst i huset")).toBe(false);
    expect(isRankable("Gäst i huset")).toBe(true);
  });
});
