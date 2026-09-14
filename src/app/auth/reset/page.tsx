"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { sendPasswordReset } from "@/lib/supabase/auth";

export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { const { error } = await sendPasswordReset(email); if (error) throw error; setMessage("再設定用メールを送信しました。"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "メールを送信できませんでした。"); }
    finally { setBusy(false); }
  }
  return <main id="main-content" className="auth-page"><section className="auth-card" aria-labelledby="reset-title"><p className="kicker">ACCOUNT / PASSWORD</p><h1 id="reset-title">パスワードを再設定</h1><p className="auth-lead">登録済みのメールアドレスに再設定用リンクを送信します。</p><form onSubmit={submit}><label><span>メールアドレス</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><button className="primary auth-submit" type="submit" disabled={busy}>{busy ? "送信中…" : "再設定メールを送る"}</button></form><p className="form-message" role="status">{message}</p><p className="auth-back"><Link href="/auth">ログインへ戻る</Link></p></section></main>;
}
