"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/browser";

type LivePage = { id: string; slug: string; title: string; summary: string; updated_at: string; content: unknown };

function sections(content: unknown) {
  if (!content || typeof content !== "object" || !Array.isArray((content as { sections?: unknown }).sections)) return [];
  return (content as { sections: Array<{ heading?: unknown; body?: unknown }> }).sections
    .filter((section) => section && typeof section === "object")
    .map((section) => ({ heading: typeof section.heading === "string" ? section.heading : "", body: typeof section.body === "string" ? section.body : "" }))
    .filter((section) => section.heading || section.body)
    .slice(0, 3);
}

export function LiveWikiPages({ gameSlug }: { gameSlug: string }) {
  const [pages, setPages] = useState<LivePage[]>([]);
  const [available, setAvailable] = useState(false);

  const load = useCallback(async () => {
    try {
      const client = getSupabase();
      const { data: game } = await client.from("games").select("id").eq("slug", gameSlug).eq("is_published", true).maybeSingle();
      if (!game) return;
      const { data, error } = await client.from("wiki_pages").select("id,slug,title,summary,updated_at,content").eq("game_id", game.id).eq("status", "published").is("deleted_at", null).order("updated_at", { ascending: false }).limit(12);
      if (error) throw error;
      setPages((data ?? []) as LivePage[]); setAvailable(true);
    } catch { setAvailable(false); }
  }, [gameSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (!available || !pages.length) return null;
  return <section className="live-wiki-section" aria-labelledby="live-wiki-title"><div className="live-wiki-heading"><div><p className="kicker">SUPABASE / PUBLISHED DATA</p><h2 id="live-wiki-title" className="section-title">公開中の最新 Wiki</h2></div><span className="badge badge-accent">LIVE</span></div><div className="live-wiki-grid">{pages.map((page) => <article className="live-wiki-card" key={page.id}><h3><Link href={`/wiki?game=${encodeURIComponent(gameSlug)}&slug=${encodeURIComponent(page.slug)}`}>{page.title}</Link></h3><p>{page.summary}</p>{sections(page.content).map((section) => <div className="live-wiki-section-preview" key={`${page.id}-${section.heading}`}><strong>{section.heading}</strong><span>{section.body}</span></div>)}<small>更新: {new Date(page.updated_at).toLocaleString("ja-JP")}</small></article>)}</div></section>;
}
