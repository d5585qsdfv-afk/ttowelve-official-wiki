"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/supabase/auth";
import { getSupabase } from "@/lib/supabase/browser";
import { createWikiProposal, fetchWikiProposals, reviewWikiProposal, type ProposalStatus, type WikiProposal } from "@/lib/supabase/proposals";

type Game = { id: string; title: string };
type Page = { id: string; game_id: string; title: string; summary: string; content: Record<string, unknown> };
type Role = "guest" | "user" | "contributor" | "editor" | "admin";
type Draft = { pageId: string; gameId: string; title: string; summary: string; contentText: string };

const emptyDraft: Draft = { pageId: "", gameId: "", title: "", summary: "", contentText: "{\n  \"sections\": []\n}" };
const roleRank: Record<Role, number> = { guest: 0, user: 10, contributor: 20, editor: 30, admin: 40 };
const statusLabels: Record<ProposalStatus, string> = { open: "審査待ち", accepted: "採用", rejected: "却下", withdrawn: "取り下げ" };

export default function ContributorPage() {
  const [role, setRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [proposals, setProposals] = useState<WikiProposal[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("提案データを読み込んでいます…");
  const [busy, setBusy] = useState(false);
  const canSubmit = Boolean(role && roleRank[role] >= roleRank.contributor);
  const canReview = Boolean(role && roleRank[role] >= roleRank.editor);
  const selectedPage = useMemo(() => pages.find((page) => page.id === draft.pageId) ?? null, [pages, draft.pageId]);

  const load = useCallback(async () => {
    try {
      const sessionResult = await getSession();
      const session = sessionResult.data.session;
      if (!session) { setMessage("ログインすると編集提案を作成できます。"); return; }
      setUserId(session.user.id);
      const [{ data: currentRole }, { data: gameRows, error: gameError }, { data: pageRows, error: pageError }, proposalResult] = await Promise.all([
        getSupabase().rpc("current_role"),
        getSupabase().from("games").select("id,title").eq("is_published", true).order("title"),
        getSupabase().from("wiki_pages").select("id,game_id,title,summary,content").eq("status", "published").is("deleted_at", null).order("title"),
        fetchWikiProposals(),
      ]);
      if (gameError) throw gameError;
      if (pageError) throw pageError;
      if (proposalResult.error) throw proposalResult.error;
      const nextRole = typeof currentRole === "string" ? currentRole as Role : "user";
      setRole(nextRole); setGames((gameRows ?? []) as Game[]); setPages((pageRows ?? []) as Page[]); setProposals((proposalResult.data ?? []) as WikiProposal[]);
      if (!draft.gameId && gameRows?.[0]) setDraft((current) => ({ ...current, gameId: gameRows[0].id }));
      setMessage(roleRank[nextRole] >= roleRank.contributor ? `${proposalResult.data?.length ?? 0}件の提案` : "Contributor以上のRoleが必要です。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "提案データを取得できませんでした。"); }
  }, [draft.gameId]);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  function selectPage(pageId: string) {
    const page = pages.find((item) => item.id === pageId);
    setDraft((current) => page ? { ...current, pageId, gameId: page.game_id, title: page.title, summary: page.summary, contentText: JSON.stringify(page.content ?? {}, null, 2) } : { ...current, pageId: "" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !userId) { setMessage("Contributor以上のRoleでログインしてください。"); return; }
    if (!draft.gameId || !draft.title.trim()) { setMessage("ゲームとタイトルは必須です。"); return; }
    let content: Record<string, unknown>;
    try { content = JSON.parse(draft.contentText) as Record<string, unknown>; } catch { setMessage("本文JSONが正しくありません。"); return; }
    setBusy(true); setMessage("編集提案を送信しています…");
    try { await createWikiProposal({ page_id: draft.pageId || null, game_id: draft.gameId, proposer_user_id: userId, title: draft.title.trim(), summary: draft.summary.trim(), content }); setDraft({ ...emptyDraft, gameId: games[0]?.id ?? "" }); setMessage("編集提案を送信しました。editorの審査を待ってください。"); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "編集提案を送信できませんでした。"); }
    finally { setBusy(false); }
  }

  async function review(proposal: WikiProposal, status: Exclude<ProposalStatus, "open">) {
    if (!canReview || !userId) return;
    setBusy(true); setMessage("提案を更新しています…");
    try { await reviewWikiProposal(proposal.id, userId, status, reviewNotes[proposal.id] ?? ""); setMessage(`提案を${statusLabels[status]}にしました。`); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "提案を更新できませんでした。"); }
    finally { setBusy(false); }
  }

  if (!role && message.startsWith("ログインすると")) return <main id="main-content" className="auth-page"><section className="auth-card"><p className="kicker">CONTRIBUTOR / SIGN IN</p><h1>編集提案</h1><p className="auth-lead">{message}</p><Link className="badge badge-accent" href="/auth">ログインする</Link></section></main>;

  return <main id="main-content" className="admin-page"><header className="page-heading"><div><p className="kicker">CONTRIBUTOR / WIKI PROPOSALS</p><h1>編集提案</h1><p>Contributorは公開Wikiの変更案を提出できます。editor/adminが内容を確認して採用または却下します。</p></div><Link className="header-link" href="/games/juno">Wikiへ戻る</Link></header><p className="form-message" role="status">{message}</p>{canSubmit ? <div className="admin-layout"><section className="info-panel"><h2 className="section-title">新しい編集提案</h2><form onSubmit={submit}><label><span>対象ページ（任意）</span><select value={draft.pageId} onChange={(event) => selectPage(event.target.value)}><option value="">新規ページ／対象なし</option>{pages.map((page) => <option value={page.id} key={page.id}>{page.title}</option>)}</select></label><label><span>ゲーム</span><select value={draft.gameId} disabled={Boolean(selectedPage)} onChange={(event) => setDraft({ ...draft, gameId: event.target.value })}>{games.map((game) => <option value={game.id} key={game.id}>{game.title}</option>)}</select></label><label><span>タイトル</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} maxLength={200} required /></label><label><span>概要</span><textarea value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} maxLength={1000} rows={3} /></label><label><span>変更案本文 JSON</span><textarea className="wiki-json-editor" value={draft.contentText} onChange={(event) => setDraft({ ...draft, contentText: event.target.value })} rows={14} spellCheck={false} /></label><button className="primary admin-action" type="submit" disabled={busy}>{busy ? "送信中…" : "編集提案を送信"}</button></form></section><section className="info-panel"><h2 className="section-title">提出済み提案</h2><div className="proposal-list">{proposals.map((proposal) => <article className="proposal-card" key={proposal.id}><div className="proposal-heading"><strong>{proposal.title}</strong><span className={`proposal-status proposal-${proposal.status}`}>{statusLabels[proposal.status]}</span></div><p>{proposal.summary || "概要なし"}</p><small>{new Date(proposal.created_at).toLocaleString("ja-JP")} / {proposal.proposer_user_id === userId ? "自分の提案" : `提案者 ${proposal.proposer_user_id.slice(0, 8)}`}</small><details><summary>変更案本文を表示</summary><pre>{JSON.stringify(proposal.content, null, 2)}</pre></details>{canReview && proposal.status === "open" && <><label><span>レビューコメント</span><textarea value={reviewNotes[proposal.id] ?? ""} onChange={(event) => setReviewNotes({ ...reviewNotes, [proposal.id]: event.target.value })} maxLength={1000} rows={3} /></label><div className="proposal-actions"><button className="primary" type="button" disabled={busy} onClick={() => { void review(proposal, "accepted"); }}>採用</button><button className="secondary" type="button" disabled={busy} onClick={() => { void review(proposal, "rejected"); }}>却下</button></div></>}</article>)}{!proposals.length && <p className="result-count">提出済みの提案はありません。</p>}</div></section></div> : <section className="info-panel"><p>現在のRoleでは編集提案を作成できません。管理者へContributor Roleを依頼してください。</p></section>}</main>;
}
