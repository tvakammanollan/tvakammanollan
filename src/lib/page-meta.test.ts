import { describe, expect, it } from "vitest";
import { pageMeta, pageTitle, SITE_NAME } from "./page-meta";

describe("pageTitle", () => {
  it("varumärket står FÖRST, med vertikalstreck — inte tankstreck och inte mittpunkt", () => {
    // Regressionstest (2026-08-21): startsidan hade redan brand-först, alla
    // andra ~40 sidor hade brand-sist, och ett tidigare utkast använde
    // tankstreck ("Tvåkommanollan – Elorankade dueller") på ett par sidor.
    // En enda mall, på ett enda ställe, förhindrar att de glider isär igen.
    expect(pageTitle("Din statistik")).toBe("Tvåkommanollan | Din statistik");
    expect(pageTitle("Din statistik")).toContain(SITE_NAME);
    expect(pageTitle("Din statistik").startsWith(SITE_NAME)).toBe(true);
  });

  it("innehåller aldrig ett tankstreck eller en mittpunkt som varumärkes-separator", () => {
    const t = pageTitle("Exempel");
    expect(t).not.toMatch(/–|—/);
    expect(t.indexOf(SITE_NAME)).toBe(0);
  });
});

describe("pageMeta — titeln formateras automatiskt", () => {
  it("input.title är BARA sidans del — pageMeta lägger till varumärket", () => {
    const meta = pageMeta({ path: "/train", title: "Träna HP", description: "x" });
    const titleEntry = meta.find((m) => "title" in m);
    expect(titleEntry?.title).toBe("Tvåkommanollan | Träna HP");
  });

  it("og:title och twitter:title ärver den FORMATERADE titeln när ingen egen ogTitle satts", () => {
    const meta = pageMeta({ path: "/train", title: "Träna HP", description: "x" });
    const ogTitle = meta.find((m) => m.property === "og:title");
    const twitterTitle = meta.find((m) => m.name === "twitter:title");
    expect(ogTitle?.content).toBe("Tvåkommanollan | Träna HP");
    expect(twitterTitle?.content).toBe("Tvåkommanollan | Träna HP");
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
