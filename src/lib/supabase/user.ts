import { getSupabase } from "./browser";

export type UserProfile = {
  id: string;
  display_name: string;
  avatar_path: string | null;
  bio: string | null;
};

export type ProfileCustomization = {
  user_id: string;
  profile_key: string;
  display_title: string;
  introduction: string;
  badge: string | null;
  theme: string;
  is_active: boolean;
};

export async function fetchMyProfile() {
  const supabase = getSupabase();
  const [{ data: profile, error: profileError }, { data: customization, error: customizationError }] = await Promise.all([
    supabase.from("profiles").select("id,display_name,avatar_path,bio").maybeSingle(),
    supabase.from("profile_customizations").select("user_id,profile_key,display_title,introduction,badge,theme,is_active").maybeSingle(),
  ]);
  if (profileError) throw profileError;
  if (customizationError) throw customizationError;
  return { profile: profile as UserProfile | null, customization: customization as ProfileCustomization | null };
}

export async function fetchMySaveData(gameId: string) {
  return getSupabase().from("save_data").select("game_id,save_key,data,version,updated_at").eq("game_id", gameId).order("save_key");
}

export async function fetchMyFavorites() {
  return getSupabase().from("favorites").select("page_id,created_at").order("created_at", { ascending: false });
}

export async function setFavorite(pageId: string, userId: string, favorite: boolean) {
  const supabase = getSupabase();
  if (favorite) return supabase.from("favorites").insert({ page_id: pageId, user_id: userId });
  return supabase.from("favorites").delete().eq("page_id", pageId);
}

export async function fetchComments(pageId: string) {
  return getSupabase().from("comments").select("id,page_id,user_id,content,created_at,updated_at,deleted_at").eq("page_id", pageId).is("deleted_at", null).order("created_at", { ascending: true });
}

export async function addComment(pageId: string, userId: string, content: string) {
  return getSupabase().from("comments").insert({ page_id: pageId, user_id: userId, content }).select("id,page_id,user_id,content,created_at,updated_at,deleted_at").single();
}

export async function updateComment(commentId: string, content: string) {
  return getSupabase().from("comments").update({ content }).eq("id", commentId).select("id,page_id,user_id,content,created_at,updated_at,deleted_at").single();
}

export async function deleteComment(commentId: string) {
  return getSupabase().from("comments").delete().eq("id", commentId);
}

export async function reportComment(commentId: string, reporterUserId: string, reason: string) {
  return getSupabase().from("comment_reports").insert({ comment_id: commentId, reporter_user_id: reporterUserId, reason });
}
