
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_subject_type ON public.questions(subject_type);
CREATE INDEX IF NOT EXISTS idx_questions_category_difficulty ON public.questions(category, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_passage_id ON public.questions(passage_id) WHERE passage_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_source ON public.questions(source) WHERE source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_room_code ON public.matches(room_code) WHERE room_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_player1 ON public.matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2 ON public.matches(player2_id) WHERE player2_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_player1_created ON public.matches(player1_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_elo_history_user_date ON public.elo_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_elo_history_user_type_date ON public.elo_history(user_id, match_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_answers_match_user ON public.match_answers(match_id, user_id);
CREATE INDEX IF NOT EXISTS idx_match_answers_training ON public.match_answers(user_id, is_correct) WHERE is_training = TRUE;

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_search ON public.matchmaking_queue(match_type, status, player_elo);

CREATE INDEX IF NOT EXISTS idx_match_questions_match ON public.match_questions(match_id, question_order);

CREATE INDEX IF NOT EXISTS idx_user_word_correct_user ON public.user_word_correct(user_id);
