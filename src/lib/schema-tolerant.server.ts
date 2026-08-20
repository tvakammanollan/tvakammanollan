/**
 * Skrivningar som överlever att migrationen inte körts än.
 *
 * Migrationerna körs för hand i Supabases SQL-editor (produktionen har ingen
 * CLI-runner), medan koden rullas ut av en push till `main`. De två går alltså
 * inte att synkronisera exakt, och glappet kan bli minuter eller dagar åt
 * vilket håll som helst.
 *
 * PostgREST avvisar en INSERT eller UPDATE som nämner en kolumn den inte känner
 * till, med `PGRST204`. En ny kolumn i en skrivning som ligger på sajtens
 * huvudflöde tar därför ner det flödet helt tills migrationen är körd — en
 * botmatch gick t.ex. inte att starta alls när `matches.started_at` lades till
 * i koden men inte i databasen.
 *
 * Samma tanke som `elo_history`-skrivningen, som infogar och ignorerar 23505
 * "så ingen deploy-ordning krävs mot migrationen": den nya kolumnen är en
 * förbättring, inte ett krav. Saknas den skrivs raden utan den, och läskoden
 * faller tillbaka på det gamla beteendet.
 *
 * Detta ersätter INTE att köra migrationen — se BUGFIX-LOG.md. Det gör bara
 * ordningen ofarlig.
 */

interface PostgrestErrorish {
  code?: string | null;
  message?: string | null;
}

/** Sant när felet är "den här kolumnen finns inte i schemat". */
export function isMissingColumn(error: PostgrestErrorish | null | undefined): boolean {
  return error?.code === "PGRST204";
}

/** Kolumnnamnet ur felmeddelandet, eller null om det inte går att läsa ut. */
export function missingColumnName(error: PostgrestErrorish | null | undefined): string | null {
  if (!isMissingColumn(error)) return null;
  const m = /'([^']+)' column/.exec(error?.message ?? "");
  return m?.[1] ?? null;
}

/**
 * Kör en skrivning och gör om den utan de kolumner databasen inte känner till.
 *
 * `run` får en nyttolast och returnerar PostgREST-svaret. Vid `PGRST204`
 * plockas den utpekade kolumnen bort och försöket görs om — som mest en gång
 * per valfri kolumn, så en riktig felkonfiguration inte blir en oändlig loop.
 */
export async function writeTolerant<T>(
  payload: Record<string, unknown>,
  optional: readonly string[],
  // PromiseLike och inte Promise: supabase-js byggare är thenables, inte
  // riktiga Promise-objekt, och skulle annars behöva ett extra `await` på
  // varje anropsställe bara för att typen ska gå ihop.
  run: (
    payload: Record<string, unknown>,
  ) => PromiseLike<{ data: T; error: PostgrestErrorish | null }>,
): Promise<{ data: T; error: PostgrestErrorish | null }> {
  let current = { ...payload };
  for (let i = 0; i <= optional.length; i++) {
    const res = await run(current);
    if (!isMissingColumn(res.error)) return res;

    const saknad = missingColumnName(res.error);
    // Bara kolumner vi själva pekat ut som valfria tas bort. En okänd kolumn
    // som INTE står i listan är ett riktigt fel och ska synas som ett.
    if (!saknad || !optional.includes(saknad) || !(saknad in current)) return res;

    console.warn(
      `[schema] kolumnen "${saknad}" finns inte i databasen än — skriver utan den. Kör migrationen.`,
    );
    const { [saknad]: _bort, ...rest } = current;
    void _bort;
    current = rest;
  }
  return run(current);
}
