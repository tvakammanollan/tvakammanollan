-- Coachning: kvalificeringsformuläret på dashboarden ("Är studieupplägget
-- något för dig?"). Två frågor, sedan telefonnummer, sedan hör vi av oss.
--
-- Egen tabell och inte en kolumn på `coaching_requests`: den tabellen betyder
-- "någon har öppnat kassan" och bär betalfält, Stripe-id och Calendly-bokning.
-- Ett lead är motsatsen — någon som INTE köpt, och som ska ringas. Att blanda
-- dem hade gjort varje fråga om betalstatus tvetydig, och vyn
-- `coaching_obetalda_bokningar` hade börjat lista folk som aldrig var i kassan.
--
-- OBS: telefonnummer är personuppgift, och det är den första på sajten som
-- samlas in för att kunna kontakta någon. `/integritetspolicy` är uppdaterad i samma
-- ändring. Ändras vad som samlas in här måste den med.
CREATE TABLE IF NOT EXISTS public.coaching_leads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),

  -- Null för utloggade. Formuläret ska fungera utan konto av samma skäl som
  -- kassan gör det: att kräva registrering före en säljkontakt slänger bort
  -- halva underlaget.
  --
  -- CASCADE, till skillnad från coaching_requests som överlever kontoradering.
  -- Skillnaden är avsiktlig: ett köp är en bokföringspost med lagkrav bakom
  -- sig, ett lead är bara ett telefonnummer någon lämnat. Raderar man kontot
  -- ska numret gå med. CASCADE och inte en rad i deleteAccount, eftersom en
  -- kodväg går att glömma vid nästa refaktorering.
  user_id      uuid REFERENCES public.users (id) ON DELETE CASCADE,

  -- Normaliserat till E.164 (+467...) av `normalizePhone` i src/lib/phone.ts.
  -- Lagras normaliserat så att dubbletter går att se; råinmatningen sparas
  -- inte, den tillför inget och är samma personuppgift en gång till.
  phone        text NOT NULL,
  -- Frivilligt. Ett namn i luren är trevligare än "hej, du fyllde i ett formulär".
  name         text,

  -- Svaren på kvalificeringsfrågorna, som {"forsok":"...","hinder":"..."}.
  -- jsonb och inte kolumner: frågorna är säljmaterial och kommer skrivas om,
  -- och en ny fråga ska inte kräva en migration mot produktion.
  answers      jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Var formuläret låg. Samma värdemängd som coaching_requests.source.
  source       text,

  -- GDPR: tidpunkten då numret skickades in, vilket ÄR samtycket — formuläret
  -- säger före knappen vad numret används till. NOT NULL med flit: ett nummer
  -- utan dokumenterad tidpunkt ska inte kunna existera i tabellen.
  consent_at   timestamptz NOT NULL,

  -- Säljstatus. 'new' är det som ska ringas.
  status       text NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new', 'contacted', 'won', 'lost')),
  contacted_at timestamptz,
  note         text
);

-- Arbetslistan är alltid "nya, äldsta först" — den som väntat längst ska ringas
-- först, inte sist.
CREATE INDEX IF NOT EXISTS coaching_leads_new_idx
  ON public.coaching_leads (created_at)
  WHERE status = 'new';

-- Samma person som fyller i två gånger ska synas som en, inte som två samtal.
CREATE INDEX IF NOT EXISTS coaching_leads_phone_idx
  ON public.coaching_leads (phone);

ALTER TABLE public.coaching_leads ENABLE ROW LEVEL SECURITY;

-- Ingen policy för anon/authenticated, med flit. Allt skrivande går genom
-- serverfunktionen med service role (som kringgår RLS), och ingen klient har
-- någon anledning att läsa tabellen: den innehåller andras telefonnummer.
-- En tabell med RLS på och noll policies är stängd för alla utom service role.
--
-- Admin läser via `fetchCoachingLeads`, som är en serverfunktion bakom
-- requireAdmin — inte via RLS.
REVOKE ALL ON public.coaching_leads FROM anon, authenticated;

COMMENT ON TABLE public.coaching_leads IS
  'Leads från kvalificeringsformuläret. Telefonnummer = personuppgift; se /integritetspolicy. Raden försvinner med kontot (ON DELETE CASCADE) — till skillnad från coaching_requests, som är en bokföringspost.';
COMMENT ON COLUMN public.coaching_leads.consent_at IS
  'När numret skickades in. Inskicket är samtycket; texten över knappen säger vad numret används till.';
