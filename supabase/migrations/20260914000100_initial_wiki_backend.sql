-- TTwowelve official Wiki backend
-- Apply with: supabase db push
-- This migration is intentionally self-contained so a new Supabase project can
-- be rebuilt from GitHub without manual SQL changes.

create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('guest', 'user', 'contributor', 'editor', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.wiki_page_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.proposal_status as enum ('open', 'accepted', 'rejected', 'withdrawn');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null;
end $$;

create or replace function public.role_rank(p_role public.app_role)
returns smallint
language sql
immutable
as $$
  select case p_role
    when 'guest' then 0
    when 'user' then 10
    when 'contributor' then 20
    when 'editor' then 30
    when 'admin' then 40
  end::smallint
$$;

-- Create this table before the role-check functions are parsed. The later
-- CREATE TABLE IF NOT EXISTS keeps the schema section easy to find.
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SECURITY DEFINER prevents role-check policies from recursively reading the
-- user_roles table. The function exposes only a boolean and never role rows.
create or replace function public.has_role(p_required public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and public.role_rank(role) >= public.role_rank(p_required)
  )
$$;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid()
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player' check (char_length(display_name) between 1 and 80),
  avatar_path text,
  bio text check (bio is null or char_length(bio) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_roles_role_idx on public.user_roles(role);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists user_roles_touch_updated_at on public.user_roles;
create trigger user_roles_touch_updated_at before update on public.user_roles
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(left(new.raw_user_meta_data ->> 'display_name', 80), ''), 'Player'))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists games_touch_updated_at on public.games;
create trigger games_touch_updated_at before update on public.games
for each row execute function public.touch_updated_at();

create table if not exists public.wiki_pages (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 200),
  summary text not null default '' check (char_length(summary) <= 1000),
  content jsonb not null default '{}'::jsonb,
  status public.wiki_page_status not null default 'draft',
  version integer not null default 1 check (version > 0),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (game_id, slug)
);

create index if not exists wiki_pages_game_status_idx on public.wiki_pages(game_id, status) where deleted_at is null;
create index if not exists wiki_pages_updated_at_idx on public.wiki_pages(updated_at desc);

drop trigger if exists wiki_pages_touch_updated_at on public.wiki_pages;
create trigger wiki_pages_touch_updated_at before update on public.wiki_pages
for each row execute function public.touch_updated_at();

create table if not exists public.wiki_revisions (
  revision_id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.wiki_pages(id) on delete cascade,
  editor_user_id uuid references auth.users(id) on delete set null,
  previous_data jsonb not null,
  new_data jsonb not null,
  version integer not null check (version > 0),
  change_note text not null default '' check (char_length(change_note) <= 500),
  created_at timestamptz not null default now(),
  unique (page_id, version)
);

create index if not exists wiki_revisions_page_created_idx on public.wiki_revisions(page_id, created_at desc);

create or replace function public.enforce_wiki_page_version()
returns trigger
language plpgsql
as $$
begin
  if new.version <> old.version + 1 then
    raise exception using errcode = '22000', message = 'WIKI_VERSION_INCREMENT_REQUIRED';
  end if;
  return new;
end;
$$;

drop trigger if exists wiki_pages_enforce_version on public.wiki_pages;
create trigger wiki_pages_enforce_version before update on public.wiki_pages
for each row execute function public.enforce_wiki_page_version();

create or replace function public.record_wiki_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  note text := coalesce(nullif(current_setting('app.change_note', true), ''), 'Direct update');
begin
  insert into public.wiki_revisions (
    page_id, editor_user_id, previous_data, new_data, version, change_note
  ) values (
    new.id, coalesce(auth.uid(), new.updated_by), to_jsonb(old), to_jsonb(new), new.version, note
  );
  return new;
end;
$$;

drop trigger if exists wiki_pages_record_revision on public.wiki_pages;
create trigger wiki_pages_record_revision after update on public.wiki_pages
for each row execute function public.record_wiki_revision();

create or replace function public.record_initial_wiki_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wiki_revisions (
    page_id, editor_user_id, previous_data, new_data, version, change_note
  ) values (
    new.id, coalesce(auth.uid(), new.created_by), '{}'::jsonb, to_jsonb(new), new.version, 'Initial page'
  ) on conflict (page_id, version) do nothing;
  return new;
end;
$$;

drop trigger if exists wiki_pages_record_initial_revision on public.wiki_pages;
create trigger wiki_pages_record_initial_revision after insert on public.wiki_pages
for each row execute function public.record_initial_wiki_revision();

create table if not exists public.wiki_edit_proposals (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.wiki_pages(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  proposer_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  summary text not null default '',
  content jsonb not null default '{}'::jsonb,
  status public.proposal_status not null default 'open',
  reviewer_user_id uuid references auth.users(id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wiki_edit_proposals_status_idx on public.wiki_edit_proposals(status, created_at desc);
create index if not exists wiki_edit_proposals_proposer_idx on public.wiki_edit_proposals(proposer_user_id, created_at desc);

drop trigger if exists wiki_edit_proposals_touch_updated_at on public.wiki_edit_proposals;
create trigger wiki_edit_proposals_touch_updated_at before update on public.wiki_edit_proposals
for each row execute function public.touch_updated_at();

create table if not exists public.wiki_edit_locks (
  page_id uuid primary key references public.wiki_pages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (expires_at > acquired_at)
);

create index if not exists wiki_edit_locks_expiry_idx on public.wiki_edit_locks(expires_at);

create or replace function public.acquire_wiki_edit_lock(p_page_id uuid, p_seconds integer default 120)
returns public.wiki_edit_locks
language plpgsql
security invoker
set search_path = public
as $$
declare result public.wiki_edit_locks;
begin
  if auth.uid() is null or not public.has_role('editor') then
    raise exception using errcode = '42501', message = 'EDITOR_ROLE_REQUIRED';
  end if;
  if p_seconds < 30 or p_seconds > 900 then
    raise exception using errcode = '22023', message = 'INVALID_LOCK_DURATION';
  end if;
  insert into public.wiki_edit_locks(page_id, user_id, expires_at)
  values (p_page_id, auth.uid(), now() + make_interval(secs => p_seconds))
  on conflict (page_id) do update
    set user_id = excluded.user_id, acquired_at = now(), expires_at = excluded.expires_at
    where wiki_edit_locks.expires_at <= now() or wiki_edit_locks.user_id = auth.uid()
  returning * into result;
  if result.page_id is null then
    raise exception using errcode = '55P03', message = 'WIKI_EDIT_LOCKED';
  end if;
  return result;
end;
$$;

create or replace function public.update_wiki_page(
  p_page_id uuid,
  p_expected_version integer,
  p_title text,
  p_summary text,
  p_content jsonb,
  p_status public.wiki_page_status default 'published',
  p_change_note text default ''
)
returns public.wiki_pages
language plpgsql
security invoker
set search_path = public
as $$
declare result public.wiki_pages;
begin
  if auth.uid() is null or not public.has_role('editor') then
    raise exception using errcode = '42501', message = 'EDITOR_ROLE_REQUIRED';
  end if;
  if p_expected_version is null or p_expected_version < 1 then
    raise exception using errcode = '22023', message = 'INVALID_EXPECTED_VERSION';
  end if;
  perform set_config('app.change_note', left(coalesce(p_change_note, ''), 500), true);
  update public.wiki_pages
     set title = left(trim(p_title), 200),
         summary = left(coalesce(p_summary, ''), 1000),
         content = coalesce(p_content, '{}'::jsonb),
         status = coalesce(p_status, 'published'),
         version = version + 1,
         updated_by = auth.uid()
   where id = p_page_id and version = p_expected_version and deleted_at is null
   returning * into result;
  if result.id is null then
    if exists (select 1 from public.wiki_pages where id = p_page_id and version <> p_expected_version) then
      raise exception using errcode = '40001', message = 'WIKI_VERSION_CONFLICT';
    end if;
    raise exception using errcode = 'P0002', message = 'WIKI_PAGE_NOT_FOUND';
  end if;
  return result;
end;
$$;

create or replace function public.restore_wiki_revision(
  p_page_id uuid,
  p_revision_id uuid,
  p_expected_version integer,
  p_change_note text default 'Restore revision'
)
returns public.wiki_pages
language plpgsql
security invoker
set search_path = public
as $$
declare revision_row public.wiki_revisions;
declare result public.wiki_pages;
begin
  if auth.uid() is null or not public.has_role('editor') then
    raise exception using errcode = '42501', message = 'EDITOR_ROLE_REQUIRED';
  end if;
  select * into revision_row from public.wiki_revisions
   where revision_id = p_revision_id and page_id = p_page_id;
  if revision_row.revision_id is null then
    raise exception using errcode = 'P0002', message = 'WIKI_REVISION_NOT_FOUND';
  end if;
  perform set_config('app.change_note', left(coalesce(p_change_note, 'Restore revision'), 500), true);
  update public.wiki_pages
     set title = coalesce(revision_row.new_data ->> 'title', title),
         summary = coalesce(revision_row.new_data ->> 'summary', summary),
         content = coalesce(revision_row.new_data -> 'content', '{}'::jsonb),
         status = coalesce((revision_row.new_data ->> 'status')::public.wiki_page_status, status),
         version = version + 1,
         updated_by = auth.uid()
   where id = p_page_id and version = p_expected_version and deleted_at is null
   returning * into result;
  if result.id is null then
    raise exception using errcode = '40001', message = 'WIKI_VERSION_CONFLICT';
  end if;
  return result;
end;
$$;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.wiki_pages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists comments_page_created_idx on public.comments(page_id, created_at desc) where deleted_at is null;
create index if not exists comments_user_idx on public.comments(user_id, created_at desc);

drop trigger if exists comments_touch_updated_at on public.comments;
create trigger comments_touch_updated_at before update on public.comments
for each row execute function public.touch_updated_at();

create or replace function public.prevent_comment_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.page_id is distinct from old.page_id
     or new.created_at is distinct from old.created_at then
    raise exception using errcode = '42501', message = 'COMMENT_IDENTITY_IMMUTABLE';
  end if;
  return new;
end;
$$;

drop trigger if exists comments_prevent_identity_change on public.comments;
create trigger comments_prevent_identity_change before update on public.comments
for each row execute function public.prevent_comment_identity_change();

create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 1 and 500),
  status public.report_status not null default 'open',
  moderator_user_id uuid references auth.users(id) on delete set null,
  moderator_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (comment_id, reporter_user_id)
);

drop trigger if exists comment_reports_touch_updated_at on public.comment_reports;
create trigger comment_reports_touch_updated_at before update on public.comment_reports
for each row execute function public.touch_updated_at();

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  page_id uuid not null references public.wiki_pages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, page_id)
);

create index if not exists favorites_page_idx on public.favorites(page_id);

create table if not exists public.user_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  page_id uuid not null references public.wiki_pages(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists user_history_user_viewed_idx on public.user_history(user_id, viewed_at desc);
create index if not exists user_history_page_viewed_idx on public.user_history(page_id, viewed_at desc);

create or replace function public.record_page_view(p_page_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then return false; end if;
  insert into public.user_history(user_id, page_id)
  select auth.uid(), p_page_id
  where not exists (
    select 1 from public.user_history
    where user_id = auth.uid() and page_id = p_page_id
      and viewed_at > now() - interval '10 minutes'
  );
  return found;
end;
$$;

create table if not exists public.save_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  save_key text not null check (save_key ~ '^[a-zA-Z0-9_.:-]{1,100}$'),
  data jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id, save_key)
);

create index if not exists save_data_game_idx on public.save_data(game_id, updated_at desc);

drop trigger if exists save_data_touch_updated_at on public.save_data;
create trigger save_data_touch_updated_at before update on public.save_data
for each row execute function public.touch_updated_at();

create or replace function public.upsert_save_data(
  p_game_id uuid,
  p_save_key text,
  p_data jsonb,
  p_expected_version integer default null
)
returns public.save_data
language plpgsql
security invoker
set search_path = public
as $$
declare result public.save_data;
begin
  if auth.uid() is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
  insert into public.save_data(user_id, game_id, save_key, data, version)
  values (auth.uid(), p_game_id, p_save_key, coalesce(p_data, '{}'::jsonb), 1)
  on conflict (user_id, game_id, save_key) do update
    set data = excluded.data, version = save_data.version + 1
    where p_expected_version is null or save_data.version = p_expected_version
  returning * into result;
  if result.user_id is null then
    raise exception using errcode = '40001', message = 'SAVE_VERSION_CONFLICT';
  end if;
  return result;
end;
$$;

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action ~ '^[a-z0-9_.:-]{1,100}$'),
  target_type text not null check (target_type ~ '^[a-z0-9_.:-]{1,100}$'),
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_created_idx on public.audit_logs(actor_user_id, created_at desc);
create index if not exists audit_logs_target_created_idx on public.audit_logs(target_type, target_id, created_at desc);

create or replace function public.audit_wiki_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs(actor_user_id, action, target_type, target_id, metadata)
  values (coalesce(auth.uid(), new.updated_by), 'wiki.update', 'wiki_page', new.id::text,
    jsonb_build_object('version', new.version, 'previous_version', old.version,
      'change_note', coalesce(nullif(current_setting('app.change_note', true), ''), 'Direct update')));
  return new;
end;
$$;

drop trigger if exists wiki_pages_audit_update on public.wiki_pages;
create trigger wiki_pages_audit_update after update on public.wiki_pages
for each row execute function public.audit_wiki_update();

create or replace function public.audit_comment_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.deleted_at is distinct from new.deleted_at and new.deleted_at is not null then
    insert into public.audit_logs(actor_user_id, action, target_type, target_id, metadata)
    values (auth.uid(), 'comment.delete', 'comment', new.id::text, '{}'::jsonb);
  end if;
  return new;
end;
$$;

drop trigger if exists comments_audit_moderation on public.comments;
create trigger comments_audit_moderation after update on public.comments
for each row execute function public.audit_comment_moderation();

create or replace function public.set_user_role(p_target_user_id uuid, p_role public.app_role)
returns public.user_roles
language plpgsql
security definer
set search_path = public
as $$
declare result public.user_roles;
declare previous public.app_role;
begin
  if auth.uid() is null or not public.has_role('admin') then
    raise exception using errcode = '42501', message = 'ADMIN_ROLE_REQUIRED';
  end if;
  select role into previous from public.user_roles where user_id = p_target_user_id;
  if previous is null then
    insert into public.user_roles(user_id, role) values (p_target_user_id, p_role) returning * into result;
  else
    update public.user_roles set role = p_role where user_id = p_target_user_id returning * into result;
  end if;
  insert into public.audit_logs(actor_user_id, action, target_type, target_id, metadata)
  values (auth.uid(), 'user.role_change', 'user', p_target_user_id::text,
    jsonb_build_object('from', previous, 'to', p_role));
  return result;
end;
$$;

create or replace function public.moderate_comment(p_comment_id uuid, p_deleted boolean default true)
returns public.comments
language plpgsql
security definer
set search_path = public
as $$
declare result public.comments;
begin
  if auth.uid() is null or not public.has_role('editor') then
    raise exception using errcode = '42501', message = 'EDITOR_ROLE_REQUIRED';
  end if;
  update public.comments set deleted_at = case when p_deleted then coalesce(deleted_at, now()) else null end
   where id = p_comment_id returning * into result;
  if result.id is null then raise exception using errcode = 'P0002', message = 'COMMENT_NOT_FOUND'; end if;
  return result;
end;
$$;

-- Row Level Security: all user-controlled access paths are protected here,
-- independently of UI visibility or route guards.
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.games enable row level security;
alter table public.wiki_pages enable row level security;
alter table public.wiki_revisions enable row level security;
alter table public.wiki_edit_proposals enable row level security;
alter table public.wiki_edit_locks enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reports enable row level security;
alter table public.favorites enable row level security;
alter table public.user_history enable row level security;
alter table public.save_data enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role('admin'));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists user_roles_select_self_or_admin on public.user_roles;
create policy user_roles_select_self_or_admin on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role('admin'));

drop policy if exists games_public_read on public.games;
create policy games_public_read on public.games for select to anon, authenticated using (is_published or public.has_role('editor'));
drop policy if exists games_editor_insert on public.games;
create policy games_editor_insert on public.games for insert to authenticated with check (public.has_role('editor'));
drop policy if exists games_editor_update on public.games;
create policy games_editor_update on public.games for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
drop policy if exists games_admin_delete on public.games;
create policy games_admin_delete on public.games for delete to authenticated using (public.has_role('admin'));

drop policy if exists wiki_pages_public_read on public.wiki_pages;
create policy wiki_pages_public_read on public.wiki_pages for select to anon, authenticated
  using ((status = 'published' and deleted_at is null) or public.has_role('editor'));
drop policy if exists wiki_pages_editor_insert on public.wiki_pages;
create policy wiki_pages_editor_insert on public.wiki_pages for insert to authenticated
  with check (public.has_role('editor') and created_by = auth.uid());
drop policy if exists wiki_pages_editor_update on public.wiki_pages;
create policy wiki_pages_editor_update on public.wiki_pages for update to authenticated
  using (public.has_role('editor')) with check (public.has_role('editor'));
drop policy if exists wiki_pages_admin_delete on public.wiki_pages;
create policy wiki_pages_admin_delete on public.wiki_pages for delete to authenticated
  using (public.has_role('admin'));

drop policy if exists wiki_revisions_editor_read on public.wiki_revisions;
create policy wiki_revisions_editor_read on public.wiki_revisions for select to authenticated using (public.has_role('editor'));

drop policy if exists proposals_contributor_insert on public.wiki_edit_proposals;
create policy proposals_contributor_insert on public.wiki_edit_proposals for insert to authenticated
  with check (public.has_role('contributor') and proposer_user_id = auth.uid());
drop policy if exists proposals_owner_read on public.wiki_edit_proposals;
create policy proposals_owner_read on public.wiki_edit_proposals for select to authenticated
  using (proposer_user_id = auth.uid() or public.has_role('editor'));
drop policy if exists proposals_owner_update on public.wiki_edit_proposals;
create policy proposals_owner_update on public.wiki_edit_proposals for update to authenticated
  using ((proposer_user_id = auth.uid() and status = 'open') or public.has_role('editor'))
  with check (proposer_user_id = auth.uid() or public.has_role('editor'));

drop policy if exists edit_locks_authenticated_read on public.wiki_edit_locks;
create policy edit_locks_authenticated_read on public.wiki_edit_locks for select to authenticated using (public.has_role('editor'));
drop policy if exists edit_locks_editor_insert on public.wiki_edit_locks;
create policy edit_locks_editor_insert on public.wiki_edit_locks for insert to authenticated with check (public.has_role('editor') and user_id = auth.uid());
drop policy if exists edit_locks_editor_update on public.wiki_edit_locks;
create policy edit_locks_editor_update on public.wiki_edit_locks for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor') and user_id = auth.uid());
drop policy if exists edit_locks_owner_delete on public.wiki_edit_locks;
create policy edit_locks_owner_delete on public.wiki_edit_locks for delete to authenticated using (user_id = auth.uid() or public.has_role('admin'));

drop policy if exists comments_public_read on public.comments;
create policy comments_public_read on public.comments for select to anon, authenticated
  using (deleted_at is null and exists (
    select 1 from public.wiki_pages wp
    where wp.id = page_id and ((wp.status = 'published' and wp.deleted_at is null) or public.has_role('editor'))
  ));
drop policy if exists comments_user_insert on public.comments;
create policy comments_user_insert on public.comments for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.wiki_pages wp
    where wp.id = page_id and wp.status = 'published' and wp.deleted_at is null
  ));
drop policy if exists comments_owner_update on public.comments;
create policy comments_owner_update on public.comments for update to authenticated
  using (user_id = auth.uid() and deleted_at is null)
  with check (user_id = auth.uid() and deleted_at is null);
drop policy if exists comments_owner_delete on public.comments;
create policy comments_owner_delete on public.comments for delete to authenticated using (user_id = auth.uid());
drop policy if exists comments_moderator_update on public.comments;
create policy comments_moderator_update on public.comments for update to authenticated
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists reports_owner_insert on public.comment_reports;
create policy reports_owner_insert on public.comment_reports for insert to authenticated
  with check (reporter_user_id = auth.uid() and exists (
    select 1 from public.comments c
    join public.wiki_pages wp on wp.id = c.page_id
    where c.id = comment_id and c.deleted_at is null
      and wp.status = 'published' and wp.deleted_at is null
  ));
drop policy if exists reports_owner_read on public.comment_reports;
create policy reports_owner_read on public.comment_reports for select to authenticated using (reporter_user_id = auth.uid() or public.has_role('editor'));
drop policy if exists reports_moderator_update on public.comment_reports;
create policy reports_moderator_update on public.comment_reports for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists favorites_owner_all on public.favorites;
create policy favorites_owner_all on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists history_owner_all on public.user_history;
create policy history_owner_all on public.user_history for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists saves_owner_all on public.save_data;
create policy saves_owner_all on public.save_data for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.has_role('admin'));

grant usage on schema public to anon, authenticated;
grant select on public.games, public.wiki_pages, public.comments to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles, public.wiki_revisions, public.wiki_edit_proposals, public.wiki_edit_locks, public.comment_reports to authenticated;
grant insert, update on public.wiki_edit_proposals to authenticated;
grant insert, update, delete on public.wiki_edit_locks to authenticated;
grant insert, update, delete on public.comments to authenticated;
grant insert, update on public.comment_reports to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert on public.user_history to authenticated;
grant select, insert, update on public.save_data to authenticated;
grant select on public.audit_logs to authenticated;
revoke execute on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to anon, authenticated;
revoke execute on function public.update_wiki_page(uuid, integer, text, text, jsonb, public.wiki_page_status, text) from public;
revoke execute on function public.restore_wiki_revision(uuid, uuid, integer, text) from public;
revoke execute on function public.acquire_wiki_edit_lock(uuid, integer) from public;
revoke execute on function public.record_page_view(uuid) from public;
revoke execute on function public.upsert_save_data(uuid, text, jsonb, integer) from public;
revoke execute on function public.set_user_role(uuid, public.app_role) from public;
revoke execute on function public.moderate_comment(uuid, boolean) from public;
grant execute on function public.update_wiki_page(uuid, integer, text, text, jsonb, public.wiki_page_status, text) to authenticated;
grant execute on function public.restore_wiki_revision(uuid, uuid, integer, text) to authenticated;
grant execute on function public.acquire_wiki_edit_lock(uuid, integer) to authenticated;
grant execute on function public.record_page_view(uuid) to authenticated;
grant execute on function public.upsert_save_data(uuid, text, jsonb, integer) to authenticated;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;
grant execute on function public.moderate_comment(uuid, boolean) to authenticated;
grant execute on function public.current_role() to anon, authenticated;

-- Private buckets: clients must use Storage RLS or signed URLs; no public URL
-- can expose wiki assets or per-user save attachments by accident.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('wiki-assets', 'wiki-assets', false, 10485760, array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']),
  ('user-avatars', 'user-avatars', false, 2097152, array['image/png','image/jpeg','image/webp']),
  ('user-private', 'user-private', false, 10485760, array['application/json','image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists wiki_assets_staff_select on storage.objects;
create policy wiki_assets_staff_select on storage.objects for select to authenticated
  using (bucket_id = 'wiki-assets' and public.has_role('editor'));
drop policy if exists wiki_assets_staff_insert on storage.objects;
create policy wiki_assets_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'wiki-assets' and public.has_role('editor'));
drop policy if exists wiki_assets_staff_update on storage.objects;
create policy wiki_assets_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'wiki-assets' and public.has_role('editor')) with check (bucket_id = 'wiki-assets' and public.has_role('editor'));
drop policy if exists wiki_assets_staff_delete on storage.objects;
create policy wiki_assets_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'wiki-assets' and public.has_role('editor'));

drop policy if exists avatars_owner_select on storage.objects;
create policy avatars_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_owner_insert on storage.objects;
create policy avatars_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists private_files_owner_select on storage.objects;
create policy private_files_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'user-private' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists private_files_owner_insert on storage.objects;
create policy private_files_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'user-private' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists private_files_owner_update on storage.objects;
create policy private_files_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'user-private' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'user-private' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists private_files_owner_delete on storage.objects;
create policy private_files_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'user-private' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.wiki_pages replica identity full;
alter table public.wiki_edit_locks replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.wiki_pages;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.wiki_edit_locks;
exception when duplicate_object then null;
end $$;
