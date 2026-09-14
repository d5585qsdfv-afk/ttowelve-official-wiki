# Supabase / Cloudflare Pages backend

このプロジェクトの Next.js 静的 Wiki に接続する、常時稼働サーバーを持たないバックエンド設計です。既存の `src/index.js` Worker 版は別の公開導線として残し、Supabase のデータ境界は Next.js 側から `src/lib/supabase/` 経由で利用します。

## 構成

```text
Browser / Cloudflare Pages (static Next.js)
  ├─ Supabase Auth: session, email/password, Magic Link/OTP, optional OAuth
  ├─ Supabase Data API + RLS: public Wiki and user-owned data
  ├─ Supabase Realtime: wiki_pages, wiki_edit_locks updates
  ├─ Supabase Storage: private wiki-assets, user-avatars, user-private
  └─ Supabase Edge Functions: conflict response, role, moderation, BAN
          └─ PostgreSQL triggers / RPC / audit_logs
```

Cloudflare Pages は静的ファイル配信と GitHub push 起点の build/deploy だけを担当します。DB、Auth、ファイル、権限判定は Pages のクライアントコードに置かず、Supabase 側で行います。

## 再構築

1. Supabase project を作成し、Auth の Email provider を有効にする。
2. Supabase CLI を認証して `supabase link --project-ref <project-ref>` を実行する。
3. `supabase db push` で `supabase/migrations/` を適用する。
4. 開発用データが必要な場合だけ `supabase db reset` または SQL Editor で `supabase/seed.sql` を実行する。
5. Edge Functions の secrets を設定し、`supabase functions deploy wiki-save` などを実行する。
6. 最初の管理者は、ユーザー登録後に、保護された運用手順で `user_roles` の role を admin に設定する。実行例は [`supabase/operations/bootstrap-admin.sql`](../supabase/operations/bootstrap-admin.sql)。Production で直接 SQL を行う場合は、変更理由を別途記録し、その後の変更は `admin-role` を使う。

`user_roles` の直接 INSERT/UPDATE/DELETE policy はありません。Role 変更は admin 検査付き `set_user_role` RPC と `admin-role` Function からのみ行い、Audit Log を同一トランザクションで作成します。

## テーブルと制御

| テーブル | 目的 | 主な制御 |
| --- | --- | --- |
| `profiles` | 表示名・アイコン参照 | 本人または admin のみ |
| `user_roles` | guest〜admin の現在ロール | 本人/admin read、変更は RPC のみ |
| `games` | ゲーム単位の公開状態 | 公開済みは anon read、editor write |
| `wiki_pages` | 現行 Wiki 本文 | published は公開、editor write |
| `wiki_revisions` | 全 Revision | editor/admin read、DB trigger 作成 |
| `wiki_edit_proposals` | contributor の編集案 | 本人作成・本人/ editor read |
| `wiki_edit_locks` | 短時間の編集表示ロック | editor のみ、期限付き |
| `comments` | ページコメント | 公開ページのみ read、本人編集/削除、editor moderation |
| `comment_reports` | コメント通報 | reporter 本人、editor moderation |
| `favorites` | ページお気に入り | user_id = auth.uid() |
| `user_history` | 閲覧履歴 | user_id = auth.uid()、10分重複抑制 RPC |
| `save_data` | ゲーム別 cloud save | user_id = auth.uid()、version 付き |
| `audit_logs` | 重要操作の監査 | admin read、trigger/Function write |

### Role

- `guest`: 公開済みの `games` / `wiki_pages` / 公開ページのコメントを閲覧。
- `user`: guest + 自分のコメント、favorites、history、save_data。
- `contributor`: user + `wiki_edit_proposals` の作成。
- `editor`: Wiki 更新、Revision 閲覧・復元、編集ロック、コメント/通報モデレーション。
- `admin`: editor + Role 変更、BAN、Audit Log 閲覧。

ロール判定は `public.has_role()` を使う DB 側判定です。フロントエンドの表示制御は UX のためだけで、セキュリティ境界ではありません。

## Wiki 更新と競合

`wiki_pages.version` は初期値 1、更新ごとに DB trigger で必ず +1 になります。保存は `update_wiki_page(page_id, expected_version, ...)` または `wiki-save` Function を使います。

```text
A reads v13
B saves expected v13 -> v14
A saves expected v13 -> WIKI_VERSION_CONFLICT (HTTP 409 from wiki-save)
```

競合時は Function が古い本文を保存せず、現在のページを再取得して UI に差分確認を促します。Revision は UPDATE trigger が `previous_data` / `new_data` / `version` / `change_note` とともに保存するため、通常の CRUD 経路からの更新でも欠落しません。復元も新しい Revision を作成する更新として扱います。

## Auth / Session / OAuth

`src/lib/supabase/auth.ts` に Sign Up、Sign In、Sign Out、Password Reset、Session 取得、Auth state listener を用意しています。`supabase.auth` がブラウザの session を保持し、Access Token は Supabase SDK が Function/API リクエストに付与します。

Email + Password に加えて `signInWithMagicLink()`、`signInWithGoogle()` / `signInWithOAuth()` を用意しました。Magic Link/OTPならGoogle Cloud Consoleを使わずにメールアドレスで登録・ログインできます。SupabaseのEmail providerでMagic LinkまたはOTPを有効化し、Site URLとAdditional Redirect URLsにアプリのURLを登録します。Google 等のOAuthを有効化するときは Supabase Dashboard の Auth > Providers にprovider、Client ID、Client Secret、redirect URLを登録します。Provider secret はPagesに設定しません。

Supabaseが提供するメール送信は開発確認用に制限があるため、本番で一般ユーザーへメールを送る場合は、SupabaseのCustom SMTPを設定します。メールリンクは一回限り・有効期限付きで扱い、ログイン試行や送信頻度の制限もDashboardとアプリ側で設定します。

OAuth 初回ログインでも、既存の `on_auth_user_created` trigger が `profiles` と `user_roles(user)` を自動作成します。メールアドレスは `auth.users` に留め、公開用 `profiles` へコピーしません。Google アカウントの表示名は OAuth metadata から自動採用できますが、管理者が後から修正できます。

Google OAuth の callback URL は Supabase の project URL と Cloudflare Pages の本番/Preview URL を環境ごとに登録します。例:

```text
https://<project-ref>.supabase.co/auth/v1/callback
https://<production-pages-domain>/auth/callback
https://<preview-pages-domain>/auth/callback
```

このリポジトリには `src/app/auth/callback/page.tsx` を追加しています。OAuth の `code` を Supabase session に交換した後、Wiki トップへ戻ります。

## アカウント固有プロフィール

一般ユーザーのアカウント基盤は次の2層に分けます。

- `profiles`: 本人が変更できる基本表示情報（表示名、アイコン、bio）と、admin が修正できる公開プロフィール情報。
- `profile_customizations`: admin がアカウントごとに用意する固有プロフィール（`profile_key`、タイトル、紹介文、badge、theme、有効状態）。本人は read だけで、insert/update/delete できません。

管理者は `admin-profile` Edge Function から `upsert_profile_customization()` を呼びます。DB 側でも admin role を再確認し、作成・更新・削除を Audit Log に保存します。管理者が複数人いる場合も、全員が同じ admin Policy を使い、メールアドレスやフロントエンドの hidden field で管理者判定をしません。

`profile_customizations` は現時点では本人または admin のみ read できます。一般ユーザー全員にプロフィールを公開する要件が確定した場合は、メールアドレス等を含まない公開用 view/API を別に追加します。private なアカウント設定と公開プロフィールを同じ read Policy に混ぜない方針です。

## 必要な実装順序

1. Supabase project、Email Auth、Google OAuth、redirect URL を設定。
2. Migration と Seed を適用し、OAuth 初回ログインで profile/role が生成されることを確認。
3. 最初の admin アカウントを安全な one-time bootstrap で作成。
4. `admin-role` と `admin-profile` で管理者を追加し、各アカウントの固有プロフィールを作成。
5. 公開 Wiki の read-only 表示を Supabase `wiki_pages` に切り替える。実装済みの `/wiki?game=<game>&slug=<slug>` は published ページの本文を表示する。
6. editor/admin の Wiki 編集画面 `/admin/wiki` で `wiki-create` / `wiki-save` と Revision/409 を接続する。
7. Realtime 通知、コメント、通報、cloud save を追加。
8. Cloudflare Pages Preview で OAuth、RLS、Storage、管理操作を検証してから Production に接続。

管理者アカウントは最初から複数の固定メールアドレスをコードに埋め込みません。初回 admin を作成した後は、admin が次の管理者を `admin-role` で追加します。admin の追加・変更は Audit Log に残ります。

## Storage

すべて private bucket です。DB に画像バイナリを保存しません。

- `wiki-assets`: 武器、カード、敵、ボス、Wiki画像。editor 以上が操作。閲覧用 signed URL は Function 等のサーバー側処理で発行する。
- `user-avatars`: `user-id/file` のパスだけ本人が操作。現状は private とし、必要に応じて安全な signed URL を使う。
- `user-private`: `user-id/file` のパスだけ本人が操作。cloud save の添付や非公開ファイル用。

ファイル名をユーザー入力の HTML として描画せず、Content-Type、サイズ、拡張子、画像デコード結果を検査してください。アップロードの rate limit と antivirus/image re-encode は本番要件に応じて Edge Function へ追加します。

## Realtime

Migration で `wiki_pages` と `wiki_edit_locks` を `supabase_realtime` publication に追加し、`wiki_pages` は `replica identity full` にしています。クライアント例:

```ts
supabase.channel('wiki-page-updates')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'wiki_pages', filter: `game_id=eq.${gameId}` }, payload => {
    // 現在 version を再取得し、編集中なら conflict notice を出す
  })
  .subscribe();
```

これは更新通知と編集状態表示のための初期実装です。完全な Google Docs 型 CRDT 共同編集は未実装です。

## Edge Functions

- `wiki-save`: Auth token を検証し、RLS 下で保存 RPC を呼び、version conflict を HTTP 409 に変換。
- `wiki-restore`: editor 以上だけが Revision 復元を実行。
- `admin-role`: admin だけが `set_user_role` RPC を呼ぶ。
- `admin-profile`: admin だけがアカウント固有プロフィールを作成・更新する。
- `admin-users`: admin だけが Auth ユーザー一覧と profile/role の管理対象データを取得する。
- `moderate-comment`: editor 以上がコメントを soft-delete/restore。
- `admin-ban`: admin だけが Supabase Auth Admin API を service role で呼び、Audit Log を保存。

`SUPABASE_SERVICE_ROLE_KEY` は `admin-ban` のような Function 内の高権限処理専用です。Pages の環境変数、GitHub、`.env.example` の実値には置きません。Function の `ALLOWED_ORIGIN` を production/preview ごとに設定し、`*` は本番では使わないでください。

## Cloudflare Pages

GitHub 連携で次を設定します。

| 項目 | Production | Preview |
| --- | --- | --- |
| Framework | Next.js (Static Export) | 同じ |
| Build command | `npm run build` | `npm run build` |
| Build output directory | `out` | `out` |
| Node.js | `22` 以上 | `22` 以上 |
| Variables | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview 用 Supabase project の値を推奨 |

Production branch への push で本番 build、Pull Request push で Preview build を作成します。Preview を本番 DB に向けると開発データを破壊し得るため、Preview 用 Supabase project と Auth redirect URL を分けるのが安全です。

Pages に置いてよいのは `NEXT_PUBLIC_SUPABASE_URL`、publishable anon key、認証UIを切り替える非秘密の `NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH` / `NEXT_PUBLIC_ENABLE_MAGIC_LINK` / `NEXT_PUBLIC_ENABLE_EMAIL_RECOVERY` だけです。`SUPABASE_SERVICE_ROLE_KEY`、外部 API secret、管理者用秘密情報はPagesに設定しません。追加費用を避け、メール送信も使わない場合は、3つを `false` にしてEmail + Passwordを使用します。この場合はメール確認とパスワードリセットを使わない設定になり、ユーザーがパスワードを忘れた場合の復旧方法を別途決める必要があります。Magic Link/OTPまたはパスワードリセットを使う場合だけ、対応する変数を `true` にしてSMTPを設定します。`.env.example` は変数名とダミー値のみです。

なお、現在の `src/index.js` Worker 版は別の Sites/Worker 公開導線です。Pages でこの Next.js 版を公開する場合は、Pages project の root と build 設定をこのリポジトリに合わせ、既存 Worker の公開先を同時に置き換えないでください。

## Backup / restore

Supabase の managed backup と Point-in-Time Recovery は project plan で有効化し、Production の plan と保持期間を確認します。最低限、次を保護対象として扱います。

- PostgreSQL: `wiki_pages`, `wiki_revisions`, `games`, `profiles`, `user_roles`, `comments`, `save_data`, `audit_logs`。
- Storage: 3 bucket の object と metadata。DB dump だけでは Storage object は戻りません。
- Auth: ユーザーの削除・BAN・provider 設定は DB dump と別管理。

週次の encrypted logical export を別の保管先に保存し、月次に検証用 project へ restore rehearsal を行います。Export の鍵は Supabase/GitHub/Pages secrets と分離し、Audit Log を含む dump へのアクセスを限定します。復元は Production に上書きせず、まず検証 project で件数、FK、Revision の `version` 連番、Storage object 数、Auth user 数を確認します。

## Security checklist

- [x] 全アプリテーブルで RLS を enable。
- [x] save_data / favorites / history は `auth.uid()` 所有者制約。
- [x] 公開 Wiki/コメントは published page に限定。
- [x] editor/admin 判定は DB policy/RPC と Function の両方で実施。
- [x] Role 変更、BAN、moderation、Wiki update は Audit Log 対象。
- [x] Wiki update は expected version 必須、古い本文を上書きしない。
- [x] Storage は private bucket と path ownership policy。
- [x] service role key はクライアントに渡さない。
- [x] SQL は RPC の typed parameter と PostgREST を使い、文字列 SQL を連結しない。
- [x] コメント本文は保存時に trim/長さ制限。表示時は HTML として解釈しない（Markdown/HTML sanitizer を UI で追加する）。
- [ ] Production の Edge Function rate limit / CAPTCHA / abuse monitoring を有効化。
- [ ] Auth の leaked-password protection、MFA、メール送信制限、ログイン試行監視を Dashboard で設定。
- [ ] Storage の画像再エンコード/マルウェア検査を導入。
- [ ] CSP、Trusted Types、XSS sanitizer、CSRF を含む実ブラウザ監査。

Supabase の anon key は公開前提ですが、RLS の代わりにはなりません。service role でブラウザから API を呼ぶ構成は許可しません。

## Tests

`npm run test:backend` は、Migration に必須テーブル・RLS・Conflict・Realtime・Storage・admin RPC が存在し、env 例に秘密値がないことを高速に確認します。

`supabase/tests/rls.sql` は実際の DB/API 権限を確認する integration test です。service_role では RLS が bypass されるため、user A/B、contributor、editor、admin の検証ユーザーと anon 相当のセッションで実行します。確認項目は save_data IDOR、user/contributor/editor の権限境界、admin の Role変更、guest の draft Wiki 拒否です。Supabase project の接続情報がない環境では、この integration test は実行不能であり、構造テストを RLS 実証済みとは扱いません。

## 実装済みUIと残作業

- `/account`: 本人だけが自分のプロフィール設定とクラウドセーブを確認・保存できる。
- `/wiki?game=<game>&slug=<slug>`: 公開Wikiの閲覧、ログインユーザーのお気に入り、閲覧履歴、コメント投稿・編集・削除・通報を利用できる。
- `/admin`: アカウント固有プロフィール、Role、最近のAudit Logを管理できる。
- Wiki詳細画面は Realtime の更新を検知し、別編集者による更新を通知する。保存時のversion conflictはDB/RPCで拒否する。

## 未実装 / 次の作業

- 初回 admin bootstrap の独立した運用画面（現状は `supabase/operations/bootstrap-admin.sql` によるone-time手順）。
- 一般ユーザー同士へ公開するプロフィール画面。現在の固有プロフィールは本人/adminのみ閲覧可能。
- WikiのJSON入力を置き換えるリッチ編集、Revision差分表示、画像アップロードUI。
- Realtime の差分表示と完全共同編集（CRDT）。
- Edge Function の production rate limit、CAPTCHA、画像検査、通知。
- Supabase project の実際の Auth provider、redirect URL、backup plan、custom domain 設定。
- Preview/Production の2 project を使った実 DB RLS/Auth/Storage/409 統合テスト。
