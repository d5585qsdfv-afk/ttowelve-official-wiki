"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signInWithGoogle, signInWithMagicLink, signUp } from "@/lib/supabase/auth";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH === "true";
  const magicLinkEnabled = process.env.NEXT_PUBLIC_ENABLE_MAGIC_LINK === "true";
  const recoveryEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_RECOVERY === "true";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const result = mode === "sign-in"
        ? await signIn(email, password)
        : await signUp(email, password, displayName);
      if (result.error) throw result.error;
      setMessage(mode === "sign-in" ? "ログインしました。Wikiへ戻ります。" : "登録しました。メール確認が必要な場合があります。");
      if (mode === "sign-in") router.push("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "認証に失敗しました。");
    } finally { setBusy(false); }
  }

  async function google() {
    setBusy(true); setMessage("");
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      setBusy(false); setMessage(error instanceof Error ? error.message : "Google ログインを開始できませんでした。");
    }
  }

  async function magicLink() {
    if (!email.trim()) { setMessage("メールアドレスを入力してください。"); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await signInWithMagicLink(email.trim());
      if (error) throw error;
      setMessage("ログイン用リンクをメールで送信しました。メール内のリンクを開いてください。");
    } catch (error) {
      setBusy(false); setMessage(error instanceof Error ? error.message : "ログイン用リンクを送信できませんでした。");
    } finally { setBusy(false); }
  }

  return <main id="main-content" className="auth-page"><section className="auth-card" aria-labelledby="auth-title">
    <p className="kicker">ACCOUNT / TThrough Auth</p>
    <h1 id="auth-title">{mode === "sign-in" ? "Wikiへログイン" : "アカウントを登録"}</h1>
    <p className="auth-lead">Google アカウント、メールアドレス、またはパスワードなしのメールリンクで登録できます。Wikiの公開情報はログインせずに閲覧できます。</p>
    {googleEnabled && <><button className="oauth-button" type="button" onClick={() => { void google(); }} disabled={busy}>Google で続ける</button><div className="auth-divider"><span>または</span></div></>}
    <form onSubmit={submit}>
      {mode === "sign-up" && <label><span>表示名</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} autoComplete="name" placeholder="Player" /></label>}
      <label><span>メールアドレス</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
      <label><span>パスワード</span><input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} /></label>
      <button className="primary auth-submit" type="submit" disabled={busy}>{busy ? "処理中…" : mode === "sign-in" ? "ログイン" : "登録する"}</button>
    </form>
    {mode === "sign-in" && magicLinkEnabled && <button className="oauth-button auth-magic-link" type="button" onClick={() => { void magicLink(); }} disabled={busy}>パスワードなしでメールリンクを送る</button>}
    {mode === "sign-in" && recoveryEnabled && <p className="auth-secondary"><Link href="/auth/reset">パスワードを忘れた場合</Link></p>}
    <p className="form-message" role="status">{message}</p>
    <button className="auth-mode" type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }}>{mode === "sign-in" ? "新しくアカウントを作る" : "ログイン画面へ戻る"}</button>
    <p className="auth-back"><Link href="/">ゲーム選択へ戻る</Link></p>
  </section></main>;
}
