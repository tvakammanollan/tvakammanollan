import { describe, expect, it } from "vitest";
import { CALENDLY_ORIGIN, readCalendlyMessage } from "./calendly-embed";

const URI = "https://api.calendly.com/scheduled_events/AAA/invitees/BBB";

describe("readCalendlyMessage", () => {
  it("ignorerar allt som inte är ett Calendly-meddelande", () => {
    expect(readCalendlyMessage(null)).toBeNull();
    expect(readCalendlyMessage("calendly.event_scheduled")).toBeNull();
    expect(readCalendlyMessage({})).toBeNull();
    expect(readCalendlyMessage({ event: 42 })).toBeNull();
    // Andra script i sidan skickar postMessage hela tiden (Vites HMR bland annat).
    expect(readCalendlyMessage({ event: "vite:beforeUpdate" })).toBeNull();
  });

  it("läser de fyra dokumenterade händelserna", () => {
    expect(readCalendlyMessage({ event: "calendly.profile_page_viewed" })?.kind).toBe(
      "calendar_viewed",
    );
    expect(readCalendlyMessage({ event: "calendly.event_type_viewed" })?.kind).toBe(
      "calendar_viewed",
    );
    expect(readCalendlyMessage({ event: "calendly.date_and_time_selected" })?.kind).toBe(
      "time_selected",
    );
    expect(readCalendlyMessage({ event: "calendly.event_scheduled" })?.kind).toBe("scheduled");
  });

  it("plockar ut invitee-URI:n ur en bokning", () => {
    const msg = readCalendlyMessage({
      event: "calendly.event_scheduled",
      payload: {
        event: { uri: "https://api.calendly.com/scheduled_events/AAA" },
        invitee: { uri: URI },
      },
    });
    expect(msg).toEqual({ kind: "scheduled", inviteeUri: URI });
  });

  it("bokningen räknas även utan URI, men bär då ingen", () => {
    // Händer inte i praktiken. Skulle det hända är tiden ändå bokad hos
    // Calendly, och det ska gå att skilja från att inget hände alls.
    for (const payload of [undefined, {}, { invitee: {} }, { invitee: { uri: "" } }]) {
      expect(readCalendlyMessage({ event: "calendly.event_scheduled", payload })).toEqual({
        kind: "scheduled",
        inviteeUri: null,
      });
    }
  });

  it("visningshändelserna bär aldrig en URI vidare", () => {
    const msg = readCalendlyMessage({
      event: "calendly.event_type_viewed",
      payload: { invitee: { uri: URI } },
    });
    expect(msg).toEqual({ kind: "calendar_viewed", inviteeUri: null });
  });

  it("origin är Calendlys egen, inte vår", () => {
    expect(CALENDLY_ORIGIN).toBe("https://calendly.com");
  });
});
