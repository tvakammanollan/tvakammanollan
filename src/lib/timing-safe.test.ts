import { describe, expect, it } from "vitest";
import { timingSafeEqualString } from "./timing-safe";

describe("timingSafeEqualString", () => {
  it("matchar identiska strängar", async () => {
    await expect(timingSafeEqualString("hemlis-123", "hemlis-123")).resolves.toBe(true);
  });

  it("skiljer på strängar som bara delar prefix", async () => {
    await expect(timingSafeEqualString("hemlis-123", "hemlis-124")).resolves.toBe(false);
    await expect(timingSafeEqualString("hemlis", "hemlis-123")).resolves.toBe(false);
  });

  it("låter aldrig tomt matcha", async () => {
    // Annars öppnar en osatt miljövariabel dörren för vem som helst.
    await expect(timingSafeEqualString("", "")).resolves.toBe(false);
    await expect(timingSafeEqualString("", "hemlis")).resolves.toBe(false);
    await expect(timingSafeEqualString("hemlis", "")).resolves.toBe(false);
  });
});
