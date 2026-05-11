
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS cleaned_question_text TEXT,
  ADD COLUMN IF NOT EXISTS cleaned_options JSONB,
  ADD COLUMN IF NOT EXISTS clean_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS cleaned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_questions_clean_status ON public.questions(category, clean_status);
