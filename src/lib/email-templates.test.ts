import { describe, expect, it } from "vitest";
import {
  bugReportTemplate,
  coachingConfirmationTemplate,
  esc,
  leadNotificationTemplate,
  verifyEmailTemplate,
} from "./email-templates";

describe("esc", () => {
  it("stänger av HTML i data som kommer utifrån", () => {
    expect(esc('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });
});

describe("verifyEmailTemplate", () => {
  const mail = verifyEmailTemplate({
    url: "https://tvakommanollan.se/verifiera-epost?token=abc",
    username: "lina_p",
  });

  it("har både HTML och text", () => {
    expect(mail.html).toContain("<h1");
    expect(mail.text.length).toBeGreaterThan(40);
    expect(mail.text).not.toContain("<");
  });

  it("innehåller länken i båda delarna", () => {
    expect(mail.html).toContain("token=abc");
    expect(mail.text).toContain("token=abc");
  });

  it("säger uttryckligen att man redan är inloggad", () => {
    // Hela poängen med ändringen: verifieringen är en påminnelse, inte en vägg.
    expect(mail.text).toMatch(/redan inloggad/i);
  });

  it("escapar användarnamnet", () => {
    const elak = verifyEmailTemplate({ url: "https://x.se", username: "<b>hej" });
    expect(elak.html).toContain("&lt;b&gt;hej");
    expect(elak.html).not.toContain("<b>hej");
  });
});

describe("coachingConfirmationTemplate", () => {
  it("skiljer på bokad och obokad tid", () => {
    const bokad = coachingConfirmationTemplate({
      amountLabel: "350 kr",
      scheduledLabel: "torsdag 21 augusti 2026 kl. 17.00",
      receiptUrl: "https://tvakommanollan.se/coachning/tack",
    });
    expect(bokad.subject).toMatch(/bokad tid/i);
    expect(bokad.text).toContain("17.00");

    const obokad = coachingConfirmationTemplate({
      amountLabel: "350 kr",
      scheduledLabel: null,
      receiptUrl: "https://tvakommanollan.se/coachning/tack",
    });
    expect(obokad.subject).toMatch(/välj din tid/i);
    expect(obokad.text).toMatch(/välja en tid/i);
  });
});

describe("driftnotiser", () => {
  it("lead-mejlet bär numret och länken till admin", () => {
    const mail = leadNotificationTemplate({
      phone: "+46701234567",
      name: "Anna",
      answers: ["Försök: första gången"],
      source: "dashboard",
      message: null,
    });
    expect(mail.subject).toContain("Anna");
    expect(mail.text).toContain("+46701234567");
    expect(mail.text).toContain("/admin");
  });

  it("buggrapporten kortar rubriken men behåller hela texten", () => {
    const lang = "x".repeat(200);
    const mail = bugReportTemplate({ message: lang, page: "/ord", username: "n", email: null });
    expect(mail.subject.length).toBeLessThan(90);
    expect(mail.text).toContain(lang);
  });
});
