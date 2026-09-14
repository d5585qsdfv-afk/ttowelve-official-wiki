-- Requires psql variables user_a and user_b containing existing auth.users IDs.
-- The script intentionally fails closed: an unexpected successful access raises.

\set ON_ERROR_STOP on
begin;
set local role authenticated;

select set_config('request.jwt.claims', json_build_object('sub', :'user_a', 'role', 'authenticated')::text, true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('test.user_a', :'user_a', true);
select set_config('test.user_b', :'user_b', true);
select set_config('test.user_contributor', :'user_contributor', true);
select set_config('test.user_editor', :'user_editor', true);
select set_config('test.user_admin', :'user_admin', true);

do $$
declare v_game_id uuid; v_page_id uuid; save_count integer;
begin
  select id into v_game_id from public.games where slug = 'juno';
  select wp.id into v_page_id from public.wiki_pages wp where wp.game_id = v_game_id and wp.slug = 'welcome';
  if v_game_id is null or v_page_id is null then raise exception 'seed is missing'; end if;
  insert into public.save_data(user_id, game_id, save_key, data) values (current_setting('test.user_a')::uuid, v_game_id, 'rls-test', '{"owner":"a"}');
  select count(*) into save_count from public.save_data where user_id = current_setting('test.user_a')::uuid and save_key = 'rls-test';
  if save_count <> 1 then raise exception 'user A cannot read own save'; end if;
end $$;

select set_config('request.jwt.claims', json_build_object('sub', :'user_b', 'role', 'authenticated')::text, true);
do $$
declare v_page_id uuid; visible_count integer; changed integer;
begin
  select id into v_page_id from public.wiki_pages where slug = 'welcome' limit 1;
  select count(*) into visible_count from public.save_data where user_id = current_setting('test.user_a')::uuid and save_key = 'rls-test';
  if visible_count <> 0 then raise exception 'IDOR: user B can read user A save'; end if;
  update public.save_data set data = '{"owner":"b"}' where user_id = current_setting('test.user_a')::uuid and save_key = 'rls-test';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'IDOR: user B can update user A save'; end if;
  begin
    perform public.update_wiki_page(v_page_id, 1, 'no', '', '{}');
    raise exception 'permission: user can edit wiki';
  exception when others then
    if sqlerrm not like '%EDITOR_ROLE_REQUIRED%' and sqlstate <> '42501' then raise; end if;
  end;
end $$;

select set_config('request.jwt.claims', json_build_object('sub', :'user_contributor', 'role', 'authenticated')::text, true);
do $$
declare v_game_id uuid; v_page_id uuid;
begin
  select id into v_game_id from public.games where slug = 'juno';
  select id into v_page_id from public.wiki_pages where slug = 'welcome' limit 1;
  begin
    insert into public.wiki_pages(game_id, slug, title, created_by) values (v_game_id, 'blocked-by-rls', 'blocked', current_setting('test.user_contributor')::uuid);
    raise exception 'permission: contributor inserted wiki page';
  exception when others then
    if sqlstate not in ('42501', 'P0001') or sqlerrm like 'permission: contributor%' then raise; end if;
  end;
  begin
    perform public.set_user_role(current_setting('test.user_a')::uuid, 'admin');
    raise exception 'privilege escalation: contributor changed role';
  exception when others then
    if sqlerrm not like '%ADMIN_ROLE_REQUIRED%' and sqlstate <> '42501' and sqlerrm not like 'privilege escalation:%' then raise; end if;
  end;
end $$;

select set_config('request.jwt.claims', json_build_object('sub', :'user_editor', 'role', 'authenticated')::text, true);
do $$
begin
  begin
    perform public.set_user_role(current_setting('test.user_a')::uuid, 'admin');
    raise exception 'privilege escalation: editor changed role';
  exception when others then
    if sqlerrm not like '%ADMIN_ROLE_REQUIRED%' and sqlstate <> '42501' and sqlerrm not like 'privilege escalation:%' then raise; end if;
  end;
end $$;

select set_config('request.jwt.claims', json_build_object('sub', :'user_admin', 'role', 'authenticated')::text, true);
do $$
begin
  perform public.set_user_role(current_setting('test.user_a')::uuid, 'user');
  insert into public.wiki_pages(game_id, slug, title, created_by)
  select id, 'rls-draft-check', 'RLS draft check', current_setting('test.user_admin')::uuid
  from public.games where slug = 'juno'
  on conflict (game_id, slug) do nothing;
end $$;

select set_config('request.jwt.claims', json_build_object('sub', :'user_a', 'role', 'anon')::text, true);
set local role anon;
do $$
declare draft_count integer;
begin
  select count(*) into draft_count from public.wiki_pages where status <> 'published';
  if draft_count <> 0 then raise exception 'IDOR: guest can read non-public Wiki'; end if;
end $$;

rollback;
