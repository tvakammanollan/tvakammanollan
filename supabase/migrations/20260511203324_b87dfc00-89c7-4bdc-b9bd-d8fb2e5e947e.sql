ALTER TABLE public.question_reports
  ADD CONSTRAINT question_reports_unique_per_user UNIQUE (question_id, reporter_id);