/**
 * Ren del av MEK-topplistan: summerar träningssvar per användare och
 * rangordnar dem på samma sätt som ordlistan (flest rätta först).
 *
 * MEK har ingen färdigaggregerad tabell som `ord_practice_stats`; svaren
 * ligger rad för rad i `match_answers`. Summeringen görs därför här, och är
 * ren för att ordningen vid lika ska gå att pinna i test.
 */
export type PracticeAnswer = { user_id: string; is_correct: boolean };

export type PracticeTotals = { user_id: string; correct_count: number; total_count: number };

export function sumPracticeAnswers(rows: PracticeAnswer[]): PracticeTotals[] {
  const byUser = new Map<string, PracticeTotals>();
  for (const r of rows) {
    let t = byUser.get(r.user_id);
    if (!t) {
      t = { user_id: r.user_id, correct_count: 0, total_count: 0 };
      byUser.set(r.user_id, t);
    }
    t.total_count += 1;
    if (r.is_correct) t.correct_count += 1;
  }
  // Flest rätta, sedan flest besvarade, sedan id: deterministiskt, annars
  // byter två med samma siffror plats mellan två laddningar.
  return [...byUser.values()].sort(
    (a, b) =>
      b.correct_count - a.correct_count ||
      b.total_count - a.total_count ||
      (a.user_id < b.user_id ? -1 : a.user_id > b.user_id ? 1 : 0),
  );
}
