import { describe, it, expect } from "vitest";
import { ordSlug, ordLetter, isOrdLetter, ordLetterLabel, ORD_LETTER_OTHER } from "./ord-slug";

describe("ordSlug", () => {
  it("gör vanliga ord till sig själva", () => {
    expect(ordSlug("viskös")).toBe("viskös");
    expect(ordSlug("Deskriptiv")).toBe("deskriptiv");
  });

  it("gör mellanslag till bindestreck", () => {
    expect(ordSlug("a cappella")).toBe("a-cappella");
    expect(ordSlug("inte ha något till övers för")).toBe("inte-ha-något-till-övers-för");
  });

  // Affixen är hela skälet till att slugen inte trimmas: "-ism" är en ändelse
  // och "a-" ett förled, och trimmade blir de omöjliga att skilja från ord.
  it("behåller bindestreck i affix", () => {
    expect(ordSlug("-ism")).toBe("-ism");
    expect(ordSlug("a-")).toBe("a-");
  });

  // Translitterering hade slagit ihop de här paren till en enda sida.
  it("håller isär ord som bara skiljs av å, ä eller ö", () => {
    expect(ordSlug("får")).not.toBe(ordSlug("far"));
    expect(ordSlug("hår")).not.toBe(ordSlug("har"));
    expect(ordSlug("mål")).not.toBe(ordSlug("mal"));
  });

  it("behåller accenter i lånord", () => {
    expect(ordSlug("crêpe")).toBe("crêpe");
    expect(ordSlug("garçon")).toBe("garçon");
  });

  it("kastar skiljetecken", () => {
    expect(ordSlug("di-,diko-")).toBe("di-diko-");
    expect(ordSlug("graf,gram")).toBe("grafgram");
  });

  it("ger aldrig dubbla bindestreck", () => {
    expect(ordSlug("a  b")).toBe("a-b");
  });
});

describe("ordLetter", () => {
  it("sorterar in på första bokstaven", () => {
    expect(ordLetter("viskös")).toBe("v");
    expect(ordLetter("Öken")).toBe("ö");
  });

  it("lägger affix och siffror under övrigt", () => {
    expect(ordLetter("-ism")).toBe(ORD_LETTER_OTHER);
  });

  it("skiljer å, ä och ö från a och o", () => {
    expect(ordLetter("åbäkig")).toBe("å");
    expect(ordLetter("ärlig")).toBe("ä");
  });
});

describe("isOrdLetter", () => {
  it("släpper igenom alfabetet och övrigt", () => {
    expect(isOrdLetter("a")).toBe(true);
    expect(isOrdLetter("ö")).toBe(true);
    expect(isOrdLetter(ORD_LETTER_OTHER)).toBe(true);
  });

  it("avvisar allt annat", () => {
    expect(isOrdLetter("aa")).toBe(false);
    expect(isOrdLetter("A")).toBe(false);
    expect(isOrdLetter("")).toBe(false);
  });
});

describe("ordLetterLabel", () => {
  it("skriver ut registren", () => {
    expect(ordLetterLabel("a")).toBe("A");
    expect(ordLetterLabel(ORD_LETTER_OTHER)).toBe("Övrigt");
  });
});
