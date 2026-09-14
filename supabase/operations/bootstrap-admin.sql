-- One-time production bootstrap for the first administrator.
-- Run only after confirming the target account in Supabase Auth > Users.
-- Replace the UUID below with that account's UUID. Do not use an email-only
-- lookup and do not put a password, token, or service-role key in this file.

begin;

-- Review the target before changing anything:
select id, email, created_at
from auth.users
where id = '00000000-0000-0000-0000-000000000000'::uuid;

-- After the review returns exactly the intended account, replace the UUID in
-- the next statement and execute it. This is the only initial privilege
-- bootstrap; later changes must go through the admin-role Edge Function.
insert into public.user_roles(user_id, role)
values ('00000000-0000-0000-0000-000000000000'::uuid, 'admin'::public.app_role)
on conflict (user_id) do update set role = excluded.role;

-- Verify the result, then commit manually. Use ROLLBACK if the UUID was wrong.
select user_id, role, updated_at
from public.user_roles
where user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- COMMIT;
-- ROLLBACK;
