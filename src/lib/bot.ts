// Client-safe bot helpers (pure functions, no server imports).
//
// Bot-namnen ska se ut som verkliga teenage-användarnamn — lowercase,
// blandade format (bara förnamn, namn+siffror, namn+bokstav, etc.) —
// inte "Firstname L." som skriker AI-genererad person. Deterministiskt
// per match-id så samma match alltid visar samma motståndarnamn.

const NAMES = [
  "alva",
  "alma",
  "alice",
  "anton",
  "anna",
  "arvid",
  "axel",
  "amanda",
  "david",
  "ebba",
  "elin",
  "elias",
  "ella",
  "elsa",
  "emma",
  "erik",
  "felix",
  "filip",
  "frida",
  "hampus",
  "hanna",
  "hugo",
  "ida",
  "ines",
  "isabella",
  "ivar",
  "joel",
  "julia",
  "kevin",
  "klara",
  "leo",
  "levi",
  "lina",
  "linnea",
  "lova",
  "lucas",
  "maja",
  "malin",
  "marcus",
  "matilda",
  "max",
  "mira",
  "molly",
  "nils",
  "noah",
  "nora",
  "olivia",
  "oscar",
  "pontus",
  "rebecka",
  "saga",
  "sara",
  "signe",
  "sofia",
  "stella",
  "tilde",
  "tilda",
  "tobias",
  "vera",
  "viggo",
  "viktor",
  "wilma",
  "william",
  "ylva",
  "alvin",
  "edvin",
  "elliot",
  "milo",
  "selma",
  "tuva",
];

// Deterministisk hash från seed+salt → tal i [0, max)
function seedRand(seed: string, salt: string, max: number): number {
  let h = 2166136261;
  const s = seed + ":" + salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h % max;
}

/**
 * Diskret randomiserat bot-namn. Format dras pseudo-slumpvis från seedet
 * så samma match alltid visar samma namn. 6 stilar med ungefär jämn
 * fördelning så feeden inte ser monoton ut.
 */
export function getBotName(_botElo: number, seed?: string): string {
  const s = seed ?? Math.random().toString(36).slice(2);
  const name = NAMES[seedRand(s, "name", NAMES.length)];
  const format = seedRand(s, "fmt", 6);

  // 2-siffrigt år-style suffix (oftast 90-talet+, för att passa gymnasieålder)
  const yy = () => {
    const n = seedRand(s, "yy", 30); // 0–29
    return n < 20 ? `0${n}`.slice(-2) : `${70 + (n - 20)}`; // 00–19 eller 70–79
  };
  const letter = "abcdefghijklmnoprstuvw"[seedRand(s, "ltr", 22)];
  const twoDigit = `${seedRand(s, "d2", 100)}`.padStart(2, "0");

  switch (format) {
    case 0:
      return name; // linnea
    case 1:
      return `${name}${yy()}`; // linnea98
    case 2:
      return `${name}_${twoDigit}`; // linnea_42
    case 3:
      return `${name}${letter}`; // linneap
    case 4:
      return `${name}.${letter}`; // linnea.k
    case 5:
      return `_${name}`; // _linnea
    default:
      return name;
  }
}

export function botAccuracyForElo(elo: number, difficulty: number = 1): number {
  const base = 1 / (1 + Math.exp(-(elo - 1000) / 200));
  const penalty = (difficulty - 1) * 0.05;
  const jitter = (Math.random() - 0.5) * 0.1;
  return Math.max(0.1, Math.min(0.98, base - penalty + jitter));
}
