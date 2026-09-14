-- Development-only seed. No users, passwords, secrets, production records, or
-- personal information are included. Run after migrations.
insert into public.games (slug, title, description, is_published)
values
  ('juno', '十の救現主', '武器・ジョブ・紋章・敵攻略を横断する公式データベース。', true),
  ('soleil', 'ソレイユの伝承：エナルゴス戦記', '開発中のゲームデータベース。', false),
  ('idlet', 'イドレット～競技性アライアンスゲーム～', '開発中のゲームデータベース。', false)
on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;

insert into public.wiki_pages (game_id, slug, title, summary, content, status)
select id, 'welcome', 'Wikiへようこそ', '開発用の公開サンプルページです。',
  '{"sections":[{"heading":"開発用データ","body":"本番データではありません。"}]}'::jsonb, 'published'
from public.games where slug = 'juno'
on conflict (game_id, slug) do nothing;
