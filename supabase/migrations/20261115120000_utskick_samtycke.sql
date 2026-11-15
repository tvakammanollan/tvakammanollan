-- Samtycke till utskick (2026-11-15).
--
-- Reklam via e-post till privatpersoner kräver samtycke i förväg
-- (marknadsföringslagen 19 §). Fram till nu fanns ingen fråga om det vid
-- registreringen, så ingen av de befintliga adresserna får mejlas med något
-- annat än servicemeddelanden. Kolumnen står därför på false för alla, och
-- blir true bara när användaren själv kryssat i rutan (onboarding, /stats
-- eller /avregistrera).
--
-- Skrivs av servern (src/lib/email-optin.functions.ts). Tidpunkten sparas
-- som bevis på när samtycket gavs eller togs tillbaka.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_opt_in_at timestamptz;

COMMENT ON COLUMN public.users.email_opt_in IS
  'true = användaren har själv sagt ja till mejl om nya prov och nyheter. Aldrig satt av oss.';
COMMENT ON COLUMN public.users.email_opt_in_at IS
  'När email_opt_in senast ändrades (ja eller nej).';

-- Exporten (scripts/export-mejl.mjs) läser bara dem som sagt ja.
CREATE INDEX IF NOT EXISTS users_email_opt_in_idx
  ON public.users (email_opt_in) WHERE email_opt_in;
