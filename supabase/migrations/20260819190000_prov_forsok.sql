-- Gamla prov: svaren sparas per försök, inte bara poängen.
--
-- FÖRE
-- Ett skrivet provpass lämnade två spår, båda i besökarens localStorage:
--   * `tkn:prov-progress:*` — hela försöket med alla fyrtio svaren, men
--     städat efter en vecka (`MAX_AGE_MS`), eftersom det är ett PÅGÅENDE
--     försök och inte ett resultat.
--   * `tkn:prov-resultat:v1` — bara summan, `{score, total}`.
--
-- Följden: gick man tillbaka till ett prov man skrivit för två veckor sedan
-- fanns bara siffran kvar. Ingen genomgång, inget facit, ingen möjlighet att
-- se vad man svarade på uppgift 23. Och byte av webbläsare eller enhet
-- raderade allt.
--
-- EFTER
-- Ett inlämnat pass skrivs också hit, för den som är inloggad. Då går försöket
-- att rätta i efterhand: svaren finns, och facit finns i provdatan
-- (`src/data/prov/`), så genomgången kan visa vad du svarade, vad som var rätt,
-- och om det blev rätt — hur lång tid som än gått.
--
-- localStorage står kvar och är fortfarande vägen som fungerar utan konto.
-- Gamla prov ska gå att skriva utan att registrera sig; det här är ett tillägg
-- för den som vill ha kvar sina försök, inte en flytt.
--
-- Svaren lagras som jsonb (`{"1":"C","2":"A",...}`) och inte som en rad per
-- uppgift: ett försök läses och skrivs alltid i sin helhet, aldrig uppgift för
-- uppgift, och fyrtio rader per pass hade blivit 4 800 rader per skrivet prov.
CREATE TABLE IF NOT EXISTS public.prov_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,

  -- '2025ht' respektive provpassets nummer. Samma nycklar som i URL:en och i
  -- src/data/prov/, så ett försök alltid går att para ihop med sitt facit.
  term         text NOT NULL CHECK (term ~ '^\d{4}(vt|ht)[ab]?$'),
  pass         smallint NOT NULL CHECK (pass BETWEEN 1 AND 5),

  -- 'prov' = originaltiden och facit först vid inlämning.
  -- 'ova'  = övningsläge utan klocka, facit direkt. Räknas med i poängen men
  --          märks ut, eftersom tidspressen saknas.
  mode         text NOT NULL DEFAULT 'prov' CHECK (mode IN ('prov', 'ova')),

  -- {"1":"C","2":"A"} — uppgiftsnummer → vald bokstav. Obesvarade uppgifter
  -- saknas helt i objektet, vilket är skillnaden mot att ha svarat fel.
  answers      jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Räknas om på servern ur svaren, men lagras också: provlistan summerar
  -- trettio provtillfällen och ska inte behöva ladda 120 provpassfiler för
  -- att svara på en fråga som ryms i två heltal.
  score        smallint NOT NULL CHECK (score >= 0),
  total        smallint NOT NULL CHECK (total > 0),
  duration_s   integer CHECK (duration_s >= 0),

  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- Ett försök per pass och användare — ett omskrivet pass ersätter det gamla,
-- precis som i localStorage. Historik över flera försök på samma pass har
-- ingen yta i appen, och en tabell som växer utan att någon läser den är bara
-- personuppgifter på lager.
CREATE UNIQUE INDEX IF NOT EXISTS prov_attempts_user_pass_uniq
  ON public.prov_attempts (user_id, term, pass);

-- "Mina skrivna prov", nyaste först.
CREATE INDEX IF NOT EXISTS prov_attempts_user_idx
  ON public.prov_attempts (user_id, submitted_at DESC);

ALTER TABLE public.prov_attempts ENABLE ROW LEVEL SECURITY;

-- Egna försök, och bara egna. Till skillnad från matcher är ett provförsök
-- inte delad data — ingen annan har någon anledning att se vad du svarade.
CREATE POLICY "prov_attempts_select_own" ON public.prov_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE saknar policy med flit: allt skrivande går genom
-- serverfunktionen med service role, som räknar poängen själv. En klient som
-- kunde skriva hit kunde skriva 40/40 på varje pass.
