import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { INDEXNOW_KEY, indexNowBody } from "./indexnow";

describe("indexnow", () => {
  it("nyckelfilen ligger publikt och innehåller nyckeln", () => {
    const file = join(__dirname, "../../public", `${INDEXNOW_KEY}.txt`);
    expect(readFileSync(file, "utf8").trim()).toBe(INDEXNOW_KEY);
  });

  it("samma nyckel står i skriptet", () => {
    const script = readFileSync(join(__dirname, "../../scripts/indexnow.mjs"), "utf8");
    expect(script).toContain(`"${INDEXNOW_KEY}"`);
  });

  it("skickar bara egna adresser och bara en gång var", () => {
    const body = indexNowBody([
      "https://tvakommanollan.se/forum/a",
      "https://tvakommanollan.se/forum/a",
      "https://hpkampen.se/forum/b",
      "https://ond.example/",
    ]);
    expect(body.urlList).toEqual(["https://tvakommanollan.se/forum/a"]);
    expect(body.keyLocation).toBe(`https://tvakommanollan.se/${INDEXNOW_KEY}.txt`);
  });
});
