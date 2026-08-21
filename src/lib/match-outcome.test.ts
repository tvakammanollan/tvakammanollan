import { describe, expect, it } from "vitest";
import { decideWinnerSide, outcomeFor, scoresFor, type OutcomeMatch } from "./match-outcome";

const P1 = "11111111-1111-1111-1111-111111111111";
const P2 = "22222222-2222-2222-2222-222222222222";

function match(over: Partial<OutcomeMatch> = {}): OutcomeMatch {
  return {
    status: "finished",
    player1_id: P1,
    player2_id: P2,
    player1_score: 5,
    player2_score: 3,
    winner_id: P1,
    is_bot_match: false,
    player1_submitted_at: "2026-08-21T10:00:10.000Z",
    player2_submitted_at: "2026-08-21T10:00:20.000Z",
    ...over,
  };
}

describe("outcomeFor", () => {
  it("ger vinst åt vinnaren och förlust åt den andre — samma rad", () => {
    const m = match();
    expect(outcomeFor(P1, m)).toBe("win");
    expect(outcomeFor(P2, m)).toBe("loss");
  });

  it("lika poäng är ingen oavgjord match — den som lämnade in först vinner", () => {
    const m = match({ winner_id: null, player1_score: 4, player2_score: 4 });
    expect(outcomeFor(P1, m)).toBe("win");
    expect(outcomeFor(P2, m)).toBe("loss");

    const omvänt = match({
      winner_id: null,
      player1_score: 4,
      player2_score: 4,
      player1_submitted_at: "2026-08-21T10:00:30.000Z",
      player2_submitted_at: "2026-08-21T10:00:05.000Z",
    });
    expect(outcomeFor(P1, omvänt)).toBe("loss");
    expect(outcomeFor(P2, omvänt)).toBe("win");
  });

  it("säger 'vet inte än' innan matchen är färdigräknad — aldrig oavgjort", () => {
    // Buggen: sidan lästes direkt efter egen inlämning, innan motståndarens
    // poäng skrivits. 0 mot 0 såg ut som oavgjort, och båda kunde se sig som
    // vinnare i sin egen webbläsare.
    const halvskriven = match({
      status: "active",
      player1_score: 6,
      player2_score: null,
      winner_id: null,
    });
    expect(outcomeFor(P1, halvskriven)).toBeNull();
    expect(outcomeFor(P2, halvskriven)).toBeNull();

    const tom = match({
      status: "active",
      player1_score: null,
      player2_score: null,
      winner_id: null,
    });
    expect(outcomeFor(P1, tom)).toBeNull();
  });

  it("kan aldrig ge vinst åt båda", () => {
    for (const [s1, s2] of [
      [8, 0],
      [0, 8],
      [4, 4],
      [3, 5],
    ] as const) {
      const winner = s1 > s2 ? P1 : s1 < s2 ? P2 : null;
      // (4, 4) lämnas medvetet utan winner_id — då ska tiebreaken avgöra.
      const m = match({ player1_score: s1, player2_score: s2, winner_id: winner });
      const a = outcomeFor(P1, m);
      const b = outcomeFor(P2, m);
      expect([a, b].filter((o) => o === "win").length).toBeLessThanOrEqual(1);
      if (a === "win") expect(b).toBe("loss");
      if (a === "loss") expect(b).toBe("win");
      // Exakt en vinnare, alltid.
      expect([a, b].filter((o) => o === "win").length).toBe(1);
    }
  });

  it("litar på winner_id före poängen om raden är halvskriven", () => {
    // Servern har avgjort matchen; poängkolumnen har inte hunnit läsas om.
    const m = match({ winner_id: P2, player1_score: 5, player2_score: null });
    expect(outcomeFor(P1, m)).toBe("loss");
    expect(outcomeFor(P2, m)).toBe("win");
  });

  it("botmatch: spelaren vinner när botens poäng är lägre", () => {
    const m = match({ is_bot_match: true, player2_id: null, winner_id: P1 });
    expect(outcomeFor(P1, m)).toBe("win");
  });

  it("botmatch som avgjorts till spelarens nackdel ger förlust, inte oavgjort", () => {
    const m = match({
      is_bot_match: true,
      player2_id: null,
      player1_score: 2,
      player2_score: 6,
      winner_id: null, // winner_id sätts till player2_id, som är null för bot
    });
    expect(outcomeFor(P1, m)).toBe("loss");
  });
});

describe("scoresFor", () => {
  it("vänder poängen efter vem som frågar", () => {
    const m = match();
    expect(scoresFor(P1, m)).toEqual({ mine: 5, theirs: 3 });
    expect(scoresFor(P2, m)).toEqual({ mine: 3, theirs: 5 });
  });
});

describe("decideWinnerSide — oavgjort finns inte", () => {
  it("flest rätt vinner", () => {
    expect(decideWinnerSide(match({ player1_score: 6, player2_score: 3 }))).toBe(1);
    expect(decideWinnerSide(match({ player1_score: 3, player2_score: 6 }))).toBe(2);
  });

  it("vid lika poäng vinner den som lämnade in först", () => {
    expect(
      decideWinnerSide(
        match({
          player1_score: 5,
          player2_score: 5,
          player1_submitted_at: "2026-08-21T10:00:09.000Z",
          player2_submitted_at: "2026-08-21T10:00:10.000Z",
        }),
      ),
    ).toBe(1);
    expect(
      decideWinnerSide(
        match({
          player1_score: 5,
          player2_score: 5,
          player1_submitted_at: "2026-08-21T10:00:11.000Z",
          player2_submitted_at: "2026-08-21T10:00:10.000Z",
        }),
      ),
    ).toBe(2);
  });

  it("poängen går före tiden — snabbast vinner inte med färre rätt", () => {
    const m = match({
      player1_score: 2,
      player2_score: 7,
      player1_submitted_at: "2026-08-21T10:00:01.000Z",
      player2_submitted_at: "2026-08-21T10:04:59.000Z",
    });
    expect(decideWinnerSide(m)).toBe(2);
  });

  it("den som lämnat in slår den som aldrig gjorde det", () => {
    expect(
      decideWinnerSide(match({ player1_score: 0, player2_score: 0, player2_submitted_at: null })),
    ).toBe(1);
    expect(
      decideWinnerSide(match({ player1_score: 0, player2_score: 0, player1_submitted_at: null })),
    ).toBe(2);
  });

  it("saknas båda tiderna faller matchen till player1 — deterministiskt, aldrig oavgjort", () => {
    const m = match({
      player1_score: 4,
      player2_score: 4,
      player1_submitted_at: null,
      player2_submitted_at: null,
    });
    expect(decideWinnerSide(m)).toBe(1);
    // Samma svar varje gång: servern och båda klienterna räknar var för sig.
    expect(decideWinnerSide(m)).toBe(1);
  });

  it("ett oläsbart datum vinner aldrig tiebreaken", () => {
    const m = match({
      player1_score: 4,
      player2_score: 4,
      player1_submitted_at: "inte ett datum",
      player2_submitted_at: "2026-08-21T10:00:10.000Z",
    });
    expect(decideWinnerSide(m)).toBe(2);
  });

  it("ger alltid en sida, för varje kombination av poäng och tider", () => {
    const tider = [null, "2026-08-21T10:00:05.000Z", "2026-08-21T10:00:15.000Z"];
    for (const s1 of [0, 4, 8])
      for (const s2 of [0, 4, 8])
        for (const t1 of tider)
          for (const t2 of tider) {
            const sida = decideWinnerSide(
              match({
                player1_score: s1,
                player2_score: s2,
                player1_submitted_at: t1,
                player2_submitted_at: t2,
              }),
            );
            expect([1, 2]).toContain(sida);
          }
  });
});
