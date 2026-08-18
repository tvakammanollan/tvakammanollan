-- STEG 1 av 2 i att dölja facit. Körs FÖRE utrullningen av koden.
--
-- Den här filen är ofarlig i sig: den lägger bara till en funktion. Den finns
-- som eget steg därför att /admin:s frågeeditor anropar den, och koden rullas
-- ut före rättighetsindragningen i steg 2. Kördes allt i en enda migration
-- skulle antingen editorn eller träningsläget vara trasigt i glappet.
--
-- Funktionen behövs eftersom editorn läser med webbläsarklienten och steg 2
-- tar bort kolumnrättigheten för alla klienter. Den kontrollerar is_admin i
-- stället för att lita på kolumnrättigheten.

create or replace function public.admin_question_answer(_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select q.correct_answer
  from public.questions q
  where q.id = _id
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_admin
    );
$$;

revoke all on function public.admin_question_answer(uuid) from public;
grant execute on function public.admin_question_answer(uuid) to authenticated;
