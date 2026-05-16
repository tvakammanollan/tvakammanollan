-- Add old-exam metadata columns to questions
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS exam_term text,
  ADD COLUMN IF NOT EXISTS provpass_num int,
  ADD COLUMN IF NOT EXISTS q_num int;

CREATE INDEX IF NOT EXISTS questions_exam_term_idx ON public.questions(exam_term);
CREATE INDEX IF NOT EXISTS questions_exam_provpass_idx ON public.questions(exam_term, provpass_num);
