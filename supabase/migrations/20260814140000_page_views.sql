-- Sidvisningar, aggregerat per dygn och sökväg. Ingen IP, ingen användare,
-- ingen cookie, ingen session — bara en räknare. Därför krävs inget samtycke
-- och /integritetspolicy behöver inte ändras: den utlovar inga
-- spårningscookies, inga annonsidentifierare och ingen tredjepartsanalys, och
-- det här är förstaparts och helt aggregerat.
CREATE TABLE IF NOT EXISTS public.page_views (
  day date NOT NULL DEFAULT CURRENT_DATE,
  path text NOT NULL,
  views integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

CREATE INDEX IF NOT EXISTS page_views_day_idx ON public.page_views (day DESC);

-- RLS på utan policy: ingen klientroll kommer åt tabellen alls. Admin-vyn
-- läser via service role, som går förbi RLS.
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Atomiskt, så samtidiga träffar inte skriver över varandra.
CREATE OR REPLACE FUNCTION public.record_page_view(p_path text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  INSERT INTO public.page_views (day, path, views)
  VALUES (CURRENT_DATE, left(p_path, 200), 1)
  ON CONFLICT (day, path) DO UPDATE SET views = public.page_views.views + 1;
$$;

-- Bara service role får anropa den; annars kunde vem som helst blåsa upp siffrorna.
REVOKE ALL ON FUNCTION public.record_page_view(text) FROM PUBLIC, anon, authenticated;
