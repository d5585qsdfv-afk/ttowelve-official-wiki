# TTwowelve 公式ゲームWiki

## 現在の公開サイト（TTowelve Cinema）

Sitesで公開しているのは `src/index.js` を入口にしたWorker版です。`src/page.js`、`src/theme.js`、`src/client.browser.js` が画面を構成し、既存のクラウド編集を維持しています。

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
- `npm run build`: 静的サイト生成（`out/`）
- `npm run regression`: 生成ページ・内部リンク・主要表示の構造確認

データは `src/data/`、型は `src/types/wiki.ts`、検索ロジックは `src/lib/search.ts` に分離しています。将来DBやCMSへ移行するときは `src/data/index.ts` の取得境界をRepository/API実装へ差し替える想定です。

## Supabase / Cloudflare Pages バックエンド

Supabase を PostgreSQL、Auth、Storage、Realtime、Edge Functions の基盤として使う再構築可能なバックエンドを `supabase/` に追加しています。DB変更は `supabase/migrations/`、開発用データは `supabase/seed.sql`、RLS の実 DB テストは `supabase/tests/rls.sql` で管理します。ブラウザ向け Auth/API の入口は `src/lib/supabase/` です。

- 設計・権限・競合制御・Storage・Cloudflare Pages 手順: [`docs/SUPABASE_BACKEND.md`](docs/SUPABASE_BACKEND.md)
- 環境変数名: [`.env.example`](.env.example)
- 構造テスト: `npm run test:backend`

Cloudflare Pages で Next.js 版を公開する場合は build command を `npm run build`、output directory を `out` にします。Pages/GitHub には `NEXT_PUBLIC_SUPABASE_URL` と publishable anon key のみを設定し、service role key は Supabase Edge Functions の secrets に限定してください。現在の Worker 版 (`src/index.js`) の公開導線は別に残しています。

Node.js のビルド版本は `.nvmrc` で 22 に固定しています。`public/_headers` は Pages 配信時の基本セキュリティヘッダーと Next.js 静的アセットの長期キャッシュを定義します。CSP はSupabase Authの実ドメインとPages本番ドメインを確認してから追加します。

ログイン後は `/account` で管理者が設定した本人用プロフィールとクラウドセーブを確認できます。公開Wiki詳細 (`/wiki?game=<game>&slug=<slug>`) では、ログインユーザーのお気に入り、閲覧履歴、コメント投稿・編集・削除・通報を利用できます。初回adminのone-time設定は [`supabase/operations/bootstrap-admin.sql`](supabase/operations/bootstrap-admin.sql) を対象UUIDへ置き換えて実行してください。

Google Cloud Consoleを使わず、追加費用も避ける場合は、`NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH=false`、`NEXT_PUBLIC_ENABLE_MAGIC_LINK=false`、`NEXT_PUBLIC_ENABLE_EMAIL_RECOVERY=false`にしてEmail + Passwordを使用します。この無料モードではメール確認とパスワードリセットを使いません。Magic Link/OTPとパスワードリセットを使う場合はメール送信が必要です。小規模な個人用運用なら無料のGmail SMTPをSupabaseへ設定する選択肢もありますが、送信上限・迷惑メール判定・アカウント停止リスクがあるため、大量送信には使いません。
