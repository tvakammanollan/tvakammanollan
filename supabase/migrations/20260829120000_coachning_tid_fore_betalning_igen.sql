-- Coachning: tiden först, betalningen sedan — igen, men med kassan inbäddad.
--
-- Ingen schemaändring. Filen finns för att kommentaren på vyn nedan blev osann
-- 2026-08-29, och en vy som ljuger om vad en rad i den betyder är värre än
-- ingen kommentar alls: den som felsöker en obetald bokning skulle läsa
-- "det här kan inte komma från sajten" och leta helt fel.
--
-- FÖRE (2026-08-19): kassan var första steget, tidsvalet låg på
-- /coachning/tack bakom en betald session. Sajtens eget flöde kunde då inte
-- skapa en obetald bokning.
--
-- EFTER (2026-08-29): tidsvalet ligger åter före kassan, därför att det säljer
-- bättre — men kassan renderas nu INNE i modalen (Stripe `ui_mode`
-- embedded_page) i stället för på checkout.stripe.com. Det som gjorde
-- ordningen dyr var domänbytet mitt i köpet; det är borta. Kvar är att den som
-- bokar och stänger modalen håller en tid utan att ha betalat, och den rivs av
-- städaren (`coaching-sweep.server.ts`, COACHING_SWEEP=on, var 15:e minut via
-- pg_cron) plus av `checkout.session.expired` från Stripe.
DO $$
BEGIN
  IF to_regclass('public.coaching_obetalda_bokningar') IS NOT NULL THEN
    EXECUTE $c$COMMENT ON VIEW public.coaching_obetalda_bokningar IS
      'Bokade tider utan betalning. Sedan 2026-08-29 väljs tiden före betalningen igen (kassan är inbäddad i modalen), så en rad här är det normala utfallet av att någon bokar och stänger rutan utan att betala — inte nödvändigtvis missbruk. Städaren avbokar dem automatiskt när fristen gått ut; kolumnen calendly_cancel_url finns för att göra det för hand.'$c$;
  END IF;
END $$;
