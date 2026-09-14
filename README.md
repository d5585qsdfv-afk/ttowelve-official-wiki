# TTwowelve 公式ゲームWiki

## 現在の公開サイト（TTowelve Cinema）

SitesとCloudflare Pagesで公開しているのは `src/index.js` を入口にしたWorker版です。`src/page.js`、`src/theme.js`、`src/client.browser.js` が画面を構成し、既存のデータ表示を維持しています。Pagesの `functions/[[path]].js` は同じWorkerを呼び出すため、公開URLでもAuth・管理者編集・SupabaseへのRevision保存を利用できます。

- `npm run build`: 現在の映画館風画面を `out/`、同じ画面のAPI・画像を `dist/server/` に生成します。Pages Functionsもこの生成結果を使います。
- `npm run build:site`: 公開用の `dist/server/` と画像を生成します。
- `npm run dev:site`: 上記で生成した公開用画面をローカルで開きます。再編集後は再生成し、サーバーを再起動してください。
- `npm run test:images`: ユーザーが画像テストを依頼した場合のみ実行します。事前に `build:site` が必要です。

画像の正本は `public/assets/` です。公開環境では `dist/out/` をコピーするだけでは画像URLが配信されないため、ビルド時に画像をWorkerへ同梱します。存在しない画像には404を返します。

敵は「分類・章・出現場所」で絞り込めます。編集画面の専用欄は、既存の本文の `分類｜`、`章｜`、`出現場所｜` と同期して保存するため、データベースの変更は不要です。未指定の分類は「未分類」と表示します。同名でも別IDの敵は保持します。

## 別構成のNext.js Wiki

以下は `src/app/` を使う別構成の説明です。現在のSites公開画面のビルドには使用しません。

Next.js App Router・TypeScript・Tailwind CSSで構築した、複数ゲーム対応のデータ駆動Wikiです。現在は「十の救現主」のみ閲覧機能を実装し、内容はすべてUI確認用の架空データです。

## 開発

- `npm run dev`: 開発サーバー
- `npm run typecheck`: 型チェック
- `npm run lint`: ESLint
- `npm run build:legacy`: 旧Next.js構成の生成（現行の公開には使用しません）
- `npm run regression`: 生成ページ・内部リンク・主要表示の構造確認

データは `src/data/`、型は `src/types/wiki.ts`、検索ロジックは `src/lib/search.ts` に分離しています。将来DBやCMSへ移行するときは `src/data/index.ts` の取得境界をRepository/API実装へ差し替える想定です。

## Supabase / Cloudflare Pages バックエンド

Supabase を PostgreSQL、Auth、Storage、Realtime、Edge Functions の基盤として使う再構築可能なバックエンドを `supabase/` に追加しています。DB変更は `supabase/migrations/`、開発用データは `supabase/seed.sql`、RLS の実 DB テストは `supabase/tests/rls.sql` で管理します。ブラウザ向け Auth/API の入口は `src/lib/supabase/` です。

- 設計・権限・競合制御・Storage・Cloudflare Pages 手順: [`docs/SUPABASE_BACKEND.md`](docs/SUPABASE_BACKEND.md)
- 環境変数名: [`.env.example`](.env.example)
- 構造テスト: `npm run test:backend`

Cloudflare Pagesの現在のGitHub連携設定は、production branchを `main`、build commandを `npm run build`、output directoryを `out` とします。Pages Functionsは同じビルドで生成されたWorkerを、 `functions/[[path]].js` からWorker版を提供します。PagesのProduction環境には `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY`（または同値の `SUPABASE_URL` / `SUPABASE_ANON_KEY`）だけを設定してください。anon/publishable keyはRLSで保護する公開キーですが、`SUPABASE_SERVICE_ROLE_KEY`や外部API secretはPagesへ設定しません。

Worker版の管理者保存は、PagesリクエストのSupabase Bearer tokenをSupabase Authで検証し、`current_role()`で `editor` / `admin` のみ許可します。保存先はSupabaseの `wiki_pages` で、既存の `update_wiki_page()` によりversion競合を409として拒否し、既存のRevision・Audit Logトリガーを通します。D1 BindingがあるSites環境は従来どおりD1を優先し、Pages環境ではSupabaseへ接続します。

Node.js のビルド版本は `.nvmrc` で 22 に固定しています。`public/_headers` は Pages 配信時の基本セキュリティヘッダーと Next.js 静的アセットの長期キャッシュを定義します。CSP はSupabase Authの実ドメインとPages本番ドメインを確認してから追加します。

現行画面の「アカウントとクラウド保存」で、お気に入りの図鑑・タグ・固定項目を `save_data` の `archive.preferences` に手動保存・復元できます。保存先を読み込んでから保存し、別端末との競合は既存RPCのversionで拒否します。図鑑の直接編集はeditor/admin、提案はcontributor/editor/adminに表示します。旧 `/account`・`/wiki` ポータルは公開しません。初回adminのone-time設定は [`supabase/operations/bootstrap-admin.sql`](supabase/operations/bootstrap-admin.sql) を対象UUIDへ置き換えて実行してください。

Google Cloud Consoleを使わず、追加費用も避ける場合は、`NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH=false`、`NEXT_PUBLIC_ENABLE_MAGIC_LINK=false`、`NEXT_PUBLIC_ENABLE_EMAIL_RECOVERY=false`にしてEmail + Passwordを使用します。この無料モードではメール確認とパスワードリセットを使いません。Magic Link/OTPとパスワードリセットを使う場合はメール送信が必要です。小規模な個人用運用なら無料のGmail SMTPをSupabaseへ設定する選択肢もありますが、送信上限・迷惑メール判定・アカウント停止リスクがあるため、大量送信には使いません。
