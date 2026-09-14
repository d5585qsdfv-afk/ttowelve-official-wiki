import { caughtError, errorResponse, bearer, json, options } from "../_shared/http.ts";
import { requireRole, requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return options();
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", 405);
  try {
    const { client, user } = await requireUser(bearer(request));
    await requireRole(client, user.id, "admin");
    const body = await request.json();
    const allowed = ["guest", "user", "contributor", "editor", "admin"];
    if (typeof body.user_id !== "string" || !allowed.includes(body.role)) return errorResponse("INVALID_ROLE_REQUEST", 422);
    const { data, error } = await client.rpc("set_user_role", { p_target_user_id: body.user_id, p_role: body.role });
    if (error) return errorResponse(error.message.includes("ADMIN_ROLE_REQUIRED") ? "ADMIN_ROLE_REQUIRED" : "ROLE_UPDATE_FAILED", error.message.includes("ADMIN_ROLE_REQUIRED") ? 403 : 400);
    return json({ user_role: data });
  } catch (error) {
    return caughtError(error);
  }
});
