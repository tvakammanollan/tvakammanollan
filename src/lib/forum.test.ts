import { describe, it, expect } from "vitest";
import {
  slugifyTitle,
  threadPath,
  parseThreadParam,
  parsePage,
  pageCount,
  pageForIndex,
  stripMarkup,
  excerpt,
  buildQuote,
  forumErrorMessage,
  blockReasonMessage,
  displayAuthor,
  POSTS_PER_PAGE,
} from "./forum";

describe("slugifyTitle", () => {
  it("translittererar svenska tecken i stället för att strippa dem", () => {
    expect(slugifyTitle("Hur löser man KVA med rötter?")).toBe("hur-loser-man-kva-med-rotter");
    expect(slugifyTitle("Är ÅÄÖ svårt?")).toBe("ar-aao-svart");
  });

  it("klarar skiljetecken, emoji och dubbla mellanslag", () => {
    expect(slugifyTitle("XYZ  — uppgift 12!!! 🤯")).toBe("xyz-uppgift-12");
  });

  it("faller tillbaka på 'trad' när inget blir kvar", () => {
    expect(slugifyTitle("???")).toBe("trad");
    expect(slugifyTitle("日本語")).toBe("trad");
  });

  it("kapar långa rubriker utan att sluta på bindestreck", () => {
    const slug = slugifyTitle("a".repeat(30) + " " + "b".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("tråd-URL:er", () => {
  it("lägger id före slug så att en ändrad rubrik inte bryter länken", () => {
    expect(threadPath("kvantitativ", 482, "hur-loser-man-kva")).toBe(
      "/forum/kvantitativ/482-hur-loser-man-kva",
    );
  });

  it("läser tillbaka id och slug", () => {
    expect(parseThreadParam("482-hur-loser-man-kva")).toEqual({
      id: 482,
      slug: "hur-loser-man-kva",
    });
    expect(parseThreadParam("482")).toEqual({ id: 482, slug: "" });
  });

  it("avvisar skräp", () => {
    expect(parseThreadParam("abc")).toBeNull();
    expect(parseThreadParam("-1-x")).toBeNull();
    expect(parseThreadParam("0-x")).toBeNull();
    expect(parseThreadParam("")).toBeNull();
  });
});

describe("sidnumrering", () => {
  it("normaliserar ?sida=", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-3")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("2")).toBe(2);
    expect(parsePage(2.9)).toBe(2);
  });

  it("räknar sidor och placerar inlägg rätt", () => {
    expect(pageCount(0, POSTS_PER_PAGE)).toBe(1);
    expect(pageCount(30, 30)).toBe(1);
    expect(pageCount(31, 30)).toBe(2);
    expect(pageForIndex(0)).toBe(1);
    expect(pageForIndex(29)).toBe(1);
    expect(pageForIndex(30)).toBe(2);
  });
});

describe("stripMarkup och excerpt", () => {
  it("plockar bort markdown-brus", () => {
    expect(stripMarkup("**fet** och *kursiv* och `kod`")).toBe("fet och kursiv och kod");
    expect(stripMarkup("> citat\n\ntext")).toBe("citat text");
    expect(stripMarkup("- ett\n- två")).toBe("ett två");
    expect(stripMarkup("Svaret är $x^2$")).toBe("Svaret är x^2");
    expect(stripMarkup("före\n```\nkod\n```\nefter")).toBe("före efter");
  });

  it("bryter utdrag på ordgräns", () => {
    const long = "Detta är en ganska lång mening som behöver kortas ned någonstans i mitten.";
    const short = excerpt(long, 30);
    expect(short.endsWith("…")).toBe(true);
    expect(short.length).toBeLessThanOrEqual(31);
    expect(short).not.toContain("  ");
  });

  it("lämnar korta texter i fred", () => {
    expect(excerpt("Kort text")).toBe("Kort text");
  });
});

describe("buildQuote", () => {
  it("bygger ett citatblock som parsern känner igen", () => {
    expect(buildQuote("kalle", "Hej **där**")).toBe("> **kalle:** Hej där\n\n");
  });

  it("skriver Borttagen användare för avidentifierade konton", () => {
    expect(buildQuote("", "text")).toContain("Borttagen användare");
    expect(displayAuthor(null)).toBe("Borttagen användare");
    expect(displayAuthor("  ")).toBe("Borttagen användare");
    expect(displayAuthor("kalle")).toBe("kalle");
  });
});

describe("forumErrorMessage", () => {
  it("översätter våra felkoder", () => {
    expect(forumErrorMessage('... raise exception "FORUM_LOCKED" ...')).toContain("låst");
    expect(forumErrorMessage("FORUM_RATE_NEWUSER")).toContain("varannan minut");
  });

  it("läcker aldrig databastext för okända fel", () => {
    const raw = 'duplicate key value violates unique constraint "forum_threads_pkey"';
    expect(forumErrorMessage(raw)).toBe("Något gick fel. Försök igen om en stund.");
    expect(forumErrorMessage(null)).toBe("Något gick fel. Försök igen om en stund.");
  });
});

describe("blockReasonMessage", () => {
  it("ger null när inget hindrar", () => {
    expect(blockReasonMessage(null)).toBeNull();
  });

  it("säger vad som saknas", () => {
    expect(blockReasonMessage("gast")).toContain("Skapa ett konto");
    expect(blockReasonMessage("ej_bekraftad")).toContain("Bekräfta");
    expect(blockReasonMessage("avstangd")).toContain("avstängt");
  });
});
