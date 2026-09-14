import { getSupabase } from "./browser";

function functionError(error: unknown, fallback: string) {
  const status = typeof error === "object" && error !== null && "context" in error
    ? (error as { context?: { status?: number } }).context?.status
    : undefined;
  const result = new Error(status === 409 ? "WIKI_VERSION_CONFLICT" : fallback) as Error & { status?: number };
  result.status = status;
  return result;
}

export type WikiSaveInput = {
  page_id: string;
  expected_version: number;
  title: string;
  summary?: string;
  content: Record<string, unknown>;
  status?: "draft" | "published" | "archived";
  change_note?: string;
};

export async function fetchPublishedWikiPages(gameId: string) {
  return getSupabase().from("wiki_pages").select("*").eq("game_id", gameId).eq("status", "published").is("deleted_at", null).order("title");
}

export async function saveWikiPage(input: WikiSaveInput) {
  const { data, error } = await getSupabase().functions.invoke("wiki-save", { body: input });
  if (error) throw functionError(error, error.message || "WIKI_SAVE_FAILED");
  return data as { page: Record<string, unknown> };
}

export async function createWikiPage(input: { game_id: string; slug: string; title: string; summary?: string; content: Record<string, unknown>; status?: "draft" | "published" | "archived" }) {
  const { data, error } = await getSupabase().functions.invoke("wiki-create", { body: input });
  if (error) throw functionError(error, error.message || "WIKI_CREATE_FAILED");
  return data as { page: Record<string, unknown> };
}

export async function restoreWikiRevision(pageId: string, revisionId: string, expectedVersion: number, changeNote?: string) {
  const { data, error } = await getSupabase().functions.invoke("wiki-restore", {
    body: { page_id: pageId, revision_id: revisionId, expected_version: expectedVersion, change_note: changeNote },
  });
  if (error) throw functionError(error, error.message || "WIKI_RESTORE_FAILED");
  return data as { page: Record<string, unknown> };
}

export const recordPageView = (pageId: string) => getSupabase().rpc("record_page_view", { p_page_id: pageId });
export const saveCloudData = (gameId: string, saveKey: string, data: Record<string, unknown>, expectedVersion?: number) =>
  getSupabase().rpc("upsert_save_data", { p_game_id: gameId, p_save_key: saveKey, p_data: data, p_expected_version: expectedVersion });
