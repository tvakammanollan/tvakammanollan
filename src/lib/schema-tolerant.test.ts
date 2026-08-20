import { describe, expect, it, vi } from "vitest";
import { isMissingColumn, missingColumnName, writeTolerant } from "./schema-tolerant.server";

const saknad = (kolumn: string, tabell = "matches") => ({
  code: "PGRST204",
  message: `Could not find the '${kolumn}' column of '${tabell}' in the schema cache`,
});

describe("isMissingColumn / missingColumnName", () => {
  it("känner igen PGRST204 och plockar ut kolumnnamnet", () => {
    expect(isMissingColumn(saknad("started_at"))).toBe(true);
    expect(missingColumnName(saknad("started_at"))).toBe("started_at");
  });

  it("andra fel är inte saknade kolumner", () => {
    expect(isMissingColumn({ code: "23505", message: "duplicate key" })).toBe(false);
    expect(isMissingColumn(null)).toBe(false);
    expect(missingColumnName({ code: "23505", message: "x" })).toBeNull();
  });
});

describe("writeTolerant", () => {
  it("skriver med allt när databasen är i fas", async () => {
    const run = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
    const res = await writeTolerant({ a: 1, started_at: "nu" }, ["started_at"], run);
    expect(res.error).toBeNull();
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toEqual({ a: 1, started_at: "nu" });
  });

  it("gör om skrivningen utan kolumnen som saknas", async () => {
    // Det här är fallet som annars tar ner hela flödet: en botmatch gick inte
    // att starta alls när matches.started_at fanns i koden men inte i databasen.
    const run = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: saknad("started_at") })
      .mockResolvedValueOnce({ data: { id: 1 }, error: null });
    const res = await writeTolerant({ a: 1, started_at: "nu" }, ["started_at"], run);
    expect(res.error).toBeNull();
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[1][0]).toEqual({ a: 1 });
  });

  it("plockar bort flera valfria kolumner, en i taget", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: saknad("email", "coaching_leads") })
      .mockResolvedValueOnce({ data: null, error: saknad("message", "coaching_leads") })
      .mockResolvedValueOnce({ data: { id: 1 }, error: null });
    const res = await writeTolerant(
      { phone: "+46", email: "a@b.se", message: "hej" },
      ["email", "message"],
      run,
    );
    expect(res.error).toBeNull();
    expect(run.mock.calls[2][0]).toEqual({ phone: "+46" });
  });

  it("en kolumn som INTE är valfri är ett riktigt fel", async () => {
    const run = vi.fn().mockResolvedValue({ data: null, error: saknad("felstavad") });
    const res = await writeTolerant({ felstavad: 1 }, ["started_at"], run);
    expect(res.error?.code).toBe("PGRST204");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("andra databasfel skickas vidare orörda", async () => {
    const fel = { code: "23505", message: "duplicate key" };
    const run = vi.fn().mockResolvedValue({ data: null, error: fel });
    const res = await writeTolerant({ a: 1 }, ["started_at"], run);
    expect(res.error).toBe(fel);
    expect(run).toHaveBeenCalledTimes(1);
  });
});
