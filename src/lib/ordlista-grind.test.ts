import { describe, expect, it, vi } from "vitest";

// Serverklienten kräver miljövariabler; grinden är ren logik och behöver den inte.
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {} }));

const { ordIndexable } = await import("./ordlista.server");

describe("ordIndexable — kvalitetsgrinden för ordlisteuppslag", () => {
  it("släpper igenom ett ord med förklaring och HP-uppgift", () => {
    expect(ordIndexable("Smittsam sjukdom som sprids snabbt", 5)).toBe(true);
  });
  it("stoppar ett ord utan förklaring (soft 404 i Search Console)", () => {
    expect(ordIndexable("", 5)).toBe(false);
    expect(ordIndexable("   ", 5)).toBe(false);
  });
  it("stoppar ett ord utan riktig uppgift", () => {
    expect(ordIndexable("Smittsam sjukdom", 0)).toBe(false);
    expect(ordIndexable("Smittsam sjukdom", 1)).toBe(false);
  });
});
