-- ============================================================================
-- FORUM FAS 2 — bästa svar, sök, prenumerationer
--
-- Kör manuellt i Supabase SQL-editorn och uppdatera därefter
-- src/integrations/supabase/types.ts för hand (samma rutin som fas 1).
--
-- Tabellerna finns redan sedan 20260816120000_forum.sql. Det som saknades var
-- RPC:erna: fas 1 lade answer_post_id och tsvector-index men ingenting som
-- skrev till dem utanför admin-moderationen.
--
-- Alla funktioner här tar _uid som argument och körs som SECURITY DEFINER. De
-- får därför INTE ges till authenticated — då skulle vem som helst kunna agera
-- i någon annans namn. Anropen går via serverfunktionerna, som läser användaren
-- ur Bearer-token. Samma regel som i fas 1.
-- ============================================================================

-- ============== BÄSTA SVAR ==============
-- Fas 1 kunde bara sätta answer_post_id via admin-moderationen. Det är
-- trådstartaren som vet vilket svar som löste problemet, och på en Q&A-sida är
-- markeringen dessutom det som ger acceptedAnswer i QAPage-schemat.

create or replace function public.forum_set_answer(
  _uid uuid, _thread_id bigint, _post_id bigint default null
)
returns bigint
language plpgsql security definer set search_path = public, auth as $$
declare
  _author    uuid;
  _tstat     text;
  _first_id  bigint;
  _pthread   bigint;
  _pstat     text;
begin
  select t.author_id, t.status into _author, _tstat
  from public.forum_threads t where t.id = _thread_id;
  if _author is null or _tstat <> 'visible' then
    raise exception 'FORUM_NO_THREAD';
  end if;

  -- Trådstartaren eller admin. Att låta vem som helst markera bästa svar vore
  -- att låta vem som helst skriva sidans structured data.
  if _author <> _uid and not public.is_admin(_uid) then
    raise exception 'FORUM_NOT_OWNER';
  end if;

  if _post_id is null then
    update public.forum_threads set answer_post_id = null where id = _thread_id;
    return null;
  end if;

  select p.thread_id, p.status into _pthread, _pstat
  from public.forum_posts p where p.id = _post_id;
  if _pthread is null or _pthread <> _thread_id or _pstat <> 'visible' then
    raise exception 'FORUM_NO_POST';
  end if;

  -- Första inlägget är frågan. Att markera den som sitt eget bästa svar ger
  -- acceptedAnswer = frågan i QAPage-schemat, vilket är trasig strukturerad
  -- data och dessutom meningslöst för läsaren.
  select p.id into _first_id
  from public.forum_posts p
  where p.thread_id = _thread_id and p.status = 'visible'
  order by p.created_at, p.id
  limit 1;
  if _first_id = _post_id then
    raise exception 'FORUM_ANSWER_IS_QUESTION';
  end if;

  update public.forum_threads set answer_post_id = _post_id where id = _thread_id;
  return _post_id;
end;
$$;

-- ============== SÖK ==============
-- GIN-indexen på search_tsv lades i fas 1; det här är frågan som använder dem.
--
-- Ingen ts_headline: den returnerar källtexten med <b>-taggar, vilket skulle
-- behöva renderas som HTML — och inläggstext är användarinnehåll. Vi returnerar
-- ren text och klipper utdraget i appen i stället (excerpt() i lib/forum.ts).

create or replace function public.forum_search(
  _q text, _limit integer default 20, _offset integer default 0
)
returns table (
  thread_id    bigint,
  title        text,
  slug         text,
  category_id  smallint,
  author_id    uuid,
  reply_count  integer,
  created_at   timestamptz,
  last_post_at timestamptz,
  match_body   text,
  rank         real,
  total_count  bigint
)
language sql stable security definer set search_path = public as $$
  with q as (
    select websearch_to_tsquery('swedish', coalesce(_q, '')) as tsq
  ),
  thread_hits as (
    -- Rubriker väger tyngre: den som söker "kva rötter" vill helst ha tråden
    -- som heter så, inte det femtionde inlägget som råkar nämna båda orden.
    select t.id as tid, ts_rank(t.search_tsv, q.tsq) * 3.0 as rank, null::text as body
    from public.forum_threads t, q
    where t.status = 'visible' and t.search_tsv @@ q.tsq
  ),
  post_hits as (
    select p.thread_id as tid, ts_rank(p.search_tsv, q.tsq) as rank, p.body
    from public.forum_posts p
    join public.forum_threads t on t.id = p.thread_id and t.status = 'visible'
    cross join q
    where p.status = 'visible' and p.search_tsv @@ q.tsq
  ),
  merged as (
    select tid, rank, body from thread_hits
    union all
    select tid, rank, body from post_hits
  ),
  best as (
    select m.tid,
           max(m.rank) as rank,
           -- Föredra ett inläggsutdrag framför null: en ren rubrikträff har
           -- ingen body, men tråden har ändå ett förstainlägg att visa.
           (array_agg(m.body order by (m.body is null), m.rank desc))[1] as body
    from merged m
    group by m.tid
  )
  select t.id, t.title, t.slug, t.category_id, t.author_id, t.reply_count,
         t.created_at, t.last_post_at,
         b.body, b.rank::real, count(*) over () as total_count
  from best b
  join public.forum_threads t on t.id = b.tid
  join public.forum_categories c on c.id = t.category_id and c.admin_only = false
  order by b.rank desc, t.last_post_at desc
  limit greatest(1, least(coalesce(_limit, 20), 50))
  offset greatest(0, coalesce(_offset, 0));
$$;

-- ============== PRENUMERATIONER ==============
-- Raden skapas redan av forum_create_thread/-post (den som skriver följer
-- tråden). Det här är knappen och läsmarkeringen.

create or replace function public.forum_toggle_subscription(_uid uuid, _thread_id bigint)
returns boolean
language plpgsql security definer set search_path = public, auth as $$
declare
  _removed integer;
begin
  delete from public.forum_subscriptions s
  where s.user_id = _uid and s.thread_id = _thread_id;
  get diagnostics _removed = row_count;

  if _removed > 0 then
    return false;
  end if;

  -- Att sluta följa får alltid gå igenom (även avstängd), att börja följa
  -- kräver riktigt konto — annars blir prenumerationer en gästkonto-yta.
  if not public.forum_can_post(_uid) then
    raise exception 'FORUM_NOT_ALLOWED';
  end if;
  if not exists (
    select 1 from public.forum_threads t
    where t.id = _thread_id and t.status = 'visible'
  ) then
    raise exception 'FORUM_NO_THREAD';
  end if;

  insert into public.forum_subscriptions (user_id, thread_id)
  values (_uid, _thread_id)
  on conflict do nothing;
  return true;
end;
$$;

/**
 * Markera tråden läst. Skapar INTE en prenumeration — att läsa en tråd ska
 * inte tysta eller starta en bevakning man aldrig bett om.
 */
create or replace function public.forum_mark_thread_read(_uid uuid, _thread_id bigint)
returns void
language sql security definer set search_path = public as $$
  update public.forum_subscriptions
  set last_read_at = now()
  where user_id = _uid and thread_id = _thread_id;
$$;

/**
 * Trådar med olästa svar — underlaget till notisklockan.
 *
 * Följer samma princip som resten av klockan: notiserna härleds ur befintliga
 * tabeller vid uppslag i stället för att skrivas till en notistabell.
 */
create or replace function public.forum_unread_threads(_uid uuid, _limit integer default 20)
returns table (
  thread_id     bigint,
  title         text,
  slug          text,
  category_slug text,
  unread_count  integer,
  last_post_at  timestamptz,
  last_post_by  uuid
)
language sql stable security definer set search_path = public as $$
  select x.thread_id, x.title, x.slug, x.category_slug,
         x.unread_count, x.last_post_at, x.last_post_by
  from (
    select t.id as thread_id, t.title, t.slug, c.slug as category_slug,
           t.last_post_at, t.last_post_by,
           (
             select count(*)::integer
             from public.forum_posts p
             where p.thread_id = t.id
               and p.status = 'visible'
               and p.created_at > s.last_read_at
               and p.author_id <> _uid       -- egna inlägg är aldrig olästa
           ) as unread_count
    from public.forum_subscriptions s
    join public.forum_threads t
      on t.id = s.thread_id and t.status = 'visible'
    join public.forum_categories c
      on c.id = t.category_id and c.admin_only = false
    where s.user_id = _uid
      and s.muted = false
      and t.last_post_at > s.last_read_at
  ) x
  where x.unread_count > 0
  order by x.last_post_at desc
  limit greatest(1, least(coalesce(_limit, 20), 50));
$$;

/** Följer den här användaren tråden? Ett anrop, för knappens starttillstånd. */
create or replace function public.forum_is_subscribed(_uid uuid, _thread_id bigint)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.forum_subscriptions
    where user_id = _uid and thread_id = _thread_id and muted = false
  );
$$;

-- ============== RÄTTIGHETER ==============
-- Samma regel som i fas 1: allt som tar _uid går bara att anropa som
-- service_role, dvs. från serverfunktionerna.

revoke execute on function public.forum_set_answer(uuid, bigint, bigint)      from public, anon, authenticated;
revoke execute on function public.forum_toggle_subscription(uuid, bigint)     from public, anon, authenticated;
revoke execute on function public.forum_mark_thread_read(uuid, bigint)        from public, anon, authenticated;
revoke execute on function public.forum_unread_threads(uuid, integer)         from public, anon, authenticated;
revoke execute on function public.forum_is_subscribed(uuid, bigint)           from public, anon, authenticated;

grant execute on function public.forum_set_answer(uuid, bigint, bigint)      to service_role;
grant execute on function public.forum_toggle_subscription(uuid, bigint)     to service_role;
grant execute on function public.forum_mark_thread_read(uuid, bigint)        to service_role;
grant execute on function public.forum_unread_threads(uuid, integer)         to service_role;
grant execute on function public.forum_is_subscribed(uuid, bigint)           to service_role;

-- Söket tar ingen användare och läser bara synliga rader — men det kör tunga
-- FTS-frågor, så det går via serverfunktionen med sin IP-kvot i stället för
-- att exponeras direkt för klienten.
revoke execute on function public.forum_search(text, integer, integer) from public, anon, authenticated;
grant  execute on function public.forum_search(text, integer, integer) to service_role;
