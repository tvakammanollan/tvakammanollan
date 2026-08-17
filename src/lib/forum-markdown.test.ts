import { describe, it, expect } from "vitest";
import { parseInline, parseBlocks, hasMath, type Inline, type Block } from "./forum-markdown";

/** Platta ut ett träd till text, för att slippa jämföra hela strukturer. */
function inlineText(nodes: Inline[]): string {
  return nodes
    .map((n) => {
      switch (n.kind) {
        case "text":
          return n.text;
        case "code":
        case "math":
          return n.text;
        case "link":
          return n.text;
        default:
          return inlineText(n.children);
      }
    })
    .join("");
}

describe("parseInline", () => {
  it("läser fet, kursiv och kod", () => {
    const nodes = parseInline("**fet** *kursiv* `kod`");
    expect(nodes.map((n) => n.kind)).toEqual(["bold", "text", "italic", "text", "code"]);
    expect(inlineText(nodes)).toBe("fet kursiv kod");
  });

  it("behandlar innehållet i kod som literalt", () => {
    const nodes = parseInline("`**inte fet**`");
    expect(nodes).toEqual([{ kind: "code", text: "**inte fet**" }]);
  });

  it("läser matte mellan dollartecken", () => {
    const nodes = parseInline("Svaret blir $\\frac{3}{4}$ enligt facit");
    expect(nodes[1]).toEqual({ kind: "math", text: "\\frac{3}{4}" });
  });

  it("autolänkar URL:er och lämnar meningens skiljetecken utanför", () => {
    const nodes = parseInline("Se https://hpkampen.se/gamla-prov.");
    const link = nodes.find((n) => n.kind === "link");
    expect(link).toEqual({
      kind: "link",
      href: "https://hpkampen.se/gamla-prov",
      text: "https://hpkampen.se/gamla-prov",
    });
    expect(inlineText(nodes)).toContain(".");
  });

  it("normaliserar www-länkar till https", () => {
    const nodes = parseInline("www.studera.nu");
    expect(nodes[0]).toMatchObject({ kind: "link", href: "https://www.studera.nu" });
  });

  it("lämnar ensamma stjärnor och dollartecken som text", () => {
    expect(parseInline("3 * 4 = 12")).toEqual([{ kind: "text", text: "3 * 4 = 12" }]);
    expect(parseInline("kostar 200 $")).toEqual([{ kind: "text", text: "kostar 200 $" }]);
  });

  it("nästlar kursiv inuti fet", () => {
    const nodes = parseInline("**fet *och kursiv* slut**");
    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe("bold");
    expect(inlineText(nodes)).toBe("fet och kursiv slut");
    const bold = nodes[0] as Extract<Inline, { kind: "bold" }>;
    expect(bold.children.some((c) => c.kind === "italic")).toBe(true);
  });

  it("läser ***både och*** som fet kursiv", () => {
    const nodes = parseInline("***viktigt***");
    expect(nodes).toHaveLength(1);
    const bold = nodes[0] as Extract<Inline, { kind: "bold" }>;
    expect(bold.kind).toBe("bold");
    expect(bold.children[0].kind).toBe("italic");
    expect(inlineText(nodes)).toBe("viktigt");
  });
});

describe("parseBlocks", () => {
  it("delar på blankrad", () => {
    const blocks = parseBlocks("ett\n\ntvå");
    expect(blocks.map((b) => b.kind)).toEqual(["paragraph", "paragraph"]);
  });

  it("läser kodblock utan att tolka innehållet", () => {
    const blocks = parseBlocks("före\n```\n**rå** text\n```\nefter");
    expect(blocks.map((b) => b.kind)).toEqual(["paragraph", "code", "paragraph"]);
    expect((blocks[1] as Extract<Block, { kind: "code" }>).text).toBe("**rå** text");
  });

  it("klarar ett kodblock som aldrig stängs", () => {
    const blocks = parseBlocks("```\nfoo");
    expect(blocks).toEqual([{ kind: "code", text: "foo" }]);
  });

  it("slår ihop citatrader till ett block", () => {
    const blocks = parseBlocks("> kalle skrev:\n> hej\n\nsvar");
    expect(blocks.map((b) => b.kind)).toEqual(["quote", "paragraph"]);
    const quote = blocks[0] as Extract<Block, { kind: "quote" }>;
    expect(quote.children).toHaveLength(1);
  });

  it("nästlar citat men slutar vid tredje nivån", () => {
    const blocks = parseBlocks("> > > > djupt");
    let node: Block | undefined = blocks[0];
    let depth = 0;
    while (node?.kind === "quote") {
      depth++;
      node = node.children[0];
    }
    expect(depth).toBe(3);
  });

  it("läser punkt- och nummerlistor", () => {
    const bullets = parseBlocks("- ett\n- två") as Extract<Block, { kind: "list" }>[];
    expect(bullets[0].ordered).toBe(false);
    expect(bullets[0].items).toHaveLength(2);

    const ordered = parseBlocks("1. ett\n2. två") as Extract<Block, { kind: "list" }>[];
    expect(ordered[0].ordered).toBe(true);
    expect(ordered[0].items).toHaveLength(2);
  });

  it("behåller radbrytningar inom ett stycke", () => {
    const blocks = parseBlocks("rad ett\nrad två");
    expect(blocks).toHaveLength(1);
    expect(inlineText((blocks[0] as Extract<Block, { kind: "paragraph" }>).children)).toBe(
      "rad ett\nrad två",
    );
  });

  it("ger tom lista för tom text", () => {
    expect(parseBlocks("")).toEqual([]);
    expect(parseBlocks("   \n\n  ")).toEqual([]);
  });

  it("klarar Windows-radbrytningar", () => {
    expect(parseBlocks("ett\r\n\r\ntvå").map((b) => b.kind)).toEqual(["paragraph", "paragraph"]);
  });
});

describe("hasMath", () => {
  it("känner igen matte, men inte enstaka dollartecken", () => {
    expect(hasMath("$x^2$")).toBe(true);
    expect(hasMath("kostar 200 $")).toBe(false);
    expect(hasMath("vanlig text")).toBe(false);
  });
});
