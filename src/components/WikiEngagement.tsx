"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/supabase/auth";
import { recordPageView } from "@/lib/supabase/wiki";
import { setFavorite } from "@/lib/supabase/user";
import { getSupabase } from "@/lib/supabase/browser";

export function WikiEngagement({ pageId }: { pageId: string }) {
  const [signedIn, setSignedIn] = useState(false);
  const [favorite, setFavoriteState] = useState(false);
  const [message, setMessage] = useState("");
  const [remoteUpdate, setRemoteUpdate] = useState(false);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<ReturnType<typeof getSupabase>["channel"]> | undefined;
    const load = async () => {
      const { data } = await getSession();
      if (!active) return;
      setSignedIn(Boolean(data.session));
      channel = getSupabase().channel(`wiki-page-${pageId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "wiki_pages", filter: `id=eq.${pageId}` }, () => { if (active) setRemoteUpdate(true); }).subscribe();
      if (!data.session) return;
      void recordPageView(pageId);
      const result = await getSupabase().from("favorites").select("page_id").eq("page_id", pageId).maybeSingle();
      if (active && !result.error) setFavoriteState(Boolean(result.data));
    };
    void load().catch(() => undefined);
    return () => { active = false; if (channel) void getSupabase().removeChannel(channel); };
  }, [pageId]);

  async function toggleFavorite() {
    if (!signedIn) return;
    const next = !favorite;
    const { data } = await getSession();
    if (!data.session) return;
    const result = await setFavorite(pageId, data.session.user.id, next);
    if (result.error) { setMessage("お気に入りを更新できません。"); return; }
    setFavoriteState(next); setMessage(next ? "お気に入りに追加しました。" : "お気に入りから外しました。");
  }

  return <div className="wiki-engagement"><button type="button" className="header-button" disabled={!signedIn} onClick={() => { void toggleFavorite(); }} aria-pressed={favorite}>☆ {favorite ? "お気に入り済み" : "お気に入り"}</button>{!signedIn && <Link className="header-link" href="/auth">ログインして保存</Link>}{remoteUpdate && <span className="realtime-notice" role="status">別の編集者が更新しました。再読み込みしてください。</span>}{message && <small role="status">{message}</small>}</div>;
}
