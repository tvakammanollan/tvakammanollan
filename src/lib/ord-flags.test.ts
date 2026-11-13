import { describe, expect, it } from "vitest";
import {
  EMPTY_FLAGS,
  flagCounts,
  flagName,
  parseOrdFlags,
  pickFlagged,
  renameFlag,
  toggleFlag,
} from "./ord-flags";

describe("ord-flags", () => {
  it("kastar skräp ur lagringen", () => {
    expect(parseOrdFlags(null)).toEqual(EMPTY_FLAGS);
    expect(parseOrdFlags("{")).toEqual(EMPTY_FLAGS);
    const s = parseOrdFlags(
      JSON.stringify({ flags: { a: "rod", b: "lila", c: 3 }, names: { gul: "  svåra ", x: "y" } }),
    );
    expect(s.flags).toEqual({ a: "rod" });
    expect(s.names).toEqual({ gul: "svåra" });
  });

  it("ett ord har högst en flagga, och samma färg igen tar bort den", () => {
    let s = toggleFlag(EMPTY_FLAGS, "a", "bla");
    expect(s.flags.a).toBe("bla");
    s = toggleFlag(s, "a", "rod");
    expect(s.flags.a).toBe("rod");
    s = toggleFlag(s, "a", "rod");
    expect(s.flags.a).toBeUndefined();
    expect(EMPTY_FLAGS.flags).toEqual({});
  });

  it("namn faller tillbaka på färgen", () => {
    let s = renameFlag(EMPTY_FLAGS, "gron", "Skitlätta");
    expect(flagName(s, "gron")).toBe("Skitlätta");
    s = renameFlag(s, "gron", "   ");
    expect(flagName(s, "gron")).toBe("Grön");
    expect(flagName(renameFlag(s, "rod", "x".repeat(60)), "rod")).toHaveLength(24);
  });

  it("räknar och väljer per färg", () => {
    let s = EMPTY_FLAGS;
    for (const id of ["a", "b", "c"]) s = toggleFlag(s, id, "gul");
    s = toggleFlag(s, "d", "bla");
    expect(flagCounts(s)).toEqual({ bla: 1, gron: 0, rod: 0, gul: 3 });
    const val = pickFlagged(s, "gul", 2, () => 0);
    expect(val).toHaveLength(2);
    expect(val.every((id) => s.flags[id] === "gul")).toBe(true);
    expect(pickFlagged(s, "rod", 5)).toEqual([]);
  });
});
