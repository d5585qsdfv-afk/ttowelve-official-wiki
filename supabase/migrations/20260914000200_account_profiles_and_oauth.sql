-- Phase 1 follow-up: OAuth-ready accounts and administrator-managed profiles.
-- This is additive so it can be applied after the initial backend migration.

alter table public.profiles
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

create table if not exists public.profile_customizations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_key text not null unique check (profile_key ~ '^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,80}$'),
  display_title text not null default '' check (char_length(display_title) <= 120),
  introduction text not null default '' check (char_length(introduction) <= 2000),
  badge text check (badge is null or char_length(badge) <= 80),
  theme text not null default 'default' check (theme ~ '^[a-z0-9_-]{1,40}$'),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_customizations_active_idx
  on public.profile_customizations(is_active, updated_at desc);

drop trigger if exists profile_customizations_touch_updated_at on public.profile_customizations;
create trigger profile_customizations_touch_updated_at before update on public.profile_customizations
for each row execute function public.touch_updated_at();

create or replace function public.set_profile_updated_by()
returns trigger
language plpgsql
as $$
begin
  new.updated_by = coalesce(auth.uid(), new.updated_by, old.updated_by);
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_by on public.profiles;
create trigger profiles_set_updated_by before update on public.profiles
for each row execute function public.set_profile_updated_by();

create or replace function public.upsert_profile_customization(
  p_user_id uuid,
  p_profile_key text,
  p_display_title text default '',
  p_introduction text default '',
  p_badge text default null,
  p_theme text default 'default',
  p_is_active boolean default true
)
returns public.profile_customizations
language plpgsql
security definer
set search_path = public
as $$
declare result public.profile_customizations;
declare previous public.profile_customizations;
begin
  if auth.uid() is null or not public.has_role('admin') then
    raise exception using errcode = '42501', message = 'ADMIN_ROLE_REQUIRED';
  end if;
  select * into previous from public.profile_customizations where user_id = p_user_id;
  insert into public.profile_customizations(
    user_id, profile_key, display_title, introduction, badge, theme, is_active, created_by, updated_by
  ) values (
    p_user_id, left(trim(p_profile_key), 81), left(coalesce(p_display_title, ''), 120),
    left(coalesce(p_introduction, ''), 2000), left(p_badge, 80), left(coalesce(p_theme, 'default'), 40),
    coalesce(p_is_active, true), auth.uid(), auth.uid()
  )
  on conflict (user_id) do update set
    profile_key = excluded.profile_key,
    display_title = excluded.display_title,
    introduction = excluded.introduction,
    badge = excluded.badge,
    theme = excluded.theme,
    is_active = excluded.is_active,
    updated_by = auth.uid()
  returning * into result;
  insert into public.audit_logs(actor_user_id, action, target_type, target_id, metadata)
  values (
    auth.uid(), 'profile.customization_upsert', 'profile', p_user_id::text,
    jsonb_build_object('profile_key', result.profile_key, 'replaced', previous.user_id is not null)
  );
  return result;
end;
$$;

create or replace function public.delete_profile_customization(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.has_role('admin') then
    raise exception using errcode = '42501', message = 'ADMIN_ROLE_REQUIRED';
  end if;
  delete from public.profile_customizations where user_id = p_user_id;
  if not found then return false; end if;
  insert into public.audit_logs(actor_user_id, action, target_type, target_id, metadata)
  values (auth.uid(), 'profile.customization_delete', 'profile', p_user_id::text, '{}'::jsonb);
  return true;
end;
$$;

create or replace function public.create_wiki_page(
  p_game_id uuid,
  p_slug text,
  p_title text,
  p_summary text default '',
  p_content jsonb default '{}'::jsonb,
  p_status public.wiki_page_status default 'draft'
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
  insert into public.wiki_pages(game_id, slug, title, summary, content, status, created_by, updated_by)
  values (
    p_game_id, lower(trim(p_slug)), left(trim(p_title), 200), left(coalesce(p_summary, ''), 1000),
    coalesce(p_content, '{}'::jsonb), coalesce(p_status, 'draft'), auth.uid(), auth.uid()
  ) returning * into result;
  return result;
end;
$$;

alter table public.profile_customizations enable row level security;

drop policy if exists profile_customizations_owner_read on public.profile_customizations;
create policy profile_customizations_owner_read on public.profile_customizations for select to authenticated
  using (user_id = auth.uid() or public.has_role('admin'));

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

grant select on public.profile_customizations to authenticated;
revoke insert, update, delete on public.profile_customizations from public, anon, authenticated;
revoke execute on function public.upsert_profile_customization(uuid, text, text, text, text, text, boolean) from public;
revoke execute on function public.delete_profile_customization(uuid) from public;
revoke execute on function public.create_wiki_page(uuid, text, text, text, jsonb, public.wiki_page_status) from public;
grant execute on function public.upsert_profile_customization(uuid, text, text, text, text, text, boolean) to authenticated;
grant execute on function public.delete_profile_customization(uuid) to authenticated;
grant execute on function public.create_wiki_page(uuid, text, text, text, jsonb, public.wiki_page_status) to authenticated;

-- The existing on_auth_user_created trigger handles password and OAuth users
-- alike. Email stays in auth.users and is not copied into public profiles.
