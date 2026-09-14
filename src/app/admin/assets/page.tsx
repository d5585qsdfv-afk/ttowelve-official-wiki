"use client";
/* eslint-disable @next/next/no-img-element -- Supabase Storage returns a runtime public URL. */

import Link from "next/link";
import { useState } from "react";
import { uploadWikiImage } from "@/lib/supabase/storage";

export default function AdminAssetsPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Wiki用画像をアップロードできます。アップロード後のURLを本文JSONへ設定してください。");
  const [url, setUrl] = useState("");

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("image") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) { setMessage("画像ファイルを選択してください。"); return; }
    setBusy(true); setMessage("アップロードしています…"); setUrl("");
    try {
      const result = await uploadWikiImage(file);
      setUrl(result.url); setMessage("アップロードしました。URLをWiki本文の画像URLに設定してください。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "画像をアップロードできませんでした。"); }
    finally { setBusy(false); }
  }

  return <main id="main-content" className="admin-page"><header className="page-heading"><div><p className="kicker">ADMIN / WIKI ASSETS</p><h1>画像アップロード</h1><p>公開Wikiで使う画像をSupabase Storageへ保存します。アップロードはeditor/adminだけが実行できます。</p></div><Link className="header-link" href="/admin/wiki">Wiki編集へ戻る</Link></header><section className="info-panel asset-upload-panel"><h2 className="section-title">Wiki画像</h2><form onSubmit={upload}><label><span>画像ファイル</span><input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" disabled={busy} /></label><p className="result-count">PNG / JPEG / WebP / GIF / SVG、10MB以下</p><button className="primary admin-action" type="submit" disabled={busy}>{busy ? "アップロード中…" : "画像をアップロード"}</button></form><p className="form-message" role="status">{message}</p>{url && <div className="asset-result"><label><span>公開URL</span><input value={url} readOnly onFocus={(event) => event.currentTarget.select()} /></label><button className="secondary admin-action" type="button" onClick={() => { void navigator.clipboard?.writeText(url); setMessage("URLをクリップボードへコピーしました。"); }}>URLをコピー</button><img src={url} alt="アップロードしたWiki画像" /></div>}</section></main>;
}
