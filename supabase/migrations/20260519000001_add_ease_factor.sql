ALTER TABLE public.user_word_failed
  ADD COLUMN IF NOT EXISTS ease_factor float NOT NULL DEFAULT 2.5;
