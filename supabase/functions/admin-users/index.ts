import { caughtError, errorResponse, bearer, json, options } from "../_shared/http.ts";
import { requireRole, requireUser, serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return options();
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", 405);
  try {
    const { client, user } = await requireUser(bearer(request));
    await requireRole(client, user.id, "admin");
    const body = await request.json().catch(() => ({}));
    const page = Math.max(1, Number.isInteger(body.page) ? body.page : 1);
    const perPage = Math.min(100, Math.max(1, Number.isInteger(body.per_page) ? body.per_page : 50));
    const admin = serviceClient();
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({ page, perPage });
    if (authError) return errorResponse("USER_LIST_FAILED", 400);
    const ids = authData.users.map((account) => account.id);
    if (!ids.length) return json({ users: [], page, per_page: perPage });
    const [{ data: profiles }, { data: roles }, { data: customizations }] = await Promise.all([
      admin.from("profiles").select("id,display_name,avatar_path,bio,updated_at").in("id", ids),
      admin.from("user_roles").select("user_id,role,updated_at").in("user_id", ids),
      admin.from("profile_customizations").select("user_id,profile_key,display_title,introduction,badge,theme,is_active,updated_at").in("user_id", ids),
    ]);
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const roleById = new Map((roles ?? []).map((role) => [role.user_id, role]));
    const customizationById = new Map((customizations ?? []).map((profile) => [profile.user_id, profile]));
    return json({
      users: authData.users.map((account) => ({
        id: account.id,
        email: account.email,
        created_at: account.created_at,
        last_sign_in_at: account.last_sign_in_at,
        profile: profileById.get(account.id) ?? null,
        role: roleById.get(account.id)?.role ?? "user",
        customization: customizationById.get(account.id) ?? null,
      })),
      page,
      per_page: perPage,
      total: authData.total,
    });
  } catch (error) {
    return caughtError(error);
  }
});
