import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile("supabase/migrations/20260914000100_initial_wiki_backend.sql", "utf8");
const profileMigration = await readFile("supabase/migrations/20260914000200_account_profiles_and_oauth.sql", "utf8");
const env = await readFile(".env.example", "utf8");
const requiredTables = ["profiles", "user_roles", "games", "wiki_pages", "wiki_revisions", "comments", "comment_reports", "favorites", "user_history", "save_data", "audit_logs"];
for (const table of requiredTables) assert.match(migration, new RegExp(`create table if not exists public\\.${table}\\b`), `${table} table is missing`);
for (const phrase of ["enable row level security", "WIKI_VERSION_CONFLICT", "record_wiki_revision", "supabase_realtime", "storage.objects", "set_user_role", "moderate_comment"]) assert.match(migration, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")), `${phrase} is missing`);
for (const policy of ["saves_owner_all", "favorites_owner_all", "history_owner_all", "wiki_pages_public_read", "wiki_pages_editor_update", "comments_user_insert", "reports_owner_insert", "private_files_owner_select", "avatars_owner_insert", "wiki_assets_staff_insert"]) assert.match(migration, new RegExp(policy), `${policy} policy is missing`);
for (const phrase of ["prevent_comment_identity_change", "comments_prevent_identity_change", "profile_customizations_owner_read"]) assert.match(`${migration}\n${profileMigration}`, new RegExp(phrase), `${phrase} is missing`);
assert.match(profileMigration, /create table if not exists public\.profile_customizations\b/);
for (const phrase of ["profile_customizations_owner_read", "profiles_admin_update", "upsert_profile_customization", "ADMIN_ROLE_REQUIRED"]) assert.match(profileMigration, new RegExp(phrase), `${phrase} is missing from profile migration`);
assert.match(await readFile("supabase/functions/admin-users/index.ts", "utf8"), /listUsers/);
assert.match(await readFile("supabase/functions/wiki-create/index.ts", "utf8"), /create_wiki_page/);
assert.match(env, /SUPABASE_SERVICE_ROLE_KEY=replace_in_supabase_secrets_only/);
assert.doesNotMatch(env, /service_role_key\s*=\s*ey/);
console.log(`backend structure ok: ${requiredTables.length} required tables, RLS, conflict RPC, Realtime, Storage, and admin RPCs present`);
