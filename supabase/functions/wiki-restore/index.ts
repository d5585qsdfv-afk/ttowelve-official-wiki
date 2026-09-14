import { caughtError, errorResponse, bearer, json, options } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return options();
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", 405);
  try {
    const { client } = await requireUser(bearer(request));
    const body = await request.json();
    const { data, error } = await client.rpc("restore_wiki_revision", {
      p_page_id: body.page_id,
      p_revision_id: body.revision_id,
      p_expected_version: body.expected_version,
      p_change_note: body.change_note ?? "Restore revision",
    });
    if (error) {
      if (error.message.includes("WIKI_VERSION_CONFLICT") || error.code === "40001") return errorResponse("WIKI_VERSION_CONFLICT", 409);
      if (error.message.includes("EDITOR_ROLE_REQUIRED")) return errorResponse("EDITOR_ROLE_REQUIRED", 403);
      return errorResponse("WIKI_RESTORE_FAILED", 400);
    }
    return json({ page: data });
  } catch (error) {
    return caughtError(error);
  }
});
