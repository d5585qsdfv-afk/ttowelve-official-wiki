# Supabase integration tests

`rls.sql` は実際の Supabase project に接続して実行する RLS/API テストです。
Supabase CLI のローカル DB、または検証用 project で、次の検証ユーザーを作成してから実行してください。

- `TEST_USER_A`: user
- `TEST_USER_B`: user
- `TEST_USER_CONTRIBUTOR`: contributor
- `TEST_USER_EDITOR`: editor
- `TEST_USER_ADMIN`: admin

Auth ユーザー作成後、検証 project の管理経路で contributor/editor/admin の role を設定します。本番ユーザーを使わないでください。

```powershell
supabase start
supabase db reset
psql "$env:SUPABASE_DB_URL" `
  -v user_a="$env:TEST_USER_A" -v user_b="$env:TEST_USER_B" `
  -v user_contributor="$env:TEST_USER_CONTRIBUTOR" `
  -v user_editor="$env:TEST_USER_EDITOR" -v user_admin="$env:TEST_USER_ADMIN" `
  -f supabase/tests/rls.sql
```

テストは service_role ではなく、JWT の `sub` を切り替えた authenticated 相当のセッションで確認します。
service_role は RLS をバイパスするため、RLS の合否判定に使わないでください。
