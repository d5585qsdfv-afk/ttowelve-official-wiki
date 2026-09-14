"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/browser";
import { WikiComments } from "@/components/WikiComments";
import { WikiEngagement } from "@/components/WikiEngagement";

type Page = { id: string; title: string; slug: string; summary: string; updated_at: string; content: unknown };
type Section = { heading: string; body: string; tone?: string };

function readSections(content: unknown): Section[] {
  if (!content || typeof content !== "object" || !Array.isArray((content as { sections?: unknown }).sections)) return [];
  return (content as { sections: Array<{ heading?: unknown; body?: unknown; tone?: unknown }> }).sections
    .filter((section) => section && typeof section === "object")
    .map((section) => ({ heading: typeof section.heading === "string" ? section.heading : "", body: typeof section.body === "string" ? section.body : "", tone: typeof section.tone === "string" ? section.tone : undefined }))
    .filter((section) => section.heading || section.body);
}

export default function LiveWikiDetailPage() {
  const [page, setPage] = useState<Page | null>(null);
  const [message, setMessage] = useState("公開 Wiki を読み込んでいます…");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const gameSlug = params.get("game");
    const slug = params.get("slug");
    const load = async () => {
      if (!gameSlug || !slug) { setMessage("Wiki ページを指定してください。"); return; }
      const { data: game, error: gameError } = await getSupabase().from("games").select("id").eq("slug", gameSlug).eq("is_published", true).maybeSingle();
      if (gameError || !game) throw gameError ?? new Error("GAME_NOT_FOUND");
      const result = await getSupabase().from("wiki_pages").select("id,title,slug,summary,updated_at,content").eq("game_id", game.id).eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
      if (result.error || !result.data) throw result.error ?? new Error("WIKI_NOT_FOUND");
      if (active) { setPage(result.data as Page); setMessage(""); }
    };
    const timer = window.setTimeout(() => { void load().catch((error: unknown) => { if (active) setMessage(error instanceof Error && error.message === "WIKI_NOT_FOUND" ? "この Wiki は公開されていないか、存在しません。" : "公開 Wiki を読み込めませんでした。"); }); }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  if (!page) return <main id="main-content" className="auth-page"><section className="auth-card"><p className="kicker">SUPABASE / WIKI</p><h1>公開 Wiki</h1><p className="auth-lead" role="status">{message}</p><p className="auth-back"><Link href="/games/juno">ゲーム Wiki へ戻る</Link></p></section></main>;
  return <main id="main-content" className="live-wiki-detail"><p className="kicker">SUPABASE / PUBLISHED WIKI</p><h1>{page.title}</h1><p className="live-wiki-detail-summary">{page.summary}</p><WikiEngagement pageId={page.id} /><div className="live-wiki-detail-sections">{readSections(page.content).map((section, index) => <section className="detail-section" data-tone={section.tone === "warning" ? "warning" : section.tone === "note" ? "note" : undefined} key={`${section.heading}-${index}`}><h2>{section.heading}</h2><p>{section.body}</p></section>)}</div><p className="live-wiki-detail-updated">最終更新: {new Date(page.updated_at).toLocaleString("ja-JP")}</p><WikiComments pageId={page.id} /><Link className="badge badge-accent" href="/games/juno">ゲーム Wiki へ戻る</Link></main>;
}
