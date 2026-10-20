import { describe, expect, it } from "vitest";
import { questionOrigin } from "./question-origin";

describe("questionOrigin", () => {
  it("märker genererade uppgifter och läser ut källan", () => {
    expect(
      questionOrigin(
        ["tkn-genererad", "mek-v1"],
        "Wikipedia: Gikt (CC BY-SA 4.0) https://sv.wikipedia.org/wiki/Gikt",
      ),
    ).toEqual({
      label: "Tvåkommanollans egen uppgift",
      publisher: "Wikipedia",
      sourceTitle: "Gikt",
      sourceUrl: "https://sv.wikipedia.org/wiki/Gikt",
      license: "CC BY-SA 4.0",
    });
  });

  it("klarar titlar med parentes och mellanslag", () => {
    const o = questionOrigin(
      ["tkn-genererad"],
      "Wikipedia: Funktionalism (arkitektur) (CC BY-SA 4.0) https://sv.wikipedia.org/wiki/Funktionalism_(arkitektur)",
    );
    expect(o?.sourceTitle).toBe("Funktionalism (arkitektur)");
    expect(o?.sourceUrl).toBe("https://sv.wikipedia.org/wiki/Funktionalism_(arkitektur)");
  });

  it("läser källor utanför Wikipedia, utan licens", () => {
    const o = questionOrigin(
      ["tkn-genererad"],
      "1177: Influensa https://www.1177.se/sjukdomar--besvar/influensa/",
    );
    expect(o?.publisher).toBe("1177");
    expect(o?.sourceTitle).toBe("Influensa");
    expect(o?.license).toBeNull();
    expect(o?.sourceUrl).toBe("https://www.1177.se/sjukdomar--besvar/influensa/");
  });

  it("visar etiketten även när källraden saknas eller är okänd", () => {
    expect(questionOrigin(["tkn-genererad"], null)?.sourceUrl).toBeNull();
    expect(questionOrigin(["tkn-genererad"], "https://example.com/x")?.sourceUrl).toBeNull();
  });

  it("lämnar alla andra rader i fred", () => {
    expect(questionOrigin(["2005vt"], "https://hogskoleprovet.nu/x.pdf")).toBeNull();
    expect(questionOrigin(null, null)).toBeNull();
    expect(
      questionOrigin([], "Wikipedia: Gikt (CC BY-SA 4.0) https://sv.wikipedia.org/wiki/Gikt"),
    ).toBeNull();
  });
});
