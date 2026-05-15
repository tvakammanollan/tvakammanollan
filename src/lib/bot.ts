// Client-safe bot helpers (pure functions, no server imports).

/** Realistic Swedish student names per ELO tier */
const BOT_PERSONAS: Record<string, string[]> = {
  elite:      ["Alexander W.", "Sofia L.", "Erik J.", "Amanda K.", "Filip H.", "Rebecka N."],
  master:     ["Pontus B.", "Viktor S.", "Linnea M.", "Oscar T.", "Julia A.", "Marcus E."],
  aspirant:   ["Emma P.", "Simon F.", "Maja L.", "Anton S.", "Hanna G.", "Kevin O."],
  challenger: ["Lina B.", "Tobias W.", "Elin C.", "Lucas R.", "Ida K.", "Hampus E."],
  beginner:   ["Sara J.", "William A.", "Klara S.", "Noah L.", "Vera H.", "Axel M."],
  junior:     ["Alva T.", "Elias B.", "Stella K.", "Hugo N.", "Nora P.", "Arvid S."],
};

function tierFor(elo: number): keyof typeof BOT_PERSONAS {
  if (elo >= 1600) return "elite";
  if (elo >= 1400) return "master";
  if (elo >= 1200) return "aspirant";
  if (elo >= 1000) return "challenger";
  if (elo >= 800)  return "beginner";
  return "junior";
}

/** Deterministic-but-varied name (same ELO rolls different name based on seed). */
export function getBotName(botElo: number, seed?: string): string {
  const pool = BOT_PERSONAS[tierFor(botElo)];
  if (!seed) return pool[Math.floor(Math.random() * pool.length)];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

export function botAccuracyForElo(elo: number, difficulty: number = 1): number {
  const base = 1 / (1 + Math.exp(-(elo - 1000) / 200));
  const penalty = (difficulty - 1) * 0.05;
  const jitter = (Math.random() - 0.5) * 0.1;
  return Math.max(0.1, Math.min(0.98, base - penalty + jitter));
}
