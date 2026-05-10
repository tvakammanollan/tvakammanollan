-- 1. Restrict UPDATE on users to username column only
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (username) ON public.users TO authenticated;

-- 2. Hide correct_answer column from direct SELECT
REVOKE SELECT ON public.questions FROM authenticated, anon;
GRANT SELECT (id, category, subject_type, question_text, passage_text, passage_id, options, difficulty, source, created_at) ON public.questions TO authenticated;

-- 3. Revoke anon EXECUTE on SECURITY DEFINER RPCs
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_match_review(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_match_review(uuid) TO authenticated;