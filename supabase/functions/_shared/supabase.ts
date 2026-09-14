import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export function userClient(accessToken: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function serviceClient(): SupabaseClient {
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function requireUser(accessToken: string | null) {
  if (!accessToken) throw new Error("AUTH_REQUIRED");
  const client = userClient(accessToken);
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("AUTH_REQUIRED");
  return { client, user: data.user as User };
}

export async function requireRole(client: SupabaseClient, userId: string, minimum: "editor" | "admin") {
  const { data, error } = await client.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (error || !data || !atLeast(data.role, minimum)) throw new Error(`${minimum.toUpperCase()}_ROLE_REQUIRED`);
}

function atLeast(role: string, minimum: "editor" | "admin") {
  const rank: Record<string, number> = { guest: 0, user: 10, contributor: 20, editor: 30, admin: 40 };
  return (rank[role] ?? 0) >= rank[minimum];
}
