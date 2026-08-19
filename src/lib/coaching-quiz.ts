/**
 * Kvalificeringen bakom "Är studieupplägget något för dig?".
 *
 * Två frågor, och alla svarsvägar leder vidare. Det är avsiktligt: syftet är
 * inte att sålla bort någon utan att få igång ett samtal och att den som
 * lämnar sitt nummer redan har sagt högt vad problemet är. Att det alltid går
 * vidare är också varför copyn aldrig lovar mer än den kan hålla — texten
 * säger "det här går att jobba med", inte "du är utvald".
 *
 * Rekommendationen formuleras däremot ur svaren. En kanonisk text hade läst
 * som ett rullande band, och säljaren som ringer skulle inte veta något mer om
 * personen än numret.
 *
 * Ren modul med tester: den bestämmer vad en människa får läsa om sig själv,
 * och det ska gå att granska utan att starta appen.
 */

export type QuizStepId = "forsok" | "hinder";

export interface QuizOption {
  value: string;
  label: string;
  /** Kort mening som återanvänds i sammanfattningen. */
  insight: string;
}

export interface QuizStep {
  id: QuizStepId;
  question: string;
  options: QuizOption[];
}

export const QUIZ_STEPS: QuizStep[] = [
  {
    // Frågade tidigare "När skriver du provet?", vilket inte säger något:
    // högskoleprovet skrivs på ett fast datum och alla som svarar skriver
    // alltså samma dag. Antal försök skiljer däremot läsarna åt på riktigt,
    // och är det första en säljare vill veta.
    id: "forsok",
    question: "Har du skrivit provet förut?",
    options: [
      {
        value: "aldrig",
        label: "Nej, det blir första gången",
        insight: "Första gången går mest tid förlorad på att träna fel saker i fel ordning.",
      },
      {
        value: "en",
        label: "Ja, en gång",
        insight: "Har du skrivit en gång vet du redan var det tog emot, och det är mycket värt.",
      },
      {
        value: "flera",
        label: "Ja, flera gånger",
        insight: "Efter flera försök sitter problemet sällan i kunskapen, utan i upplägget.",
      },
    ],
  },
  {
    id: "hinder",
    question: "Vad är svårast just nu?",
    options: [
      {
        value: "plan",
        label: "Jag vet inte vad jag ska plugga",
        insight: "Att inte veta vad som står på tur är precis det ett upplägg löser.",
      },
      {
        value: "kvant",
        label: "Den kvantitativa delen",
        insight: "XYZ, KVA, NOG och DTK vinner olika mycket på att tränas var för sig.",
      },
      {
        value: "verbal",
        label: "Den verbala delen",
        insight: "ORD och LÄS svarar snabbt på rätt sorts träning. MEK och ELF tar längre tid.",
      },
      {
        value: "tid",
        label: "Att få det gjort över huvud taget",
        insight: "Det svåraste är sällan uppgifterna, utan att komma igång varje dag.",
      },
    ],
  },
];

export interface QuizAnswers {
  forsok?: string;
  hinder?: string;
}

export interface QuizOutcome {
  /** Rubriken i sammanfattningen. */
  headline: string;
  /** En till tre meningar, byggda ur svaren. */
  lines: string[];
}

function optionFor(step: QuizStep, value: string | undefined): QuizOption | undefined {
  return step.options.find((o) => o.value === value);
}

/**
 * Bygger sammanfattningen. Ofullständiga svar ger en kortare text i stället för
 * att kasta — formuläret ska aldrig kunna fastna för att ett värde saknas.
 */
export function quizOutcome(answers: QuizAnswers): QuizOutcome {
  const forsok = optionFor(QUIZ_STEPS[0], answers.forsok);
  const hinder = optionFor(QUIZ_STEPS[1], answers.hinder);

  const lines: string[] = [];
  if (forsok) lines.push(forsok.insight);
  if (hinder) lines.push(hinder.insight);
  lines.push(
    "Ett upplägg byggs efter var du står, så du slipper gissa vad nästa pass ska innehålla.",
  );

  const headline =
    answers.forsok === "flera"
      ? "Då är det inte kunskapen som stoppar dig"
      : "Det här går att jobba med";

  return { headline, lines };
}

/** Sant när båda frågorna är besvarade med ett giltigt alternativ. */
export function quizComplete(answers: QuizAnswers): boolean {
  return QUIZ_STEPS.every((step) => {
    const v = answers[step.id];
    return typeof v === "string" && step.options.some((o) => o.value === v);
  });
}

/** Giltiga värden per fråga — används av zod-schemat på servern. */
export const QUIZ_VALUES: Record<QuizStepId, string[]> = {
  forsok: QUIZ_STEPS[0].options.map((o) => o.value),
  hinder: QUIZ_STEPS[1].options.map((o) => o.value),
};
