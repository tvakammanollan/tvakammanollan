-- ============================================================================
-- FORUM — kategorier, trådar, inlägg, reaktioner, prenumerationer, rapporter
--
-- Kör manuellt i Supabase SQL-editorn (produktionen har ingen migrationskörare)
-- och uppdatera därefter src/integrations/supabase/types.ts för hand.
--
-- Två saker att ha i huvudet när du läser:
--
-- 1. Sidan har anonym inloggning påslagen (gästspelet bygger på den). Därför
--    betyder `auth.uid() is not null` INTE "en användare" utan "vem som helst,
--    obegränsat antal konton, ett HTTP-anrop bort". Skrivgrinden heter
--    public.forum_can_post() och används i varje skriv-RPC.
-- 2. Appens serverfunktioner kör med service_role och går förbi RLS. Policyerna
--    nedan är därför andra försvarslinjen; strypningen som faktiskt gäller
--    ligger inuti RPC:erna (samma mönster som public.send_message).
-- ============================================================================

-- ============== TABELLER ==============

create table if not exists public.forum_categories (
  id          smallint primary key generated always as identity,
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name        text not null,
  description text not null default '',
  sort_order  smallint not null default 0,
  kind        text not null default 'discussion' check (kind in ('discussion','qa')),
  admin_only  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.forum_threads (
  id             bigint primary key generated always as identity,
  category_id    smallint not null references public.forum_categories(id),
  author_id      uuid not null references auth.users(id) on delete cascade,
  title          text not null check (length(btrim(title)) between 5 and 140),
  slug           text not null,
  is_pinned      boolean not null default false,
  is_locked      boolean not null default false,
  answer_post_id bigint,                       -- FK läggs på efter forum_posts
  prov_term      text,                         -- '2026vt' — koppling till arkivet
  status         text not null default 'visible'
                 check (status in ('visible','pending','hidden','deleted')),
  -- denormaliserat, underhålls av trigger nedan
  reply_count    integer not null default 0,
  last_post_at   timestamptz not null default now(),
  last_post_by   uuid references auth.users(id) on delete set null,
  view_count     integer not null default 0,
  deleted_at     timestamptz,
  deleted_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  search_tsv     tsvector
);

create table if not exists public.forum_posts (
  id             bigint primary key generated always as identity,
  thread_id      bigint not null references public.forum_threads(id) on delete cascade,
  author_id      uuid not null references auth.users(id) on delete cascade,
  body           text not null check (length(btrim(body)) between 2 and 10000),
  quoted_post_id bigint references public.forum_posts(id) on delete set null,
  status         text not null default 'visible'
                 check (status in ('visible','pending','hidden','deleted')),
  helpful_count  integer not null default 0,
  edited_at      timestamptz,
  edit_count     smallint not null default 0,
  deleted_at     timestamptz,
  deleted_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  search_tsv     tsvector
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'forum_threads_answer_fk'
  ) then
    alter table public.forum_threads
      add constraint forum_threads_answer_fk
      foreign key (answer_post_id) references public.forum_posts(id) on delete set null;
  end if;
end $$;

create table if not exists public.forum_reactions (
  post_id    bigint not null references public.forum_posts(id) on delete cascade,
  user_id    uuid   not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.forum_subscriptions (
  user_id      uuid   not null references auth.users(id) on delete cascade,
  thread_id    bigint not null references public.forum_threads(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  muted        boolean not null default false,
  primary key (user_id, thread_id)
);

create table if not exists public.forum_reports (
  id          bigint primary key generated always as identity,
  post_id     bigint not null references public.forum_posts(id) on delete cascade,
  reporter_id uuid   not null references auth.users(id) on delete cascade,
  reason      text   not null check (reason in ('spam','trakasseri','olagligt','upphovsratt','annat')),
  note        text   check (length(note) <= 500),
  handled_at  timestamptz,
  handled_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (post_id, reporter_id)
);

-- Ordlista som skickar inlägg till kön i stället för att avvisa dem. Tabell och
-- inte konstant i koden, så att listan kan utökas utan migration.
create table if not exists public.forum_word_filter (
  -- matchas skiftlägesokänsligt som delsträng. Minst tre tecken: en tom eller
  -- ettecknig pattern skulle skicka varenda inlägg till kön.
  pattern    text primary key check (length(btrim(pattern)) >= 3),
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists forum_banned_until timestamptz,
  add column if not exists forum_ban_reason   text,
  add column if not exists forum_post_count   integer not null default 0;

-- ============== INDEX ==============
-- Utan dessa dör trådlistan så fort det finns några tusen inlägg.

create unique index if not exists forum_threads_category_slug
  on public.forum_threads (category_id, slug);
create index if not exists forum_threads_category_list
  on public.forum_threads (category_id, is_pinned desc, last_post_at desc)
  where status = 'visible';
create index if not exists forum_threads_recent
  on public.forum_threads (last_post_at desc) where status = 'visible';
create index if not exists forum_threads_author
  on public.forum_threads (author_id, created_at desc);
create index if not exists forum_posts_thread
  on public.forum_posts (thread_id, created_at) where status = 'visible';
create index if not exists forum_posts_author
  on public.forum_posts (author_id, created_at desc);
create index if not exists forum_posts_pending
  on public.forum_posts (created_at) where status = 'pending';
create index if not exists forum_reports_open
  on public.forum_reports (created_at) where handled_at is null;
create index if not exists forum_threads_tsv on public.forum_threads using gin (search_tsv);
create index if not exists forum_posts_tsv   on public.forum_posts   using gin (search_tsv);

-- ============== SÖKINDEX (svensk konfiguration) ==============

create or replace function public.forum_threads_tsv_trg()
returns trigger language plpgsql set search_path = public as $$
begin
  new.search_tsv := to_tsvector('swedish', coalesce(new.title, ''));
  return new;
end;
$$;

drop trigger if exists forum_threads_tsv_upd on public.forum_threads;
create trigger forum_threads_tsv_upd
  before insert or update of title on public.forum_threads
  for each row execute function public.forum_threads_tsv_trg();

create or replace function public.forum_posts_tsv_trg()
returns trigger language plpgsql set search_path = public as $$
begin
  new.search_tsv := to_tsvector('swedish', coalesce(new.body, ''));
  return new;
end;
$$;

drop trigger if exists forum_posts_tsv_upd on public.forum_posts;
create trigger forum_posts_tsv_upd
  before insert or update of body on public.forum_posts
  for each row execute function public.forum_posts_tsv_trg();

-- ============== DENORMALISERADE RÄKNARE ==============
-- /forum sorterar på last_post_at över alla trådar. Att räkna fram det ur en
-- join vid varje sidvisning är det klassiska sättet att bygga ett forum som är
-- långsamt vid 10 000 inlägg. Räknarna underhålls därför på skrivning.

create or replace function public.forum_refresh_thread_stats(_thread_id bigint)
returns void language sql security definer set search_path = public as $$
  update public.forum_threads t
  set reply_count  = greatest(0, coalesce(s.n, 0) - 1),
      last_post_at = coalesce(s.last_at, t.created_at),
      last_post_by = s.last_by
  from (
    select count(*)                                            as n,
           max(created_at)                                     as last_at,
           (array_agg(author_id order by created_at desc))[1]  as last_by
    from public.forum_posts
    where thread_id = _thread_id and status = 'visible'
  ) s
  where t.id = _thread_id;
$$;

-- OBS: NEW är oassignad i en DELETE-trigger och OLD i en INSERT-trigger.
-- `coalesce(new.x, old.x)` räddar inte det — fältaccessen i sig felar. Därför
-- grenas det på tg_op först, inte på värdet.
create or replace function public.forum_posts_stats_trg()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _thread_id bigint;
begin
  if tg_op = 'DELETE' then
    _thread_id := old.thread_id;
  else
    _thread_id := new.thread_id;
  end if;
  perform public.forum_refresh_thread_stats(_thread_id);

  if tg_op = 'INSERT' and new.status = 'visible' then
    update public.users set forum_post_count = forum_post_count + 1 where id = new.author_id;
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'visible' then
      update public.users set forum_post_count = forum_post_count + 1 where id = new.author_id;
    elsif old.status = 'visible' then
      update public.users set forum_post_count = greatest(0, forum_post_count - 1)
      where id = old.author_id;
    end if;
  elsif tg_op = 'DELETE' and old.status = 'visible' then
    update public.users set forum_post_count = greatest(0, forum_post_count - 1)
    where id = old.author_id;
  end if;

  return null;
end;
$$;

drop trigger if exists forum_posts_stats on public.forum_posts;
create trigger forum_posts_stats
  after insert or update or delete on public.forum_posts
  for each row execute function public.forum_posts_stats_trg();

create or replace function public.forum_reactions_count_trg()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _post_id bigint;
begin
  if tg_op = 'DELETE' then
    _post_id := old.post_id;
  else
    _post_id := new.post_id;
  end if;

  update public.forum_posts p
  set helpful_count = (
    select count(*) from public.forum_reactions r where r.post_id = p.id
  )
  where p.id = _post_id;
  return null;
end;
$$;

drop trigger if exists forum_reactions_count on public.forum_reactions;
create trigger forum_reactions_count
  after insert or delete on public.forum_reactions
  for each row execute function public.forum_reactions_count_trg();

-- ============== SKRIVGRIND ==============
-- Läsa = alla. Skriva = riktigt konto: inte anonymt, bekräftad mejl, äldre än
-- tio minuter, har användarnamn och är inte avstängd.

create or replace function public.forum_can_post(_uid uuid)
returns boolean language sql stable security definer
set search_path = public, auth as $$
  select exists (
    select 1 from auth.users au
    join public.users u on u.id = au.id
    where au.id = _uid
      and coalesce(au.is_anonymous, false) = false        -- inga gästkonton
      and au.email_confirmed_at is not null               -- bekräftad mejl
      and au.created_at < now() - interval '10 minutes'   -- ingen engångsspam
      and length(btrim(u.username)) > 0
      and coalesce(u.forum_banned_until, '-infinity'::timestamptz) < now()
  );
$$;

/**
 * Varför ett inlägg inte får skrivas — svensk text till klienten, eller null.
 * Separat från forum_can_post så att UI kan säga vad som saknas.
 */
create or replace function public.forum_post_block_reason(_uid uuid)
returns text language plpgsql stable security definer
set search_path = public, auth as $$
declare
  _anon    boolean;
  _conf    timestamptz;
  _created timestamptz;
  _name    text;
  _ban     timestamptz;
begin
  select coalesce(au.is_anonymous, false), au.email_confirmed_at, au.created_at,
         btrim(u.username), u.forum_banned_until
  into _anon, _conf, _created, _name, _ban
  from auth.users au
  join public.users u on u.id = au.id
  where au.id = _uid;

  if not found then return 'konto'; end if;
  if _anon then return 'gast'; end if;
  if _conf is null then return 'ej_bekraftad'; end if;
  if _created >= now() - interval '10 minutes' then return 'for_nytt'; end if;
  if _name is null or _name = '' then return 'anvandarnamn'; end if;
  if _ban is not null and _ban >= now() then return 'avstangd'; end if;
  return null;
end;
$$;

-- ============== MODERATIONSBESLUT ==============
-- Ny användare (< 24 h eller < 5 inlägg) får inte lägga in länkar: inlägget
-- hamnar i kön i stället för att avvisas. Avvisning lär spammaren vad som
-- släpps igenom; kö gör det inte.

create or replace function public.forum_moderation_status(_uid uuid, _body text)
returns text language plpgsql stable security definer
set search_path = public, auth as $$
declare
  _new_user boolean;
begin
  select (au.created_at > now() - interval '24 hours' or u.forum_post_count < 5)
  into _new_user
  from auth.users au join public.users u on u.id = au.id
  where au.id = _uid;

  if coalesce(_new_user, true)
     and _body ~* '(https?://|www\.[a-z0-9-]+\.[a-z]{2,}|[a-z0-9-]+\.(com|net|org|ru|xyz|top|shop|info|biz)\b)'
  then
    return 'pending';
  end if;

  if exists (
    select 1 from public.forum_word_filter w
    where position(lower(w.pattern) in lower(_body)) > 0
  ) then
    return 'pending';
  end if;

  return 'visible';
end;
$$;

-- ============== SKRIV-RPC:ER ==============
-- Takten räknas ur tabellen, inte ur ett minne per Cloudflare-isolat.
-- assertRateLimit i appen är det billiga första lagret; detta är kvoten.

create or replace function public.forum_create_thread(
  _uid uuid,
  _category_slug text,
  _title text,
  _slug text,
  _body text,
  _prov_term text default null
)
returns table (thread_id bigint, post_id bigint, slug text, status text)
language plpgsql security definer set search_path = public, auth as $$
declare
  _cat_id    smallint;
  _cat_admin boolean;
  _recent    integer;
  _status    text;
  _slug_try  text;
  _n         integer := 1;
  _tid       bigint;
  _pid       bigint;
begin
  if not public.forum_can_post(_uid) then
    raise exception 'FORUM_NOT_ALLOWED';
  end if;

  select c.id, c.admin_only into _cat_id, _cat_admin
  from public.forum_categories c where c.slug = _category_slug;
  if _cat_id is null then
    raise exception 'FORUM_NO_CATEGORY';
  end if;
  if _cat_admin and not public.is_admin(_uid) then
    raise exception 'FORUM_NOT_ALLOWED';
  end if;

  -- Takt: 5 nya trådar per timme.
  select count(*) into _recent from public.forum_threads
  where author_id = _uid and created_at > now() - interval '1 hour';
  if _recent >= 5 then
    raise exception 'FORUM_RATE_THREADS';
  end if;

  -- Takt för nya användare: ett inlägg varannan minut.
  if (select coalesce(u.forum_post_count, 0) < 5 from public.users u where u.id = _uid)
     and exists (
       select 1 from public.forum_posts p
       where p.author_id = _uid and p.created_at > now() - interval '2 minutes'
     )
  then
    raise exception 'FORUM_RATE_NEWUSER';
  end if;

  _status := public.forum_moderation_status(_uid, _title || ' ' || _body);

  -- Slug är kosmetisk (uppslag sker på id) men ska ändå vara unik per kategori.
  _slug_try := _slug;
  while exists (
    select 1 from public.forum_threads t
    where t.category_id = _cat_id and t.slug = _slug_try
  ) loop
    _n := _n + 1;
    _slug_try := _slug || '-' || _n;
  end loop;

  insert into public.forum_threads (category_id, author_id, title, slug, prov_term, status)
  values (_cat_id, _uid, btrim(_title), _slug_try, _prov_term, _status)
  returning id into _tid;

  insert into public.forum_posts (thread_id, author_id, body, status)
  values (_tid, _uid, btrim(_body), _status)
  returning id into _pid;

  -- Den som startar en tråd följer den.
  insert into public.forum_subscriptions (user_id, thread_id)
  values (_uid, _tid)
  on conflict do nothing;

  return query select _tid, _pid, _slug_try, _status;
end;
$$;

create or replace function public.forum_create_post(
  _uid uuid,
  _thread_id bigint,
  _body text,
  _quoted_post_id bigint default null
)
returns table (post_id bigint, status text)
language plpgsql security definer set search_path = public, auth as $$
declare
  _locked boolean;
  _tstat  text;
  _recent integer;
  _status text;
  _pid    bigint;
begin
  if not public.forum_can_post(_uid) then
    raise exception 'FORUM_NOT_ALLOWED';
  end if;

  select t.is_locked, t.status into _locked, _tstat
  from public.forum_threads t where t.id = _thread_id;
  if _tstat is null then
    raise exception 'FORUM_NO_THREAD';
  end if;
  if _tstat <> 'visible' then
    raise exception 'FORUM_NO_THREAD';
  end if;
  if _locked and not public.is_admin(_uid) then
    raise exception 'FORUM_LOCKED';
  end if;

  -- Takt: 20 inlägg per timme.
  select count(*) into _recent from public.forum_posts
  where author_id = _uid and created_at > now() - interval '1 hour';
  if _recent >= 20 then
    raise exception 'FORUM_RATE_POSTS';
  end if;

  if (select coalesce(u.forum_post_count, 0) < 5 from public.users u where u.id = _uid)
     and exists (
       select 1 from public.forum_posts p
       where p.author_id = _uid and p.created_at > now() - interval '2 minutes'
     )
  then
    raise exception 'FORUM_RATE_NEWUSER';
  end if;

  -- Citat måste ligga i samma tråd, annars går tråden inte att läsa uppifrån.
  if _quoted_post_id is not null and not exists (
    select 1 from public.forum_posts q
    where q.id = _quoted_post_id and q.thread_id = _thread_id and q.status = 'visible'
  ) then
    _quoted_post_id := null;
  end if;

  _status := public.forum_moderation_status(_uid, _body);

  insert into public.forum_posts (thread_id, author_id, body, quoted_post_id, status)
  values (_thread_id, _uid, btrim(_body), _quoted_post_id, _status)
  returning id into _pid;

  insert into public.forum_subscriptions (user_id, thread_id)
  values (_uid, _thread_id)
  on conflict do nothing;

  return query select _pid, _status;
end;
$$;

/** Redigeringsfönster: 30 minuter för vanliga användare, obegränsat för admin. */
create or replace function public.forum_edit_post(_uid uuid, _post_id bigint, _body text)
returns text
language plpgsql security definer set search_path = public, auth as $$
declare
  _author  uuid;
  _created timestamptz;
  _pstat   text;
  _recent  integer;
  _admin   boolean;
  _status  text;
begin
  select p.author_id, p.created_at, p.status into _author, _created, _pstat
  from public.forum_posts p where p.id = _post_id;
  if _author is null then
    raise exception 'FORUM_NO_POST';
  end if;

  _admin := public.is_admin(_uid);
  if not _admin then
    if _author <> _uid then
      raise exception 'FORUM_NOT_OWNER';
    end if;
    if not public.forum_can_post(_uid) then
      raise exception 'FORUM_NOT_ALLOWED';
    end if;
    if _pstat not in ('visible', 'pending') then
      raise exception 'FORUM_NO_POST';
    end if;
    if _created < now() - interval '30 minutes' then
      raise exception 'FORUM_EDIT_WINDOW';
    end if;
    select count(*) into _recent from public.forum_posts p
    where p.author_id = _uid and p.edited_at > now() - interval '1 hour';
    if _recent >= 30 then
      raise exception 'FORUM_RATE_EDITS';
    end if;
  end if;

  _status := case
    when _admin then _pstat
    else public.forum_moderation_status(_uid, _body)
  end;

  -- Ett inlägg som redan ligger i kön stannar där; ett synligt kan hamna där.
  _status := case when _pstat = 'visible' then _status else _pstat end;

  update public.forum_posts
  set body       = btrim(_body),
      edited_at  = now(),
      edit_count = edit_count + 1,
      status     = _status
  where id = _post_id;

  return _status;
end;
$$;

/**
 * Rapportera ett inlägg. Öppen även för gäster — signalen är värd mer än
 * risken. Tre obehandlade rapporter på samma inlägg lägger det i kön.
 */
create or replace function public.forum_report_post(
  _uid uuid, _post_id bigint, _reason text, _note text default null
)
returns integer
language plpgsql security definer set search_path = public, auth as $$
declare
  _recent integer;
  _open   integer;
begin
  select count(*) into _recent from public.forum_reports
  where reporter_id = _uid and created_at > now() - interval '1 hour';
  if _recent >= 10 then
    raise exception 'FORUM_RATE_REPORTS';
  end if;

  insert into public.forum_reports (post_id, reporter_id, reason, note)
  values (_post_id, _uid, _reason, nullif(btrim(coalesce(_note, '')), ''))
  on conflict (post_id, reporter_id) do nothing;

  select count(*) into _open from public.forum_reports
  where post_id = _post_id and handled_at is null;

  if _open >= 3 then
    update public.forum_posts set status = 'pending'
    where id = _post_id and status = 'visible';
  end if;

  return _open;
end;
$$;

/** "Hjälpsam" — en per användare och inlägg, klickas av igen. */
create or replace function public.forum_toggle_reaction(_uid uuid, _post_id bigint)
returns table (helpful_count integer, reacted boolean)
language plpgsql security definer set search_path = public, auth as $$
declare
  _removed integer;
begin
  if not public.forum_can_post(_uid) then
    raise exception 'FORUM_NOT_ALLOWED';
  end if;

  delete from public.forum_reactions r
  where r.post_id = _post_id and r.user_id = _uid;
  get diagnostics _removed = row_count;

  if _removed = 0 then
    insert into public.forum_reactions (post_id, user_id) values (_post_id, _uid);
  end if;

  return query
    select p.helpful_count, (_removed = 0)
    from public.forum_posts p where p.id = _post_id;
end;
$$;

-- ============== RLS ==============
-- Läsning: synliga rader för alla, egna och admins allt. Ingen skrivpolicy —
-- allt skrivande går genom RPC:erna ovan via service_role.

alter table public.forum_categories    enable row level security;
alter table public.forum_threads       enable row level security;
alter table public.forum_posts         enable row level security;
alter table public.forum_reactions     enable row level security;
alter table public.forum_subscriptions enable row level security;
alter table public.forum_reports       enable row level security;
alter table public.forum_word_filter   enable row level security;

drop policy if exists forum_categories_read on public.forum_categories;
create policy forum_categories_read on public.forum_categories for select
  using (admin_only = false or public.is_admin(auth.uid()));

drop policy if exists forum_threads_read on public.forum_threads;
create policy forum_threads_read on public.forum_threads for select
  using (status = 'visible' or author_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists forum_posts_read on public.forum_posts;
create policy forum_posts_read on public.forum_posts for select
  using (status = 'visible' or author_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists forum_reactions_read on public.forum_reactions;
create policy forum_reactions_read on public.forum_reactions for select using (true);

drop policy if exists forum_subscriptions_own on public.forum_subscriptions;
create policy forum_subscriptions_own on public.forum_subscriptions for select
  using (user_id = auth.uid());

drop policy if exists forum_reports_own on public.forum_reports;
create policy forum_reports_own on public.forum_reports for select
  using (reporter_id = auth.uid() or public.is_admin(auth.uid()));

-- Ordlistan är moderationsdata: bara admin.
drop policy if exists forum_word_filter_admin on public.forum_word_filter;
create policy forum_word_filter_admin on public.forum_word_filter for select
  using (public.is_admin(auth.uid()));

-- RPC:erna anropas bara av servern (service_role). Ge dem inte till klienten:
-- de tar _uid som argument och skulle annars gå att skriva i någon annans namn.
revoke execute on function public.forum_create_thread(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.forum_create_post(uuid, bigint, text, bigint)           from public, anon, authenticated;
revoke execute on function public.forum_edit_post(uuid, bigint, text)                     from public, anon, authenticated;
revoke execute on function public.forum_report_post(uuid, bigint, text, text)             from public, anon, authenticated;
revoke execute on function public.forum_toggle_reaction(uuid, bigint)                     from public, anon, authenticated;
revoke execute on function public.forum_refresh_thread_stats(bigint)                      from public, anon, authenticated;

grant execute on function public.forum_create_thread(uuid, text, text, text, text, text) to service_role;
grant execute on function public.forum_create_post(uuid, bigint, text, bigint)           to service_role;
grant execute on function public.forum_edit_post(uuid, bigint, text)                     to service_role;
grant execute on function public.forum_report_post(uuid, bigint, text, text)             to service_role;
grant execute on function public.forum_toggle_reaction(uuid, bigint)                     to service_role;
grant execute on function public.forum_refresh_thread_stats(bigint)                      to service_role;

-- forum_can_post/-block_reason får läsas av inloggade: UI:t frågar vad som saknas.
grant execute on function public.forum_can_post(uuid)         to authenticated, service_role;
grant execute on function public.forum_post_block_reason(uuid) to authenticated, service_role;

-- ============== SKYDDA DE NYA users-KOLUMNERNA ==============
-- users har en RLS-policy som låter en användare uppdatera sin egen rad. Utan
-- detta skulle vem som helst kunna häva sin egen avstängning, eller sätta
-- forum_post_count = 999 och därmed slippa nybörjargrindarna ovan.

create or replace function public.users_protect_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Grinden gick tidigare bara på auth.role(), dvs. en JWT-claim. Det räckte så
  -- länge ingenting på servern uppdaterade users från en privilegierad session:
  -- forumets statistiktrigger är SECURITY DEFINER och körs som postgres, så
  -- auth.role() är inte 'service_role' där och vakten sköt ner triggerns egen
  -- räknaruppdatering. Samma sak gällde alltid för migrationer och psql.
  -- current_user går dessutom inte att förfalska från en klient, vilket claimen
  -- i förlängningen gör.
  if current_user in ('postgres', 'service_role', 'supabase_admin')
     or auth.role() = 'service_role' then
    return new;
  end if;

  if new.elo_verbal is distinct from old.elo_verbal
     or new.elo_math is distinct from old.elo_math
     or new.elo_verbal_peak is distinct from old.elo_verbal_peak
     or new.elo_math_peak is distinct from old.elo_math_peak
     or new.wins is distinct from old.wins
     or new.losses is distinct from old.losses
     or new.games_played is distinct from old.games_played
     or new.is_admin is distinct from old.is_admin
     or new.bot_matches_today is distinct from old.bot_matches_today
     or new.last_bot_match_date is distinct from old.last_bot_match_date
     or new.forum_banned_until is distinct from old.forum_banned_until
     or new.forum_ban_reason is distinct from old.forum_ban_reason
     or new.forum_post_count is distinct from old.forum_post_count
  then
    raise exception 'Field is server-managed and cannot be modified directly';
  end if;

  return new;
end;
$$;

-- Andra lagret, oberoende av triggern ovan: utan UPDATE-rätt på kolumnen kan
-- ingen klient ens försöka. Kontrolleras före RLS och före triggers, och gäller
-- den anropande rollen — triggern körs som postgres och berörs inte.
revoke update (forum_banned_until, forum_ban_reason, forum_post_count)
  on public.users from anon, authenticated;

-- ============== KATEGORIER VID LANSERING ==============
-- Fem, inte tolv. Tomma kategorier signalerar dött forum.

insert into public.forum_categories (slug, name, description, sort_order, kind)
values
  ('allmant',     'Högskoleprovet allmänt',
   'Frågor och diskussion om provet i stort — upplägg, taktik och allt som inte hör hemma någon annanstans.',
   1, 'discussion'),
  ('kvantitativ', 'Kvantitativ del',
   'XYZ, KVA, NOG och DTK. Fråga om en uppgift du fastnat på och få den löst.',
   2, 'qa'),
  ('verbal',      'Verbal del',
   'ORD, LÄS, MEK och ELF. Ordförståelse, lästeknik och meningskomplettering.',
   3, 'qa'),
  ('provdagen',   'Anmälan, provdagen & resultat',
   'Anmälan, vad som gäller på provdagen, normering och hur du läser ditt resultat.',
   4, 'discussion'),
  ('plugg',       'Plugg, motivation & studieteknik',
   'Hur du lägger upp pluggandet, håller igång och orkar hela vägen fram.',
   5, 'discussion')
on conflict (slug) do nothing;

-- ============== REALTID ==============
-- Fas 2 använder postgres_changes på forum_posts för "3 nya inlägg — visa".
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'forum_posts'
    ) then
      alter publication supabase_realtime add table public.forum_posts;
    end if;
  end if;
end $$;
