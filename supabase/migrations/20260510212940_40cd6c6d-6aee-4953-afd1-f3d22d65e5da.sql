ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.match_questions REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_questions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;