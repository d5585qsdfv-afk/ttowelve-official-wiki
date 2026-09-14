import { caughtError, errorResponse, bearer, json, options } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return options();
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", 405);
  try {
    const { client } = await requireUser(bearer(request));
    const body = await request.json();
    const { data, error } = await client.rpc("create_wiki_page", {
      p_game_id: body.game_id,
      p_slug: body.slug,
      p_title: body.title,
      p_summary: body.summary ?? "",
      p_content: body.content ?? {},
      p_status: body.status ?? "draft",
    });
    if (error) {
      if (error.message.includes("EDITOR_ROLE_REQUIRED")) return errorResponse("EDITOR_ROLE_REQUIRED", 403);
      return errorResponse("WIKI_CREATE_FAILED", 400);
    }
    return json({ page: data }, 201);
  } catch (error) {
    return caughtError(error);
  }
});
