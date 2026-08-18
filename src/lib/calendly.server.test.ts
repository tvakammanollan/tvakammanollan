import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  buildSchedulingUrl,
  calendlyConfigured,
  calendlyEventUrl,
  formatCalendlyAnswers,
  isCalendlyInviteeUri,
} from "./calendly.server";

/**
 * Två saker pinnas här, och båda är sådana som inte ger något felmeddelande
 * när de går sönder:
 *
 * 1. URI-kontrollen. Invitee-URI:n kommer från webbläsaren och skickas vidare
 *    i en fetch med vårt Calendly-token i huvudet. Släpper mönstret igenom en
 *    främmande värd har vi läckt token, tyst.
 * 2. Bokningslänkens parametrar. Utan `embed_domain` skickar Calendly aldrig
 *    något postMessage, och utan `utm_content` går bokningen inte att knyta
 *    till rätt köp — i båda fallen ser iframen helt normal ut.
 */

const ETT_UUID = "0f9b1a2c-3d4e-4f50-a617-2b3c4d5e6f70";
const ANNAT_UUID = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const INVITEE = `https://api.calendly.com/scheduled_events/${ETT_UUID}/invitees/${ANNAT_UUID}`;

describe("isCalendlyInviteeUri", () => {
  it("accepterar en riktig invitee-URI", () => {
    expect(isCalendlyInviteeUri(INVITEE)).toBe(true);
    expect(isCalendlyInviteeUri(` ${INVITEE} `)).toBe(true);
  });

  it("avvisar allt som inte är exakt den resursen", () => {
    for (const dålig of [
      "https://elak.example/scheduled_events/x/invitees/y",
      // Värdnamnet ser rätt ut men är en subdomän hos någon annan.
      `https://api.calendly.com.elak.example/scheduled_events/${ETT_UUID}/invitees/${ANNAT_UUID}`,
      // Rätt värd, men en annan resurs — token ska inte kunna riktas var som helst.
      "https://api.calendly.com/users/me",
      `https://api.calendly.com/scheduled_events/${ETT_UUID}`,
      // Inloggningsuppgifter i URL:en, klassiskt sätt att förbi en värdkontroll.
      `https://api.calendly.com@elak.example/scheduled_events/${ETT_UUID}/invitees/${ANNAT_UUID}`,
      `http://api.calendly.com/scheduled_events/${ETT_UUID}/invitees/${ANNAT_UUID}`,
      "",
    ]) {
      expect(isCalendlyInviteeUri(dålig), dålig).toBe(false);
    }
  });
});

describe("calendlyEventUrl", () => {
  const original = { url: process.env.CALENDLY_EVENT_URL, token: process.env.CALENDLY_API_TOKEN };

  beforeEach(() => {
    delete process.env.CALENDLY_EVENT_URL;
    delete process.env.CALENDLY_API_TOKEN;
  });
  afterEach(() => {
    if (original.url === undefined) delete process.env.CALENDLY_EVENT_URL;
    else process.env.CALENDLY_EVENT_URL = original.url;
    if (original.token === undefined) delete process.env.CALENDLY_API_TOKEN;
    else process.env.CALENDLY_API_TOKEN = original.token;
  });

  it("är null när inget är satt", () => {
    expect(calendlyEventUrl()).toBeNull();
    expect(calendlyConfigured()).toBe(false);
  });

  it("tar bort en frågesträng som råkat följa med", () => {
    process.env.CALENDLY_EVENT_URL = "https://calendly.com/niklas/upplagg?month=2026-08";
    expect(calendlyEventUrl()).toBe("https://calendly.com/niklas/upplagg");
  });

  it("avvisar en länk som inte går till Calendly", () => {
    process.env.CALENDLY_EVENT_URL = "https://elak.example/niklas/upplagg";
    expect(calendlyEventUrl()).toBeNull();
  });

  it("kräver BÅDE länk och token — halvt konfigurerat är inte påslaget", () => {
    process.env.CALENDLY_EVENT_URL = "https://calendly.com/niklas/upplagg";
    expect(calendlyConfigured()).toBe(false);
    process.env.CALENDLY_API_TOKEN = "eyJ...";
    expect(calendlyConfigured()).toBe(true);
  });
});

describe("buildSchedulingUrl", () => {
  const url = new URL(
    buildSchedulingUrl({
      eventUrl: "https://calendly.com/niklas/upplagg",
      embedDomain: "tvakommanollan.se",
      requestId: ETT_UUID,
      name: "Anna Andersson",
      email: "anna@example.se",
    }),
  );

  it("bär köpets id som utm_content", () => {
    expect(url.searchParams.get("utm_content")).toBe(ETT_UUID);
  });

  it("sätter embed_domain — utan den kommer inget postMessage", () => {
    expect(url.searchParams.get("embed_domain")).toBe("tvakommanollan.se");
    expect(url.searchParams.get("embed_type")).toBe("Inline");
  });

  it("förifyller namn och mejl", () => {
    expect(url.searchParams.get("name")).toBe("Anna Andersson");
    expect(url.searchParams.get("email")).toBe("anna@example.se");
  });

  it("utelämnar förifyllning som saknas i stället för att skicka tomt", () => {
    const utan = new URL(
      buildSchedulingUrl({
        eventUrl: "https://calendly.com/niklas/upplagg",
        embedDomain: "tvakommanollan.se",
        requestId: ETT_UUID,
      }),
    );
    expect(utan.searchParams.has("name")).toBe(false);
    expect(utan.searchParams.has("email")).toBe(false);
  });
});

describe("formatCalendlyAnswers", () => {
  it("ger null utan svar", () => {
    expect(formatCalendlyAnswers([])).toBeNull();
  });

  it("lämnar ett ensamt svar utan rubrik", () => {
    expect(formatCalendlyAnswers([{ question: "Vad vill du fokusera på?", answer: "XYZ" }])).toBe(
      "XYZ",
    );
  });

  it("märker upp svaren när de är flera", () => {
    expect(
      formatCalendlyAnswers([
        { question: "Fokus?", answer: "XYZ" },
        { question: "Provdatum?", answer: "oktober" },
      ]),
    ).toBe("Fokus?: XYZ\nProvdatum?: oktober");
  });
});
