import { describe, expect, it } from "vitest";
import {
  CHECKOUT_STEP_ORDER,
  checkoutStepIndex,
  elapsedSeconds,
  fieldList,
  filledLeadFields,
  furthestQuizPhase,
  leadFailureReason,
  QUIZ_PHASE_ORDER,
  quizPhaseStep,
  quizStage,
  type LeadField,
} from "./coaching-funnel";

describe("quizPhaseStep", () => {
  it("växer monotont genom hela ordningen", () => {
    const steg = QUIZ_PHASE_ORDER.map(quizPhaseStep);
    expect(steg).toEqual([0, 1, 2, 3, 4]);
  });

  it("ger 0 för ett okänt värde i stället för att kasta", () => {
    // En mätning får aldrig ta ner rutan den mäter.
    expect(quizPhaseStep("nonsens" as never)).toBe(0);
  });
});

describe("furthestQuizPhase", () => {
  it("behåller den fas som ligger längst fram, oavsett ordning på argumenten", () => {
    expect(furthestQuizPhase("q1", "form")).toBe("form");
    expect(furthestQuizPhase("form", "q1")).toBe("form");
  });

  it("backar inte när användaren går tillbaka ett steg", () => {
    // "Tillbaka"-knappen i steg 2 ska inte kunna skriva ner hur långt personen kom.
    expect(furthestQuizPhase("q2", "q1")).toBe("q2");
  });
});

describe("filledLeadFields", () => {
  it("räknar bara fält med riktigt innehåll", () => {
    expect(filledLeadFields({ name: "  ", phone: "070", email: "", message: undefined })).toEqual([
      "phone",
    ]);
  });

  it("behåller fältordningen, inte inmatningsordningen", () => {
    // Strängen i PostHog måste vara stabil, annars blir "email,phone" och
    // "phone,email" två olika grupper för samma beteende.
    expect(filledLeadFields({ message: "hej", name: "A", phone: "070" })).toEqual([
      "name",
      "phone",
      "message",
    ]);
  });

  it("returnerar tomt för ett orört formulär", () => {
    expect(filledLeadFields({})).toEqual([]);
  });
});

describe("quizStage", () => {
  it("lämnar faserna före formuläret orörda", () => {
    expect(quizStage("teaser", [])).toBe("teaser");
    expect(quizStage("q1", [])).toBe("q1");
    expect(quizStage("q2", [])).toBe("q2");
    expect(quizStage("done", [])).toBe("done");
  });

  it("skiljer orört, påbörjat och färdigt formulär", () => {
    expect(quizStage("form", [])).toBe("form_untouched");
    expect(quizStage("form", ["name"])).toBe("form_partial");
    expect(quizStage("form", ["name", "phone"])).toBe("form_ready");
  });

  it("kräver numret för form_ready, inte antalet ifyllda fält", () => {
    // Tre ifyllda fält utan telefonnummer är fortfarande ingen väg att ringa.
    const utanNummer: LeadField[] = ["name", "email", "message"];
    expect(quizStage("form", utanNummer)).toBe("form_partial");
    expect(quizStage("form", ["phone"])).toBe("form_ready");
  });
});

describe("leadFailureReason", () => {
  it("känner igen kvotfelet från assertRateLimit", () => {
    // Exakt strängen rate-limit.server.ts kastar.
    expect(leadFailureReason("För många försök. Försök igen om 12 minuter.")).toBe("rate_limit");
  });

  it("kallar allt annat för server", () => {
    expect(leadFailureReason("Något gick fel. Försök igen om en stund.")).toBe("server");
    expect(leadFailureReason(undefined)).toBe("server");
    expect(leadFailureReason("")).toBe("server");
  });
});

describe("checkoutStepIndex", () => {
  it("växer monotont och tål okända värden", () => {
    expect(CHECKOUT_STEP_ORDER.map(checkoutStepIndex)).toEqual([0, 1, 2]);
    expect(checkoutStepIndex("nonsens" as never)).toBe(0);
  });
});

describe("elapsedSeconds", () => {
  it("avrundar till närmaste sekund", () => {
    expect(elapsedSeconds(1_000, 4_400)).toBe(3);
    expect(elapsedSeconds(1_000, 4_600)).toBe(4);
  });

  it("klämmer bakåtgående klocka till noll", () => {
    // NTP-justering eller viloläge — en negativ varaktighet i en tratt är
    // värre än en avrundad nolla.
    expect(elapsedSeconds(10_000, 5_000)).toBe(0);
  });

  it("sätter inget tak", () => {
    expect(elapsedSeconds(0, 7_200_000)).toBe(7200);
  });
});

describe("fieldList", () => {
  it("skriver fälten i kanonisk ordning", () => {
    expect(fieldList(["message", "phone"])).toBe("phone,message");
    expect(fieldList([])).toBe("");
  });
});
