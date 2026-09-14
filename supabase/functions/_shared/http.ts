export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function options() {
  return new Response("ok", { headers: corsHeaders });
}

export function bearer(request: Request) {
  const value = request.headers.get("Authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : null;
}

export function errorResponse(message: string, status = 400) {
  return json({ error: message }, status);
}

export function caughtError(error: unknown) {
  const message = error instanceof Error ? error.message : "REQUEST_FAILED";
  const status = message === "AUTH_REQUIRED" ? 401 : message.endsWith("_ROLE_REQUIRED") ? 403 : 400;
  return errorResponse(message, status);
}
