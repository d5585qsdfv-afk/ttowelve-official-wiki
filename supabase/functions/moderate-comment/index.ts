import { caughtError, errorResponse, bearer, json, options } from "../_shared/http.ts";
import { requireRole, requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return options();
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", 405);
  try {
    const { client, user } = await requireUser(bearer(request));
    await requireRole(client, user.id, "editor");
    const body = await request.json();
    if (typeof body.comment_id !== "string") return errorResponse("INVALID_COMMENT_ID", 422);
    const { data, error } = await client.rpc("moderate_comment", { p_comment_id: body.comment_id, p_deleted: body.deleted !== false });
    if (error) return errorResponse(error.message.includes("EDITOR_ROLE_REQUIRED") ? "EDITOR_ROLE_REQUIRED" : "COMMENT_MODERATION_FAILED", error.message.includes("EDITOR_ROLE_REQUIRED") ? 403 : 400);
    return json({ comment: data });
  } catch (error) {
    return caughtError(error);
  }
});
