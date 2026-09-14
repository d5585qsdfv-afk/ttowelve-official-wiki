"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createWikiPage, saveWikiPage } from "@/lib/supabase/wiki";
import { getSupabase } from "@/lib/supabase/browser";

type Game = { id: string; slug: string; title: string };
type Page = { id: string; game_id: string; slug: string; title: string; summary: string; content: Record<string, unknown>; status: "draft" | "published" | "archived"; version: number; updated_at: string };
type Draft = { gameId: string; slug: string; title: string; summary: string; contentText: string; status: Page["status"] };

const emptyDraft: Draft = { gameId: "", slug: "", title: "", summary: "", contentText: '{\n  "sections": []\n}', status: "draft" };
function toDraft(page: Page): Draft { return { gameId: page.game_id, slug: page.slug, title: page.title, summary: page.summary, contentText: JSON.stringify(page.content ?? {}, null, 2), status: page.status }; }

export default function AdminWikiPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [message, setMessage] = useState("Wikiデータを読み込んでいます…");
  const [busy, setBusy] = useState(false);
  const selected = useMemo(() => pages.find((page) => page.id === selectedId) ?? null, [pages, selectedId]);

  const load = useCallback(async () => {
    try {
      const client = getSupabase();
      const [{ data: gameRows, error: gameError }, { data: pageRows, error: pageError }] = await Promise.all([
        client.from("games").select("id,slug,title").order("title"),
        client.from("wiki_pages").select("id,game_id,slug,title,summary,content,status,version,updated_at").is("deleted_at", null).order("updated_at", { ascending: false }),
      ]);
      if (gameError) throw gameError;
      if (pageError) throw pageError;
      const nextGames = (gameRows ?? []) as Game[];
      const nextPages = (pageRows ?? []) as Page[];
      setGames(nextGames); setPages(nextPages);
      if (!draft.gameId && nextGames[0]) setDraft({ ...emptyDraft, gameId: nextGames[0].id });
      setMessage(`${nextPages.length}件のWikiページ`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Wikiデータを取得できません。editor権限を確認してください。"); }
  }, [draft.gameId]);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  function selectPage(page: Page) { setSelectedId(page.id); setDraft(toDraft(page)); }
  function newPage() { setSelectedId(""); setDraft({ ...emptyDraft, gameId: games[0]?.id ?? "" }); setMessage("新規ページを作成します。"); }

  async function save() {
    if (!draft.gameId || !draft.slug.trim() || !draft.title.trim()) { setMessage("ゲーム、slug、タイトルは必須です。"); return; }
    let content: Record<string, unknown>;
    try { content = JSON.parse(draft.contentText) as Record<string, unknown>; } catch { setMessage("content は有効な JSON にしてください。"); return; }
    setBusy(true); setMessage("保存しています…");
    try {
      if (selected) await saveWikiPage({ page_id: selected.id, expected_version: selected.version, title: draft.title, summary: draft.summary, content, status: draft.status, change_note: "Admin Wiki editor" });
      else await createWikiPage({ game_id: draft.gameId, slug: draft.slug, title: draft.title, summary: draft.summary, content, status: draft.status });
      setMessage("保存しました。"); await load();
    } catch (error) {
      const err = error as Error & { status?: number };
      setMessage(err.status === 409 || err.message === "WIKI_VERSION_CONFLICT" ? "別の編集者が先に更新しました。最新ページを再取得して内容を確認してください。" : err.message || "保存できませんでした。");
    } finally { setBusy(false); }
  }

  return <main id="main-content" className="admin-page"><header className="page-heading"><div><p className="kicker">ADMIN / WIKI EDITOR</p><h1>Wiki 編集</h1><p>editor/admin が公開 Wiki を管理します。保存時は version を照合し、古い内容による上書きを拒否します。</p></div><button className="primary admin-action" type="button" onClick={newPage}>新規ページ</button></header><div className="admin-layout"><section className="info-panel" aria-labelledby="wiki-list-title"><h2 id="wiki-list-title" className="section-title">ページ一覧</h2><p className="form-message" role="status">{message}</p><div className="admin-account-list">{pages.map((page) => <button className="admin-account" data-selected={page.id === selectedId} type="button" key={page.id} onClick={() => selectPage(page)}><strong>{page.title}</strong><span>{page.slug}</span><small>{page.status} / v{page.version}</small></button>)}</div></section><section className="info-panel" aria-labelledby="wiki-edit-title"><h2 id="wiki-edit-title" className="section-title">{selected ? `${selected.title} を編集` : "新規 Wiki ページ"}</h2><label><span>ゲーム</span><select value={draft.gameId} disabled={Boolean(selected)} onChange={(event) => setDraft({ ...draft, gameId: event.target.value })}>{games.map((game) => <option value={game.id} key={game.id}>{game.title}</option>)}</select></label><label><span>slug</span><input value={draft.slug} disabled={Boolean(selected)} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} maxLength={81} /></label><label><span>タイトル</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} maxLength={200} /></label><label><span>概要</span><textarea value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} maxLength={1000} rows={3} /></label><label><span>公開状態</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft["status"] })}><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></select></label><label><span>本文 JSON</span><textarea className="wiki-json-editor" value={draft.contentText} onChange={(event) => setDraft({ ...draft, contentText: event.target.value })} rows={14} spellCheck={false} /></label><button className="primary admin-action" type="button" disabled={busy} onClick={() => { void save(); }}>{busy ? "保存中…" : "Wikiを保存"}</button>{selected && <p className="admin-account-id">現在の version: {selected.version} / 最終更新: {selected.updated_at}</p>}</section></div></main>;
}
