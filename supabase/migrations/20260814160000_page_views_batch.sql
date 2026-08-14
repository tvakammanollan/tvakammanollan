-- Batchad variant av record_page_view. En RPC per sidvisning tvingade fram ett
-- anrop till Supabase i svarsvägen (nitro skickar inte vidare ctx, så waitUntil
-- saknas och I/O avbryts när svaret returneras). Det tog TTFB från ~0,10 s till
-- 0,44–0,89 s. Workern buffrar därför i minnet och tömmer sällan — den här
-- funktionen tar hela bufferten på en gång.
--
-- p är {"/sokvag": antal, ...}.
CREATE OR REPLACE FUNCTION public.record_page_views(p jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  INSERT INTO public.page_views (day, path, views)
  SELECT CURRENT_DATE, left(key, 200), GREATEST(value::int, 0)
  FROM jsonb_each_text(p)
  WHERE value ~ '^[0-9]+$'
  ON CONFLICT (day, path)
  DO UPDATE SET views = public.page_views.views + EXCLUDED.views;
$$;

REVOKE ALL ON FUNCTION public.record_page_views(jsonb) FROM PUBLIC, anon, authenticated;
