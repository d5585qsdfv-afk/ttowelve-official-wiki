"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSession } from "@/lib/supabase/auth";
import { getSupabase } from "@/lib/supabase/browser";
import { fetchMyProfile, fetchMySaveData } from "@/lib/supabase/user";
import { saveCloudData } from "@/lib/supabase/wiki";

type Game = { id: string; slug: string; title: string };
type Save = { save_key: string; data: Record<string, unknown>; version: number; updated_at: string };

export default function AccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchMyProfile>> | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [gameId, setGameId] = useState("");
  const [saveKey, setSaveKey] = useState("notes");
  const [saveText, setSaveText] = useState('{\n  "items": []\n}');
  const [saveVersion, setSaveVersion] = useState<number | undefined>();
  const [message, setMessage] = useState("アカウント情報を読み込んでいます…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await getSession();
      if (!active) return;
      setSession(data.session);
      if (!data.session) { setMessage("ログインが必要です。"); return; }
      const [{ data: gameRows, error: gameError }, myProfile] = await Promise.all([
        getSupabase().from("games").select("id,slug,title").eq("is_published", true).order("title"),
        fetchMyProfile(),
      ]);
      if (gameError) throw gameError;
      const nextGames = (gameRows ?? []) as Game[];
      setGames(nextGames); setGameId(nextGames[0]?.id ?? ""); setProfile(myProfile);
      if (nextGames[0]) {
        const saves = await fetchMySaveData(nextGames[0].id);
        if (!saves.error && saves.data?.[0]) {
          const first = saves.data[0] as Save;
          setSaveKey(first.save_key); setSaveText(JSON.stringify(first.data, null, 2)); setSaveVersion(first.version);
        }
      }
      setMessage("自分のアカウント情報のみ表示しています。");
    };
    const timer = window.setTimeout(() => { void load().catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "アカウント情報を取得できません。"); }); }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  async function loadSaves(nextGameId: string) {
    setGameId(nextGameId); setSaveVersion(undefined); setSaveText('{\n  "items": []\n}');
    const result = await fetchMySaveData(nextGameId);
    if (result.error) { setMessage("セーブデータを取得できません。"); return; }
    const first = result.data?.[0] as Save | undefined;
    if (first) { setSaveKey(first.save_key); setSaveText(JSON.stringify(first.data, null, 2)); setSaveVersion(first.version); }
  }

  async function save() {
    if (!gameId) { setMessage("ゲームを選択してください。"); return; }
    let data: Record<string, unknown>;
    try { const parsed: unknown = JSON.parse(saveText); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("JSON_OBJECT_REQUIRED"); data = parsed as Record<string, unknown>; }
    catch { setMessage("セーブデータはJSONオブジェクトで入力してください。"); return; }
    setBusy(true);
    try {
      const result = await saveCloudData(gameId, saveKey.trim(), data, saveVersion);
      if (result.error) { setMessage(result.error.message.includes("CONFLICT") ? "別端末で先に更新されています。再読込してから保存してください。" : result.error.message); return; }
      const saved = result.data as Save;
      setSaveVersion(saved.version); setMessage(`クラウドセーブを保存しました（version ${saved.version}）。`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "クラウドセーブを保存できません。"); }
    finally { setBusy(false); }
  }

  if (!session) return <main id="main-content" className="auth-page"><section className="auth-card"><p className="kicker">ACCOUNT / SIGN IN</p><h1>アカウント</h1><p className="auth-lead" role="status">{message}</p><Link className="badge badge-accent" href="/auth">ログインする</Link></section></main>;
  const displayName = profile?.profile?.display_name || session.user.user_metadata?.display_name || "Player";
  return <main id="main-content" className="admin-page"><header className="page-heading"><div><p className="kicker">ACCOUNT / PRIVATE DATA</p><h1>{displayName} のアカウント</h1><p>{message}</p></div></header><div className="account-grid"><section className="info-panel"><h2 className="section-title">管理者が用意したプロフィール</h2>{profile?.customization?.is_active ? <><p className="account-title">{profile.customization.display_title || "Player profile"}</p><p>{profile.customization.introduction || "紹介文はまだ設定されていません。"}</p>{profile.customization.badge && <span className="badge badge-accent">{profile.customization.badge}</span>}<p className="result-count">Profile key: {profile.customization.profile_key}</p></> : <p className="result-count">プロフィールはまだ用意されていません。</p>}</section><section className="info-panel"><h2 className="section-title">クラウドセーブ</h2><label><span>ゲーム</span><select value={gameId} onChange={(event) => { void loadSaves(event.target.value); }}>{games.map((game) => <option value={game.id} key={game.id}>{game.title}</option>)}</select></label><label><span>保存キー</span><input value={saveKey} onChange={(event) => setSaveKey(event.target.value)} maxLength={100} /></label><label><span>JSONデータ</span><textarea className="wiki-json-editor" value={saveText} onChange={(event) => setSaveText(event.target.value)} rows={12} maxLength={100000} /></label><p className="result-count">現在のversion: {saveVersion ?? "新規"}</p><button className="primary admin-action" type="button" disabled={busy || !games.length} onClick={() => { void save(); }}>クラウドへ保存</button></section></div></main>;
}
