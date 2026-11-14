import { describe, expect, it } from "vitest";
import { pageMeta, pageTitle, SITE_NAME } from "./page-meta";

describe("pageTitle", () => {
  it("varumärket står SIST, med vertikalstreck — inte tankstreck och inte mittpunkt", () => {
    // Regressionstest (2026-08-21): startsidan hade redan brand-först, alla
    // andra ~40 sidor hade brand-sist, och ett tidigare utkast använde
    // tankstreck ("Tvåkommanollan – Elorankade dueller") på ett par sidor.
    // En enda mall, på ett enda ställe, förhindrar att de glider isär igen.
    // Ändrat 2026-11-14: träfflistan kapar från höger, så det som kapas ska
    // vara varumärket och inte sidans egen beskrivning.
    expect(pageTitle("Din statistik")).toBe("Din statistik | Tvåkommanollan");
    expect(pageTitle("Din statistik").endsWith(SITE_NAME)).toBe(true);
  });

  it("innehåller aldrig ett tankstreck eller en mittpunkt som varumärkes-separator", () => {
    const t = pageTitle("Exempel");
    expect(t).not.toMatch(/–|—/);
    expect(t.endsWith(` | ${SITE_NAME}`)).toBe(true);
  });

  it("släpper varumärket hellre än att gå över 60 tecken", () => {
    const lang = "Ska man köpa en bok, en kurs eller bara öva på gamla prov?";
    expect(pageTitle(lang)).toBe(lang);
    expect(pageTitle("Gamla högskoleprov 2012–2026 med facit")).toBe(
      "Gamla högskoleprov 2012–2026 med facit | Tvåkommanollan",
    );
  });
});

describe("pageMeta — titeln formateras automatiskt", () => {
  it("input.title är BARA sidans del — pageMeta lägger till varumärket", () => {
    const meta = pageMeta({ path: "/train", title: "Träna HP", description: "x" });
    const titleEntry = meta.find((m) => "title" in m);
    expect(titleEntry?.title).toBe("Träna HP | Tvåkommanollan");
  });

  it("og:title och twitter:title ärver den FORMATERADE titeln när ingen egen ogTitle satts", () => {
    const meta = pageMeta({ path: "/train", title: "Träna HP", description: "x" });
    const ogTitle = meta.find((m) => m.property === "og:title");
    const twitterTitle = meta.find((m) => m.name === "twitter:title");
    expect(ogTitle?.content).toBe("Träna HP | Tvåkommanollan");
    expect(twitterTitle?.content).toBe("Träna HP | Tvåkommanollan");
  });

  it("en egen ogTitle går igenom orörd — delningsrubriker följer inte samma mall med flit", () => {
    const meta = pageMeta({
      path: "/om",
      title: "Om oss",
      description: "x",
      ogTitle: "Varför Tvåkommanollan finns",
    });
    const ogTitle = meta.find((m) => m.property === "og:title");
    expect(ogTitle?.content).toBe("Varför Tvåkommanollan finns");
  });
});
