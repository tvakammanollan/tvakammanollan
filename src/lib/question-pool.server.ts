// Hela beståndet ur `questions` för ett urval, sidvis och cachat per isolat.
//
// PostgREST svarar med högst 1 000 rader per anrop, oavsett vilket `limit`
// man skickar, och en fråga utan `order` ger tabellens 1 000 första rader i
// fysisk ordning. Tre urval (matchen, ordövningen, träningen) hade var sin
// variant av `limit(9000)` eller ett fönster på 1 000 och såg därför aldrig
// mer än en bråkdel av ORD (8 761 rader) och MEK (1 898). Här hämtas en
// räkning först och sedan alla sidor parallellt, sorterat på id så att
// sidorna inte överlappar. Hämta lätta kolumner (id, ett ord) och läs hela
// raderna för de uppgifter som valts.

export const POOL_PAGE = 1000;
const POOL_TTL_MS = 10 * 60 * 1000;

type PoolResult<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
  count: number | null;
}>;

/** En supabase-fråga med `select(cols, { count: "exact" })` och alla filter satta. */
export interface PoolQuery<T> {
  order(column: string): { range(from: number, to: number): PoolResult<T> };
  range(from: number, to: number): PoolResult<T>;
}

const cache = new Map<string, { rows: unknown[]; at: number }>();

export async function loadQuestionPool<T extends { id: string }>(
  cacheKey: string,
  build: () => PoolQuery<T>,
): Promise<T[]> {
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < POOL_TTL_MS) return hit.rows as T[];
  const head = await build().range(0, 0);
  if (head.error) throw head.error;
  const total = head.count ?? 0;
  const offsets: number[] = [];
  for (let from = 0; from < total; from += POOL_PAGE) offsets.push(from);
  const pages = await Promise.all(
    offsets.map(async (from) => {
      const { data, error } = await build()
        .order("id")
        .range(from, from + POOL_PAGE - 1);
      if (error) throw error;
      return data ?? [];
    }),
  );
  const rows = pages.flat();
  cache.set(cacheKey, { rows, at: Date.now() });
  return rows;
}

/** Tömmer cachen, för tester. */
export function clearQuestionPoolCache(): void {
  cache.clear();
}
