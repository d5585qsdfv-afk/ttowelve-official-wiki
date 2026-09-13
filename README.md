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
