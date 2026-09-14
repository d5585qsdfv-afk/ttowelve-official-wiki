import { caughtError, errorResponse, bearer, json, options } from "../_shared/http.ts";
import { requireRole, requireUser, serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return options();
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", 405);
  try {
    const { client, user } = await requireUser(bearer(request));
    await requireRole(client, user.id, "admin");
    const body = await request.json();
    if (typeof body.user_id !== "string" || typeof body.ban_duration !== "string" || !/^[0-9]+(?:s|m|h|d|w|mo|y)$/.test(body.ban_duration)) return errorResponse("INVALID_BAN_REQUEST", 422);
    const admin = serviceClient();
    const { data, error } = await admin.auth.admin.updateUserById(body.user_id, { ban_duration: body.ban_duration });
    if (error) return errorResponse("BAN_FAILED", 400);
    const { error: auditError } = await admin.from("audit_logs").insert({ actor_user_id: user.id, action: "user.ban", target_type: "user", target_id: body.user_id, metadata: { ban_duration: body.ban_duration } });
    if (auditError) return errorResponse("BAN_AUDIT_FAILED", 500);
    return json({ user: { id: data.user?.id, ban_duration: body.ban_duration } });
  } catch (error) {
    return caughtError(error);
  }
});
