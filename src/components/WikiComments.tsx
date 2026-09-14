"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSession } from "@/lib/supabase/auth";
import { addComment, deleteComment, fetchComments, reportComment, updateComment } from "@/lib/supabase/user";

type Comment = { id: string; user_id: string; content: string; created_at: string; updated_at: string };

export function WikiComments({ pageId }: { pageId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("コメントを読み込んでいます…");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const load = useCallback(async () => {
    const [{ data: sessionData }, result] = await Promise.all([getSession(), fetchComments(pageId)]);
    setSession(sessionData.session);
    if (result.error) throw result.error;
    setComments((result.data ?? []) as Comment[]);
    setMessage(`${result.data?.length ?? 0}件のコメント`);
  }, [pageId]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => { void load().catch(() => { if (active) setMessage("コメントを読み込めませんでした。"); }); }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [load]);

  async function submit() {
    if (!session) return;
    const trimmed = content.trim();
    if (!trimmed) { setMessage("コメントを入力してください。"); return; }
    setBusy(true);
    try {
      const result = await addComment(pageId, session.user.id, trimmed);
      if (result.error) throw result.error;
      setContent(""); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "コメントを投稿できません。"); }
    finally { setBusy(false); }
  }

  async function saveEdit(commentId: string) {
    const trimmed = editingContent.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const result = await updateComment(commentId, trimmed);
      if (result.error) throw result.error;
      setEditingId(null); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "コメントを更新できません。"); }
    finally { setBusy(false); }
  }

  async function remove(commentId: string) {
    if (!window.confirm("このコメントを削除しますか？")) return;
    setBusy(true);
    try {
      const result = await deleteComment(commentId);
      if (result.error) throw result.error;
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "コメントを削除できません。"); }
    finally { setBusy(false); }
  }

  async function report(commentId: string) {
    if (!session) return;
    const reason = window.prompt("通報理由を入力してください（1〜500文字）", "不適切な内容")?.trim();
    if (!reason) return;
    setBusy(true);
    try {
      const result = await reportComment(commentId, session.user.id, reason);
      if (result.error) throw result.error;
      setMessage("通報を受け付けました。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "通報できません。すでに通報済みの可能性があります。"); }
    finally { setBusy(false); }
  }

  return <section className="comments-panel" aria-labelledby="comments-title"><div className="comments-heading"><h2 id="comments-title" className="section-title">コメント</h2><small>{message}</small></div><div className="comment-list">{comments.map((comment) => <article className="comment-card" key={comment.id}><div className="comment-meta"><strong>{comment.user_id === session?.user.id ? "あなた" : "Player"}</strong><time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleString("ja-JP")}</time></div>{editingId === comment.id ? <><textarea value={editingContent} onChange={(event) => setEditingContent(event.target.value)} maxLength={4000} rows={4} /><div className="comment-actions"><button type="button" className="primary" disabled={busy} onClick={() => { void saveEdit(comment.id); }}>保存</button><button type="button" className="header-button" onClick={() => setEditingId(null)}>キャンセル</button></div></> : <><p>{comment.content}</p>{session && <div className="comment-actions">{comment.user_id === session.user.id && <><button type="button" className="header-button" onClick={() => { setEditingId(comment.id); setEditingContent(comment.content); }}>編集</button><button type="button" className="header-button" disabled={busy} onClick={() => { void remove(comment.id); }}>削除</button></>}{comment.user_id !== session.user.id && <button type="button" className="header-button" disabled={busy} onClick={() => { void report(comment.id); }}>通報</button>}</div>}</>}</article>)}{!comments.length && <p className="result-count">まだコメントはありません。</p>}</div>{session ? <form className="comment-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}><label><span>コメントを投稿</span><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={4000} rows={4} placeholder="Wikiの内容についてコメントする" /></label><button type="submit" className="primary" disabled={busy}>投稿</button></form> : <p className="auth-secondary"><Link href="/auth">ログイン</Link>するとコメントできます。</p>}</section>;
}
