# TTwowelve 公式ゲームWiki

Next.js App Router・TypeScript・Tailwind CSSで構築した、複数ゲーム対応のデータ駆動Wikiです。現在は「十の救現主」のみ閲覧機能を実装し、内容はすべてUI確認用の架空データです。

## 開発

- `npm run dev`: 開発サーバー
- `npm run typecheck`: 型チェック
- `npm run lint`: ESLint
- `npm run build`: 静的サイト生成（`out/`）
- `npm run regression`: 生成ページ・内部リンク・主要表示の構造確認

データは `src/data/`、型は `src/types/wiki.ts`、検索ロジックは `src/lib/search.ts` に分離しています。将来DBやCMSへ移行するときは `src/data/index.ts` の取得境界をRepository/API実装へ差し替える想定です。
