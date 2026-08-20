import { describe, expect, it } from "vitest";
import { HP_DATES } from "./hp-dates";
import {
  HP_EVENT_IMAGES,
  hasRegistrationWindow,
  hpEventJsonLd,
  hpEvents,
  offerAvailability,
  registrationPeriodText,
  type HpExamDateWithWindow,
} from "./hp-event";

const HOST_2026: HpExamDateWithWindow = {
  date: "2026-10-18",
  label: "HP Höst 2026",
  session: "höst",
  registrationOpens: "2026-08-11",
  registrationCloses: "2026-08-18",
};

describe("hpEventJsonLd — Googles obligatoriska fält", () => {
  const e = hpEventJsonLd(HOST_2026, new Date("2026-08-20T10:00:00Z"));

  it("har name, startDate och location", () => {
    expect(e.name).toBe("Högskoleprovet – HP Höst 2026");
    expect(e.startDate).toBe("2026-10-18T08:00:00+02:00");
    expect(e.location).toMatchObject({ "@type": "Place" });
  });
});

describe("hpEventJsonLd — de fyra fält Search Console saknade 2026-08-20", () => {
  const e = hpEventJsonLd(HOST_2026, new Date("2026-08-20T10:00:00Z"));

  it("endDate ligger samma dag som startDate, men senare", () => {
    expect(e.endDate).toBe("2026-10-18T17:00:00+02:00");
    expect(Date.parse(e.endDate as string)).toBeGreaterThan(
      Date.parse(e.startDate as string),
    );
  });

  it("image är tre absoluta URL:er i olika bildformat", () => {
    const images = e.image as string[];
    expect(images).toHaveLength(3);
    expect(images).toEqual(HP_EVENT_IMAGES.map((p) => `https://tvakommanollan.se${p}`));
    for (const url of images) expect(url).toMatch(/^https:\/\/[^ ]+\.png$/);
  });

  it("performer är satt", () => {
    expect(e.performer).toMatchObject({ "@type": "Organization" });
  });

  it("offers har alla delfält Google rekommenderar", () => {
    const offer = e.offers as Record<string, unknown>;
    expect(offer["@type"]).toBe("Offer");
    expect(offer.url).toBe("https://www.hogskoleprov.nu/");
    // Priset ska vara ett rent tal som sträng — "550 kr" underkänns.
    expect(offer.price).toBe("550");
    expect(offer.price).toMatch(/^\d+$/);
    expect(offer.priceCurrency).toBe("SEK");
    expect(offer.availability).toMatch(/^https:\/\/schema\.org\//);
    expect(offer.validFrom).toBe("2026-08-11T08:00:00+02:00");
    expect(offer.validThrough).toBe("2026-08-18T23:59:00+02:00");
  });

  it("inget fält är tomt — ett tomt fält räknas som saknat", () => {
    for (const [key, value] of Object.entries(e)) {
      expect(value, key).toBeTruthy();
    }
  });
});

describe("offerAvailability", () => {
  it("PreOrder innan anmälan öppnar", () => {
    expect(offerAvailability(HOST_2026, new Date("2026-08-11T05:00:00Z"))).toBe(
      "https://schema.org/PreOrder",
    );
  });

  it("InStock under anmälningsperioden", () => {
    expect(offerAvailability(HOST_2026, new Date("2026-08-11T06:00:00Z"))).toBe(
      "https://schema.org/InStock",
    );
    expect(offerAvailability(HOST_2026, new Date("2026-08-18T21:58:00Z"))).toBe(
      "https://schema.org/InStock",
    );
  });

  it("SoldOut när anmälan stängt", () => {
    expect(offerAvailability(HOST_2026, new Date("2026-08-18T22:00:00Z"))).toBe(
      "https://schema.org/SoldOut",
    );
  });
});

describe("registrationPeriodText", () => {
  it("skriver ut månaden en gång när perioden ligger inom samma månad", () => {
    expect(registrationPeriodText(HOST_2026)).toBe("11–18 augusti 2026");
  });

  it("skriver ut båda månaderna över ett månadsskifte", () => {
    expect(
      registrationPeriodText({
        ...HOST_2026,
        registrationOpens: "2027-03-28",
        registrationCloses: "2027-04-04",
      }),
    ).toBe("28 mars–4 april 2027");
  });
});

describe("hpEvents", () => {
  it("beskrivningen bär provdag, anmälan och avgift", () => {
    const [first] = hpEvents(new Date("2026-08-20T10:00:00Z"));
    expect(first.description).toContain("söndag 18 oktober 2026");
    expect(first.description).toContain("11–18 augusti 2026");
    expect(first.description).toContain("550 kronor");
  });

  it("varje provtillfälle får en egen @id", () => {
    const ids = hpEvents().map((e) => e["@id"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("hoppar över provtillfällen utan publicerad anmälningsperiod", () => {
    expect(hpEvents()).toHaveLength(HP_DATES.filter(hasRegistrationWindow).length);
    expect(HP_DATES.every(hasRegistrationWindow)).toBe(true);
  });
});
