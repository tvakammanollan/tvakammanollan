import { describe, expect, it } from "vitest";
import { outcomeFor, scoresFor, type OutcomeMatch } from "./match-outcome";

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
    ...over,
  };
}

describe("outcomeFor", () => {
  it("ger vinst åt vinnaren och förlust åt den andre — samma rad", () => {
    const m = match();
    expect(outcomeFor(P1, m)).toBe("win");
    expect(outcomeFor(P2, m)).toBe("loss");
  });

  it("ger oavgjort bara när matchen är klar utan vinnare och poängen är lika", () => {
    const m = match({ winner_id: null, player1_score: 4, player2_score: 4 });
    expect(outcomeFor(P1, m)).toBe("draw");
    expect(outcomeFor(P2, m)).toBe("draw");
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
      const m = match({ player1_score: s1, player2_score: s2, winner_id: winner });
      const a = outcomeFor(P1, m);
      const b = outcomeFor(P2, m);
      expect([a, b].filter((o) => o === "win").length).toBeLessThanOrEqual(1);
      if (a === "win") expect(b).toBe("loss");
      if (a === "loss") expect(b).toBe("win");
      if (a === "draw") expect(b).toBe("draw");
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
