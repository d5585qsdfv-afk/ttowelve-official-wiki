import { caughtError, errorResponse, bearer, json, options } from "../_shared/http.ts";
import { requireRole, requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return options();
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", 405);
  try {
    const { client, user } = await requireUser(bearer(request));
    await requireRole(client, user.id, "admin");
    const body = await request.json();
    if (typeof body.user_id !== "string" || typeof body.profile_key !== "string") return errorResponse("INVALID_PROFILE_REQUEST", 422);
    const { data, error } = await client.rpc("upsert_profile_customization", {
      p_user_id: body.user_id,
      p_profile_key: body.profile_key,
      p_display_title: body.display_title ?? "",
      p_introduction: body.introduction ?? "",
      p_badge: body.badge ?? null,
      p_theme: body.theme ?? "default",
      p_is_active: body.is_active !== false,
    });
    if (error) return errorResponse(error.message.includes("ADMIN_ROLE_REQUIRED") ? "ADMIN_ROLE_REQUIRED" : "PROFILE_UPDATE_FAILED", error.message.includes("ADMIN_ROLE_REQUIRED") ? 403 : 400);
    return json({ profile: data });
  } catch (error) {
    return caughtError(error);
  }
});
