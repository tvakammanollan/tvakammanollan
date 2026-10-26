import { describe, it, expect } from "vitest";
import { displayName, guestName, isAutoGuestName, isGeneratedGuestName } from "./guest-name";

describe("displayName", () => {
  it("lämnar valda namn i fred", () => {
    expect(displayName("lina_p")).toBe("lina_p");
    expect(displayName("lina_p", "5e19eb20-1b62-4378-8d47-73fd31913125")).toBe("lina_p");
  });

  it("byter ut triggerns auto-namn mot ett läsbart", () => {
    expect(displayName("user_5e19eb20")).toBe("Gäst");
  });

  it("visar de gamla 'Gäst <ord>'-raderna som bara 'Gäst'", () => {
    // 15 rader skrevs så 18–20 augusti och ligger kvar i databasen.
    expect(displayName("Gäst ekorre")).toBe("Gäst");
    expect(displayName("Gäst rönnbär")).toBe("Gäst");
  });

  it("rör inte den som valt ett namn som börjar på Gäst", () => {
    expect(displayName("Gäst i huset")).toBe("Gäst i huset");
  });

  it("ger SAMMA namn med och utan id — annars spretar ytorna", () => {
    // Navbaren har profile.id, forumet och vänlistan har bara namnet. Skiljer
    // de sig åt heter samma konto olika saker på olika sidor.
    const medId = displayName("user_5e19eb20", "5e19eb20-1b62-4378-8d47-73fd31913125");
    const utanId = displayName("user_5e19eb20");
    expect(medId).toBe(utanId);
  });

  it("är stabilt över anrop", () => {
    expect(displayName("user_a1b2c3d4")).toBe(displayName("user_a1b2c3d4"));
  });

  it("hanterar tomt namn", () => {
    // Tom sträng = raderat konto (deleteAccount). Forumet har egen text för
    // det; här räcker en neutral fallback.
    expect(displayName("")).toBe("Gäst");
    expect(displayName(null)).toBe("Gäst");
    expect(displayName(undefined)).toBe("Gäst");
  });

  it("trimmar innan den bedömer", () => {
    expect(displayName("  user_5e19eb20  ")).toBe(displayName("user_5e19eb20"));
  });
});

describe("isAutoGuestName", () => {
  it("känner igen triggerns format", () => {
    expect(isAutoGuestName("user_5e19eb20")).toBe(true);
    expect(isAutoGuestName("user_ABCDEF12")).toBe(true);
  });

  it("släpper igenom självvalda namn", () => {
    expect(isAutoGuestName("user_niklas")).toBe(false); // inte hex
    expect(isAutoGuestName("lina_p")).toBe(false);
    expect(isAutoGuestName(null)).toBe(false);
  });
});

describe("isGeneratedGuestName", () => {
  it("täcker båda schemana", () => {
    expect(isGeneratedGuestName("user_5e19eb20")).toBe(true);
    // Det gamla schemat: raderna som skrevs 18–20 augusti.
    expect(isGeneratedGuestName("Gäst ekorre")).toBe(true);
  });

  it("rör inte den som valt ett namn som börjar på Gäst", () => {
    expect(isGeneratedGuestName("Gäst i huset")).toBe(false);
  });
});

describe("guestName är en visningshjälpare, inte en nyckel", () => {
  // Bakgrunden: namnet skickades en tid med i metadatan vid
  // signInAnonymously, så triggern skrev in det i users.username, som är
  // UNIQUE. Då fanns tjugo möjliga namn och gästläget dog för 75 % av
  // besökarna med ett 500 från auth. Sedan 2026-10-26 är namnet alltid
  // "Gäst", så det ÄR ett kollisionsfall av konstruktion. Det gör
  // skälet till att det aldrig får lagras ännu tydligare.
  it("är alltid detsamma, oavsett frö", () => {
    expect(guestName("abc")).toBe("Gäst");
    expect(guestName("något helt annat")).toBe("Gäst");
    expect(guestName()).toBe("Gäst");
  });
});

describe("triggerns reservnamn", () => {
  // Faller det korta namnet bort skriver triggern hela UUID:t. Känns det
  // inte igen visar UI:t ett id och topplistan rankar ett namnlöst konto.
  const helt = "user_5e19eb201b6243788d4773fd31913125";

  it("räknas som auto-namn", () => {
    expect(isAutoGuestName(helt)).toBe(true);
    expect(isGeneratedGuestName(helt)).toBe(true);
  });

  it("renderas som gäst, inte som id", () => {
    expect(displayName(helt)).toBe("Gäst");
  });
});
