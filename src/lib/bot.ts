// Client-safe bot helpers (pure functions, no server imports).

/** Pool of bot personas per tier — randomized so the same ELO doesn't always show the same name. */
const BOT_PERSONAS: Record<string, string[]> = {
  elite: ["HP-Bot Elite", "HP-Bot Maestro", "HP-Bot Champion", "HP-Bot Apex"],
  master: ["HP-Bot Mästare", "HP-Bot Veteran", "HP-Bot Tacto", "HP-Bot Strateg"],
  aspirant: ["HP-Bot Aspirant", "HP-Bot Lärare", "HP-Bot Tänkare", "HP-Bot Logiker"],
  challenger: ["HP-Bot Utmanare", "HP-Bot Rival", "HP-Bot Duellant", "HP-Bot Sparring"],
  beginner: ["HP-Bot Nybörjare", "HP-Bot Lärling", "HP-Bot Pilot", "HP-Bot Rookie"],
  junior: ["HP-Bot Junior", "HP-Bot Pojke", "HP-Bot Spark", "HP-Bot Knatte"],
};

function tierFor(elo: number): keyof typeof BOT_PERSONAS {
  if (elo >= 1600) return "elite";
  if (elo >= 1400) return "master";
  if (elo >= 1200) return "aspirant";
  if (elo >= 1000) return "challenger";
  if (elo >= 800) return "beginner";
  return "junior";
}

/** Deterministic-but-varied bot name (same ELO can roll different name based on match id). */
export function getBotName(botElo: number, seed?: string): string {
  const pool = BOT_PERSONAS[tierFor(botElo)];
  if (!seed) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

/**
 * Per-question accuracy probability for a bot at given ELO.
 * Adds slight randomness so the bot doesn't always answer the same way.
 *
 *   1000 ELO → ~50% per question (50/50 reading)
 *   1400 ELO → ~75% accuracy
 *   1800 ELO → ~92% accuracy
 *
 * Question difficulty (1-3) reduces probability for harder Qs.
 */
export function botAccuracyForElo(
  elo: number,
  difficulty: number = 1,
): number {
  // Logistic curve calibrated against Elo
  const base = 1 / (1 + Math.exp(-(elo - 1000) / 200));
  // Difficulty penalty: 0/-0.05/-0.10 for diff 1/2/3
  const penalty = (difficulty - 1) * 0.05;
  // Small per-question jitter (±5%)
  const jitter = (Math.random() - 0.5) * 0.1;
  return Math.max(0.1, Math.min(0.98, base - penalty + jitter));
}
