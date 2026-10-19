-- Röstning på frågor: tumme upp eller ned efter att man svarat.
--
-- Syftet är sållning. De frågor många tycker är bra dras oftare, och de som
-- tillräckligt många med säkerhet ogillar slutar delas ut. Reglerna för när
-- det sker bor i `src/lib/question-votes.ts`, inte här: databasen räknar
-- bara.
--
-- En rad per användare och fråga (primärnyckeln). En ny röst skriver över den
-- gamla, och att ta tillbaka sin röst raderar raden.
--
-- `is_guest` sätts av servern ur tokenen, aldrig av klienten. Gästkonton går
-- att skapa i obegränsat antal, så deras röster väger hälften när poängen
-- räknas. Utan märkningen hade en enda person kunnat begrava en bra fråga med
-- tio gästkonton.
--
-- Ingen RLS-policy med flit: allt går genom serverfunktioner med service role.
-- En skrivbar policy hade släppt förbi både gästvikten och kvoterna.
CREATE TABLE IF NOT EXISTS public.question_votes (
  question_id uuid NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  is_guest boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, user_id)
);

CREATE INDEX IF NOT EXISTS question_votes_user_idx ON public.question_votes (user_id);

ALTER TABLE public.question_votes ENABLE ROW LEVEL SECURITY;

-- Summan per fråga. En vy och inte en räknare på `questions`: en räknare som
-- uppdateras av en trigger kan glida isär från raderna den räknar, en vy kan
-- inte det. security_invoker så att den inte läcker förbi RLS för anon-nyckeln
-- (se 20260814120000_views_security_invoker.sql); servern läser den med
-- service role.
CREATE OR REPLACE VIEW public.question_vote_stats
WITH (security_invoker = true) AS
SELECT
  question_id,
  count(*) FILTER (WHERE vote = 1 AND NOT is_guest)::int AS up,
  count(*) FILTER (WHERE vote = -1 AND NOT is_guest)::int AS down,
  count(*) FILTER (WHERE vote = 1 AND is_guest)::int AS guest_up,
  count(*) FILTER (WHERE vote = -1 AND is_guest)::int AS guest_down
FROM public.question_votes
GROUP BY question_id;
